import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  TouchableOpacity 
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons'; 
import { useMemo } from 'react'; // Importing useMemo for optimization

// --- Constants for Styling ---
const COLORS = {
  primary: '#5D3FD3', // Deep Purple (Brand Color)
  secondary: '#FFC107', // Gold/Amber for accents
  background: '#F0F2F5', // Light gray background for contrast
  card: '#FFFFFF',
  text: '#1F2937', // Darker text for readability
  lightText: '#6B7280',
  borderColor: '#E5E7EB',
  success: '#10B981', // More vibrant green
};

const FONT_SIZE = {
  title: 24,
  header: 18,
  subHeader: 14,
  body: 12,
};

// --- Custom Components ---

// Stat Component
const SalesStat = ({ label, value, icon, color, isMain = false }) => (
  <View style={enhancedStyles.statContainer}>
    <Ionicons name={icon} size={isMain ? 28 : 20} color={color} />
    <Text style={[
      enhancedStyles.statValue, 
      { 
        color: isMain ? COLORS.text : COLORS.lightText, 
        fontSize: isMain ? FONT_SIZE.header : FONT_SIZE.subHeader,
        fontWeight: isMain ? '700' : '500' 
      }
    ]}>
      {value}
    </Text>
    <Text style={enhancedStyles.statLabel}>{label}</Text>
  </View>
);

