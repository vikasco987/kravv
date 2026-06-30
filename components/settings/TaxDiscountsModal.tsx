import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from "../../context/LanguageContext";
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
    taxInclusive?: boolean;
    setTaxInclusive?: (val: boolean) => void;
    qrMenuPriceInclusive?: boolean;
    setQrMenuPriceInclusive?: (val: boolean) => void;
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
    serviceGstEnabled: boolean;
    setServiceGstEnabled: (val: boolean) => void;
    serviceGstRate: string;
    setServiceGstRate: (val: string) => void;
    deliveryChargeEnabled: boolean;
    setDeliveryChargeEnabled: (val: boolean) => void;
    deliveryChargeAmount: string;
    setDeliveryChargeAmount: (val: string) => void;
    deliveryGstEnabled: boolean;
    setDeliveryGstEnabled: (val: boolean) => void;
    deliveryGstRate: string;
    setDeliveryGstRate: (val: string) => void;
    packagingChargeEnabled: boolean;
    setPackagingChargeEnabled: (val: boolean) => void;
    packagingChargeAmount: string;
    setPackagingChargeAmount: (val: string) => void;
    packagingGstEnabled: boolean;
    setPackagingGstEnabled: (val: boolean) => void;
    packagingGstRate: string;
    setPackagingGstRate: (val: string) => void;
    onSave: (key: string, value: string | boolean, label: string) => void;
}

