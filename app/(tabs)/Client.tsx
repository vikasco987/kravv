"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";

// ✅ Import AddPartyScreen component
import CustomerHistory from "../../components/customer-insights/CustomerHistory";
import NetworkErrorModal from "../../components/NetworkErrorModal";
import { PermissionGuard } from "../../components/PermissionGuard";
import AddPartyScreen from "../party/AddPartyScreen";

const THEME_PRIMARY = "#4F46E5";
const COLOR_BG_LIGHT = "#F5F5F5";

type Party = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  dob?: string;
  balance?: number;
  isFavorite?: boolean;
  hasCheckedOut?: boolean;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR_BG_LIGHT },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(15),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingTop: vs(50),
  },
  headerTitle: { fontSize: rf(20), fontWeight: "bold", color: "#1F2937" },
  infoDate: { fontSize: rf(13), color: "#6B7280" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#E5E7EB",
    marginHorizontal: s(15),
    marginVertical: vs(10),
    borderRadius: s(12),
    padding: s(4),
  },
  tab: { flex: 1, paddingVertical: vs(10), alignItems: "center", borderRadius: s(10) },
  activeTab: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: { color: "#4B5563", fontWeight: "600", fontSize: rf(14) },
  activeTabText: { color: THEME_PRIMARY, fontWeight: "bold" },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: s(12),
    marginHorizontal: s(15),
    marginBottom: vs(10),
    paddingHorizontal: s(12),
  },
  searchIcon: { marginRight: s(8) },
  filterInput: {
    flex: 1,
    paddingVertical: vs(12),
    fontSize: rf(16),
    color: "#1F2937",
  },
  partyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: s(15),
    borderRadius: s(12),
    marginVertical: vs(6),
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  partyInfo: { flex: 1 },
  partyName: { fontSize: rf(18), fontWeight: "bold", color: "#1F2937", marginBottom: vs(2) },
  partyPhone: { fontSize: rf(14), color: "#6B7280" },
  billingType: { fontSize: rf(12), color: "#9CA3AF", marginTop: vs(4) },
  iconGroup: { flexDirection: "row", alignItems: "center", paddingLeft: s(10) },
  icon: { marginLeft: s(8) },
  balanceIndicator: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(8),
    backgroundColor: "#EEF2FF",
    marginRight: s(10),
  },
  balanceText: { fontSize: rf(13), fontWeight: "bold", color: THEME_PRIMARY },
  fab: {
    position: "absolute",
    bottom: vs(30),
    right: s(30),
    flexDirection: "row",
    backgroundColor: THEME_PRIMARY,
    paddingVertical: vs(15),
    paddingHorizontal: s(20),
    borderRadius: s(30),
    elevation: 8,
    shadowColor: THEME_PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: rf(16), marginLeft: s(8) },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(100),
  },
  emptyText: {
    marginTop: vs(10),
    fontSize: rf(16),
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: s(32),
    padding: s(24),
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  avatarLarge: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: "#EEF2FF",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: THEME_PRIMARY,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: s(5),
  },
  detailsBody: {
    alignItems: 'center',
    marginBottom: vs(25),
  },
  detailsName: {
    fontSize: rf(24),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: vs(4),
    textAlign: 'center'
  },
  detailsPhone: {
    fontSize: rf(16),
    color: '#64748B',
    fontWeight: '500',
  },
  detailsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: vs(20),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: vs(18),
    paddingHorizontal: s(10),
  },
  detailIconWrapper: {
    width: s(42),
    height: s(42),
    borderRadius: s(12),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(15),
  },
  detailLabel: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: rf(15),
    color: '#334155',
    fontWeight: '700',
    marginTop: vs(2),
  },
  detailsActions: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(20),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(14),
    borderRadius: s(16),
    gap: s(8),
  },
  actionBtnText: {
    fontSize: rf(14),
    fontWeight: '700',
  },
  mainActionBtn: {
    backgroundColor: THEME_PRIMARY,
    paddingVertical: vs(16),
    borderRadius: s(18),
    alignItems: 'center',
    shadowColor: THEME_PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mainActionBtnText: {
    color: '#fff',
    fontSize: rf(16),
    fontWeight: '800',
  },
});

