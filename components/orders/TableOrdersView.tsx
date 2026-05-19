import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleKOT } from "../common/SimpleKOT";

import { SimpleBill } from "../../utils/SimpleBill";

const THEME_PRIMARY = "#4F46E5";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  billNumber: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  businessId?: string;
  tableName?: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  tokenNumber?: string | number;
}

interface TableOrdersViewProps {
  tableId: string;
  tableName: string;
  onBack?: () => void;
  initialOrders?: Order[];
}

export default function TableOrdersView({
  tableId,
  tableName,
  onBack,
  initialOrders,
}: TableOrdersViewProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [loading, setLoading] = useState(initialOrders ? false : true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);

  const fetchInProgress = React.useRef(false);

  const getTokenRef = React.useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const fetchOrders = useCallback(async () => {
    if (!tableId || fetchInProgress.current) return;

    try {
      fetchInProgress.current = true;
      const token = await getTokenRef.current();

      const response = await fetch(
        `https://billing.kravy.in/api/orders?tableId=${tableId}&t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : data.orders || [];
        const filteredOrders = ordersArray.filter((o: any) => {
          const oTableId = String(
            o.tableId ||
              (o.table &&
                (typeof o.table === "string"
                  ? o.table
                  : o.table.id || o.table._id)) ||
              "",
          );
          return oTableId === String(tableId);
        });

        const normalizedOrders = filteredOrders.map((o: any) => ({
          ...o,
          id: o.id || o._id || Math.random().toString(),
        }));

        setOrders((prev) =>
          JSON.stringify(prev) === JSON.stringify(normalizedOrders)
            ? prev
            : normalizedOrders,
        );
        await AsyncStorage.setItem(
          `@cached_orders_${tableId}`,
          JSON.stringify(normalizedOrders),
        );
      }
    } catch (error) {
      const cached = await AsyncStorage.getItem(`@cached_orders_${tableId}`);
      if (cached) setOrders(JSON.parse(cached));
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [tableId]);

  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      // 🚀 1. Try Cache First (Immediate UI)
      const cached = await AsyncStorage.getItem("@cached_menu");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenuData((prev) =>
            JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed,
          );
        }
      }

      // 🚀 2. Network Sync (Fresh Data)
      const token = await getTokenRef.current();
      if (!token) {
        setMenuLoading(false);
        return;
      }

      const [menuRes, catRes] = await Promise.all([
        fetch(`https://billing.kravy.in/api/menu/view?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`https://billing.kravy.in/api/categories?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (menuRes.ok && catRes.ok) {
        const itemsData = await menuRes.json();
        const catsData = await catRes.json();

        const items = Array.isArray(itemsData)
          ? itemsData
          : itemsData.items || itemsData.data || [];
        const cats = Array.isArray(catsData)
          ? catsData
          : catsData.data || catsData.categories || [];

        const assignedItemIds = new Set();
        const merged = cats.map((cat) => {
          const catId = cat.id || cat._id || cat.name;
          const catItems = items.filter((it) => {
            const itCat = it.category;
            const itCatId =
              typeof itCat === "string"
                ? itCat
                : itCat?.id || itCat?._id || it.categoryId;
            const match = itCatId === catId || itCat === cat.name;
            if (match) assignedItemIds.add(it.id || it._id);
            return match;
          });
          return { ...cat, id: catId, items: catItems };
        });

        const unassignedItems = items.filter(
          (it) => !assignedItemIds.has(it.id || it._id),
        );
        if (unassignedItems.length > 0) {
          merged.push({ id: "others", name: "Others", items: unassignedItems });
        }

        const finalData = merged.filter(
          (cat) => cat.items.length > 0 || cat.id !== "others",
        );

        if (finalData.length > 0) {
          setMenuData((prev) =>
            JSON.stringify(prev) === JSON.stringify(finalData)
              ? prev
              : finalData,
          );
          await AsyncStorage.setItem("@cached_menu", JSON.stringify(finalData));
        }
      }
    } catch (e) {
      console.log("Fetch menu error:", e);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const loadCache = async () => {
      if (tableId && orders.length === 0) {
        const cached = await AsyncStorage.getItem(`@cached_orders_${tableId}`);
        if (cached) {
          setOrders(JSON.parse(cached));
          setLoading(false);
        }
      }
    };
    loadCache();
  }, [tableId]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("REFRESH_ORDERS", fetchOrders);
    return () => sub.remove();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); // 🚀 Faster polling for real-time updates
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      try {
        const token = await getToken();
        const response = await fetch("https://billing.kravy.in/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId, status }),
        });
        if (response.ok) fetchOrders();
        else Alert.alert("Error", "Failed to update status");
      } catch (error) {
        console.error("Update status error:", error);
      }
    },
    [getToken, fetchOrders],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#F59E0B";
      case "PREPARING":
        return "#3B82F6";
      case "READY":
        return "#10B981";
      case "SERVED":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const handlePrintKOT = useCallback(
    async (item: Order) => {
      try {
        const token = await getToken();
        const cartItems = item.items.map((it: any) => ({
          name: it.name,
          quantity: it.quantity,
        }));
        await SimpleKOT(
          cartItems,
          token!,
          user?.id!,
          (tableName as string) || "Table",
        );
      } catch (error) {
        ToastAndroid.show("Print Error", ToastAndroid.SHORT);
      }
    },
    [getToken, user?.id, tableName],
  );

  const handlePrintBill = useCallback(
    async (item: Order) => {
      try {
        const token = await getToken();
        const cartItems = item.items.map((it: any) => ({
          id: it.productId || it.id || it._id || undefined,
          name: it.name,
          price: it.price || 0,
          quantity: it.quantity || 1,
          gst: it.gst || 0,
          taxType: it.taxType || "With Tax",
        }));

        const res = await SimpleBill(cartItems, token!, user?.id!, {
          orderId: item.id as string,
          customerName: item.customerName || "Table Guest",
          phone: item.customerPhone || "",
          customerAddress: item.customerAddress || "",
          paymentMode: "Cash",
          tableName: item.tableName || (tableName as string) || "Table",
          businessId: item.businessId,
          billId: item.id as string,
          billNumber: item.billNumber,
          source: "ONLINE",
          tokenNo: item.tokenNumber,
        });

        if (res.status === "success") {
          ToastAndroid.show("Bill Finalized & Saved", ToastAndroid.SHORT);
          // 🚀 FIX: Explicitly mark order as COMPLETED to prevent it from going to "HOLD"
          await updateOrderStatus(item.id, "COMPLETED");
        }
      } catch (error) {
        console.log("Print/Save Error:", error);
        ToastAndroid.show("Finalization Error", ToastAndroid.SHORT);
      }
    },
    [getToken, user?.id, tableName, updateOrderStatus],
  );

  const addItemToOrder = useCallback(
    async (orderId: string, itemsToAdd: any[]) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || itemsToAdd.length === 0) return;

      let additionalTotal = 0;
      const newOrderItems = itemsToAdd.map((it) => {
        const price = it.sellingPrice || it.price || 0;
        additionalTotal += price * it.quantity;
        return {
          name: it.name,
          price: price,
          quantity: it.quantity,
          productId: it.id || it._id,
        };
      });

      const updatedItems = [...order.items, ...newOrderItems];
      const updatedTotal = order.total + additionalTotal;

      // 🚀 Optimistic Update: Update UI immediately
      const prevOrders = [...orders];
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: updatedItems, total: updatedTotal }
            : o,
        ),
      );
      setIsMenuModalVisible(false);
      setSelectedOrderId(null);
      ToastAndroid.show("✅ Item Added", ToastAndroid.SHORT);

      try {
        const token = await getToken();
        const response = await fetch("https://billing.kravy.in/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
            items: updatedItems,
            total: updatedTotal,
          }),
        });

        if (!response.ok) {
          setOrders(prevOrders); // Rollback
          ToastAndroid.show("❌ Server sync failed", ToastAndroid.SHORT);
        } else {
          fetchOrders(); // Refresh to sync everything
        }
      } catch (error) {
        setOrders(prevOrders); // Rollback
        ToastAndroid.show("❌ Network Error", ToastAndroid.SHORT);
      }
    },
    [orders, getToken, fetchOrders],
  );

  const handleAddItem = (item: Order) => {
    setSelectedOrderId(item.id);
    setIsMenuModalVisible(true);
    fetchMenu(); // 🚀 Refresh menu every time modal opens
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rf(26)} color="#1F2937" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{tableName || "Table Orders"}</Text>
          <Text style={styles.headerSubtitle}>
            Manage live orders from QR Menu
          </Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            getStatusColor={getStatusColor}
            updateOrderStatus={updateOrderStatus}
            handlePrintKOT={handlePrintKOT}
            handlePrintBill={handlePrintBill}
            onAddItem={handleAddItem}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrders();
            }}
          />
        }
      />

      <FullMenuModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
        categories={menuData}
        loading={menuLoading}
        onConfirm={(items: any[]) =>
          selectedOrderId && addItemToOrder(selectedOrderId, items)
        }
      />
    </SafeAreaView>
  );
}

