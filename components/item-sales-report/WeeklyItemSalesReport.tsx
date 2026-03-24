import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";
import ItemWiseSalesDetail from './ItemWiseSalesDetail';

const WeeklyItemSalesReport = ({ onBack }: { onBack: () => void }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<{ items: any[], totalSales: number, totalQty: number }>({ items: [], totalSales: 0, totalQty: 0 });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [weeklyBills, setWeeklyBills] = useState<any[]>([]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`https://billing.kravy.in/api/bill-manager?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const bills = Array.isArray(data) ? data : (data.bills || []);

        // Filter for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weeklyBillsList = bills.filter((bill: any) => {
          const billDate = new Date(bill.createdAt);
          return billDate >= sevenDaysAgo;
        });
        setWeeklyBills(weeklyBillsList);

        // Aggregate items
        const itemMap: Record<string, { name: string, qty: number, total: number }> = {};
        let totalRevenue = 0;
        let totalItemsSold = 0;

        weeklyBillsList.forEach((bill: any) => {
          totalRevenue += (bill.total || 0);
          const items = bill.items || [];
          items.forEach((item: any) => {
            const name = item.name || "Unknown Item";
            const qty = Number(item.qty || item.quantity || 0);
            const rate = Number(item.rate || item.price || 0);
            
            if (!itemMap[name]) {
              itemMap[name] = { name, qty: 0, total: 0 };
            }
            itemMap[name].qty += qty;
            itemMap[name].total += (qty * rate);
            totalItemsSold += qty;
          });
        });

        const sortedItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
        setReportData({ items: sortedItems, totalSales: totalRevenue, totalQty: totalItemsSold });
      }
    } catch (error) {
      console.error("Weekly report error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSalesReport();
  };

  if (selectedItem) {
    return <ItemWiseSalesDetail itemName={selectedItem} bills={weeklyBills} onBack={() => setSelectedItem(null)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Item Sales</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: vs(10), color: '#666' }}>Fetching last 7 days sales...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: '#4F46E5' }]}>
              <Text style={styles.summaryLabel}>Weekly Sales</Text>
              <Text style={styles.summaryValue}>₹{reportData.totalSales.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
              <Text style={styles.summaryLabel}>Total Sold</Text>
              <Text style={styles.summaryValue}>{reportData.totalQty}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Performance Breakdown</Text>
          
          {reportData.items.length > 0 ? (
            reportData.items.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.itemRow}
                onPress={() => setSelectedItem(item.name)}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.qty} units in 7 days</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.itemAmount}>₹{item.total.toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={rf(18)} color="#ccc" style={{ marginLeft: s(8) }} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={rf(60)} color="#ccc" />
              <Text style={styles.emptyText}>No sales recorded in the last 7 days.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: vs(100),
    paddingTop: vs(30),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    backgroundColor: '#4F46E5'
  },
  headerTitle: {
    marginLeft: s(20),
    color: '#fff',
    fontSize: rf(20),
    fontWeight: 'bold'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    padding: s(20),
    paddingBottom: vs(60)
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(25)
  },
  summaryCard: {
    width: '48%',
    padding: s(15),
    borderRadius: s(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rf(14),
    fontWeight: '500'
  },
  summaryValue: {
    color: '#fff',
    fontSize: rf(22),
    fontWeight: 'bold',
    marginTop: vs(5)
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: vs(15)
  },
  itemRow: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(15),
    borderRadius: s(12),
    marginBottom: vs(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#1F2937'
  },
  itemMeta: {
    fontSize: rf(12),
    color: '#6B7280',
    marginTop: vs(2)
  },
  itemAmount: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#4F46E5'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: vs(50)
  },
  emptyText: {
    marginTop: vs(15),
    fontSize: rf(16),
    color: '#9CA3AF',
    textAlign: 'center'
  }
});

export default WeeklyItemSalesReport;