export const TaxDiscountsModal: React.FC<TaxDiscountsModalProps> = ({
    visible,
    onClose,
    taxEnabled,
    setTaxEnabled,
    perProductTax,
    setPerProductTax,
    taxInclusive,
    setTaxInclusive,
    qrMenuPriceInclusive,
    setQrMenuPriceInclusive,
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
    serviceGstEnabled,
    setServiceGstEnabled,
    serviceGstRate,
    setServiceGstRate,
    deliveryChargeEnabled,
    setDeliveryChargeEnabled,
    deliveryChargeAmount,
    setDeliveryChargeAmount,
    deliveryGstEnabled,
    setDeliveryGstEnabled,
    deliveryGstRate,
    setDeliveryGstRate,
    packagingChargeEnabled,
    setPackagingChargeEnabled,
    packagingChargeAmount,
    setPackagingChargeAmount,
    packagingGstEnabled,
    setPackagingGstEnabled,
    packagingGstRate,
    setPackagingGstRate,
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

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
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

                            {/* Exclusive GST (POS & Bills) */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#F9FAFB' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="document-text-outline" size={rf(20)} color="#9CA3AF" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{taxInclusive ? "Inclusive GST (POS & Bills)" : "Exclusive GST (POS & Bills)"}</Text>
                                    <Text style={styles.rowSubLabel}>{t('gst_pos_bills_desc') || 'Calculate GST included or excluded on bills'}</Text>
                                </View>
                                <Switch
                                    value={taxInclusive ?? false}
                                    onValueChange={(val) => {
                                        setTaxInclusive?.(val);
                                        onSave("tax_inclusive", val, taxInclusive ? "Exclusive GST" : "Inclusive GST");
                                    }}
                                    trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.innerDivider} />

                            {/* Exclusive GST Pricing */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#F9FAFB' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="pricetags-outline" size={rf(20)} color="#9CA3AF" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{qrMenuPriceInclusive ? "Inclusive GST Pricing" : "Exclusive GST Pricing"}</Text>
                                    <Text style={styles.rowSubLabel}>{t('gst_pricing_desc') || 'Menu pricing includes or excludes GST'}</Text>
                                </View>
                                <Switch
                                    value={qrMenuPriceInclusive ?? false}
                                    onValueChange={(val) => {
                                        setQrMenuPriceInclusive?.(val);
                                        onSave("qr_menu_price_inclusive", val, qrMenuPriceInclusive ? "Exclusive GST Pricing" : "Inclusive GST Pricing");
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
                                    {[0, 5, 12, 18, 28].map((rate) => (
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

                        {/* Service Charge Section (New Style) */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="restaurant-outline" size={rf(14)} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>SERVICE SETTINGS</Text>
                        </View>

                        <View style={styles.settingsCard}>
                            {/* Enable Service Charges */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="shield-checkmark" size={rf(20)} color="#0EA5E9" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>Enable Service Charges</Text>
                                    <Text style={styles.rowSubLabel}>Charge added for services</Text>
                                </View>
                                <Switch
                                    value={serviceChargeEnabled}
                                    onValueChange={(val) => {
                                        setServiceChargeEnabled(val);
                                        onSave("service_charge_enabled", val, "Service Charges");
                                    }}
                                    trackColor={{ false: "#E5E7EB", true: "#0EA5E9" }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.innerDivider} />

                            {/* Service Charge Amount */}
                            <View style={styles.rateSection}>
                                <Text style={styles.miniLabel}>SERVICE AMOUNT (₹)</Text>
                                <View style={[styles.customInputRow, { width: s(200) }]}>
                                    <Text style={[styles.percentSuffix, { marginRight: s(5), color: COLORS.text }]}>₹</Text>
                                    <TextInput
                                        style={styles.customTaxInput}
                                        value={serviceChargeRate}
                                        onChangeText={setServiceChargeRate}
                                        keyboardType="decimal-pad"
                                        placeholder="0"
                                    />
                                    <TouchableOpacity
                                        style={[styles.saveBtn, { backgroundColor: '#0EA5E9', paddingHorizontal: s(12), paddingVertical: vs(6) }]}
                                        onPress={() => onSave("service_charge_rate", serviceChargeRate, "Service Amount")}
                                    >
                                        <Text style={[styles.saveBtnText, { fontSize: rf(12) }]}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.innerDivider} />

                            {/* GST on Service Charge */}
                            <View style={styles.rowItem}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const newVal = !serviceGstEnabled;
                                        setServiceGstEnabled(newVal);
                                        onSave("service_gst_enabled", newVal, "Service GST");
                                    }}
                                    style={[styles.iconBox, { backgroundColor: serviceGstEnabled ? '#E0F2FE' : '#F3F4F6' }]}
                                >
                                    <View style={styles.innerIconBox}>
                                        <Ionicons
                                            name={serviceGstEnabled ? "checkmark-circle" : "ellipse-outline"}
                                            size={rf(20)}
                                            color={serviceGstEnabled ? "#0EA5E9" : "#9CA3AF"}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{serviceGstEnabled ? "GST ON SERVICE" : "GST OFF SERVICE"}</Text>
                                    <Text style={styles.rowSubLabel}>Calculate tax on service</Text>
                                </View>
                                {serviceGstEnabled && (
                                    <View style={[styles.customInputRow, { borderColor: '#0EA5E9', width: s(160), height: vs(45) }]}>
                                        <TextInput
                                            style={[styles.customTaxInput, { fontSize: rf(16) }]}
                                            value={serviceGstRate}
                                            onChangeText={setServiceGstRate}
                                            keyboardType="decimal-pad"
                                            placeholder="0"
                                        />
                                        <TouchableOpacity
                                            onPress={() => onSave("service_gst_rate", serviceGstRate, "Service GST Rate")}
                                            style={{ marginRight: s(8) }}
                                        >
                                            <Ionicons name="checkmark-circle" size={rf(20)} color="#0EA5E9" />
                                        </TouchableOpacity>
                                        <Ionicons name="receipt-outline" size={rf(16)} color="#9CA3AF" />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Delivery Charges Section (New) */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="bus-outline" size={rf(14)} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>DELIVERY SETTINGS</Text>
                        </View>

                        <View style={styles.settingsCard}>
                            {/* Enable Delivery Charges */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="shield-checkmark" size={rf(20)} color="#4F46E5" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>Enable Delivery Charges</Text>
                                    <Text style={styles.rowSubLabel}>Fixed charge added to delivery orders</Text>
                                </View>
                                <Switch
                                    value={deliveryChargeEnabled}
                                    onValueChange={(val) => {
                                        setDeliveryChargeEnabled(val);
                                        onSave("delivery_charge_enabled", val, "Delivery Charges");
                                    }}
                                    trackColor={{ false: "#E5E7EB", true: "#4F46E5" }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.innerDivider} />

                            {/* Charge Amount */}
                            <View style={styles.rateSection}>
                                <Text style={styles.miniLabel}>CHARGE AMOUNT (₹)</Text>
                                <View style={[styles.customInputRow, { width: s(200) }]}>
                                    <Text style={[styles.percentSuffix, { marginRight: s(5), color: COLORS.text }]}>₹</Text>
                                    <TextInput
                                        style={styles.customTaxInput}
                                        value={deliveryChargeAmount}
                                        onChangeText={setDeliveryChargeAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="0"
                                    />
                                    <TouchableOpacity
                                        style={[styles.saveBtn, { paddingHorizontal: s(12), paddingVertical: vs(6) }]}
                                        onPress={() => onSave("delivery_charge_amount", deliveryChargeAmount, "Delivery Amount")}
                                    >
                                        <Text style={[styles.saveBtnText, { fontSize: rf(12) }]}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.innerDivider} />

                            {/* GST on Delivery */}
                            <View style={styles.rowItem}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const newVal = !deliveryGstEnabled;
                                        setDeliveryGstEnabled(newVal);
                                        onSave("delivery_gst_enabled", newVal, "Delivery GST");
                                    }}
                                    style={[styles.iconBox, { backgroundColor: deliveryGstEnabled ? '#DCFCE7' : '#F3F4F6' }]}
                                >
                                    <View style={styles.innerIconBox}>
                                        <Ionicons
                                            name={deliveryGstEnabled ? "checkmark-circle" : "ellipse-outline"}
                                            size={rf(20)}
                                            color={deliveryGstEnabled ? "#10B981" : "#9CA3AF"}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{deliveryGstEnabled ? "GST ON DELIVERY" : "GST OFF DELIVERY"}</Text>
                                    <Text style={styles.rowSubLabel}>Calculate tax on charge</Text>
                                </View>
                                {deliveryGstEnabled && (
                                    <View style={[styles.customInputRow, { borderColor: '#10B981', width: s(160), height: vs(45) }]}>
                                        <TextInput
                                            style={[styles.customTaxInput, { fontSize: rf(16) }]}
                                            value={deliveryGstRate}
                                            onChangeText={setDeliveryGstRate}
                                            keyboardType="decimal-pad"
                                            placeholder="0"
                                        />
                                        <TouchableOpacity
                                            onPress={() => onSave("delivery_gst_rate", deliveryGstRate, "Delivery GST Rate")}
                                            style={{ marginRight: s(8) }}
                                        >
                                            <Ionicons name="checkmark-circle" size={rf(20)} color="#10B981" />
                                        </TouchableOpacity>
                                        <Ionicons name="receipt-outline" size={rf(16)} color="#9CA3AF" />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Packaging Charges Section (New) */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="cube-outline" size={rf(14)} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>PACKAGING SETTINGS</Text>
                        </View>

                        <View style={styles.settingsCard}>
                            {/* Enable Packaging Charges */}
                            <View style={styles.rowItem}>
                                <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
                                    <View style={styles.innerIconBox}>
                                        <Ionicons name="shield-checkmark" size={rf(20)} color="#DB2777" />
                                    </View>
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>Enable Packaging Charges</Text>
                                    <Text style={styles.rowSubLabel}>Fixed charge added for packaging</Text>
                                </View>
                                <Switch
                                    value={packagingChargeEnabled}
                                    onValueChange={(val) => {
                                        setPackagingChargeEnabled(val);
                                        onSave("packaging_charge_enabled", val, "Packaging Charges");
                                    }}
                                    trackColor={{ false: "#E5E7EB", true: "#DB2777" }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.innerDivider} />

                            {/* Packaging Charge Amount */}
                            <View style={styles.rateSection}>
                                <Text style={styles.miniLabel}>PACKAGING AMOUNT (₹)</Text>
                                <View style={[styles.customInputRow, { width: s(200) }]}>
                                    <Text style={[styles.percentSuffix, { marginRight: s(5), color: COLORS.text }]}>₹</Text>
                                    <TextInput
                                        style={styles.customTaxInput}
                                        value={packagingChargeAmount}
                                        onChangeText={setPackagingChargeAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="0"
                                    />
                                    <TouchableOpacity
                                        style={[styles.saveBtn, { backgroundColor: '#DB2777', paddingHorizontal: s(12), paddingVertical: vs(6) }]}
                                        onPress={() => onSave("packaging_charge_amount", packagingChargeAmount, "Packaging Amount")}
                                    >
                                        <Text style={[styles.saveBtnText, { fontSize: rf(12) }]}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.innerDivider} />

                            {/* GST on Packaging */}
                            <View style={styles.rowItem}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const newVal = !packagingGstEnabled;
                                        setPackagingGstEnabled(newVal);
                                        onSave("packaging_gst_enabled", newVal, "Packaging GST");
                                    }}
                                    style={[styles.iconBox, { backgroundColor: packagingGstEnabled ? '#FCE7F3' : '#F3F4F6' }]}
                                >
                                    <View style={styles.innerIconBox}>
                                        <Ionicons
                                            name={packagingGstEnabled ? "checkmark-circle" : "ellipse-outline"}
                                            size={rf(20)}
                                            color={packagingGstEnabled ? "#DB2777" : "#9CA3AF"}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>{packagingGstEnabled ? "GST ON PACKAGING" : "GST OFF PACKAGING"}</Text>
                                    <Text style={styles.rowSubLabel}>Calculate tax on packaging</Text>
                                </View>
                                {packagingGstEnabled && (
                                    <View style={[styles.customInputRow, { borderColor: '#DB2777', width: s(160), height: vs(45) }]}>
                                        <TextInput
                                            style={[styles.customTaxInput, { fontSize: rf(16) }]}
                                            value={packagingGstRate}
                                            onChangeText={setPackagingGstRate}
                                            keyboardType="decimal-pad"
                                            placeholder="0"
                                        />
                                        <TouchableOpacity
                                            onPress={() => onSave("packaging_gst_rate", packagingGstRate, "Packaging GST Rate")}
                                            style={{ marginRight: s(8) }}
                                        >
                                            <Ionicons name="checkmark-circle" size={rf(20)} color="#DB2777" />
                                        </TouchableOpacity>
                                        <Ionicons name="receipt-outline" size={rf(16)} color="#9CA3AF" />
                                    </View>
                                )}
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
