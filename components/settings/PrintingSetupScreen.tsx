import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  getRecentCompanyProfile,
  updateBusinessSettings,
} from "../../services/companyService";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  primary: "#4F46E5",
  green: "#10B981",
  border: "rgba(79, 70, 229, 0.08)",
};

const PRINT_SETTING_KEY = "print_settings";

interface PrintSettings {
  // Bill Settings
  showLogo: boolean;
  showTagline: boolean;
  showContact: boolean;
  showAddress: boolean;
  showGST: boolean;
  showFSSAI: boolean;
  showToken: boolean;
  showCustomerDetails: boolean;
  showTaxBreakup: boolean;
  showGreetings: boolean;
  showAmountInWords: boolean;
  showPaymentStatus: boolean;
  showFoodTypeSuffix: boolean;
  // Financial Summary
  showSubtotal: boolean;
  showDiscount: boolean;
  showTaxableAmt: boolean;
  showTotalTax: boolean;
  showDeliveryCharges: boolean;
  showPackagingCharges: boolean;
  showServiceCharge: boolean;
  // Footer & Branding
  showVisitAgain: boolean;
  showPoweredBy: boolean;
  // Layout Separators
  sepTop: boolean;
  sepCustomer: boolean;
  sepItemsHeader: boolean;
  sepTotalTop: boolean;
  sepTotalBottom: boolean;
  sepPayment: boolean;
  sepFooter: boolean;
  sepKOTInstructions: boolean;
  // KOT Settings
  showKOTToken: boolean;
  showKOTCustomer: boolean;
  showKOTBillNo: boolean;
  showKOTTime: boolean;
  showKOTInstructions: boolean;
  // QR
  showReviewQR: boolean;
}

interface PrintingSetupScreenProps {
  onBack: () => void;
  onPreview: (settings: PrintSettings, profile: any) => void;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  // Bill Settings
  showLogo: true,
  showTagline: true,
  showContact: true,
  showAddress: true,
  showGST: true,
  showFSSAI: true,
  showToken: true,
  showCustomerDetails: true,
  showTaxBreakup: true,
  showGreetings: true,
  showAmountInWords: true,
  showPaymentStatus: true,
  showFoodTypeSuffix: true,
  // Financial Summary
  showSubtotal: true,
  showDiscount: true,
  showTaxableAmt: true,
  showTotalTax: true,
  showDeliveryCharges: true,
  showPackagingCharges: true,
  showServiceCharge: true,
  // Footer & Branding
  showVisitAgain: true,
  showPoweredBy: true,
  // Layout Separators
  sepTop: true,
  sepCustomer: true,
  sepItemsHeader: true,
  sepTotalTop: true,
  sepTotalBottom: true,
  sepPayment: true,
  sepFooter: true,
  sepKOTInstructions: true,
  // KOT Settings
  showKOTToken: true,
  showKOTCustomer: true,
  showKOTBillNo: true,
  showKOTTime: true,
  showKOTInstructions: true,
  // QR
  showReviewQR: false,
};