const PartyListItem: React.FC<{ item: Party; lifetimeSpend: number; onSelect: (party: Party) => void }> = ({
  item,
  lifetimeSpend,
  onSelect,
}) => {
  const { t } = useLanguage();
  return (
    <TouchableOpacity style={styles.partyRow} onPress={() => onSelect(item)}>
      <View style={styles.partyInfo}>
        <Text style={styles.partyName} numberOfLines={1}>
          {item.name || t('no_items')}
        </Text>
        <Text style={styles.partyPhone}>{item.phone}</Text>
        <Text style={styles.billingType}>Lifetime Sales: ₹{lifetimeSpend.toFixed(2)}</Text>
      </View>

      <View style={styles.iconGroup}>
        <View style={styles.balanceIndicator}>
          <Text style={styles.balanceText}>₹{(item.balance || 0).toFixed(2)}</Text>
        </View>
        <Ionicons name="call-outline" size={rf(20)} color="#FFD700" style={styles.icon} />
        <Ionicons name="logo-whatsapp" size={rf(20)} color="#25D366" style={styles.icon} />
        <Ionicons
          name={item.isFavorite ? "star" : "star-outline"}
          size={rf(20)}
          color="#FFC107"
          style={styles.icon}
        />
      </View>
    </TouchableOpacity>
  );
};

