import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';

// --- Constants for Styling ---
const COLORS = {
  primary: '#007AFF', // Standard iOS Blue
  background: '#F9F9F9',
  card: '#FFFFFF',
  text: '#333333',
  lightText: '#666666',
  borderColor: '#E0E0E0',
  success: '#34C759',
};

const FONT_SIZE = {
  header: 22,
  subHeader: 16,
  body: 14,
};

// --- Custom Components ---

// Component for the Card View item (from previous response)
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

// New Component for the Table View
const TableListView = ({ data }) => (
    <View style={enhancedStyles.tableContainer}>
        {/* Table Header */}
        <View style={enhancedStyles.tableHeaderRow}>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 3 }]}>Date</Text>
            <Text style={enhancedStyles.tableCellHeader}>Bills</Text>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Sales</Text>
        </View>

        {/* Table Rows */}
        <FlatList
            data={data}
            keyExtractor={(item) => item.date}
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


// --- Main Screen Component ---
export default function DailySalesScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  // State to manage the view: 'card' or 'table'
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

      if (!grouped[dateKey]) grouped[dateKey] = { date: dateDisplay, numberOfBills: 0, totalSales: 0 };
      grouped[dateKey].numberOfBills += 1;
      grouped[dateKey].totalSales += bill.grandTotal;
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const fetchBills = async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("https://billing-backend-sable.vercel.app/api/billing/list", {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok && data.bills) setDailySales(groupSalesByDate(data.bills));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [isLoaded, isSignedIn]);

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <SafeAreaView style={enhancedStyles.container}>
      {/* Header and Controls */}
      <View style={enhancedStyles.pageHeader}>
        <Text style={enhancedStyles.title}>Daily Sales Report 📈</Text>
        <Text style={enhancedStyles.subtitle}>
          All Time Sales: <Text style={enhancedStyles.totalSalesValue}>₹{totalGrandSales.toLocaleString('en-IN')}</Text>
        </Text>
        
        {/* Toggle and Refresh Buttons */}
        <View style={enhancedStyles.controlButtons}>
            {/* Refresh Button */}
            <TouchableOpacity onPress={fetchBills} style={enhancedStyles.refreshButton}>
                <Ionicons name="refresh-circle-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            {/* View Toggle Button */}
            <TouchableOpacity 
                onPress={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} 
                style={enhancedStyles.toggleButton}
            >
                <Ionicons 
                    name={viewMode === 'card' ? "grid-outline" : "list-outline"} 
                    size={24} 
                    color={COLORS.primary} 
                />
            </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'card' ? (
        <FlatList
          data={dailySales}
          keyExtractor={(item) => item.date}
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
          contentContainerStyle={dailySales.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : {}}
        />
      ) : (
        <TableListView data={dailySales} />
      )}
    </SafeAreaView>
  );
}

// --- Enhanced Styles ---
const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageHeader: {
    padding: 20,
    paddingBottom: 45, // Extra space for floating buttons
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginBottom: 10,
  },
  title: {
    fontSize: FONT_SIZE.header,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.subHeader,
    color: COLORS.lightText,
    marginTop: 5,
  },
  totalSalesValue: {
    fontWeight: 'bold',
    color: COLORS.success,
  },
  controlButtons: {
    position: 'absolute',
    right: 20,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 5,
  },
  toggleButton: {
    marginLeft: 10,
    padding: 5,
  },
  // Card Styling (from previous response)
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginBottom: 10,
  },
  cardDate: {
    fontSize: FONT_SIZE.subHeader,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statContainer: {
    alignItems: 'center',
    padding: 5,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    marginTop: 5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZE.body,
    color: COLORS.lightText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: FONT_SIZE.subHeader,
    color: COLORS.lightText,
  },
  // --- New Table Styles ---
  tableContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    marginHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderColor,
    paddingHorizontal: 10,
  },
  tableCellHeader: {
    flex: 2,
    fontWeight: '700',
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 10,
  },
  tableCell: {
    flex: 2,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  }
});