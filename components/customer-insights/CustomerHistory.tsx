import React, { useMemo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';
import { useRouter } from 'expo-router';

interface CustomerHistoryProps {
    visible: boolean;
    onClose: () => void;
    party: any;
    bills: any[];
}

const CustomerHistory = ({ visible, onClose, party, bills }: CustomerHistoryProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItemNames, setSelectedItemNames] = useState<string[]>([]);
    const router = useRouter();

    const insights = useMemo(() => {
        // --- ADVANCED FUZZY MATCHING ENGINE ---
        const query = searchQuery.trim().toLowerCase();
        if (!query && !party) return null;

        // Clean customer identity (from party list)
        const targetPhone = (party?.phone || "").replace(/\D/g, '');
        const cleanTargetPhone = targetPhone.length > 10 ? targetPhone.slice(-10) : targetPhone;
        const targetName = (party?.name || "").toLowerCase().trim();

        const pId = (party as any)?.id || (party as any)?._id;

        const customerBills = (bills || []).filter(bill => {
            // Clean bill record data
            const bPhoneRaw = (bill.customerPhone || bill.phone || "").replace(/\D/g, '');
            const cleanBillPhone = bPhoneRaw.length > 10 ? bPhoneRaw.slice(-10) : bPhoneRaw;
            const bName = (bill.customerName || bill.name || "").toLowerCase().trim();

            // Case 1: Searching for a specific party prop (from Clients tab)
            if (party) {
                // 1. Matched by ID (Highest Accuracy)
                if (pId && (bill.partyId === pId || bill.customerId === pId || bill.party === pId)) return true;

                // 2. Suffix match for phone (handles +91 vs no +91)
                if (cleanTargetPhone && cleanBillPhone && cleanTargetPhone === cleanBillPhone) return true;
                
                // 3. Inclusion match for name
                if (targetName && bName && (bName.includes(targetName) || targetName.includes(bName))) return true;
                return false;
            }

            // Case 2: Manual search by Query (from Sidebar)
            if (query) {
                const cleanQuery = query.replace(/\D/g, '');
                const cleanSuffixQuery = cleanQuery.length > 10 ? cleanQuery.slice(-10) : cleanQuery;
                
                // If it's a numeric search (Phone)
                if (cleanQuery) {
                    // Normalize both sides to find the best match (handles +91 vs no +91)
                    if (cleanBillPhone && cleanBillPhone.includes(cleanSuffixQuery)) return true;
                }
                
                // Name match (Inclusion)
                if (bName.includes(query)) return true;
            }

            return false;
        });

        if (customerBills.length === 0) return null;

        // --- STATS CALCULATION ---
        const itemMap: Record<string, { count: number; name: string }> = {};
        let totalSpend = 0;

        customerBills.forEach(bill => {
            totalSpend += (bill.total || 0);
            (bill.items || []).forEach((item: any) => {
                const name = item.name || 'Unknown Item';
                const qty = Number(item.qty || item.quantity || 0);
                if (!itemMap[name]) {
                    itemMap[name] = { count: 0, name };
                }
                itemMap[name].count += qty;
            });
        });

        const sortedItems = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);
        const sortedByDate = [...customerBills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestBill = sortedByDate[0];
        
        const displayName = party?.name || latestBill?.customerName || latestBill?.name || "Customer";

        return {
            name: displayName,
            visitCount: customerBills.length,
            totalSpend,
            favoriteItems: sortedItems,
            lastVisit: latestBill?.createdAt
        };
    }, [party, bills, searchQuery]);

    const findItemData = (name: string) => {
        let bestMatch: any = null;
        for (const bill of bills) {
            const match = (bill.items || []).find((it: any) => it.name === name);
            if (match) {
                bestMatch = {
                    id: String(match.itemId || match.id || match._id),
                    name: String(match.name),
                    price: Number(match.rate || match.price || 0),
                    unit: match.unit || "Unit",
                    gst: match.gst,
                    taxType: match.taxStatus || match.taxType
                };
                break;
            }
        }
        return bestMatch;
    };

    const handleBatchAction = (itemsNamesToBatch: string[]) => {
        const itemsToBatch: any[] = [];
        itemsNamesToBatch.forEach(name => {
            const data = findItemData(name);
            if (data) itemsToBatch.push(data);
        });

        if (itemsToBatch.length > 0) {
            DeviceEventEmitter.emit('add_to_cart_remote', itemsToBatch);
            setSelectedItemNames([]);
            setSearchQuery("");
            onClose();
            router.push("/(tabs)/menu");
        }
    };

    const toggleItemSelection = (name: string) => {
        setSelectedItemNames(prev => 
            prev.includes(name) 
                ? prev.filter(i => i !== name) 
                : [...prev, name]
        );
    };

    const handleRowPress = (itemName: string) => {
        if (insights?.favoriteItems && insights.favoriteItems.length === 1) {
            handleBatchAction([itemName]);
            return;
        }
        toggleItemSelection(itemName);
    };

    const handleClose = () => {
        setSearchQuery("");
        setSelectedItemNames([]);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Order Intelligence</Text>
                            <Text style={styles.subTitle}>{bills?.length || 0} Records Analyzed</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <Ionicons name="close-circle" size={rf(26)} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {!party && (
                        <View style={styles.searchSection}>
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={rf(18)} color="#94a3b8" style={styles.searchIcon} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="Find Customer (Name or Phone)..."
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="default"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus={true}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                                        <Ionicons name="close-circle" size={rf(18)} color="#cbd5e1" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                        {!insights ? (
                            <View style={styles.emptyContent}>
                                <Ionicons name="analytics-outline" size={rf(60)} color="#e2e8f0" />
                                <Text style={styles.emptyTitle}>New Customer Detected</Text>
                                <Text style={styles.emptyText}>
                                    Either this is a first-time customer or their registered phone number doesn't match past bills.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.profileHeader}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {typeof insights.name === 'string' ? insights.name.charAt(0).toUpperCase() : 'C'}
                                        </Text>
                                    </View>
                                    <View style={styles.profileInfo}>
                                        <Text style={styles.profileName} numberOfLines={1}>{insights.name}</Text>
                                        <Text style={styles.profileTag}>Verified Customer Profile</Text>
                                    </View>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Total Visits</Text>
                                        <Text style={styles.statValue}>{insights.visitCount}</Text>
                                    </View>
                                    <View style={[styles.statBox, styles.statDivider]}>
                                        <Text style={styles.statLabel}>Lifetime Value</Text>
                                        <Text style={[styles.statValue, { color: '#10b981' }]}>₹{insights.totalSpend.toFixed(0)}</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Last Active</Text>
                                        <Text style={styles.statValue}>
                                            {insights.lastVisit ? new Date(insights.lastVisit).toLocaleDateString() : 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="medal" size={rf(20)} color="#6366f1" />
                                        <Text style={styles.sectionTitle}>
                                            {insights.favoriteItems.length === 1 ? "Top Favorite Dish:" : "Customer Favorites:"}
                                        </Text>
                                    </View>
                                    <View style={styles.favList}>
                                        {insights.favoriteItems.map((it: any, idx: number) => {
                                            const isSelected = selectedItemNames.includes(it.name);
                                            const isSingleMode = insights.favoriteItems.length === 1;

                                            return (
                                                <TouchableOpacity 
                                                    key={idx} 
                                                    style={[styles.favRow, isSelected && styles.favRowSelected]}
                                                    onPress={() => handleRowPress(it.name)}
                                                >
                                                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                                                        {isSelected ? (
                                                            <Ionicons name="checkmark" size={rf(16)} color="#fff" />
                                                        ) : (
                                                            <Text style={styles.rankText}>{idx + 1}</Text>
                                                        )}
                                                    </View>
                                                    <Text style={[styles.favName, isSelected && styles.favNameSelected]} numberOfLines={1}>{it.name}</Text>
                                                    <View style={styles.actionBlock}>
                                                        <Text style={styles.qtyText}>{it.count} ord.</Text>
                                                        <Ionicons 
                                                            name={isSingleMode ? "cart" : (isSelected ? "checkbox" : "add-circle-outline")} 
                                                            size={rf(22)} 
                                                            color={isSelected || isSingleMode ? "#6366f1" : "#cbd5e1"} 
                                                        />
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {selectedItemNames.length > 0 ? (
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => handleBatchAction(selectedItemNames)}>
                            <Text style={styles.confirmBtnText}>Select & Add {selectedItemNames.length} Items</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                            <Text style={styles.doneBtnText}>Close Analysis</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: s(16),
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: s(28),
        width: '100%',
        maxHeight: Dimensions.get('window').height * 0.85,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: s(20),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subTitle: {
        fontSize: rf(11),
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    closeBtn: {
        padding: s(4),
    },
    searchSection: {
        paddingHorizontal: s(20),
        paddingTop: vs(20),
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: s(14),
        paddingHorizontal: s(12),
        height: vs(50),
    },
    searchIcon: {
        marginRight: s(2),
    },
    input: {
        flex: 1,
        fontSize: rf(14),
        color: '#1e293b',
        fontWeight: '500',
        marginLeft: s(10),
    },
    scroll: {
        padding: s(20),
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(20),
    },
    avatar: {
        width: s(54),
        height: s(54),
        borderRadius: s(15),
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(15),
    },
    avatarText: {
        color: '#fff',
        fontSize: rf(24),
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    profileTag: {
        fontSize: rf(12),
        color: '#6366f1',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: s(20),
        paddingVertical: vs(18),
        marginBottom: vs(20),
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        borderLeftWidth: 1,
        borderLeftColor: '#f1f5f9',
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9'
    },
    statLabel: {
        fontSize: rf(11),
        color: '#64748b',
        marginBottom: vs(5),
    },
    statValue: {
        fontSize: rf(16),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    section: {
        marginBottom: vs(20),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(15),
        gap: s(8),
    },
    sectionTitle: {
        fontSize: rf(15),
        fontWeight: '800',
        color: '#1e293b',
    },
    favList: {
        gap: vs(10),
    },
    favRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: s(14),
        borderRadius: s(16),
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    favRowSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#eff6ff',
    },
    checkCircle: {
        width: s(26),
        height: s(26),
        borderRadius: s(13),
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
    },
    checkCircleSelected: {
        backgroundColor: '#6366f1',
    },
    rankText: {
        fontSize: rf(12),
        color: '#64748b',
        fontWeight: 'bold',
    },
    favName: {
        flex: 1,
        fontSize: rf(14),
        color: '#334155',
        fontWeight: '600',
    },
    favNameSelected: {
        color: '#6366f1',
    },
    actionBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(8),
    },
    qtyText: {
        fontSize: rf(11),
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    confirmBtn: {
        margin: s(20),
        marginTop: 0,
        backgroundColor: '#4F46E5',
        paddingVertical: vs(16),
        borderRadius: s(16),
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: rf(15),
        fontWeight: 'bold',
    },
    doneBtn: {
        margin: s(20),
        marginTop: 0,
        backgroundColor: '#1e293b',
        paddingVertical: vs(15),
        borderRadius: s(16),
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: rf(14),
        fontWeight: 'bold',
    },
    emptyContent: {
        paddingTop: vs(20),
        paddingBottom: vs(20),
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: rf(16),
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: vs(15),
    },
    emptyText: {
        fontSize: rf(13),
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: vs(10),
        lineHeight: rf(18),
        paddingHorizontal: s(20),
    }
});

export default CustomerHistory;
