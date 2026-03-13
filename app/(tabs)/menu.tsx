"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  // @ts-ignore
  ToastAndroid,
  View,
  Dimensions
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

// Project level imports
import { SaveBill } from "../../components/SaveBill";
import { SimpleKOT } from "../../components/SimpleKOT";
import { useRefresh } from "../../context/RefreshContext";
import { SimpleBill } from "../../utils/SimpleBill";

// Menu Components
import { MenuHeader } from "../../components/menu/MenuHeader";
import { SearchBar } from "../../components/menu/SearchBar";
import { CategorySidebar } from "../../components/menu/CategorySidebar";
import { MenuItemCard } from "../../components/menu/MenuItemCard";
import { CartBar } from "../../components/menu/CartBar";
import { CartItemsModal } from "../../components/menu/CartItemsModal";
import { TableSelectionModal } from "../../components/menu/TableSelectionModal";
import { ConfirmHoldModal } from "../../components/menu/ConfirmHoldModal";
import { ClearCartModal } from "../../components/menu/ClearCartModal";

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
const COLOR_BG_LIGHT = "#F9FAFB";
const CATEGORY_COLUMN_WIDTH = s(80);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MenuScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [menus, setMenus] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [received, setReceived] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isClearModalVisible, setIsClearModalVisible] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);
  const [heldCount, setHeldCount] = useState(0);
  const [isHoldModalVisible, setIsHoldModalVisible] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showHoldSuccess, setShowHoldSuccess] = useState(false);
  const { refreshSignal } = useRefresh();

  // Settings states
  const [kotEnabled, setKotEnabled] = useState(false);
  const [tableBookingEnabled, setTableBookingEnabled] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);

  // @ts-ignore
  const flatListRef = useRef<any>(null);

  const addSound = { play: () => { } };
  const removeSound = { play: () => { } };

  const fetchMenus = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      if (!isLoaded || !isSignedIn) {
        setMenus([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const token = await getToken();
      const response = await fetch("https://billing.kravy.in/api/menu/view", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const cachedData = await AsyncStorage.getItem('@cached_menu');
        if (cachedData) setMenus(JSON.parse(cachedData));
        return;
      }

      let items = await response.json();
      let processedItems: any[] = [];

      if (Array.isArray(items)) {
        processedItems = items;
      } else if (items && Array.isArray(items.menus)) {
        items.menus.forEach((cat: any) => {
          const categoryRaw = { id: cat.id || cat._id || "others", name: cat.name || "Others" };
          if (Array.isArray(cat.items)) {
            cat.items.forEach((item: any) => {
              processedItems.push({ ...item, category: categoryRaw });
            });
          }
        });
      } else if (items && Array.isArray(items.items)) {
        processedItems = items.items;
      }

      const categoryMap: Record<string, MenuCategory> = {};
      processedItems.forEach((item: any) => {
        const rawCat = item.category || { id: "others", name: "Others" };
        const catId = String(rawCat.id || rawCat._id || "others");
        const catName = String(rawCat.name || "Others");

        if (!categoryMap[catId]) {
          categoryMap[catId] = { id: catId, name: catName, items: [] };
        }

        categoryMap[catId].items.push({
          id: String(item.id || item._id || Math.random().toString()),
          name: String(item.name || "Unnamed Item"),
          price: Number(item.sellingPrice || item.price || item.selling_price || 0),
          imageUrl: item.imageUrl,
          unit: item.unit,
        });
      });

      const sortedMenus = Object.values(categoryMap)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(cat => ({
          ...cat,
          items: cat.items.sort((a, b) => a.name.localeCompare(b.name))
        }));

      await AsyncStorage.setItem('@cached_menu', JSON.stringify(sortedMenus));
      setMenus(sortedMenus);

    } catch (err: any) {
      const cachedData = await AsyncStorage.getItem('@cached_menu');
      if (cachedData) setMenus(JSON.parse(cachedData));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const kot = await AsyncStorage.getItem('kot_enabled');
      const table = await AsyncStorage.getItem('table_booking_enabled');
      setKotEnabled(kot === 'true');
      setTableBookingEnabled(table === 'true');
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  };

  const fetchHeldCount = async () => {
    try {
      if (!isLoaded || !isSignedIn) {
        setHeldCount(0);
        return;
      }
      const token = await getToken();
      if (!token) return;

      const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
      const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];

      const res = await fetch("https://billing.kravy.in/api/bill-manager?isHeld=true", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let backendValidCount = 0;
      if (res.ok) {
        const data = await res.json();
        const bills = data.bills || [];
        const filteredBackend = bills.filter((b: any) =>
          !hiddenIds.includes(b.billNumber) && !hiddenIds.includes(b._id) && !hiddenIds.includes(b.id)
        );
        backendValidCount = filteredBackend.length;
      }

      const localData = await AsyncStorage.getItem('@held_orders');
      let localValidCount = 0;
      if (localData) {
        const localHeld = JSON.parse(localData);
        const filteredLocal = localHeld.filter((lh: any) => !hiddenIds.includes(lh.id));
        localValidCount = filteredLocal.length;
      }

      setHeldCount(backendValidCount + localValidCount);
    } catch (e) {
      console.error("Fetch held count error:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMenus();
      fetchHeldCount();
      fetchSettings();
      const checkResumeCart = async () => {
        try {
          const data = await AsyncStorage.getItem('@resume_cart');
          if (data) {
            const resumedItems = JSON.parse(data);
            const newCart: Record<string, CartItem> = {};
            resumedItems.forEach((item: any) => { newCart[item.id] = item; });
            setCart(newCart);
            await AsyncStorage.removeItem('@resume_cart');
            const id = await AsyncStorage.getItem('@resume_cart_id');
            if (id) {
              setActiveOrderId(id);
              await AsyncStorage.removeItem('@resume_cart_id');
            }
            ToastAndroid.show("Order Loaded from Hold List", ToastAndroid.SHORT);
          }
        } catch (error) { console.error("Error loading resumed cart:", error); }
      };
      checkResumeCart();
    }, [isLoaded, isSignedIn])
  );

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchMenus(true);
      fetchHeldCount();
    }
  }, [refreshSignal]);

  const filteredMenus = useMemo(() => {
    if (!searchQuery) return menus;
    const query = searchQuery.toLowerCase();
    return menus
      .map((cat) => {
        const categoryMatches = cat.name.toLowerCase().includes(query);
        const filteredItems = cat.items.filter(
          (item) => item.name.toLowerCase().includes(query) || item.price?.toString().includes(query)
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
    try { removeSound?.play(); } catch { }
  };

  const clearCart = () => setIsClearModalVisible(true);

  const handleConfirmClear = () => {
    setCart({});
    setActiveOrderId(null);
    setSelectedTable(null);
    setIsCartModalVisible(false);
    setIsClearModalVisible(false);
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 2000);
  };

  const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = Object.values(cart).reduce((sum, i) => sum + ((i.editedPrice ?? i.price ?? 0) * i.quantity), 0);

  const confirmPauseOrder = async () => {
    try {
      const token = await getToken();
      if (token && user?.id) {
        try {
          const method = activeOrderId ? "PUT" : "POST";
          const url = activeOrderId ? `https://billing.kravy.in/api/bill-manager/${activeOrderId}` : "https://billing.kravy.in/api/bill-manager";
          const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              items: Object.values(cart).map(i => ({
                productId: i.id, name: i.name, quantity: i.quantity,
                price: i.editedPrice ?? i.price ?? 0, total: (i.editedPrice ?? i.price ?? 0) * i.quantity,
              })),
              subtotal: Number((totalAmount / 1.05).toFixed(2)), total: totalAmount,
              paymentMode: "Cash", paymentStatus: "HELD", isHeld: true, customerName: "Walk-in Customer", customerPhone: null,
            }),
          });

          if (response.ok) {
            setShowHoldSuccess(true);
            setTimeout(() => {
              setIsHoldModalVisible(false); setShowHoldSuccess(false);
              setCart({}); setActiveOrderId(null); fetchHeldCount();
            }, 2000);
          } else { await saveToLocalFallback(); }
        } catch (fetchError) { await saveToLocalFallback(); }
      } else { await saveToLocalFallback(); }

      async function saveToLocalFallback() {
        if (activeOrderId && activeOrderId.startsWith("BILL-")) {
          const localData = await AsyncStorage.getItem('@held_orders');
          let orders = localData ? JSON.parse(localData) : [];
          orders = orders.map((o: any) => o.id === activeOrderId ? { ...o, items: Object.values(cart), total: totalAmount, timestamp: new Date().toISOString() } : o);
          await AsyncStorage.setItem('@held_orders', JSON.stringify(orders));
        } else {
          const id = "BILL-" + Date.now();
          const newOrder = { id, items: Object.values(cart), total: totalAmount, timestamp: new Date().toISOString() };
          const localData = await AsyncStorage.getItem('@held_orders');
          const orders = localData ? JSON.parse(localData) : [];
          orders.push(newOrder);
          await AsyncStorage.setItem('@held_orders', JSON.stringify(orders));
        }
        setShowHoldSuccess(true);
        setTimeout(() => {
          setIsHoldModalVisible(false); setShowHoldSuccess(false);
          setCart({}); setActiveOrderId(null); fetchHeldCount();
        }, 2000);
      }
    } catch (e) { ToastAndroid.show("Failed to hold order", ToastAndroid.SHORT); }
  };

  const handlePrintKot = async () => {
    const token = await getToken();
    await SimpleKOT(Object.values(cart), token!, user?.id!, selectedTable);
  };

  const handlePrintBill = async () => {
    const token = await getToken();
    const result = await SimpleBill(Object.values(cart), token!, user?.id!, { paymentMode: paymentMethod, billId: activeOrderId || undefined });
    if (result?.status === "success") {
      setCart({}); setActiveOrderId(null); setSelectedTable(null); fetchHeldCount();
    }
  };

  const handleSaveBill = async () => {
    const token = await getToken();
    const result = await SaveBill(Object.values(cart), token!, user?.id!, { paymentMode: paymentMethod, billId: activeOrderId || undefined });
    if (result?.status === "saved") {
      setCart({}); setActiveOrderId(null); setSelectedTable(null); fetchHeldCount();
    }
  };

  const itemWidth = (SCREEN_WIDTH - CATEGORY_COLUMN_WIDTH - s(32)) / 3;

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={THEME_PRIMARY} /><Text style={{ marginTop: 10 }}>Organizing Menu A-Z...</Text></View>
  );

  return (
    <View style={styles.container}>
      <MenuHeader 
        refreshing={refreshing} 
        onFetchMenus={() => fetchMenus(true)} 
        onAddItem={() => router.push("/party/items")}
        onPauseOrder={() => Object.keys(cart).length === 0 ? ToastAndroid.show("Cart is empty!", ToastAndroid.SHORT) : setIsHoldModalVisible(true)}
        onViewHeldOrders={() => router.push("/party/hold")}
        heldCount={heldCount}
      />

      <SearchBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        onClear={() => setSearchQuery("")} 
      />

      <View style={styles.row}>
        <CategorySidebar 
          categories={filteredMenus} 
          onCategoryPress={(cat, index) => flatListRef.current?.scrollToIndex({ index, animated: true })} 
        />

        <FlatList
          ref={flatListRef}
          data={filteredMenus}
          keyExtractor={(cat) => cat.id}
          contentContainerStyle={{ paddingBottom: 450 }}
          onScrollToIndexFailed={(info) => {
            const estimatedOffset = info.averageItemLength * info.index;
            flatListRef.current?.scrollToOffset({ offset: estimatedOffset, animated: false });
            setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 100);
          }}
          renderItem={({ item: cat }) => (
            <View>
              <Text style={styles.categoryHeader}>{cat.name}</Text>
              <View style={styles.gridContainer}>
                {cat.items.map((item) => (
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
      </View>

      {totalItems > 0 && (
        <CartBar 
          totalItems={totalItems} 
          totalAmount={totalAmount} 
          paymentMethod={paymentMethod} 
          setPaymentMethod={setPaymentMethod}
          received={received}
          setReceived={setReceived}
          onViewCart={() => setIsCartModalVisible(true)}
          onPrintKot={handlePrintKot}
          onPrintBill={handlePrintBill}
          onSaveBill={handleSaveBill}
          onProceed={() => router.push({ pathname: "/party/bill", params: { cart: JSON.stringify(cart), paymentMethod, heldOrderId: activeOrderId }})}
          kotEnabled={kotEnabled}
          tableBookingEnabled={tableBookingEnabled}
          onSelectTable={() => setIsTableModalVisible(true)}
          selectedTable={selectedTable}
        />
      )}

      <CartItemsModal 
        visible={isCartModalVisible}
        onClose={() => setIsCartModalVisible(false)}
        cartItems={Object.values(cart)}
        totalItems={totalItems}
        totalAmount={totalAmount}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onClear={clearCart}
      />

      <TableSelectionModal 
        visible={isTableModalVisible}
        onClose={() => setIsTableModalVisible(false)}
        selectedTable={selectedTable}
        onSelect={(table) => { setSelectedTable(table); setIsTableModalVisible(false); }}
      />

      <ConfirmHoldModal 
        visible={isHoldModalVisible}
        onClose={() => setIsHoldModalVisible(false)}
        onConfirm={confirmPauseOrder}
        totalAmount={totalAmount}
        totalItems={totalItems}
        showSuccess={showHoldSuccess}
      />

      <ClearCartModal 
        visible={isClearModalVisible}
        onClose={() => setIsClearModalVisible(false)}
        onConfirm={handleConfirmClear}
        showSuccess={showClearSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: { flex: 1, flexDirection: "row" },
  categoryHeader: { fontSize: rf(11), fontWeight: "bold", backgroundColor: "#E0E7FF", padding: s(3), marginTop: vs(10), borderRadius: s(6), textAlign: "center", color: THEME_PRIMARY, marginHorizontal: s(10) },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: s(4), marginTop: vs(5) },
});