interface ToggleRow {
  key: keyof PrintSettings;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

const BILL_TOGGLES: ToggleRow[] = [
  { key: "showLogo", label: "Business Logo", desc: "Your restaurant logo", icon: "image-outline", color: "#3B82F6" },
  { key: "showTagline", label: "Tagline", desc: "Catchy business slogan", icon: "chatbubble-ellipses-outline", color: "#6366F1" },
  { key: "showContact", label: "Contact Info", desc: "Phone numbers & WhatsApp", icon: "call-outline", color: "#10B981" },
  { key: "showAddress", label: "Address", desc: "Full store address", icon: "location-outline", color: "#EF4444" },
  { key: "showGST", label: "GST Number", desc: "Business GSTIN details", icon: "document-text-outline", color: "#F59E0B" },
  { key: "showFSSAI", label: "FSSAI Number", desc: "Food license details", icon: "shield-checkmark-outline", color: "#F97316" },
  { key: "showToken", label: "Token Number", desc: "Order sequence token", icon: "pricetag-outline", color: "#EC4899" },
  { key: "showCustomerDetails", label: "Customer Info", desc: "Name, Phone, Address", icon: "person-outline", color: "#8B5CF6" },
  { key: "showTaxBreakup", label: "Tax Breakup", desc: "GST Rate table", icon: "calculator-outline", color: "#06B6D4" },
  { key: "showGreetings", label: "Greetings", desc: "Thank you message", icon: "heart-outline", color: "#14B8A6" },
  { key: "showAmountInWords", label: "Amt in Words", desc: "Convert total to text", icon: "text-outline", color: "#64748B" },
  { key: "showPaymentStatus", label: "Payment Info", desc: "Mode & Status", icon: "checkmark-circle-outline", color: "#2563EB" },
  { key: "showFoodTypeSuffix", label: "Food Type Suffix", desc: "Show (V), (NV) or (R)", icon: "leaf-outline", color: "#DC2626" },
];

const FINANCIAL_TOGGLES: ToggleRow[] = [
  { key: "showSubtotal", label: "Subtotal", desc: "Sum before taxes", icon: "cash-outline", color: "#10B981" },
  { key: "showDiscount", label: "Discount", desc: "Offer & coupon lines", icon: "pricetag-outline", color: "#F59E0B" },
  { key: "showTaxableAmt", label: "Taxable Amount", desc: "Amount liable for tax", icon: "receipt-outline", color: "#06B6D4" },
  { key: "showTotalTax", label: "Total GST", desc: "Sum of CGST+SGST", icon: "calculator-outline", color: "#3B82F6" },
  { key: "showDeliveryCharges", label: "Delivery Fee", desc: "Shipping/Delivery line", icon: "bicycle-outline", color: "#6366F1" },
  { key: "showPackagingCharges", label: "Packaging", desc: "Container/Packing line", icon: "cube-outline", color: "#8B5CF6" },
  { key: "showServiceCharge", label: "Service Charge", desc: "Additional service fee", icon: "people-outline", color: "#EF4444" },
];

const FOOTER_TOGGLES: ToggleRow[] = [
  { key: "showVisitAgain", label: "Visit Again", desc: "Greeting footer line", icon: "happy-outline", color: "#475569" },
  { key: "showPoweredBy", label: "Powered By", desc: "Kravy branding line", icon: "flash-outline", color: "#7C3AED" },
];

const SEPARATOR_TOGGLES: ToggleRow[] = [
  { key: "sepTop", label: "Top Header Line", desc: "Divider at the very top", icon: "remove-outline", color: "#64748B" },
  { key: "sepCustomer", label: "Customer Divider", desc: "Line after customer info", icon: "remove-outline", color: "#94A3B8" },
  { key: "sepItemsHeader", label: "Items Header Line", desc: "Divider for item column names", icon: "remove-outline", color: "#64748B" },
  { key: "sepTotalTop", label: "Total Top Line", desc: "Divider before Grand Total", icon: "remove-outline", color: "#475569" },
  { key: "sepTotalBottom", label: "Total Bottom Line", desc: "Divider after Grand Total", icon: "remove-outline", color: "#334155" },
  { key: "sepPayment", label: "Payment Divider", desc: "Line before payment mode", icon: "remove-outline", color: "#64748B" },
  { key: "sepFooter", label: "Footer Divider", desc: "Line before greetings", icon: "remove-outline", color: "#94A3B8" },
  { key: "sepKOTInstructions", label: "KOT Note Border", desc: "Box around chef notes", icon: "remove-outline", color: "#64748B" },
];

const KOT_TOGGLES: ToggleRow[] = [
  { key: "showKOTToken", label: "KOT Token", desc: "Token number for chefs", icon: "pricetag-outline", color: "#EF4444" },
  { key: "showKOTCustomer", label: "KOT Customer", desc: "Customer name on KOT", icon: "person-outline", color: "#F97316" },
  { key: "showKOTBillNo", label: "Bill Reference", desc: "Invoice # on KOT", icon: "receipt-outline", color: "#6366F1" },
  { key: "showKOTTime", label: "Print Time", desc: "Current time on KOT", icon: "time-outline", color: "#3B82F6" },
  { key: "showKOTInstructions", label: "Instructions", desc: "Chef notes & modifications", icon: "chatbubbles-outline", color: "#10B981" },
];

const QR_TOGGLES: ToggleRow[] = [
  { key: "showReviewQR", label: "Feedback QR", desc: "Scan to review on Google", icon: "qr-code-outline", color: "#F97316" },
];

const PrintingSetupScreen: React.FC<PrintingSetupScreenProps> = ({ onBack, onPreview }) => {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [savedGoogleReviewLink, setSavedGoogleReviewLink] = useState("");
  const [popup, setPopup] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const hasChanges =
    JSON.stringify(printSettings) !== JSON.stringify(savedSettings) ||
    googleReviewLink !== savedGoogleReviewLink;

  useEffect(() => {
    loadPrintSettings();
  }, []);

  const loadPrintSettings = async () => {
    try {
      // 1. Load print settings from AsyncStorage INSTANTLY
      const cached = await AsyncStorage.getItem(PRINT_SETTING_KEY);
      if (cached) {
        const parsed = { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(cached) };
        setPrintSettings(parsed);
        setSavedSettings(parsed);
      }

      // 2. Load business profile from cache immediately (for preview)
      const cachedProfile = await AsyncStorage.getItem("@cached_company_profile");
      if (cachedProfile) {
        const parsedProfile = JSON.parse(cachedProfile);
        setBusinessProfile(parsedProfile);
        setGoogleReviewLink(parsedProfile.googleReviewLink || "");
        setSavedGoogleReviewLink(parsedProfile.googleReviewLink || "");
      }

      setLoading(false);

      // 3. Silently refresh from backend in background
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      if (finalToken) {
        const profile: any = await getRecentCompanyProfile(finalToken);
        if (profile) {
          // Always update businessProfile with fresh data
          setBusinessProfile(profile);
          setGoogleReviewLink(profile.googleReviewLink || "");
          setSavedGoogleReviewLink(profile.googleReviewLink || "");

          if (profile.printSettings) {
            const merged = { ...DEFAULT_PRINT_SETTINGS, ...profile.printSettings };
            setPrintSettings(merged);
            setSavedSettings(merged);
            await AsyncStorage.setItem(PRINT_SETTING_KEY, JSON.stringify(merged));
          }
        }
      }
    } catch (e) {
      console.error("Failed to load print settings:", e);
      setLoading(false);
    }
  };

  const toggle = useCallback((key: keyof PrintSettings) => {
    setPrintSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save print settings locally
      await AsyncStorage.setItem(PRINT_SETTING_KEY, JSON.stringify(printSettings));

      // Update @cached_company_profile locally
      const cachedProfileStr = await AsyncStorage.getItem("@cached_company_profile");
      let updatedProfile = businessProfile;
      if (cachedProfileStr) {
        const parsed = JSON.parse(cachedProfileStr);
        parsed.googleReviewLink = googleReviewLink;
        await AsyncStorage.setItem("@cached_company_profile", JSON.stringify(parsed));
        updatedProfile = parsed;
        setBusinessProfile(parsed);
      } else if (businessProfile) {
        const parsed = { ...businessProfile, googleReviewLink };
        await AsyncStorage.setItem("@cached_company_profile", JSON.stringify(parsed));
        updatedProfile = parsed;
        setBusinessProfile(parsed);
      }

      // Update @cached_business_profile locally
      const cachedBizProfileStr = await AsyncStorage.getItem("@cached_business_profile");
      if (cachedBizProfileStr) {
        const parsed = JSON.parse(cachedBizProfileStr);
        if (parsed.data) {
          parsed.data.googleReviewLink = googleReviewLink;
        } else {
          parsed.googleReviewLink = googleReviewLink;
        }
        await AsyncStorage.setItem("@cached_business_profile", JSON.stringify(parsed));
      }

      // Save to backend
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;
      if (finalToken) {
        await updateBusinessSettings(finalToken, { printSettings, googleReviewLink });
      }

      setSavedSettings(printSettings);
      setSavedGoogleReviewLink(googleReviewLink);
      setPopup({
        visible: true,
        type: "success",
        title: "Settings Saved! ✅",
        message: "Your printing preferences have been successfully updated.",
      });
    } catch (e) {
      setPopup({
        visible: true,
        type: "error",
        title: "Failed to Save ❌",
        message: "An error occurred while saving your preferences. Please try again.",
      });
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const renderToggleRow = (item: ToggleRow) => (
    <View key={item.key as string} style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: item.color + "18" }]}>
        <Ionicons name={item.icon as any} size={rf(18)} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{item.label}</Text>
        <Text style={styles.toggleDesc} numberOfLines={1}>{item.desc}</Text>
      </View>
      <Switch
        value={printSettings[item.key]}
        onValueChange={() => toggle(item.key)}
        trackColor={{ false: "#E5E7EB", true: COLORS.green + "60" }}
        thumbColor={printSettings[item.key] ? COLORS.green : "#9CA3AF"}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );

