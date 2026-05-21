import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

// Sample order items for preview (same as website uses dummy items)
const PREVIEW_ITEMS = [
  { name: "Paneer Butter Masala", qty: 2, rate: 250, isVeg: true },
  { name: "Butter Naan", qty: 4, rate: 40, isVeg: true },
  { name: "Cold Coffee", qty: 1, rate: 120, isVeg: true },
];

const DEFAULT_SETTINGS = {
  // Bill
  showLogo: true, showTagline: true, showContact: true, showAddress: true,
  showGST: true, showFSSAI: true, showToken: true, showCustomerDetails: true,
  showTaxBreakup: true, showGreetings: true, showAmountInWords: true,
  showPaymentStatus: true, showFoodTypeSuffix: true,
  // Financial
  showSubtotal: true, showDiscount: true, showTaxableAmt: true,
  showTotalTax: true, showDeliveryCharges: true,
  showPackagingCharges: true, showServiceCharge: true,
  // Footer
  showVisitAgain: true, showPoweredBy: true,
  // Separators
  sepTop: true, sepCustomer: true, sepItemsHeader: true,
  sepTotalTop: true, sepTotalBottom: true, sepPayment: true,
  sepFooter: true, sepKOTInstructions: true,
  // KOT
  showKOTToken: true, showKOTCustomer: true, showKOTBillNo: true,
  showKOTTime: true, showKOTInstructions: true,
  // QR
  showReviewQR: false,
};

interface PrintingPreviewScreenProps {
  onBack: () => void;
  printSettings?: any;
  businessProfile?: any;
}

