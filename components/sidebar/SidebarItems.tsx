import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";

interface SidebarItemsProps {
    t: (key: string) => string;
    navigation: any;
    isSignedIn: boolean;
    onAction: (type: string) => void;
    onLogout: () => void;
}

const SidebarItems = ({ t, navigation, isSignedIn, onAction, onLogout }: SidebarItemsProps) => {
    const { canAccessSync, isOwner } = useStaffPermissions();

    const COLORS = {
        primary: '#4F46E5',
        danger: '#EF4444',
        lock: '#94A3B8',
    };

    const checkAndNavigate = (permission: string, screen: string, params?: any) => {
        if (canAccessSync(permission)) {
            if (screen.startsWith('(')) {
                navigation.navigate(screen, params);
            } else {
                onAction(screen);
            }
        } else {
            Alert.alert(
                "Access Denied",
                `You don't have permission to access ${permission}. Please contact your administrator.`,
                [{ text: "OK" }]
            );
        }
    };

    const renderIcon = (name: any, color: string, size: number, permission: string) => {
        const hasAccess = canAccessSync(permission);
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={name} size={size} color={hasAccess ? color : COLORS.lock} />
                {!hasAccess && (
                    <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={rf(10)} color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View>
            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Dashboard") && styles.lockedText]}>{t('dashboard')}</Text>
                        {!canAccessSync("Dashboard") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("home-outline", color, size, "Dashboard")}
                onPress={() => checkAndNavigate("Dashboard", "(tabs)", { screen: "Dashboard" })}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Menu") && styles.lockedText]}>{t('home_menu')}</Text>
                        {!canAccessSync("Menu") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("cart-outline", color, size, "Menu")}
                onPress={() => checkAndNavigate("Menu", "(tabs)", { screen: "menu" })}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Order") && styles.lockedText]}>{t('orders')}</Text>
                        {!canAccessSync("Order") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("list-outline", color, size, "Order")}
                onPress={() => checkAndNavigate("Order", "orders")}
            />

            <DrawerItem
                label="KOT"
                icon={({ color, size }) => (
                    <Ionicons 
                        name="receipt-outline" 
                        size={size} 
                        color="#6366F1" 
                    />
                )}
                onPress={() => {
                    navigation.navigate("(tabs)", { screen: "kot" });
                }}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Menu") && styles.lockedText]}>{t('table_qr_codes')}</Text>
                        {!canAccessSync("Menu") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("qr-code-outline", color, size, "Menu")}
                onPress={() => checkAndNavigate("Menu", "qr")}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Menu") && styles.lockedText]}>{t('edit_menu_item')}</Text>
                        {!canAccessSync("Menu") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("create-outline", color, size, "Menu")}
                onPress={() => checkAndNavigate("Menu", "editMenu")}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Reports") && styles.lockedText]}>Item Sales Report</Text>
                        {!canAccessSync("Reports") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("cube-outline", color, size, "Reports")}
                onPress={() => checkAndNavigate("Reports", "inventory")}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("Settings") && styles.lockedText]}>{t('settings')}</Text>
                        {!canAccessSync("Settings") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("settings-outline", color, size, "Settings")}
                onPress={() => checkAndNavigate("Settings", "settings")}
            />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Smart Intelligence</Text>

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("AI Intelligence Tools") && styles.lockedText]}>Profit Engine</Text>
                        {!canAccessSync("AI Intelligence Tools") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("trending-up-outline", "#10B981", size, "AI Intelligence Tools")}
                onPress={() => checkAndNavigate("AI Intelligence Tools", "profit")}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("AI Intelligence Tools") && styles.lockedText]}>Voice Command</Text>
                        {!canAccessSync("AI Intelligence Tools") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("mic-outline", "#6366F1", size, "AI Intelligence Tools")}
                onPress={() => checkAndNavigate("AI Intelligence Tools", "voice")}
            />

            <DrawerItem
                label={() => (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.labelText, !canAccessSync("AI Intelligence Tools") && styles.lockedText]}>Customer Search</Text>
                        {!canAccessSync("AI Intelligence Tools") && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
                    </View>
                )}
                icon={({ color, size }) => renderIcon("search-outline", "#f59e0b", size, "AI Intelligence Tools")}
                onPress={() => checkAndNavigate("AI Intelligence Tools", "history")}
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
    labelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, paddingRight: s(10) },
    labelText: { fontSize: rf(15), color: '#334155', fontWeight: '500' },
    lockedText: { color: "#94A3B8" },
    lockBadge: {
        position: 'absolute',
        right: -s(4),
        bottom: -vs(2),
        backgroundColor: '#EF4444',
        borderRadius: s(10),
        padding: s(1),
        borderWidth: 1,
        borderColor: '#fff'
    }
});

export default SidebarItems;