// Card Component for Monthly Data
const MonthlySalesCard = ({ monthLabel, numberOfBills, totalSales }) => (
  <View style={enhancedStyles.card}>
    <View style={enhancedStyles.cardHeader}>
      <Ionicons name="calendar-sharp" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
      <Text style={enhancedStyles.cardMonthLabel}>{monthLabel}</Text>
    </View>
    <View style={enhancedStyles.cardBody}>
      {/* Stat 1: Bills */}
      <SalesStat 
        label="Bills Count" 
        value={numberOfBills.toLocaleString()} 
        icon="receipt-outline" 
        color={COLORS.lightText} 
      />
      {/* Stat 2: Total Sales (Main Highlight) */}
      <SalesStat 
        label="Monthly Sales" 
        value={`₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
        icon="wallet-sharp" 
        color={COLORS.success} 
        isMain={true} 
      />
    </View>
  </View>
);

// New Component for the Table View
const TableListView = ({ data }) => (
    <View style={enhancedStyles.tableContainer}>
        {/* Table Header */}
        <View style={enhancedStyles.tableHeaderRow}>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 3 }]}>Month</Text>
            <Text style={enhancedStyles.tableCellHeader}>Bills</Text>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Sales</Text>
        </View>

        {/* Table Rows */}
        <FlatList
            data={data}
            keyExtractor={(item) => item.sortKey}
            renderItem={({ item }) => (
                <View style={enhancedStyles.tableRow}>
                    <Text style={[enhancedStyles.tableCell, { flex: 3, textAlign: 'left', fontWeight: 'bold' }]}>{item.monthLabel}</Text>
                    <Text style={enhancedStyles.tableCell}>{item.numberOfBills.toLocaleString()}</Text>
                    <Text style={[enhancedStyles.tableCell, { flex: 2, color: COLORS.success, fontWeight: 'bold', textAlign: 'right' }]}>
                        ₹{item.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            )}
            ListEmptyComponent={() => (
                <View style={enhancedStyles.emptyContainer}>
                    <Text style={enhancedStyles.emptyText}>No monthly sales found for Table View.</Text>
                </View>
            )}
            contentContainerStyle={data.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : {}}
        />
    </View>
);

// --- Main Screen Component ---
export default function MonthlySalesScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);
  // State to manage the view: 'card' or 'table'
  const [viewMode, setViewMode] = useState('card'); 

  // Memoize the calculation of total grand sales
  const totalGrandSales = useMemo(() => {
    return monthlySales.reduce((sum, item) => sum + item.totalSales, 0);
  }, [monthlySales]);

  const groupSalesByMonth = (bills) => {
    const grouped = {};
    bills.forEach((bill) => {
      const date = new Date(bill.createdAt);
      
      const sortKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const monthLabel = date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
      });

      if (!grouped[sortKey]) grouped[sortKey] = { sortKey, monthLabel, numberOfBills: 0, totalSales: 0 };
      grouped[sortKey].numberOfBills += 1;
      grouped[sortKey].totalSales += bill.grandTotal;
    });

    return Object.values(grouped).sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
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
      if (res.ok && data.bills) setMonthlySales(groupSalesByMonth(data.bills));
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
      {/* Header with stronger visual hierarchy */}
      <View style={enhancedStyles.pageHeader}>
        <Text style={enhancedStyles.title}>
          <Ionicons name="trending-up-sharp" size={FONT_SIZE.title} color={COLORS.primary} /> Monthly Sales
        </Text>
        <Text style={enhancedStyles.totalSalesLabel}>All Time Grand Total</Text>
        <Text style={enhancedStyles.totalSalesValue}>
          ₹{totalGrandSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
        
        {/* Control Buttons (Refresh and Toggle) */}
        <View style={enhancedStyles.controlButtons}>
            {/* Refresh Button */}
            <TouchableOpacity onPress={fetchBills} style={enhancedStyles.controlButton}>
                <Ionicons name="sync-circle-outline" size={30} color={COLORS.primary} />
            </TouchableOpacity>
            {/* View Toggle Button */}
            <TouchableOpacity 
                onPress={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} 
                style={enhancedStyles.controlButton}
            >
                <Ionicons 
                    name={viewMode === 'card' ? "list-sharp" : "grid-sharp"} 
                    size={26} 
                    color={COLORS.primary} 
                />
            </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'card' ? (
        <FlatList
          data={monthlySales}
          keyExtractor={(item) => item.sortKey} 
          renderItem={({ item }) => (
            <MonthlySalesCard
              monthLabel={item.monthLabel}
              numberOfBills={item.numberOfBills}
              totalSales={item.totalSales}
            />
          )}
          ListEmptyComponent={() => (
            <View style={enhancedStyles.emptyContainer}>
              <Ionicons name="sad-outline" size={50} color={COLORS.lightText} />
              <Text style={enhancedStyles.emptyText}>No monthly sales records found.</Text>
            </View>
          )}
          contentContainerStyle={monthlySales.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 20 }}
        />
      ) : (
        <TableListView data={monthlySales} />
      )}
    </SafeAreaView>
  );
}

// --- Enhanced Styles for Standard App Look ---
const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageHeader: {
    padding: 20,
    paddingTop: 15,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginBottom: 10,
  },
  title: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800', // Extra bold title
    color: COLORS.text,
    marginBottom: 10,
    alignItems: 'center',
  },
  totalSalesLabel: {
    fontSize: FONT_SIZE.subHeader,
    color: COLORS.lightText,
    fontWeight: '500',
  },
  totalSalesValue: {
    fontSize: 28, // Large, prominent value
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 2,
  },
  controlButtons: {
    position: 'absolute',
    right: 20,
    top: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 5,
    marginLeft: 10,
  },
  // Card Styling (Modern Look)
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 18,
    shadowColor: COLORS.primary, // Primary color hint in shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5, 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  cardMonthLabel: {
    fontSize: FONT_SIZE.header,
    fontWeight: '700',
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
    // Defined inline in component for flexibility
    marginTop: 5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZE.body,
    color: COLORS.lightText,
    textTransform: 'uppercase', // Standard app label style
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: FONT_SIZE.header,
    color: COLORS.lightText,
  },
  // --- Table Styles (New) ---
  tableContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    marginHorizontal: 15,
    borderRadius: 8,
    overflow: 'hidden', // Ensures borders/shadows look clean
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
    fontSize: FONT_SIZE.subHeader,
    color: COLORS.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tableCell: {
    flex: 2,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  }
});