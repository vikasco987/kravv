"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
// @ts-ignore
import DateTimePicker from "@react-native-community/datetimepicker";
// @ts-ignore
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  // @ts-ignore
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRecentCompanyProfile } from "../../services/companyService";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill } from "../../utils/SimpleBill";


type CartItem = {
  id: string;
  name: string;
  price?: number;
  quantity: number;
  gst?: number;
  taxType?: string;
  hsnCode?: string;
};

type Party = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  dob?: string;
};

export default function BillPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [isCustSuccessVisible, setIsCustSuccessVisible] = useState(false);
  const [isCustWarningVisible, setIsCustWarningVisible] = useState(false);
  const [isCustErrorVisible, setIsCustErrorVisible] = useState(false);
  const [custErrorMessage, setCustErrorMessage] = useState("");

  const [parties, setParties] = useState<Party[]>([]);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const token = await getToken();
      if (token) {
        const data = await getRecentCompanyProfile(token);
        setCompany(data);
      }
    };
    fetchCompany();
  }, [getToken]);

  useEffect(() => {
    if (params.cart) {
      try {
        const parsed = JSON.parse(params.cart as string);
        setCart(Object.values(parsed));
      } catch (err) {
        console.error("Failed to parse cart params:", err);
      }
    }
  }, [params.cart]);

  const fetchParties = async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = isLoaded && isSignedIn ? await getToken() : null;
      const res = await fetch("https://billing.kravy.in/api/parties", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setParties(data);
        } else {
          const text = await res.text();
          console.warn("ℹ️ [Bill] Received non-JSON for parties. Body starts with:", text.slice(0, 50));
          setParties([]);
        }
      } else {
        const errorText = await res.text();
        console.error("Fetch parties error response:", errorText);
        setParties([]);
      }
    } catch (err) {
      console.error("Fetch parties error:", err);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [isLoaded, isSignedIn]);

  const [calc, setCalc] = useState({ 
    subtotalExcl: 0, 
    gstAmount: 0, 
    discountAmount: 0, 
    serviceChargeAmount: 0, 
    totalDue: 0,
    isTaxEnabled: false,
    taxRate: 5,
    gstLabel: "(5%)",
    perProductTaxEnabled: false,
    isDiscountEnabled: false,
    discountRate: 0,
    isServiceChargeEnabled: false,
    serviceChargeRate: 0
  });

  useEffect(() => {
    const calculateFinal = async () => {
      const settings = await AsyncStorage.multiGet([
        'tax_enabled', 'tax_rate', 'per_product_tax',
        'discount_enabled', 'discount_rate',
        'service_charge_enabled', 'service_charge_rate'
      ]);
      
      const sMap: Record<string, string | null> = {};
      settings.forEach(([key, val]) => sMap[key] = val);

      const isTaxEnabled = sMap['tax_enabled'] === 'true';
      const globalTaxRate = parseFloat(sMap['tax_rate'] || "5.00");
      const perProductTaxEnabled = sMap['per_product_tax'] === 'true';
      const isDiscountEnabled = sMap['discount_enabled'] === 'true';
      const discountRate = parseFloat(sMap['discount_rate'] || "0.00");
      const isServiceChargeEnabled = sMap['service_charge_enabled'] === 'true';
      const serviceChargeRate = parseFloat(sMap['service_charge_rate'] || "0.00");

      let totalTaxable = 0;
      let totalGst = 0;
      let totalGross = 0;

      // Calculate each item's tax contribution
      cart.forEach(item => {
          const itemPrice = item.price || 0;
          const qty = item.quantity;
          const lineTotal = itemPrice * qty;
          
          let itemGstRate = 0;
          if (perProductTaxEnabled && (item.gst !== null && item.gst !== undefined)) {
              itemGstRate = item.gst;
          } else if (isTaxEnabled) {
              itemGstRate = globalTaxRate;
          }

          let taxable = 0;
          let gst = 0;

          if (item.taxType === "With Tax") {
              // Inclusive
              taxable = lineTotal / (1 + itemGstRate / 100);
              gst = lineTotal - taxable;
          } else {
              // Exclusive (Default)
              taxable = lineTotal;
              gst = (lineTotal * itemGstRate) / 100;
          }

          totalTaxable += taxable;
          totalGst += gst;
          totalGross += (taxable + gst);
      });

      // Apply Discount on Taxable subtotal (Legal compliance)
      const discountAmount = isDiscountEnabled ? (totalTaxable * (discountRate / 100)) : 0;
      const taxableAfterDiscount = totalTaxable - discountAmount;
      
      // Pro-rata GST adjustment if discount applied (simplified for global discount)
      // If discount is global, we reduce the total GST proportionally
      const effectiveGst = isDiscountEnabled ? (totalGst * (taxableAfterDiscount / totalTaxable)) : totalGst;

      const serviceChargeAmount = isServiceChargeEnabled ? (taxableAfterDiscount * (serviceChargeRate / 100)) : 0;
      const subtotalFinal = taxableAfterDiscount + serviceChargeAmount;

      const finalTotal = subtotalFinal + effectiveGst;

      // Determine the GST label based on rates present in the cart
      let gstLabel = "";
      if (perProductTaxEnabled) {
          const rates = new Set(cart.map(item => {
              if (item.gst !== null && item.gst !== undefined) return item.gst;
              return isTaxEnabled ? globalTaxRate : 0;
          }));
          const rateList = Array.from(rates);
          if (rateList.length === 1) {
              gstLabel = `(${rateList[0]}%)`;
          } else if (rateList.length > 1) {
              gstLabel = "(Multi)";
          } else {
              gstLabel = `(${globalTaxRate}%)`;
          }
      } else {
          gstLabel = `(${globalTaxRate}%)`;
      }

      setCalc({
        subtotalExcl: subtotalFinal,
        gstAmount: Number(effectiveGst.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        serviceChargeAmount: Number(serviceChargeAmount.toFixed(2)),
        totalDue: Number(finalTotal.toFixed(2)),
        isTaxEnabled,
        taxRate: globalTaxRate,
        gstLabel,
        perProductTaxEnabled,
        isDiscountEnabled,
        discountRate,
        isServiceChargeEnabled,
        serviceChargeRate
      });
    };
    calculateFinal();
  }, [cart]);

  const increaseQty = (id: string) =>
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );

  const decreaseQty = (id: string) =>
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

  const clearCart = () => setCart([]);

  const handlePrintAndSave = async () => {
    if (!cart.length) return ToastAndroid.show("🛒 Cart empty!", ToastAndroid.SHORT);


    try {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated!");
      const userClerkId = user?.id || "";

      const result = await SimpleBill(cart, token, userClerkId, {
        customerName: selectedParty?.name || customerName,
        phone: selectedParty?.phone || phone,
        paymentMode: "CASH",
        notes: "Printed via Bluetooth",
        billId: params.heldOrderId as string, // Pass the held ID to convert it to a real bill
      });

      if (result?.status === "success") {
        setIsSuccessModalVisible(true);
        setTimeout(() => {
          setIsSuccessModalVisible(false);
          clearCart();
          setSelectedParty(null);
          router.replace("/(tabs)/menu");
        }, 2000);
      } else {
        ToastAndroid.show("⚠️ Failed to print or save bill", ToastAndroid.SHORT);
      }
    } catch (err: any) {
      console.error("Print error:", err);
      ToastAndroid.show("❌ Printing failed", ToastAndroid.SHORT);
    }
  };

  const handleAddCustomer = async () => {
    if (!customerName || !phone) {
      setIsCustWarningVisible(true);
      return;
    }

    try {
      const token = isLoaded && isSignedIn ? await getToken() : null;
      const response = await fetch(
        "https://billing.kravy.in/api/parties",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: customerName,
            phone,
            address: billingAddress,
            dob: dob ? dob.toISOString() : null,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsCustSuccessVisible(true);
        setTimeout(() => setIsCustSuccessVisible(false), 2000);
        setSelectedParty(data);
        fetchParties();
        setCustomerName("");
        setPhone("");
        setBillingAddress("");
        setDob(null);
      } else {
        const errorText = await response.text();
        // Changed to console.log to avoid red-line error logs for the user
        console.log("ℹ️ Add customer info:", errorText);
        try {
          const errData = JSON.parse(errorText);
          setCustErrorMessage(errData.error || "This action could not be completed.");
        } catch {
          setCustErrorMessage("Failed to add customer. Please check your connection.");
        }
        setIsCustErrorVisible(true);
      }
    } catch (err: any) {
      console.log("⚠️ Fetch error:", err.message);
      setCustErrorMessage("Network error. Please try again.");
      setIsCustErrorVisible(true);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f9fafb", paddingBottom: vs(48) }}>
      {/* Header Gradient */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>🧾 Billing Dashboard</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={rf(20)} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>



      {/* Customer Section */}
      <View style={styles.card}>
        <Text style={styles.label}>👤 Customer Details</Text>
        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => setShowPartyDropdown((prev) => !prev)}
        >
          <Text>{selectedParty ? selectedParty.name : "Select Existing Customer"}</Text>
          <Feather
            name={showPartyDropdown ? "chevron-up" : "chevron-down"}
            size={rf(18)}
            color="#4f46e5"
          />
        </TouchableOpacity>

        {showPartyDropdown && (
          <View style={styles.dropdown}>
            {parties.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedParty(p);
                  setShowPartyDropdown(false);
                  setCustomerName(p.name);
                  setPhone(p.phone);
                  setBillingAddress(p.address || "");
                  if (p.dob) setDob(new Date(p.dob));
                }}
              >
                <Text>{p.name} ({p.phone})</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer Name"
            placeholderTextColor="#1f1e1e63"
            style={styles.input}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            placeholderTextColor="#1f1e1e63"
            keyboardType="phone-pad"
            style={styles.input}
          />
          {/* <TextInput
            value={billingAddress}
            onChangeText={setBillingAddress}
            placeholder="Billing Address"
            multiline
            numberOfLines={3}
            style={[styles.input, { height: 80 }]}
          /> */}
          {/* <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[styles.input, { justifyContent: "center" }]}
          >
            <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
          </TouchableOpacity> */}
          {showPicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === "ios");
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}
          <TouchableOpacity onPress={handleAddCustomer} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Save Customer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart Items */}
      <View style={styles.card}>
        {company?.logoUrl && (
          <View style={{ alignItems: 'center', marginBottom: vs(10) }}>
            <Image 
              source={{ uri: company.logoUrl }} 
              style={{ width: s(60), height: s(60), borderRadius: s(30), resizeMode: 'contain' }} 
            />
            {company.companyName && (
              <Text style={{ fontSize: rf(20), fontWeight: 'bold', marginTop: vs(5) }}>{company.companyName}</Text>
            )}
            {company.gstNumber && (
              <Text style={{ fontSize: rf(12), color: '#666' }}>GSTIN: {company.gstNumber}</Text>
            )}
          </View>
        )}
        <Text style={[styles.sectionTitle, { marginLeft: 0, marginTop: 0, marginBottom: vs(10) }]}>🛍️ Cart Summary</Text>
        {cart.map((item) => (
          <View key={item.id} style={[styles.itemCard, { marginHorizontal: 0, paddingHorizontal: 0, elevation: 0, shadowOpacity: 0 }]}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => decreaseQty(item.id)}>
                <Feather name="minus-circle" size={rf(20)} color="#4ade80" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => increaseQty(item.id)}>
                <Feather name="plus-circle" size={rf(20)} color="#4ade80" />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
          </View>
        ))}
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{calc.subtotalExcl.toFixed(2)}</Text>
        </View>

        {(calc.isTaxEnabled || calc.perProductTaxEnabled) && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>GST {calc.gstLabel}</Text>
            <Text style={styles.summaryValue}>₹{calc.gstAmount.toFixed(2)}</Text>
          </View>
        )}

        {calc.isDiscountEnabled && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Discount ({calc.discountRate}%)</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>-₹{calc.discountAmount.toFixed(2)}</Text>
          </View>
        )}

        {calc.isServiceChargeEnabled && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>S. Charge ({calc.serviceChargeRate}%)</Text>
            <Text style={styles.summaryValue}>₹{calc.serviceChargeAmount.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalValue}>₹{calc.totalDue.toFixed(2)}</Text>
        </View>

        {cart.length > 0 && (
          <TouchableOpacity onPress={handlePrintAndSave} style={styles.printBtn}>
            <Text style={styles.printBtnText}>🧾 PRINT & SAVE BILL</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearCart}>🗑️ Clear Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        transparent={true}
        visible={isSuccessModalVisible}
        animationType="fade"
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={{ alignItems: 'center', paddingVertical: vs(20) }}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark-sharp" size={rf(40)} color="#10B981" />
              </View>
              <Text style={styles.successTitleText}>Bill Saved!</Text>
              <Text style={styles.successDetailText}>Your bill has been successfully printed and saved.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Warning Modal (Missing Info) */}
      <Modal
        transparent={true}
        visible={isWarningModalVisible}
        animationType="fade"
        onRequestClose={() => setIsWarningModalVisible(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.modalContentCentered, { backgroundColor: '#FFFBEB' }]}>
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              {/* Yellow Line with Name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                <View style={{ flex: 1, height: 1.5, backgroundColor: '#FDE68A' }} />
                <Text style={{ marginHorizontal: 10, color: '#D97706', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>WARNING</Text>
                <View style={{ flex: 1, height: 1.5, backgroundColor: '#FDE68A' }} />
              </View>

              <View style={[styles.warningCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Ionicons name="alert-circle-outline" size={rf(40)} color="#D97706" />
              </View>
              <Text style={[styles.successTitleText, { color: '#D97706' }]}>Missing Info</Text>
              <Text style={styles.successDetailText}>Please select or add a customer detail first to continue billing.</Text>

              {/* Bottom Yellow Line with Name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: vs(25), marginBottom: vs(5) }}>
                <View style={{ flex: 1, height: 1.5, backgroundColor: '#FDE68A' }} />
                <Text style={{ marginHorizontal: s(10), color: '#D97706', fontWeight: 'bold', fontSize: rf(10), letterSpacing: 2 }}>KRAVY-BILLING</Text>
                <View style={{ flex: 1, height: 1.5, backgroundColor: '#FDE68A' }} />
              </View>

              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: '#D97706', marginTop: vs(15), width: '100%', marginRight: 0, flex: 0 }]}
                onPress={() => setIsWarningModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: rf(18) }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Add Warning Modal */}
      <Modal
        transparent={true}
        visible={isCustWarningVisible}
        animationType="fade"
        onRequestClose={() => setIsCustWarningVisible(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.modalContentCentered, { backgroundColor: '#FFFBEB' }]}>
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <View style={[styles.warningCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Ionicons name="alert-circle-outline" size={rf(40)} color="#D97706" />
              </View>
              <Text style={[styles.successTitleText, { color: '#D97706' }]}>Missing Fields</Text>
              <Text style={styles.successDetailText}>Please enter the customer&apos;s name and phone number to save.</Text>

              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: '#D97706', marginTop: vs(24), width: '100%', marginRight: 0, flex: 0 }]}
                onPress={() => setIsCustWarningVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: rf(18) }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Add Success Modal */}
      <Modal
        transparent={true}
        visible={isCustSuccessVisible}
        animationType="fade"
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={{ alignItems: 'center', paddingVertical: vs(20) }}>
              <View style={styles.successCircle}>
                <Ionicons name="person-add-outline" size={rf(40)} color="#10B981" />
              </View>
              <Text style={styles.successTitleText}>Success!</Text>
              <Text style={styles.successDetailText}>Customer details have been saved successfully.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Customer Add Error Modal */}
      <Modal
        transparent={true}
        visible={isCustErrorVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsCustErrorVisible(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={[styles.modalContentCentered, {
            backgroundColor: '#FFF',
            padding: 24,
            borderWidth: 1,
            borderColor: '#FEE2E2',
            shadowColor: '#DC2626',
            shadowOpacity: 0.1,
            shadowRadius: 20
          }]}>
            <View style={{ alignItems: 'center' }}>
              {/* Top Header Design */}
                <View style={{
                width: s(60),
                height: s(60),
                borderRadius: s(30),
                backgroundColor: '#FEF2F2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: vs(20),
                borderWidth: 4,
                borderColor: '#FFF5F5'
              }}>
                <Ionicons name="alert-circle" size={rf(36)} color="#DC2626" />
              </View>

              <Text style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#1F2937',
                marginBottom: 10,
                textAlign: 'center'
              }}>Duplicate Record Found</Text>

              <View style={{
                backgroundColor: '#FEF2F2',
                padding: 15,
                borderRadius: 12,
                width: '100%',
                marginBottom: 25,
                borderLeftWidth: 4,
                borderLeftColor: '#DC2626'
              }}>
                <Text style={{
                  color: '#991B1B',
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '500'
                }}>
                  {custErrorMessage === "Phone already exists"
                    ? "This phone number is already registered in your database. Please search for the existing customer instead."
                    : custErrorMessage}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#DC2626',
                  width: '100%',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  shadowColor: '#DC2626',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5
                }}
                onPress={() => setIsCustErrorVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>DISMISS</Text>
              </TouchableOpacity>

              <Text style={{
                marginTop: 20,
                fontSize: 11,
                color: '#9CA3AF',
                fontWeight: '600',
                letterSpacing: 1
              }}>KRAVY BILLING SYSTEM</Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: vs(50),
    paddingBottom: vs(25),
    paddingHorizontal: s(20),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: rf(22), fontWeight: "bold", color: "#fff" },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: s(50),
    padding: s(8),
  },
  card: {
    margin: s(15),
    backgroundColor: "#fff",
    borderRadius: s(16),
    padding: s(16),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: rf(16), fontWeight: "600", color: "#111" },
  expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: s(10),
    padding: s(12),
    marginVertical: vs(6),
    backgroundColor: "#fafafa",

  },
  addBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: vs(14),
    borderRadius: s(10),
    marginTop: vs(8),
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: rf(16) },
  selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: s(10),
    padding: s(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: vs(8),
  },
  dropdown: { borderWidth: 1, borderColor: "#ddd", borderRadius: s(8), maxHeight: vs(200) },
  dropdownItem: { padding: s(12), borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionTitle: {
    marginLeft: s(20),
    marginTop: vs(10),
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#374151",
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: s(14),
    marginHorizontal: s(15),
    marginVertical: vs(6),
    borderRadius: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  itemName: { fontSize: rf(15), fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: rf(13), color: "#6b7280", marginTop: vs(2) },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
  },
  qtyText: { fontSize: rf(16), fontWeight: "bold" },
  itemTotal: { fontSize: rf(16), fontWeight: "bold", color: "#ef4444" },
  footer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    padding: s(20),
    marginTop: vs(20),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: vs(4) },
  summaryText: { fontSize: rf(16), color: "#374151" },
  summaryValue: { fontSize: rf(16), fontWeight: "600" },
  totalLabel: { fontSize: rf(18), fontWeight: "bold", color: "#111" },
  totalValue: { fontSize: rf(18), fontWeight: "bold", color: "#ef4444" },
  printBtn: {
    backgroundColor: "#10b981",
    paddingVertical: vs(16),
    borderRadius: s(12),
    alignItems: "center",
    marginTop: vs(12),
  },
  printBtnText: { color: "#fff", fontSize: rf(18), fontWeight: "bold" },
  clearCart: { textAlign: "center", color: "#9ca3af", marginTop: vs(10) },
  // Success Modal Styles
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: s(20),
  },
  modalContentCentered: {
    backgroundColor: '#fff',
    borderRadius: s(32),
    padding: s(24),
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  successCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  warningCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    borderWidth: 2,
  },
  successTitleText: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: vs(8),
    textAlign: 'center',
  },
  successDetailText: {
    fontSize: rf(16),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: rf(22),
  },
  confirmCancelBtn: {
    padding: s(16),
    backgroundColor: '#F3F4F6',
    borderRadius: s(20),
    marginRight: s(8),
    alignItems: 'center',
  },
});
