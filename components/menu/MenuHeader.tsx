import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather, Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";
const THEME_DANGER = "#DC2626";

interface MenuHeaderProps {
    refreshing: boolean;
    onFetchMenus: () => void;
    onAddItem: () => void;
    onPauseOrder: () => void;
    onViewHeldOrders: () => void;
    heldCount: number;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({
    refreshing,
    onFetchMenus,
    onAddItem,
    onPauseOrder,
    onViewHeldOrders,
    heldCount,
}) => {
    return (
        <View style={styles.integratedHeaderBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.headerTitle}>Menu</Text>
                <TouchableOpacity
                    style={styles.refreshIconButton}
                    onPress={onFetchMenus}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator size="small" color={THEME_PRIMARY} />
                    ) : (
                        <Ionicons name="refresh" size={rf(22)} color={THEME_PRIMARY} />
                    )}
                </TouchableOpacity>
            </View>
            <View style={styles.headerActionGroup}>
                <TouchableOpacity style={styles.integratedActionButton} onPress={onAddItem}>
                    <Feather name="plus" size={rf(16)} color="#FFF" style={{ marginRight: s(4) }} />
                    <Text style={styles.integratedButtonText}>Item</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.integratedActionButton}
                    onPress={onPauseOrder}
                >
                    <Text style={styles.integratedButtonText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.integratedActionButton, { position: 'relative' }]}
                    onPress={onViewHeldOrders}
                >
                    <Ionicons name="timer-outline" size={rf(16)} color="#FFF" style={{ marginRight: s(4) }} />
                    <Text style={styles.integratedButtonText}>HOLD</Text>
                    {heldCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{heldCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    integratedHeaderBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: s(15),
        paddingTop: vs(10),
        paddingBottom: vs(5)
    },
    headerTitle: {
        fontSize: rf(22),
        fontWeight: "bold",
        color: "#1F2937"
    },
    refreshIconButton: {
        marginLeft: s(10),
        padding: s(5)
    },
    headerActionGroup: {
        flexDirection: "row",
        backgroundColor: THEME_PRIMARY,
        borderRadius: s(10),
        padding: s(4)
    },
    integratedActionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: vs(6),
        paddingHorizontal: s(10),
        borderRadius: s(8),
        marginHorizontal: s(2),
        position: 'relative'
    },
    integratedButtonText: {
        fontSize: rf(13),
        fontWeight: "700",
        color: "#FFF"
    },
    headerBadge: {
        position: 'absolute',
        top: vs(-6),
        right: s(-4),
        backgroundColor: THEME_DANGER,
        borderRadius: s(10),
        minWidth: s(18),
        height: vs(18),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    headerBadgeText: {
        color: '#FFF',
        fontSize: rf(9),
        fontWeight: '900',
    },
});
