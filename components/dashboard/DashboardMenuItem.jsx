import { Feather, Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const DashboardMenuItem = ({ title, iconName, path, router, color, subtitle, onPress }) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
    >
        <View style={[styles.menuIconContainer, { backgroundColor: color + '10' }]}>
            <Ionicons name={iconName} size={rf(28)} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={rf(20)} color="#CBD5E1" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    menuItem: {
        backgroundColor: COLORS.card,
        borderRadius: s(16),
        padding: s(16),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuIconContainer: {
        width: s(54),
        height: s(54),
        borderRadius: s(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(16),
    },
    menuTitle: {
        fontSize: rf(16),
        fontWeight: '700',
        color: COLORS.text,
    },
    menuSubtitle: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
    },
});

export default DashboardMenuItem;
