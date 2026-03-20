import React from 'react';
import { Modal, View, Pressable, ScrollView, Text, TouchableOpacity, Switch, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";

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
    const { t } = useLanguage();
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
                        <Text style={styles.bottomSheetTitle}>{t('gst_vat_discounts') || 'GST / VAT & Discounts'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={rf(28)} color={COLORS.textLight} opacity={0.5} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="receipt-outline" size={rf(14)} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('gst_tax_settings') || 'GST / TAX SETTINGS'}</Text>
                        </View>

                        <View style={styles.settingsCard}>
                            {/* Enable Global GST System */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="shield-checkmark" size={rf(20)} color="#10B981" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{t('enable_global_gst') || 'Enable Global GST System'}</Text>
                                    <Text style={styles.rowSubLabel}>{t('gst_add_desc', { rate: taxRate }) || `${taxRate}% GST will be added to every order`}</Text>
                                </View>
                                <Switch
                                    value={taxEnabled}
                                    onValueChange={(val) => {
                                        setTaxEnabled(val);
                                        onSave("tax_enabled", val, "GST System");
                                    }}
                                    trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.innerDivider} />

                            {/* Per-Product GST */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#F9FAFB' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="options-outline" size={rf(20)} color="#9CA3AF" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{t('per_product_gst') || 'Per-Product GST'}</Text>
                                    <Text style={styles.rowSubLabel}>{t('default_gst_desc') || 'Always use Default GST for all products'}</Text>
                                </View>
                                <Switch
                                    value={perProductTax}
                                    onValueChange={(val) => {
                                        setPerProductTax(val);
                                        onSave("per_product_tax", val, "Per-product GST");
                                    }}
                                    trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.innerDivider} />

                            {/* Quick Select Rate */}
                            <View style={styles.rateSection}>
                                <Text style={styles.miniLabel}>{t('quick_select_rate') || 'QUICK SELECT RATE'}</Text>
                                <View style={styles.quickSelectGrid}>
                                    {[5, 12, 18, 28].map((rate) => (
                                        <TouchableOpacity
                                            key={rate}
                                            style={[
                                                styles.rateBtn,
                                                taxRate === String(rate) && styles.rateBtnActive
                                            ]}
                                            onPress={() => {
                                                setTaxRate(String(rate));
                                                onSave("tax_rate", String(rate), "Tax rate");
                                            }}
                                        >
                                            <Text style={[
                                                styles.rateBtnText,
                                                taxRate === String(rate) && styles.rateBtnTextActive
                                            ]}>{rate}%</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Custom Rate */}
                            <View style={styles.rateSection}>
                                <Text style={styles.miniLabel}>{t('custom_rate') || 'CUSTOM RATE (%)'}</Text>
                                <View style={styles.customInputRow}>
                                    <TextInput
                                        style={styles.customTaxInput}
                                        value={taxRate}
                                        onChangeText={setTaxRate}
                                        onBlur={() => onSave("tax_rate", taxRate, "Tax rate")}
                                        keyboardType="decimal-pad"
                                    />
                                    <View style={styles.spinButtons}>
                                        <Ionicons name="chevron-up" size={rf(14)} color="#9CA3AF" />
                                        <Ionicons name="chevron-down" size={rf(14)} color="#9CA3AF" />
                                    </View>
                                    <Text style={styles.percentSuffix}>%</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Discount Toggle */}
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>{t('enable_discounts_label') || 'Enable discounts'}</Text>
                                <Text style={styles.settingSubLabel}>{t('allow_discount_desc') || 'Allow discount fields while creating bills'}</Text>
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
                            <Text style={styles.inputLabel}>{t('default_discount_label') || 'Default discount rate'}</Text>
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
                                    onPress={() => onSave("discount_rate", discountRate, t('discount_rate') || "Discount rate")}
                                >
                                    <Text style={styles.saveBtnText}>{t('save') || 'Save'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Service Charge Toggle */}
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>{t('enable_service_charge_label') || 'Enable service charges'}</Text>
                                <Text style={styles.settingSubLabel}>{t('service_charge_desc') || 'Add service charge to bills (e.g., delivery)'}</Text>
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
                            <Text style={styles.inputLabel}>{t('default_service_charge_label') || 'Default service charge'}</Text>
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
                                    onPress={() => onSave("service_charge_rate", serviceChargeRate, t('service_charge') || "Service charge")}
                                >
                                    <Text style={styles.saveBtnText}>{t('save') || 'Save'}</Text>
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
    // Redesigned styles
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(12),
        marginTop: vs(5),
    },
    sectionIconContainer: {
        width: s(24),
        height: s(24),
        borderRadius: s(6),
        backgroundColor: COLORS.primary + "15",
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(8),
    },
    sectionTitle: {
        fontSize: rf(12),
        fontWeight: '800',
        color: COLORS.textLight,
        letterSpacing: 1,
    },
    settingsCard: {
        backgroundColor: COLORS.white,
        borderRadius: s(20),
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingVertical: vs(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(20),
        paddingVertical: vs(12),
    },
    iconBox: {
        width: s(46),
        height: s(46),
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerIconBox: {
        width: s(36),
        height: s(36),
        borderRadius: s(10),
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rowText: {
        flex: 1,
        marginLeft: s(15),
    },
    rowLabel: {
        fontSize: rf(15),
        fontWeight: '800',
        color: COLORS.text,
    },
    rowSubLabel: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
        fontWeight: '500',
    },
    innerDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: s(20),
    },
    rateSection: {
        paddingHorizontal: s(20),
        paddingVertical: vs(15),
    },
    miniLabel: {
        fontSize: rf(10),
        fontWeight: '800',
        color: COLORS.textLight,
        letterSpacing: 1,
        marginBottom: vs(12),
    },
    quickSelectGrid: {
        flexDirection: 'row',
        gap: s(10),
    },
    rateBtn: {
        paddingVertical: vs(10),
        paddingHorizontal: s(18),
        borderRadius: s(12),
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rateBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    rateBtnText: {
        fontSize: rf(14),
        fontWeight: '800',
        color: COLORS.text,
    },
    rateBtnTextActive: {
        color: COLORS.white,
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: s(15),
        paddingHorizontal: s(15),
        height: vs(55),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: s(140),
    },
    customTaxInput: {
        flex: 1,
        fontSize: rf(18),
        fontWeight: '800',
        color: COLORS.text,
        padding: 0,
    },
    spinButtons: {
        justifyContent: 'space-between',
        height: vs(24),
        marginRight: s(10),
    },
    percentSuffix: {
        fontSize: rf(16),
        fontWeight: '800',
        color: COLORS.primary,
    },
});
