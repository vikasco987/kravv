import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleKOT } from "../common/SimpleKOT";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function TableOrdersView({ tableId, tableName, onBack, initialOrders }: TableOrdersViewProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [loading, setLoading] = useState(initialOrders ? false : true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInProgress = React.useRef(false);

  const getTokenRef = React.useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; });

  const fetchOrders = useCallback(async () => {
    if (!tableId || fetchInProgress.current) return;

    try {
      fetchInProgress.current = true;
      const token = await getTokenRef.current();

      const response = await fetch(`https://billing.kravy.in/api/orders?tableId=${tableId}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : (data.orders || []);
        const filteredOrders = ordersArray.filter((o: any) => {
          const oTableId = String(o.tableId ||
            (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) ||
            "");
          return oTableId === String(tableId);
        });

        const normalizedOrders = filteredOrders.map((o: any) => ({
          ...o,
          id: o.id || o._id || Math.random().toString()
        }));
        
        setOrders(prev => JSON.stringify(prev) === JSON.stringify(normalizedOrders) ? prev : normalizedOrders);
        await AsyncStorage.setItem(`@cached_orders_${tableId}`, JSON.stringify(normalizedOrders));
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
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = await getToken();
      const response = await fetch("https://billing.kravy.in/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status }),
      });
      if (response.ok) fetchOrders();
      else Alert.alert("Error", "Failed to update status");
    } catch (error) { console.error("Update status error:", error); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "#F59E0B";
      case "PREPARING": return "#3B82F6";
      case "READY": return "#10B981";
      case "SERVED": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const handlePrintKOT = async (item: Order) => {
    try {
      const token = await getToken();
      const cartItems = item.items.map((it: any) => ({ name: it.name, quantity: it.quantity }));
      await SimpleKOT(cartItems, token!, user?.id!, (tableName as string) || "Table");
    } catch (error) { ToastAndroid.show("Print Error", ToastAndroid.SHORT); }
  };

  const handlePrintBill = async (item: Order) => {
    try {
      const token = await getToken();
      const cartItems = item.items.map((it: any) => ({ id: Math.random().toString(), name: it.name, price: it.price, quantity: it.quantity }));
      await SimpleBill(cartItems, token!, user?.id!, { orderId: item.id as string, customerName: "Table Guest", paymentMode: "CASH", tableName: (tableName as string) || "Table" });
    } catch (error) { ToastAndroid.show("Print Error", ToastAndroid.SHORT); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rf(26)} color="#1F2937" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{tableName || "Table Orders"}</Text>
          <Text style={styles.headerSubtitle}>Manage live orders from QR Menu</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.billNumber}>Bill #{item.billNumber}</Text>
                <Text style={styles.orderTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            {item.items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}><Text style={styles.itemName}>{it.name} x{it.quantity}</Text><Text style={styles.itemPrice}>₹{(it.price * it.quantity).toFixed(2)}</Text></View>
            ))}
            <View style={styles.divider} />
            <View style={styles.footer}>
              <Text style={styles.totalText}>Total: ₹{item.total.toFixed(2)}</Text>
              <View style={styles.actionRow}>
                {item.status === 'PENDING' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={() => updateOrderStatus(item.id, 'PREPARING')}>
                    <Text style={styles.actionBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'PREPARING' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.readyBtn]} onPress={() => updateOrderStatus(item.id, 'READY')}>
                    <Text style={styles.actionBtnText}>Ready</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'READY' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.handOverBtn]} onPress={() => updateOrderStatus(item.id, 'SERVED')}>
                    <Text style={styles.actionBtnText}>Hand Over</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'SERVED' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => updateOrderStatus(item.id, 'COMPLETED')}>
                    <Text style={styles.actionBtnText}>Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, styles.kotBtn]} onPress={() => handlePrintKOT(item)}><Text style={styles.actionBtnText}>KOT</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.printBtn]} onPress={() => handlePrintBill(item)}><Text style={styles.actionBtnText}>Print</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: vs(15), paddingHorizontal: s(20), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: vs(40) },
  backBtn: { marginRight: s(20) },
  headerTitle: { fontSize: rf(22), fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: rf(13), color: '#6B7280' },
  listContainer: { padding: s(15) },
  orderCard: { backgroundColor: '#fff', borderRadius: s(20), padding: s(15), marginBottom: vs(15), elevation: 3, borderWidth: 1, borderColor: '#E5E7EB' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(10) },
  billNumber: { fontSize: rf(16), fontWeight: 'bold', color: '#111827' },
  orderTime: { fontSize: rf(12), color: '#6B7280' },
  statusBadge: { paddingHorizontal: s(10), paddingVertical: vs(4), borderRadius: s(8) },
  statusText: { fontSize: rf(11), fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: vs(10) },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(5) },
  itemName: { fontSize: rf(14), color: '#374151' },
  itemPrice: { fontSize: rf(14), fontWeight: '600', color: '#111827' },
  footer: { marginTop: vs(5), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: rf(16), fontWeight: 'bold', color: THEME_PRIMARY },
  actionRow: { flexDirection: 'row', gap: s(8), justifyContent: 'flex-end', flex: 1, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(8), minWidth: s(60), alignItems: 'center' },
  startBtn: { backgroundColor: '#3B82F6' },
  readyBtn: { backgroundColor: '#10B981' },
  handOverBtn: { backgroundColor: '#6B7280' },
  completeBtn: { backgroundColor: '#000000' },
  kotBtn: { backgroundColor: '#F59E0B' },
  printBtn: { backgroundColor: '#F59E0B' },
  actionBtnText: { color: '#fff', fontSize: rf(11), fontWeight: 'bold' },
});
