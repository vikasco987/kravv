"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useRefresh } from "../../context/RefreshContext";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";

const THEME_PRIMARY = "#4F46E5"; // Indigo
const THEME_SUCCESS = "#10B981"; // Green
const THEME_DANGER = "#EF4444"; // Red
const COLOR_BG = "#F9FAFB";

type InventoryItem = {
  id: string;
  name: string;
  price?: number;
  stock: number;
  unit?: string;
  imageUrl?: string;
};

export default function InventoryScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { refreshSignal } = useRefresh();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "categories">(
    "inventory"
  );

  // Fetch inventory data
  const fetchInventory = async (silent = false) => {
    try {
      if (!isLoaded || !isSignedIn) {
        setInventory([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (silent) setRefreshing(true);
      else setLoading(true);

      const token = await getToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch(
        "https://billing.kravy.in/api/menu/view",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (res.ok) {
        const data = await res.json();
        if (data && data.menus) {
          const allItems = data.menus.flatMap((cat: any) =>
            (cat.items || []).map((i: any) => ({
              id: i.id || i._id,
              name: i.name,
              price: i.price,
              stock: i.stock || 0,
              unit: i.unit,
              imageUrl: i.imageUrl,
            }))
          );
          setInventory(allItems);
        } else {
          setInventory([]);
        }
      } else {
        setInventory([]);
      }
    } catch (err) {
      console.error("Fetch inventory error:", err);
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoaded) fetchInventory();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchInventory(true);
    }
  }, [refreshSignal]);

  const updateStock = async (itemId: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, stock: Math.max((item.stock || 0) + delta, 0) }
          : item
      )
    );

    try {
      const token = await getToken();
      await fetch(
        `https://billing.kravy.in/api/inventory/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId, delta }),
        }
      );
    } catch (error) {
      console.error("Stock update failed:", error);
      Alert.alert("Error", "Could not update stock. Please try again.");
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME_PRIMARY} />
        <Text style={{ marginTop: 10 }}>Loading inventory...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("inventory")}
          style={[
            styles.tab,
            activeTab === "inventory" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "inventory" && styles.activeTabText,
            ]}
          >
            All Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("categories")}
          style={[
            styles.tab,
            activeTab === "categories" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.activeTabText,
            ]}
          >
            Low Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} colors={[THEME_PRIMARY]} />
        }
      >
        {activeTab === "inventory" ? (
          inventory.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#6B7280" }}>
              No items in inventory.
            </Text>
          ) : (
            inventory.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onUpdateStock={updateStock}
              />
            ))
          )
        ) : (
          inventory
            .filter((i) => i.stock < 10)
            .map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onUpdateStock={updateStock}
              />
            ))
        )}
      </ScrollView>
    </View>
  );
}

const InventoryCard = ({
  item,
  onUpdateStock,
}: {
  item: InventoryItem;
  onUpdateStock: (id: string, delta: number) => void;
}) => (
  <View style={styles.card}>
    <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.itemImage} />
    <View style={styles.cardContent}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemStock}>
        Stock: {item.stock} {item.unit}
      </Text>
      <Text style={styles.itemPrice}>Price: ₹{item.price}</Text>

      <View style={styles.stockActions}>
        <TouchableOpacity
          onPress={() => onUpdateStock(item.id, -1)}
          style={[styles.actionBtn, styles.minusBtn]}
        >
          <Feather name="minus" size={16} color={THEME_DANGER} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onUpdateStock(item.id, 1)}
          style={[styles.actionBtn, styles.plusBtn]}
        >
          <Feather name="plus" size={16} color={THEME_SUCCESS} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR_BG },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: { backgroundColor: THEME_PRIMARY },
  tabText: { color: "#4B5563", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  cardContent: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  itemStock: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: THEME_PRIMARY, marginTop: 4 },
  stockActions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 15,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  minusBtn: { borderColor: THEME_DANGER },
  plusBtn: { borderColor: THEME_SUCCESS },
});
