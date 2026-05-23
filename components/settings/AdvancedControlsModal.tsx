import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    emerald: '#10B981',
};

interface AdvancedControlsModalProps {
    visible: boolean;
    onClose: () => void;
    multiZoneMenuEnabled: boolean;
    setMultiZoneMenuEnabled: (val: boolean) => void;
    onSave: (key: string, value: boolean, label: string) => void;
}

export const AdvancedControlsModal: React.FC<AdvancedControlsModalProps> = ({
    visible,
    onClose,
    multiZoneMenuEnabled,
    setMultiZoneMenuEnabled,
    onSave,
}) => {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="chevron-down" size={rf(24)} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Advanced Controls</Text>
                    <View style={{ width: s(40) }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: COLORS.emerald + "15" }]}>
                                <Ionicons name="layers-outline" size={rf(22)} color={COLORS.emerald} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Multi-Zone Menu</Text>
                                <Text style={styles.subtitle}>Define multiple zones (e.g., Rooftop, Bar) and show different menu items based on where the customer is sitting.</Text>
                            </View>
                            <Switch
                                value={multiZoneMenuEnabled}
                                onValueChange={(val) => {
                                    setMultiZoneMenuEnabled(val);
                                    onSave("multi_zone_menu_enabled", val, "Multi-Zone Menu");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.emerald + "80" }}
                                thumbColor={multiZoneMenuEnabled ? COLORS.emerald : "#9CA3AF"}
                                ios_backgroundColor="#E5E7EB"
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: s(20),
        paddingTop: vs(50),
        paddingBottom: vs(15),
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    closeButton: {
        width: s(40),
        height: s(40),
        borderRadius: s(20),
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: '800',
        color: COLORS.text,
    },
    content: {
        padding: s(20),
        paddingTop: vs(24),
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: s(24),
        padding: s(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: s(48),
        height: s(48),
        borderRadius: s(16),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: s(16),
    },
    textContainer: {
        flex: 1,
        marginRight: s(12),
    },
    title: {
        fontSize: rf(16),
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: vs(4),
    },
    subtitle: {
        fontSize: rf(12),
        color: COLORS.textLight,
        lineHeight: rf(18),
    },
});
