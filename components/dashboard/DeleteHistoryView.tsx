import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

const DeleteHistoryView = ({ onBack, onRefresh }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletedBills, setDeletedBills] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchDeletedBills = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const token = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const bId = await AsyncStorage.getItem("business_id");
      const finalToken = token || staffToken;

      const res = await fetch(
        `https://billing.kravy.in/api/bill-manager/deleted/list${bId ? `?businessId=${bId}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${finalToken}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setDeletedBills(data.deleted || []);
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error("Fetch deleted error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeletedBills();
  }, []);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === deletedBills.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletedBills.map((b) => b.id)));
    }
  };

  const performAction = async (payload) => {
    try {
      setLoading(true);
      const token = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const bId = await AsyncStorage.getItem("business_id");
      const finalToken = token || staffToken;

      const res = await fetch(
        `https://billing.kravy.in/api/bill-manager/action${bId ? `?businessId=${bId}` : ""}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${finalToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const resText = await res.text();
      if (res.ok) {
        Alert.alert("Success", "Action completed successfully.");
        fetchDeletedBills();
        if (
          (payload.action.includes("restore") ||
            payload.action === "restore") &&
          onRefresh
        ) {
          onRefresh();
        }
      } else {
        Alert.alert("Error", `Action failed: ${resText || res.status}`);
      }
    } catch (e) {
      console.error("Action error:", e);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (id) => {
    Alert.alert("Restore", "Restore this bill?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => performAction({ action: "restore", id }),
      },
    ]);
  };

  const handlePermanentDelete = (id) => {
    Alert.alert("Permanent Delete", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Forever",
        style: "destructive",
        onPress: () => performAction({ action: "hard-delete", id }),
      },
    ]);
  };

  const handleBulkAction = (actionType) => {
    if (selectedIds.size === 0) return;
    const isRestore = actionType === "restore";
    const actionLabel = isRestore ? "Restore All" : "Delete All";

    Alert.alert(
      "Bulk Action",
      `Are you sure you want to ${isRestore ? "restore" : "permanently delete"} ${selectedIds.size} items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: isRestore ? "default" : "destructive",
          onPress: () =>
            performAction({
              action: isRestore ? "bulk-restore" : "bulk-hard-delete",
              ids: Array.from(selectedIds),
            }),
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const snap = item.snapshot || {};
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={rf(22)}
              color={isSelected ? "#3154D4" : "#CBD5E1"}
              style={{ marginRight: s(10) }}
            />
            <Text style={styles.billNo}>#{snap.billNumber || "N/A"}</Text>
          </View>
          <Text style={styles.amount}>
            ₹{Number(snap.total || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.infoText}>
            <Ionicons name="person" size={12} />{" "}
            {snap.customer?.name || "Walk-in"}
          </Text>
          <Text style={styles.infoText}>
            <Ionicons name="time" size={12} />{" "}
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleRestore(item.id)}
            style={styles.smallActionBtn}
          >
            <Ionicons name="refresh" size={16} color="#10B981" />
            <Text style={[styles.actionText, { color: "#10B981" }]}>
              Restore
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#3154D4", "#1E3A8A"]} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rf(26)} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: s(15) }}>
          <Text style={styles.headerTitle}>Delete Bills History</Text>
          {deletedBills.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {selectedIds.size} of {deletedBills.length} selected
            </Text>
          )}
        </View>
        {deletedBills.length > 0 && (
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAll}>
            <Ionicons
              name={
                selectedIds.size === deletedBills.length &&
                deletedBills.length > 0
                  ? "checkbox"
                  : "square-outline"
              }
              size={rf(24)}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {selectedIds.size > 0 && (
        <View style={styles.bulkActionBar}>
          <TouchableOpacity
            style={[styles.bulkBtn, styles.bulkRestore]}
            onPress={() => handleBulkAction("restore")}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.bulkBtnText}>Restore All Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3154D4" />
        </View>
      ) : (
        <FlatList
          data={deletedBills}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            selectedIds.size > 0 && { paddingBottom: vs(100) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDeletedBills(true)}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trash-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No deleted bills found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingTop: vs(25),
    paddingBottom: vs(10),
    paddingHorizontal: s(20),
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: s(5) },
  headerTitle: {
    color: "#fff",
    fontSize: rf(18),
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: rf(12),
    marginTop: vs(2),
  },
  selectAll: { padding: s(5) },
  list: { padding: s(16) },
  card: {
    backgroundColor: "#fff",
    borderRadius: s(16),
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  selectedCard: {
    borderColor: "#3154D4",
    backgroundColor: "#F0F4FF",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  billNo: { fontSize: rf(16), fontWeight: "bold", color: "#1E293B" },
  amount: { fontSize: rf(18), fontWeight: "900", color: "#3154D4" },
  cardBody: { marginLeft: s(32), marginBottom: vs(10) },
  infoText: { fontSize: rf(12), color: "#64748B", marginBottom: vs(2) },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: s(15),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: vs(10),
    marginLeft: s(32),
  },
  smallActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
  },
  actionText: {
    fontSize: rf(12),
    fontWeight: "600",
  },
  bulkActionBar: {
    position: "absolute",
    bottom: vs(20),
    left: s(20),
    right: s(20),
    backgroundColor: "#1E293B",
    borderRadius: s(20),
    padding: s(12),
    flexDirection: "row",
    gap: s(10),
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(12),
    borderRadius: s(12),
    gap: s(8),
  },
  bulkRestore: {
    backgroundColor: "#10B981",
  },
  bulkDelete: {
    backgroundColor: "#EF4444",
  },
  bulkBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: rf(12),
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, alignItems: "center", marginTop: vs(100) },
  emptyText: { color: "#94A3B8", fontSize: rf(16), marginTop: vs(10) },
});

export default DeleteHistoryView;
