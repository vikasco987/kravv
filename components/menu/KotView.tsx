import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, DeviceEventEmitter, Dimensions, FlatList, Modal, RefreshControl, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';
import { SimpleKOT } from '../common/SimpleKOT';
import { StaffPermissionEngine } from '../staff creat/StaffPermissionEngine';
import { CategorySidebar } from "./CategorySidebar";
import { MenuItemCard } from "./MenuItemCard";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  billNumber: string;
  tableName?: string;
  status: string;
  items: OrderItem[];
  unprintedItems?: OrderItem[];
  createdAt: string;
}

const COLORS = {
  PRIMARY: "#4F46E5",
  PENDING: "#F59E0B",
  PREPARING: "#3B82F6",
  READY: "#10B981",
  BG: "#F3F4F6",
  TEXT: "#1E293B"
};

export default function KotView() {
  const router = useRouter();
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isProcessing = useRef(false);

  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [selectedKOTToEdit, setSelectedKOTToEdit] = useState<Order | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const fetchMenuCategories = async () => {
    setMenuLoading(true);
    try {
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      const cacheKey = `@cached_menu_${bId || user?.id || 'guest'}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        setCategories(JSON.parse(cachedData));
      }
    } catch (e) {
      console.log("Error loading menu:", e);
    } finally {
      setMenuLoading(false);
    }
  };

  const loadLocalKOTs = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('@local_kot_list');
      if (data) {
        setOrders(JSON.parse(data));
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Failed to load local KOTs", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isMenuModalVisible) {
          setIsMenuModalVisible(false);
          setSelectedKOTToEdit(null);
          return true;
        }

        try {
          const state = navigation.getState();
          if (state && state.type === 'tab' && state.history && state.history.length > 1) {
            const historyItem = state.history[state.history.length - 2] as any;
            const previousKey = historyItem.key;
            const previousRoute = state.routes.find((r: any) => r.key === previousKey);

            if (previousRoute && previousRoute.name && previousRoute.name !== 'kot') {
              router.push(`/(tabs)/${previousRoute.name}` as any);
              return true;
            }
          }
        } catch (e) {
          console.log("Navigation state error:", e);
        }

        if (router.canGoBack()) {
          router.back();
          return true;
        } else {
          router.push('/(tabs)/orders');
          return true;
        }
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [isMenuModalVisible, navigation])
  );

  useEffect(() => {
    loadLocalKOTs();
    const interval = setInterval(loadLocalKOTs, 3000);
    return () => clearInterval(interval);
  }, [loadLocalKOTs]);

  const removeLocalOrder = async (orderId: string) => {
    const existingData = await AsyncStorage.getItem('@local_kot_list');
    if (existingData) {
      const list: Order[] = JSON.parse(existingData);
      const filtered = list.filter(o => o.id !== orderId);
      await AsyncStorage.setItem('@local_kot_list', JSON.stringify(filtered));
      loadLocalKOTs();
    }
  };

  const handlePrintAndSave = async (order: Order) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const token = await getToken();
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      // 1. Print
      await SimpleKOT(
        order.items,
        token!,
        bId!,
        order.tableName?.replace("Table ", ""),
        (order as any).tokenNumber ? String((order as any).tokenNumber) : undefined,
        undefined,
        (order as any).customerName,
      );

      // 2. Save to MongoDB
      const payload = {
        items: order.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: 0,
          total: 0
        })),
        tableId: order.tableName?.replace("Table ", "") || "Counter",
        tableName: order.tableName || "Counter",
        total: 0,
        status: "PENDING",
        clerkUserId: bId
      };

      const res = await fetch("https://billing.kravy.in/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        ToastAndroid.show("Printed & Saved to DB!", ToastAndroid.SHORT);
        await removeLocalOrder(order.id);
      } else {
        ToastAndroid.show("Error saving to DB", ToastAndroid.SHORT);
      }
    } catch (e) {
      console.error("Print/Save Error:", e);
      ToastAndroid.show("Something went wrong", ToastAndroid.SHORT);
    } finally {
      isProcessing.current = false;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { backgroundColor: COLORS.PRIMARY }]}>
        <View>
          <Text style={styles.cardTitle}>{item.tableName} {(item as any).tokenNumber ? `(Token #${(item as any).tokenNumber})` : ''}</Text>
          <Text style={styles.cardSubtitle}>Order #{(item as any).tokenNumber || item.billNumber} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <TouchableOpacity onPress={() => removeLocalOrder(item.id)}>
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{it.quantity}x</Text>
            <Text style={styles.itemName}>{it.name}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.cardFooter, { flexDirection: 'row', gap: s(8) }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { flex: 1, backgroundColor: '#F59E0B' }]} // KOT Button (Amber)
          onPress={async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            const itemsToPrint = (item.unprintedItems && item.unprintedItems.length > 0)
              ? item.unprintedItems
              : item.items;

            try {
              const token = await getToken();
              const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
              await SimpleKOT(
                itemsToPrint,
                token!,
                bId!,
                item.tableName?.replace("Table ", ""),
                (item as any).tokenNumber ? String((item as any).tokenNumber) : undefined,
                undefined,
                (item as any).customerName,
              );
              ToastAndroid.show("KOT Printed!", ToastAndroid.SHORT);

              // Clear unprintedItems after successful print
              if (item.unprintedItems && item.unprintedItems.length > 0) {
                const existingData = await AsyncStorage.getItem('@local_kot_list');
                if (existingData) {
                  let list = JSON.parse(existingData);
                  const idx = list.findIndex((o: any) => o.id === item.id);
                  if (idx !== -1) {
                    list[idx].unprintedItems = [];
                    await AsyncStorage.setItem('@local_kot_list', JSON.stringify(list));
                    loadLocalKOTs();
                  }
                }
              }
            } catch (e) {
              console.error("Print Error:", e);
              ToastAndroid.show("Print failed", ToastAndroid.SHORT);
            } finally {
              isProcessing.current = false;
            }
          }}
        >
          <Text style={[styles.actionBtnText, { fontSize: rf(12) }]}>KOT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { flex: 1, backgroundColor: '#10B981' }]} // Add Item (Emerald)
          onPress={async () => {
            setSelectedKOTToEdit(item);
            if (categories.length === 0) {
              fetchMenuCategories();
            }
            setIsMenuModalVisible(true);
          }}
        >
          <Text style={[styles.actionBtnText, { fontSize: rf(12) }]}>ADD ITEM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.PRIMARY }]} // Bill (Primary)
          onPress={async () => {
            const checkoutData = {
              items: item.items,
              tableName: item.tableName?.replace("Table ", "") || "Counter",
              tokenNumber: (item as any).tokenNumber || item.billNumber,
              kotId: item.id,
              customerName: (item as any).customerName || '',
              customerPhone: (item as any).customerPhone || '',
              customerAddress: (item as any).customerAddress || '',
              billNumber: item.billNumber || '',
              source: 'kot',
            };
            await AsyncStorage.setItem('@temp_cart_for_checkout', JSON.stringify(checkoutData));
            router.push('/(tabs)/menu');
            DeviceEventEmitter.emit('GOTO_CHECKOUT_FROM_KOT');
          }}
        >
          <Text style={[styles.actionBtnText, { fontSize: rf(12) }]}>BILL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={rf(26)} color={COLORS.TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KOT Page</Text>
        </View>
        <Text style={styles.headerSubtitle}>{orders.length} KOTs to process</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLocalKOTs(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={rf(60)} color="#CBD5E1" />
            <Text style={styles.emptyText}>No KOTs found</Text>
            <Text style={styles.emptySub}>Select items and click KOT button in menu to see them here.</Text>
          </View>
        }
      />

      <FullMenuModal
        visible={isMenuModalVisible}
        onClose={() => {
          setIsMenuModalVisible(false);
          setSelectedKOTToEdit(null);
        }}
        categories={categories}
        loading={menuLoading}
        onConfirm={async (addedItems: any[]) => {
          setIsMenuModalVisible(false);
          if (!selectedKOTToEdit || addedItems.length === 0) return;

          try {
            const existingData = await AsyncStorage.getItem('@local_kot_list');
            if (existingData) {
              let list = JSON.parse(existingData);
              const index = list.findIndex((o: any) => o.id === selectedKOTToEdit.id);
              if (index !== -1) {
                // Merge items
                const currentItems = [...list[index].items];
                const unprintedItems = list[index].unprintedItems ? [...list[index].unprintedItems] : [];

                addedItems.forEach(newItem => {
                  const existingItem = currentItems.find(i => i.name === newItem.name);
                  if (existingItem) {
                    existingItem.quantity += newItem.quantity;
                  } else {
                    currentItems.push({ name: newItem.name, quantity: newItem.quantity });
                  }

                  const existingUnprinted = unprintedItems.find(i => i.name === newItem.name);
                  if (existingUnprinted) {
                    existingUnprinted.quantity += newItem.quantity;
                  } else {
                    unprintedItems.push({ name: newItem.name, quantity: newItem.quantity });
                  }
                });
                list[index].items = currentItems;
                list[index].unprintedItems = unprintedItems;
                await AsyncStorage.setItem('@local_kot_list', JSON.stringify(list));
                loadLocalKOTs();
                ToastAndroid.show("Items added successfully!", ToastAndroid.SHORT);
              }
            }
          } catch (e) {
            console.log("Error adding items:", e);
          } finally {
            setSelectedKOTToEdit(null);
          }
        }}
      />
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CATEGORY_COLUMN_WIDTH = s(90);

const FullMenuModal = ({ visible, onClose, categories, onConfirm, loading }: any) => {
  const flatListRef = React.useRef<FlatList>(null);
  const [cart, setCart] = useState<Record<string, any>>({});

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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: s(25), borderTopRightRadius: s(25), height: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: s(15), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <Text style={{ fontSize: rf(16), fontWeight: "bold", color: "#1F2937" }}>Add Items</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={rf(24)} /></TouchableOpacity>
          </View>

          <View style={{ flex: 1, flexDirection: "row" }}>
            {loading || !categories || categories.length === 0 ? (
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
                      <Text style={{ fontSize: rf(11), fontWeight: "bold", backgroundColor: "#E0E7FF", padding: s(3), marginTop: vs(10), marginBottom: vs(5), borderRadius: s(6), textAlign: "center", color: "#4F46E5", marginHorizontal: s(10) }}>{cat.name}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: s(4), marginTop: vs(5) }}>
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: s(20), borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#fff", paddingBottom: vs(50) }}>
              <View>
                <Text style={{ fontSize: rf(14), fontWeight: "bold", color: "#4F46E5" }}>{totalItems} Items</Text>
                <Text style={{ fontSize: rf(18), fontWeight: "bold", color: "#111827" }}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: "#4F46E5", paddingHorizontal: s(25), paddingVertical: vs(12), borderRadius: s(12) }} onPress={() => onConfirm(Object.values(cart))}>
                <Text style={{ color: "#fff", fontSize: rf(14), fontWeight: "bold" }}>Add to Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  header: { padding: s(15), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: vs(20) },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: s(15) },
  headerTitle: { fontSize: rf(22), fontWeight: 'bold', color: COLORS.TEXT },
  headerSubtitle: { fontSize: rf(13), color: '#64748B', marginTop: vs(2), marginLeft: s(40) },
  list: { padding: s(10) },
  card: { backgroundColor: '#fff', borderRadius: s(12), marginBottom: vs(15), overflow: 'hidden', elevation: 3 },
  cardHeader: { padding: s(12), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: rf(18), fontWeight: '800' },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: rf(12) },
  itemsContainer: { padding: s(15) },
  itemRow: { flexDirection: 'row', marginBottom: vs(10), alignItems: 'flex-start' },
  itemQty: { fontSize: rf(18), fontWeight: '900', color: COLORS.PRIMARY, width: s(35) },
  itemName: { fontSize: rf(18), color: '#334155', flex: 1, fontWeight: '500' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: s(10) },
  actionBtn: { paddingVertical: vs(12), borderRadius: s(8), alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(14) },
  empty: { marginTop: vs(100), alignItems: 'center', paddingHorizontal: s(40) },
  emptyText: { marginTop: vs(20), fontSize: rf(20), color: '#64748B', fontWeight: 'bold' },
  emptySub: { marginTop: vs(10), fontSize: rf(14), color: '#94A3B8', textAlign: 'center' }
});
