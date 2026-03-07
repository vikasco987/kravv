"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
// @ts-ignore
import DateTimePicker from "@react-native-community/datetimepicker";
// @ts-ignore
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { SimpleBill } from "../../utils/SimpleBill";
import CompanyInfoScreen from "./info";

type CartItem = {
  id: string;
  name: string;
  price?: number;
  quantity: number;
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
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  const [parties, setParties] = useState<Party[]>([]);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

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
        const data = await res.json();
        setParties(data);
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

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

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
    if (!selectedParty && (!customerName || !phone)) {
      Alert.alert("Missing Info", "Please select or add a customer first.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated!");
      const userClerkId = user?.id || "";

      const result = await SimpleBill(cart, token, userClerkId, {
        customerName: selectedParty?.name || customerName,
        phone: selectedParty?.phone || phone,
        paymentMode: "CASH",
        notes: "Printed via Bluetooth",
      });

      if (result?.status === "success") {
        ToastAndroid.show("✅ Bill Printed & Saved!", ToastAndroid.SHORT);
        clearCart();
        setSelectedParty(null);
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
      Alert.alert("Missing Fields", "Please enter name and phone number.");
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
        Alert.alert("✅ Success", "Customer added successfully!");
        setSelectedParty(data);
        fetchParties();
        setCustomerName("");
        setPhone("");
        setBillingAddress("");
        setDob(null);
      } else {
        const errorText = await response.text();
        console.error("Add customer error response:", errorText);
        Alert.alert("Error", `Failed to add customer (Status: ${response.status})`);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f9fafb" }}>
      {/* Header Gradient */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>🧾 Billing Dashboard</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Company Info */}
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => setShowCompanyInfo((prev) => !prev)}
          style={styles.expandHeader}
        >
          <Text style={styles.label}>🏢 Company Information</Text>
          <Feather
            name={showCompanyInfo ? "chevron-up" : "chevron-down"}
            size={20}
            color="#4f46e5"
          />
        </TouchableOpacity>
        {showCompanyInfo && <CompanyInfoScreen />}
      </View>

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
            size={18}
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
      <Text style={styles.sectionTitle}>🛍️ Cart Summary</Text>
      {cart.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={{ flex: 2 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
          <View style={styles.qtyContainer}>
            <TouchableOpacity onPress={() => decreaseQty(item.id)}>
              <Feather name="minus-circle" size={22} color="#4ade80" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => increaseQty(item.id)}>
              <Feather name="plus-circle" size={22} color="#4ade80" />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
        </View>
      ))}

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalValue}>₹{subtotal}</Text>
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
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: 8,
  },
  card: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 16, fontWeight: "600", color: "#111" },
  expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#fafafa",

  },
  addBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  dropdown: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, maxHeight: 200 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionTitle: {
    marginLeft: 20,
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  itemName: { fontSize: 15, fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qtyText: { fontSize: 16, fontWeight: "bold" },
  itemTotal: { fontSize: 16, fontWeight: "bold", color: "#ef4444" },
  footer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  summaryText: { fontSize: 16, color: "#374151" },
  summaryValue: { fontSize: 16, fontWeight: "600" },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: "#111" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
  printBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  printBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  clearCart: { textAlign: "center", color: "#9ca3af", marginTop: 10 },
});
