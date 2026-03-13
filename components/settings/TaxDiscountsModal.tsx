import React from 'react';
import { Modal, View, Pressable, ScrollView, Text, TouchableOpacity, Switch, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface TaxDiscountsModalProps {
    visible: boolean;
    onClose: () => void;
    taxEnabled: boolean;
    setTaxEnabled: (val: boolean) => void;
    perProductTax: boolean;
    setPerProductTax: (val: boolean) => void;
    taxRate: string;
    setTaxRate: (val: string) => void;
    discountEnabled: boolean;
    setDiscountEnabled: (val: boolean) => void;
    discountRate: string;
    setDiscountRate: (val: string) => void;
    serviceChargeEnabled: boolean;
    setServiceChargeEnabled: (val: boolean) => void;
    serviceChargeRate: string;
    setServiceChargeRate: (val: string) => void;
    onSave: (key: string, value: string | boolean, label: string) => void;
}

export const TaxDiscountsModal: React.FC<TaxDiscountsModalProps> = ({
    visible,
    onClose,
    taxEnabled,
    setTaxEnabled,
    perProductTax,
    setPerProductTax,
    taxRate,
    setTaxRate,
    discountEnabled,
    setDiscountEnabled,
    discountRate,
    setDiscountRate,
    serviceChargeEnabled,
    setServiceChargeEnabled,
    serviceChargeRate,
    setServiceChargeRate,
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
                        <Text style={styles.bottomSheetTitle}>GST / VAT & Discounts</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={rf(28)} color={COLORS.textLight} opacity={0.5} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
                        {/* GST Toggle */}
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Enable GST / VAT</Text>
                                <Text style={styles.settingSubLabel}>Toggle to apply tax on invoices</Text>
                            </View>
                            <Switch
                                value={taxEnabled}
                                onValueChange={(val) => {
                                    setTaxEnabled(val);
                                    onSave("tax_enabled", val, "GST / VAT");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "80" }}
                                thumbColor={taxEnabled ? COLORS.primary : "#F4F3F4"}
                            />
                        </View>

                        {/* Per-Product GST Toggle */}
                        <View style={[styles.settingRow, { marginTop: vs(15) }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Per-Product GST</Text>
                                <Text style={styles.settingSubLabel}>Set different GST rates for each product</Text>
                            </View>
                            <Switch
                                value={perProductTax}
                                onValueChange={(val) => {
                                    setPerProductTax(val);
                                    onSave("tax_per_product", val, "Per-product GST");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "80" }}
                                thumbColor={perProductTax ? COLORS.primary : "#F4F3F4"}
                            />
                        </View>

                        {/* Default Tax Rate Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Default tax rate</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Ionicons name="card-outline" size={rf(18)} color={COLORS.textLight} />
                                </View>
                                <TextInput
                                    style={styles.textInput}
                                    value={taxRate}
                                    onChangeText={setTaxRate}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                />
                                <Text style={styles.percentText}>%</Text>
                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={() => onSave("tax_rate", taxRate, "Tax rate")}
                                >
                                    <Text style={styles.saveBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Discount Toggle */}
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Enable discounts</Text>
                                <Text style={styles.settingSubLabel}>Allow discount fields while creating bills</Text>
                            </View>
                            <Switch
                                value={discountEnabled}
                                onValueChange={(val) => {
                                    setDiscountEnabled(val);
                                    onSave("discount_enabled", val, "Discounts");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "80" }}
                                thumbColor={discountEnabled ? COLORS.primary : "#F4F3F4"}
                            />
                        </View>

                        {/* Default Discount Rate Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Default discount rate</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Ionicons name="pricetag-outline" size={rf(18)} color={COLORS.textLight} />
                                </View>
                                <TextInput
                                    style={styles.textInput}
                                    value={discountRate}
                                    onChangeText={setDiscountRate}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                />
                                <Text style={styles.percentText}>%</Text>
                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={() => onSave("discount_rate", discountRate, "Discount rate")}
                                >
                                    <Text style={styles.saveBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Service Charge Toggle */}
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Enable service charges</Text>
                                <Text style={styles.settingSubLabel}>Add service charge to bills (e.g., delivery)</Text>
                            </View>
                            <Switch
                                value={serviceChargeEnabled}
                                onValueChange={(val) => {
                                    setServiceChargeEnabled(val);
                                    onSave("service_charge_enabled", val, "Service charges");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "80" }}
                                thumbColor={serviceChargeEnabled ? COLORS.primary : "#F4F3F4"}
                            />
                        </View>

                        {/* Default Service Charge Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Default service charge</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Ionicons name="restaurant-outline" size={rf(18)} color={COLORS.textLight} />
                                </View>
                                <TextInput
                                    style={styles.textInput}
                                    value={serviceChargeRate}
                                    onChangeText={setServiceChargeRate}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                />
                                <Text style={styles.percentText}>%</Text>
                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={() => onSave("service_charge_rate", serviceChargeRate, "Service charge")}
                                >
                                    <Text style={styles.saveBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
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
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    inputContainer: {
        marginTop: vs(15),
    },
    inputLabel: {
        fontSize: rf(13),
        fontWeight: '600',
        color: COLORS.textLight,
        marginBottom: vs(8),
        marginLeft: s(4),
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: s(16),
        paddingHorizontal: s(15),
        height: vs(55),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: s(10),
    },
    textInput: {
        flex: 1,
        fontSize: rf(18),
        fontWeight: '700',
        color: COLORS.text,
        padding: 0,
    },
    percentText: {
        fontSize: rf(16),
        fontWeight: '600',
        color: COLORS.textLight,
        marginRight: s(15),
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: s(20),
        paddingVertical: vs(10),
        borderRadius: s(12),
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: rf(14),
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: vs(15),
        opacity: 0.5,
    },
});
