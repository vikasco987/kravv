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
    const prediction = useMemo(() => {
        if (!orders || orders.length === 0) return null;

        // Sort orders by time
        const sortedOrders = [...orders].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const firstOrderTime = new Date(sortedOrders[0].createdAt);
        const lastOrderTime = new Date(sortedOrders[sortedOrders.length - 1].createdAt);
        const currentTime = new Date();

        // Minutes since first order
        const timeSpent = Math.floor((currentTime.getTime() - firstOrderTime.getTime()) / (1000 * 60));
        
        // Base estimate: 45 minutes for a typical meal
        // Adjust based on number of orders (more orders usually means longer stay)
        const estimatedTotalTime = 40 + (orders.length * 5); 
        const remainingTime = Math.max(0, estimatedTotalTime - timeSpent);

        // Status color and label
        let status = { label: 'Just Started', color: '#3b82f6', percent: 0.2 };
        if (timeSpent > 35) {
            status = { label: 'Almost Done', color: '#ef4444', percent: 0.9 };
        } else if (timeSpent > 20) {
            status = { label: 'Mid-Meal', color: '#f59e0b', percent: 0.6 };
        }

        return {
            timeSpent,
            remainingTime,
            status,
            orderCount: orders.length,
            startTime: firstOrderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }, [orders]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Table Progress</Text>
                            <Text style={styles.subTitle}>{tableName}</Text>
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
                                    <Text style={styles.timeLabel}>{prediction.timeSpent}m elapsed</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${prediction.status.percent * 100}%`, backgroundColor: prediction.status.color }]} />
                                </View>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Orders</Text>
                                    <Text style={styles.statValue}>{prediction.orderCount}</Text>
                                </View>
                                <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }]}>
                                    <Text style={styles.statLabel}>Seated At</Text>
                                    <Text style={styles.statValue}>{prediction.startTime}</Text>
                                </View>
                            </View>

                            <View style={[styles.estimateBox, { backgroundColor: prediction.status.color + '10' }]}>
                                <Ionicons name="time-outline" size={rf(18)} color={prediction.status.color} />
                                <Text style={[styles.estimateText, { color: prediction.status.color }]}>
                                    Estimated {prediction.remainingTime} mins remaining
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
                        <Text style={styles.doneBtnText}>Close</Text>
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
    }
});

export default TableRotation;
