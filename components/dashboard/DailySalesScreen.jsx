import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
import { applyTrueBillTotals } from "../../utils/billCalculator";
import DetailedBillListView from "./DetailedBillListView";

const COLORS = {
  primary: '#007AFF',
  background: '#F9F9F9',
  card: '#FFFFFF',
  text: '#333333',
  lightText: '#666666',
  borderColor: '#E0E0E0',
  success: '#34C759',
};

const SalesCard = ({ date, numberOfBills, totalSales, t }) => (

  <View style={enhancedStyles.card}>
    <View style={enhancedStyles.cardHeader}>
      <Ionicons name="calendar-outline" size={rf(20)} color={COLORS.primary} style={{ marginRight: s(8) }} />
      <Text style={enhancedStyles.cardDate}>{date}</Text>
    </View>
    <View style={enhancedStyles.cardBody}>
      <SalesStat label={t('bills') || "Bills"} value={numberOfBills} icon="receipt-outline" color={COLORS.lightText} />
      <SalesStat label={t('total_sales_label') || "Total Sales"} value={`₹${totalSales.toLocaleString('en-IN')}`} icon="wallet-outline" color={COLORS.success} isMain={true} />
    </View>
  </View>
);

const SalesStat = ({ label, value, icon, color, isMain = false }) => (

  <View style={enhancedStyles.statContainer}>
    <Ionicons name={icon} size={isMain ? rf(24) : rf(18)} color={color} />
    <Text style={[enhancedStyles.statValue, { color: isMain ? COLORS.text : COLORS.lightText, fontWeight: isMain ? 'bold' : '500' }]}>{value}</Text>
    <Text style={enhancedStyles.statLabel}>{label}</Text>
  </View>
);