const PrintingPreviewScreen: React.FC<PrintingPreviewScreenProps> = ({ onBack, printSettings, businessProfile: propProfile }) => {
  const [zoom, setZoom] = useState(1.0);
  const [cachedProfile, setCachedProfile] = useState<any>(null);

  const ps = { ...DEFAULT_SETTINGS, ...(printSettings || {}) };
  const show = (key: string) => ps[key] !== false;

  // Use prop profile first, fall back to AsyncStorage cache
  const profile = propProfile || cachedProfile;

  // Load from cache as fallback (when prop is null/undefined)
  useEffect(() => {
    if (!propProfile) {
      AsyncStorage.getItem("@cached_company_profile")
        .then((raw) => { if (raw) setCachedProfile(JSON.parse(raw)); })
        .catch(() => { });
    }
  }, [propProfile]);

  // Real business data — from prop (direct, reliable) with fallbacks
  const bizName = profile?.companyName || "Your Business";
  const bizTagline = profile?.businessTagLine || "";
  const bizAddress = profile?.companyAddress || "";
  const bizPhone = profile?.companyPhone || "";
  const bizGST = profile?.gstNumber || "";
  const bizFSSAI = profile?.fssaiNumber || "";
  const bizLogo = profile?.logoUrl || "";
  const reviewLink = profile?.googleReviewLink || "";

  // Financial calculations (preview dummy order)
  const subtotal = PREVIEW_ITEMS.reduce((a, i) => a + i.qty * i.rate, 0); // 780
  const discountAmt = 50;
  const packagingAmt = 20;
  const deliveryAmt = 0;
  const serviceAmt = 0;
  const taxableAmt = subtotal - discountAmt; // 730
  const cgst = parseFloat((taxableAmt * 0.025).toFixed(2));
  const sgst = parseFloat((taxableAmt * 0.025).toFixed(2));
  const totalTax = cgst + sgst;
  const finalTotal = taxableAmt + totalTax + packagingAmt + deliveryAmt + serviceAmt;

  const Separator = ({ dashed = false }: { dashed?: boolean }) => (
    <View style={{
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      borderStyle: dashed ? "dashed" : "solid",
      marginVertical: 3,
    }} />
  );

  const Row = ({ left, right, bold = false }: { left: string; right: string; bold?: boolean }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 1 }}>
      <Text style={{ fontSize: 10, fontWeight: bold ? "700" : "400", color: "#000" }}>{left}</Text>
      <Text style={{ fontSize: 10, fontWeight: bold ? "700" : "400", color: "#000" }}>{right}</Text>
    </View>
  );

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, fontSize: 13, color: COLORS.textLight, fontWeight: "600" }}>
          Loading preview...
        </Text>
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
          <Text style={styles.headerTitle}>Bill Preview</Text>
          <Text style={styles.headerSub}>Live receipt preview</Text>
        </View>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))} activeOpacity={0.7}>
          <Ionicons name="remove" size={rf(18)} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom((z) => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))} activeOpacity={0.7}>
          <Ionicons name="add" size={rf(18)} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.previewArea}
        contentContainerStyle={styles.previewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── RECEIPT PAPER ── */}
        <View style={[styles.paper, {
          transform: [{ scale: zoom }],
          marginVertical: zoom > 1 ? vs(zoom * 40) : vs(10),
        }]}>

          {/* Separator: Top Header Line */}
          {show("sepTop") && <Separator />}

          {/* Logo */}
          {show("showLogo") && bizLogo ? (
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <Image
                source={{ uri: bizLogo }}
                style={{ width: 56, height: 56, borderRadius: 4 }}
                resizeMode="contain"
              />
            </View>
          ) : show("showLogo") && (
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <View style={{ width: 50, height: 50, backgroundColor: "#EEE", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="image-outline" size={24} color="#999" />
              </View>
            </View>
          )}

          {/* Business Name */}
          <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 14, color: "#000" }}>
            {bizName}
          </Text>

          {/* Tagline */}
          {show("showTagline") && bizTagline ? (
            <Text style={{ textAlign: "center", fontSize: 9, fontStyle: "italic", color: "#000", marginTop: 1 }}>
              {bizTagline}
            </Text>
          ) : null}

          {/* Address */}
          {show("showAddress") && bizAddress ? (
            <Text style={{ textAlign: "center", fontSize: 9, color: "#000", marginTop: 2 }}>
              {bizAddress}
            </Text>
          ) : null}

          {/* Contact */}
          {show("showContact") && bizPhone ? (
            <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 9, marginTop: 2, color: "#000" }}>
              Mob: {bizPhone}
            </Text>
          ) : null}

          {/* GST */}
          {show("showGST") && bizGST ? (
            <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#000", paddingVertical: 2, marginTop: 3 }}>
              <Text style={{ textAlign: "center", fontSize: 9, fontWeight: "bold", color: "#000" }}>
                GSTIN: {bizGST}
              </Text>
            </View>
          ) : null}

          {/* FSSAI */}
          {show("showFSSAI") && bizFSSAI ? (
            <Text style={{ textAlign: "center", fontSize: 9, fontWeight: "bold", color: "#000", marginTop: 2 }}>
              FSSAI: {bizFSSAI}
            </Text>
          ) : null}

          <Separator dashed />

          {/* Bill Info Row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontWeight: "800", fontSize: 9, color: "#000" }}>BILL SUMMARY</Text>
            {show("showToken") && (
              <View style={{ borderWidth: 2, borderColor: "#000", paddingHorizontal: 3 }}>
                <Text style={{ fontSize: 8, fontWeight: "900", color: "#000" }}>TOKEN #42</Text>
              </View>
            )}
          </View>
          <Row left="Bill No:" right="INV-2024-001" />
          <Row left="Date:" right={new Date().toLocaleDateString("en-IN")} />
          <Row left="Table:" right="Table 05" />

          {/* Customer Details */}
          {show("showCustomerDetails") && (
            <>
              {show("sepCustomer") && <Separator dashed />}
              <Text style={{ fontWeight: "700", fontSize: 10, color: "#000", marginBottom: 1 }}>Customer:</Text>
              <Text style={{ fontSize: 9, color: "#000" }}>Rahul Sharma</Text>
              <Text style={{ fontSize: 9, color: "#000" }}>9876543210</Text>
            </>
          )}

          {/* Items */}
          {show("sepItemsHeader") && <Separator dashed />}
          <View style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: "800", color: "#000" }}>ITEM</Text>
            <Text style={{ width: 20, fontSize: 9, fontWeight: "800", textAlign: "center", color: "#000" }}>QT</Text>
            <Text style={{ width: 38, fontSize: 9, fontWeight: "800", textAlign: "right", color: "#000" }}>AMT</Text>
          </View>
          <Separator />

          {PREVIEW_ITEMS.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 2 }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 2 }}>
                {show("showFoodTypeSuffix") && (
                  <View style={{ width: 8, height: 8, borderWidth: 1, borderColor: "#16A34A", borderRadius: 1, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#16A34A" }} />
                  </View>
                )}
                <Text style={{ fontSize: 9, color: "#000", flex: 1 }}>{item.name}</Text>
              </View>
              <Text style={{ width: 20, fontSize: 9, textAlign: "center", color: "#000" }}>{item.qty}</Text>
              <Text style={{ width: 38, fontSize: 9, textAlign: "right", color: "#000" }}>
                ₹{(item.qty * item.rate).toFixed(0)}
              </Text>
            </View>
          ))}

          {/* Financial Summary */}
          {show("sepTotalTop") && <Separator />}

          {show("showSubtotal") && <Row left="Subtotal" right={`₹${subtotal.toFixed(2)}`} />}
          {show("showDiscount") && <Row left="Discount (WELCOME50)" right={`-₹${discountAmt.toFixed(2)}`} />}
          {show("showTaxableAmt") && <Row left="Taxable Amount" right={`₹${taxableAmt.toFixed(2)}`} />}

          {/* Tax Breakup */}
          {show("showTaxBreakup") && (
            <>
              <Separator dashed />
              <Text style={{ fontSize: 9, fontWeight: "800", color: "#000", marginBottom: 1 }}>TAX BREAKUP:</Text>
              <Row left="CGST @2.5%" right={`₹${cgst.toFixed(2)}`} />
              <Row left="SGST @2.5%" right={`₹${sgst.toFixed(2)}`} />
            </>
          )}
          {show("showTotalTax") && <Row left="Total GST" right={`₹${totalTax.toFixed(2)}`} />}
          {show("showPackagingCharges") && packagingAmt > 0 && (
            <Row left="Packaging" right={`+₹${packagingAmt.toFixed(2)}`} />
          )}
          {show("showDeliveryCharges") && deliveryAmt > 0 && (
            <Row left="Delivery" right={`+₹${deliveryAmt.toFixed(2)}`} />
          )}
          {show("showServiceCharge") && serviceAmt > 0 && (
            <Row left="Service Charge" right={`+₹${serviceAmt.toFixed(2)}`} />
          )}

          {show("sepTotalBottom") && <Separator />}
          <Row left="TOTAL" right={`₹${finalTotal.toFixed(2)}`} bold />

          {/* Amount in Words */}
          {show("showAmountInWords") && (
            <Text style={{ fontSize: 8, fontStyle: "italic", color: "#000", marginTop: 2 }}>
              {numberToWords(Math.round(finalTotal))} Rupees Only
            </Text>
          )}

          {/* Payment Status */}
          {show("showPaymentStatus") && (
            <>
              {show("sepPayment") && <Separator dashed />}
              <Text style={{ textAlign: "center", fontWeight: "900", fontSize: 10, color: "#000", marginTop: 2 }}>
                [ PAID - UPI ]
              </Text>
            </>
          )}

          {/* Greetings / Footer */}
          {show("showGreetings") && (
            <>
              {show("sepFooter") && <Separator dashed />}
              <Text style={{ textAlign: "center", fontSize: 9, fontStyle: "italic", color: "#000" }}>
                Thank you for visiting! 🙏
              </Text>
            </>
          )}
          {show("showVisitAgain") && (
            <Text style={{ textAlign: "center", fontSize: 8, color: "#000" }}>Please visit again soon</Text>
          )}

          {/* Review QR */}
          {show("showReviewQR") && (
            <>
              <Separator dashed />
              <Text style={{ textAlign: "center", fontSize: 9, fontWeight: "700", color: "#000", marginBottom: 2 }}>
                Rate Us on Google ⭐
              </Text>
              <View style={{ alignSelf: "center", marginVertical: 4 }}>
                {reviewLink ? (
                  <QRCode
                    value={reviewLink}
                    size={60}
                    color="#000"
                    backgroundColor="#fff"
                  />
                ) : (
                  <View style={{ width: 60, height: 60, backgroundColor: "#EEE", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="qr-code-outline" size={24} color="#999" />
                  </View>
                )}
              </View>
              {reviewLink ? (
                <Text style={{ textAlign: "center", fontSize: 7, color: "#555", marginTop: 2 }} numberOfLines={1}>
                  {reviewLink}
                </Text>
              ) : null}
            </>
          )}

          {/* Powered By */}
          {show("showPoweredBy") && (
            <View style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: "#000", marginTop: 6, paddingTop: 4 }}>
              <Text style={{ textAlign: "center", fontSize: 7, color: "#000" }}>
                Powered by Kravy Billing
              </Text>
            </View>
          )}

        </View>

        {/* Note */}
        <Text style={styles.noteText}>
          * Preview may differ slightly from actual 58mm thermal print
        </Text>
      </ScrollView>
    </View>
  );
};

// Simple number-to-words helper for amounts
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

export default PrintingPreviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5E5E5" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: s(16), paddingVertical: vs(10),
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: s(6),
  },
  backBtn: {
    width: s(38), height: s(38), borderRadius: s(12),
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: s(4),
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
  noteText: {
    textAlign: "center", fontSize: rf(9), color: COLORS.textLight,
    fontWeight: "600", marginTop: vs(16), paddingHorizontal: s(20),
    lineHeight: rf(14), textTransform: "uppercase", letterSpacing: 0.5,
  },
});
