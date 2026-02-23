"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  // @ts-ignore
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";

// Fixed imports based on project structure
import { SaveBill } from "../../components/SaveBill";
import { SimpleKOT } from "../../components/SimpleKOT";
import { SimpleBill } from "../../utils/SimpleBill";

// --- TYPE DEFINITIONS ---
type MenuItem = {
  id: string;
  name: string;
  price?: number;
  imageUrl?: string;
  unit?: string;
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

type CartItem = MenuItem & { quantity: number; editedPrice?: number; };

// --- CONSTANTS ---
const THEME_PRIMARY = "#4F46E5";
const THEME_SECONDARY = "#10B981";
const THEME_DANGER = "#DC2626";
const COLOR_BG_LIGHT = "#F9FAFB";
const COLOR_BG_DARK = "#FFFFFF";
const KOT_BUTTON_COLOR = "#6366F1";
const CATEGORY_COLUMN_WIDTH = 80;

export default function MenuScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  const [menus, setMenus] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
  const [received, setReceived] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);

  // @ts-ignore
  const flatListRef = useRef<any>(null);

  // Load sounds using new expo-audio API (SDK 54+)
  // Placeholder for sounds (files missing in assets folder)
  const addSound = { play: () => { } };
  const removeSound = { play: () => { } };

  // const addSound = useAudioPlayer(require("../../assets/images/sounds/add.mp3"));
  // const removeSound = useAudioPlayer(require("../../assets/images/sounds/remove.mp3"));

  // Sounds are now managed by useAudioPlayer hook automatically
  useEffect(() => {
    // No explicit load needed for basic play in SDK 54+ with useAudioPlayer
  }, []);

  const fetchMenus = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      if (!isLoaded || !isSignedIn) return;

      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const categoryList = data.menus || [];
      const sortedCategories = categoryList.sort((a: MenuCategory, b: MenuCategory) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

      const fullySortedMenus = sortedCategories.map((cat: MenuCategory) => ({
        ...cat,
        items: (cat.items || []).sort((itemA, itemB) =>
          itemA.name.localeCompare(itemB.name, undefined, { sensitivity: "base" })
        ),
      }));

      setMenus(fullySortedMenus);
    } catch (err) {
      console.error("Menu fetch error:", err);
      setMenus([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchMenus();
  }, [isLoaded, isSignedIn, user]);

  // ---------- SEARCH FILTER LOGIC ----------
  const filteredMenus = useMemo(() => {
    if (!searchQuery) return menus;

    const query = searchQuery.toLowerCase();
    return menus
      .map((cat) => {
        const categoryMatches = cat.name.toLowerCase().includes(query);
        const filteredItems = cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.price?.toString().includes(query)
        );

        if (categoryMatches || filteredItems.length > 0) {
          return { ...cat, items: categoryMatches ? cat.items : filteredItems };
        }
        return null;
      })
      .filter((cat) => cat !== null) as MenuCategory[];
  }, [searchQuery, menus]);

  const addToCart = async (item: MenuItem) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
    }));
    // @ts-ignore
    try { addSound?.play(); } catch { }
  };

  const removeFromCart = async (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (!existing) return prev;
      if (existing.quantity === 1) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }
      return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
    });
    // @ts-ignore
    try { removeSound?.play(); } catch { }
  };

  const deleteFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const clearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setCart({});
            setIsCartModalVisible(false);
          }
        },
      ]
    );
  };

  const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = Object.values(cart).reduce((sum, i) => sum + ((i.editedPrice ?? i.price ?? 0) * i.quantity), 0);

  const numColumns = screenWidth < 700 ? 3 : 4;
  const itemWidth = (screenWidth - CATEGORY_COLUMN_WIDTH - 24) / numColumns;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME_PRIMARY} />
        <Text style={{ marginTop: 10 }}>Organizing Menu A-Z...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.integratedHeaderBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Menu</Text>
          <TouchableOpacity
            style={styles.refreshIconButton}
            onPress={() => fetchMenus(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={THEME_PRIMARY} />
            ) : (
              <Ionicons name="refresh" size={22} color={THEME_PRIMARY} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerActionGroup}>
          <TouchableOpacity style={styles.integratedActionButton} onPress={() => router.push("/party/add")}>
            <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.integratedButtonText}>Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.integratedActionButton}>
            <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.integratedButtonText}>HOLD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.integratedActionButton}>
            <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.integratedButtonText}>Parcel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- ENHANCED SEARCH BAR --- */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={20} color="#4B5563" style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Search name, category, or price..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 10 }}>
              <Ionicons name="close-circle" size={20} color="#4B5563" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.row}>
        {/* Sidebar Categories */}
        <ScrollView style={styles.categoryColumn} showsVerticalScrollIndicator={false}>
          {filteredMenus.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryButton}
              onPress={() => {
                const index = filteredMenus.findIndex((c) => c.id === cat.id);
                if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
              }}
            >
              <Ionicons name="fast-food-outline" size={12} color="#fff" />
              <Text style={styles.categoryText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Item Grid */}
        <FlatList
          ref={flatListRef}
          data={filteredMenus}
          keyExtractor={(cat) => cat.id}
          contentContainerStyle={{ paddingBottom: 350 }}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          renderItem={({ item: cat }) => (
            <View>
              <Text style={styles.categoryHeader}>{cat.name}</Text>
              <View style={styles.gridContainer}>
                {cat.items.map((item) => {
                  const quantity = cart[item.id]?.quantity || 0;
                  return (
                    <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
                      <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8} style={{ width: "100%", alignItems: "center" }}>
                        <View>
                          <Image
                            source={{ uri: item.imageUrl?.startsWith("http") ? item.imageUrl : "https://via.placeholder.com/80?text=No+Image" }}
                            style={styles.itemImage}
                            resizeMode="cover"
                          />
                          {quantity > 0 && (
                            <TouchableOpacity style={styles.minusIcon} onPress={() => removeFromCart(item)}>
                              <Feather name="minus" size={12} color="#fff" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.bottomRow}>
                          <Text style={styles.itemPrice}>₹{item.price ?? "0"}</Text>
                          {quantity > 0 && (
                            <View style={styles.quantityBox}><Text style={styles.quantityText}>{quantity}</Text></View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        />
      </View>

      {/* Cart Summary & Actions */}
      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.summaryRow}>
            <TouchableOpacity
              style={styles.viewItemsButton}
              onPress={() => setIsCartModalVisible(true)}
            >
              <Feather name="shopping-cart" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.viewItemsText}>Items ({totalItems})</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.receivedContainer} onPress={() => setReceived(!received)}>
              <View style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}>
                {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
              </View>
              <Text style={styles.receivedText}>Received</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentSelector}>
            {["Cash", "Bank", "Check"].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
                onPress={() => setPaymentMethod(method as any)}
              >
                <Text style={[styles.paymentText, paymentMethod === method && { color: "#fff", fontWeight: "700" }]}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>


          <View style={styles.actionButtonsRow}>
            {/* KOT */}
            <TouchableOpacity style={styles.printKotButton} onPress={async () => {
              const token = await getToken();
              await SimpleKOT(Object.values(cart), token!, user?.id!);
              ToastAndroid.show("🍜 KOT Printed!", ToastAndroid.SHORT);
            }}>
              <Feather name="file-text" size={16} color="#fff" />
              <Text style={styles.printBillText}>KOT</Text>
            </TouchableOpacity>

            {/* BILL */}
            <TouchableOpacity style={styles.printBillButton} onPress={async () => {
              const token = await getToken();
              await SimpleBill(
                Object.values(cart),
                token!,
                user?.id!,
                { paymentMode: paymentMethod }
              );
              setCart({});
              ToastAndroid.show("🧾 Bill Printed!", ToastAndroid.SHORT);
            }}>
              <Feather name="printer" size={16} color="#fff" />
              <Text style={styles.printBillText}>BILL</Text>
            </TouchableOpacity>

            {/* SAVE BILL */}
            <TouchableOpacity
              style={styles.saveBillButton}
              onPress={async () => {
                const token = await getToken();

                await SaveBill(
                  Object.values(cart),
                  token!,
                  user?.id!,
                  { paymentMode: paymentMethod }
                );

                ToastAndroid.show("💾 Saved (No Print)", ToastAndroid.SHORT);
              }}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={styles.printBillText}>SAVE</Text>
            </TouchableOpacity>

            {/* NEXT / TOTAL */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/party/bill",
                  params: { cart: JSON.stringify(cart), paymentMethod },
                })
              }
            >
              <Text style={styles.primaryButtonText}>₹{totalAmount.toFixed(0)}</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>


        </View>
      )}

      {/* Cart Items Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCartModalVisible}
        onRequestClose={() => setIsCartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selected Items ({totalItems})</Text>
              <TouchableOpacity onPress={() => setIsCartModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.values(cart)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 12 }}>₹</Text>
                      <TextInput
                        value={String(item.editedPrice ?? item.price ?? 0)}
                        keyboardType="numeric"
                        style={{
                          borderBottomWidth: 1,
                          borderColor: "#D1D5DB",
                          minWidth: 60,
                          marginLeft: 4,
                          fontSize: 13,
                          textAlign: "center",
                          paddingVertical: 2,
                        }}
                        onChangeText={(val) => {
                          const newPrice = Number(val) || 0;
                          setCart((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              editedPrice: newPrice,
                            },
                          }));
                        }}
                      />
                      <Text style={{ fontSize: 12 }}> x {item.quantity}</Text>
                    </View>
                  </View>
                  <View style={styles.cartItemActions}>
                    <Text style={styles.cartItemTotal}>
                      ₹{((item.editedPrice ?? item.price ?? 0) * item.quantity).toFixed(2)}
                    </Text>

                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item)}>
                        <Feather name="minus" size={16} color={THEME_PRIMARY} />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                        <Feather name="plus" size={16} color={THEME_PRIMARY} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => deleteFromCart(item.id)} style={{ marginLeft: 10 }}>
                      <Feather name="trash-2" size={18} color={THEME_DANGER} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <View style={styles.modalFooter}>
              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Grand Total:</Text>
                <Text style={styles.modalTotalValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.clearAllButton} onPress={clearCart}>
                <Feather name="trash" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.clearAllText}>Clear All Items</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: { flex: 1, flexDirection: "row" },

  // --- SEARCH STYLES ---
  searchSection: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: COLOR_BG_LIGHT
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    height: 50,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
    height: "100%",
  },

  categoryColumn: { width: CATEGORY_COLUMN_WIDTH, backgroundColor: COLOR_BG_DARK, borderRightWidth: 1, borderColor: "#E5E7EB" },
  categoryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 6, marginVertical: 3, backgroundColor: THEME_PRIMARY, borderRadius: 8, marginHorizontal: 4 },
  categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10, textAlign: 'center' },
  categoryHeader: { fontSize: 11, fontWeight: "bold", backgroundColor: "#E0E7FF", padding: 3, marginTop: 10, borderRadius: 6, textAlign: "center", color: THEME_PRIMARY, marginHorizontal: 10 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, marginTop: 5 },
  gridItem: { backgroundColor: COLOR_BG_DARK, borderRadius: 10, padding: 6, margin: 4, alignItems: "center", elevation: 2 },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
  itemName: { fontSize: 13, fontWeight: "600", textAlign: "center", color: "#111", marginBottom: 2 },
  bottomRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  itemPrice: { fontSize: 11, color: THEME_DANGER, fontWeight: "bold" },
  quantityBox: { backgroundColor: THEME_SECONDARY, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  quantityText: { color: "#fff", fontWeight: "bold", fontSize: 10 },
  minusIcon: { position: "absolute", top: 0, right: 0, backgroundColor: THEME_DANGER, borderRadius: 10, padding: 2, zIndex: 10 },

  integratedHeaderBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  refreshIconButton: { marginLeft: 10, padding: 5 },
  headerActionGroup: { flexDirection: "row", backgroundColor: THEME_PRIMARY, borderRadius: 10, padding: 4 },
  integratedActionButton: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginHorizontal: 2 },
  integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },

  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 12, borderTopWidth: 1, borderColor: "#E5E7EB", zIndex: 999, elevation: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  viewItemsButton: { backgroundColor: THEME_PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  viewItemsText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  receivedContainer: { flexDirection: "row", alignItems: "center" },
  receivedCheckbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: THEME_PRIMARY, marginRight: 6, justifyContent: "center", alignItems: "center" },
  receivedText: { fontSize: 12, fontWeight: "500" },
  paymentSelector: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#F3F4F6", borderRadius: 8, marginBottom: 10, padding: 4 },
  paymentOption: { flex: 1, alignItems: "center", paddingVertical: 5, marginHorizontal: 2, borderRadius: 6, borderWidth: 1, borderColor: THEME_PRIMARY },
  paymentSelected: { backgroundColor: THEME_PRIMARY },
  paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
  actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  saveBillButton: { flex: 0.8, backgroundColor: "#2563EB", borderRadius: 8, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  printKotButton: { flex: 0.8, backgroundColor: KOT_BUTTON_COLOR, borderRadius: 8, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  printBillButton: { flex: 0.8, backgroundColor: THEME_DANGER, borderRadius: 8, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  primaryButton: { flex: 1.2, backgroundColor: THEME_SECONDARY, borderRadius: 8, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#111' },
  cartItemPrice: { fontSize: 12, color: '#6B7280' },
  cartItemActions: { flexDirection: 'row', alignItems: 'center' },
  cartItemTotal: { fontWeight: 'bold', fontSize: 14, marginRight: 15, width: 60, textAlign: 'right' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  qtyBtn: { padding: 4 },
  qtyVal: { paddingHorizontal: 8, fontWeight: 'bold', fontSize: 14 },
  modalFooter: { marginTop: 20, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#F3F4F6' },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTotalLabel: { fontSize: 18, fontWeight: 'bold' },
  modalTotalValue: { fontSize: 20, fontWeight: '900', color: THEME_PRIMARY },
  clearAllButton: { backgroundColor: THEME_DANGER, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  clearAllText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