export default function CustomersScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"parties" | "categories">("parties");
  const [showAddPartyForm, setShowAddPartyForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { refreshSignal } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [allBills, setAllBills] = useState([]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [perProductTax, setPerProductTax] = useState(false);
  const [taxRate, setTaxRate] = useState(5);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountRate, setDiscountRate] = useState(0);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);
  const { t } = useLanguage();
  const [showNetworkError, setShowNetworkError] = useState(false);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.multiGet([
        'tax_enabled', 'per_product_tax', 'tax_rate',
        'discount_enabled', 'discount_rate',
        'service_charge_enabled', 'service_charge_rate'
      ]);
      const sMap: Record<string, string | null> = {};
      settings.forEach(([key, val]) => sMap[key] = val);

      setTaxEnabled(sMap['tax_enabled'] === 'true');
      setPerProductTax(sMap['per_product_tax'] === 'true');
      setTaxRate(parseFloat(sMap['tax_rate'] || '5'));
      setDiscountEnabled(sMap['discount_enabled'] === 'true');
      setDiscountRate(parseFloat(sMap['discount_rate'] || '0'));
      setServiceChargeEnabled(sMap['service_charge_enabled'] === 'true');
      setServiceChargeRate(parseFloat(sMap['service_charge_rate'] || '0'));
    } catch (e) {
      console.error("Failed to load settings in Client.tsx:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    loadSettings();
  }, [refreshSignal, showDetailsModal, showHistoryModal]);

  const fetchParties = async (silent = false) => {
    if (!isLoaded || !isSignedIn) {
      setParties([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    // Also fetch bills to keep balances real-time
    fetchBills();
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
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
          console.warn("ℹ️ [Client] Received HTML instead of JSON for parties. Body starts with:", text.slice(0, 50));
          setParties([]);
        }
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch parties:", errorText);
        setParties([]);
      }
    } catch (err: any) {
      if (err.message === "Network request failed") {
        setShowNetworkError(true);
      } else {
        console.log("Error fetching parties:", err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBills = async () => {
    try {
      const token = isLoaded && isSignedIn ? await getToken() : null;
      if (!token) return;

      const res = await fetch(`https://billing.kravy.in/api/bill-manager?t=${Date.now()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.bills) {
          setAllBills(data.bills);
        }
      }
    } catch (err: any) {
      if (err.message === "Network request failed") {
        setShowNetworkError(true);
      } else {
        console.log("Critical Sync Log:", err.message);
      }
    }
  };

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchParties(true);
      fetchBills();
    }
  }, [refreshSignal]);

  useEffect(() => {
    if (isLoaded) {
      fetchParties();
      fetchBills();
    }
  }, [isLoaded, isSignedIn]);

  // ✅ AUTO-REFRESH ON TAB FOCUS (No more manual work)
  useFocusEffect(
    useCallback(() => {
      if (isLoaded && isSignedIn) {
        fetchParties(true); // Silent refresh in background
        fetchBills();
      }
    }, [isLoaded, isSignedIn])
  );

  const handleSelectAccount = (party: Party) => {
    fetchBills();
    setSelectedParty(party);
    setShowDetailsModal(true);
  };

  // ✅ INDUSTRIAL PAYMENT CALCULATOR (Using ID + Phone for 100% Accuracy)
  const customerStats = React.useMemo(() => {
    if (!selectedParty || !allBills || allBills.length === 0) return { lifetimeSpend: 0, pending: 0 };

    // Unique Indicators
    const pId = (selectedParty as any).id || (selectedParty as any)._id;
    const tPhone = (selectedParty.phone || "").replace(/\D/g, '');
    const cleanTP = tPhone.length > 10 ? tPhone.slice(-10) : tPhone;
    const tName = (selectedParty.name || "").toLowerCase().trim();

    const relatedBills = allBills.filter((bill: any) => {
      // 1. Matched by ID (Highest Accuracy)
      if (pId && (bill.partyId === pId || bill.customerId === pId || bill.party === pId)) return true;

      // 2. Fallback to Phone Match
      const bPhone = (bill.customerPhone || bill.phone || "").replace(/\D/g, '');
      const cleanBP = bPhone.length > 10 ? bPhone.slice(-10) : bPhone;
      if (cleanTP && cleanBP && cleanTP === cleanBP) return true;

      // 3. Last Resort: Name Match
      const bName = (bill.customerName || bill.name || "").toLowerCase().trim();
      if (tName && bName && (bName.includes(tName) || tName.includes(bName))) return true;

      return false;
    });

    let lifetimeSpend = 0;
    let pending = 0;

    relatedBills.forEach((bill: any) => {
      // 🛡️ DYNAMIC OVERRIDE LOGIC (Exact Dashboard Parity)
      let totalTaxable = 0;
      let totalGst = 0;

      (bill.items || []).forEach((item: any) => {
        const itemPrice = Number(item.price || item.rate || 0);
        const qty = Number(item.quantity || item.qty || 1);
        const lineTotal = itemPrice * qty;

        // ⚖️ POS-PARITY PRIORITY: 
        // 1. If Global Tax is ON -> It overrides EVERYTHING (12% for Bill 2)
        // 2. If Global is OFF -> It respects individual Product GST (28% for Bill 1)
        let itemGstRate = 0;
        if (taxEnabled) {
          itemGstRate = taxRate;
        } else if (perProductTax) {
          itemGstRate = Number(item.gst || item.gst_percent || 0);
        }

        let taxable = 0;
        let gst = 0;
        const mode = (item.taxStatus || item.taxType || "Without Tax");

        if (mode === "With Tax") {
          taxable = lineTotal / (1 + itemGstRate / 100);
          gst = lineTotal - taxable;
        } else {
          taxable = lineTotal;
          gst = (lineTotal * itemGstRate) / 100;
        }
        totalTaxable += taxable;
        totalGst += gst;
      });

      const dAmt = discountEnabled ? (totalTaxable * (discountRate / 100)) : 0;
      const taxableAfterDisc = totalTaxable - dAmt;
      const scAmt = serviceChargeEnabled ? (taxableAfterDisc * (serviceChargeRate / 100)) : 0;
      const netTaxableVal = taxableAfterDisc + scAmt;

      const avgGstRate = totalTaxable > 0 ? (totalGst / totalTaxable) : 0;
      const finalGstAmt = netTaxableVal * avgGstRate;

      const calculatedTotal = Math.floor((netTaxableVal + finalGstAmt) * 100) / 100;
      const storedTotal = Number(bill.total || bill.grandTotal || bill.totalAmount || 0);
      const received = Number(bill.receivedAmount || 0);

      // Using Max preserves the historical 41.47 bill even while current Global is 12%
      // This is the EXACT logic from CustomerHistory.tsx (Order Intelligence)
      const effectiveTotal = Math.max(calculatedTotal, storedTotal, received);

      const status = (bill.paymentStatus || "").toUpperCase();
      lifetimeSpend += effectiveTotal;
      if (status !== "PAID") {
        pending += (effectiveTotal - received);
      }
    });

    return {
      lifetimeSpend: Number(lifetimeSpend.toFixed(2)),
      pending: Number(pending.toFixed(2))
    };
  }, [selectedParty, allBills, taxEnabled, perProductTax, taxRate, discountEnabled, discountRate, serviceChargeEnabled, serviceChargeRate]);

  // ✅ PRE-CALCULATE ALL PARTIES STATS (For unified display in list)
  const partiesStatsMap = React.useMemo(() => {
    const map: Record<string, { lifetimeSpend: number }> = {};
    if (!allBills || allBills.length === 0) return map;

    allBills.forEach((bill: any) => {
      const pId = bill.partyId || bill.customerId || bill.party;
      const bPhone = (bill.customerPhone || bill.phone || "").replace(/\D/g, '');
      const cleanBP = bPhone.length > 10 ? bPhone.slice(-10) : bPhone;

      // ✅ SMART MULTI-STEP CALCULATION (Exact Dashboard Mirror)
      let billTaxable = 0;
      let billGst = 0;
      (bill.items || []).forEach((item: any) => {
        const p = Number(item.price || item.rate || 0);
        const q = Number(item.quantity || item.qty || 1);
        const line = p * q;
        let gRate = taxEnabled ? taxRate : Number(item.gst || 0);
        let mode = item.taxStatus || item.taxType || "Without Tax";

        let t = 0, g = 0;
        if (mode === "With Tax") {
          t = line / (1 + gRate / 100);
          g = line - t;
        } else {
          t = line;
          g = (line * gRate) / 100;
        }
        billTaxable += t;
        billGst += g;
      });

      const disc = discountEnabled ? (billTaxable * (discountRate / 100)) : 0;
      const sc = serviceChargeEnabled ? ((billTaxable - disc) * (serviceChargeRate / 100)) : 0;
      const net = (billTaxable - disc) + sc;
      const avgG = billTaxable > 0 ? (billGst / billTaxable) : 0;
      const calcTotal = Math.floor((net + (net * avgG)) * 100) / 100;

      const storedTotal = Number(bill.total || bill.grandTotal || bill.totalAmount || 0);
      const received = Number(bill.receivedAmount || 0);
      const billTotal = Math.max(calcTotal, storedTotal, received);

      // Link by ID or Phone
      const keys = [];
      if (pId) keys.push(String(pId));
      if (cleanBP) keys.push(`phone_${cleanBP}`);

      keys.forEach(k => {
        if (!map[k]) map[k] = { lifetimeSpend: 0 };
        map[k].lifetimeSpend += billTotal;
      });
    });

    // Cleanup: toFixed rounding inside the map values
    Object.keys(map).forEach(k => {
      map[k].lifetimeSpend = Number(map[k].lifetimeSpend.toFixed(2));
    });

    return map;
  }, [allBills]);

  const filteredParties = parties.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "parties" && styles.activeTab]}
          onPress={() => setActiveTab("parties")}
        >
          <Text style={[styles.tabText, activeTab === "parties" && styles.activeTabText]}>
            {t('parties')} ({parties.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => setActiveTab("categories")}
        >
          <Text style={[styles.tabText, activeTab === "categories" && styles.activeTabText]}>
            {t('categories')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter */}
      <View style={styles.filterContainer}>
        <Ionicons name="search" size={rf(20)} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={t('search')}
          placeholderTextColor="#6B7280"
          style={styles.filterInput}
        />
      </View>

      {/* Party List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME_PRIMARY} />
        </View>
      ) : activeTab === "parties" ? (
        <FlatList
          data={filteredParties}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchParties(true)} colors={[THEME_PRIMARY]} />
          }
          renderItem={({ item }) => {
            const pId = item.id || (item as any)._id;
            const phone = (item.phone || "").replace(/\D/g, '');
            const cleanP = phone.length > 10 ? phone.slice(-10) : phone;
            const stats = partiesStatsMap[pId] || partiesStatsMap[`phone_${cleanP}`] || { lifetimeSpend: 0 };

            return (
              <PartyListItem
                item={item}
                lifetimeSpend={stats.lifetimeSpend}
                onSelect={(p) => {
                  handleSelectAccount(p);
                }}
              />
            );
          }}
          contentContainerStyle={{ paddingHorizontal: s(15), paddingBottom: vs(100) }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={rf(64)} color="#D1D5DB" />
              <Text style={styles.emptyText}>{t('no_customers')}</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={rf(64)} color="#D1D5DB" />
          <Text style={styles.emptyText}>Categories feature coming soon...</Text>
        </View>
      )}

      {/* Floating Add Button */}
      <PermissionGuard requiredPermission="Customer Permissions - Add New Customer">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddPartyForm(true)}
        >
          <Feather name="plus-circle" size={rf(22)} color="#fff" />
          <Text style={styles.fabText}>{t('add_customer')}</Text>
        </TouchableOpacity>
      </PermissionGuard>

      {/* Modal for Add Party Form */}
      <Modal
        visible={showAddPartyForm}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddPartyForm(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <AddPartyScreen
            onSuccess={() => {
              setShowAddPartyForm(false);
              fetchParties();
            }}
            onBack={() => setShowAddPartyForm(false)}
          />
        </View>
      </Modal>

      {/* Modal for Customer Details */}
      <Modal
        visible={showDetailsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsHeader}>
              <View style={styles.avatarLarge}>
                <Ionicons name="person" size={rf(40)} color={THEME_PRIMARY} />
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setShowDetailsModal(false)}
              >
                <Ionicons name="close" size={rf(26)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsBody}>
              <Text style={styles.detailsName}>{selectedParty?.name || t('no_items')}</Text>
              <Text style={styles.detailsPhone}>{selectedParty?.phone}</Text>

              <View style={styles.detailsDivider} />

              <View style={styles.detailItem}>
                <View style={styles.detailIconWrapper}>
                  <Ionicons name="bar-chart-outline" size={rf(20)} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Lifetime Business (Total Sales)</Text>
                  <Text style={[styles.detailValue, { color: "#10B981" }]}>₹{(customerStats?.lifetimeSpend || 0).toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconWrapper}>
                  <Ionicons name="alert-circle-outline" size={rf(20)} color={(customerStats?.pending || 0) > 0 ? "#EF4444" : "#64748B"} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Pending Balance</Text>
                  <Text style={[styles.detailValue, { color: (customerStats?.pending || 0) > 0 ? "#EF4444" : "#64748B" }]}>
                    ₹{(customerStats?.pending || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconWrapper}>
                  <Ionicons name="location-outline" size={rf(20)} color={THEME_PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>{t('address')}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {selectedParty?.address || "No Address Added"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconWrapper}>
                  <Ionicons name="calendar-outline" size={rf(20)} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Regular billing</Text>
                  <Text style={styles.detailValue}>Since {selectedParty?.dob ? new Date(selectedParty.dob).toLocaleDateString() : "Founding"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#EEF2FF" }]}
                onPress={() => {
                  if (selectedParty?.phone) {
                    Linking.openURL(`tel:${selectedParty.phone}`);
                  }
                }}
              >
                <Ionicons name="call" size={rf(20)} color={THEME_PRIMARY} />
                <Text style={[styles.actionBtnText, { color: THEME_PRIMARY }]}>{t('call')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#F0FDF4" }]}
                onPress={async () => {
                  if (selectedParty?.phone) {
                    const cleanPhone = selectedParty.phone.replace(/\D/g, '');
                    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                    const url = `https://wa.me/${finalPhone}`;
                    try {
                      const supported = await Linking.canOpenURL(url);
                      if (supported) {
                        await Linking.openURL(url);
                      } else {
                        Alert.alert("WhatsApp Not Found", "WhatsApp is not installed on this device.");
                      }
                    } catch (err) {
                      Linking.openURL(url);
                    }
                  }
                }}
              >
                <Ionicons name="logo-whatsapp" size={rf(20)} color="#22C55E" />
                <Text style={[styles.actionBtnText, { color: "#22C55E" }]}>{t('whatsapp')}</Text>
              </TouchableOpacity>
            </View>

            <PermissionGuard requiredPermission="Customer Permissions - View Customer Data">
              <TouchableOpacity
                style={[styles.mainActionBtn, { backgroundColor: "#6366F1", marginBottom: vs(12) }]}
                onPress={() => setShowHistoryModal(true)}
              >
                <Text style={styles.mainActionBtnText}>View Customer Insights</Text>
              </TouchableOpacity>
            </PermissionGuard>

            <PermissionGuard requiredPermission="Customer Permissions - View Customer Data">
              <TouchableOpacity
                style={[styles.mainActionBtn, { backgroundColor: "#10B981", marginBottom: vs(12) }]}
                onPress={async () => {
                  if (selectedParty) {
                    await AsyncStorage.setItem('@active_customer', JSON.stringify(selectedParty));
                    setShowDetailsModal(false);
                    router.push("/(tabs)/menu");
                  }
                }}
              >
                <Text style={styles.mainActionBtnText}>+ New Order for this Customer</Text>
              </TouchableOpacity>
            </PermissionGuard>

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: "#1e293b" }]}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.mainActionBtnText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomerHistory
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        party={selectedParty}
        bills={allBills}
      />

      <NetworkErrorModal
        visible={showNetworkError}
        onClose={() => setShowNetworkError(false)}
      />
    </View>
  );
}
