import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
  text: "#111827",
  textLight: "#6B7280",
  primary: "#4F46E5",
};

const DEFAULT_SETTINGS = {
  showLogo: true, showTagline: true, showContact: true, showAddress: true,
  showGST: true, showFSSAI: true, showToken: true, showCustomerDetails: true,
  showTaxBreakup: true, showGreetings: true, showAmountInWords: true,
  showPaymentStatus: true, showFoodTypeSuffix: true,
  showSubtotal: true, showDiscount: true, showTaxableAmt: true,
  showTotalTax: true, showDeliveryCharges: true,
  showPackagingCharges: true, showServiceCharge: true,
  showVisitAgain: true, showPoweredBy: true,
  sepTop: true, sepCustomer: true, sepItemsHeader: true,
  sepTotalTop: true, sepTotalBottom: true, sepPayment: true,
  sepFooter: true, sepKOTInstructions: true,
  showReviewQR: false,

  businessNameSize: 18, businessAddressSize: 11, taglineSize: 11,
  receiptTokenSize: 28, itemsFontSize: 11, totalFontSize: 13,
  detailsFontSize: 10, greetingFontSize: 12,

  fontFamily: "", fontWeight: "", businessNameWeight: "",
  businessAddressWeight: "", taglineWeight: "", receiptTokenWeight: "",
  itemsWeight: "", totalWeight: "", detailsWeight: "", greetingWeight: "",
};

const getSafeFont = (cssFontStr: string | undefined | null) => {
  if (!cssFontStr) return undefined;
  const lower = cssFontStr.toLowerCase();
  if (lower.includes("courier") || lower.includes("monospace")) return "monospace";
  if (lower.includes("georgia") || lower.includes("times") || lower.includes("serif")) return "serif";
  return "sans-serif";
};

const getSafeWeight = (specific: string | undefined | null, global: string | undefined | null, fallback: any): any => {
  const w = specific || global;
  if (!w) return fallback;
  return w as any;
};

function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
  return numberToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numberToWords(n % 100000) : "");
}

interface CartItem {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
  isVeg?: boolean;
}

interface BillPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  totals?: any;
  tokenNo?: string | number;
  customerInfo?: { name?: string; phone?: string; address?: string };
}

