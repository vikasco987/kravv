"use client";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inventory" | "categories">(
    "inventory"
  );

  // Fetch inventory data
  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");
        const res = await fetch(
          "https://billing-backend-sable.vercel.app/api/menu/view",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        const allItems = data.menus.flatMap((cat: any) =>
          cat.items.map((i: any) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            stock: i.stock || 0,
            unit: i.unit,
            imageUrl: i.imageUrl,
          }))
        );
        setInventory(allItems);
      } catch (err) {
        console.error("Fetch inventory error:", err);
        setInventory([]);
      } finally {
        setLoading(false);
      }
    }
    if (isLoaded && isSignedIn) fetchInventory();
  }, [isLoaded, isSignedIn]);

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
        `https://billing-backend-sable.vercel.app/api/inventory/update`,
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/party/add-item")}
        >
          <Feather name="plus-circle" size={18} color="#fff" />
          <Text style={styles.addText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "inventory" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("inventory")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "inventory" && styles.tabTextActive,
            ]}
          >
            INVENTORY ({inventory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "categories" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("categories")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.tabTextActive,
            ]}
          >
            CATEGORIES
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {activeTab === "inventory" ? (
          inventory.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#6B7280" }}>
              No items found
            </Text>
          ) : (
            inventory.map((item) => (
              <View key={item.id} style={styles.cardRow}>
                <Image
                  source={{
                    uri:
                      item.imageUrl && item.imageUrl.startsWith("http")
                        ? item.imageUrl
                        : "https://via.placeholder.com/60?text=No+Image",
                  }}
                  style={styles.itemImage}
                />

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price || 0}</Text>
                  <Text
                    style={[
                      styles.stockText,
                      item.stock < 0 && styles.stockDanger,
                    ]}
                  >
                    Current Stock:{" "}
                    <Text style={styles.stockBold}>
                      {item.stock} {item.unit || ""}
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => updateStock(item.id, 1)}
                >
                  <Text style={styles.adjustText}>Adjust</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          <Text style={{ textAlign: "center", color: "#6B7280" }}>
            Categories tab content
          </Text>
        )}
      </ScrollView>

      {/* Bottom Floating Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bulkUploadBtn}
          onPress={() => router.push("/inventory/bulk-upload")}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={THEME_PRIMARY} />
          <Text style={styles.bulkText}>Bulk Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newFab}
          onPress={() => router.push("/inventory/add")}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR_BG, padding: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: THEME_PRIMARY },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_PRIMARY,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  tabActive: { backgroundColor: THEME_PRIMARY },
  tabText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },

  cardRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  itemPrice: { fontSize: 13, color: "#6B7280" },
  stockText: { fontSize: 12, color: "#374151" },
  stockBold: { fontWeight: "700", color: THEME_SUCCESS },
  stockDanger: { color: THEME_DANGER },

  adjustBtn: {
    borderWidth: 1,
    borderColor: THEME_PRIMARY,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  adjustText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 12 },

  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bulkUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
    marginRight: 10,
    elevation: 3,
  },
  bulkText: { marginLeft: 8, fontWeight: "600", color: THEME_PRIMARY },
  newFab: {
    backgroundColor: THEME_PRIMARY,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
