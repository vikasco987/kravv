import { useAuth, useUser } from '@clerk/clerk-expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View,
    RefreshControl,
    Modal
} from 'react-native';
import { useRefresh } from '../../context/RefreshContext';

type HeldOrder = {
    id: string;
    items: any[];
    total: number;
    timestamp: string;
};

export default function HoldScreen() {
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
    const { isLoaded, isSignedIn } = useUser();
    const { refreshSignal, triggerRefresh } = useRefresh();
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchHeldOrders();
        }
    }, [refreshSignal]);

    const fetchHeldOrders = async () => {
        if (!isLoaded || !isSignedIn) {
            setHeldOrders([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const token = await getToken();

            // 1. Get List of Locally Hidden/Deleted IDs (to solve deletion issue)
            const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
            const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];

            // 2. Clear Old Local Storage once to fix "Phantom Items"
            const version = await AsyncStorage.getItem('@hold_v3_sync');
            if (version !== 'fixed') {
                await AsyncStorage.removeItem('@held_orders');
                await AsyncStorage.setItem('@hold_v3_sync', 'fixed');
            }

            let combinedOrders: HeldOrder[] = [];

            // 3. Fetch from Backend
            if (token) {
                try {
                    const response = await fetch("https://billing.kravy.in/api/bill-manager?isHeld=true", {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const bills = data.bills || [];

                        const backendHeld = bills
                            .filter((b: any) =>
                                !hiddenIds.includes(b.billNumber) &&
                                !hiddenIds.includes(b._id) &&
                                !hiddenIds.includes(b.id)
                            )
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
                } catch (err) {
                    console.error("Backend fetch error:", err);
                }
            }

            // 4. Merge with Local (Uniquely)
            const localData = await AsyncStorage.getItem('@held_orders');
            if (localData) {
                const localOrders = JSON.parse(localData);
                localOrders.forEach((lo: HeldOrder) => {
                    const exists = combinedOrders.find(co => co.id === lo.id);
                    const isHidden = hiddenIds.includes(lo.id);
                    if (!exists && !isHidden) {
                        combinedOrders.push(lo);
                    }
                });
            }

            setHeldOrders(combinedOrders.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ));

        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHeldOrders();
        }, [])
    );

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
            const token = await getToken();
            await fetch(`https://billing.kravy.in/api/bill-manager/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Network Delete Error:", e);
        }

        setTimeout(() => {
            setIsDeleteModalVisible(false);
            setShowSuccess(false);
            setOrderToDelete(null);
        }, 2000);
    };

    const confirmResumeOrder = async () => {
        if (!orderToResume) return;
        const order = orderToResume;

        try {
            // 1. Prepare items for cart
            const cleanItems = order.items.map(i => ({
                id: i.id,
                name: i.name,
                quantity: i.quantity,
                price: i.price
            }));

            await AsyncStorage.setItem('@resume_cart', JSON.stringify(cleanItems));
            await AsyncStorage.setItem('@resume_cart_id', order.id);

            // 2. State & Local update
            setHeldOrders(prev => prev.filter(o => o.id !== order.id));
            await hideOrderLocally(order.id);

            setSuccessType('resume');
            setShowSuccess(true);

            // 3. Status update is handled by SimpleBill (PUT isHeld: false)
            // No need to DELETE here to avoid PUT conflict later

            setTimeout(() => {
                setIsResumeModalVisible(false);
                setShowSuccess(false);
                setOrderToResume(null);
                router.replace("/(tabs)/menu");
            }, 2000);

        } catch (error) {
            ToastAndroid.show("Failed to resume order", ToastAndroid.SHORT);
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === heldOrders.length && heldOrders.length > 0) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(heldOrders.map(o => o.id));
        }
    };

    const confirmBulkDelete = async () => {
        if (selectedOrders.length === 0) return;
        setIsBulkDeleteModalVisible(true);
    };

    const executeBulkDelete = async () => {
        const idsToDelete = [...selectedOrders];
        const count = idsToDelete.length;
        
        try {
            const token = await getToken();
            
            // Show success in modal first
            setSuccessType('delete');
            setShowSuccess(true);

            for (const id of idsToDelete) {
                // local update
                setHeldOrders(prev => prev.filter(o => o.id !== id));
                await hideOrderLocally(id);

                // backend delete
                try {
                    await fetch(`https://billing.kravy.in/api/bill-manager/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error(`Bulk Delete Error for ${id}:`, e);
                }
            }

            setTimeout(() => {
                setIsBulkDeleteModalVisible(false);
                setShowSuccess(false);
                setSelectedOrders([]);
                fetchHeldOrders();
                ToastAndroid.show(`${count} orders deleted`, ToastAndroid.SHORT);
            }, 2000);

        } catch (error) {
            console.error("Bulk process error:", error);
            ToastAndroid.show("Error during bulk delete", ToastAndroid.SHORT);
            setIsBulkDeleteModalVisible(false);
            setShowSuccess(false);
        }
    };

    const deleteHoldOrder = (id: string, orderData: HeldOrder) => {
        setOrderToDelete(orderData);
        setIsDeleteModalVisible(true);
    };

    const resumeOrder = (order: HeldOrder) => {
        setOrderToResume(order);
        setIsResumeModalVisible(true);
    };

    const renderItem = ({ item }: { item: HeldOrder }) => {
        const isSelected = selectedOrders.includes(item.id);
        return (
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => toggleSelectOrder(item.id)}
                style={[styles.orderCard, isSelected && styles.selectedCard]}
            >
                <View style={styles.selectionRow}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={styles.orderId}>Order #{item.id.toString().slice(-4)}</Text>
                                <Text style={styles.orderTime}>
                                    {new Date(item.timestamp).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalText}>₹{item.total}</Text>
                            </View>
                        </View>

                        <View style={styles.itemsList}>
                            {item.items.map((i, idx) => (
                                <Text key={idx} style={styles.itemText}>
                                    • {i.name} (x{i.quantity})
                                </Text>
                            ))}
                        </View>

                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => deleteHoldOrder(item.id, item)}
                            >
                                <Feather name="trash-2" size={16} color="#DC2626" />
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.resumeBtn]}
                                onPress={() => resumeOrder(item)}
                            >
                                <Feather name="play" size={16} color="#FFF" />
                                <Text style={styles.resumeBtnText}>Resume</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Hold Orders</Text>
                    <Text style={styles.headerSubtitle}>{heldOrders.length} orders saved</Text>
                </View>

                {heldOrders.length > 0 && (
                    <TouchableOpacity onPress={toggleSelectAll} style={styles.headerActionIcon}>
                        <Ionicons 
                            name={selectedOrders.length === heldOrders.length ? "checkbox" : "square-outline"} 
                            size={24} 
                            color="#4F46E5" 
                        />
                    </TouchableOpacity>
                )}

                {selectedOrders.length > 0 && (
                    <TouchableOpacity onPress={confirmBulkDelete} style={styles.headerActionIcon}>
                        <Ionicons name="trash" size={24} color="#EF4444" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={triggerRefresh} style={styles.reloadButton}>
                    <Ionicons name="refresh" size={24} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={heldOrders}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={triggerRefresh} colors={["#4F46E5"]} />
                    }
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Feather name="pause-circle" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No hold orders</Text>
                        </View>
                    }
                />
            )}
            {/* Custom Delete Modal */}
            <Modal
                transparent={true}
                visible={isDeleteModalVisible}
                animationType="slide"
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        {showSuccess && successType === 'delete' ? (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={styles.successCircle}>
                                    <Ionicons name="checkmark-sharp" size={40} color="#10B981" />
                                </View>
                                <Text style={[styles.modalTitle, { color: '#10B981' }]}>Deleted Successfully!</Text>
                                <Text style={styles.modalSubtext}>Order has been removed from the list.</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.trashCircle}>
                                    <Ionicons name="trash-outline" size={32} color="#EF4444" />
                                </View>

                                <Text style={styles.modalTitle}>Delete Order?</Text>
                                <Text style={styles.modalSubtext}>
                                    This order will be permanently deleted. This action cannot be undone.
                                </Text>

                                {orderToDelete && (
                                    <View style={styles.orderDetailsBox}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.orderIdText}>Order #{orderToDelete.id.toString().slice(-4)}</Text>
                                            <Text style={styles.orderSummaryText} numberOfLines={1}>
                                                {orderToDelete.items.length} item • {orderToDelete.items.map(i => i.name).join(', ')}
                                            </Text>
                                        </View>
                                        <Text style={styles.orderTotalText}>₹{orderToDelete.total}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.confirmDeleteBtn}
                                    onPress={confirmDeleteOrder}
                                >
                                    <Ionicons name="trash" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.confirmDeleteText}>Yes, Delete Order</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setIsDeleteModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Custom Resume Modal */}
            <Modal
                transparent={true}
                visible={isResumeModalVisible}
                animationType="slide"
                onRequestClose={() => setIsResumeModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsResumeModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        {showSuccess && successType === 'resume' ? (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={styles.successCircle}>
                                    <Ionicons name="checkmark-sharp" size={40} color="#10B981" />
                                </View>
                                <Text style={[styles.modalTitle, { color: '#059669' }]}>Order Resumed!</Text>
                                <Text style={styles.modalSubtext}>Loading into active cart...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.resumeCircle}>
                                    <Ionicons name="play" size={32} color="#4F46E5" />
                                </View>

                                <Text style={styles.modalTitle}>Resume Order?</Text>
                                <Text style={styles.modalSubtext}>
                                    This order will be loaded back into your active cart.
                                </Text>

                                {orderToResume && (
                                    <>
                                        <View style={styles.resumeInfoBox}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.orderIdText, { color: '#065F46' }]}>Order #{orderToResume.id.toString().slice(-4)}</Text>
                                                <Text style={{ color: '#059669', fontSize: 14, marginTop: 4 }}>
                                                    ✓ {orderToResume.items.length} item ready to resume
                                                </Text>
                                            </View>
                                            <Text style={[styles.orderTotalText, { color: '#059669' }]}>₹{orderToResume.total}</Text>
                                        </View>

                                        <View style={styles.warningBox}>
                                            <Ionicons name="flash" size={20} color="#B45309" style={{ marginRight: 10 }} />
                                            <Text style={styles.warningText}>
                                                Active cart items will be replaced. Only this order will be loaded.
                                            </Text>
                                        </View>
                                    </>
                                )}

                                <TouchableOpacity
                                    style={styles.confirmResumeBtn}
                                    onPress={confirmResumeOrder}
                                >
                                    <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.confirmDeleteText}>Yes, Resume Order</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setIsResumeModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Custom Bulk Delete Modal */}
            <Modal
                transparent={true}
                visible={isBulkDeleteModalVisible}
                animationType="slide"
                onRequestClose={() => setIsBulkDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsBulkDeleteModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        {showSuccess && successType === 'delete' ? (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View style={styles.successCircle}>
                                    <Ionicons name="checkmark-sharp" size={40} color="#10B981" />
                                </View>
                                <Text style={[styles.modalTitle, { color: '#10B981' }]}>Deleted Successfully!</Text>
                                <Text style={styles.modalSubtext}>{selectedOrders.length} orders have been removed.</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.trashCircle}>
                                    <Ionicons name="trash-outline" size={32} color="#EF4444" />
                                </View>

                                <Text style={styles.modalTitle}>Delete {selectedOrders.length} Orders?</Text>
                                <Text style={styles.modalSubtext}>
                                    All selected orders will be permanently deleted. This action cannot be undone.
                                </Text>

                                <View style={styles.bulkDetailsBox}>
                                    <Ionicons name="layers-outline" size={24} color="#EF4444" style={{ marginRight: 15 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bulkCountText}>{selectedOrders.length} Orders Selected</Text>
                                        <Text style={styles.bulkTotalText}>
                                            Total: ₹{heldOrders.filter(o => selectedOrders.includes(o.id)).reduce((sum, o) => sum + o.total, 0)}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.confirmDeleteBtn}
                                    onPress={executeBulkDelete}
                                >
                                    <Ionicons name="trash" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.confirmDeleteText}>Yes, Delete All Selected</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setIsBulkDeleteModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', elevation: 2, marginTop: 25 },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    reloadButton: {
        padding: 8,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 12, color: '#6B7280' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    orderCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10, marginBottom: 10 },
    orderId: { fontWeight: 'bold', fontSize: 16 },
    orderTime: { fontSize: 11, color: '#9CA3AF' },
    totalBadge: { backgroundColor: '#EEF2FF', padding: 4, borderRadius: 6 },
    totalText: { color: '#4F46E5', fontWeight: 'bold' },
    itemsList: { marginBottom: 15 },
    itemText: { fontSize: 14, color: '#374151' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 6 },
    deleteBtn: { backgroundColor: '#FEF2F2' },
    deleteBtnText: { color: '#DC2626', marginLeft: 5, fontWeight: '600' },
    resumeBtn: { backgroundColor: '#4F46E5' },
    resumeBtnText: { color: '#FFF', marginLeft: 5, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#9CA3AF', marginTop: 10 },
    selectionRow: { flexDirection: 'row', alignItems: 'flex-start' },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    selectedCard: {
        borderColor: '#4F46E5',
        backgroundColor: '#F5F7FF',
        borderWidth: 1.5
    },
    headerActionIcon: {
        padding: 8,
        marginLeft: 5
    },


    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 20,
    },
    trashCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    successCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    resumeCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    modalSubtext: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    orderDetailsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        padding: 16,
        width: '100%',
        marginBottom: 24,
    },
    resumeInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#10B981',
        borderRadius: 20,
        padding: 16,
        width: '100%',
        marginBottom: 16,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 15,
        padding: 12,
        width: '100%',
        marginBottom: 24,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#B45309',
        fontWeight: '500',
    },
    orderIdText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    orderSummaryText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    orderTotalText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    confirmDeleteBtn: {
        width: '100%',
        backgroundColor: '#EF4444',
        paddingVertical: 18,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    confirmResumeBtn: {
        width: '100%',
        backgroundColor: '#047857',
        paddingVertical: 18,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 8,
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    confirmDeleteText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelBtn: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#4B5563',
        fontSize: 18,
        fontWeight: '600',
    },
    bulkDetailsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        marginBottom: 24,
    },
    bulkCountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#991B1B',
    },
    bulkTotalText: {
        fontSize: 14,
        color: '#B91C1C',
        marginTop: 2,
    },
});
