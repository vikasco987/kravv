"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  // @ts-ignore
  ToastAndroid,
  View,
  DeviceEventEmitter
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

// Project level imports
import { SaveBill } from "../../components/SaveBill";
import { SimpleKOT } from "../../components/SimpleKOT";
import { useRefresh } from "../../context/RefreshContext";
import { SimpleBill } from "../../utils/SimpleBill";
import { useLanguage } from "../../context/LanguageContext";

// Menu Components
import { CartBar } from "../../components/menu/CartBar";
import { CartItemsModal } from "../../components/menu/CartItemsModal";
import { CategorySidebar } from "../../components/menu/CategorySidebar";
import { ClearCartModal } from "../../components/menu/ClearCartModal";
import { ConfirmHoldModal } from "../../components/menu/ConfirmHoldModal";
import { MenuHeader } from "../../components/menu/MenuHeader";
import { MenuItemCard } from "../../components/menu/MenuItemCard";
import { TableSelectionModal } from "../../components/menu/TableSelectionModal";
import { QuickAddItemCard } from "../../components/menu/QuickAddItemCard";
import { QuickAddItemModal } from "../../components/menu/QuickAddItemModal";
import VoiceOrder from "../../components/voice-command/VoiceOrder";

// --- TYPE DEFINITIONS ---
type MenuItem = {
  id: string;
  name: string;
  price?: number;
  imageUrl?: string;
  unit?: string;
  gst?: number;
  taxType?: string;
  hsnCode?: string;
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
  const { t } = useLanguage();

  const [menus, setMenus] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const { refreshSignal, searchQuery, setSearchQuery } = useRefresh();

  // Settings states
  const [kotEnabled, setKotEnabled] = useState(false);
  const [tableBookingEnabled, setTableBookingEnabled] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [isQuickAddModalVisible, setIsQuickAddModalVisible] = useState(false);
  const [quickAddCategoryId, setQuickAddCategoryId] = useState("");
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  // @ts-ignore
  const flatListRef = useRef<any>(null);

  const addSound = { play: () => { } };
  const removeSound = { play: () => { } };

  const fetchMenus = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
         setRefreshing(true);
      } else {
         // Performance optimization: only show full-screen loader if we have NO items
         // If we have items in state or cache, show those immediately and update in background
         if (menus.length === 0) {
           const cachedData = await AsyncStorage.getItem('@cached_menu');
           if (cachedData) {
             setMenus(JSON.parse(cachedData));
             setLoading(false); // Hide loader immediately if cache available
           } else {
             setLoading(true); // No data and no cache, show loader
           }
         } else {
           setLoading(false); // We have data, don't show loader during fetch
         }
      }

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

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.warn("ℹ️ [Menu] Received non-JSON response from menu API. Body starts with:", text.slice(0, 50));
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
          gst: item.gst,
          taxType: item.taxType,
          hsnCode: item.hsnCode,
        });
      });

      // 3. Fetch ALL categories from the database to include empty ones
      const catRes = await fetch("https://billing.kravy.in/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (catRes.ok) {
        const allCats = await catRes.json();
        if (Array.isArray(allCats)) {
          allCats.forEach((c: any) => {
            const cid = String(c.id || c._id);
            if (!categoryMap[cid]) {
              categoryMap[cid] = { id: cid, name: c.name, items: [] };
            }
          });
        }
      }

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
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          const bills = data.bills || [];
          backendValidCount = bills.filter((b: any) =>
            !hiddenIds.includes(b.billNumber) && !hiddenIds.includes(b._id) && !hiddenIds.includes(b.id)
          ).length;
        }
      }

      const localData = await AsyncStorage.getItem('@held_orders');
      let localValidCount = 0;
      if (localData) {
        const localHeld = JSON.parse(localData);
        localValidCount = localHeld.filter((lh: any) => !hiddenIds.includes(lh.id)).length;
      }

      setHeldCount(backendValidCount + localValidCount);
    } catch (e) {
      console.error("Fetch held count error:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const resetFocus = async () => {
        fetchMenus();
        fetchHeldCount();
        fetchSettings();

        // Check if cart needs to be cleared (after Success in Bill Dashboard)
        try {
          const clearSignal = await AsyncStorage.getItem('@clear_cart_after_bill');
          if (clearSignal === 'true') {
            setCart({});
            setActiveOrderId(null);
            setSelectedTable(null);
            await AsyncStorage.removeItem('@clear_cart_after_bill');
          }
        } catch (e) {
          console.log("Error checking clear signal:", e);
        }
      };
      resetFocus();

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

  // Listener for cross-modal item selection (e.g. from Customer History)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('add_to_cart_remote', (data) => {
      const itemsToAdd = Array.isArray(data) ? data : [data];
      
      if (itemsToAdd.length === 0) return;

      // 1. Auto-Scroll to the first item's category
      const firstItem = itemsToAdd[0];
      const catIndex = menus.findIndex(cat => (cat.items || []).some(i => i.id === firstItem.id));
      if (catIndex !== -1 && flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({ index: catIndex, animated: true });
        } catch (e) {}
      }

      // 2. Add all items to cart
      itemsToAdd.forEach(item => {
        if (item && item.id) {
          addToCart(item);
        }
      });
      
      ToastAndroid.show(`Selected ${itemsToAdd.length} Favorite Items Added!`, ToastAndroid.SHORT);
    });
    return () => sub.remove();
  }, [menus]); // Recalculate if menus change

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

  const deleteFromCart = (item: MenuItem) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[item.id];
      return newCart;
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
                itemId: i.id || Math.random().toString(16).padEnd(24, '0'),
                productId: i.id,
                name: i.name, 
                qty: Number(i.quantity || 1),
                quantity: Number(i.quantity || 1),
                rate: i.editedPrice ?? i.price ?? 0,
                price: i.editedPrice ?? i.price ?? 0,
                gst: Number(i.gst || 0),
                taxStatus: (i as any).taxStatus || i.taxType || "Without Tax",
                hsnCode: i.hsnCode || ""
              })),
              subtotal: Number((totalAmount / 1.05).toFixed(2)),
              tax: Number((totalAmount - (totalAmount / 1.05)).toFixed(2)),
              total: Number(totalAmount.toFixed(2)),
              paymentMode: "Cash", 
              paymentStatus: "HELD", 
              isHeld: true, 
              customerName: "Walk-in Customer", 
              tableName: "POS",
              discountAmount: 0,
              discountCode: null,
              auditNote: "Held Order"
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
    <View style={styles.center}><ActivityIndicator size="large" color={THEME_PRIMARY} /><Text style={{ marginTop: 10 }}>{t('loading')}</Text></View>
  );

  return (
    <View style={styles.container}>
      <MenuHeader
        onAddItem={() => router.push("/party/items")}
        onPauseOrder={() => Object.keys(cart).length === 0 ? ToastAndroid.show(t('no_items'), ToastAndroid.SHORT) : setIsHoldModalVisible(true)}
        onViewHeldOrders={() => router.push("/party/hold")}
        onVoicePress={() => setIsVoiceModalVisible(true)}
        heldCount={heldCount}
      />

      <View style={styles.row}>
        <CategorySidebar
          categories={filteredMenus}
          onCategoryPress={(cat, index) => flatListRef.current?.scrollToIndex({ index, animated: true })}
          cartVisible={totalItems > 0}
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
                {!searchQuery && (
                  <QuickAddItemCard
                    itemWidth={itemWidth}
                    onPress={() => {
                      setQuickAddCategoryId(cat.id);
                      setIsQuickAddModalVisible(true);
                    }}
                  />
                )}
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
          onProceed={() => router.push({ pathname: "/party/bill", params: { cart: JSON.stringify(cart), paymentMethod, heldOrderId: activeOrderId } })}
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
        onDelete={deleteFromCart}
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

      <QuickAddItemModal
        visible={isQuickAddModalVisible}
        onClose={() => setIsQuickAddModalVisible(false)}
        categoryId={quickAddCategoryId}
        onSuccess={() => fetchMenus(true)}
      />

      <VoiceOrder 
        visible={isVoiceModalVisible} 
        onClose={() => setIsVoiceModalVisible(false)} 
        menus={menus} 
        onItemMatched={(item) => addToCart(item)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: vs(2), backgroundColor: COLOR_BG_LIGHT },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: { flex: 1, flexDirection: "row" },
  categoryHeader: { fontSize: rf(11), fontWeight: "bold", backgroundColor: "#E0E7FF", padding: s(3), marginTop: vs(10), borderRadius: s(6), textAlign: "center", color: THEME_PRIMARY, marginHorizontal: s(10) },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: s(4), marginTop: vs(5) },
});
