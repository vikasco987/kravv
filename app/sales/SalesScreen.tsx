import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

type Product = {
  productId: string;
  name?: string; // Added to support new API schema
  quantity: number;
  price: number;
  total: number;
};

type Sale = {
  billNumber: string;
  items: Product[];
  total: number;
  paymentMode: string;
  paymentStatus: string;
  createdAt: string;
};

export default function SalesScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("https://billing.kravy.in/api/bill-manager", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data && data.bills) {
        const onlySales = data.bills.filter((b: any) => b.isHeld !== true);
        setSales(onlySales);
      }
    } catch (err) {
      console.log("❌ Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Sale }) => {

    return (
      <View style={styles.item}>
        <Text style={styles.billNo}>Bill: {item.billNumber}</Text>
        <Text>Date: {new Date(item.createdAt).toLocaleString()}</Text>
        <Text>Payment: {item.paymentMode}</Text>
        <Text>Total: ₹{item.total.toFixed(2)}</Text>
        <Text>Status: {item.paymentStatus}</Text>

        <Text style={{ marginTop: vs(5), fontWeight: "bold", fontSize: rf(14) }}>Items:</Text>
        {item.items && Array.isArray(item.items) && item.items.map((p, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName}>
              {p.name || p.productId}
            </Text>
            <Text style={styles.productQty}>Qty: {p.quantity}</Text>
            <Text style={styles.productPrice}>₹{p.price?.toFixed(2)}</Text>
            <Text style={styles.productTotal}>₹{p.total?.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading)
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rf(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Records</Text>
      </View>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.billNumber}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: vs(50) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(16),
    paddingTop: vs(40),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backButton: {
    marginRight: s(16),
  },
  title: { fontSize: rf(22), fontWeight: "bold" },
  item: { padding: s(12), borderBottomWidth: 1, borderColor: "#ccc", marginBottom: vs(8) },
  billNo: { fontWeight: "bold", fontSize: rf(14) },
  productRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: vs(2) },
  productName: { flex: 2, fontSize: rf(12) },
  productQty: { flex: 1, textAlign: "center", fontSize: rf(12) },
  productPrice: { flex: 1, textAlign: "center", fontSize: rf(12) },
  productTotal: { flex: 1, textAlign: "right", fontWeight: "bold", fontSize: rf(12) },
});
