import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
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
    <View style={[styles.summaryCard, { opacity: isLocked ? 0.7 : 1 }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={isLocked ? "lock-closed" : icon} size={rf(18)} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.summaryAmount}>₹{isLocked ? "0" : amount.toLocaleString('en-IN')}</Text>
                {isLocked && <Ionicons name="lock-closed" size={rf(12)} color={COLORS.textLight} style={{ marginLeft: s(5) }} />}
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: 'transparent',
        paddingVertical: vs(12),
        paddingHorizontal: s(16),
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    summaryIconContainer: {
        width: s(36),
        height: s(36),
        borderRadius: s(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(14),
    },
    summaryLabel: {
        fontSize: rf(10.5),
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: vs(2),
    },
    summaryAmount: {
        fontSize: rf(15),
        fontWeight: 'bold',
        color: COLORS.text,
    },
});

export default SalesSummaryCard;
