import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

export type TableStatus = "FREE" | "PENDING" | "ACCEPTED" | "PREPARING" | "READY";

interface TableCardProps {
    name: string;
    status: TableStatus;
    activeCount: number;
    startTime?: string;
    onPress: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const STATUS_CONFIG: Record<TableStatus, { bg: string; border: string; text: string; dot: string; label: string; }> = {
    FREE: { bg: "#FFFFFF", border: "#E5E7EB", text: "#9CA3AF", dot: "#D1D5DB", label: "Vacant" },
    PENDING: { bg: "#FFF7ED", border: "#FFEDD5", text: "#EA580C", dot: "#F97316", label: "Reserved" },
    ACCEPTED: { bg: "#EEF2FF", border: "#E0E7FF", text: "#4F46E5", dot: "#6366F1", label: "Accepted" },
    PREPARING: { bg: "#F5F3FF", border: "#EDE9FE", text: "#7C3AED", dot: "#8B5CF6", label: "Preparing" },
    READY: { bg: "#ECFDF5", border: "#D1FAE5", text: "#059669", dot: "#10B981", label: "Serve Now" }
};

const TableTimer = ({ startTime }: { startTime?: string }) => {
    const [timeStr, setTimeStr] = useState("");
    const [isOld, setIsOld] = useState(false);

    useEffect(() => {
        if (!startTime) return;
        const update = () => {
            const start = new Date(startTime).getTime();
            const diff = Math.floor((Date.now() - start) / 1000);
            if (diff < 0) return;
            const mins = Math.floor(diff / 60);
            const h = Math.floor(mins / 60);
            const m = mins % 60;

            setIsOld(mins > 30);
            if (h > 0) setTimeStr(`${h}H ${m}M`);
            else setTimeStr(`${m}M`);
        };
        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime || !timeStr) return <View style={{ height: vs(16) }} />;

    return (
        <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={rf(10)} color={isOld ? "#E11D48" : "#059669"} />
            <Text style={[styles.timerText, { color: isOld ? "#E11D48" : "#059669" }]}>{timeStr}</Text>
        </View>
    );
};

export const TableCard = React.memo(({ name, status, activeCount, startTime, onPress, onEdit, onDelete }: TableCardProps) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.FREE;
    const displayName = name.startsWith("T-") ? name.slice(2) : name;

    return (
        <TouchableOpacity
            style={[
                styles.tableCard,
                { backgroundColor: config.bg, borderColor: config.border },
                status !== 'FREE' ? styles.activeShadow : null
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.topRow}>
                <View style={styles.statusWrap}>
                    <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
                    <Text style={[styles.statusLabel, { color: config.text }]}>{config.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {activeCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{activeCount}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.nameContainer}>
                <Text style={styles.tableName} numberOfLines={2} adjustsFontSizeToFit>{displayName}</Text>
            </View>

            <View style={[styles.bottomRow, { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' }]}>
                <View>
                    {status !== 'FREE' && startTime ? (
                        <TableTimer startTime={startTime} />
                    ) : (
                        <View style={{ height: vs(16) }} />
                    )}
                </View>
                <View style={{ flexDirection: 'row' }}>
                    {onEdit && (
                        <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); onEdit(); }}>
                            <Ionicons name="pencil" size={rf(14)} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); onDelete(); }}>
                            <Ionicons name="trash" size={rf(14)} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});
TableCard.displayName = "TableCard";

const styles = StyleSheet.create({
    tableCard: {
        flex: 1,
        margin: s(3),
        height: vs(110),
        borderRadius: s(12),
        borderWidth: 1,
        padding: s(6),
        justifyContent: 'space-between',
    },
    activeShadow: {
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statusWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: s(6),
        height: s(6),
        borderRadius: s(3),
        marginRight: s(4),
    },
    statusLabel: {
        fontSize: rf(8),
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    badge: {
        backgroundColor: '#F43F5E',
        borderRadius: s(10),
        paddingHorizontal: s(5),
        paddingVertical: vs(2),
        minWidth: s(18),
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: rf(9),
        fontWeight: 'bold',
    },
    actionBtn: {
        padding: s(4),
        marginLeft: s(4),
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: s(4),
    },
    nameContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableName: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
    },
    bottomRow: {
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: s(6),
        paddingVertical: vs(2),
        borderRadius: s(10),
    },
    timerText: {
        fontSize: rf(9),
        fontWeight: 'bold',
        marginLeft: s(3),
    }
});

export default TableCard;
