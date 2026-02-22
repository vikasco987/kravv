import React, { useEffect, useState, useMemo } from "react";
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

// --- Constants for Styling ---
const COLORS = {
  primary: '#FF9800', // Orange/Amber (Accent for Weekly)
  background: '#F9F9F9',
  card: '#FFFFFF',
  text: '#333333',
  lightText: '#666666',
  borderColor: '#E0E0E0',
  success: '#4CAF50', // Green for sales
};

const FONT_SIZE = {
  heading: 22,
  subHeader: 16,
  body: 14,
};

// --- Custom Components ---

// 1. Stat Component (Used in Card View)
const SalesStat = ({ label, value, icon, color, isMain = false }) => (
  <View style={enhancedStyles.statContainer}>
    <Ionicons name={icon} size={isMain ? 24 : 18} color={color} />
    <Text style={[
      enhancedStyles.statValue, 
      { color: isMain ? COLORS.text : COLORS.lightText, fontWeight: isMain ? 'bold' : '500' }
    ]}>
      {value}
    </Text>
    <Text style={enhancedStyles.statLabel}>{label}</Text>
  </View>
);

// 2. Card View Component
const WeeklySalesCard = ({ weekLabel, numberOfBills, totalSales }) => (
  <View style={enhancedStyles.card}>
    <View style={enhancedStyles.cardHeader}>
      <Ionicons name="stats-chart-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
      <Text style={enhancedStyles.cardDate}>{weekLabel}</Text>
    </View>
    <View style={enhancedStyles.cardBody}>
      <SalesStat label="Bills" value={numberOfBills.toLocaleString()} icon="receipt-outline" color={COLORS.lightText} />
      <SalesStat 
        label="Weekly Sales" 
        value={`₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
        icon="wallet-outline" 
        color={COLORS.success} 
        isMain={true} 
      />
    </View>
  </View>
);

// 3. Table View Component
const TableListView = ({ data }) => (
    <View style={enhancedStyles.tableContainer}>
        {/* Table Header */}
        <View style={enhancedStyles.tableHeaderRow}>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 3, textAlign: 'left' }]}>Week</Text>
            <Text style={enhancedStyles.tableCellHeader}>Bills</Text>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Sales</Text>
        </View>

        {/* Table Rows */}
        <FlatList
            data={data}
            keyExtractor={(item) => item.weekLabel}
            renderItem={({ item, index }) => (
                <View style={[enhancedStyles.tableRow, index % 2 === 0 ? enhancedStyles.evenRow : enhancedStyles.oddRow]}>
                    <Text style={[enhancedStyles.tableCell, { flex: 3, textAlign: 'left', fontWeight: 'bold' }]}>{item.weekLabel}</Text>
                    <Text style={enhancedStyles.tableCell}>{item.numberOfBills.toLocaleString()}</Text>
                    <Text style={[enhancedStyles.tableCell, { flex: 2, color: COLORS.success, fontWeight: 'bold', textAlign: 'right' }]}>
                        ₹{item.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            )}
            ListEmptyComponent={() => (
                <View style={enhancedStyles.emptyContainer}>
                    <Text style={enhancedStyles.emptyText}>No weekly sales found for Table View.</Text>
                </View>
            )}
            contentContainerStyle={data.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : {}}
        />
    </View>
);


// --- Main Screen Component ---
export default function WeeklySalesScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  const [rawBills, setRawBills] = useState([]); // Store raw bills for memoization
  const [loading, setLoading] = useState(true);
  // State to manage the view: 'card' or 'table'
  const [viewMode, setViewMode] = useState('card'); 

  // Function to get the week number (ISO 8601 compliant or standard web)
  const getWeekNumber = (date) => {
    const d = new Date(date);
    // Copy date and set to nearest Thursday
    d.setDate(d.getDate() + 4 - (d.getDay() || 7)); 
    const yearStart = new Date(d.getFullYear(), 0, 1);
    // Calculate full weeks to determine week number
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  
  // --- Memoized Data Logic ---
  const groupedSales = useMemo(() => {
    const grouped = {};
    rawBills.forEach((bill) => {
      const date = new Date(bill.createdAt);
      
      const week = getWeekNumber(date);
      // Use YYYY-W# for consistent sorting
      const key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
      
      if (!grouped[key]) grouped[key] = { weekLabel: `Week ${week} (${date.getFullYear()})`, numberOfBills: 0, totalSales: 0, sortKey: key };
      grouped[key].numberOfBills += 1;
      grouped[key].totalSales += bill.grandTotal;
    });
    // Sort by sortKey in descending order (newest first)
    return Object.values(grouped).sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
  }, [rawBills]); // Re-calculate only when rawBills changes

  const totalGrandSales = useMemo(() => {
    return groupedSales.reduce((sum, item) => sum + item.totalSales, 0);
  }, [groupedSales]); 
  // --- End Memoized Data Logic ---


  const fetchBills = async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("https://billing-backend-sable.vercel.app/api/billing/list", {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      // Store the raw bills data
      if (res.ok && data.bills) setRawBills(data.bills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [isLoaded, isSignedIn]);

  if (loading) 
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <SafeAreaView style={enhancedStyles.container}>
      {/* Header and Controls */}
      <View style={enhancedStyles.pageHeader}>
        <Text style={enhancedStyles.title}>Weekly Sales Report 📅</Text>
        <Text style={enhancedStyles.subtitle}>
          All Time Sales: <Text style={enhancedStyles.totalSalesValue}>₹{totalGrandSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </Text>
        
        {/* Toggle and Refresh Buttons */}
        <View style={enhancedStyles.controlButtons}>
            {/* Refresh Button */}
            <TouchableOpacity onPress={fetchBills} style={enhancedStyles.controlButton}>
                <Ionicons name="refresh-circle-outline" size={30} color={COLORS.primary} />
            </TouchableOpacity>
            {/* View Toggle Button */}
            <TouchableOpacity 
                onPress={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} 
                style={enhancedStyles.controlButton}
            >
                <Ionicons 
                    name={viewMode === 'card' ? "list-outline" : "grid-outline"} 
                    size={26} 
                    color={COLORS.primary} 
                />
            </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'card' ? (
        <FlatList
          data={groupedSales}
          keyExtractor={(item) => item.sortKey}
          renderItem={({ item }) => (
            <WeeklySalesCard
              weekLabel={item.weekLabel}
              numberOfBills={item.numberOfBills}
              totalSales={item.totalSales}
            />
          )}
          ListEmptyComponent={() => (
            <View style={enhancedStyles.emptyContainer}>
              <Ionicons name="close-circle-outline" size={50} color={COLORS.lightText} />
              <Text style={enhancedStyles.emptyText}>No weekly sales records found yet.</Text>
            </View>
          )}
          contentContainerStyle={groupedSales.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : {}}
        />
      ) : (
        <TableListView data={groupedSales} />
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
    paddingBottom: 50, // Extra space for floating buttons
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginBottom: 10,
  },
  title: {
    fontSize: FONT_SIZE.heading,
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
  controlButton: {
    marginLeft: 10,
    padding: 5,
  },
  // Card Styling 
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
  // --- Table Styles ---
  tableContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    marginHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    overflow: 'hidden',
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
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: COLORS.card,
  },
  oddRow: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    flex: 2,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  }
});