import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, FlatList, RefreshControl, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';
import { SimpleKOT } from '../common/SimpleKOT';
import { StaffPermissionEngine } from '../staff creat/StaffPermissionEngine';

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
  const { getToken } = useAuth();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isProcessing = useRef(false);

  const loadLocalKOTs = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('@local_kot_list');
      if (data) {
        setOrders(JSON.parse(data));
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Error loading local KOTs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.PRIMARY }]}
          onPress={async () => {
            const checkoutData = {
              items: item.items,
              tableName: item.tableName?.replace("Table ", "") || "Counter",
              tokenNumber: (item as any).tokenNumber || item.billNumber
            };
            await AsyncStorage.setItem('@temp_cart_for_checkout', JSON.stringify(checkoutData));
            // Also remove from KOT list as it's going to checkout
            await removeLocalOrder(item.id);
            // Navigate to Menu
            router.push('/(tabs)/menu');
            // Emit event just in case
            DeviceEventEmitter.emit('GOTO_CHECKOUT_FROM_KOT');
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>CHECKOUT</Text>
          </View>
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
    </View>
  );
}

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
