import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface TableCardProps {
    name: string;
    orderCount: number;
    activeOrdersText: string;
    noActiveOrdersText: string;
    onPress: () => void;
    onInsightPress: () => void;
}

const THEME_PRIMARY = "#4F46E5";

export const TableCard = React.memo(({ 
    name, 
    orderCount, 
    activeOrdersText, 
    noActiveOrdersText, 
    onPress, 
    onInsightPress 
}: TableCardProps) => {
    return (
        <TouchableOpacity
            style={styles.tableCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {orderCount > 0 && (
                <TouchableOpacity
                    style={styles.insightIcon}
                    onPress={(e) => {
                        e.stopPropagation();
                        onInsightPress();
                    }}
                    activeOpacity={0.6}
                >
                    <Ionicons name="flash" size={rf(14)} color="#F59E0B" />
                </TouchableOpacity>
            )}
            <View style={[styles.tableIcon, orderCount > 0 ? styles.activeTableIcon : null]}>
                <Ionicons
                    name="restaurant-outline"
                    size={rf(26)}
                    color={orderCount > 0 ? "#fff" : THEME_PRIMARY}
                />
            </View>
            <Text style={styles.tableName}>{name}</Text>
            <View style={styles.statusBox}>
                <View style={[styles.statusDot, { backgroundColor: orderCount > 0 ? "#10B981" : "#D1D5DB" }]} />
                <Text style={styles.orderStatus}>
                    {orderCount > 0 ? `${orderCount} ${activeOrdersText}` : noActiveOrdersText}
                </Text>
            </View>
        </TouchableOpacity>
    );
});
TableCard.displayName = "TableCard";

const styles = StyleSheet.create({
    tableCard: {
        flex: 1,
        backgroundColor: '#fff',
        margin: s(10),
        padding: s(20),
        borderRadius: s(20),
        alignItems: 'center',
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tableIcon: {
        width: s(55),
        height: s(55),
        borderRadius: s(28),
        backgroundColor: THEME_PRIMARY + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(12),
    },
    activeTableIcon: {
        backgroundColor: THEME_PRIMARY,
    },
    tableName: { fontSize: rf(18), fontWeight: 'bold', color: '#111827' },
    statusBox: { flexDirection: 'row', alignItems: 'center', marginTop: vs(8) },
    statusDot: { width: s(8), height: s(8), borderRadius: s(4), marginRight: s(5) },
    orderStatus: { fontSize: rf(12), color: '#6B7280', fontWeight: '500' },
    insightIcon: {
        position: 'absolute',
        top: s(12),
        right: s(12),
        backgroundColor: '#FFFBEB',
        padding: s(6),
        borderRadius: s(8),
        borderWidth: 1,
        borderColor: '#FEF3C7',
        zIndex: 10,
    },
});

export default TableCard;
