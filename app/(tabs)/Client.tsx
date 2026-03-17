"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Linking,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { useRefresh } from "../../context/RefreshContext";

// ✅ Import AddPartyScreen component
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

const PartyListItem: React.FC<{ item: Party; onSelect: (party: Party) => void }> = ({
  item,
  onSelect,
}) => (
  <TouchableOpacity style={styles.partyRow} onPress={() => onSelect(item)}>
    <View style={styles.partyInfo}>
      <Text style={styles.partyName} numberOfLines={1}>
        {item.name || "Unnamed Customer"}
      </Text>
      <Text style={styles.partyPhone}>{item.phone}</Text>
      <Text style={styles.billingType}>Billing Type: REGULAR</Text>
    </View>

    <View style={styles.iconGroup}>
      <View style={styles.balanceIndicator}>
        <Text style={styles.balanceText}>₹{item.balance ? item.balance.toFixed(0) : 0}</Text>
      </View>
      <Ionicons name="call-outline" size={rf(20)} color="#FFD700" style={styles.icon} />
      <Ionicons name="logo-whatsapp" size={rf(20)} color="#25D366" style={styles.icon} />
      <Ionicons
        name={item.isFavorite ? "star" : "star-outline"}
        size={rf(20)}
        color="#FFC107"
        style={styles.icon}
      />
      {item.hasCheckedOut && (
        <Ionicons name="checkmark-circle" size={rf(20)} color="#10B981" style={styles.icon} />
      )}
    </View>
  </TouchableOpacity>
);

export default function CustomersScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"parties" | "categories">("parties");
  const [showAddPartyForm, setShowAddPartyForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { refreshSignal } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchParties = async (silent = false) => {
    if (!isLoaded || !isSignedIn) {
      setParties([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
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
    } catch (err) {
      console.error("Error fetching parties:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchParties(true);
    }
  }, [refreshSignal]);

  useEffect(() => {
    if (isLoaded) {
      fetchParties();
    }
  }, [isLoaded, isSignedIn]);

  const handleSelectParty = (party: Party) => {
    setSelectedParty(party);
    setShowDetailsModal(true);
  };

  const filteredParties = parties.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      {/* Search Filter */}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "parties" && styles.activeTab]}
          onPress={() => setActiveTab("parties")}
        >
          <Text style={[styles.tabText, activeTab === "parties" && styles.activeTabText]}>
            PARTIES ({parties.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => setActiveTab("categories")}
        >
          <Text style={[styles.tabText, activeTab === "categories" && styles.activeTabText]}>
            CATEGORIES
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter */}
      <View style={styles.filterContainer}>
        <Ionicons name="search" size={rf(20)} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search by name or phone..."
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
          renderItem={({ item }) => <PartyListItem item={item} onSelect={handleSelectParty} />}
          contentContainerStyle={{ paddingHorizontal: s(15), paddingBottom: vs(100) }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={rf(64)} color="#D1D5DB" />
              <Text style={styles.emptyText}>No customers found</Text>
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddPartyForm(true)}
      >
        <Feather name="plus-circle" size={rf(22)} color="#fff" />
        <Text style={styles.fabText}>ADD CUSTOMER</Text>
      </TouchableOpacity>

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
              <Text style={styles.detailsName}>{selectedParty?.name || "Unnamed Customer"}</Text>
              <Text style={styles.detailsPhone}>{selectedParty?.phone}</Text>
              
              <View style={styles.detailsDivider} />
              
              <View style={styles.detailItem}>
                <View style={styles.detailIconWrapper}>
                  <Ionicons name="wallet-outline" size={rf(20)} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Current Balance</Text>
                  <Text style={[styles.detailValue, { color: "#10B981" }]}>₹{selectedParty?.balance?.toFixed(2) || "0.00"}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconWrapper}>
                  <Ionicons name="location-outline" size={rf(20)} color={THEME_PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Billing Address</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedParty?.address || "No address provided"}
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
                <Text style={[styles.actionBtnText, { color: THEME_PRIMARY }]}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: "#F0FDF4" }]}
                onPress={async () => {
                  if (selectedParty?.phone) {
                    // Clean phone number: remove any non-digit characters
                    const cleanPhone = selectedParty.phone.replace(/\D/g, '');
                    // Add 91 prefix if it's 10 digits
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
                      // Fallback: direct browser link
                      Linking.openURL(url);
                    }
                  }
                }}
              >
                <Ionicons name="logo-whatsapp" size={rf(20)} color="#22C55E" />
                <Text style={[styles.actionBtnText, { color: "#22C55E" }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.mainActionBtn}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.mainActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
