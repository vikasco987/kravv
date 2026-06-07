import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SubscriptionRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  isBlocked?: boolean;
  clerkId?: string | null;
}

export const SubscriptionRequiredModal: React.FC<
  SubscriptionRequiredModalProps
> = ({ visible, onClose, isBlocked = false, clerkId }) => {
  const handlePayNow = async (planKey: string, amount: number) => {
    try {
      let resolvedClerkId = clerkId;
      if (!resolvedClerkId) {
        const cached = await AsyncStorage.getItem("@cached_company_profile");
        if (cached) {
          const profile = JSON.parse(cached);
          resolvedClerkId = profile.userId || profile.businessId;
        }
      }

      if (!resolvedClerkId) {
        alert("Unable to identify your account. Please log in again.");
        return;
      }

      const checkoutUrl = `https://www.kravy.in/bridge?source=billing&clerkId=${resolvedClerkId}&amount=${amount}&plan=${planKey}`;
      console.log("🔗 Redirecting to PhonePe Payment Gateway:", checkoutUrl);
      Linking.openURL(checkoutUrl);
    } catch (error) {
      console.error("Payment bridge redirect error:", error);
      alert("Failed to open payment page. Please contact support.");
    }
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL(
      "https://wa.me/919289507822?text=Hello%20Kravy%20Support%2C%20I%20would%20like%20to%20subscribe%20to%20Kravy%20POS%20services.",
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={isBlocked ? () => { } : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Close Button */}
          {!isBlocked && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
           {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
            {/* Crown Brand Header */}
            <View style={styles.brandHeader}>
              <View style={styles.crownCircle}>
                <Ionicons name="ribbon" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandName}>Kravy Premium</Text>
                <Text style={styles.brandTagline}>GROWTH ENGINE</Text>
              </View>
            </View>

            {/* Brand Core Pillars */}
            <View style={styles.pillarsContainer}>
              <View style={styles.pillarRow}>
                <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                <View style={styles.pillarTextWrapper}>
                  <Text style={styles.pillarTitle}>Unlimited Billing</Text>
                  <Text style={styles.pillarSub}>
                    No limits on invoices or orders
                  </Text>
                </View>
              </View>
              <View style={styles.pillarRow}>
                <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                <View style={styles.pillarTextWrapper}>
                  <Text style={styles.pillarTitle}>Smart Inventory</Text>
                  <Text style={styles.pillarSub}>
                    Track stock & get low alerts
                  </Text>
                </View>
              </View>
              <View style={styles.pillarRow}>
                <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                <View style={styles.pillarTextWrapper}>
                  <Text style={styles.pillarTitle}>Advanced Reports</Text>
                  <Text style={styles.pillarSub}>
                    Sales, GST & Profit insights
                  </Text>
                </View>
              </View>
              <View style={styles.pillarRow}>
                <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                <View style={styles.pillarTextWrapper}>
                  <Text style={styles.pillarTitle}>24/7 Support</Text>
                  <Text style={styles.pillarSub}>
                    Priority assistance for you
                  </Text>
                </View>
              </View>
            </View>

            {/* Subscription Title & active discounts badge */}
            <View style={styles.titleContainer}>
              <Text style={styles.subRequiredTitle}>Subscription Required</Text>
              <Text style={styles.subRequiredDesc}>
                Your trial or subscription has expired. Please choose a plan
                below to continue using Kravy POS.
              </Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>ACTIVE DISCOUNTS</Text>
              </View>
            </View>

            {/* PLAN 1: 1 YEAR PLAN */}
            <View style={styles.planCard}>
              <Text style={styles.planLabel}>1 YEAR PLAN</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹3,999</Text>
                <Text style={styles.crossedPrice}>₹7,000</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Unlimited invoices</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Analytics dashboard</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Inventory management</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Tax / GST management</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Invoice with logo & QR</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Chat & Email support</Text>
              </View>

              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => handlePayNow("year1", 3999)}
              >
                <Text style={styles.payBtnText}>PAY NOW</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#000000"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>

            {/* PLAN 2: 2 YEAR PLAN (Lightning badge) */}
            <View style={styles.planCard}>
              <View style={styles.badgeHeaderRow}>
                <Text style={styles.planLabel}>2 YEAR PLAN</Text>
                <View style={styles.lightningBadge}>
                  <Ionicons name="thunderstorm" size={14} color="#D4AF37" />
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹5,999</Text>
                <Text style={styles.crossedPrice}>₹14,000</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>
                  Everything in 1 Year plan
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>
                  Advanced Kitchen workflow
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Coupons & Loyalty system</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Table QR ordering system</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Inventory alerts</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#D4AF37" />
                <Text style={styles.featureText}>Priority support</Text>
              </View>

              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => handlePayNow("year2", 5999)}
              >
                <Text style={styles.payBtnText}>PAY NOW</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#000000"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>

            {/* PLAN 3: 3 YEAR PLAN (Best Value Gold Gradient) */}
            <LinearGradient
              colors={["#D4AF37", "#8A7322"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.planCard, styles.planCardIndigo]}
            >
              <View style={styles.badgeHeaderRow}>
                <Text style={[styles.planLabel, { color: "#000000" }]}>
                  3 YEAR PLAN
                </Text>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueBadgeText}>BEST VALUE</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: "#000000" }]}>
                  ₹7,499
                </Text>
                <Text style={[styles.crossedPrice, { color: "#4E4112" }]}>
                  ₹21,000
                </Text>
              </View>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: "rgba(0,0,0,0.15)" },
                ]}
              />

              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text
                  style={[
                    styles.featureText,
                    { color: "#000000", fontWeight: "700" },
                  ]}
                >
                  Everything in 2 Year plan
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text
                  style={[
                    styles.featureText,
                    { color: "#000000", fontWeight: "700" },
                  ]}
                >
                  Kitchen automation
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text
                  style={[
                    styles.featureText,
                    { color: "#000000", fontWeight: "700" },
                  ]}
                >
                  Smart inventory tracking
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text
                  style={[
                    styles.featureText,
                    { color: "#000000", fontWeight: "700" },
                  ]}
                >
                  Advanced tax reports
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text
                  style={[
                    styles.featureText,
                    { color: "#000000", fontWeight: "700" },
                  ]}
                >
                  Lifetime priority support
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={18} color="#000000" />
                <Text
                  style={[
                    styles.featureText,
                    { color: "#000000", fontWeight: "700" },
                  ]}
                >
                  VIP Onboarding
                </Text>
              </View>

              <TouchableOpacity
                style={styles.payBtnWhite}
                onPress={() => handlePayNow("year3", 7499)}
              >
                <Text style={styles.payBtnTextIndigo}>PAY NOW</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#D4AF37"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </LinearGradient>

            {/* HARDWARE BUNDLE CARD */}
            <View style={styles.hardwareCard}>
              <View style={styles.hardwareHeaderRow}>
                <View style={styles.printerCircle}>
                  <Ionicons name="print" size={28} color="#D4AF37" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.hardwareTitle}>HARDWARE BUNDLE</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>
                        RECOMMENDED
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.hardwarePriceSub}>
                    Add physical terminal for just ₹2,999
                  </Text>
                </View>
              </View>

              <View style={styles.hardwareFeaturesGrid}>
                <View style={styles.hardwareFeatureCol}>
                  <View style={styles.hardwareBullet}>
                    <Ionicons
                      name="checkmark-sharp"
                      size={14}
                      color="#D4AF37"
                    />
                    <Text style={styles.hardwareBulletText}>
                      Thermal Printer
                    </Text>
                  </View>
                  <View style={styles.hardwareBullet}>
                    <Ionicons
                      name="checkmark-sharp"
                      size={14}
                      color="#D4AF37"
                    />
                    <Text style={styles.hardwareBulletText}>IoT Gateway</Text>
                  </View>
                </View>
                <View style={styles.hardwareFeatureCol}>
                  <View style={styles.hardwareBullet}>
                    <Ionicons
                      name="checkmark-sharp"
                      size={14}
                      color="#D4AF37"
                    />
                    <Text style={styles.hardwareBulletText}>
                      1 Year Warranty
                    </Text>
                  </View>
                  <View style={styles.hardwareBullet}>
                    <Ionicons
                      name="checkmark-sharp"
                      size={14}
                      color="#D4AF37"
                    />
                    <Text style={styles.hardwareBulletText}>Free Setup</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.orderBtn}
                onPress={() => handlePayNow("hardware", 2999)}
              >
                <Text style={styles.orderBtnText}>ORDER NOW</Text>
              </TouchableOpacity>
            </View>

            {/* NEED HELP WHATSAPP SECTION */}
            <View style={styles.helpCard}>
              <Text style={styles.helpHeader}>NEED HELP?</Text>
              <Text style={styles.helpPhone}>9289507822</Text>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={handleWhatsAppSupport}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.whatsappBtnText}>WHATSAPP</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 10, 0.96)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalCard: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#0A0A09",
    paddingTop: 70,
    elevation: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginRight: 20,
    marginBottom: 10,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161614",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  crownCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTextContainer: {
    marginLeft: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#D4AF37",
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginTop: 2,
  },
  pillarsContainer: {
    backgroundColor: "#131311",
    borderWidth: 1,
    borderColor: "#2A2A26",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
  },
  pillarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  pillarTextWrapper: {
    marginLeft: 10,
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pillarSub: {
    fontSize: 12,
    color: "#A3A3A3",
    marginTop: 1,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  subRequiredTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subRequiredDesc: {
    fontSize: 14,
    color: "#A3A3A3",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  discountBadge: {
    backgroundColor: "#D4AF37",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: "#131311",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#2A2A26",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  planCardIndigo: {
    borderColor: "#D4AF37",
    borderWidth: 1.5,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D4AF37",
    letterSpacing: 1.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  priceText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  crossedPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7E7E7A",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A26",
    marginVertical: 16,
  },
  badgeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lightningBadge: {
    backgroundColor: "#FEF9C3",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bestValueBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestValueBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E2E2",
    marginLeft: 10,
  },
  payBtn: {
    flexDirection: "row",
    backgroundColor: "#D4AF37",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  payBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  payBtnWhite: {
    flexDirection: "row",
    backgroundColor: "#000000",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnTextIndigo: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  hardwareCard: {
    backgroundColor: "#131311",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  hardwareHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  printerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1C1C1A",
    justifyContent: "center",
    alignItems: "center",
  },
  hardwareTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  recommendedBadge: {
    backgroundColor: "#D4AF37",
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recommendedBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#000000",
  },
  hardwarePriceSub: {
    fontSize: 12,
    color: "#A3A3A3",
    marginTop: 2,
  },
  hardwareFeaturesGrid: {
    flexDirection: "row",
    marginTop: 16,
    backgroundColor: "#1C1C1A",
    borderRadius: 16,
    padding: 12,
  },
  hardwareFeatureCol: {
    flex: 1,
  },
  hardwareBullet: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  hardwareBulletText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2E2E2",
    marginLeft: 6,
  },
  orderBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  orderBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  helpCard: {
    backgroundColor: "#131311",
    borderWidth: 1.5,
    borderColor: "#2A2A26",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  helpHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D4AF37",
    letterSpacing: 1.5,
  },
  helpPhone: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 4,
  },
  whatsappBtn: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    borderRadius: 16,
    height: 48,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
