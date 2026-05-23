import { Feather, Ionicons } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";
const THEME_DANGER = "#DC2626";

interface MenuHeaderProps {
    onAddItem: () => void;
    onPauseOrder: () => void;
    onViewHeldOrders: () => void;
    onVoicePress: () => void;
    heldCount: number;
    isVoiceLocked?: boolean;
    multiZoneMenuEnabled?: boolean;
    selectedZone?: string;
    onZonePress?: () => void;
}


export const MenuHeader: React.FC<MenuHeaderProps> = ({
    onAddItem,
    onPauseOrder,
    onViewHeldOrders,
    onVoicePress,
    heldCount,
    isVoiceLocked = false,
    multiZoneMenuEnabled = false,
    selectedZone = "Global",
    onZonePress,
}) => {
    return (
        <View style={styles.integratedHeaderBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6), flexShrink: 1 }}>
                <Text style={styles.headerTitle}>Menu</Text>

                {multiZoneMenuEnabled && onZonePress && (
                    <TouchableOpacity
                        style={styles.zoneTrigger}
                        onPress={onZonePress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={selectedZone === "Global" ? "earth-outline" : "location-outline"} size={rf(16)} color="#10B981" />
                        <Text style={styles.zoneText} numberOfLines={1}>{selectedZone}</Text>
                        <Ionicons name="chevron-down" size={rf(14)} color="#6B7280" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.voiceTrigger, isVoiceLocked && { opacity: 0.6 }]}
                    onPress={onVoicePress}
                    activeOpacity={isVoiceLocked ? 1 : 0.7}
                >
                    <Ionicons name={isVoiceLocked ? "lock-closed" : "mic"} size={rf(18)} color={isVoiceLocked ? "#EF4444" : THEME_PRIMARY} />
                </TouchableOpacity>
            </View>

            <View style={styles.headerActionGroup}>
                <TouchableOpacity style={styles.integratedActionButton} onPress={onAddItem}>
                    <Feather name="plus-square" size={rf(16)} color="#4B5563" style={{ marginRight: s(4) }} />
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
                    <Ionicons name="stopwatch-outline" size={rf(16)} color="#4B5563" style={{ marginRight: s(4) }} />
                    <Text style={styles.integratedButtonText}>Hold</Text>
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
        paddingTop: vs(2),
        paddingBottom: vs(2)
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: s(12),
        paddingHorizontal: s(10),
        height: vs(45),
    },
    searchInput: {
        flex: 1,
        fontSize: rf(15),
        color: '#1E293B',
        marginLeft: s(8),
        fontWeight: '500',
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
        alignItems: "center",
        gap: s(4),
    },
    integratedActionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: vs(4),
        paddingHorizontal: s(6),
        borderRadius: s(12),
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        position: 'relative'
    },
    integratedButtonText: {
        fontSize: rf(12),
        fontWeight: "600",
        color: "#4B5563"
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
    voiceTrigger: {
        backgroundColor: '#F1F5F9',
        padding: s(6),
        borderRadius: s(8),
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginLeft: s(4),
        flexShrink: 0,
    },
    zoneTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingVertical: vs(4),
        paddingHorizontal: s(6),
        borderRadius: s(8),
        borderWidth: 1,
        borderColor: '#A7F3D0',
        gap: s(4),
        flexShrink: 1,
    },
    zoneText: {
        fontSize: rf(12),
        fontWeight: '700',
        color: '#065F46',
        flexShrink: 1,
    }
});
