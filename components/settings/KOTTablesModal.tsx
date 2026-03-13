import React from 'react';
import { Modal, View, Pressable, ScrollView, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    secondary: '#10B981',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface KOTTablesModalProps {
    visible: boolean;
    onClose: () => void;
    kotEnabled: boolean;
    setKotEnabled: (val: boolean) => void;
    tableBookingEnabled: boolean;
    setTableBookingEnabled: (val: boolean) => void;
    onSave: (key: string, value: string | boolean, label: string) => void;
}

export const KOTTablesModal: React.FC<KOTTablesModalProps> = ({
    visible,
    onClose,
    kotEnabled,
    setKotEnabled,
    tableBookingEnabled,
    setTableBookingEnabled,
    onSave,
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.bottomSheetOverlay}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                <View style={styles.bottomSheetContent}>
                    <View style={styles.bottomSheetHandle} />

                    <View style={styles.bottomSheetHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
                            <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.secondary + "15", marginRight: 0 }]}>
                                <Ionicons name="restaurant-outline" size={rf(24)} color={COLORS.secondary} />
                            </View>
                            <View>
                                <Text style={styles.bottomSheetTitle}>KOT (Kitchen Order Ticket)</Text>
                                <Text style={styles.settingSubLabel}>Manage KOT billing and table booking features</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
                        {/* KOT Toggle */}
                        <View style={[styles.featureCard, kotEnabled && styles.featureCardActive]}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name="restaurant-outline" size={rf(22)} color={kotEnabled ? COLORS.secondary : COLORS.textLight} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Enable KOT Billing</Text>
                                <Text style={styles.settingSubLabel}>Allow generating Kitchen Order Tickets for quick orders</Text>
                            </View>
                            <Switch
                                value={kotEnabled}
                                onValueChange={(val) => {
                                    setKotEnabled(val);
                                    onSave("kot_enabled", val, "KOT Billing");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.secondary + "80" }}
                                thumbColor={kotEnabled ? COLORS.secondary : "#F4F3F4"}
                            />
                        </View>

                        {/* Table Booking Toggle */}
                        <View style={[styles.featureCard, { marginTop: vs(12) }, tableBookingEnabled && styles.featureCardActive]}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name="grid-outline" size={rf(22)} color={tableBookingEnabled ? COLORS.secondary : COLORS.textLight} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Enable Table Booking</Text>
                                <Text style={styles.settingSubLabel}>Assign table numbers to KOT orders</Text>
                            </View>
                            <Switch
                                value={tableBookingEnabled}
                                onValueChange={(val) => {
                                    setTableBookingEnabled(val);
                                    onSave("table_booking_enabled", val, "Table Booking");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.secondary + "80" }}
                                thumbColor={tableBookingEnabled ? COLORS.secondary : "#F4F3F4"}
                            />
                        </View>

                        {/* Info Box */}
                        <View style={styles.kotInfoBox}>
                            <Ionicons name="information-circle-outline" size={rf(18)} color={COLORS.secondary} />
                            <Text style={styles.kotInfoText}>
                                KOT button will appear in Quick Bill screen. Use it to print kitchen orders before final billing.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.closeBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.closeBtnText}>Done</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetContent: {
        height: '85%',
        backgroundColor: COLORS.card,
        borderTopLeftRadius: s(40),
        borderTopRightRadius: s(40),
        paddingTop: vs(15),
        paddingHorizontal: s(25),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    bottomSheetHandle: {
        width: s(50),
        height: vs(5),
        backgroundColor: '#E5E7EB',
        borderRadius: s(10),
        alignSelf: 'center',
        marginBottom: vs(15),
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: vs(25),
    },
    bottomSheetTitle: {
        fontSize: rf(22),
        fontWeight: '800',
        color: COLORS.text,
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: s(8),
        borderRadius: s(12),
        marginRight: s(15),
    },
    settingLabel: {
        fontSize: rf(16),
        fontWeight: '700',
        color: COLORS.text,
    },
    settingSubLabel: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(14),
        backgroundColor: COLORS.background,
        borderRadius: s(18),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: s(12),
    },
    featureCardActive: {
        borderColor: COLORS.secondary + '40',
        backgroundColor: COLORS.secondary + '05',
    },
    featureIconContainer: {
        width: s(44),
        height: s(44),
        borderRadius: s(12),
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    kotInfoBox: {
        flexDirection: 'row',
        marginTop: vs(20),
        padding: s(14),
        backgroundColor: COLORS.secondary + '10',
        borderRadius: s(14),
        alignItems: 'center',
        gap: s(10),
        borderWidth: 1,
        borderColor: COLORS.secondary + '20',
    },
    kotInfoText: {
        flex: 1,
        fontSize: rf(12),
        color: COLORS.secondary,
        fontWeight: '500',
        lineHeight: rf(17),
    },
    closeBtn: {
        backgroundColor: COLORS.secondary,
        paddingVertical: vs(14),
        borderRadius: s(15),
        alignItems: 'center',
        marginTop: vs(25),
    },
    closeBtnText: {
        color: COLORS.white,
        fontSize: rf(16),
        fontWeight: '700',
    },
});
