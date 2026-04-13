import { useAuth, useUser } from '@clerk/clerk-expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useRefresh } from '../../context/RefreshContext';
import { rf, s, vs } from '../../utils/responsive';
import { StaffPermissionEngine } from '../staff creat/StaffPermissionEngine';

type HeldOrder = {
    id: string;
    items: any[];
    total: number;
    timestamp: string;
};

interface HeldOrdersViewProps {
    onBack?: () => void;
}

export default function HeldOrdersView({ onBack }: HeldOrdersViewProps) {
    const router = useRouter();
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<HeldOrder | null>(null);
    const [isResumeModalVisible, setIsResumeModalVisible] = useState(false);
    const [orderToResume, setOrderToResume] = useState<HeldOrder | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successType, setSuccessType] = useState<'delete' | 'resume'>('delete');
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();
    const { refreshSignal, triggerRefresh } = useRefresh();
    const { t } = useLanguage();
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);

    const handleBack = () => {
        if (onBack) onBack();
        else router.back();
    };

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchHeldOrders();
        }
    }, [refreshSignal]);

    const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);

    useEffect(() => {
        const checkStaff = async () => {
            const session = await AsyncStorage.getItem('staff_session');
            setIsStaffSignedIn(!!session);
        };
        checkStaff();
    }, []);

    const fetchHeldOrders = async () => {
        if (!isLoaded) return;
        
        try {
            setLoading(true);
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const isStaff = !!sessionStr;

            if (!isSignedIn && !isStaff) {
                setHeldOrders([]);
                setLoading(false);
                return;
            }
            const authToken = await getToken();
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = authToken || staffSession?.token;

            const bId = await StaffPermissionEngine.getActiveBusinessId(isSignedIn ? user?.id : undefined);
            const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
            const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];

            let combinedOrders: HeldOrder[] = [];

            if (finalToken || bId) {
                try {
                    const url = bId ? `https://billing.kravy.in/api/bill-manager?isHeld=true&businessId=${bId}` : "https://billing.kravy.in/api/bill-manager?isHeld=true";
                    const response = await fetch(url, {
                        headers: finalToken ? { Authorization: `Bearer ${finalToken}` } : {}
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const bills = data.bills || [];
                        const backendHeld = bills
                            .filter((b: any) => !hiddenIds.includes(b.billNumber) && !hiddenIds.includes(b._id) && !hiddenIds.includes(b.id))
                            .map((b: any) => ({
                                id: b._id || b.id || b.billNumber,
                                items: (b.items || []).map((i: any) => ({
                                    ...i,
                                    id: i.productId || i.id || i._id || Math.random().toString(),
                                    quantity: i.quantity || i.qty || 0,
                                    price: i.price || i.rate || 0
                                })),
                                total: b.total || 0,
                                timestamp: b.createdAt || new Date().toISOString()
                            }));
                        combinedOrders = [...backendHeld];
                    }
                } catch (err) { console.error("Backend fetch error:", err); }
            }

            const localData = await AsyncStorage.getItem('@held_orders');
            if (localData) {
                const localOrders = JSON.parse(localData);
                localOrders.forEach((lo: HeldOrder) => {
                    const exists = combinedOrders.find(co => co.id === lo.id);
                    if (!exists && !hiddenIds.includes(lo.id)) {
                        combinedOrders.push(lo);
                    }
                });
            }

            setHeldOrders(combinedOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (error) { console.error("Fetch Error:", error); }
        finally { setLoading(false); }
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleteModalVisible(true);
    };

    const confirmBulkDelete = async () => {
        const idsToDelete = [...selectedOrders];
        setHeldOrders(prev => prev.filter(o => !idsToDelete.includes(o.id)));
        setSelectedOrders([]);
        setIsBulkDeleteModalVisible(false);

        const authToken = await getToken();
        const sessionStr = await AsyncStorage.getItem('staff_session');
        const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
        const finalToken = authToken || staffSession?.token;

        for (const id of idsToDelete) {
            await hideOrderLocally(id);
            if (finalToken) {
                fetch(`https://billing.kravy.in/api/bill-manager/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${finalToken}` }
                }).catch(() => { });
            }
        }
        ToastAndroid.show(`${idsToDelete.length} orders deleted`, ToastAndroid.SHORT);
    };

    useFocusEffect(useCallback(() => { fetchHeldOrders(); }, []));

    const hideOrderLocally = async (id: string) => {
        const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
        const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];
        if (!hiddenIds.includes(id)) {
            hiddenIds.push(id);
            await AsyncStorage.setItem('@hidden_bill_ids', JSON.stringify(hiddenIds));
        }
    };

    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return;
        const id = orderToDelete.id;
        setHeldOrders(prev => prev.filter(o => o.id !== id));
        setSuccessType('delete');
        setShowSuccess(true);
        await hideOrderLocally(id);
        try {
            const authToken = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = authToken || staffSession?.token;

            await fetch(`https://billing.kravy.in/api/bill-manager/${id}`, {
                method: "DELETE",
                headers: finalToken ? { Authorization: `Bearer ${finalToken}` } : {}
            });
        } catch (e) { }
        setTimeout(() => { setIsDeleteModalVisible(false); setShowSuccess(false); setOrderToDelete(null); }, 2000);
    };

    const confirmResumeOrder = async () => {
        if (!orderToResume) return;
        try {
            const cleanItems = orderToResume.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price }));
            await AsyncStorage.setItem('@resume_cart', JSON.stringify(cleanItems));
            await AsyncStorage.setItem('@resume_cart_id', orderToResume.id);
            setHeldOrders(prev => prev.filter(o => o.id !== orderToResume.id));
            await hideOrderLocally(orderToResume.id);
            setSuccessType('resume');
            setShowSuccess(true);
            setTimeout(() => { setIsResumeModalVisible(false); setShowSuccess(false); setOrderToResume(null); handleBack(); }, 2000);
        } catch (error) { ToastAndroid.show("Failed to resume order", ToastAndroid.SHORT); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={rf(24)} color="#1F2937" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{t('hold_orders')}</Text>
                    <Text style={styles.headerSubtitle}>{heldOrders.length} {t('orders_saved')}</Text>
                </View>

                {heldOrders.length > 0 && (
                    <TouchableOpacity
                        style={styles.selectAllBtn}
                        onPress={() => {
                            if (selectedOrders.length === heldOrders.length) setSelectedOrders([]);
                            else setSelectedOrders(heldOrders.map(o => o.id));
                        }}
                    >
                        <Ionicons
                            name={selectedOrders.length === heldOrders.length ? "checkbox" : "square-outline"}
                            size={rf(22)}
                            color="#4F46E5"
                        />
                        <Text style={styles.selectAllText}>All</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={triggerRefresh} style={styles.reloadButton}>
                    <Ionicons name="refresh" size={rf(24)} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
            ) : (
                <FlatList
                    data={heldOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isSelected = selectedOrders.includes(item.id);
                        return (
                            <TouchableOpacity
                                style={[styles.orderCard, isSelected && styles.orderCardSelected]}
                                onPress={() => {
                                    if (selectedOrders.includes(item.id)) setSelectedOrders(selectedOrders.filter(id => id !== item.id));
                                    else setSelectedOrders([...selectedOrders, item.id]);
                                }}
                                activeOpacity={0.9}
                            >
                                <View style={styles.selectionCircle}>
                                    <Ionicons
                                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                        size={rf(24)}
                                        color={isSelected ? "#4F46E5" : "#D1D5DB"}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={styles.orderId}>Order #{item.id.toString().slice(-4)}</Text>
                                            <Text style={styles.orderTime}>{new Date(item.timestamp).toLocaleString()}</Text>
                                        </View>
                                        <View style={styles.totalBadge}><Text style={styles.totalText}>₹{item.total}</Text></View>
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.deleteBtn]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setOrderToDelete(item);
                                                setIsDeleteModalVisible(true);
                                            }}
                                        >
                                            <Feather name="trash-2" size={rf(16)} color="#DC2626" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.resumeBtn]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setOrderToResume(item);
                                                setIsResumeModalVisible(true);
                                            }}
                                        >
                                            <Feather name="play" size={rf(16)} color="#FFF" />
                                            <Text style={styles.resumeBtnText}>{t('resume')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<View style={styles.emptyContainer}><Text>{t('no_hold_orders')}</Text></View>}
                    refreshControl={<RefreshControl refreshing={false} onRefresh={triggerRefresh} />}
                />
            )}

            <Modal transparent visible={isDeleteModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('delete_order_confirm')}</Text>
                        <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDeleteOrder}>
                            <Text style={styles.confirmButtonText}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsDeleteModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={isResumeModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('resume_order_confirm')}</Text>
                        <TouchableOpacity style={styles.confirmResumeBtn} onPress={confirmResumeOrder}>
                            <Text style={styles.confirmButtonText}>Resume</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsResumeModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={isBulkDeleteModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.holdCircleRed}>
                            <Ionicons name="trash-outline" size={rf(40)} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Delete {selectedOrders.length} Orders?</Text>
                        <Text style={styles.modalSubtext}>
                            Are you sure you want to permanently delete these {selectedOrders.length} orders?
                            This action cannot be undone.
                        </Text>

                        <TouchableOpacity style={styles.confirmBulkDeleteBtn} onPress={confirmBulkDelete}>
                            <Text style={styles.confirmButtonText}>Yes, Delete All</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsBulkDeleteModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {selectedOrders.length > 0 && (
                <TouchableOpacity style={styles.bulkDeleteFloatingBtn} onPress={handleBulkDelete}>
                    <Ionicons name="trash" size={rf(24)} color="#FFF" />
                    <Text style={styles.bulkDeleteText}>Delete Selected ({selectedOrders.length})</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: s(16), backgroundColor: '#FFF', elevation: 2, marginTop: vs(5) },
    backButton: { marginRight: s(15) },
    headerTitle: { fontSize: rf(20), fontWeight: 'bold' },
    headerSubtitle: { fontSize: rf(12), color: '#6B7280' },
    reloadButton: { padding: s(8) },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: s(16) },
    orderCard: { backgroundColor: '#FFF', borderRadius: s(12), padding: s(16), marginBottom: vs(16), elevation: 2 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: vs(10), marginBottom: vs(10) },
    orderId: { fontWeight: 'bold' },
    orderTime: { fontSize: rf(11), color: '#9CA3AF' },
    totalBadge: { backgroundColor: '#EEF2FF', padding: s(4), borderRadius: s(6) },
    totalText: { color: '#4F46E5', fontWeight: 'bold' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: s(10) },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: s(8), borderRadius: s(6) },
    deleteBtn: { backgroundColor: '#FEF2F2' },
    resumeBtn: { backgroundColor: '#4F46E5' },
    resumeBtnText: { color: '#FFF', marginLeft: s(5), fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: vs(100) },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: s(32),
        borderTopRightRadius: s(32),
        padding: s(24),
        alignItems: 'center',
        paddingBottom: vs(45),
    },
    modalTitle: { fontSize: rf(24), fontWeight: 'bold', marginBottom: vs(12) },
    confirmDeleteBtn: { width: '100%', backgroundColor: '#EF4444', paddingVertical: vs(18), borderRadius: s(20), alignItems: 'center' },
    confirmResumeBtn: { width: '100%', backgroundColor: '#047857', paddingVertical: vs(18), borderRadius: s(20), alignItems: 'center' },
    confirmButtonText: { color: '#FFF', fontWeight: 'bold' },
    cancelBtn: { paddingVertical: vs(15) },
    cancelBtnText: { color: '#9CA3AF' },
    selectAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: s(10), paddingVertical: vs(5), borderRadius: s(20), marginRight: s(10) },
    selectAllText: { marginLeft: s(5), fontWeight: 'bold', color: '#4F46E5', fontSize: rf(14) },
    orderCardSelected: { borderColor: '#4F46E5', borderWidth: 1, backgroundColor: '#F5F7FF' },
    selectionCircle: { marginRight: s(12), justifyContent: 'center' },
    bulkDeleteFloatingBtn: { position: 'absolute', bottom: vs(30), left: s(20), right: s(20), backgroundColor: '#EF4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: vs(15), borderRadius: s(30), elevation: 5 },
    bulkDeleteText: { color: '#FFF', fontWeight: 'bold', marginLeft: s(10), fontSize: rf(16) },
    modalHandle: { width: s(40), height: vs(5), backgroundColor: '#E5E7EB', borderRadius: s(3), marginBottom: vs(20), alignSelf: 'center' },
    holdCircleRed: { width: s(80), height: s(80), borderRadius: s(40), backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: vs(20), borderWidth: 2, borderColor: '#EF4444' },
    modalSubtext: { fontSize: rf(16), color: '#6B7280', textAlign: 'center', marginBottom: vs(24), lineHeight: rf(22), paddingHorizontal: s(10) },
    confirmBulkDeleteBtn: { width: '100%', backgroundColor: '#EF4444', paddingVertical: vs(18), borderRadius: s(20), alignItems: 'center', marginBottom: vs(10), elevation: 4 },
});
