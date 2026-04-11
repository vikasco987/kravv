import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill } from "../../utils/SimpleBill";

interface CheckoutViewProps {
  onBack?: () => void;
  cartParams?: any;
}

export default function CheckoutView({ onBack, cartParams }: CheckoutViewProps) {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const params = cartParams || rawParams;
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { t } = useLanguage();

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
  const [newParty, setNewParty] = useState({ name: "", phone: "" });
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isCustSuccessVisible, setIsCustSuccessVisible] = useState(false);
  const [isCustErrorVisible, setIsCustErrorVisible] = useState(false);
  const [custErrorMessage, setCustErrorMessage] = useState("");
  const [isCustWarningVisible, setIsCustWarningVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

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
    try {
      const token = await getToken();
      const res = await fetch("https://billing.kravy.in/api/parties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setParties(data.parties || []);
      }
    } catch (e) { console.error("Parties fetch error", e); }
  }, [getToken]);

  useFocusEffect(useCallback(() => { fetchParties(); }, [fetchParties]));

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const total = subtotal;

  const handlePrint = async () => {
    if (!selectedParty && !newParty.name) {
      setIsWarningModalVisible(true);
      return;
    }
    try {
      setIsProcessing(true);
      const token = await getToken();
      const result = await SimpleBill(cart, token!, user?.id!, {
        paymentMode,
        partyId: selectedParty?.id || selectedParty?._id,
        customerName: newParty.name,
        phone: newParty.phone,
      });

      if (result?.status === "success") {
        setIsSuccessModalVisible(true);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <LinearGradient colors={["#4F46E5", "#6366F1"]} style={styles.headerGradient}>
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <Ionicons name="close" size={rf(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkout')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: vs(100) }}>
        <View style={styles.card}>
          <Text style={styles.label}>{t('customer_details')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('search_customer')}
            value={searchQuery}
            onChangeText={t => { setSearchQuery(t); setShowPartyDropdown(true); }}
            onFocus={() => setShowPartyDropdown(true)}
          />
          {showPartyDropdown && searchQuery.length > 0 && (
            <View style={styles.dropdown}>
              {filteredParties.map(p => (
                <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => { setSelectedParty(p); setSearchQuery(p.name); setShowPartyDropdown(false); }}>
                  <Text>{p.name} ({p.phone})</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={() => setIsExpanding(!isExpanding)} style={{ marginTop: 10 }}>
            <Text style={{ color: "#4F46E5", fontWeight: "600" }}>+ {t('add_new_customer')}</Text>
          </TouchableOpacity>

          {isExpanding && (
            <View style={{ marginTop: 10 }}>
              <TextInput style={styles.input} placeholder="Name" value={newParty.name} onChangeText={t => setNewParty(p => ({ ...p, name: t }))} />
              <TextInput style={styles.input} placeholder="Phone" keyboardType="numeric" value={newParty.phone} onChangeText={t => setNewParty(p => ({ ...p, phone: t }))} />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('order_summary')}</Text>
        {cart.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>{t('total_amount')}</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
          <TouchableOpacity style={[styles.printBtn, isProcessing && { opacity: 0.7 }]} onPress={handlePrint} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.printBtnText}>{t('print_save')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent visible={isSuccessModalVisible} animationType="fade">
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <Ionicons name="checkmark-circle" size={rf(80)} color="#10B981" />
            <Text style={styles.successTitleText}>Bill Saved!</Text>
            <TouchableOpacity style={styles.printBtn} onPress={() => { setIsSuccessModalVisible(false); handleBack(); }}>
              <Text style={styles.printBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerGradient: { paddingTop: vs(50), paddingBottom: vs(25), paddingHorizontal: s(20), flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: rf(22), fontWeight: "bold", color: "#fff" },
  closeButton: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: s(50), padding: s(8) },
  card: { margin: s(15), backgroundColor: "#fff", borderRadius: s(16), padding: s(16), elevation: 3 },
  label: { fontSize: rf(16), fontWeight: "600", color: "#111", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: s(10), padding: s(12), marginVertical: vs(6), backgroundColor: "#fafafa" },
  dropdown: { borderWidth: 1, borderColor: "#ddd", borderRadius: s(8), maxHeight: vs(200), backgroundColor: '#fff' },
  dropdownItem: { padding: s(12), borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionTitle: { marginLeft: s(20), marginTop: vs(10), fontSize: rf(18), fontWeight: "bold", color: "#374151" },
  itemCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: s(14), marginHorizontal: s(15), marginVertical: vs(6), borderRadius: s(14), elevation: 2, alignItems: "center" },
  itemName: { fontSize: rf(15), fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: rf(13), color: "#6b7280", marginTop: vs(2) },
  itemTotal: { fontSize: rf(16), fontWeight: "bold", color: "#ef4444" },
  footer: { backgroundColor: "#fff", borderTopLeftRadius: s(20), borderTopRightRadius: s(20), padding: s(20), marginTop: vs(20), elevation: 5 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: vs(4) },
  totalLabel: { fontSize: rf(18), fontWeight: "bold", color: "#111" },
  totalValue: { fontSize: rf(18), fontWeight: "bold", color: "#ef4444" },
  printBtn: { backgroundColor: "#10b981", paddingVertical: vs(16), borderRadius: s(12), alignItems: "center", marginTop: vs(12) },
  printBtnText: { color: "#fff", fontSize: rf(18), fontWeight: "bold" },
  modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContentCentered: { backgroundColor: '#fff', borderRadius: s(32), padding: s(24), width: '80%', alignItems: 'center' },
  successTitleText: { fontSize: rf(24), fontWeight: 'bold', color: '#10B981', marginTop: 10, textAlign: 'center' },
});
