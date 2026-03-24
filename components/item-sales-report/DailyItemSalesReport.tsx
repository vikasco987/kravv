import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";
import ItemWiseSalesDetail from './ItemWiseSalesDetail';

const DailyItemSalesReport = ({ onBack }: { onBack: () => void }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<{ items: any[], totalSales: number, totalQty: number }>({ items: [], totalSales: 0, totalQty: 0 });
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [itemCategoryMap, setItemCategoryMap] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [todayBills, setTodayBills] = useState<any[]>([]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // 1. Fetch Categories
      const catRes = await fetch(`https://billing.kravy.in/api/categories?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }

      // 2. Fetch Menu to map items to categories
      const menuRes = await fetch(`https://billing.kravy.in/api/menu/view?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (menuRes.ok) {
        let menuItemsRaw = await menuRes.json();
        const mapping: Record<string, string> = {};
        let allItems: any[] = [];
        if (Array.isArray(menuItemsRaw)) {
          allItems = menuItemsRaw;
        } else if (menuItemsRaw?.menus) {
          menuItemsRaw.menus.forEach((m: any) => {
            if (m.items) {
              m.items.forEach((it: any) => {
                allItems.push({ ...it, categoryName: m.name });
              });
            }
          });
        }
        allItems.forEach((item: any) => {
          const name = (item.name || "").toLowerCase().trim();
          const catName = item.category?.name || item.categoryName || "Others";
          mapping[name] = catName;
        });
        setItemCategoryMap(mapping);
      }

      // 3. Fetch Bills
      const response = await fetch(`https://billing.kravy.in/api/bill-manager?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const bills = Array.isArray(data) ? data : (data.bills || []);

        // Filter for today's bills
        const today = new Date().toISOString().split('T')[0];
        const todayBills = bills.filter((bill: any) => {
          const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
          return billDate === today;
        });
        setTodayBills(todayBills);

        // Aggregate items
        const itemMap: Record<string, { name: string, qty: number, total: number }> = {};
        let totalRevenue = 0;
        let totalItemsSold = 0;

        todayBills.forEach((bill: any) => {
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
      console.error("Sales report error:", error);
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
    return <ItemWiseSalesDetail itemName={selectedItem} bills={todayBills} onBack={() => setSelectedItem(null)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Item Sales</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: vs(10), color: '#666' }}>Fetching today's sales...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: '#4F46E5' }]}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>₹{reportData.totalSales.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
              <Text style={styles.summaryLabel}>Items Sold</Text>
              <Text style={styles.summaryValue}>{reportData.totalQty}</Text>
            </View>
          </View>
          
          {/* Categories Filter */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === "All" && styles.activeCategoryChip]}
              onPress={() => setSelectedCategory("All")}
            >
              <Text style={[styles.categoryChipText, selectedCategory === "All" && styles.activeCategoryChipText]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat, idx) => (
              <TouchableOpacity 
                key={cat.id || idx}
                style={[styles.categoryChip, selectedCategory === cat.name && styles.activeCategoryChip]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat.name && styles.activeCategoryChipText]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Item-wise Breakdown ({selectedCategory})</Text>

          {(() => {
            const filtered = reportData.items.filter(item => {
              if (selectedCategory === "All") return true;
              const catOfItem = itemCategoryMap[item.name.toLowerCase().trim()] || "Others";
              return catOfItem === selectedCategory;
            });

            return filtered.length > 0 ? (
              filtered.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.itemRow}
                  onPress={() => setSelectedItem(item.name)}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{item.qty} units sold</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.itemAmount}>₹{item.total.toFixed(2)}</Text>
                    <Ionicons name="chevron-forward" size={rf(18)} color="#ccc" style={{ marginLeft: s(8) }} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={rf(60)} color="#ccc" />
                <Text style={styles.emptyText}>{selectedCategory === "All" ? "No sales recorded for today yet." : `No sales in ${selectedCategory} category.`}</Text>
              </View>
            );
          })()}
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
    marginBottom: vs(12),
    marginTop: vs(5)
  },
  categoryScroll: {
    marginBottom: vs(20),
    flexDirection: 'row'
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: s(18),
    paddingVertical: vs(8),
    borderRadius: s(20),
    marginRight: s(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeCategoryChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    color: '#6B7280',
    fontSize: rf(14),
    fontWeight: '600'
  },
  activeCategoryChipText: {
    color: '#fff',
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

export default DailyItemSalesReport;