  const renderSection = (title: string, icon: string, color: string, rows: ToggleRow[]) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={row.key as string}>
            {renderToggleRow(row)}
            {row.key === "showReviewQR" && printSettings.showReviewQR && (
              <View style={styles.reviewInputContainer}>
                <Text style={styles.inputLabel}>Google Review URL / Link</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="link-outline" size={rf(16)} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Enter your Google Review Link..."
                    placeholderTextColor={COLORS.textLight + "80"}
                    value={googleReviewLink}
                    onChangeText={setGoogleReviewLink}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
                <Text style={styles.inputHint}>
                  This link will be converted to a QR code at the bottom of the bill.
                </Text>
              </View>
            )}
            {i < rows.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={rf(22)} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Print Customizer</Text>
          <Text style={styles.headerSub}>Design your Bill & KOT layout</Text>
        </View>
        {/* Preview Button */}
        <TouchableOpacity
          style={styles.previewBtn}
          onPress={() => onPreview(printSettings, { ...businessProfile, googleReviewLink })}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={rf(18)} color={COLORS.primary} />
          <Text style={styles.previewBtnText}>Preview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBanner}>
          <Ionicons name="print-outline" size={rf(20)} color={COLORS.primary} />
          <Text style={styles.infoBannerText}>
            Choose what appears on your printed receipts and KOT slips.
          </Text>
        </View>

