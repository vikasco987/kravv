import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    primary: '#4F46E5', // Indigo
    secondary: '#10B981', // Emerald
    accent: '#F59E0B', // Amber
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

const SalesSummaryCard = ({ label, amount, icon, color, isLocked }) => (
    <View style={[styles.summaryCard, { borderLeftColor: color, opacity: isLocked ? 0.7 : 1 }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={isLocked ? "lock-closed" : icon} size={rf(22)} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.summaryAmount}>₹{isLocked ? "0" : amount.toLocaleString('en-IN')}</Text>
                {isLocked && <Ionicons name="lock-closed" size={rf(14)} color={COLORS.textLight} style={{ marginLeft: s(5) }} />}
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: s(16),
        padding: s(16),
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: s(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryIconContainer: {
        width: s(44),
        height: s(44),
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(15),
    },
    summaryLabel: {
        fontSize: rf(12),
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: vs(2),
    },
    summaryAmount: {
        fontSize: rf(20),
        fontWeight: 'bold',
        color: COLORS.text,
    },
});

export default SalesSummaryCard;
