import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { getRecentCompanyProfile } from "../../services/companyService";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill } from "../../utils/SimpleBill";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THEME_COLOR = "#2563EB";

interface CheckoutViewProps {
  onBack?: (clearCart?: boolean) => void;
  cartParams?: any;
}

export default function CheckoutView({
  onBack,
  cartParams,
}: CheckoutViewProps) {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const params = cartParams || rawParams;
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { t } = useLanguage();
  const { triggerRefresh } = useRefresh();

  const [cart, setCart] = useState<any[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [parties, setParties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [printErrorMessage, setPrintErrorMessage] = useState("");
  const [newParty, setNewParty] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isDiscountModalVisible, setIsDiscountModalVisible] = useState(false);
  const [tempDiscountRate, setTempDiscountRate] = useState("0");
  const [isChargesModalVisible, setIsChargesModalVisible] = useState(false);
  const [tempServiceCharge, setTempServiceCharge] = useState("0");
  const [tempDeliveryCharge, setTempDeliveryCharge] = useState("0");
  const [tempPackagingCharge, setTempPackagingCharge] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [taxSettings, setTaxSettings] = useState({
    enabled: false,
    rate: 0,
    perProduct: false,
    discountEnabled: false,
    discountRate: 0,
    serviceChargeEnabled: false,
    serviceChargeRate: 0,
    serviceGstEnabled: false,
    serviceGstRate: 0,
    deliveryChargeEnabled: false,
    deliveryChargeAmount: 0,
    deliveryGstEnabled: false,
    deliveryGstRate: 0,
    packagingChargeEnabled: false,
    packagingChargeAmount: 0,
    packagingGstEnabled: false,
    packagingGstRate: 0,
  });
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

  const loadTaxSettings = async () => {
    try {
      const keys = [
        "tax_enabled",
        "tax_rate",
        "per_product_tax",
        "discount_enabled",
        "discount_rate",
        "service_charge_enabled",
        "service_charge_rate",
        "service_gst_enabled",
        "service_gst_rate",
        "delivery_charge_enabled",
        "delivery_charge_amount",
        "delivery_gst_enabled",
        "delivery_gst_rate",
        "packaging_charge_enabled",
        "packaging_charge_amount",
        "packaging_gst_enabled",
        "packaging_gst_rate",
      ];
      const results = await AsyncStorage.multiGet(keys);
      const settings: any = {};
      results.forEach(([key, val]) => {
        settings[key] = val;
      });

      setTaxSettings({
        enabled: settings["tax_enabled"] === "true",
        rate: parseFloat(settings["tax_rate"] || "0"),
        perProduct: settings["per_product_tax"] === "true",
        discountEnabled: settings["discount_enabled"] === "true",
        discountRate: parseFloat(settings["discount_rate"] || "0"),
        serviceChargeEnabled: settings["service_charge_enabled"] === "true",
        serviceChargeRate:
          parseFloat(settings["service_charge_rate"] || "0") || 0,
        serviceGstEnabled: settings["service_gst_enabled"] === "true",
        serviceGstRate: parseFloat(settings["service_gst_rate"] || "0") || 0,
        deliveryChargeEnabled: settings["delivery_charge_enabled"] === "true",
        deliveryChargeAmount:
          parseFloat(settings["delivery_charge_amount"] || "0") || 0,
        deliveryGstEnabled: settings["delivery_gst_enabled"] === "true",
        deliveryGstRate: parseFloat(settings["delivery_gst_rate"] || "0") || 0,
        packagingChargeEnabled: settings["packaging_charge_enabled"] === "true",
        packagingChargeAmount:
          parseFloat(settings["packaging_charge_amount"] || "0") || 0,
        packagingGstEnabled: settings["packaging_gst_enabled"] === "true",
        packagingGstRate:
          parseFloat(settings["packaging_gst_rate"] || "0") || 0,
      });
    } catch (e) {
      console.log("Tax settings loading info (local):", e);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      // 🚀 Step 1: Quick Load from Cache
      const cached = await AsyncStorage.getItem("@cached_business_profile");
      if (cached) {
        const data = JSON.parse(cached);
        if (data) setBusinessProfile(data);
      }

      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      setActiveBusinessId(bId);

      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      if (!finalToken) return;

      // Step 2: Refresh from network
      const profile = await getRecentCompanyProfile(finalToken);
      if (profile) {
        setBusinessProfile(profile);
        await AsyncStorage.setItem(
          "@cached_business_profile",
          JSON.stringify(profile),
        );
      }
    } catch (e) {
      console.log(
        "Error loading profile in Checkout (using cache fallback):",
        e,
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTaxSettings();
      loadBusinessProfile();
    }, []),
  );

  useEffect(() => {
    if (params.cart) {
      try {
        const parsed = JSON.parse(params.cart as string);
        setCart(Object.values(parsed));
        if (params.paymentMethod)
          setPaymentMode(params.paymentMethod as string);
      } catch (e) {
        console.error("Cart parsing error:", e);
      }
    }
  }, [params.cart]);

  const [isFetchingParties, setIsFetchingParties] = useState(false);

  const fetchParties = useCallback(async () => {
    if (isFetchingParties) return;

    let cacheFound = false;
    try {
      const cachedData = await AsyncStorage.getItem("@cached_parties");
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setParties(parsed);
          cacheFound = true;
        }
      }
    } catch (e) {
      console.log("Error loading parties cache in Checkout:", e);
    }

    try {
      setIsFetchingParties(true);
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      if (!finalToken) {
        console.log("⏭️ Parties API: No token available, skipping fetch.");
        setIsFetchingParties(false);
        return;
      }

      const bId =
        activeBusinessId ||
        (await StaffPermissionEngine.getActiveBusinessId(user?.id));

      const url = bId
        ? `https://billing.kravy.in/api/parties?businessId=${bId}`
        : "https://billing.kravy.in/api/parties";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          const partiesList = data.parties || data;
          if (Array.isArray(partiesList)) {
            setParties(partiesList);
            await AsyncStorage.setItem(
              "@cached_parties",
              JSON.stringify(partiesList),
            );
          }
        } else {
          const text = await res.text();
          console.log(
            `⚠️ Parties API returned non-JSON response (Status: ${res.status}). Body snippet: ${text.slice(0, 100)}`,
          );
        }
      } else {
        console.log(`❌ Parties API Error: Status ${res.status}`);
        if (res.status === 401 || res.status === 403) {
          console.log(
            "🚫 Parties API: Authentication failed. Please re-login.",
          );
        }
      }
    } catch (e) {
      if (!cacheFound) {
        console.log("Parties fetch error (empty cache):", e);
      } else {
        console.log("Parties fetch error (using cache):", e);
      }
    } finally {
      setIsFetchingParties(false);
    }
  }, [getToken, activeBusinessId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!isProcessing) {
        fetchParties();
      }
    }, [fetchParties, isProcessing]),
  );

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery),
  );

  // --- Cart Management Logic ---
  const addToCart = useCallback((item: any) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  }, []);

  const removeFromCart = useCallback((item: any) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          return { ...i, quantity: Math.max(1, i.quantity - 1) };
        }
        return i;
      }),
    );
  }, []);

  const deleteFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, editedPrice: newPrice } : i)),
    );
    setEditingItemId(null);
  };

  const clearCart = () => {
    setCart([]);
  };

  // --- Calculation Logic (Matching SimpleBill.ts) ---
  const calcTotals = () => {
    let subtotal = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalDiscount = 0;
    let perProductGstTotals: Record<number, number> = {};
    let globalGstTotal = 0;

    const discountRate = taxSettings.discountEnabled
      ? taxSettings.discountRate / 100
      : 0;

    (cart || []).forEach((item: any) => {
      const price = Number(item.editedPrice ?? item.price ?? 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = price * qty;
      const itemDiscount = lineTotal * discountRate;
      const itemPriceAfterDiscount = lineTotal - itemDiscount;

      let itemGstRate = 0;
      const productGst = Number(item.gst || 0);

      // --- ALAG ALAG CASES KA LOGIC ---

      // CASE 1: Global GST ON aur Per-Product GST OFF
      if (taxSettings.enabled && !taxSettings.perProduct) {
        itemGstRate = taxSettings.rate;
      }
      // CASE 2: Global GST OFF aur Per-Product GST ON
      else if (!taxSettings.enabled && taxSettings.perProduct) {
        itemGstRate = productGst;
      }
      // CASE 3: Global GST ON aur Per-Product GST ON
      else if (taxSettings.enabled && taxSettings.perProduct) {
        if (productGst > 0) {
          itemGstRate = productGst;
        } else {
          itemGstRate = taxSettings.rate;
        }
      }

      let taxable = 0;
      let gst = 0;

      const taxType = item.taxType || item.taxStatus || "Without Tax";

      if (taxType === "With Tax") {
        taxable = itemPriceAfterDiscount / (1 + itemGstRate / 100);
        gst = itemPriceAfterDiscount - taxable;
      } else {
        taxable = itemPriceAfterDiscount;
        // Always calculate GST on Discounted Price (Transaction Value)
        gst = (itemPriceAfterDiscount * itemGstRate) / 100;
      }

      // --- COUNTERS LOGIC ---
      if (taxSettings.enabled && taxSettings.perProduct) {
        if (productGst > 0) {
          perProductGstTotals[itemGstRate] =
            (perProductGstTotals[itemGstRate] || 0) + gst;
        } else {
          globalGstTotal += gst;
        }
      } else if (taxSettings.enabled && !taxSettings.perProduct) {
        globalGstTotal += gst;
      } else if (!taxSettings.enabled && taxSettings.perProduct) {
        perProductGstTotals[itemGstRate] =
          (perProductGstTotals[itemGstRate] || 0) + gst;
      }

      subtotal += lineTotal;
      totalTaxable += taxable;
      totalGst += gst;
      totalDiscount += itemDiscount;
    });

    const netTaxableValue = totalTaxable;

    let serviceChargeAmount = 0;
    let serviceGstAmount = 0;
    if (taxSettings.serviceChargeEnabled) {
      serviceChargeAmount = taxSettings.serviceChargeRate;
      if (taxSettings.serviceGstEnabled) {
        serviceGstAmount =
          (serviceChargeAmount * taxSettings.serviceGstRate) / 100;
      }
    }

    let deliveryChargeAmount = 0;
    let deliveryGstAmount = 0;
    if (taxSettings.deliveryChargeEnabled) {
      deliveryChargeAmount = taxSettings.deliveryChargeAmount;
      if (taxSettings.deliveryGstEnabled) {
        deliveryGstAmount =
          (deliveryChargeAmount * taxSettings.deliveryGstRate) / 100;
      }
    }

    let packagingChargeAmount = 0;
    let packagingGstAmount = 0;
    if (taxSettings.packagingChargeEnabled) {
      packagingChargeAmount = taxSettings.packagingChargeAmount;
      if (taxSettings.packagingGstEnabled) {
        packagingGstAmount =
          (packagingChargeAmount * taxSettings.packagingGstRate) / 100;
      }
    }

    const totalDue =
      totalTaxable +
      totalGst +
      serviceChargeAmount +
      serviceGstAmount +
      deliveryChargeAmount +
      deliveryGstAmount +
      packagingChargeAmount +
      packagingGstAmount;

    return {
      subtotal,
      taxableAmount: netTaxableValue,
      discountAmount: totalDiscount,
      discountRate: taxSettings.discountRate,
      gst: totalGst,
      globalGstTotal,
      perProductGstTotals,
      globalGstRate: taxSettings.rate,
      serviceChargeAmount,
      serviceGstAmount,
      serviceGstRate: taxSettings.serviceGstRate,
      deliveryChargeAmount,
      deliveryGstAmount,
      deliveryGstRate: taxSettings.deliveryGstRate,
      packagingChargeAmount,
      packagingGstAmount,
      packagingGstRate: taxSettings.packagingGstRate,
      totalDue,
    };
  };

  const totals = calcTotals();

  const handlePrint = async () => {
    if (cart.length === 0) return;
    try {
      setIsProcessing(true);
      let finalToken = null;
      let bId = activeBusinessId;
      let staffSession = null;

      try {
        const sessionStr = await AsyncStorage.getItem("staff_session");
        staffSession = sessionStr ? JSON.parse(sessionStr) : null;

        const authToken = await getToken();
        finalToken =
          authToken && authToken !== "" ? authToken : staffSession?.token;

        if (!bId) {
          bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
        }
      } catch (e) {
        console.log("Auth fetch failed in Print (using cached session):", e);
        finalToken = staffSession?.token;
        bId = bId || staffSession?.businessId;
      }

      let finalPartyId = selectedParty?.id || selectedParty?._id;
      const customerName = (newParty.name || searchQuery).trim();
      const customerPhone = newParty.phone.trim();

      // --- NEW: Automatically create party/client if it's a new customer ---
      let partyCreationPromise = Promise.resolve(null);
      if (!finalPartyId && customerName && customerPhone.length >= 10) {
        // Check if party with this phone already exists locally
        const existing = parties.find((p) => p.phone === customerPhone);
        if (existing) {
          finalPartyId = existing.id || existing._id;
        } else {
          // Fire and forget or handle in background
          partyCreationPromise = fetch("https://billing.kravy.in/api/parties", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${finalToken}`,
            },
            body: JSON.stringify({
              name: customerName,
              phone: customerPhone,
              address: newParty.address.trim(),
              businessId: bId,
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then(
              (pData) => pData?.party?.id || pData?.party?._id || pData?.id,
            );
        }
      }

      // We start SimpleBill immediately. If partyId is still being created,
      // it might be null for this specific call, but we prioritize SPEED.
      // Usually, backend should handle phone-based mapping if partyId is missing.
      const result = await SimpleBill(cart, finalToken!, bId!, {
        paymentMode,
        partyId: finalPartyId,
        billId: params.billId || undefined,
        customerName: customerName,
        phone: customerPhone,
        customerAddress: newParty.address,
        businessProfile,
        taxSettings,
        tableName: params.selectedTable || undefined,
        roomName: params.selectedRoom || undefined,
        tokenNo: params.tokenNo,
      });

      if (result?.status === "success") {
        setIsSuccessModalVisible(true);
        triggerRefresh(); // Update dashboard

        // If this checkout originated from a KOT order, mark it as COMPLETED
        if (params.kotId) {
          try {
            fetch("https://billing.kravy.in/api/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
              body: JSON.stringify({ orderId: params.kotId, status: "COMPLETED" }),
            }).catch(e => console.log("Failed to complete KOT order in background", e));
          } catch (err) { }
        }
      } else {
        setPrintErrorMessage(result?.error || "Failed to process bill.");
        setIsErrorModalVisible(true);
      }
    } catch (e) {
      setPrintErrorMessage("An unexpected error occurred.");
      setIsErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = (clearCart: boolean = false) => {
    if (onBack) onBack(clearCart);
    else router.back();
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#6D28D9" }}>
        <StatusBar backgroundColor="#6D28D9" barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
          <View style={[styles.header, { backgroundColor: "transparent", borderBottomWidth: 0 }]}>
            <TouchableOpacity
              onPress={() => handleBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={rf(22)} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerBusinessInfo}>
              {businessProfile?.logoUrl ? (
                <Image
                  source={{ uri: businessProfile.logoUrl }}
                  style={styles.headerLogo}
                />
              ) : (
                <View style={[styles.headerLogoPlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="restaurant" size={rf(16)} color="#fff" />
                </View>
              )}
              <View>
                <Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1}>
                  {businessProfile?.companyName || t("checkout")}
                </Text>
                {businessProfile?.gstNumber && (
                  <Text style={[styles.headerGst, { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>
                    GST: {businessProfile.gstNumber}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ width: s(40) }} />
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {/* Horizontal Items List */}
            <View style={styles.topSection}>
              <Text style={[styles.sectionTitleMain, { color: '#D8B4FE', fontSize: rf(13), textTransform: 'uppercase', letterSpacing: 1, marginLeft: s(20), marginBottom: vs(15) }]}>
                Items added to order
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {cart.map((item, idx) => (
                  <View key={idx} style={{ width: s(130), marginRight: s(15), alignItems: 'center' }}>

                    {/* Image Card */}
                    <View style={{ width: '100%', height: s(100), backgroundColor: '#7C3AED', borderRadius: s(16), borderWidth: 1, borderColor: '#8B5CF6', overflow: 'hidden', elevation: 3 }}>
                      {(item.image || item.imageUrl || item.image_url) && (
                        <>
                          <Image
                            source={{ uri: item.image || item.imageUrl || item.image_url }}
                            style={[StyleSheet.absoluteFillObject, { opacity: 1 }]}
                            resizeMode="cover"
                          />
                          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]} />
                        </>
                      )}

                      {/* Price Pill (Top Corner) */}
                      <View style={{ position: 'absolute', top: s(8), right: s(8), backgroundColor: '#fff', paddingHorizontal: s(8), paddingVertical: vs(2), borderRadius: s(10), zIndex: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 }}>
                        <Text style={{ color: '#6D28D9', fontSize: rf(11), fontWeight: 'bold' }}>
                          ₹{item.editedPrice ?? item.price ?? 0}
                        </Text>
                      </View>
                    </View>

                    {/* Item Name (Outside) */}
                    <Text style={{ color: '#fff', fontSize: rf(11.5), textAlign: 'center', fontWeight: 'bold', marginTop: vs(8), marginBottom: vs(8), width: '100%', height: vs(32) }} numberOfLines={2}>
                      {item.name}
                    </Text>

                    {/* Qty Controls (Outside) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: s(8), paddingHorizontal: s(8), paddingVertical: vs(4), width: '100%' }}>
                      <TouchableOpacity onPress={() => removeFromCart(item)} style={{ paddingHorizontal: s(8) }}>
                        <Text style={{ color: '#6D28D9', fontSize: rf(18), fontWeight: 'bold' }}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#1F2937', fontSize: rf(14), fontWeight: 'bold' }}>
                        {item.quantity}
                      </Text>
                      <TouchableOpacity onPress={() => addToCart(item)} style={{ paddingHorizontal: s(8) }}>
                        <Text style={{ color: '#6D28D9', fontSize: rf(18), fontWeight: 'bold' }}>+</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                ))}
              </ScrollView>
            </View>



            {/* Cart Summary Card */}
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: s(30), borderTopRightRadius: s(30), marginTop: vs(20), padding: s(20), paddingBottom: vs(70), flex: 1, minHeight: '60%' }}>
              <View style={[styles.cardHeader, { justifyContent: 'space-between', marginBottom: vs(20) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#F3E8FF', padding: s(8), borderRadius: s(8) }}>
                    <Ionicons name="bag-handle" size={rf(18)} color="#7C3AED" />
                  </View>
                  <Text style={[styles.cardTitle, { color: '#4C1D95', fontSize: rf(18), marginLeft: s(10) }]}>Cart Summary</Text>
                </View>
                <View style={{ backgroundColor: '#F97316', paddingHorizontal: s(10), paddingVertical: vs(4), borderRadius: s(12) }}>
                  <Text style={{ color: '#fff', fontSize: rf(12), fontWeight: 'bold' }}>{cart.length} items</Text>
                </View>
              </View>

              {cart.map((item, idx) => (
                <View key={idx} style={[styles.summaryItemRow, { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: vs(15), marginBottom: vs(15) }]}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: item.isVeg === false ? '#ef4444' : '#10B981', marginTop: vs(6), marginRight: s(10) }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.summaryItemName, { fontSize: rf(14), color: '#1F2937' }]}>{item.name}</Text>

                      {editingItemId === item.id ? (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: vs(5) }}>
                          <Text style={{ fontSize: rf(12), color: '#6B7280' }}>₹</Text>
                          <TextInput
                            style={[styles.priceInputInline, { color: '#6B7280', borderBottomColor: '#6B7280' }]}
                            value={tempPrice}
                            onChangeText={setTempPrice}
                            keyboardType="numeric"
                            autoFocus
                          />
                          <TouchableOpacity onPress={() => updateItemPrice(item.id, parseFloat(tempPrice))} style={{ marginLeft: s(5) }}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingItemId(null)} style={{ marginLeft: s(5) }}>
                            <Ionicons name="close-circle" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: vs(5) }}>
                          <Text style={{ fontSize: rf(12), color: '#94A3B8' }}>
                            ₹{item.editedPrice ?? item.price ?? 0} per item
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingItemId(item.id);
                              setTempPrice((item.editedPrice ?? item.price ?? 0).toString());
                            }}
                            style={{ marginLeft: s(5) }}
                          >
                            <Ionicons name="create-outline" size={14} color="#C4B5FD" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD6FE', borderRadius: s(8), paddingHorizontal: s(5), paddingVertical: vs(4), backgroundColor: '#FAF5FF', marginRight: s(10) }}>
                      <TouchableOpacity onPress={() => removeFromCart(item)} style={{ paddingHorizontal: s(8) }}>
                        <Text style={{ color: '#4C1D95', fontSize: rf(16) }}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#4C1D95', fontSize: rf(13), fontWeight: 'bold', paddingHorizontal: s(8) }}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => addToCart(item)} style={{ paddingHorizontal: s(8) }}>
                        <Text style={{ color: '#4C1D95', fontSize: rf(14) }}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.summaryItemTotal, { color: '#F97316', fontSize: rf(14), fontWeight: 'bold', marginRight: s(10), minWidth: s(40), textAlign: 'right' }]}>
                      ₹{(item.editedPrice ?? item.price ?? 0) * item.quantity}
                    </Text>

                    <TouchableOpacity onPress={() => deleteFromCart(item.id)} style={{ padding: s(5), borderWidth: 1, borderColor: '#FECACA', borderRadius: s(6) }}>
                      <Ionicons name="trash-outline" size={rf(14)} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Action Buttons Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: s(10), marginTop: vs(15), marginBottom: vs(20) }}>
                {/* Customer Details Button */}
                <TouchableOpacity
                  onPress={() => setIsCustomerModalVisible(true)}
                  style={{ paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(8), borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', gap: s(8) }}
                >
                  <Ionicons name="person-outline" size={rf(14)} color="#4B5563" />
                  <Text style={{ fontSize: rf(13), color: '#374151' }}>
                    {newParty.name || searchQuery || "Add Customer"}
                  </Text>
                </TouchableOpacity>

                {/* Add Discount Button */}
                <TouchableOpacity
                  onPress={() => {
                    setTempDiscountRate((taxSettings.discountRate || 0).toString());
                    setIsDiscountModalVisible(true);
                  }}
                  style={{ paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(8), borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', gap: s(8) }}
                >
                  <Ionicons name="pricetag-outline" size={rf(14)} color="#4B5563" />
                  <Text style={{ fontSize: rf(13), color: '#374151' }}>
                    {taxSettings.discountEnabled && taxSettings.discountRate > 0 ? `${taxSettings.discountRate}% Discount` : "Add Discount"}
                  </Text>
                </TouchableOpacity>

                {/* Add Charges Button */}
                <TouchableOpacity
                  onPress={() => {
                    setTempServiceCharge((taxSettings.serviceChargeRate || 0).toString());
                    setTempDeliveryCharge((taxSettings.deliveryChargeAmount || 0).toString());
                    setTempPackagingCharge((taxSettings.packagingChargeAmount || 0).toString());
                    setIsChargesModalVisible(true);
                  }}
                  style={{ paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(8), borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', gap: s(8) }}
                >
                  <Ionicons name="add-circle-outline" size={rf(14)} color="#4B5563" />
                  <Text style={{ fontSize: rf(13), color: '#374151' }}>
                    Add Charges
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Totals Section */}
              <View style={{ gap: vs(10) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Subtotal</Text>
                  <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.subtotal.toFixed(2)}</Text>
                </View>

                {taxSettings.discountEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Discount ({totals.discountRate}%)</Text>
                    <Text style={{ fontSize: rf(13), color: "#ef4444" }}>-₹{totals.discountAmount.toFixed(2)}</Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Taxable Amount</Text>
                  <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{(totals.taxableAmount || totals.subtotal).toFixed(2)}</Text>
                </View>

                {totals.globalGstTotal > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Global GST ({totals.globalGstRate}%)</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.globalGstTotal.toFixed(2)}</Text>
                  </View>
                )}

                {Object.entries(totals.perProductGstTotals).map(([rate, amount]) => (
                  <View key={rate} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Item GST ({rate}%)</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{Number(amount).toFixed(2)}</Text>
                  </View>
                ))}

                {taxSettings.serviceChargeEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Service Charge</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.serviceChargeAmount.toFixed(2)}</Text>
                  </View>
                )}
                {taxSettings.serviceChargeEnabled && taxSettings.serviceGstEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>GST on Service ({totals.serviceGstRate}%)</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.serviceGstAmount.toFixed(2)}</Text>
                  </View>
                )}
                {taxSettings.deliveryChargeEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Delivery Charge</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.deliveryChargeAmount.toFixed(2)}</Text>
                  </View>
                )}
                {taxSettings.deliveryChargeEnabled && taxSettings.deliveryGstEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>GST on Delivery ({totals.deliveryGstRate}%)</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.deliveryGstAmount.toFixed(2)}</Text>
                  </View>
                )}
                {taxSettings.packagingChargeEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>Packaging Charge</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.packagingChargeAmount.toFixed(2)}</Text>
                  </View>
                )}
                {taxSettings.packagingChargeEnabled && taxSettings.packagingGstEnabled && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(13), color: '#6B7280' }}>GST on Packaging ({totals.packagingGstRate}%)</Text>
                    <Text style={{ fontSize: rf(13), color: '#1F2937' }}>₹{totals.packagingGstAmount.toFixed(2)}</Text>
                  </View>
                )}
              </View>

              <View style={{ backgroundColor: '#FFF7ED', padding: s(20), borderRadius: s(16), borderWidth: 1, borderColor: '#FFEDD5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(20) }}>
                <Text style={{ fontSize: rf(16), color: '#4C1D95' }}>Total Due</Text>
                <Text style={{ fontSize: rf(24), color: '#F97316' }}>₹{totals.totalDue.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={{ marginTop: vs(20), borderWidth: 1, borderColor: '#D1D5DB', borderRadius: s(8), paddingVertical: vs(12), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                onPress={handlePrint}
                disabled={isProcessing || cart.length === 0}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#374151" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={rf(18)} color="#374151" style={{ marginRight: s(10) }} />
                    <Text style={{ color: '#374151', fontSize: rf(14) }}>PRINT & SAVE BILL</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: vs(12), borderWidth: 1, borderColor: '#D1D5DB', borderRadius: s(8), paddingVertical: vs(12), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                onPress={clearCart}
              >
                <Ionicons name="trash-outline" size={rf(18)} color="#374151" style={{ marginRight: s(10) }} />
                <Text style={{ color: '#374151', fontSize: rf(14) }}>Clear Cart</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      <Modal transparent visible={isCustomerModalVisible} animationType="slide">
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.modalContentCentered, { width: SCREEN_WIDTH * 0.75, padding: 0, borderRadius: s(24), overflow: 'hidden' }]}>

            {/* Modal Header */}
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', paddingVertical: vs(15), paddingHorizontal: s(20), alignItems: 'center' }}
            >
              <Text style={{ fontSize: rf(16), fontWeight: 'bold', color: '#fff' }}>Customer Details</Text>
            </LinearGradient>

            <View style={{ padding: s(20), width: '100%' }}>
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(10), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="Customer Name"
                placeholderTextColor="#9CA3AF"
                value={searchQuery || newParty.name}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setNewParty((p) => ({ ...p, name: t }));
                  setShowPartyDropdown(true);
                }}
              />
              {showPartyDropdown &&
                searchQuery.length > 0 &&
                filteredParties.length > 0 && (
                  <View style={[styles.dropdown, { width: '100%', maxHeight: vs(100), padding: s(5) }]}>
                    <ScrollView nestedScrollEnabled>
                      {filteredParties.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.dropdownItem, { paddingVertical: vs(8) }]}
                          onPress={() => {
                            setSelectedParty(p);
                            setSearchQuery(p.name);
                            setNewParty({
                              name: p.name,
                              phone: p.phone,
                              address: p.address || "",
                            });
                            setShowPartyDropdown(false);
                          }}
                        >
                          <Text style={{ fontSize: rf(13), fontWeight: '500', color: '#334155' }}>
                            {p.name} <Text style={{ color: '#64748B' }}>({p.phone})</Text>
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(10), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="Phone"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newParty.phone}
                onChangeText={(t) => setNewParty((p) => ({ ...p, phone: t }))}
              />
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(15), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="Address"
                placeholderTextColor="#9CA3AF"
                value={newParty.address}
                onChangeText={(t) => setNewParty((p) => ({ ...p, address: t }))}
              />

              <View style={{ flexDirection: 'row', gap: s(12), marginTop: vs(5), width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', paddingVertical: vs(12), borderRadius: s(12) }}
                  onPress={() => setIsCustomerModalVisible(false)}
                >
                  <Text style={{ fontSize: rf(14), fontWeight: 'bold', color: '#64748B' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => setIsCustomerModalVisible(false)}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: vs(12), borderRadius: s(12) }}
                  >
                    <Text style={{ fontSize: rf(14), fontWeight: 'bold', color: '#ffffff' }}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isDiscountModalVisible} animationType="slide">
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.modalContentCentered, { width: SCREEN_WIDTH * 0.75, padding: 0, borderRadius: s(24), overflow: 'hidden' }]}>

            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', paddingVertical: vs(15), paddingHorizontal: s(20), alignItems: 'center' }}
            >
              <Text style={{ fontSize: rf(16), fontWeight: 'bold', color: '#fff' }}>Edit Discount</Text>
            </LinearGradient>

            <View style={{ padding: s(20), width: '100%' }}>
              <Text style={{ fontSize: rf(13), color: '#64748B', marginBottom: vs(5) }}>Discount Rate (%)</Text>
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(15), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={tempDiscountRate}
                onChangeText={setTempDiscountRate}
              />

              <View style={{ flexDirection: 'row', gap: s(12), marginTop: vs(5), width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', paddingVertical: vs(12), borderRadius: s(12) }}
                  onPress={() => setIsDiscountModalVisible(false)}
                >
                  <Text style={{ fontSize: rf(14), fontWeight: 'bold', color: '#64748B' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => {
                    const rate = parseFloat(tempDiscountRate) || 0;
                    setTaxSettings(prev => ({
                      ...prev,
                      discountEnabled: rate > 0,
                      discountRate: rate
                    }));
                    setIsDiscountModalVisible(false);
                  }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: vs(12), borderRadius: s(12) }}
                  >
                    <Text style={{ fontSize: rf(14), fontWeight: 'bold', color: '#ffffff' }}>Apply</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isChargesModalVisible} animationType="slide">
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.modalContentCentered, { width: SCREEN_WIDTH * 0.75, padding: 0, borderRadius: s(24), overflow: 'hidden' }]}>

            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', paddingVertical: vs(15), paddingHorizontal: s(20), alignItems: 'center' }}
            >
              <Text style={{ fontSize: rf(16), fontWeight: 'bold', color: '#fff' }}>Edit Extra Charges</Text>
            </LinearGradient>

            <View style={{ padding: s(20), width: '100%' }}>
              <Text style={{ fontSize: rf(13), color: '#64748B', marginBottom: vs(5) }}>Service Charge (%)</Text>
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(10), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={tempServiceCharge}
                onChangeText={setTempServiceCharge}
              />
              <Text style={{ fontSize: rf(13), color: '#64748B', marginBottom: vs(5) }}>Delivery Charge (₹)</Text>
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(10), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={tempDeliveryCharge}
                onChangeText={setTempDeliveryCharge}
              />
              <Text style={{ fontSize: rf(13), color: '#64748B', marginBottom: vs(5) }}>Packaging Charge (₹)</Text>
              <TextInput
                style={[styles.input, { width: '100%', padding: s(10), fontSize: rf(13), marginBottom: vs(15), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={tempPackagingCharge}
                onChangeText={setTempPackagingCharge}
              />

              <View style={{ flexDirection: 'row', gap: s(12), marginTop: vs(5), width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', paddingVertical: vs(12), borderRadius: s(12) }}
                  onPress={() => setIsChargesModalVisible(false)}
                >
                  <Text style={{ fontSize: rf(14), fontWeight: 'bold', color: '#64748B' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => {
                    const svc = parseFloat(tempServiceCharge) || 0;
                    const del = parseFloat(tempDeliveryCharge) || 0;
                    const pkg = parseFloat(tempPackagingCharge) || 0;
                    setTaxSettings(prev => ({
                      ...prev,
                      serviceChargeEnabled: svc > 0,
                      serviceChargeRate: svc,
                      deliveryChargeEnabled: del > 0,
                      deliveryChargeAmount: del,
                      packagingChargeEnabled: pkg > 0,
                      packagingChargeAmount: pkg
                    }));
                    setIsChargesModalVisible(false);
                  }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: vs(12), borderRadius: s(12) }}
                  >
                    <Text style={{ fontSize: rf(14), fontWeight: 'bold', color: '#ffffff' }}>Apply</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isSuccessModalVisible} animationType="fade">
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <Ionicons name="checkmark-circle" size={rf(80)} color="#10B981" />
            <Text style={styles.successTitleText}>Bill Saved!</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={async () => {
                await AsyncStorage.setItem("@clear_cart_after_bill", "true");
                setIsSuccessModalVisible(false);
                handleBack(true);
              }}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: vs(65),
    paddingTop: vs(5),
    paddingHorizontal: s(20),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBusinessInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: s(15),
  },
  headerLogo: {
    width: s(36),
    height: s(36),
    borderRadius: s(8),
    marginRight: s(10),
  },
  headerLogoPlaceholder: {
    width: s(36),
    height: s(36),
    borderRadius: s(8),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(10),
  },
  headerTitle: { fontSize: rf(16), fontWeight: "800", color: "#1E293B" },
  headerGst: {
    fontSize: rf(11),
    color: "#64748B",
    fontWeight: "600",
    marginTop: vs(1),
  },
  backButton: { padding: s(5) },
  topSection: { marginTop: vs(0) },
  sectionTitleMain: {
    marginLeft: s(20),
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: vs(10),
  },
  horizontalScroll: { paddingLeft: s(20), paddingRight: s(20) },
  itemContainer: { marginRight: s(15), width: s(140) },
  imageWrapper: {
    width: s(140),
    height: s(120),
    borderRadius: s(16),
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },
  itemImage: { width: "100%", height: "100%" },
  priceBadge: {
    position: "absolute",
    top: s(8),
    right: s(8),
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: s(8),
    paddingVertical: s(2),
    borderRadius: s(8),
  },
  priceBadgeText: { color: "#fff", fontSize: rf(12), fontWeight: "bold" },
  qtyOverlay: {
    position: "absolute",
    bottom: s(10),
    left: s(10),
    right: s(10),
    height: s(36),
    backgroundColor: "#2563EB",
    borderRadius: s(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(10),
  },
  qtyBtn: { padding: s(2) },
  qtyTextOverlay: { color: "#fff", fontWeight: "bold", fontSize: rf(16) },
  itemNameTop: {
    marginTop: vs(8),
    fontSize: rf(14),
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "left",
  },

  card: {
    margin: s(15),
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(20),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(15),
  },
  cardTitle: {
    fontSize: rf(17),
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: s(10),
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: s(12),
    padding: s(12),
    fontSize: rf(14),
    color: "#1F2937",
    marginBottom: vs(12),
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: s(12),
    marginTop: vs(-10),
    marginBottom: vs(10),
    padding: s(10),
    maxHeight: vs(150),
  },
  dropdownItem: {
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(15),
  },
  summaryItemName: { fontSize: rf(15), fontWeight: "600", color: "#1F2937" },
  summaryItemPrice: {
    fontSize: rf(13),
    color: "#6B7280",
    marginTop: vs(2),
  },
  priceInputInline: {
    fontSize: rf(13),
    color: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLOR,
    padding: 0,
    minWidth: s(50),
    fontWeight: "700",
  },
  summaryQtyControls: { flexDirection: "row", alignItems: "center", gap: s(8) },
  circleBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  summaryQtyText: { fontSize: rf(14), fontWeight: "bold", color: "#1F2937" },
  summaryItemTotal: {
    fontSize: rf(14),
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: s(5),
    width: s(60),
    textAlign: "right",
  },
  deleteBtn: { padding: s(5) },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: vs(15),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(8),
  },
  totalLabelSmall: { fontSize: rf(13), color: "#64748B" },
  totalValueSmall: { fontSize: rf(13), fontWeight: "600", color: "#1F2937" },
  grandTotalLabel: { fontSize: rf(18), fontWeight: "bold", color: "#1E293B" },
  grandTotalValue: { fontSize: rf(22), fontWeight: "900", color: "#2563EB" },
  printSaveBtn: {
    marginTop: vs(20),
    backgroundColor: "#2563EB",
    borderRadius: s(15),
    paddingVertical: vs(15),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  printSaveBtnText: { color: "#fff", fontSize: rf(16), fontWeight: "bold" },
  clearCartBtn: {
    marginTop: vs(15),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: s(5),
  },
  clearCartText: { color: "#94A3B8", fontSize: rf(13), fontWeight: "600" },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentCentered: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: "#fff",
    borderRadius: s(24),
    padding: s(30),
    alignItems: "center",
  },
  successTitleText: {
    fontSize: rf(22),
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: vs(20),
    marginBottom: vs(10),
  },
  modalBtn: {
    marginTop: vs(20),
    backgroundColor: "#2563EB",
    paddingHorizontal: s(40),
    paddingVertical: vs(12),
    borderRadius: s(12),
  },
  modalBtnText: { color: "#fff", fontWeight: "bold", fontSize: rf(16) },
});
