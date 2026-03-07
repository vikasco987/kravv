import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useRefresh } from "../../context/RefreshContext";

const COLORS = {
  primary: '#007AFF',
  background: '#F9F9F9',
  card: '#FFFFFF',
  text: '#333333',
  lightText: '#666666',
  borderColor: '#E0E0E0',
  success: '#34C759',
};

const SalesCard = ({ date, numberOfBills, totalSales }) => (
  <View style={enhancedStyles.card}>
    <View style={enhancedStyles.cardHeader}>
      <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
      <Text style={enhancedStyles.cardDate}>{date}</Text>
    </View>
    <View style={enhancedStyles.cardBody}>
      <SalesStat label="Bills" value={numberOfBills} icon="receipt-outline" color={COLORS.lightText} />
      <SalesStat label="Total Sales" value={`₹${totalSales.toLocaleString('en-IN')}`} icon="wallet-outline" color={COLORS.success} isMain={true} />
    </View>
  </View>
);

const SalesStat = ({ label, value, icon, color, isMain = false }) => (
  <View style={enhancedStyles.statContainer}>
    <Ionicons name={icon} size={isMain ? 24 : 18} color={color} />
    <Text style={[enhancedStyles.statValue, { color: isMain ? COLORS.text : COLORS.lightText, fontWeight: isMain ? 'bold' : '500' }]}>{value}</Text>
    <Text style={enhancedStyles.statLabel}>{label}</Text>
  </View>
);

const TableListView = ({ data, refreshing, onRefresh }) => (
  <View style={enhancedStyles.tableContainer}>
    <View style={enhancedStyles.tableHeaderRow}>
      <Text style={[enhancedStyles.tableCellHeader, { flex: 3 }]}>Date</Text>
      <Text style={enhancedStyles.tableCellHeader}>Bills</Text>
      <Text style={[enhancedStyles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Sales</Text>
    </View>
    <FlatList
      data={data}
      keyExtractor={(item) => item.id || item.date}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      renderItem={({ item }) => (
        <View style={enhancedStyles.tableRow}>
          <Text style={[enhancedStyles.tableCell, { flex: 3 }]}>{item.date}</Text>
          <Text style={enhancedStyles.tableCell}>{item.numberOfBills}</Text>
          <Text style={[enhancedStyles.tableCell, { flex: 2, color: COLORS.success, fontWeight: 'bold', textAlign: 'right' }]}>
            ₹{item.totalSales.toLocaleString('en-IN')}
          </Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={enhancedStyles.emptyContainer}>
          <Text style={enhancedStyles.emptyText}>No sales found for Table View.</Text>
        </View>
      )}
    />
  </View>
);

export default function DailySalesScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { refreshSignal, triggerRefresh } = useRefresh();

  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('card');

  const totalGrandSales = dailySales.reduce((sum, item) => sum + item.totalSales, 0);

  const groupSalesByDate = (bills) => {
    const grouped = {};
    bills.forEach((bill) => {
      const dateKey = new Date(bill.createdAt).toISOString().split('T')[0];
      const dateDisplay = new Date(bill.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = { id: dateKey, date: dateDisplay, numberOfBills: 0, totalSales: 0 };
      }
      grouped[dateKey].numberOfBills += 1;
      grouped[dateKey].totalSales += (bill.total || 0);
    });
    return Object.values(grouped).sort((a, b) => b.id.localeCompare(a.id));
  };

  const fetchBills = async (silent = false) => {
    if (!isLoaded || !isSignedIn) {
      setDailySales([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const token = await getToken();
      const res = await fetch("https://billing.kravy.in/api/bill-manager", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bills) {
          setDailySales(groupSalesByDate(data.bills.filter(b => b.isHeld !== true)));
        }
      }
    } catch (err) {
      console.warn("DailySales Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBills(); }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchBills(true);
    }
  }, [refreshSignal]);

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <SafeAreaView style={enhancedStyles.container}>
      <View style={enhancedStyles.pageHeader}>
        <View style={enhancedStyles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={enhancedStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={enhancedStyles.title}>Daily Sales Report 📈</Text>
          <TouchableOpacity onPress={triggerRefresh} style={enhancedStyles.reloadButton}>
            <Ionicons name="refresh" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={enhancedStyles.subtitle}>
          All Time Sales: <Text style={enhancedStyles.totalSalesValue}>₹{totalGrandSales.toLocaleString('en-IN')}</Text>
        </Text>

        <View style={enhancedStyles.controlButtons}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} style={enhancedStyles.modeButton}>
            <Ionicons name={viewMode === 'card' ? "list-outline" : "grid-outline"} size={22} color={COLORS.primary} />
            <Text style={enhancedStyles.modeText}>{viewMode === 'card' ? 'Table View' : 'Card View'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 10 }}>
        {viewMode === 'card' ? (
          <FlatList
            data={dailySales}
            keyExtractor={(item) => item.id || item.date}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBills(true)} colors={[COLORS.primary]} />}
            renderItem={({ item }) => (
              <SalesCard
                date={item.date}
                numberOfBills={item.numberOfBills}
                totalSales={item.totalSales}
              />
            )}
            ListEmptyComponent={() => (
              <View style={enhancedStyles.emptyContainer}>
                <Ionicons name="close-circle-outline" size={50} color={COLORS.lightText} />
                <Text style={enhancedStyles.emptyText}>No sales records found yet.</Text>
              </View>
            )}
          />
        ) : (
          <TableListView data={dailySales} refreshing={refreshing} onRefresh={() => fetchBills(true)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const enhancedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageHeader: { padding: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, elevation: 2, paddingTop: 40 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { padding: 4 },
  reloadButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, flex: 1, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.lightText, textAlign: 'center', marginBottom: 15 },
  totalSalesValue: { fontWeight: 'bold', color: COLORS.success },
  controlButtons: { flexDirection: 'row', justifyContent: 'center' },
  modeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#D0E7FF' },
  modeText: { marginLeft: 8, color: COLORS.primary, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, marginHorizontal: 16, marginVertical: 8, borderRadius: 12, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10, marginBottom: 12 },
  cardDate: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardBody: { flexDirection: 'row', justifyContent: 'space-around' },
  statContainer: { alignItems: 'center' },
  statValue: { fontSize: 18, marginTop: 4 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2, textTransform: 'uppercase' },
  tableContainer: { flex: 1, backgroundColor: COLORS.card, margin: 16, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor },
  tableCellHeader: { fontWeight: 'bold', color: COLORS.lightText, fontSize: 13, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  tableCell: { fontSize: 14, color: COLORS.text },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 12, fontSize: 16, color: COLORS.lightText },
});
