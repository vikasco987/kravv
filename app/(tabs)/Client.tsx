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
} from "react-native";
import { useRefresh } from "../../context/RefreshContext";

// ✅ Import AddPartyScreen component
import AddPartyScreen from "../party/AddPartyScreen";

const THEME_PRIMARY = "#4F46E5";
const COLOR_BG_LIGHT = "#F5F5F5";
const SCREEN_HEIGHT = Dimensions.get("window").height;

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
      <Ionicons name="call-outline" size={20} color="#FFD700" style={styles.icon} />
      <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.icon} />
      <Ionicons
        name={item.isFavorite ? "star" : "star-outline"}
        size={20}
        color="#FFC107"
        style={styles.icon}
      />
      {item.hasCheckedOut && (
        <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.icon} />
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
        const data = await res.json();
        setParties(data);
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
    Alert.alert("Customer Details", `Name: ${party.name}\nPhone: ${party.phone}`);
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
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
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
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Categories feature coming soon...</Text>
        </View>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddPartyForm(true)}
      >
        <Feather name="plus-circle" size={22} color="#fff" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR_BG_LIGHT },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingTop: 50,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  infoDate: { fontSize: 13, color: "#6B7280" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#E5E7EB",
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeTab: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: { color: "#4B5563", fontWeight: "600" },
  activeTabText: { color: THEME_PRIMARY, fontWeight: "bold" },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  filterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  partyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  partyInfo: { flex: 1 },
  partyName: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 2 },
  partyPhone: { fontSize: 14, color: "#6B7280" },
  billingType: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  iconGroup: { flexDirection: "row", alignItems: "center", paddingLeft: 10 },
  icon: { marginLeft: 8 },
  balanceIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    marginRight: 10,
  },
  balanceText: { fontSize: 13, fontWeight: "bold", color: THEME_PRIMARY },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    flexDirection: "row",
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: THEME_PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#9CA3AF",
  },
});