export const BillPreviewModal: React.FC<BillPreviewModalProps> = ({
  visible,
  onClose,
  cartItems,
  totalAmount,
  totals,
  tokenNo,
  customerInfo
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [profile, setProfile] = useState<any>(null);
  const [printSettings, setPrintSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setZoom(1.0);
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      let loadedProfile = null;
      const bpRaw = await AsyncStorage.getItem("@cached_business_profile");
      if (bpRaw) {
        loadedProfile = JSON.parse(bpRaw);
      } else {
        const cpRaw = await AsyncStorage.getItem("@cached_company_profile");
        if (cpRaw) {
          loadedProfile = JSON.parse(cpRaw);
        }
      }
      setProfile(loadedProfile || {});

      const settingsRaw = await AsyncStorage.getItem("print_settings");
      if (settingsRaw) {
        setPrintSettings(JSON.parse(settingsRaw));
      } else if (loadedProfile?.printSettings) {
        setPrintSettings(loadedProfile.printSettings);
      }
    } catch (e) {
      console.log("Error loading preview data", e);
    } finally {
      setLoading(false);
    }
  };

  const ps = { ...DEFAULT_SETTINGS, ...printSettings };
  const show = (key: string) => ps[key as keyof typeof DEFAULT_SETTINGS] !== false;

  const globalFont = getSafeFont(ps.fontFamily);
  const globalWeight = ps.fontWeight;
  const bizNameSize = ps.businessNameSize || DEFAULT_SETTINGS.businessNameSize;
  const bizNameWeight = getSafeWeight(ps.businessNameWeight, globalWeight, "bold");
  const bizAddressSize = ps.businessAddressSize || DEFAULT_SETTINGS.businessAddressSize;
  const bizAddressWeight = getSafeWeight(ps.businessAddressWeight, globalWeight, "normal");
  const taglineSize = ps.taglineSize || DEFAULT_SETTINGS.taglineSize;
  const taglineWeight = getSafeWeight(ps.taglineWeight, globalWeight, "normal");
  const detailsSize = ps.detailsFontSize || DEFAULT_SETTINGS.detailsFontSize;
  const detailsWeight = getSafeWeight(ps.detailsWeight, globalWeight, "normal");
  const detailsBoldWeight = getSafeWeight(ps.detailsWeight, globalWeight, "700");
  const itemsSize = ps.itemsFontSize || DEFAULT_SETTINGS.itemsFontSize;
  const itemsWeight = getSafeWeight(ps.itemsWeight, globalWeight, "normal");
  const itemsBoldWeight = getSafeWeight(ps.itemsWeight, globalWeight, "800");
  const totalSize = ps.totalFontSize || DEFAULT_SETTINGS.totalFontSize;
  const totalWeight = getSafeWeight(ps.totalWeight, globalWeight, "bold");
  const greetingSize = ps.greetingFontSize || DEFAULT_SETTINGS.greetingFontSize;
  const greetingWeight = getSafeWeight(ps.greetingWeight, globalWeight, "normal");
  const receiptTokenSize = ps.receiptTokenSize || DEFAULT_SETTINGS.receiptTokenSize;
  const receiptTokenWeight = getSafeWeight(ps.receiptTokenWeight, globalWeight, "900");

  const bizName = profile?.companyName || profile?.businessName || "Your Business";
  const bizTagline = profile?.businessTagLine || profile?.businessTagline || "";
  const bizAddress = profile?.businessAddress || profile?.companyAddress || profile?.address || "";
  const bizPhone = profile?.contactPersonPhone || profile?.companyPhone || profile?.businessPhone || profile?.phone || "";
  const bizGST = profile?.gstNumber || "";
  const bizFSSAI = profile?.fssaiNumber || profile?.businessFSSAI || "";
  const bizLogo = profile?.logoUrl || profile?.logo || "";
  const reviewLink = profile?.googleReviewLink || "";

  // Financial calculations from cart
  const subtotal = totals?.subtotal ?? cartItems.reduce((acc, item) => acc + ((item.editedPrice ?? item.price ?? 0) * item.quantity), 0);
  const discountAmt = totals?.discountAmount ?? 0;
  const packagingAmt = totals?.packagingChargeAmount ?? 0;
  const deliveryAmt = totals?.deliveryChargeAmount ?? 0;
  const serviceAmt = totals?.serviceChargeAmount ?? 0;
  const taxableAmt = totals?.taxableAmount ?? (subtotal - discountAmt);

  const totalGlobalGst = totals?.globalGstTotal ?? 0;
  const totalPerProductGst = totals?.perProductGstTotals ? Object.values(totals.perProductGstTotals).reduce((a: any, b: any) => a + Number(b), 0) as number : 0;
  const totalTaxAmount = totals ? (totalGlobalGst + totalPerProductGst) : parseFloat((taxableAmt * 0.05).toFixed(2));

  const finalTotal = totals?.totalDue ?? (totalAmount || (taxableAmt + totalTaxAmount + packagingAmt + deliveryAmt + serviceAmt));

  const Separator = ({ dashed = false }: { dashed?: boolean }) => (
    <View style={{
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      borderStyle: dashed ? "dashed" : "solid",
      marginVertical: 3,
    }} />
  );

  const Row = ({ left, right, bold = false, size = detailsSize, weight = detailsWeight, boldWeight = detailsBoldWeight, font = globalFont }: any) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 1 }}>
      <Text style={{ fontFamily: font, fontSize: size, fontWeight: bold ? boldWeight : weight, color: "#000" }}>{left}</Text>
      <Text style={{ fontFamily: font, fontSize: size, fontWeight: bold ? boldWeight : weight, color: "#000" }}>{right}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={rf(22)} color={COLORS.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, paddingLeft: s(10) }}>
              <Text style={styles.headerTitle}>Live Bill Preview</Text>
              <Text style={styles.headerSub}>With your print settings</Text>
            </View>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))} activeOpacity={0.7}>
              <Ionicons name="remove" size={rf(18)} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom((z) => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))} activeOpacity={0.7}>
              <Ionicons name="add" size={rf(18)} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={[styles.previewArea, { justifyContent: "center", alignItems: "center" }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.previewArea}
              contentContainerStyle={styles.previewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.paper, {
                transform: [{ scale: zoom }],
                marginVertical: zoom > 1 ? vs(zoom * 40) : vs(10),
              }]}>

                {show("sepTop") && <Separator />}

                {show("showLogo") && bizLogo ? (
                  <View style={{ alignItems: "center", marginBottom: 4 }}>
                    <Image source={{ uri: bizLogo }} style={{ width: 56, height: 56, borderRadius: 4 }} resizeMode="contain" />
                  </View>
                ) : show("showLogo") && (
                  <View style={{ alignItems: "center", marginBottom: 4 }}>
                    <View style={{ width: 50, height: 50, backgroundColor: "#EEE", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="image-outline" size={24} color="#999" />
                    </View>
                  </View>
                )}

                <Text style={{ fontFamily: globalFont, textAlign: "center", fontWeight: bizNameWeight, fontSize: bizNameSize, color: "#000" }}>
                  {bizName}
                </Text>

                {show("showTagline") && bizTagline ? (
                  <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: taglineSize, fontWeight: taglineWeight, fontStyle: "italic", color: "#000", marginTop: 1 }}>
                    {bizTagline}
                  </Text>
                ) : null}

                {show("showAddress") && bizAddress ? (
                  <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: bizAddressSize, fontWeight: bizAddressWeight, color: "#000", marginTop: 2 }}>
                    {bizAddress}
                  </Text>
                ) : null}

                {show("showContact") && bizPhone ? (
                  <Text style={{ fontFamily: globalFont, textAlign: "center", fontWeight: detailsBoldWeight, fontSize: detailsSize, marginTop: 2, color: "#000" }}>
                    Mob: {bizPhone}
                  </Text>
                ) : null}

                {show("showGST") && bizGST ? (
                  <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#000", paddingVertical: 2, marginTop: 3 }}>
                    <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: detailsSize, fontWeight: detailsBoldWeight, color: "#000" }}>
                      GSTIN: {bizGST}
                    </Text>
                  </View>
                ) : null}

                {show("showFSSAI") && bizFSSAI ? (
                  <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: detailsSize, fontWeight: detailsBoldWeight, color: "#000", marginTop: 2 }}>
                    FSSAI: {bizFSSAI}
                  </Text>
                ) : null}

                <Separator dashed />

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontFamily: globalFont, fontWeight: detailsBoldWeight, fontSize: detailsSize, color: "#000" }}>BILL SUMMARY</Text>
                  {show("showToken") && (
                    <View style={{ borderWidth: 2, borderColor: "#000", paddingHorizontal: 3 }}>
                      <Text style={{ fontFamily: globalFont, fontSize: receiptTokenSize, fontWeight: receiptTokenWeight, color: "#000" }}>#{tokenNo || "01"}</Text>
                    </View>
                  )}
                </View>

                <Row left="Date:" right={new Date().toLocaleDateString("en-IN")} />

                {show("showCustomerDetails") && (
                  <>
                    {show("sepCustomer") && <Separator dashed />}
                    <Text style={{ fontFamily: globalFont, fontWeight: detailsBoldWeight, fontSize: detailsSize, color: "#000", marginBottom: 1 }}>Customer:</Text>
                    <Text style={{ fontFamily: globalFont, fontSize: detailsSize, fontWeight: detailsWeight, color: "#000" }}>{customerInfo?.name || "Walk-in"}</Text>
                    {!!customerInfo?.phone && (
                      <Text style={{ fontFamily: globalFont, fontSize: detailsSize, fontWeight: detailsWeight, color: "#000" }}>{customerInfo.phone}</Text>
                    )}
                    {!!customerInfo?.address && (
                      <Text style={{ fontFamily: globalFont, fontSize: detailsSize, fontWeight: detailsWeight, color: "#000" }}>{customerInfo.address}</Text>
                    )}
                  </>
                )}

                {show("sepItemsHeader") && <Separator dashed />}
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={{ fontFamily: globalFont, flex: 1, fontSize: itemsSize, fontWeight: itemsBoldWeight, color: "#000" }}>ITEM</Text>
                  <Text style={{ fontFamily: globalFont, width: 20, fontSize: itemsSize, fontWeight: itemsBoldWeight, textAlign: "center", color: "#000" }}>QT</Text>
                  <Text style={{ fontFamily: globalFont, width: 38, fontSize: itemsSize, fontWeight: itemsBoldWeight, textAlign: "right", color: "#000" }}>AMT</Text>
                </View>
                <Separator />

                {cartItems.length > 0 ? cartItems.map((item, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: 2 }}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 2 }}>
                      {show("showFoodTypeSuffix") && item.isVeg !== undefined && (
                        <View style={{ width: 8, height: 8, borderWidth: 1, borderColor: item.isVeg ? "#16A34A" : "#ef4444", borderRadius: 1, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: item.isVeg ? "#16A34A" : "#ef4444" }} />
                        </View>
                      )}
                      <Text style={{ fontFamily: globalFont, fontSize: itemsSize, fontWeight: itemsWeight, color: "#000", flex: 1 }}>{item.name}</Text>
                    </View>
                    <Text style={{ fontFamily: globalFont, width: 20, fontSize: itemsSize, fontWeight: itemsWeight, textAlign: "center", color: "#000" }}>{item.quantity}</Text>
                    <Text style={{ fontFamily: globalFont, width: 38, fontSize: itemsSize, fontWeight: itemsWeight, textAlign: "right", color: "#000" }}>
                      ₹{((item.editedPrice ?? item.price ?? 0) * item.quantity).toFixed(0)}
                    </Text>
                  </View>
                )) : (
                  <Text style={{ fontFamily: globalFont, fontSize: itemsSize, textAlign: "center", marginTop: 5, color: "#555" }}>Cart is empty</Text>
                )}

                {show("sepTotalTop") && <Separator />}

                {show("showSubtotal") && <Row left="Subtotal" right={`₹${subtotal.toFixed(2)}`} />}
                {show("showDiscount") && discountAmt > 0 && <Row left="Discount" right={`-₹${discountAmt.toFixed(2)}`} />}
                {show("showTaxableAmt") && <Row left="Taxable Amount" right={`₹${taxableAmt.toFixed(2)}`} />}

                {show("showTaxBreakup") && totalTaxAmount > 0 && (
                  <>
                    <Separator dashed />
                    <Text style={{ fontFamily: globalFont, fontSize: detailsSize, fontWeight: detailsBoldWeight, color: "#000", marginBottom: 1 }}>TAX BREAKUP:</Text>
                    {totals?.globalGstTotal > 0 && (
                      <>
                        <Row left={`CGST @${(totals.globalGstRate / 2).toFixed(1).replace('.0', '')}%`} right={`₹${(totals.globalGstTotal / 2).toFixed(2)}`} />
                        <Row left={`SGST @${(totals.globalGstRate / 2).toFixed(1).replace('.0', '')}%`} right={`₹${(totals.globalGstTotal / 2).toFixed(2)}`} />
                      </>
                    )}
                    {totals?.perProductGstTotals && Object.entries(totals.perProductGstTotals).map(([rate, amount]: any) => (
                      <React.Fragment key={rate}>
                        <Row left={`CGST @${(Number(rate) / 2).toFixed(1).replace('.0', '')}%`} right={`₹${(Number(amount) / 2).toFixed(2)}`} />
                        <Row left={`SGST @${(Number(rate) / 2).toFixed(1).replace('.0', '')}%`} right={`₹${(Number(amount) / 2).toFixed(2)}`} />
                      </React.Fragment>
                    ))}
                    {!totals && (
                      <>
                        <Row left="CGST @2.5%" right={`₹${(totalTaxAmount / 2).toFixed(2)}`} />
                        <Row left="SGST @2.5%" right={`₹${(totalTaxAmount / 2).toFixed(2)}`} />
                      </>
                    )}
                  </>
                )}

                {show("showTotalTax") && totalTaxAmount > 0 && <Row left="Total GST" right={`₹${totalTaxAmount.toFixed(2)}`} />}
                {show("showPackagingCharges") && packagingAmt > 0 && <Row left="Packaging" right={`+₹${packagingAmt.toFixed(2)}`} />}
                {show("showDeliveryCharges") && deliveryAmt > 0 && <Row left="Delivery" right={`+₹${deliveryAmt.toFixed(2)}`} />}
                {show("showServiceCharge") && serviceAmt > 0 && <Row left="Service Charge" right={`+₹${serviceAmt.toFixed(2)}`} />}
                {show("showServiceCharge") && totals?.serviceGstAmount > 0 && <Row left={`GST on Service`} right={`+₹${totals.serviceGstAmount.toFixed(2)}`} />}
                {show("showDeliveryCharges") && totals?.deliveryGstAmount > 0 && <Row left={`GST on Delivery`} right={`+₹${totals.deliveryGstAmount.toFixed(2)}`} />}
                {show("showPackagingCharges") && totals?.packagingGstAmount > 0 && <Row left={`GST on Packaging`} right={`+₹${totals.packagingGstAmount.toFixed(2)}`} />}

                {show("sepTotalBottom") && <Separator />}
                <Row left="TOTAL" right={`₹${finalTotal.toFixed(2)}`} bold size={totalSize} weight={totalWeight} boldWeight={totalWeight} />

                {show("showAmountInWords") && finalTotal > 0 && (
                  <Text style={{ fontFamily: globalFont, fontSize: detailsSize - 2, fontWeight: detailsWeight, fontStyle: "italic", color: "#000", marginTop: 2 }}>
                    {numberToWords(Math.round(finalTotal))} Rupees Only
                  </Text>
                )}

                {show("showGreetings") && (
                  <>
                    {show("sepFooter") && <Separator dashed />}
                    <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: greetingSize, fontWeight: greetingWeight, fontStyle: "italic", color: "#000" }}>
                      Thank you for visiting! 🙏
                    </Text>
                  </>
                )}
                {show("showVisitAgain") && (
                  <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: greetingSize - 1, fontWeight: greetingWeight, color: "#000" }}>Please visit again soon</Text>
                )}

                {show("showReviewQR") && (
                  <>
                    <Separator dashed />
                    <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: detailsSize, fontWeight: detailsBoldWeight, color: "#000", marginBottom: 2 }}>
                      Rate Us on Google ⭐
                    </Text>
                    <View style={{ alignSelf: "center", marginVertical: 4 }}>
                      {reviewLink ? (
                        <QRCode value={reviewLink} size={60} color="#000" backgroundColor="#fff" />
                      ) : (
                        <View style={{ width: 60, height: 60, backgroundColor: "#EEE", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="qr-code-outline" size={24} color="#999" />
                        </View>
                      )}
                    </View>
                  </>
                )}

                {show("showPoweredBy") && (
                  <View style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: "#000", marginTop: 6, paddingTop: 4 }}>
                    <Text style={{ fontFamily: globalFont, textAlign: "center", fontSize: detailsSize - 3, color: "#000" }}>
                      Powered by Kravy Billing
                    </Text>
                  </View>
                )}

              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#E5E5E5",
    height: "90%",
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: s(16), paddingVertical: vs(12),
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: s(6),
  },
  closeBtn: {
    width: s(38), height: s(38), borderRadius: s(12),
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: rf(17), fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: rf(11), color: COLORS.textLight, fontWeight: "500", marginTop: 1 },
  zoomBtn: {
    width: s(32), height: s(32), borderRadius: s(10),
    backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center",
  },
  zoomText: {
    fontSize: rf(12), fontWeight: "800", color: COLORS.primary,
    minWidth: s(36), textAlign: "center",
  },
  previewArea: { flex: 1 },
  previewContent: { alignItems: "center", paddingVertical: vs(20), paddingHorizontal: s(16) },
  paper: {
    backgroundColor: "#FFFFFF", width: 220, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, borderRadius: 2,
  },
});
