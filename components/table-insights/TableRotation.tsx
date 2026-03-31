import React, { useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';

interface TableRotationProps {
    visible: boolean;
    onClose: () => void;
    tableName: string;
    orders: any[];
}

const TableRotation = ({ visible, onClose, tableName, orders }: TableRotationProps) => {
    const [currentTime, setCurrentTime] = React.useState(new Date());

    // Update time every 10 seconds for real-time feel
    React.useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, [visible]);

    const prediction = useMemo(() => {
        if (!orders || orders.length === 0) return null;

        // Sort orders by time
        const sortedOrders = [...orders].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const firstOrderTime = new Date(sortedOrders[0].createdAt);
        
        // Minutes since first order
        const timeSpent = Math.floor((currentTime.getTime() - firstOrderTime.getTime()) / (1000 * 60));
        
        // Extract real customer data
        const customerName = orders[0]?.customerName || orders[0]?.name || "Guest";
        
        // Calculate total items across all orders (KOTs)
        let totalItemsCount = 0;
        let allItems: any[] = [];
        orders.forEach(order => {
            const items = order.items || [];
            items.forEach((item: any) => {
                totalItemsCount += (item.qty || item.quantity || 0);
                allItems.push(item);
            });
        });

        // Get latest item added
        const latestOrder = sortedOrders[sortedOrders.length - 1];
        const latestItems = latestOrder.items || [];
        const latestItemName = latestItems.length > 0 ? latestItems[latestItems.length - 1].name : "None";

        // Base estimate calculation improves with more items
        const estimatedTotalTime = 30 + (orders.length * 8) + (totalItemsCount * 2); 
        const remainingTime = Math.max(0, estimatedTotalTime - timeSpent);

        // Status color and label based on percentage of estimated time
        const progressPercent = Math.min(0.95, timeSpent / estimatedTotalTime);
        
        let status = { label: 'Just Started', color: '#3b82f6', percent: progressPercent };
        if (progressPercent > 0.8) {
            status = { label: 'Almost Done', color: '#ef4444', percent: progressPercent };
        } else if (progressPercent > 0.4) {
            status = { label: 'In Progress', color: '#f59e0b', percent: progressPercent };
        }

        return {
            timeSpent,
            remainingTime,
            status,
            customerName,
            totalItemsCount,
            latestItemName,
            orderCount: orders.length,
            startTime: firstOrderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            allItems: allItems.slice(-3) // Show last 3 items for context
        };
    }, [orders, currentTime]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Live Table Insights</Text>
                            <Text style={styles.subTitle}>{tableName} • {prediction?.customerName || 'No Orders'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={rf(22)} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {prediction ? (
                        <View style={styles.content}>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressHeader}>
                                    <Text style={[styles.statusText, { color: prediction.status.color }]}>
                                        {prediction.status.label}
                                    </Text>
                                    <Text style={styles.timeLabel}>{prediction.timeSpent}m seated</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${prediction.status.percent * 100}%`, backgroundColor: prediction.status.color }]} />
                                </View>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Total Items</Text>
                                    <Text style={styles.statValue}>{prediction.totalItemsCount}</Text>
                                </View>
                                <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }]}>
                                    <Text style={styles.statLabel}>KOT Count</Text>
                                    <Text style={styles.statValue}>{prediction.orderCount}</Text>
                                </View>
                                <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }]}>
                                    <Text style={styles.statLabel}>Seated At</Text>
                                    <Text style={styles.statValue}>{prediction.startTime}</Text>
                                </View>
                            </View>

                            <View style={styles.itemSummary}>
                                <Text style={styles.summaryLabel}>Recent Items:</Text>
                                <View style={styles.itemsRow}>
                                    {prediction.allItems.map((item, idx) => (
                                        <View key={idx} style={styles.itemBadge}>
                                            <Text style={styles.itemBadgeText} numberOfLines={1}>{item.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={[styles.estimateBox, { backgroundColor: prediction.status.color + '10' }]}>
                                <Ionicons name="sparkles" size={rf(16)} color={prediction.status.color} />
                                <Text style={[styles.estimateText, { color: prediction.status.color }]}>
                                    Est. {prediction.remainingTime} mins to free table
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyContent}>
                            <Ionicons name="restaurant-outline" size={rf(40)} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No active orders for this table.</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                        <Text style={styles.doneBtnText}>Got it</Text>
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
        padding: s(25),
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: s(24),
        width: '100%',
        maxWidth: s(320),
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
        fontSize: rf(13),
        color: '#64748b',
        marginTop: vs(2),
    },
    closeBtn: {
        padding: s(4),
    },
    content: {
        padding: s(20),
    },
    progressContainer: {
        marginBottom: vs(20),
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(8),
    },
    statusText: {
        fontSize: rf(14),
        fontWeight: 'bold',
    },
    timeLabel: {
        fontSize: rf(12),
        color: '#94a3b8',
    },
    progressBarBg: {
        height: vs(8),
        backgroundColor: '#f1f5f9',
        borderRadius: s(4),
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: s(4),
    },
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: '#fafafa',
        borderRadius: s(12),
        padding: s(12),
        marginBottom: vs(20),
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: rf(11),
        color: '#64748b',
        marginBottom: vs(2),
    },
    statValue: {
        fontSize: rf(15),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    estimateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(12),
        borderRadius: s(12),
        justifyContent: 'center',
        gap: s(8),
    },
    estimateText: {
        fontSize: rf(13),
        fontWeight: '600',
    },
    doneBtn: {
        margin: s(20),
        marginTop: 0,
        backgroundColor: '#111827',
        paddingVertical: vs(12),
        borderRadius: s(12),
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
    },
    itemSummary: {
        marginBottom: vs(20),
    },
    summaryLabel: {
        fontSize: rf(12),
        fontWeight: '600',
        color: '#64748b',
        marginBottom: vs(8),
    },
    itemsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: s(6),
    },
    itemBadge: {
        backgroundColor: '#f1f5f9',
        paddingVertical: vs(4),
        paddingHorizontal: s(10),
        borderRadius: s(20),
        maxWidth: s(100),
    },
    itemBadgeText: {
        fontSize: rf(11),
        color: '#475569',
        fontWeight: '500',
    }
});

export default TableRotation;
