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

        const itemMap: Record<string, { count: number; revenue: number; name: string }> = {};
        
        // Filter out held bills (only counts paid/finalized sales)
        const validBills = bills.filter(b => b.isHeld !== true);

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
            });
        });

        const itemsArray = Object.values(itemMap);
        if (itemsArray.length === 0) return null;

        // Formula: Menu Engineering Matrix
        const avgCount = itemsArray.reduce((acc, it) => acc + it.count, 0) / itemsArray.length;
        const avgRevenue = itemsArray.reduce((acc, it) => acc + it.revenue, 0) / itemsArray.length;

        // Categorize Items:
        // Stars: High Volume, High Profit
        const stars = itemsArray.filter(it => it.count >= avgCount && it.revenue >= avgRevenue)
            .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // Volume Drivers (Plowhorses): High Volume, Low Profit
        const plowhorses = itemsArray.filter(it => it.count >= avgCount && it.revenue < avgRevenue)
            .sort((a, b) => b.count - a.count).slice(0, 5);

        // Hidden Gems (Puzzles): Low Volume, High Profit
        const puzzles = itemsArray.filter(it => it.count < avgCount && it.revenue >= avgRevenue)
            .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        return { stars, plowhorses, puzzles };
    }, [bills]);

    const InsightSection = ({ title, items, icon, color, description }: any) => (
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
                {items && items.length > 0 ? items.map((it: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                        <View style={styles.itemStats}>
                            <Text style={styles.itemQty}>{it.count} Sold</Text>
                            <Text style={styles.itemRev}>₹{Math.round(it.revenue)}</Text>
                        </View>
                    </View>
                )) : <Text style={styles.emptyText}>Not enough data to analyze yet</Text>}
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
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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
                                    items={insights.stars}
                                    icon="star"
                                    color="#f59e0b"
                                    description="High profit & high volume. Your superstars!"
                                />
                                <View style={styles.divider} />
                                <InsightSection
                                    title="VOLUME DRIVERS"
                                    items={insights.plowhorses}
                                    icon="trending-up"
                                    color="#10b981"
                                    description="Very popular but lower margins. Worth promoting."
                                />
                                <View style={styles.divider} />
                                <InsightSection
                                    title="HIDDEN GEMS"
                                    items={insights.puzzles}
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
        paddingVertical: vs(12),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    itemName: {
        fontSize: rf(13),
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    itemStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemQty: {
        fontSize: rf(11),
        color: '#64748b',
        marginRight: s(12),
    },
    itemRev: {
        fontSize: rf(13),
        fontWeight: 'bold',
        color: '#0f172a',
        width: s(75),
        textAlign: 'right',
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
