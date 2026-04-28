import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
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

export default function CheckoutView({ onBack, cartParams }: CheckoutViewProps) {
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
  const [newParty, setNewParty] = useState({ name: "", phone: "", address: "" });
  const [isProcessing, setIsProcessing] = useState(false);
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
    packagingGstRate: 0
  });
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

  const loadTaxSettings = async () => {
    try {
      const keys = [
        'tax_enabled', 'tax_rate', 'per_product_tax',
        'discount_enabled', 'discount_rate',
        'service_charge_enabled', 'service_charge_rate',
        'service_gst_enabled', 'service_gst_rate',
        'delivery_charge_enabled', 'delivery_charge_amount',
        'delivery_gst_enabled', 'delivery_gst_rate',
        'packaging_charge_enabled', 'packaging_charge_amount',
        'packaging_gst_enabled', 'packaging_gst_rate'
      ];
      const results = await AsyncStorage.multiGet(keys);
      const settings: any = {};
      results.forEach(([key, val]) => { settings[key] = val; });

      setTaxSettings({
        enabled: settings['tax_enabled'] === 'true',
        rate: parseFloat(settings['tax_rate'] || "0"),
        perProduct: settings['per_product_tax'] === 'true',
        discountEnabled: settings['discount_enabled'] === 'true',
        discountRate: parseFloat(settings['discount_rate'] || "0"),
        serviceChargeEnabled: settings['service_charge_enabled'] === 'true',
        serviceChargeRate: parseFloat(settings['service_charge_rate'] || "0") || 0,
        serviceGstEnabled: settings['service_gst_enabled'] === 'true',
        serviceGstRate: parseFloat(settings['service_gst_rate'] || "0") || 0,
        deliveryChargeEnabled: settings['delivery_charge_enabled'] === 'true',
        deliveryChargeAmount: parseFloat(settings['delivery_charge_amount'] || "0") || 0,
        deliveryGstEnabled: settings['delivery_gst_enabled'] === 'true',
        deliveryGstRate: parseFloat(settings['delivery_gst_rate'] || "0") || 0,
        packagingChargeEnabled: settings['packaging_charge_enabled'] === 'true',
        packagingChargeAmount: parseFloat(settings['packaging_charge_amount'] || "0") || 0,
        packagingGstEnabled: settings['packaging_gst_enabled'] === 'true',
        packagingGstRate: parseFloat(settings['packaging_gst_rate'] || "0") || 0
      });
    } catch (e) {
      console.log("Tax settings loading info (local):", e);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      // 🚀 Step 1: Quick Load from Cache
      const cached = await AsyncStorage.getItem('@cached_business_profile');
      if (cached) {
        const data = JSON.parse(cached);
        if (data) setBusinessProfile(data);
      }

      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      setActiveBusinessId(bId);

      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem('staff_session');
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      if (!finalToken) return;
      
      // Step 2: Refresh from network
      const profile = await getRecentCompanyProfile(finalToken);
      if (profile) {
        setBusinessProfile(profile);
        await AsyncStorage.setItem('@cached_business_profile', JSON.stringify(profile));
      }
    } catch (e) { console.log("Error loading profile in Checkout (using cache fallback):", e); }
  };

  useFocusEffect(useCallback(() => {
    loadTaxSettings();
    loadBusinessProfile();
  }, []));

  useEffect(() => {
    if (params.cart) {
      try {
        const parsed = JSON.parse(params.cart as string);
        setCart(Object.values(parsed));
        if (params.paymentMethod) setPaymentMode(params.paymentMethod as string);
      } catch (e) {
        console.error("Cart parsing error:", e);
      }
    }
  }, [params.cart]);

  const fetchParties = useCallback(async () => {
    let cacheFound = false;
    try {
      const cachedData = await AsyncStorage.getItem('@cached_parties');
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
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem('staff_session');
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      const bId = activeBusinessId || await StaffPermissionEngine.getActiveBusinessId(user?.id);
      const url = bId ? `https://billing.kravy.in/api/parties?businessId=${bId}` : "https://billing.kravy.in/api/parties";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${finalToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const partiesList = data.parties || data; // Handle both response formats
        if (Array.isArray(partiesList)) {
          setParties(partiesList);
          await AsyncStorage.setItem('@cached_parties', JSON.stringify(partiesList));
        }
      }
    } catch (e) {
      if (!cacheFound) {
        console.log("Parties fetch info (empty cache):", e);
      } else {
        console.log("Parties fetch info (using cache):", e);
      }
    }
  }, [getToken, activeBusinessId]);

  useFocusEffect(useCallback(() => { fetchParties(); }, [fetchParties]));

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  // --- Cart Management Logic ---
  const addToCart = useCallback((item: any) => {
    setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
  }, []);

  const removeFromCart = useCallback((item: any) => {
    setCart(prev => prev.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: Math.max(1, i.quantity - 1) };
      }
      return i;
    }));
  }, []);

  const deleteFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const clearCart = () => {
    setCart([]);
  };

  // --- Calculation Logic (Matching SimpleBill.ts) ---
  const totals = useMemo(() => {
    let totalTaxable = 0;
    let totalGst = 0;
    let subtotal = 0;
    const usedGstRates = new Set<number>();

    cart.forEach(item => {
      if (item.quantity <= 0) return;

      const price = item.editedPrice ?? item.price ?? 0;
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      let gstRate = 0;
      if (taxSettings.enabled) {
        gstRate = taxSettings.rate;
      } else if (taxSettings.perProduct) {
        gstRate = (item.gst !== null && item.gst !== undefined) ? Number(item.gst) : 0;
      }

      if (gstRate > 0) usedGstRates.add(gstRate);

      let taxable = 0;
      let gst = 0;

      if (item.taxType === "With Tax") {
        taxable = lineTotal / (1 + gstRate / 100);
        gst = lineTotal - taxable;
      } else {
        taxable = lineTotal;
        gst = (lineTotal * gstRate) / 100;
      }

      totalTaxable += taxable;
      totalGst += gst;
    });

    const discountAmount = taxSettings.discountEnabled ? (totalTaxable * (taxSettings.discountRate / 100)) : 0;
    const taxableAfterDiscount = totalTaxable - discountAmount;

    // Service Charge moved to add-on section
    const netTaxableValue = taxableAfterDiscount;

    let finalGst = totalGst;
    if (taxSettings.enabled || taxSettings.perProduct) {
      const avgGstRate = totalTaxable > 0 ? (totalGst / totalTaxable) : 0;
      finalGst = netTaxableValue * avgGstRate;
    }

    const finalTotal = netTaxableValue + finalGst;

    let serviceChargeAmount = 0;
    let serviceGstAmount = 0;
    if (taxSettings.serviceChargeEnabled) {
      serviceChargeAmount = taxSettings.serviceChargeRate;
      if (taxSettings.serviceGstEnabled) {
        serviceGstAmount = (serviceChargeAmount * taxSettings.serviceGstRate) / 100;
      }
    }

    const grandTotalBeforeDel = finalTotal + serviceChargeAmount + serviceGstAmount;

    let deliveryChargeAmount = 0;
    let deliveryGstAmount = 0;
    if (taxSettings.deliveryChargeEnabled) {
      deliveryChargeAmount = taxSettings.deliveryChargeAmount;
      if (taxSettings.deliveryGstEnabled) {
        deliveryGstAmount = (deliveryChargeAmount * taxSettings.deliveryGstRate) / 100;
      }
    }

    const grandTotal = grandTotalBeforeDel + deliveryChargeAmount + deliveryGstAmount;

    let packagingChargeAmount = 0;
    let packagingGstAmount = 0;
    if (taxSettings.packagingChargeEnabled) {
      packagingChargeAmount = taxSettings.packagingChargeAmount;
      if (taxSettings.packagingGstEnabled) {
        packagingGstAmount = (packagingChargeAmount * taxSettings.packagingGstRate) / 100;
      }
    }

    const finalGrandTotal = grandTotal + packagingChargeAmount + packagingGstAmount;

    let displayGstLabel = 'GST';
    if (taxSettings.enabled) {
      displayGstLabel = `GST (${taxSettings.rate}%)`;
    } else if (taxSettings.perProduct) {
      if (usedGstRates.size === 1) {
        displayGstLabel = `GST (${Array.from(usedGstRates)[0]}%)`;
      } else if (usedGstRates.size > 1) {
        displayGstLabel = `GST (Mixed)`;
      }
    }

    return {
      subtotal: subtotal,
      taxableAmount: netTaxableValue,
      discountAmount,
      discountRate: taxSettings.discountRate,
      serviceChargeAmount,
      serviceChargeRate: taxSettings.serviceChargeRate,
      serviceGstAmount,
      serviceGstRate: taxSettings.serviceGstRate,
      gst: finalGst,
      deliveryChargeAmount,
      deliveryGstAmount,
      deliveryGstRate: taxSettings.deliveryGstRate,
      packagingChargeAmount,
      packagingGstAmount,
      packagingGstRate: taxSettings.packagingGstRate,
      totalDue: finalGrandTotal,
      gstLabel: displayGstLabel
    };
  }, [cart, taxSettings]);

  const handlePrint = async () => {
    if (cart.length === 0) return;
    try {
      setIsProcessing(true);
      let finalToken = null;
      let bId = activeBusinessId;
      let staffSession = null;

      try {
        const sessionStr = await AsyncStorage.getItem('staff_session');
        staffSession = sessionStr ? JSON.parse(sessionStr) : null;
        
        const authToken = await getToken();
        finalToken = (authToken && authToken !== "") ? authToken : staffSession?.token;
        
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
        const existing = parties.find(p => p.phone === customerPhone);
        if (existing) {
          finalPartyId = existing.id || existing._id;
        } else {
          // Fire and forget or handle in background
          partyCreationPromise = fetch("https://billing.kravy.in/api/parties", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
            body: JSON.stringify({ name: customerName, phone: customerPhone, address: newParty.address.trim(), businessId: bId }),
          }).then(res => res.ok ? res.json() : null)
            .then(pData => pData?.party?.id || pData?.party?._id || pData?.id);
        }
      }

      // We start SimpleBill immediately. If partyId is still being created, 
      // it might be null for this specific call, but we prioritize SPEED.
      // Usually, backend should handle phone-based mapping if partyId is missing.
      const result = await SimpleBill(cart, finalToken!, bId!, {
        paymentMode,
        partyId: finalPartyId,
        customerName: customerName,
        phone: customerPhone,
        businessProfile, 
        taxSettings,      
        tableName: params.selectedTable || undefined
      });

      if (result?.status === "success") {
        setIsSuccessModalVisible(true);
        triggerRefresh(); // Update dashboard
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <LinearGradient colors={["#fff", "#fff"]} style={styles.header}>
        <TouchableOpacity onPress={() => handleBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rf(22)} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerBusinessInfo}>
          {businessProfile?.logoUrl ? (
            <Image source={{ uri: businessProfile.logoUrl }} style={styles.headerLogo} />
          ) : (
            <View style={styles.headerLogoPlaceholder}>
              <Ionicons name="restaurant" size={rf(16)} color={THEME_COLOR} />
            </View>
          )}
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {businessProfile?.companyName || t('checkout')}
            </Text>
            {businessProfile?.gstNumber && (
              <Text style={styles.headerGst} numberOfLines={1}>GST: {businessProfile.gstNumber}</Text>
            )}
          </View>
        </View>

        <View style={{ width: s(40) }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: vs(50) }}>
        {/* Horizontal Items List */}
        <View style={styles.topSection}>
          <Text style={styles.sectionTitleMain}>Items added to order</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {cart.map((item, idx) => (
              <View key={idx} style={styles.itemContainer}>
                <View style={styles.imageWrapper}>
                  { (item.image || item.imageUrl || item.image_url) ? (
                    <Image
                      source={{ uri: item.image || item.imageUrl || item.image_url }}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View style={[styles.itemImage, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image-outline" size={rf(30)} color="#D1D5DB" />
                    </View>
                  )}
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>₹{item.price}</Text>
                  </View>
                  <View style={styles.qtyOverlay}>
                    <TouchableOpacity onPress={() => removeFromCart(item)} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={rf(18)} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.qtyTextOverlay}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={rf(18)} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemNameTop} numberOfLines={1}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={rf(20)} color="#2563EB" />
            <Text style={styles.cardTitle}>Customer Details</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            placeholderTextColor="#9CA3AF"
            value={searchQuery || newParty.name}
            onChangeText={t => {
              setSearchQuery(t);
              setNewParty(p => ({ ...p, name: t }));
              setShowPartyDropdown(true);
            }}
          />
          {showPartyDropdown && searchQuery.length > 0 && filteredParties.length > 0 && (
            <View style={styles.dropdown}>
              {filteredParties.map(p => (
                <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => { setSelectedParty(p); setSearchQuery(p.name); setNewParty({ name: p.name, phone: p.phone, address: p.address || "" }); setShowPartyDropdown(false); }}>
                  <Text>{p.name} ({p.phone})</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={newParty.phone}
            onChangeText={t => setNewParty(p => ({ ...p, phone: t }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#9CA3AF"
            value={newParty.address}
            onChangeText={t => setNewParty(p => ({ ...p, address: t }))}
          />
        </View>

        {/* Cart Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bag-handle" size={rf(22)} color="#10B981" />
            <Text style={styles.cardTitle}>Cart Summary</Text>
          </View>

          {cart.map((item, idx) => (
            <View key={idx} style={styles.summaryItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemName}>{item.name}</Text>
                <Text style={styles.summaryItemPrice}>₹{item.price}</Text>
              </View>

              <View style={styles.summaryQtyControls}>
                <TouchableOpacity onPress={() => removeFromCart(item)} style={styles.circleBtn}>
                  <Ionicons name="remove" size={rf(16)} color="#10B981" />
                </TouchableOpacity>
                <Text style={styles.summaryQtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => addToCart(item)} style={styles.circleBtn}>
                  <Ionicons name="add" size={rf(16)} color="#10B981" />
                </TouchableOpacity>
                <Text style={styles.summaryItemTotal}>₹{item.price * item.quantity}</Text>
                <TouchableOpacity onPress={() => deleteFromCart(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={rf(18)} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabelSmall}>subtotal</Text>
            <Text style={styles.totalValueSmall}>₹{totals.subtotal.toFixed(2)}</Text>
          </View>

          {taxSettings.discountEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>Discount ({totals.discountRate}%)</Text>
              <Text style={[styles.totalValueSmall, { color: '#ef4444' }]}>-₹{totals.discountAmount.toFixed(2)}</Text>
            </View>
          )}


          <View style={styles.totalRow}>
            <Text style={styles.totalLabelSmall}>taxable_amount</Text>
            <Text style={styles.totalValueSmall}>₹{(totals.taxableAmount || totals.subtotal).toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabelSmall}>{totals.gstLabel}</Text>
            <Text style={styles.totalValueSmall}>₹{totals.gst.toFixed(2)}</Text>
          </View>

          {taxSettings.serviceChargeEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>Service Charge</Text>
              <Text style={styles.totalValueSmall}>₹{totals.serviceChargeAmount.toFixed(2)}</Text>
            </View>
          )}

          {taxSettings.serviceChargeEnabled && taxSettings.serviceGstEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>GST on Service ({totals.serviceGstRate}%)</Text>
              <Text style={styles.totalValueSmall}>₹{totals.serviceGstAmount.toFixed(2)}</Text>
            </View>
          )}

          {taxSettings.deliveryChargeEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>Delivery Charge</Text>
              <Text style={styles.totalValueSmall}>₹{totals.deliveryChargeAmount.toFixed(2)}</Text>
            </View>
          )}

          {taxSettings.deliveryChargeEnabled && taxSettings.deliveryGstEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>GST on Delivery ({totals.deliveryGstRate}%)</Text>
              <Text style={styles.totalValueSmall}>₹{totals.deliveryGstAmount.toFixed(2)}</Text>
            </View>
          )}

          {taxSettings.packagingChargeEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>Packaging Charge</Text>
              <Text style={styles.totalValueSmall}>₹{totals.packagingChargeAmount.toFixed(2)}</Text>
            </View>
          )}

          {taxSettings.packagingChargeEnabled && taxSettings.packagingGstEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelSmall}>GST on Packaging ({totals.packagingGstRate}%)</Text>
              <Text style={styles.totalValueSmall}>₹{totals.packagingGstAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, { marginTop: vs(15) }]}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>₹{totals.totalDue.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.printSaveBtn, isProcessing && { opacity: 0.7 }]}
            onPress={handlePrint}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="receipt-outline" size={rf(20)} color="#fff" style={{ marginRight: s(10) }} />
                <Text style={styles.printSaveBtnText}>PRINT & SAVE BILL</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
            <Ionicons name="trash-outline" size={rf(16)} color="#94A3B8" />
            <Text style={styles.clearCartText}>Clear Cart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent visible={isSuccessModalVisible} animationType="fade">
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <Ionicons name="checkmark-circle" size={rf(80)} color="#10B981" />
            <Text style={styles.successTitleText}>Bill Saved!</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={async () => {
              await AsyncStorage.setItem('@clear_cart_after_bill', 'true');
              setIsSuccessModalVisible(false);
              handleBack(true);
            }}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: vs(65),
    paddingTop: vs(5),
    paddingHorizontal: s(20),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerBusinessInfo: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: s(15) },
  headerLogo: { width: s(36), height: s(36), borderRadius: s(8), marginRight: s(10) },
  headerLogoPlaceholder: { width: s(36), height: s(36), borderRadius: s(8), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: s(10) },
  headerTitle: { fontSize: rf(16), fontWeight: "800", color: "#1E293B" },
  headerGst: { fontSize: rf(11), color: "#64748B", fontWeight: "600", marginTop: vs(1) },
  backButton: { padding: s(5) },
  topSection: { marginTop: vs(0) },
  sectionTitleMain: { marginLeft: s(20), fontSize: rf(18), fontWeight: "bold", color: "#1F2937", marginBottom: vs(10) },
  horizontalScroll: { paddingLeft: s(20), paddingRight: s(20) },
  itemContainer: { marginRight: s(15), width: s(140) },
  imageWrapper: {
    width: s(140),
    height: s(120),
    borderRadius: s(16),
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative"
  },
  itemImage: { width: "100%", height: "100%" },
  priceBadge: {
    position: "absolute",
    top: s(8),
    right: s(8),
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: s(8),
    paddingVertical: s(2),
    borderRadius: s(8)
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
    paddingHorizontal: s(10)
  },
  qtyBtn: { padding: s(2) },
  qtyTextOverlay: { color: "#fff", fontWeight: "bold", fontSize: rf(16) },
  itemNameTop: { marginTop: vs(8), fontSize: rf(14), fontWeight: "600", color: "#1F2937", textAlign: "left" },

  card: {
    margin: s(15),
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(20),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: vs(15) },
  cardTitle: { fontSize: rf(17), fontWeight: "bold", color: "#1F2937", marginLeft: s(10) },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: s(12),
    padding: s(14),
    marginBottom: vs(12),
    backgroundColor: "#F9FAFB",
    fontSize: rf(14),
    color: "#111"
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: s(12),
    maxHeight: vs(150),
    backgroundColor: "#fff",
    marginBottom: vs(10),
    overflow: "hidden"
  },
  dropdownItem: { padding: s(12), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },

  summaryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(15)
  },
  summaryItemName: { fontSize: rf(15), fontWeight: "bold", color: "#1F2937" },
  summaryItemPrice: { fontSize: rf(13), color: "#6B7280" },
  summaryQtyControls: { flexDirection: "row", alignItems: "center" },
  circleBtn: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    borderWidth: 1,
    borderColor: "#10B981",
    justifyContent: "center",
    alignItems: "center"
  },
  summaryQtyText: { marginHorizontal: s(10), fontSize: rf(15), fontWeight: "bold" },
  summaryItemTotal: { marginLeft: s(10), fontSize: rf(15), fontWeight: "bold", color: "#EF4444", width: s(60), textAlign: "right" },
  deleteBtn: { marginLeft: s(10), padding: s(4) },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: vs(15) },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: vs(3) },
  totalLabelSmall: { fontSize: rf(15), color: "#6B7280" },
  totalValueSmall: { fontSize: rf(15), fontWeight: "bold", color: "#111" },
  grandTotalLabel: { fontSize: rf(18), fontWeight: "bold", color: "#111" },
  grandTotalValue: { fontSize: rf(18), fontWeight: "bold", color: "#EF4444" },

  printSaveBtn: {
    backgroundColor: "#10B981",
    borderRadius: s(14),
    padding: vs(16),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(20)
  },
  printSaveBtnText: { color: "#fff", fontSize: rf(16), fontWeight: "bold" },
  clearCartBtn: {
    marginTop: vs(15),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  clearCartText: { marginLeft: s(8), color: "#94A3B8", fontSize: rf(14), fontWeight: "600" },

  modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContentCentered: { backgroundColor: '#fff', borderRadius: s(32), padding: s(24), width: '80%', alignItems: 'center' },
  successTitleText: { fontSize: rf(24), fontWeight: 'bold', color: '#10B981', marginTop: 10, textAlign: 'center' },
  modalBtn: { backgroundColor: "#10b981", paddingVertical: vs(12), paddingHorizontal: s(30), borderRadius: s(12), marginTop: vs(20) },
  modalBtnText: { color: "#fff", fontSize: rf(16), fontWeight: "bold" },
});
