import React, { useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';

interface CustomerHistoryProps {
    visible: boolean;
    onClose: () => void;
    party: any;
    bills: any[];
}

const CustomerHistory = ({ visible, onClose, party, bills }: CustomerHistoryProps) => {
    const insights = useMemo(() => {
        if (!party || !bills || bills.length === 0) return null;

        const phone = party.phone?.replace(/\D/g, '');
        if (!phone) return null;

        // Filter bills for this customer (matching phone)
        const customerBills = bills.filter(bill => {
            const billPhone = bill.customerPhone?.replace(/\D/g, '') || 
                             bill.phone?.replace(/\D/g, '') || '';
            return billPhone.includes(phone) || phone.includes(billPhone) && billPhone.length > 5;
        });

        if (customerBills.length === 0) return null;

        const itemMap: Record<string, { count: number; name: string }> = {};
        let totalSpend = 0;

        customerBills.forEach(bill => {
            totalSpend += (bill.total || 0);
            (bill.items || []).forEach((item: any) => {
                const name = item.name || 'Unknown';
                const qty = Number(item.qty || item.quantity || 0);
                if (!itemMap[name]) {
                    itemMap[name] = { count: 0, name };
                }
                itemMap[name].count += qty;
            });
        });

        const sortedItems = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);
        const lastVisit = customerBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;

        return {
            visitCount: customerBills.length,
            totalSpend,
            favoriteItems: sortedItems,
            lastVisit
        };
    }, [party, bills]);

    if (!insights) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Order Insights</Text>
                            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={rf(22)} color="#64748b" /></TouchableOpacity>
                        </View>
                        <View style={styles.emptyContent}>
                            <Ionicons name="receipt-outline" size={rf(48)} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No previous orders found for this customer phone number.</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Order Insights</Text>
                            <Text style={styles.subTitle}>{party.name}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={rf(22)} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Visits</Text>
                                <Text style={styles.statValue}>{insights.visitCount}</Text>
                            </View>
                            <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: '#f1f5f9', borderRightWidth: 1, borderRightColor: '#f1f5f9' }]}>
                                <Text style={styles.statLabel}>Spend</Text>
                                <Text style={[styles.statValue, { color: '#10b981' }]}>₹{insights.totalSpend.toFixed(0)}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Last Visit</Text>
                                <Text style={styles.statValue}>{insights.lastVisit ? new Date(insights.lastVisit).toLocaleDateString() : 'N/A'}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="heart" size={rf(18)} color="#ef4444" />
                                <Text style={styles.sectionTitle}>Favorite Dishes</Text>
                            </View>
                            <View style={styles.favList}>
                                {insights.favoriteItems.map((it, idx) => (
                                    <View key={idx} style={styles.favRow}>
                                        <View style={styles.rankCircle}><Text style={styles.rankText}>{idx + 1}</Text></View>
                                        <Text style={styles.favName}>{it.name}</Text>
                                        <Text style={styles.favCount}>{it.count} times</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.tipsBox}>
                            <Ionicons name="bulb-outline" size={rf(16)} color="#6366f1" />
                            <Text style={styles.tipsText}>Tip: Greet them with their favorite "{insights.favoriteItems[0]?.name}" recommendation!</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                        <Text style={styles.doneBtnText}>Close Analysis</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: s(20),
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: s(24),
        width: '100%',
        maxHeight: Dimensions.get('window').height * 0.65,
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
        fontSize: rf(12),
        color: '#64748b',
        marginTop: vs(2),
    },
    closeBtn: {
        padding: s(4),
    },
    scroll: {
        padding: s(20),
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: s(16),
        paddingVertical: vs(15),
        marginBottom: vs(20),
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: rf(11),
        color: '#64748b',
        marginBottom: vs(4),
    },
    statValue: {
        fontSize: rf(16),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    section: {
        marginBottom: vs(15),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(12),
        gap: s(8),
    },
    sectionTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        color: '#334155',
    },
    favList: {
        gap: vs(8),
    },
    favRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: s(12),
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    rankCircle: {
        width: s(22),
        height: s(22),
        borderRadius: s(11),
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
    },
    rankText: {
        fontSize: rf(11),
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    favName: {
        flex: 1,
        fontSize: rf(14),
        color: '#334155',
        fontWeight: '500',
    },
    favCount: {
        fontSize: rf(12),
        color: '#94a3b8',
    },
    tipsBox: {
        flexDirection: 'row',
        backgroundColor: '#eef2ff',
        padding: s(12),
        borderRadius: s(12),
        gap: s(8),
        alignItems: 'center',
        marginTop: vs(5),
    },
    tipsText: {
        flex: 1,
        fontSize: rf(11),
        color: '#4338ca',
        fontWeight: '500',
    },
    doneBtn: {
        margin: s(20),
        marginTop: 0,
        backgroundColor: '#111827',
        paddingVertical: vs(14),
        borderRadius: s(14),
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: rf(14),
        fontWeight: 'bold',
    },
    emptyContent: {
        padding: s(40),
        alignItems: 'center',
    },
    emptyText: {
        fontSize: rf(13),
        color: '#64748b',
        textAlign: 'center',
        marginTop: vs(10),
    }
});

export default CustomerHistory;
