import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
    const params = useLocalSearchParams();
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

    const checkAccess = async () => {
        const sessionStr = await AsyncStorage.getItem('staff_session');
        const isStaff = !!sessionStr;

        if (isSignedIn) {
            const isStaffPreview = params.staff === 'true';

            if (isStaffPreview) {
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
            return;
        }

        if (isStaff) {
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

    useEffect(() => {
        checkAccess();

        const { DeviceEventEmitter } = require('react-native');
        const sub = DeviceEventEmitter.addListener('PERMISSIONS_UPDATED', checkAccess);
        return () => sub.remove();
    }, [isSignedIn]);

    return (
        <View>
            <DrawerItem
                label={t('dashboard')}
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasDashboardAccess ? "home-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasDashboardAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasDashboardAccess) {
                        navigation.navigate("(tabs)", { screen: "Dashboard" });
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Dashboard access is restricted.");
                    }
                }}
            />

            <DrawerItem
                label={t('home_menu')}
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasMenuAccess ? "cart-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasMenuAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasMenuAccess) {
                        navigation.navigate("(tabs)", { screen: "menu" });
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Menu access is restricted.");
                    }
                }}
            />

            <DrawerItem
                label={t('orders')}
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasOrdersAccess ? "list-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasOrdersAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasOrdersAccess) {
                        onAction('orders');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Orders access is restricted.");
                    }
                }}
            />

            <DrawerItem
                label="KOT"
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasOrdersAccess ? "receipt-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasOrdersAccess ? "#6366F1" : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasOrdersAccess) {
                        navigation.navigate("(tabs)", { screen: "kot" });
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "KOT access is restricted.");
                    }
                }}
            />

            <DrawerItem
                label={t('table_qr_codes')}
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasMenuAccess ? "qr-code-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasMenuAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasMenuAccess) {
                        onAction('qr');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Table QR Codes access is restricted.");
                    }
                }}
            />

            <DrawerItem
                label={t('edit_menu_item')}
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasMenuAccess ? "create-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasMenuAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasMenuAccess) {
                        onAction('editMenu');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Menu editing access is restricted.");
                    }
                }}
            />

            <DrawerItem
                label="Items Sales Report"
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasReportsAccess ? "cube-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasReportsAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasReportsAccess) {
                        onAction('inventory');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Item Sales Reports are restricted. Please contact your administrator.");
                    }
                }}
            />

            <DrawerItem
                label={t('settings')}
                icon={({ color, size }) => (
                    <Ionicons 
                        name={(hasSettingsAccess ? "settings-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasSettingsAccess ? color : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasSettingsAccess) {
                        onAction('settings');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Settings access is restricted.");
                    }
                }}
            />

            {(hasIntelAccess || hasClientAccess) && (
                <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Smart Intelligence</Text>
                </>
            )}

            <DrawerItem
                label="Profit Engine"
                icon={({ size }) => (
                    <Ionicons 
                        name={(hasIntelAccess ? "trending-up-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasIntelAccess ? "#10B981" : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasIntelAccess) {
                        onAction('profit');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Profit Engine is restricted.");
                    }
                }}
            />

            <DrawerItem
                label="Voice Command"
                icon={({ size }) => (
                    <Ionicons 
                        name={(hasIntelAccess ? "mic-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasIntelAccess ? "#6366F1" : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasIntelAccess) {
                        onAction('voice');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Voice Commands are restricted.");
                    }
                }}
            />

            <DrawerItem
                label="Customer Search"
                icon={({ size }) => (
                    <Ionicons 
                        name={(hasClientAccess ? "search-outline" : "lock-closed") as any} 
                        size={size} 
                        color={hasClientAccess ? "#f59e0b" : "#9CA3AF"} 
                    />
                )}
                onPress={() => {
                    if (hasClientAccess) {
                        onAction('history');
                    } else {
                        const { Alert } = require('react-native');
                        Alert.alert("Access Denied", "Customer Search is restricted.");
                    }
                }}
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
