import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface SidebarItemsProps {
    t: (key: string) => string;
    navigation: any;
    isSignedIn: boolean;
    onAction: (type: string) => void;
    onLogout: () => void;
}

const SidebarItems = ({ t, navigation, isSignedIn, onAction, onLogout }: SidebarItemsProps) => {
    const COLORS = {
        primary: '#4F46E5',
        danger: '#EF4444',
    };

    return (
        <View>
            <DrawerItem
                label={t('dashboard')}
                icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
                onPress={() => navigation.navigate("(tabs)", { screen: "Dashboard" })}
            />

            <DrawerItem
                label={t('home_menu')}
                icon={({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />}
                onPress={() => navigation.navigate("(tabs)", { screen: "menu" })}
            />

            <DrawerItem
                label={t('orders')}
                icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
                onPress={() => onAction('orders')}
            />

            <DrawerItem
                label={t('table_qr_codes')}
                icon={({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />}
                onPress={() => onAction('qr')}
            />

            <DrawerItem
                label={t('edit_menu_item')}
                icon={({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />}
                onPress={() => onAction('editMenu')}
            />

            <DrawerItem
                label="Items Sales Report"
                icon={({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />}
                onPress={() => onAction('inventory')}
            />

            <DrawerItem
                label={t('settings')}
                icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
                onPress={() => onAction('settings')}
            />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Smart Intelligence</Text>

            <DrawerItem
                label="Profit Engine"
                icon={({ size }) => <Ionicons name="trending-up-outline" size={size} color="#10B981" />}
                onPress={() => onAction('profit')}
            />

            <DrawerItem
                label="Voice Command"
                icon={({ size }) => <Ionicons name="mic-outline" size={size} color="#6366F1" />}
                onPress={() => onAction('voice')}
            />

            <DrawerItem
                label="Customer Search"
                icon={({ size }) => <Ionicons name="search-outline" size={size} color="#f59e0b" />}
                onPress={() => onAction('history')}
            />

            {!isSignedIn ? (
                <DrawerItem
                    label={t('sign_in')}
                    icon={({ color, size }) => <Ionicons name="log-in-outline" size={size} color={COLORS.primary} />}
                    onPress={() => onAction('signIn')}
                    labelStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
                />
            ) : (
                <DrawerItem
                    label={t('sign_out')}
                    icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={COLORS.danger} />}
                    onPress={onLogout}
                    labelStyle={{ color: COLORS.danger }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: vs(10), marginHorizontal: s(15) },
    sectionTitle: { fontSize: rf(12), fontWeight: 'bold', color: '#64748B', marginLeft: s(18), marginBottom: vs(5), textTransform: 'uppercase' },
});

export default SidebarItems;
