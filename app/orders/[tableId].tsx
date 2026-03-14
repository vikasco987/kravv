import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  billNumber: string;
  status: string; // PENDING, PREPARING, READY, SERVED
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export default function TableOrdersScreen() {
  const { tableId, tableName } = useLocalSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInProgress = React.useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!tableId || fetchInProgress.current) return;
    
    try {
      fetchInProgress.current = true;
      const token = await getToken();
      // Add timestamp to prevent caching
      const response = await fetch(`https://billing.kravy.in/api/orders?tableId=${tableId}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : (data.orders || []);
        
        // STRICT LOCAL FILTER: Only show orders that belong to this specific tableId
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
        setOrders(normalizedOrders);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [tableId, getToken]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
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
      if (response.ok) {
        fetchOrders();
      } else {
        const err = await response.json();
        Alert.alert("Error", err.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
    }
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

  const renderOrderItem = ({ item }: { item: Order }) => (
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
        <View key={idx} style={styles.itemRow}>
          <Text style={styles.itemName}>{it.name} x{it.quantity}</Text>
          <Text style={styles.itemPrice}>₹{(it.price * it.quantity).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ₹{item.total.toFixed(2)}</Text>
        <View style={styles.actionRow}>
          {item.status === "PENDING" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#3B82F6" }]}
              onPress={() => updateOrderStatus(item.id, "PREPARING")}
            >
              <Text style={styles.actionBtnText}>Prepare</Text>
            </TouchableOpacity>
          )}
          {item.status === "PREPARING" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
              onPress={() => updateOrderStatus(item.id, "READY")}
            >
              <Text style={styles.actionBtnText}>Ready</Text>
            </TouchableOpacity>
          )}
          {item.status === "READY" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#6B7280" }]}
              onPress={() => updateOrderStatus(item.id, "SERVED")}
            >
              <Text style={styles.actionBtnText}>Mark Served</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rf(26)} color="#1F2937" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{tableName || "Table Orders"}</Text>
          <Text style={styles.headerSubtitle}>Manage live orders from QR Menu</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={THEME_PRIMARY} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={rf(60)} color="#D1D5DB" />
              <Text style={styles.emptyText}>No active orders for this table</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: vs(15),
    paddingHorizontal: s(20),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: vs(40)
  },
  backBtn: { marginRight: s(20) },
  headerTitle: { fontSize: rf(22), fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: rf(13), color: '#6B7280' },
  listContainer: { padding: s(15) },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: s(20),
    padding: s(15),
    marginBottom: vs(15),
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
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
  actionRow: { flexDirection: 'row', gap: s(8) },
  actionBtn: { paddingHorizontal: s(12), paddingVertical: vs(8), borderRadius: s(10) },
  actionBtnText: { color: '#fff', fontSize: rf(12), fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: vs(100) },
  emptyText: { color: '#9CA3AF', fontSize: rf(16), marginTop: vs(15) }
});
