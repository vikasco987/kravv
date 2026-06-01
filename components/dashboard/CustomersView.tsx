import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill } from "../../utils/SimpleBill";

const CustomersView = ({ onClose }) => {
  const [parties, setParties] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    address: "",
    dob: ""
  });

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Deposit States
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositingParty, setDepositingParty] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // History States
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyParty, setHistoryParty] = useState(null);
  const [historyTab, setHistoryTab] = useState("invoices"); // "invoices" | "wallet"
  const [historyBills, setHistoryBills] = useState([]);
  const [historyWallet, setHistoryWallet] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredParties(parties);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = parties.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q))
      );
      setFilteredParties(filtered);
    }
  }, [searchQuery, parties]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const storedKeys = await AsyncStorage.multiGet(["authToken", "activeChildToken"]);
      const storedMap = Object.fromEntries(storedKeys);
      const token = storedMap["activeChildToken"] || storedMap["authToken"];

      const res = await fetch("https://billing.kravy.in/api/parties", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : data.parties || []).map((p) => ({
        id: p.id || p._id,
        name: p.name || "Unnamed",
        phone: p.phone || "—",
        address: p.address || "",
        dob: p.dob || null,
        loyaltyPoints: p.loyaltyPoints || 0,
        walletBalance: p.walletBalance || 0,
        createdAt: p.createdAt || new Date().toISOString()
      }));

      setParties(normalized);
      setFilteredParties(normalized);
    } catch (error) {
      console.log("Error fetching customers:", error);
      Alert.alert("Error", "Could not fetch customers from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Please enter a customer name.");
      return;
    }

    setSaving(true);
    try {
      const storedKeys = await AsyncStorage.multiGet(["authToken", "activeChildToken"]);
      const storedMap = Object.fromEntries(storedKeys);
      const token = storedMap["activeChildToken"] || storedMap["authToken"];

      const res = await fetch("https://billing.kravy.in/api/parties", {
        method: formData.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const newCustomer = await res.json();
        setSuccessMessage(formData.id ? "Customer updated successfully!" : "Customer added successfully!");
        setSuccessModalVisible(true);
        setModalVisible(false);
        setFormData({ id: "", name: "", phone: "", address: "", dob: "" });
        fetchCustomers(); // Refresh list to get real ID and updated sync
      } else {
        const errorData = await res.json();
        Alert.alert("Failed", errorData.error || "Could not save customer.");
      }
    } catch (error) {
      console.log("Error saving customer:", error);
      Alert.alert("Error", "A network error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const submitDeposit = async () => {
    if (!depositingParty || !depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositLoading(true);
    try {
      const storedKeys = await AsyncStorage.multiGet(["authToken", "activeChildToken"]);
      const storedMap = Object.fromEntries(storedKeys);
      const token = storedMap["activeChildToken"] || storedMap["authToken"];

      const res = await fetch("https://billing.kravy.in/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "deposit",
          partyId: depositingParty.id,
          amount: parseFloat(depositAmount),
          description: "Manual Cash Deposit"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setParties((prev) => prev.map((x) => x.id === depositingParty.id ? { ...x, walletBalance: data.balance } : x));
        setFilteredParties((prev) => prev.map((x) => x.id === depositingParty.id ? { ...x, walletBalance: data.balance } : x));
        setSuccessMessage(`Deposited ₹${depositAmount} successfully!`);
        setSuccessModalVisible(true);
        setDepositModalVisible(false);
        setDepositAmount("");
        setDepositingParty(null);
      } else {
        const errData = await res.json();
        Alert.alert("Failed", errData.error || "Deposit failed");
      }
    } catch (err) {
      Alert.alert("Error", "Error processing deposit");
    } finally {
      setDepositLoading(false);
    }
  };

  const fetchHistory = async (party) => {
    setHistoryParty(party);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    setHistoryTab("invoices");
    try {
      const storedKeys = await AsyncStorage.multiGet(["authToken", "activeChildToken"]);
      const storedMap = Object.fromEntries(storedKeys);
      const token = storedMap["activeChildToken"] || storedMap["authToken"];

      const [billsRes, walletRes] = await Promise.all([
        fetch(`https://billing.kravy.in/api/parties/${party.id}/bills`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://billing.kravy.in/api/wallet/history/${party.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (billsRes.ok) {
        const bData = await billsRes.json();
        setHistoryBills(bData.bills || []);
      }
      if (walletRes.ok) {
        const wData = await walletRes.json();
        setHistoryWallet(Array.isArray(wData) ? wData : (wData.history || []));
      }
    } catch (error) {
      console.log("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      id: p.id,
      name: p.name || "",
      phone: p.phone || "",
      address: p.address || "",
      dob: p.dob || ""
    });
    setModalVisible(true);
  };

  const handlePrint = async (type, data) => {
    if (type !== "BILL") return;
    try {
      const storedKeys = await AsyncStorage.multiGet(["authToken", "activeChildToken", "staff_session"]);
      const storedMap = Object.fromEntries(storedKeys);
      const token = storedMap["activeChildToken"] || storedMap["authToken"];
      const session = storedMap["staff_session"] ? JSON.parse(storedMap["staff_session"]) : null;
      const clerkId = session?.id || session?._id || null;

      const res = await fetch(`https://billing.kravy.in/api/bill-manager/${data.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let fullBill = data;
      if (res.ok) {
        const json = await res.json();
        fullBill = json.bill || data;
      }

      const cartItems = (fullBill.items || []).map(item => ({
        id: item.id || item._id || Math.random().toString(),
        name: item.name || item.itemName,
        price: item.price || item.rate || item.unitPrice || 0,
        quantity: item.quantity || item.qty || 1,
        gst: item.gst || item.gstRate || 0,
        taxStatus: item.taxStatus || "With Tax",
        editedPrice: item.price || item.rate || item.unitPrice || 0
      }));

      // Alert.alert("Printing", "Sending receipt to Bluetooth Printer...");

      await SimpleBill(cartItems, token, clerkId, {
        billId: fullBill.id || fullBill._id,
        billNumber: fullBill.billNumber,
        partyId: fullBill.partyId || historyParty?.id,
        customerName: historyParty?.name || fullBill.customerName || "Cash",
        phone: historyParty?.phone || fullBill.customerPhone || "",
        customerAddress: historyParty?.address || fullBill.customerAddress || "",
        paymentMode: fullBill.paymentMode || "Cash",
        silent: false
      });

      setSuccessMessage("Bill printed successfully!");
      setSuccessModalVisible(true);

    } catch (error) {
      console.log("Print Error:", error);
      Alert.alert("Print Error", "Could not print the bill. Ensure Bluetooth printer is connected.");
    }
  };

  const handleDelete = (p) => {
    Alert.alert("Disabled", "Deletion is disabled to maintain data integrity. Please contact administrator.");
  };

  const handleDeposit = (p) => {
    setDepositingParty(p);
    setDepositAmount("");
    setDepositModalVisible(true);
  };

  const handleHistory = (p) => {
    fetchHistory(p);
  };

  const renderCustomerCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>
            <Feather name="phone" size={rf(10)} /> {item.phone}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          {item.loyaltyPoints > 500 ? (
            <View style={[styles.badge, styles.goldBadge]}>
              <Feather name="award" size={rf(10)} color="#D97706" />
              <Text style={styles.goldText}>GOLD</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.silverBadge]}>
              <Text style={styles.silverText}>SILVER</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Feather name="map-pin" size={rf(10)} color="#64748B" />
          <Text style={styles.footerText} numberOfLines={1}>{item.address || "No Address"}</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="wallet-outline" size={rf(12)} color="#64748B" />
          <Text style={styles.footerText}>₹{(item.walletBalance || 0).toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleHistory(item)}>
          <Feather name="clock" size={rf(15)} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeposit(item)}>
          <MaterialCommunityIcons name="cash-plus" size={rf(14)} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Feather name="edit-2" size={rf(12)} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Feather name="trash-2" size={rf(12)} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Feather name="arrow-left" size={rf(16)} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title}>
            Customer <Text style={{ color: "#4F46E5" }}>CRM</Text>
          </Text>
          <Text style={styles.subtitle}>MANAGE DIRECTORY & WALLET</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={rf(14)} color="#fff" />
          <Text style={styles.addBtnText}>ADD NEW</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={rf(16)} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or address..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Feather name="x-circle" size={rf(16)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* STATS HORIZONTAL SCROLL */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContainer}
        >
          <View style={styles.statBoxScroll}>
            <Feather name="users" size={rf(14)} color="#3B82F6" style={{ marginBottom: vs(4) }} />
            <Text style={styles.statValue}>{parties.length}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>

          <View style={styles.statBoxScroll}>
            <Feather name="award" size={rf(14)} color="#D97706" style={{ marginBottom: vs(4) }} />
            <Text style={[styles.statValue, { color: "#D97706" }]}>
              {parties.filter((p) => (p.loyaltyPoints || 0) > 500).length}
            </Text>
            <Text style={styles.statLabel}>Top Tier</Text>
          </View>

          <View style={styles.statBoxScroll}>
            <Feather name="credit-card" size={rf(14)} color="#10B981" style={{ marginBottom: vs(4) }} />
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {parties.filter(p => new Date(p.createdAt || new Date()) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </Text>
            <Text style={styles.statLabel}>Recent Activity</Text>
          </View>

          <View style={styles.statBoxScroll}>
            <Feather name="map-pin" size={rf(14)} color="#F43F5E" style={{ marginBottom: vs(4) }} />
            <Text style={[styles.statValue, { color: "#F43F5E" }]}>
              {new Set(parties.filter(p => p.address).map(p => p.address.split(',')[0].trim())).size}
            </Text>
            <Text style={styles.statLabel}>Local Network</Text>
          </View>
        </ScrollView>
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Syncing Customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredParties}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderCustomerCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={rf(40)} color="#E2E8F0" />
              <Text style={styles.emptyText}>No Customers Found</Text>
              <Text style={styles.emptySubText}>Try a different search or add a new customer.</Text>
            </View>
          }
        />
      )}

      {/* ADD / EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formData.id ? "Edit Customer" : "Add New Customer"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={rf(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name <Text style={{ color: "red" }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Complete Address</Text>
                <TextInput
                  style={[styles.input, { height: vs(60), textAlignVertical: "top" }]}
                  placeholder="Street, Landmark, City..."
                  multiline
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.dob}
                  onChangeText={(text) => setFormData({ ...formData, dob: text })}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveCustomer}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE & SYNC CUSTOMER</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DEPOSIT MODAL */}
      <Modal visible={depositModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit to Wallet</Text>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <Feather name="x" size={rf(20)} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deposit Amount (₹) <Text style={{ color: "red" }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#10B981" }]}
              onPress={submitDeposit}
              disabled={depositLoading}
            >
              {depositLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>CONFIRM DEPOSIT</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal visible={historyModalVisible} transparent animationType="slide">
        <View style={styles.historyModalContainer}>
          <View style={styles.historyModalHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setHistoryModalVisible(false)}>
              <Feather name="arrow-left" size={rf(16)} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.title}>{historyParty?.name || "Customer"}</Text>
              <Text style={styles.subtitle}>HISTORY & WALLET</Text>
            </View>
          </View>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.historyTab, historyTab === "invoices" && { backgroundColor: "#4F46E5" }]}
              onPress={() => setHistoryTab("invoices")}
            >
              <Text style={[styles.historyTabText, historyTab === "invoices" && { color: "#fff" }]}>BILL HISTORY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyTab, historyTab === "wallet" && { backgroundColor: "#F59E0B" }]}
              onPress={() => setHistoryTab("wallet")}
            >
              <Text style={[styles.historyTabText, historyTab === "wallet" && { color: "#fff" }]}>WALLET STATEMENT</Text>
            </TouchableOpacity>
          </View>

          {/* Top Lifetime Stats Row */}
          {!historyLoading && historyTab === "invoices" && (
            <View style={styles.crmStatsContainer}>
              <View style={styles.crmStatsHeader}>
                <Text style={styles.crmStatsTitle}>CRM STATS</Text>
                <View style={styles.crmGoldBadge}>
                  <Feather name="award" size={rf(10)} color="#D97706" />
                  <Text style={styles.crmGoldBadgeText}>GOLD MEMBER</Text>
                </View>
              </View>
              <View style={styles.lifetimeStats}>
                <View style={[styles.lifetimeBox, { marginRight: s(12) }]}>
                  <Text style={styles.lifetimeTitle}>{historyBills.length}</Text>
                  <Text style={styles.lifetimeLabel}>TOTAL BILLS</Text>
                </View>
                <View style={styles.lifetimeBox}>
                  <Text style={[styles.lifetimeTitle, { color: "#10B981" }]}>
                    ₹{historyBills.reduce((s, b) => s + (b.total || b.grandTotal || 0), 0).toFixed(0)}
                  </Text>
                  <Text style={styles.lifetimeLabel}>LIFETIME VALUE</Text>
                </View>
              </View>
            </View>
          )}

          <ScrollView style={styles.historyContent}>
            {historyLoading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: vs(40) }} />
            ) : historyTab === "invoices" ? (
              <>
                <Text style={styles.sectionTitle}>RECENT BILLS</Text>
                {historyBills.length === 0 ? (
                  <Text style={styles.emptyText}>No bills found for this customer.</Text>
                ) : (
                  historyBills.map((b, i) => (
                    <View key={i} style={styles.webStyleCard}>
                      <View style={styles.webStyleCardTop}>
                        <View>
                          <Text style={styles.webStyleBillNo}>{b.billNumber || `#${i + 1}`}</Text>
                          <Text style={styles.webStyleDate}>{new Date(b.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.webStyleAmount}>₹{(b.total || b.grandTotal || 0).toFixed(2)}</Text>
                          <Text style={[styles.webStyleStatus, (b.paymentStatus || "").toLowerCase() === 'paid' ? { color: '#10B981' } : { color: '#F59E0B' }]}>
                            {b.paymentStatus || "Unpaid"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.webStyleCardBottom}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
                          <View style={styles.webStylePayMode}>
                            <Text style={styles.webStylePayModeText}>{b.paymentMode || "Cash"}</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.webStylePrintBtn, { paddingHorizontal: s(10), paddingVertical: vs(6) }]}
                            onPress={() => handlePrint("BILL", b)}
                          >
                            <Feather name="printer" size={rf(14)} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.webStyleDetails}>DETAILS</Text>
                          <Feather name="arrow-right" size={rf(10)} color="#4F46E5" style={{ marginLeft: s(4) }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(12) }}>
                  <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
                  <View style={styles.walletBadge}>
                    <Text style={styles.walletBadgeText}>Wallet Balance: ₹{(historyParty?.walletBalance || 0).toFixed(2)}</Text>
                  </View>
                </View>
                {historyWallet.length === 0 ? (
                  <Text style={styles.emptyText}>No wallet transactions yet.</Text>
                ) : (
                  historyWallet.map((t, i) => {
                    const isCredit = t.type === 'CREDIT' || t.action === 'deposit' || t.action === 'add';
                    return (
                      <View key={i} style={[styles.webStyleCard, { flexDirection: "row", alignItems: "center", paddingVertical: vs(12) }]}>
                        <View style={[styles.txIconBox, isCredit ? { backgroundColor: "rgba(16, 185, 129, 0.1)" } : { backgroundColor: "rgba(244, 63, 94, 0.1)" }]}>
                          <Feather name={isCredit ? "arrow-down" : "arrow-up"} size={rf(14)} color={isCredit ? "#10B981" : "#F43F5E"} />
                        </View>
                        <View style={{ flex: 1, marginLeft: s(12) }}>
                          <Text style={styles.webStyleBillNo}>{t.description || t.action}</Text>
                          <Text style={styles.webStyleDate}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={[styles.webStyleAmount, isCredit ? { color: "#10B981" } : { color: "#F43F5E" }]}>
                            {isCredit ? "+" : "-"} ₹{t.amount?.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Feather name="check" size={rf(32)} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successBtnText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomersView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingTop: Platform.OS === "android" ? vs(50) : vs(20),
    paddingBottom: vs(20),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: s(36),
    height: s(36),
    backgroundColor: "#F1F5F9",
    borderRadius: s(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(12),
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: rf(8),
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginTop: vs(2),
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(10),
    gap: s(6),
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: "#fff",
    fontSize: rf(10),
    fontWeight: "900",
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: s(20),
    marginTop: vs(16),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: vs(50),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: s(10),
  },
  searchInput: {
    flex: 1,
    fontSize: rf(12),
    fontWeight: "600",
    color: "#0F172A",
    height: "100%",
  },
  clearBtn: {
    padding: s(4),
  },
  statsScrollContainer: {
    paddingHorizontal: s(20),
    paddingBottom: vs(4),
  },
  statBoxScroll: {
    width: s(130),
    backgroundColor: "#fff",
    padding: s(16),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: s(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: rf(24),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(4),
  },
  statLabel: {
    fontSize: rf(10),
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  listContainer: {
    padding: s(20),
    paddingBottom: vs(100),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: s(16),
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(12),
  },
  avatarBox: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(12),
  },
  avatarText: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#4F46E5",
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: vs(2),
  },
  customerPhone: {
    fontSize: rf(11),
    fontWeight: "600",
    color: "#64748B",
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    gap: s(4),
  },
  goldBadge: {
    backgroundColor: "rgba(217, 119, 6, 0.1)",
  },
  silverBadge: {
    backgroundColor: "#F1F5F9",
  },
  goldText: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#D97706",
  },
  silverText: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#64748B",
  },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: vs(12),
    gap: s(16),
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    flex: 1,
  },
  footerText: {
    fontSize: rf(10),
    fontWeight: "700",
    color: "#64748B",
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: vs(12),
    fontSize: rf(12),
    fontWeight: "700",
    color: "#64748B",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(60),
  },
  emptyText: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#1E293B",
    marginTop: vs(16),
    marginBottom: vs(6),
  },
  emptySubText: {
    fontSize: rf(11),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: s(40),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    padding: s(24),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(24),
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#0F172A",
  },
  inputGroup: {
    marginBottom: vs(16),
  },
  inputLabel: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#334155",
    marginBottom: vs(8),
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    fontSize: rf(12),
    color: "#0F172A",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: s(14),
    paddingVertical: vs(16),
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(30),
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: rf(12),
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: vs(12),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: s(8),
  },
  actionBtn: {
    padding: s(8),
    backgroundColor: "#F8FAFC",
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  historyModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingTop: vs(50),
    paddingBottom: vs(20),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: s(4),
    marginHorizontal: s(20),
    marginTop: vs(16),
  },
  historyTab: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: "center",
    borderRadius: s(12),
  },
  historyTabText: {
    fontSize: rf(9),
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  historyContent: {
    padding: s(20),
  },
  historyItemCard: {
    backgroundColor: "#fff",
    padding: s(16),
    borderRadius: s(12),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyItemTitle: {
    fontSize: rf(12),
    fontWeight: "800",
    color: "#0F172A",
  },
  historyItemAmount: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#10B981",
  },
  historyItemSub: {
    fontSize: rf(10),
    color: "#64748B",
    marginTop: vs(4),
  },
  crmStatsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: s(20),
    marginTop: vs(16),
    padding: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  crmStatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
  },
  crmStatsTitle: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  crmGoldBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(12),
  },
  crmGoldBadgeText: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 0.5,
    marginLeft: s(4),
  },
  lifetimeStats: {
    flexDirection: "row",
  },
  lifetimeBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: s(16),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  lifetimeTitle: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#0F172A",
  },
  lifetimeLabel: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#64748B",
    marginTop: vs(2),
  },
  sectionTitle: {
    fontSize: rf(10),
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: vs(12),
    letterSpacing: 1,
  },
  webStyleCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(16),
    padding: s(16),
    marginBottom: vs(12),
  },
  webStyleCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: vs(8),
  },
  webStyleBillNo: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#0F172A",
  },
  webStyleDate: {
    fontSize: rf(9),
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: vs(2),
  },
  webStyleAmount: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#4F46E5",
  },
  webStyleStatus: {
    fontSize: rf(9),
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: vs(2),
  },
  webStyleCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: vs(8),
    marginTop: vs(4),
  },
  webStylePayMode: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
  },
  webStylePayModeText: {
    fontSize: rf(9),
    fontWeight: "900",
    color: "#64748B",
  },
  webStylePrintBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: s(6),
    paddingVertical: vs(4),
    borderRadius: s(6),
    alignItems: "center",
    justifyContent: "center",
  },
  webStyleDetails: {
    fontSize: rf(9),
    fontWeight: "900",
    color: "#4F46E5",
  },
  walletBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
  },
  walletBadgeText: {
    fontSize: rf(9),
    fontWeight: "900",
    color: "#F59E0B",
  },
  txIconBox: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    alignItems: "center",
    justifyContent: "center",
  },
  successModalContent: {
    backgroundColor: "#fff",
    width: "80%",
    maxWidth: 400,
    borderRadius: s(24),
    padding: s(24),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(16),
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(8),
  },
  successMessage: {
    fontSize: rf(11),
    color: "#64748B",
    textAlign: "center",
    marginBottom: vs(24),
    lineHeight: vs(18),
  },
  successBtn: {
    backgroundColor: "#10B981",
    paddingVertical: vs(12),
    paddingHorizontal: s(32),
    borderRadius: s(12),
    width: "100%",
    alignItems: "center",
  },
  successBtnText: {
    color: "#fff",
    fontSize: rf(11),
    fontWeight: "900",
    letterSpacing: 1,
  },
});