const FullMenuModal = ({
  visible,
  onClose,
  categories,
  onConfirm,
  loading,
}: any) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setCart({});
      setSearchQuery("");
    }
  }, [visible]);

  useEffect(() => {
    if (categories.length > 0) {
      if (!activeCategory) {
        setActiveCategory(
          categories[0].id || categories[0]._id || categories[0].name,
        );
      }
    }
  }, [categories]);

  const activeCategoryData = categories.find(
    (c) => (c.id || c._id || c.name) === activeCategory,
  );
  const activeItems = activeCategoryData?.items || [];

  const filteredItems = useMemo(() => {
    if (!searchQuery) return activeItems;
    const query = searchQuery.toLowerCase();
    let result: any[] = [];
    categories.forEach((cat: any) => {
      cat.items.forEach((item: any) => {
        if (item.name.toLowerCase().includes(query)) {
          result.push(item);
        }
      });
    });
    return result;
  }, [activeItems, categories, searchQuery]);

  const updateCart = (item: any, delta: number) => {
    setCart((prev) => {
      const id = item.id || item._id;
      const qty = (prev[id]?.quantity || 0) + delta;
      if (qty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: { ...item, quantity: qty } };
    });
  };

  const totalItems = Object.values(cart).reduce(
    (sum, it) => sum + it.quantity,
    0,
  );
  const totalAmount = Object.values(cart).reduce(
    (sum, it) => sum + (it.sellingPrice || it.price || 0) * it.quantity,
    0,
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.modalTitle}>Add Items to Order</Text>
                {loading && (
                  <Text style={{ fontSize: rf(10), color: THEME_PRIMARY }}>
                    Syncing...
                  </Text>
                )}
              </View>
              <TextInput
                placeholder="🔍 Search all dishes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.modalSearchInput}
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={rf(24)} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {!searchQuery && (
              <View style={styles.sideBar}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {categories.map((cat: any) => {
                    const id = cat.id || cat._id || cat.name;
                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => setActiveCategory(id)}
                        style={[
                          styles.catItem,
                          activeCategory === id && styles.activeCatItem,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catItemText,
                            activeCategory === id && styles.activeCatItemText,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.itemsList}>
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id || item._id}
                renderItem={({ item }) => (
                  <View style={styles.menuItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>
                        ₹{item.sellingPrice || item.price}
                      </Text>
                    </View>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity
                        onPress={() => updateCart(item, -1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={rf(18)} color="#4F46E5" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>
                        {cart[item.id || item._id]?.quantity || 0}
                      </Text>
                      <TouchableOpacity
                        onPress={() => updateCart(item, 1)}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="add" size={rf(18)} color="#4F46E5" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: vs(100) }}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={{ color: "#6B7280" }}>No items found</Text>
                  </View>
                }
              />
            </View>
          </View>

          {totalItems > 0 && (
            <View style={styles.modalFooter}>
              <View>
                <Text style={styles.footerQty}>
                  {totalItems} Items Selected
                </Text>
                <Text style={styles.footerTotal}>
                  Total: ₹{totalAmount.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => onConfirm(Object.values(cart))}
              >
                <Text style={styles.confirmBtnText}>Add to Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const OrderCard = React.memo(
  ({
    item,
    getStatusColor,
    updateOrderStatus,
    handlePrintKOT,
    handlePrintBill,
    onAddItem,
  }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.billNumber}>Bill #{item.billNumber}</Text>
          <Text style={styles.orderTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      {item.items.map((it: any, idx: number) => (
        <View key={idx} style={styles.itemRow}>
          <Text style={styles.itemName}>
            {it.name} x{it.quantity}
          </Text>
          <Text style={styles.itemPrice}>
            ₹{(it.price * it.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
      {(item.customerName || item.customerPhone || item.customerAddress) && (
        <View style={styles.customerInfo}>
          <View style={styles.divider} />
          {item.customerName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={rf(14)} color="#4B5563" />
              <Text style={styles.infoText}>{item.customerName}</Text>
            </View>
          )}
          {item.customerPhone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={rf(14)} color="#4B5563" />
              <Text style={styles.infoText}>{item.customerPhone}</Text>
            </View>
          )}
          {item.customerAddress && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={rf(14)} color="#4B5563" />
              <Text style={styles.infoText}>{item.customerAddress}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.divider} />
      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ₹{item.total.toFixed(2)}</Text>
        <View style={styles.actionRow}>
          {item.status === "PENDING" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.startBtn]}
              onPress={() => updateOrderStatus(item.id, "PREPARING")}
            >
              <Text style={styles.actionBtnText}>Start</Text>
            </TouchableOpacity>
          )}
          {item.status === "PREPARING" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.readyBtn]}
              onPress={() => updateOrderStatus(item.id, "READY")}
            >
              <Text style={styles.actionBtnText}>Ready</Text>
            </TouchableOpacity>
          )}
          {item.status === "READY" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.handOverBtn]}
              onPress={() => updateOrderStatus(item.id, "SERVED")}
            >
              <Text style={styles.actionBtnText}>Hand Over</Text>
            </TouchableOpacity>
          )}
          {item.status === "SERVED" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => updateOrderStatus(item.id, "COMPLETED")}
            >
              <Text style={styles.actionBtnText}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.kotBtn]}
            onPress={() => handlePrintKOT(item)}
          >
            <Text style={styles.actionBtnText}>KOT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.printBtn]}
            onPress={() => handlePrintBill(item)}
          >
            <Text style={styles.actionBtnText}>Print</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.addItemBtn]}
            onPress={() => onAddItem(item)}
          >
            <Text style={styles.actionBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ),
);
OrderCard.displayName = "OrderCard";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: vs(15),
    paddingHorizontal: s(20),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingTop: vs(40),
  },
  backBtn: { marginRight: s(20) },
  headerTitle: { fontSize: rf(22), fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: rf(13), color: "#6B7280" },
  listContainer: { padding: s(15) },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(15),
    marginBottom: vs(15),
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(10),
  },
  billNumber: { fontSize: rf(16), fontWeight: "bold", color: "#111827" },
  orderTime: { fontSize: rf(12), color: "#6B7280" },
  statusBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(8),
  },
  statusText: { fontSize: rf(11), fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: vs(10) },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(5),
  },
  itemName: { fontSize: rf(14), color: "#374151" },
  itemPrice: { fontSize: rf(14), fontWeight: "600", color: "#111827" },
  footer: {
    marginTop: vs(5),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalText: { fontSize: rf(16), fontWeight: "bold", color: THEME_PRIMARY },
  actionRow: {
    flexDirection: "row",
    gap: s(8),
    justifyContent: "flex-end",
    flex: 1,
    flexWrap: "wrap",
  },
  actionBtn: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(8),
    minWidth: s(60),
    alignItems: "center",
  },
  startBtn: { backgroundColor: "#3B82F6" },
  readyBtn: { backgroundColor: "#10B981" },
  handOverBtn: { backgroundColor: "#6B7280" },
  completeBtn: { backgroundColor: "#000000" },
  kotBtn: { backgroundColor: "#F59E0B" },
  printBtn: { backgroundColor: "#F59E0B" },
  addItemBtn: { backgroundColor: "#4F46E5" },
  actionBtnText: { color: "#fff", fontSize: rf(11), fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(25),
    borderTopRightRadius: s(25),
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(15),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: rf(16),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: vs(5),
  },
  modalSearchInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: s(10),
    padding: s(8),
    fontSize: rf(14),
    marginTop: vs(5),
  },
  modalSubtitle: { fontSize: rf(12), color: "#6B7280" },
  closeBtn: { padding: s(5) },
  modalBody: { flex: 1, flexDirection: "row" },
  sideBar: {
    width: s(100),
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  catItem: {
    padding: s(15),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activeCatItem: {
    backgroundColor: "#EEF2FF",
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  catItemText: { fontSize: rf(12), color: "#6B7280", fontWeight: "600" },
  activeCatItemText: { color: "#4F46E5", fontWeight: "bold" },
  itemsList: { flex: 1, backgroundColor: "#fff" },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(15),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemName: { fontSize: rf(14), fontWeight: "bold", color: "#1F2937" },
  menuItemPrice: { fontSize: rf(13), color: "#6B7280", marginTop: vs(2) },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: s(20),
    padding: s(5),
  },
  qtyBtn: { padding: s(5) },
  qtyText: { marginHorizontal: s(10), fontSize: rf(14), fontWeight: "bold" },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(20),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
    paddingBottom: vs(50),
  },
  footerQty: { fontSize: rf(14), fontWeight: "bold", color: "#4F46E5" },
  footerTotal: { fontSize: rf(18), fontWeight: "bold", color: "#111827" },
  confirmBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: s(25),
    paddingVertical: vs(12),
    borderRadius: s(12),
  },
  confirmBtnText: { color: "#fff", fontSize: rf(14), fontWeight: "bold" },
  customerInfo: {
    marginTop: vs(5),
    backgroundColor: "#F9FAFB",
    padding: s(10),
    borderRadius: s(12),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(4),
    gap: s(6),
  },
  infoText: {
    fontSize: rf(12),
    color: "#4B5563",
    fontWeight: "500",
  },
});
