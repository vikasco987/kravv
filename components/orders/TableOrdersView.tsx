import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill, resolveOrderToken } from "../../utils/SimpleBill";
import { CustomToast } from "../common/CustomToast";
import { SimpleKOT } from "../common/SimpleKOT";
import { CategorySidebar } from "../menu/CategorySidebar";
import { MenuItemCard } from "../menu/MenuItemCard";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

const THEME_PRIMARY = "#5A45FF"; // Purple from screenshot
const THEME_SUCCESS = "#00A35C"; // Green from screenshot
const THEME_DARK = "#1C1C28"; // Dark blue from screenshot

interface OrderItem {
  id?: string;
  _id?: string;
  name: string;
  quantity: number;
  price: number;
  isVeg?: boolean;
}

interface Order {
  id: string;
  billNumber: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
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
  const [menuLoading, setMenuLoading] = useState(false);

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Merge Bills State
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<Set<string>>(new Set());

  // Bill Preview State
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  // Customer Details State
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);

  // Custom Toast State
  const [toastState, setToastState] = useState<{ visible: boolean, message: string, type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastState({ visible: true, message, type });
  };

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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : data.orders || [];
        const filteredOrders = ordersArray.filter((o: any) => {
          const oTableId = String(o.tableId || (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) || "");
          return oTableId === tableId && !o.isDeleted && o.status !== "COMPLETED" && o.status !== "SERVED";
        });
        filteredOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(filteredOrders);

        if (filteredOrders.length > 0 && !filteredOrders.find((o: any) => o.id === activeOrderId)) {
          setActiveOrderId(filteredOrders[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [tableId, activeOrderId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const hasAutoCreated = React.useRef(false);
  useEffect(() => {
    if (!loading && orders.length === 0 && !hasAutoCreated.current && !fetchInProgress.current) {
      hasAutoCreated.current = true;
      createNewOrder();
    }
  }, [loading, orders.length]);

  const fetchMenu = async () => {
    try {
      setMenuLoading(true);
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      const itemsUrl = bId
        ? `https://billing.kravy.in/api/menu/view?businessId=${bId}&t=${Date.now()}`
        : `https://billing.kravy.in/api/menu/view?t=${Date.now()}`;
      const catUrl = bId
        ? `https://billing.kravy.in/api/categories?businessId=${bId}&t=${Date.now()}`
        : `https://billing.kravy.in/api/categories?t=${Date.now()}`;

      const [menuRes, catRes] = await Promise.all([
        fetch(itemsUrl, {
          headers: { Authorization: `Bearer ${finalToken}`, "Cache-Control": "no-cache" },
        }).catch(() => null),
        fetch(catUrl, {
          headers: { Authorization: `Bearer ${finalToken}`, "Cache-Control": "no-cache" },
        }).catch(() => null),
      ]);

      let processedItems: any[] = [];
      const categoryMap: Record<string, any> = {};

      // Process Menu Items
      if (menuRes && menuRes.ok) {
        const items = await menuRes.json();
        let itemsList = Array.isArray(items) ? items : items?.menus || items?.items || [];

        if (items && Array.isArray(items.menus)) {
          items.menus.forEach((cat: any) => {
            const categoryRaw = { id: cat.id || cat._id || "others", name: cat.name || "Others" };
            if (Array.isArray(cat.items)) {
              cat.items.forEach((item: any) => {
                processedItems.push({ ...item, category: categoryRaw });
              });
            }
          });
        } else {
          processedItems = itemsList;
        }

        processedItems.forEach((item: any) => {
          const rawCat = item.category || { id: "others", name: "Others" };
          const catId = String(rawCat.id || rawCat._id || "others");
          const catName = String(rawCat.name || "Others");

          if (!categoryMap[catId]) {
            categoryMap[catId] = { id: catId, name: catName, items: [] };
          }

          const newItem = {
            id: String(item.id || item._id || Math.random().toString()),
            name: String(item.name || "Unnamed Item"),
            price: Number(item.sellingPrice || item.price || item.selling_price || 0),
            sellingPrice: Number(item.sellingPrice || item.price || item.selling_price || 0),
            imageUrl: item.imageUrl,
            isVeg: item.isVeg === false || item.isVeg === "false" || item.isVeg === 0 ? false : true,
          };

          categoryMap[catId].items.push(newItem);
        });
      }

      // Process Categories
      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        const allCats = Array.isArray(catData) ? catData : catData.data || catData.categories || [];
        if (Array.isArray(allCats)) {
          allCats.forEach((c: any) => {
            const cid = String(c.id || c._id);
            if (!categoryMap[cid]) {
              categoryMap[cid] = { id: cid, name: c.name, items: [] };
            }
          });
        }
      }

      const finalMenus = Object.values(categoryMap)
        .filter((cat) => cat.items.length > 0 || (cat.id !== "others" && cat.id !== "none"))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((cat) => ({
          ...cat,
          items: cat.items.sort((a: any, b: any) => a.name.localeCompare(b.name)),
        }));

      setMenuData(finalMenus);
    } catch (error) {
      console.error(error);
    } finally {
      setMenuLoading(false);
    }
  };

  const createNewOrder = async () => {
    try {
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;

      const response = await fetch("https://billing.kravy.in/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
        body: JSON.stringify({
          tableId,
          tableName,
          items: [],
          total: 0,
          status: "PENDING",
          source: "OFFLINE",
          paymentMode: "Pending"
        })
      });
      if (response.ok) {
        const newOrder = await response.json();
        const newId = newOrder.id || newOrder._id || newOrder.order?.id || newOrder.order?._id;
        ToastAndroid.show("New Order Created", ToastAndroid.SHORT);
        if (newId) {
          DeviceEventEmitter.emit('LOCAL_ORDER_CREATED', newId);
          setActiveOrderId(newId);
        }
        fetchOrders();
        setIsMenuModalVisible(true);
        fetchMenu();
      }
    } catch (error) {
      ToastAndroid.show("Network Error", ToastAndroid.SHORT);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // 1. Optimistic UI update instantly
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) return { ...o, status: newStatus };
      return o;
    }));

    if (newStatus === "PREPARING") {
      showToast("Order Accepted! Cooking Started.", "success");
      // Auto-print KOT if we just accepted it
      const order = orders.find(o => o.id === orderId);
      if (order && order.status === "PENDING" && order.items && order.items.length > 0) {
        handlePrintSpecificKOT(order.items);
      }
    } else if (newStatus === "READY") {
      showToast("Order Marked as Ready!", "success");
    }

    try {
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;

      const response = await fetch(`https://billing.kravy.in/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (response.ok) {
        // Sync in background
        fetchOrders();
      } else {
        const errorText = await response.text();
        console.error("updateOrderStatus Error:", response.status, errorText);
        showToast("Failed to update status", "error");
        fetchOrders(); // Revert on failure
      }
    } catch (error: any) {
      console.error("updateOrderStatus Catch:", error);
      showToast("Network Error", "error");
      fetchOrders(); // Revert on failure
    }
  };

  const handlePrintSpecificKOT = async (itemsToPrint: any[]) => {
    if (!activeOrder || itemsToPrint.length === 0) return;
    const authToken = await getToken();
    const staffToken = await AsyncStorage.getItem("staff_token");
    const finalToken = authToken || staffToken || "";

    let clerkId = user?.id;
    if (!clerkId) {
      const staffSessionStr = await AsyncStorage.getItem("staff_session");
      if (staffSessionStr) {
        const staffSession = JSON.parse(staffSessionStr);
        clerkId = staffSession?.id || "";
      }
    }

    ToastAndroid.show("Printing KOT...", ToastAndroid.SHORT);
    const backendToken = (activeOrder as any).tokenNumber || (activeOrder as any).dailyTokenNumber || (activeOrder as any).orderNumber || (activeOrder as any).billNumber || (activeOrder as any).kotNumbers?.[0]?.toString();
    const tokenNo = await resolveOrderToken(activeOrder.id, backendToken);

    const success = await SimpleKOT(
      itemsToPrint,
      finalToken,
      clerkId || "",
      tableName,
      tokenNo,
      null,
      (activeOrder as any).customerName
    );
    if (success) {
      ToastAndroid.show("KOT Printed Successfully", ToastAndroid.SHORT);
    }
  };

  const addItemToOrder = async (orderId: string, newItems: any[], shouldPrintKOT: boolean = false) => {
    if (!orderId || orderId === "null" || orderId === "undefined") {
      ToastAndroid.show("Please select or create an order first!", ToastAndroid.SHORT);
      return;
    }

    try {
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;

      let existingItems: any[] = [];
      const order = orders.find(o => String(o.id) === String(orderId) || String((o as any)._id) === String(orderId));

      if (order) {
        existingItems = order.items || [];
      } else {
        const getRes = await fetch(`https://billing.kravy.in/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${finalToken}` }
        });
        if (getRes.ok) {
          const fetchedOrder = await getRes.json();
          existingItems = fetchedOrder.items || [];
        } else {
          ToastAndroid.show("Order not found! Please refresh.", ToastAndroid.LONG);
          return;
        }
      }

      const combinedItems = [...existingItems, ...newItems];
      const newTotal = combinedItems.reduce((acc, item: any) => acc + (item.price || item.sellingPrice || 0) * item.quantity, 0);

      let targetStatus = order?.status;
      if (shouldPrintKOT && (order?.status === "PENDING" || order?.status === "ACCEPTED")) {
        targetStatus = "PREPARING";
      }

      const response = await fetch(`https://billing.kravy.in/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
        body: JSON.stringify({ orderId, items: combinedItems, total: newTotal, ...(targetStatus ? { status: targetStatus } : {}) }),
      });

      if (response.ok) {
        setIsMenuModalVisible(false);
        fetchOrders();
        ToastAndroid.show("Items Added", ToastAndroid.SHORT);

        if (shouldPrintKOT) {
          handlePrintSpecificKOT(newItems);
        }
      } else {
        const errorText = await response.text();
        console.error("addItemToOrder Error:", response.status, errorText);
        ToastAndroid.show("Error: " + response.status + " " + errorText.substring(0, 50), ToastAndroid.LONG);
      }
    } catch (error: any) {
      console.error("addItemToOrder Catch:", error);
      ToastAndroid.show("Network Error: " + error.message, ToastAndroid.LONG);
    }
  };

  const updateItemQuantity = async (orderId: string, itemIdx: number, delta: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newItems = [...order.items];
      newItems[itemIdx].quantity += delta;

      if (newItems[itemIdx].quantity <= 0) {
        newItems.splice(itemIdx, 1);
      }

      const newTotal = newItems.reduce((acc, item: any) => acc + (item.price || item.sellingPrice || 0) * item.quantity, 0);

      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;

      const response = await fetch(`https://billing.kravy.in/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
        body: JSON.stringify({ orderId, items: newItems, total: newTotal }),
      });

      if (response.ok) {
        fetchOrders();
      } else {
        ToastAndroid.show("Failed to update quantity", ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show("Network Error", ToastAndroid.SHORT);
    }
  };

  const handlePrintKOT = async () => {
    if (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) {
      ToastAndroid.show("No items to print", ToastAndroid.SHORT);
      return;
    }
    const authToken = await getToken();
    const staffToken = await AsyncStorage.getItem("staff_token");
    const finalToken = authToken || staffToken || "";

    let clerkId = user?.id;
    if (!clerkId) {
      const staffSessionStr = await AsyncStorage.getItem("staff_session");
      if (staffSessionStr) {
        const staffSession = JSON.parse(staffSessionStr);
        clerkId = staffSession?.id || "";
      }
    }

    ToastAndroid.show("Printing KOT...", ToastAndroid.SHORT);
    const backendToken = (activeOrder as any).tokenNumber || (activeOrder as any).dailyTokenNumber || (activeOrder as any).orderNumber || (activeOrder as any).billNumber || (activeOrder as any).kotNumbers?.[0]?.toString();
    const tokenNo = await resolveOrderToken(activeOrder.id, backendToken);

    const success = await SimpleKOT(
      activeOrder.items,
      finalToken,
      clerkId || "",
      tableName,
      tokenNo,
      null,
      (activeOrder as any).customerName
    );
    if (success) {
      ToastAndroid.show("KOT Printed Successfully", ToastAndroid.SHORT);
      if (activeOrder.status === "PENDING" || activeOrder.status === "ACCEPTED") {
        updateOrderStatus(activeOrder.id, "PREPARING");
      }
    }
  };

  const handlePrintBill = async () => {
    if (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) {
      ToastAndroid.show("No items to print", ToastAndroid.SHORT);
      return;
    }
    const authToken = await getToken();
    const staffToken = await AsyncStorage.getItem("staff_token");
    const finalToken = authToken || staffToken || "";

    let clerkId = user?.id;
    if (!clerkId) {
      const staffSessionStr = await AsyncStorage.getItem("staff_session");
      if (staffSessionStr) {
        const staffSession = JSON.parse(staffSessionStr);
        clerkId = staffSession?.id || "";
      }
    }

    ToastAndroid.show("Printing Bill...", ToastAndroid.SHORT);
    const backendToken = (activeOrder as any).tokenNumber || (activeOrder as any).dailyTokenNumber || (activeOrder as any).orderNumber || (activeOrder as any).billNumber || (activeOrder as any).kotNumbers?.[0]?.toString();
    const tokenNo = await resolveOrderToken(activeOrder.id, backendToken);

    const result = await SimpleBill(
      activeOrder.items as any[],
      finalToken,
      clerkId || "",
      {
        orderId: activeOrder.id,
        billNumber: activeOrder.billNumber,
        customerName: activeOrder.customerName,
        phone: (activeOrder as any).customerPhone,
        tableName: tableName,
        tokenNo: tokenNo,
        source: "POS_TABLE",
        isHeld: false,
      }
    );

    if (result && result.status !== "error") {
      ToastAndroid.show("Bill Printed Successfully", ToastAndroid.SHORT);
      // Mark as completed so it reflects in Dashboard sales
      await updateOrderStatus(activeOrder.id, "COMPLETED");
      if (onBack) {
        onBack();
      }
    } else {
      ToastAndroid.show("Failed to print Bill", ToastAndroid.SHORT);
    }
  };

  const handleMergeBills = async () => {
    const selectedOrders = orders.filter(o => mergeSelection.has(o.id));
    if (selectedOrders.length === 0) return;

    const mergedItems = selectedOrders.flatMap(o => o.items);
    const total = mergedItems.reduce((acc, it) => acc + (it.price || (it as any).sellingPrice || 0) * it.quantity, 0);

    const targetOrder = {
      id: `ManualMerge-${Date.now().toString().slice(-4)}`,
      items: mergedItems,
      total: total,
      customerName: "Combined Group",
      billNumber: selectedOrders.map(o => o.billNumber).join(", ")
    };

    const authToken = await getToken();
    const staffToken = await AsyncStorage.getItem("staff_token");
    const finalToken = authToken || staffToken || "";

    let clerkId = user?.id;
    if (!clerkId) {
      const staffSessionStr = await AsyncStorage.getItem("staff_session");
      if (staffSessionStr) {
        const staffSession = JSON.parse(staffSessionStr);
        clerkId = staffSession?.id || "";
      }
    }

    ToastAndroid.show("Printing Merged Bill...", ToastAndroid.SHORT);

    const result = await SimpleBill(
      targetOrder.items as any[],
      finalToken,
      clerkId || "",
      {
        orderId: targetOrder.id,
        billNumber: targetOrder.billNumber,
        customerName: targetOrder.customerName,
        phone: "",
        tableName: tableName,
        tokenNo: targetOrder.billNumber,
        source: "POS_TABLE",
        isHeld: false,
      }
    );

    if (result && result.status !== "error") {
      ToastAndroid.show("Merged Bill Printed Successfully", ToastAndroid.SHORT);

      // Mark all selected orders as completed
      for (const order of selectedOrders) {
        await updateOrderStatus(order.id, "COMPLETED");
      }

      setIsMergeModalVisible(false);
      setMergeSelection(new Set());
      if (onBack) {
        onBack();
      }
    } else {
      ToastAndroid.show("Failed to print Merged Bill", ToastAndroid.SHORT);
    }
  };

  const handleCheckout = async () => {
    if (!activeOrder) return;
    try {
      const checkoutData = {
        items: activeOrder.items,
        totalAmount: activeOrder.total,
        kotId: activeOrder.id,
        tableNumber: tableName || '',
        customerName: activeOrder.customerName || '',
        customerPhone: (activeOrder as any).customerPhone || '',
      };
      await AsyncStorage.setItem('@temp_cart_for_checkout', JSON.stringify(checkoutData));
      DeviceEventEmitter.emit('GOTO_CHECKOUT_FROM_KOT');
      router.push('/(tabs)/menu');
    } catch (e) {
      console.error(e);
      ToastAndroid.show("Failed to open checkout", ToastAndroid.SHORT);
    }
  };

  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === activeOrderId) || orders[0];
  }, [orders, activeOrderId]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME_PRIMARY} />
      </View>
    );
  }

  // EMPTY STATE WHILE AUTO-CREATING
  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <TouchableOpacity onPress={onBack} style={styles.backBtnAbsolute}>
            <Ionicons name="arrow-back" size={rf(26)} color="#1F2937" />
          </TouchableOpacity>
          <ActivityIndicator size="large" color={THEME_PRIMARY} />
          <Text style={{ marginTop: 10, color: '#6B7280' }}>Opening Table...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeOrder) return null;

  // Calculate Order Timer
  const orderTimeDiff = Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000);
  const timeStr = `${orderTimeDiff}M`;

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={{ marginRight: s(15) }}>
            <Ionicons name="arrow-back" size={rf(24)} color="#000" />
          </TouchableOpacity>
          <View style={styles.tableNameBox}>
            <Text style={styles.tableNameText}>{tableName}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>{activeOrder.customerName || "WALK-IN CUSTOMER"}</Text>
            <View style={styles.guestRow}>
              <Ionicons name="person-outline" size={rf(10)} color="#6B7280" />
              <Text style={styles.guestText} numberOfLines={1}> 4 GUESTS • RAHUL S.</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={rf(12)} color="#10B981" />
              <Text style={styles.timerText}>{timeStr}</Text>
            </View>
            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountText}>{activeOrder.items.length}</Text>
              <Text style={styles.itemsLabel}>ITEMS</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.newOrderBtn} onPress={createNewOrder}>
            <Ionicons name="add" size={rf(16)} color="#FFF" />
            <Text style={styles.newOrderText}>NEW ORDER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addItemBtn} onPress={() => {
            setIsMenuModalVisible(true);
            fetchMenu();
          }}>
            <Ionicons name="add" size={rf(16)} color="#111827" />
            <Text style={styles.addItemText}>ADD ITEM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.newOrderBtn, { backgroundColor: '#F59E0B' }]} onPress={() => {
            setMergeSelection(new Set());
            setIsMergeModalVisible(true);
          }}>
            <Ionicons name="layers" size={rf(16)} color="#FFF" />
            <Text style={styles.newOrderText}>MERGE BILLS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. ORDER TABS */}
      {orders.length > 0 && (
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {orders.map(o => (
              <TouchableOpacity
                key={o.id}
                style={[styles.tabBtn, activeOrderId === o.id && styles.activeTabBtn]}
                onPress={() => setActiveOrderId(o.id)}
              >
                <Ionicons name="person-outline" size={rf(12)} color={activeOrderId === o.id ? "#FFF" : "#6B7280"} style={{ marginRight: s(5) }} />
                <View>
                  <Text style={[styles.tabTitle, activeOrderId === o.id && styles.activeTabTitle]}>ORDER #{o.billNumber}</Text>
                  <Text style={[styles.tabTime, activeOrderId === o.id && styles.activeTabTime]}>
                    <Ionicons name="time-outline" size={rf(10)} /> {Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)}M
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 3. PROGRESS TRACKER */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, { backgroundColor: THEME_DARK }]}>
            <Ionicons name="checkmark" size={rf(14)} color="#FFF" />
          </View>
          <Text style={styles.progressLabel}>ACCEPTED</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, activeOrder.status === "PREPARING" || activeOrder.status === "READY" ? { backgroundColor: THEME_DARK } : { backgroundColor: "#E5E7EB" }]}>
            {activeOrder.status === "PREPARING" || activeOrder.status === "READY" ? <Ionicons name="checkmark" size={rf(14)} color="#FFF" /> : null}
          </View>
          <Text style={styles.progressLabel}>COOKING</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, activeOrder.status === "READY" ? { backgroundColor: THEME_DARK } : { backgroundColor: "#E5E7EB" }]} />
          <Text style={styles.progressLabel}>READY</Text>
        </View>
      </View>

      {/* 4. CART SECTION */}
      <ScrollView style={styles.cartSection} showsVerticalScrollIndicator={false}>
        <View style={styles.cartHeader}>
          <View style={styles.breakdownRow}>
            <View style={styles.purpleBar} />
            <Text style={styles.breakdownText}>ORDER BREAKDOWN</Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#4338CA',
              paddingHorizontal: s(8),
              paddingVertical: vs(4),
              borderRadius: s(12),
              shadowColor: '#4338CA',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 2,
            }}
            onPress={() => setIsCustomerModalVisible(true)}
          >
            <Ionicons name="person" size={rf(9)} color="#FFF" style={{ marginRight: s(4) }} />
            <Text style={{ color: '#FFF', fontSize: rf(8), fontWeight: 'bold', letterSpacing: 0.5 }}>CUSTOMER INFO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cartDivider}>
          <Text style={styles.cartDividerText}>🛒 CURRENT CART (NOT PRINTED)</Text>
        </View>

        {activeOrder.items.map((it, idx) => (
          <View key={idx} style={styles.cartItem}>
            <View style={styles.itemIconBox}>
              <View style={[styles.vegDot, it.isVeg === false ? { backgroundColor: 'red' } : { backgroundColor: 'green' }]} />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemNameText}>{it.name} •</Text>
              <View style={styles.itemMeta}>
                <View style={styles.vegBadge}>
                  <Text style={styles.vegBadgeText}>{it.isVeg === false ? 'NON-VEG' : 'VEG'}</Text>
                </View>
                <Text style={styles.itemTime}><Ionicons name="time-outline" size={rf(10)} /> 12M</Text>
              </View>
            </View>
            <Text style={styles.itemBasePrice}>₹{it.price}</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(activeOrder.id, idx, -1)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{it.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(activeOrder.id, idx, 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotalPrice}>₹{it.price * it.quantity}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 5. BOTTOM ACTIONS */}
      <View style={styles.bottomBar}>
        <View style={styles.kitchenOpsRow}>
          <View style={{ flexDirection: 'row', gap: s(10) }}>
            <TouchableOpacity
              style={[styles.startCookingBtn, activeOrder.status === "PENDING" && { opacity: 1, backgroundColor: '#F3F4F6' }]}
              onPress={() => updateOrderStatus(activeOrder.id, "PREPARING")}
              disabled={activeOrder.status !== "PENDING"}
            >
              <Text style={styles.startCookingText}>START COOKING</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.markReadyBtn, activeOrder.status === "PREPARING" && { opacity: 1 }]}
              onPress={() => updateOrderStatus(activeOrder.id, "READY")}
              disabled={activeOrder.status !== "PREPARING"}
            >
              <Ionicons name="checkmark" size={rf(14)} color="#FFF" style={{ marginRight: s(5) }} />
              <Text style={styles.markReadyText}>MARK READY</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomActionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsPreviewModalVisible(true)}>
              <Ionicons name="eye-outline" size={rf(18)} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={handlePrintKOT}>
              <Ionicons name="print-outline" size={rf(14)} />
              <Text style={styles.outlineBtnText}>KOT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.darkBtn} onPress={handlePrintBill}>
              <Ionicons name="print-outline" size={rf(14)} color="#FFF" />
              <Text style={styles.darkBtnText}>BILL</Text>
            </TouchableOpacity>

            <View style={styles.grandTotalBox}>
              <View style={styles.gtHeader}>
                <Text style={styles.gtText}>GRAND TOTAL</Text>
                <View style={styles.gtTaxBadge}><Text style={styles.gtTaxText}>TAX INCLUDED</Text></View>
              </View>
              <Text style={styles.gtValue}>₹ <Text style={{ fontSize: rf(12), fontStyle: 'italic' }}>{activeOrder.total}</Text></Text>
            </View>

            <TouchableOpacity style={styles.purpleBtnIconOnly} onPress={handleCheckout}>
              <Ionicons name="arrow-forward" size={rf(18)} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FullMenuModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
        categories={menuData}
        loading={menuLoading}
        onConfirm={(items: any[], printKOT: boolean) => addItemToOrder(activeOrderId as string, items, printKOT)}
      />

      {/* MERGE BILLS MODAL (DROPDOWN STYLE) */}
      <Modal visible={isMergeModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
          activeOpacity={1}
          onPress={() => setIsMergeModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              position: 'absolute',
              top: vs(140),
              right: s(15),
              width: s(220),
              maxHeight: '50%',
              backgroundColor: '#FFF',
              borderRadius: s(10),
              padding: s(12),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(8), paddingBottom: vs(8), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
              <Text style={{ fontSize: rf(12), fontWeight: "bold", color: "#1F2937" }}>Merge Bills</Text>
              <TouchableOpacity onPress={() => setIsMergeModalVisible(false)}>
                <Ionicons name="close" size={rf(16)} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flexShrink: 1 }}>
              {orders.length === 0 ? (
                <Text style={{ textAlign: 'center', marginVertical: 15, color: '#6B7280', fontSize: rf(11) }}>No active orders.</Text>
              ) : (
                orders.map((o) => {
                  const isSelected = mergeSelection.has(o.id);
                  return (
                    <TouchableOpacity
                      key={o.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: s(8),
                        borderWidth: 1,
                        borderColor: isSelected ? THEME_PRIMARY : '#E5E7EB',
                        borderRadius: s(6),
                        marginBottom: vs(8),
                        backgroundColor: isSelected ? `${THEME_PRIMARY}10` : '#FFF'
                      }}
                      onPress={() => {
                        const newSet = new Set(mergeSelection);
                        if (newSet.has(o.id)) newSet.delete(o.id);
                        else newSet.add(o.id);
                        setMergeSelection(newSet);
                      }}
                    >
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: rf(12), color: '#111827' }}>
                          Order #{o.billNumber}
                        </Text>
                        <Text style={{ fontSize: rf(10), color: '#6B7280', marginTop: 2 }}>
                          {o.items.length} Items • ₹{o.total}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={rf(16)}
                        color={isSelected ? THEME_PRIMARY : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                  )
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.darkBtn, { width: '100%', marginTop: vs(10), opacity: mergeSelection.size > 0 ? 1 : 0.5, justifyContent: 'center', paddingVertical: vs(6) }]}
              disabled={mergeSelection.size === 0}
              onPress={handleMergeBills}
            >
              <Ionicons name="layers" size={rf(12)} color="#FFF" />
              <Text style={[styles.darkBtnText, { fontSize: rf(10) }]}>MERGE & COMBINE ({mergeSelection.size})</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* CUSTOMER DETAILS MODAL */}
      <Modal visible={isCustomerModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setIsCustomerModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: '75%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <LinearGradient
              colors={['#10B981', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: s(16),
                padding: s(20),
              }}
            >
              <View style={{ alignItems: "center", marginBottom: vs(15) }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: s(12), borderRadius: s(30), marginBottom: vs(6) }}>
                  <Ionicons name="person" size={rf(22)} color="#FFF" />
                </View>
                <Text style={{ fontSize: rf(16), fontWeight: "900", color: "#FFF" }}>Customer Details</Text>
                <TouchableOpacity onPress={() => setIsCustomerModalVisible(false)} style={{ position: 'absolute', right: 0, top: 0, padding: s(5) }}>
                  <Ionicons name="close" size={rf(20)} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              {activeOrder && (
                <View style={{ gap: vs(8) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: s(10), borderRadius: s(10) }}>
                    <View style={{ backgroundColor: '#EFF6FF', padding: s(8), borderRadius: s(8), marginRight: s(10) }}>
                      <Ionicons name="person-outline" size={rf(14)} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: rf(8), color: '#6B7280', fontWeight: 'bold', letterSpacing: 0.5 }}>NAME</Text>
                      <Text style={{ fontSize: rf(12), fontWeight: 'bold', color: '#1F2937', marginTop: 2 }}>{activeOrder.customerName || "N/A"}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: s(10), borderRadius: s(10) }}>
                    <View style={{ backgroundColor: '#F0FDF4', padding: s(8), borderRadius: s(8), marginRight: s(10) }}>
                      <Ionicons name="call-outline" size={rf(14)} color="#22C55E" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: rf(8), color: '#6B7280', fontWeight: 'bold', letterSpacing: 0.5 }}>PHONE NUMBER</Text>
                      <Text style={{ fontSize: rf(12), fontWeight: 'bold', color: '#1F2937', marginTop: 2 }}>{activeOrder.customerPhone || "N/A"}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: s(10), borderRadius: s(10) }}>
                    <View style={{ backgroundColor: '#FEF2F2', padding: s(8), borderRadius: s(8), marginRight: s(10) }}>
                      <Ionicons name="location-outline" size={rf(14)} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: rf(8), color: '#6B7280', fontWeight: 'bold', letterSpacing: 0.5 }}>ADDRESS</Text>
                      <Text style={{ fontSize: rf(12), fontWeight: 'bold', color: '#1F2937', marginTop: 2 }}>{activeOrder.customerAddress || "N/A"}</Text>
                    </View>
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* BILL PREVIEW MODAL */}
      <Modal visible={isPreviewModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setIsPreviewModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: '85%',
              maxHeight: '80%',
              backgroundColor: '#FFF',
              borderRadius: s(12),
              padding: s(20),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(15) }}>
              <Text style={{ fontSize: rf(16), fontWeight: "bold", color: "#1F2937" }}>Bill Preview</Text>
              <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)}>
                <Ionicons name="close" size={rf(20)} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {activeOrder && (
              <ScrollView style={{ flexShrink: 1, backgroundColor: '#F9FAFB', padding: s(15), borderRadius: s(8), borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed' }} showsVerticalScrollIndicator={false}>
                <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: rf(18), marginBottom: vs(5), color: '#111827' }}>RESTAURANT RECEIPT</Text>
                <Text style={{ textAlign: 'center', fontSize: rf(11), color: '#6B7280', marginBottom: vs(15) }}>
                  Date: {new Date(activeOrder.createdAt).toLocaleDateString()} {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{'\n'}
                  Table: {tableName} • Order #{activeOrder.billNumber}
                </Text>

                <View style={{ borderBottomWidth: 1, borderBottomColor: '#D1D5DB', borderStyle: 'dashed', marginBottom: vs(10) }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(8) }}>
                  <Text style={{ flex: 2, fontWeight: 'bold', fontSize: rf(12), color: '#374151' }}>Item</Text>
                  <Text style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: rf(12), color: '#374151' }}>Qty</Text>
                  <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: rf(12), color: '#374151' }}>Amount</Text>
                </View>

                {activeOrder.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(6) }}>
                    <Text style={{ flex: 2, fontSize: rf(12), color: '#111827' }} numberOfLines={2}>{item.name}</Text>
                    <Text style={{ flex: 1, textAlign: 'center', fontSize: rf(12), color: '#111827' }}>{item.quantity}</Text>
                    <Text style={{ flex: 1, textAlign: 'right', fontSize: rf(12), color: '#111827' }}>₹{(item.price || (item as any).sellingPrice || 0) * item.quantity}</Text>
                  </View>
                ))}

                <View style={{ borderBottomWidth: 1, borderBottomColor: '#D1D5DB', borderStyle: 'dashed', marginVertical: vs(10) }} />

                {(() => {
                  const subtotal = activeOrder.items.reduce((acc, it) => acc + (it.price || (it as any).sellingPrice || 0) * it.quantity, 0);
                  const difference = activeOrder.total - subtotal;
                  return (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(4) }}>
                        <Text style={{ fontSize: rf(12), color: '#374151' }}>Subtotal</Text>
                        <Text style={{ fontSize: rf(12), color: '#374151' }}>₹{subtotal.toFixed(2)}</Text>
                      </View>
                      {difference !== 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(4) }}>
                          <Text style={{ fontSize: rf(12), color: '#374151' }}>Taxes & Charges</Text>
                          <Text style={{ fontSize: rf(12), color: '#374151' }}>₹{difference.toFixed(2)}</Text>
                        </View>
                      )}

                      <View style={{ borderBottomWidth: 1, borderBottomColor: '#D1D5DB', borderStyle: 'dashed', marginVertical: vs(10) }} />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: rf(16), color: '#111827' }}>Grand Total</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: rf(16), color: '#111827' }}>₹{Number(activeOrder.total).toFixed(2)}</Text>
                      </View>

                      <View style={{ alignItems: 'center', marginTop: vs(25), marginBottom: vs(10) }}>
                        <Text style={{ fontSize: rf(11), color: '#4B5563', fontWeight: 'bold', letterSpacing: 1 }}>*** THANK YOU ***</Text>
                        <Text style={{ fontSize: rf(10), color: '#9CA3AF', marginTop: vs(2) }}>Please Visit Again</Text>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <CustomToast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onHide={() => setToastState(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const FullMenuModal = ({ visible, onClose, categories, onConfirm, loading }: any) => {
  const flatListRef = React.useRef<FlatList>(null);
  const [cart, setCart] = useState<Record<string, any>>({});

  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const CATEGORY_COLUMN_WIDTH = s(90);
  const itemWidth = (SCREEN_WIDTH - CATEGORY_COLUMN_WIDTH - s(32)) / 3;

  useEffect(() => {
    if (visible) setCart({});
  }, [visible]);

  const addToCart = (item: any) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
    }));
  };

  const removeFromCart = (item: any) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (!existing) return prev;
      if (existing.quantity === 1) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }
      return {
        ...prev,
        [item.id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const totalItems = Object.values(cart).reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = Object.values(cart).reduce((sum, it) => sum + (it.sellingPrice || it.price || 0) * it.quantity, 0);

  const [printKOT, setPrintKOT] = useState(true); // Default to true

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Items to Order</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={rf(24)} /></TouchableOpacity>
          </View>
          <View style={[styles.modalBody, { flexDirection: "row", padding: 0 }]}>
            {loading ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ marginTop: 10, color: "#6B7280" }}>Loading Menu...</Text>
              </View>
            ) : (
              <>
                <CategorySidebar
                  categories={categories}
                  onCategoryPress={(cat: any, index: number) =>
                    flatListRef.current?.scrollToIndex({ index, animated: true })
                  }
                  cartVisible={false}
                />

                <FlatList
                  ref={flatListRef}
                  data={categories}
                  keyExtractor={(cat) => cat.id}
                  contentContainerStyle={{ paddingBottom: 150, flexGrow: 1 }}
                  removeClippedSubviews={true}
                  onScrollToIndexFailed={(info) => {
                    const estimatedOffset = info.averageItemLength * info.index;
                    flatListRef.current?.scrollToOffset({ offset: estimatedOffset, animated: false });
                    setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 100);
                  }}
                  renderItem={({ item: cat }) => (
                    <View>
                      <Text style={styles.categoryHeader}>{cat.name}</Text>
                      <View style={styles.gridContainer}>
                        {cat.items.map((item: any) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            itemWidth={itemWidth}
                            quantity={cart[item.id]?.quantity || 0}
                            onAdd={addToCart}
                            onRemove={removeFromCart}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                />
              </>
            )}
          </View>
          {totalItems > 0 && (
            <View style={styles.modalFooter}>
              <View>
                <Text style={styles.footerQty}>{totalItems} Items</Text>
                <Text style={styles.footerTotal}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: printKOT ? '#ECFDF5' : '#F9FAFB', paddingHorizontal: s(12), paddingVertical: vs(12), borderRadius: s(12), borderWidth: 1, borderColor: printKOT ? '#10B981' : '#E5E7EB' }}
                  onPress={() => setPrintKOT(!printKOT)}
                >
                  <Ionicons name={printKOT ? "checkmark-circle" : "ellipse-outline"} size={rf(18)} color={printKOT ? '#10B981' : '#9CA3AF'} />
                  <Text style={{ marginLeft: s(6), fontSize: rf(12), fontWeight: 'bold', color: printKOT ? '#10B981' : '#6B7280' }}>KOT</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(Object.values(cart), printKOT)}>
                  <Text style={styles.confirmBtnText}>Add to Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtnAbsolute: { position: 'absolute', top: vs(40), left: s(20) },
  emptyText: { color: "#6B7280", marginTop: vs(15), fontSize: rf(16) },
  categoryHeader: {
    fontSize: rf(11),
    fontWeight: "bold",
    backgroundColor: "#E0E7FF",
    padding: s(3),
    marginTop: vs(10),
    marginBottom: vs(5),
    borderRadius: s(6),
    textAlign: "center",
    color: THEME_PRIMARY,
    marginHorizontal: s(10),
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: s(8),
    gap: s(8),
  },
  startBtn: { marginTop: vs(20), backgroundColor: THEME_PRIMARY, paddingHorizontal: s(20), paddingVertical: vs(12), borderRadius: s(10), flexDirection: 'row', alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(14) },

  // 1. TOP HEADER
  topHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: s(15), paddingTop: vs(15), paddingBottom: vs(5), backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: vs(10) },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: s(5) },
  tableNameBox: { backgroundColor: THEME_DARK, paddingHorizontal: s(8), paddingVertical: vs(6), borderRadius: s(8) },
  tableNameText: { color: '#FFF', fontWeight: '900', fontSize: rf(14) },
  customerInfo: { flexShrink: 1, marginHorizontal: s(5) },
  customerName: { fontSize: rf(13), fontWeight: 'bold', color: '#111827' },
  guestRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(2) },
  guestText: { fontSize: rf(9), color: '#6B7280', fontWeight: 'bold' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(10), marginRight: s(10) },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME_SUCCESS, marginRight: 4 },
  liveText: { color: THEME_SUCCESS, fontSize: rf(9), fontWeight: 'bold' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(10), marginRight: s(8) },
  timerText: { color: THEME_SUCCESS, fontSize: rf(10), fontWeight: 'bold', marginLeft: 4 },
  itemsCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemsCountText: { fontSize: rf(14), fontWeight: '900', color: '#111827' },
  itemsLabel: { fontSize: rf(10), color: '#6B7280', fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
  newOrderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_PRIMARY, paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(20) },
  newOrderText: { color: '#FFF', fontSize: rf(11), fontWeight: 'bold', marginLeft: s(5) },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(20) },
  addItemText: { color: '#111827', fontSize: rf(11), fontWeight: 'bold', marginLeft: s(5) },

  // 2. TABS
  tabsContainer: { backgroundColor: '#FFF', paddingTop: vs(5) },
  tabsScroll: { paddingHorizontal: s(15), gap: s(10) },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(12), backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  activeTabBtn: { backgroundColor: THEME_DARK, borderColor: THEME_DARK },
  tabTitle: { fontSize: rf(11), fontWeight: 'bold', color: '#111827' },
  activeTabTitle: { color: '#FFF' },
  tabTime: { fontSize: rf(9), color: '#6B7280', marginTop: vs(2) },
  activeTabTime: { color: '#D1D5DB' },

  // 3. PROGRESS
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(8), backgroundColor: '#FFF' },
  progressStep: { alignItems: 'center' },
  progressCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressLabel: { fontSize: rf(9), fontWeight: 'bold', color: '#111827', marginTop: vs(4), textTransform: 'uppercase' },
  progressLine: { width: s(100), height: 2, backgroundColor: '#E5E7EB', marginHorizontal: s(10), marginBottom: vs(15) },

  // 4. CART
  cartSection: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: s(20) },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(10), marginBottom: vs(20) },
  breakdownRow: { flexDirection: 'row', alignItems: 'center' },
  purpleBar: { width: 4, height: 16, backgroundColor: THEME_PRIMARY, borderRadius: 2, marginRight: s(8) },
  breakdownText: { fontSize: rf(12), fontWeight: '900', color: '#111827' },
  priorityBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(4) },
  priorityText: { color: '#EF4444', fontSize: rf(9), fontWeight: 'bold' },
  cartDivider: { borderTopWidth: 1, borderTopColor: '#FEF08A', paddingTop: vs(10), marginBottom: vs(15), alignItems: 'center' },
  cartDividerText: { color: '#D97706', fontSize: rf(10), fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingVertical: vs(15), borderWidth: 1, borderColor: '#F3F4F6', borderRadius: s(12), paddingHorizontal: s(15), marginBottom: vs(15), gap: s(5) },
  itemIconBox: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: s(10) },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  itemDetails: { flex: 1 },
  itemNameText: { fontSize: rf(12), fontWeight: 'bold', color: '#111827' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: vs(4), gap: s(5) },
  vegBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: s(4), paddingVertical: vs(2), borderRadius: 4 },
  vegBadgeText: { color: THEME_SUCCESS, fontSize: rf(8), fontWeight: 'bold' },
  itemTime: { fontSize: rf(9), color: '#9CA3AF' },
  itemBasePrice: { fontSize: rf(13), fontWeight: 'bold', color: '#111827', width: s(40), textAlign: 'right' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: s(20), marginHorizontal: s(15) },
  qtyBtn: { padding: s(8) },
  qtyBtnText: { color: THEME_PRIMARY, fontSize: rf(14), fontWeight: 'bold' },
  qtyValue: { marginHorizontal: s(8), fontSize: rf(12), fontWeight: 'bold' },
  itemTotalPrice: { fontSize: rf(13), fontWeight: 'bold', color: '#111827', width: s(50), textAlign: 'right' },

  // 5. BOTTOM BAR
  bottomBar: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: s(15), paddingBottom: s(15), paddingTop: vs(8) },
  kitchenOpsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', marginBottom: vs(5), gap: vs(10) },
  kitchenOpsText: { fontSize: rf(10), fontWeight: 'bold', color: '#9CA3AF' },
  startCookingBtn: { paddingHorizontal: s(20), paddingVertical: vs(8), borderRadius: s(8), opacity: 0.5 },
  startCookingText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: rf(10) },
  markReadyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_SUCCESS, paddingHorizontal: s(30), paddingVertical: vs(8), borderRadius: s(8), opacity: 0.5 },
  markReadyText: { color: '#FFF', fontWeight: 'bold', fontSize: rf(11) },
  bottomActionsRow: { flexDirection: 'row', flexWrap: 'wrap-reverse', justifyContent: 'space-between', gap: vs(10) },
  leftActions: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10), alignItems: 'center', flex: 1 },
  iconBtn: { padding: s(6), borderWidth: 1, borderColor: '#E5E7EB', borderRadius: s(8) },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(12), paddingVertical: vs(8), borderWidth: 1, borderColor: '#E5E7EB', borderRadius: s(8), gap: s(5) },
  outlineBtnText: { fontSize: rf(11), fontWeight: 'bold', color: '#111827' },
  darkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_DARK, paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(8), gap: s(5) },
  darkBtnText: { fontSize: rf(11), fontWeight: 'bold', color: '#FFF' },
  purpleBtnIconOnly: { backgroundColor: THEME_PRIMARY, paddingHorizontal: s(10), paddingVertical: vs(6), borderRadius: s(8), justifyContent: 'center', alignItems: 'center' },
  grandTotalBox: { backgroundColor: THEME_DARK, borderRadius: s(6), paddingVertical: s(6), paddingHorizontal: s(15), minWidth: s(120) },
  gtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(2) },
  gtText: { color: '#9CA3AF', fontSize: rf(7), fontWeight: 'bold', letterSpacing: 1 },
  gtTaxBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: s(2), paddingVertical: 1, borderRadius: 2 },
  gtTaxText: { color: '#FFF', fontSize: rf(5) },
  gtValue: { color: '#FFF', fontSize: rf(12), fontWeight: 'bold' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: s(25), borderTopRightRadius: s(25), height: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: s(15), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalTitle: { fontSize: rf(16), fontWeight: "bold", color: "#1F2937" },
  modalBody: { flex: 1, flexDirection: "row" },
  sideBar: { width: s(100), backgroundColor: "#F9FAFB", borderRightWidth: 1, borderRightColor: "#F3F4F6" },
  catItem: { padding: s(15), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  activeCatItem: { backgroundColor: "#EEF2FF", borderLeftWidth: 4, borderLeftColor: "#4F46E5" },
  catItemText: { fontSize: rf(12), color: "#6B7280", fontWeight: "600" },
  activeCatItemText: { color: "#4F46E5", fontWeight: "bold" },
  itemsList: { flex: 1, backgroundColor: "#fff" },
  menuItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: s(15), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuItemName: { fontSize: rf(14), fontWeight: "bold", color: "#1F2937" },
  menuItemPrice: { fontSize: rf(13), color: "#6B7280", marginTop: vs(2) },
  qtyContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: s(20), padding: s(5) },
  modalQtyBtn: { padding: s(5) },
  qtyText: { marginHorizontal: s(10), fontSize: rf(14), fontWeight: "bold" },
  modalFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: s(20), borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#fff", paddingBottom: vs(50) },
  footerQty: { fontSize: rf(14), fontWeight: "bold", color: "#4F46E5" },
  footerTotal: { fontSize: rf(18), fontWeight: "bold", color: "#111827" },
  confirmBtn: { backgroundColor: "#4F46E5", paddingHorizontal: s(25), paddingVertical: vs(12), borderRadius: s(12) },
  confirmBtnText: { color: "#fff", fontSize: rf(14), fontWeight: "bold" }
});
