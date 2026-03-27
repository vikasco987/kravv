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

interface ProfitInsightProps {
    visible: boolean;
    onClose: () => void;
    bills: any[];
}

const ProfitInsight = ({ visible, onClose, bills }: ProfitInsightProps) => {
    const insights = useMemo(() => {
        if (!bills || bills.length === 0) return null;

        const itemMap: Record<string, { count: number; revenue: number; name: string }> = {};
        
        // Filter out held bills
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

        // Calculate averages for categorization
        const avgCount = itemsArray.reduce((acc, it) => acc + it.count, 0) / itemsArray.length;
        const avgRevenue = itemsArray.reduce((acc, it) => acc + it.revenue, 0) / itemsArray.length;

        const stars = itemsArray.filter(it => it.count >= avgCount && it.revenue >= avgRevenue)
            .sort((a, b) => b.revenue - a.revenue).slice(0, 3);
            
        const plowhorses = itemsArray.filter(it => it.count >= avgCount && it.revenue < avgRevenue)
            .sort((a, b) => b.count - a.count).slice(0, 3);
            
        const puzzles = itemsArray.filter(it => it.count < avgCount && it.revenue >= avgRevenue)
            .sort((a, b) => b.revenue - a.revenue).slice(0, 3);

        return { stars, plowhorses, puzzles };
    }, [bills]);

    if (!insights) return null;

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
                {items.length > 0 ? items.map((it: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                        <View style={styles.itemStats}>
                            <Text style={styles.itemQty}>{it.count} Sold</Text>
                            <Text style={styles.itemRev}>₹{Math.round(it.revenue)}</Text>
                        </View>
                    </View>
                )) : <Text style={styles.emptyText}>Not enough data</Text>}
            </View>
        </View>
    );

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Menu Intelligence</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={rf(22)} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                        <InsightSection 
                            title="STARS (High Profit)"
                            items={insights.stars}
                            icon="star"
                            color="#f59e0b"
                            description="Best performing items. Keep promoting these."
                        />
                        <View style={styles.divider} />
                        <InsightSection 
                            title="VOLUME DRIVERS"
                            items={insights.plowhorses}
                            icon="trending-up"
                            color="#10b981"
                            description="Popular but lower margins. Consider price adjust."
                        />
                        <View style={styles.divider} />
                        <InsightSection 
                            title="UNDER-THE-RADAR"
                            items={insights.puzzles}
                            icon="bulb"
                            color="#6366f1"
                            description="High profit but low sales. Needs better visibility."
                        />
                    </ScrollView>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Analysis based on latest sales data</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: s(20),
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: s(16),
        width: '100%',
        maxHeight: Dimensions.get('window').height * 0.7,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: s(16),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeBtn: {
        padding: s(4),
    },
    scroll: {
        padding: s(16),
    },
    section: {
        marginBottom: vs(10),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(12),
    },
    iconBox: {
        width: s(36),
        height: s(36),
        borderRadius: s(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
    },
    sectionTitle: {
        fontSize: rf(14),
        fontWeight: '800',
    },
    sectionDesc: {
        fontSize: rf(10),
        color: '#64748b',
        marginTop: vs(1),
    },
    itemsList: {
        backgroundColor: '#f8fafc',
        borderRadius: s(12),
        padding: s(10),
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vs(8),
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
        marginRight: s(10),
    },
    itemRev: {
        fontSize: rf(13),
        fontWeight: 'bold',
        color: '#0f172a',
        width: s(60),
        textAlign: 'right',
    },
    emptyText: {
        fontSize: rf(12),
        color: '#94a3b8',
        textAlign: 'center',
        paddingVertical: vs(10),
    },
    divider: {
        height: vs(15),
    },
    footer: {
        padding: s(12),
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    footerText: {
        fontSize: rf(10),
        color: '#64748b',
        fontStyle: 'italic',
    }
});

export default ProfitInsight;