        {renderSection("Bill (Receipt) Layout", "receipt-outline", "#4F46E5", BILL_TOGGLES)}
        {renderSection("Financial Summary", "cash-outline", "#10B981", FINANCIAL_TOGGLES)}
        {renderSection("Footer & Branding", "star-outline", "#475569", FOOTER_TOGGLES)}
        {renderSection("Layout Separators", "remove-circle-outline", "#64748B", SEPARATOR_TOGGLES)}
        {renderSection("KOT (Kitchen) Layout", "restaurant-outline", "#EF4444", KOT_TOGGLES)}
        {renderSection("QR Code & Digital", "qr-code-outline", "#F97316", QR_TOGGLES)}

        <View style={{ height: vs(100) }} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveBar, { paddingBottom: vs(12) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={hasChanges ? handleSave : undefined}
          activeOpacity={hasChanges ? 0.8 : 1}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={rf(18)} color="#fff" />
              <Text style={styles.saveBtnText}>
                {hasChanges ? "Save Changes" : "No Changes"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Premium Custom Success/Error Popup Modal */}
      <Modal
        visible={popup.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[
              styles.modalIconContainer,
              { backgroundColor: popup.type === "success" ? "#10B98115" : "#EF444415" }
            ]}>
              <Ionicons
                name={popup.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={rf(44)}
                color={popup.type === "success" ? "#10B981" : "#EF4444"}
              />
            </View>
            <Text style={styles.modalTitle}>{popup.title}</Text>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: popup.type === "success" ? "#10B981" : "#EF4444" }
              ]}
              onPress={() => setPopup((prev) => ({ ...prev, visible: false }))}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PrintingSetupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loadingText: { marginTop: vs(12), fontSize: rf(14), color: COLORS.textLight, fontWeight: "600" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: s(16), paddingVertical: vs(8),
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  backBtn: {
    width: s(38), height: s(38), borderRadius: s(12),
    backgroundColor: "#F3F4F6", alignItems: "center",
    justifyContent: "center", marginRight: s(12),
  },
  headerTitle: { fontSize: rf(17), fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: rf(11), color: COLORS.textLight, fontWeight: "500", marginTop: 1 },
  previewBtn: {
    flexDirection: "row", alignItems: "center", gap: s(4),
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: s(12), paddingVertical: vs(7), borderRadius: s(10),
  },
  previewBtnText: { fontSize: rf(12), fontWeight: "700", color: COLORS.primary },
  scrollContent: { padding: s(16), paddingTop: 0 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: s(10),
    backgroundColor: COLORS.primary + "10", borderRadius: s(14),
    padding: s(10), marginBottom: vs(6),
    borderWidth: 1, borderColor: COLORS.primary + "20",
  },
  infoBannerText: { flex: 1, fontSize: rf(12), color: COLORS.primary, fontWeight: "600", lineHeight: rf(18) },
  section: { marginBottom: vs(14) },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: s(8), marginBottom: vs(8), paddingHorizontal: s(4) },
  sectionDot: { width: s(8), height: s(8), borderRadius: s(4) },
  sectionTitle: { fontSize: rf(11), fontWeight: "800", color: COLORS.textLight, letterSpacing: 1.5, textTransform: "uppercase" },
  card: {
    backgroundColor: COLORS.card, borderRadius: s(18), paddingHorizontal: s(16),
    shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: vs(10), gap: s(12) },
  toggleIcon: { width: s(36), height: s(36), borderRadius: s(10), alignItems: "center", justifyContent: "center" },
  toggleLabel: { fontSize: rf(13), fontWeight: "700", color: COLORS.text, marginBottom: 2 },
  toggleDesc: { fontSize: rf(11), color: COLORS.textLight, fontWeight: "400" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: s(48) },
  saveBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, paddingHorizontal: s(16), paddingTop: vs(12),
    borderTopWidth: 1, borderTopColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: s(8), backgroundColor: COLORS.primary, borderRadius: s(14), paddingVertical: vs(14),
  },
  saveBtnDisabled: { backgroundColor: "#D1D5DB" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: rf(14), letterSpacing: 0.3 },
  reviewInputContainer: {
    marginTop: vs(4),
    marginBottom: vs(12),
    paddingHorizontal: s(4),
  },
  inputLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: vs(6),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: s(10),
  },
  inputIcon: {
    marginRight: s(6),
  },
  reviewInput: {
    flex: 1,
    height: vs(38),
    fontSize: rf(13),
    color: COLORS.text,
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: rf(10),
    color: COLORS.textLight,
    marginTop: vs(4),
    lineHeight: rf(14),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: s(24),
  },
  modalContainer: {
    width: "85%",
    backgroundColor: COLORS.card,
    borderRadius: s(20),
    paddingHorizontal: s(20),
    paddingVertical: vs(24),
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.08)",
  },
  modalIconContainer: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(16),
  },
  modalTitle: {
    fontSize: rf(16),
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: vs(8),
  },
  modalMessage: {
    fontSize: rf(12),
    color: COLORS.textLight,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: rf(16),
    marginBottom: vs(20),
    paddingHorizontal: s(8),
  },
  modalButton: {
    width: "100%",
    paddingVertical: vs(11),
    borderRadius: s(12),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: rf(13),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
