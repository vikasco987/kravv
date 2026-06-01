import { Ionicons } from '@expo/vector-icons';
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

const DashboardMenuItem = ({ title, iconName, path, router, color, subtitle, onPress, isLocked }) => (
    <TouchableOpacity
        style={[styles.menuItem, { opacity: isLocked ? 0.8 : 1 }]}
        onPress={onPress}
    >
        <View style={[styles.menuIconContainer, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name={iconName} size={rf(18)} color="#334155" />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name={isLocked ? "lock-closed" : "chevron-forward"} size={rf(16)} color={isLocked ? "#EF4444" : "#CBD5E1"} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    menuItem: {
        backgroundColor: 'transparent',
        paddingVertical: vs(12),
        paddingHorizontal: s(16),
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuIconContainer: {
        width: s(36),
        height: s(36),
        borderRadius: s(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(14),
    },
    menuTitle: {
        fontSize: rf(13.5),
        fontWeight: '600',
        color: '#1E293B',
    },
    menuSubtitle: {
        fontSize: rf(10.5),
        color: '#94A3B8',
        marginTop: vs(2),
    },
});

export default DashboardMenuItem;
