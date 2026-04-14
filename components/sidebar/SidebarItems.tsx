import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { StaffPermissionEngine } from '../staff creat/StaffPermissionEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

    const [hasDashboardAccess, setHasDashboardAccess] = useState(true);
    const [hasMenuAccess, setHasMenuAccess] = useState(true);
    const [hasOrdersAccess, setHasOrdersAccess] = useState(true);
    const [hasClientAccess, setHasClientAccess] = useState(true);
    const [hasIntelAccess, setHasIntelAccess] = useState(true);
    const [hasReportsAccess, setHasReportsAccess] = useState(true);
    const [hasSettingsAccess, setHasSettingsAccess] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (isSignedIn) {
                setHasDashboardAccess(true);
                setHasMenuAccess(true);
                setHasOrdersAccess(true);
                setHasClientAccess(true);
                setHasIntelAccess(true);
                setHasReportsAccess(true);
                setHasSettingsAccess(true);
                return;
            }
            const sessionStr = await AsyncStorage.getItem('staff_session');
            if (sessionStr) {
                const dash = await StaffPermissionEngine.hasCategoryAccess("Dashboard", false);
                const menu = await StaffPermissionEngine.hasCategoryAccess("Menu", false);
                const orders = await StaffPermissionEngine.hasCategoryAccess("Orders", false);
                const client = await StaffPermissionEngine.hasCategoryAccess("Client", false);
                const intel = await StaffPermissionEngine.hasCategoryAccess("Intelligence", false);
                const reports = await StaffPermissionEngine.hasCategoryAccess("Reports", false);
                const settings = await StaffPermissionEngine.hasCategoryAccess("Settings", false);
                
                setHasDashboardAccess(dash);
                setHasMenuAccess(menu);
                setHasOrdersAccess(orders);
                setHasClientAccess(client);
                setHasIntelAccess(intel);
                setHasReportsAccess(reports);
                setHasSettingsAccess(settings);
            } else {
                setHasDashboardAccess(true);
                setHasMenuAccess(true);
                setHasOrdersAccess(true);
                setHasClientAccess(true);
                setHasIntelAccess(true);
                setHasReportsAccess(true);
                setHasSettingsAccess(true);
            }
        };
        checkAccess();
    }, [isSignedIn]);

    return (
        <View>
            {hasDashboardAccess && (
                <DrawerItem
                    label={t('dashboard')}
                    icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
                    onPress={() => navigation.navigate("(tabs)", { screen: "Dashboard" })}
                />
            )}

            {hasMenuAccess && (
                <DrawerItem
                    label={t('home_menu')}
                    icon={({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />}
                    onPress={() => navigation.navigate("(tabs)", { screen: "menu" })}
                />
            )}

            {hasOrdersAccess && (
                <DrawerItem
                    label={t('orders')}
                    icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
                    onPress={() => onAction('orders')}
                />
            )}

            {hasMenuAccess && (
                <DrawerItem
                    label={t('table_qr_codes')}
                    icon={({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />}
                    onPress={() => onAction('qr')}
                />
            )}

            {hasMenuAccess && (
                <DrawerItem
                    label={t('edit_menu_item')}
                    icon={({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />}
                    onPress={() => onAction('editMenu')}
                />
            )}

            {hasReportsAccess && (
                <DrawerItem
                    label="Items Sales Report"
                    icon={({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />}
                    onPress={() => onAction('inventory')}
                />
            )}

            {hasSettingsAccess && (
                <DrawerItem
                    label={t('settings')}
                    icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
                    onPress={() => onAction('settings')}
                />
            )}

            {(hasIntelAccess || hasClientAccess) && (
                <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Smart Intelligence</Text>
                </>
            )}

            {hasIntelAccess && (
                <DrawerItem
                    label="Profit Engine"
                    icon={({ size }) => <Ionicons name="trending-up-outline" size={size} color="#10B981" />}
                    onPress={() => onAction('profit')}
                />
            )}

            {hasIntelAccess && (
                <DrawerItem
                    label="Voice Command"
                    icon={({ size }) => <Ionicons name="mic-outline" size={size} color="#6366F1" />}
                    onPress={() => onAction('voice')}
                />
            )}

            {hasClientAccess && (
                <DrawerItem
                    label="Customer Search"
                    icon={({ size }) => <Ionicons name="search-outline" size={size} color="#f59e0b" />}
                    onPress={() => onAction('history')}
                />
            )}

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
