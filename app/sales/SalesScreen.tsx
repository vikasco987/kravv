import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

type Product = {
  productId: string; // Ideally, we should have productName instead
  quantity: number;
  price: number;
  total: number;
};

type Sale = {
  billId: string;
  snapshot: {
    products: Product[];
    total: number;
    grandTotal: number;
    paymentMode: string;
    paymentStatus: string;
    notes: string;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
  };
  createdAt: string;
};

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://billing-backend-sable.vercel.app/api/billing"); // ✅ corrected endpoint
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.log("❌ Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Sale }) => {
    const { snapshot } = item;

    return (
      <View style={styles.item}>
        <Text style={styles.billNo}>Bill: {item.billId}</Text>
        <Text>Date: {new Date(item.createdAt).toLocaleString()}</Text>
        <Text>Company: {snapshot.companyName}</Text>
        <Text>Payment: {snapshot.paymentMode}</Text>
        <Text>Total: ₹{snapshot.grandTotal.toFixed(2)}</Text>

        <Text style={{ marginTop: 5, fontWeight: "bold" }}>Items:</Text>
        {snapshot.products.map((p, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName}>
              {p.productId} {/* If you store product name instead of ID, replace here */}
            </Text>
            <Text style={styles.productQty}>Qty: {p.quantity}</Text>
            <Text style={styles.productPrice}>₹{p.price.toFixed(2)}</Text>
            <Text style={styles.productTotal}>₹{p.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading)
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales</Text>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.billId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 8 },
  billNo: { fontWeight: "bold" },
  productRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  productName: { flex: 2 },
  productQty: { flex: 1, textAlign: "center" },
  productPrice: { flex: 1, textAlign: "center" },
  productTotal: { flex: 1, textAlign: "right", fontWeight: "bold" },
});
