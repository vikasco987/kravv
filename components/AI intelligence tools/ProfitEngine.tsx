import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

interface ProfitEngineProps {
    visible: boolean;
    onClose: () => void;
    bills?: any[]; // Keep as optional prop
}

const ProfitEngine = ({ visible, onClose, bills: propBills }: ProfitEngineProps) => {
    const { getToken } = useAuth();
    const [internalBills, setInternalBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Use propBills if provided, otherwise use internal fetched bills
    const bills = propBills && propBills.length > 0 ? propBills : internalBills;

    useEffect(() => {
        if (visible && (!propBills || propBills.length === 0)) {
            fetchRealTimeData();
        }
    }, [visible, propBills]);

    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await fetch("https://billing.kravy.in/api/bill-manager", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setInternalBills(data.bills || []);
            }
        } catch (e) {
            console.error("ProfitEngine real-data fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const insights = useMemo(() => {
        if (!bills || bills.length === 0) return null;

        const periods = ['today', 'weekly', 'monthly'];
        const periodInsights: any = {
            stars: { today: [], weekly: [], monthly: [] },
            plowhorses: { today: [], weekly: [], monthly: [] },
            puzzles: { today: [], weekly: [], monthly: [] }
        };

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeekly = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonthly = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        periods.forEach(period => {
            const itemMap: Record<string, { count: number; revenue: number; name: string }> = {};
            let totalVolume = 0;

            const validBills = bills.filter(b => {
                if (b.isHeld === true) return false;
                const bDate = new Date(b.createdAt || b.date || now);
                if (period === 'today') return bDate >= startOfToday;
                if (period === 'weekly') return bDate >= startOfWeekly;
                return bDate >= startOfMonthly;
            });

            validBills.forEach(bill => {
                (bill.items || []).forEach((item: any) => {
                    const name = item.name || 'Unknown';
                    const qty = Number(item.qty || item.quantity || 0);
                    const price = Number(item.rate || item.price || 0);
                    const lineTotal = qty * price;

                    if (!itemMap[name]) {
                        itemMap[name] = { count: 0, revenue: 0, name };
                    }
                    itemMap[name].count += qty;
                    itemMap[name].revenue += lineTotal;
                    totalVolume += qty;
                });
            });

            const itemsArray = Object.values(itemMap);
            if (itemsArray.length === 0) return;

            const avgCount = itemsArray.reduce((acc, it) => acc + it.count, 0) / itemsArray.length;
            const avgRevenue = itemsArray.reduce((acc, it) => acc + it.revenue, 0) / itemsArray.length;

            const stars = itemsArray.filter(it => it.count >= avgCount && it.revenue >= avgRevenue)
                .sort((a, b) => b.revenue - a.revenue)
                .map(it => ({ ...it, percent: totalVolume > 0 ? (it.count / totalVolume) * 100 : 0 }))
                .slice(0, 3);

            const plowhorses = itemsArray.filter(it => it.count >= avgCount && it.revenue < avgRevenue)
                .sort((a, b) => b.count - a.count)
                .map(it => ({ ...it, percent: totalVolume > 0 ? (it.count / totalVolume) * 100 : 0 }))
                .slice(0, 3);

            const puzzles = itemsArray.filter(it => it.count < avgCount && it.revenue >= avgRevenue)
                .sort((a, b) => b.revenue - a.revenue)
                .map(it => ({ ...it, percent: totalVolume > 0 ? (it.count / totalVolume) * 100 : 0 }))
                .slice(0, 3);

            periodInsights.stars[period] = stars;
            periodInsights.plowhorses[period] = plowhorses;
            periodInsights.puzzles[period] = puzzles;
        });

        return periodInsights;
    }, [bills]);

    const PeriodItems = ({ period, items, color, periodName }: any) => (
        <View style={styles.periodSection}>
            <View style={styles.periodHeader}>
                <Text style={styles.periodLabel}>{periodName}</Text>
                <View style={[styles.periodLine, { backgroundColor: color + '30' }]} />
            </View>
            {items && items.length > 0 ? items.map((it: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemMainInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                        <Text style={styles.itemPercent}>{it.percent.toFixed(1)}% of sales</Text>
                    </View>
                    <View style={styles.itemStats}>
                        <Text style={styles.itemQty}>{it.count} Sold</Text>
                        <Text style={styles.itemRev}>₹{Math.round(it.revenue)}</Text>
                    </View>
                </View>
            )) : <Text style={styles.noDataSmall}>No trends for this period yet</Text>}
        </View>
    );

    const InsightSection = ({ title, data, icon, color, description }: any) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={rf(18)} color={color} />
                </View>
                <View>
                    <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
                    <Text style={styles.sectionDesc}>{description}</Text>
                </View>
            </View>
            <View style={styles.itemsList}>
                <PeriodItems periodName="TODAY" items={data.today} color={color} />
                <PeriodItems periodName="WEEKLY" items={data.weekly} color={color} />
                <PeriodItems periodName="MONTHLY" items={data.monthly} color={color} />
            </View>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={rf(22)} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profit Engine</Text>
                    <View style={{ width: rf(22) }} />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={styles.loadingText}>Analyzing real-time menu performance...</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                        {!insights ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="analytics-outline" size={rf(60)} color="#cbd5e1" />
                                <Text style={styles.emptyTitle}>Low Data for Analysis</Text>
                                <Text style={styles.emptyDesc}>We need at least a few paid orders to start generating profit insights for your menu.</Text>
                            </View>
                        ) : (
                            <>
                                <InsightSection
                                    title="STARS (Best Performing)"
                                    data={insights.stars}
                                    icon="star"
                                    color="#f59e0b"
                                    description="High profit & high volume. Your superstars!"
                                />
                                <View style={styles.divider} />
                                <InsightSection
                                    title="VOLUME DRIVERS"
                                    data={insights.plowhorses}
                                    icon="trending-up"
                                    color="#10b981"
                                    description="Very popular but lower margins. Worth promoting."
                                />
                                <View style={styles.divider} />
                                <InsightSection
                                    title="HIDDEN GEMS"
                                    data={insights.puzzles}
                                    icon="bulb"
                                    color="#6366f1"
                                    description="Highly profitable but low sales. Needs better spotlight."
                                />
                            </>
                        )}
                    </ScrollView>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Smart AI Menu Intelligence • Analyzing latest sales</Text>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: s(16),
        paddingTop: vs(40),
        paddingBottom: vs(15),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    backBtn: {
        padding: s(4),
    },
    scroll: {
        padding: s(16),
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: vs(15),
        fontSize: rf(14),
        color: '#64748b',
        fontWeight: '500'
    },
    section: {
        marginBottom: vs(15),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(12),
    },
    iconBox: {
        width: s(42),
        height: s(42),
        borderRadius: s(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
    },
    sectionTitle: {
        fontSize: rf(15),
        fontWeight: '800',
    },
    sectionDesc: {
        fontSize: rf(11),
        color: '#64748b',
        marginTop: vs(1),
    },
    itemsList: {
        backgroundColor: '#f8fafc',
        borderRadius: s(18),
        padding: s(14),
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vs(10),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    itemMainInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: rf(12),
        fontWeight: '700',
        color: '#1e293b',
    },
    itemPercent: {
        fontSize: rf(9),
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: vs(1),
    },
    itemStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(8),
    },
    itemQty: {
        fontSize: rf(10),
        color: '#64748b',
        fontWeight: '500',
    },
    itemRev: {
        fontSize: rf(12),
        fontWeight: '800',
        color: '#0f172a',
        width: s(60),
        textAlign: 'right',
    },
    periodSection: {
        marginBottom: vs(12),
    },
    periodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(6),
    },
    periodLabel: {
        fontSize: rf(9),
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: s(6),
        paddingVertical: vs(2),
        borderRadius: s(4),
        marginRight: s(8),
    },
    periodLine: {
        flex: 1,
        height: 1,
    },
    noDataSmall: {
        fontSize: rf(10),
        color: '#cbd5e1',
        fontStyle: 'italic',
        paddingVertical: vs(4),
    },
    emptyText: {
        fontSize: rf(12),
        color: '#94a3b8',
        textAlign: 'center',
        paddingVertical: vs(10),
    },
    divider: {
        height: vs(20),
    },
    footer: {
        paddingHorizontal: s(16),
        paddingTop: vs(12),
        paddingBottom: vs(50),
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        alignItems: 'center',
    },
    footerText: {
        fontSize: rf(10),
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: vs(120),
        paddingHorizontal: s(30),
    },
    emptyTitle: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#475569',
        marginTop: vs(20),
    },
    emptyDesc: {
        fontSize: rf(14),
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: vs(10),
        lineHeight: rf(20),
    }
});

export default ProfitEngine;