const TableListView = ({ data, refreshing, onRefresh, t, onRowPress }) => (

  <View style={enhancedStyles.tableContainer}>
    <View style={enhancedStyles.tableHeaderRow}>
      <Text style={[enhancedStyles.tableCellHeader, { flex: 3 }]}>{t('date') || 'Date'}</Text>
      <Text style={enhancedStyles.tableCellHeader}>{t('bills') || 'Bills'}</Text>
      <Text style={[enhancedStyles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>{t('sales') || 'Sales'}</Text>
    </View>
    <FlatList
      data={data}
      keyExtractor={(item) => item.id || item.date}

      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      renderItem={({ item }) => (
        <TouchableOpacity style={enhancedStyles.tableRow} onPress={() => onRowPress && onRowPress(item.id)}>
          <Text style={[enhancedStyles.tableCell, { flex: 3 }]}>{item.date}</Text>
          <Text style={enhancedStyles.tableCell}>{item.numberOfBills}</Text>
          <Text style={[enhancedStyles.tableCell, { flex: 2, color: COLORS.success, fontWeight: 'bold', textAlign: 'right' }]}>
            ₹{item.totalSales.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <View style={enhancedStyles.emptyContainer}>
          <Text style={enhancedStyles.emptyText}>{t('no_sales_found_table') || 'No sales found for Table View.'}</Text>
        </View>
      )}
    />
  </View>
);

export default function DailySalesScreen({ onBack, allBills }) {

  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  const { refreshSignal, triggerRefresh } = useRefresh();
  const { t } = useLanguage();

  const [dailySales, setDailySales] = useState([]);
  const [rawBillsList, setRawBillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [selectedDateReport, setSelectedDateReport] = useState(null);

  // @ts-ignore
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

  useEffect(() => {
    if (allBills && allBills.length > 0) {
      setRawBillsList(allBills);
      setDailySales(groupSalesByDate(allBills.filter((b) => b.isHeld !== true)));
      setLoading(false);
    } else {
      fetchBills();
    }
  }, [allBills, isLoaded, isSignedIn, user]);

  const fetchBills = async (silent = false) => {
    if (!isLoaded) return;
    if (allBills) return;

    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const authToken = await getToken();
      const sessionStr = await AsyncStorage.getItem('staff_session');
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      const finalToken = authToken || staffSession?.token;

      if (!finalToken && !bId) {
        setDailySales([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = bId ? `https://billing.kravy.in/api/bill-manager?businessId=${bId}` : "https://billing.kravy.in/api/bill-manager";
      const res = await fetch(url, {
        headers: { 
            Authorization: `Bearer ${finalToken}`,
            Cookie: `staff_token=${finalToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const billsList = Array.isArray(data) ? data : (data.bills || []);
        await applyTrueBillTotals(billsList);
        setRawBillsList(billsList);
        setDailySales(groupSalesByDate(billsList.filter((b) => b.isHeld !== true)));
      }
    } catch (err) {
      const errorMsg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      console.warn("DailySales Fetch Error:", errorMsg);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchBills(true);
    }
  }, [refreshSignal]);

  if (selectedDateReport) {
    return (
      <DetailedBillListView 
        onBack={() => setSelectedDateReport(null)} 
        allBills={rawBillsList} 
        filterType="daily" 
        filterKey={selectedDateReport} 
        title={`Bills for ${new Date(selectedDateReport).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric'})}`}
      />
    );
  }

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <SafeAreaView style={enhancedStyles.container}>
      <View style={enhancedStyles.pageHeader}>
        <View style={enhancedStyles.headerTopRow}>
          <TouchableOpacity onPress={handleBack} style={enhancedStyles.backButton}>
            <Ionicons name="arrow-back" size={rf(24)} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={enhancedStyles.title}>{t('daily_sales_report') || 'Daily Sales Report'} 📈</Text>
          <TouchableOpacity onPress={triggerRefresh} style={enhancedStyles.reloadButton}>
            <Ionicons name="refresh" size={rf(26)} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={enhancedStyles.subtitle}>
          {t('all_time_sales') || 'All Time Sales'}: <Text style={enhancedStyles.totalSalesValue}>₹{totalGrandSales.toLocaleString('en-IN')}</Text>
        </Text>

        <View style={enhancedStyles.controlButtons}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} style={enhancedStyles.modeButton}>
            <Ionicons name={viewMode === 'card' ? "list-outline" : "grid-outline"} size={rf(22)} color={COLORS.primary} />
            <Text style={enhancedStyles.modeText}>{viewMode === 'card' ? (t('table_view') || 'Table View') : (t('card_view') || 'Card View')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: vs(10) }}>
        {viewMode === 'card' ? (
          <FlatList
            data={dailySales}
            keyExtractor={(item) => item.id || item.date}

            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBills(true)} colors={[COLORS.primary]} />}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedDateReport(item.id)} activeOpacity={0.8}>
                <SalesCard
                  date={item.date}
                  numberOfBills={item.numberOfBills}
                  totalSales={item.totalSales}
                  t={t}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={enhancedStyles.emptyContainer}>
                <Ionicons name="close-circle-outline" size={rf(50)} color={COLORS.lightText} />
                <Text style={enhancedStyles.emptyText}>{t('no_sales_records') || 'No sales records found yet.'}</Text>
              </View>
            )}
          />
        ) : (
          <TableListView data={dailySales} refreshing={refreshing} onRefresh={() => fetchBills(true)} t={t} onRowPress={(id) => setSelectedDateReport(id)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const enhancedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageHeader: { padding: s(16), backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, elevation: 2, paddingTop: vs(40) },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(12) },
  backButton: { padding: s(4) },
  reloadButton: { padding: s(4) },
  title: { fontSize: rf(20), fontWeight: 'bold', color: COLORS.text, flex: 1, textAlign: 'center' },
  subtitle: { fontSize: rf(16), color: COLORS.lightText, textAlign: 'center', marginBottom: vs(15) },
  totalSalesValue: { fontWeight: 'bold', color: COLORS.success },
  controlButtons: { flexDirection: 'row', justifyContent: 'center' },
  modeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingVertical: vs(8), paddingHorizontal: s(16), borderRadius: s(20), borderWidth: 1, borderColor: '#D0E7FF' },
  modeText: { marginLeft: s(8), color: COLORS.primary, fontWeight: '600', fontSize: rf(14) },
  card: { backgroundColor: COLORS.card, marginHorizontal: s(16), marginVertical: vs(8), borderRadius: s(12), padding: s(16), elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: vs(10), marginBottom: vs(12) },
  cardDate: { fontSize: rf(16), fontWeight: '600', color: COLORS.text },
  cardBody: { flexDirection: 'row', justifyContent: 'space-around' },
  statContainer: { alignItems: 'center' },
  statValue: { fontSize: rf(18), marginTop: vs(4) },
  statLabel: { fontSize: rf(11), color: '#999', marginTop: vs(2), textTransform: 'uppercase' },
  tableContainer: { flex: 1, backgroundColor: COLORS.card, margin: s(16), borderRadius: s(12), overflow: 'hidden', elevation: 2 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: s(12), borderBottomWidth: 1, borderBottomColor: COLORS.borderColor },
  tableCellHeader: { fontWeight: 'bold', color: COLORS.lightText, fontSize: rf(13), textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: s(12), borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  tableCell: { fontSize: rf(14), color: COLORS.text },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: vs(100) },
  emptyText: { marginTop: vs(12), fontSize: rf(16), color: COLORS.lightText },
});
