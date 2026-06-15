import DateTimePicker from '@react-native-community/datetimepicker';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear
} from "date-fns";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Scale, ShoppingCart, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { rf, s, vs } from '../../utils/responsive';
import { fetchBills, fetchExpenses } from './ExpensesAPI';

const { width } = Dimensions.get('window');

type FilterMode = 'Day' | 'Week' | 'Month' | 'Year' | 'Custom';

interface ExpensePnLProps {
  onBack: () => void;
}

export default function ExpensePnL({ onBack }: ExpensePnLProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customRange, setCustomRange] = useState({ start: new Date(), end: new Date() });
  const [showPicker, setShowPicker] = useState<{ visible: boolean, mode: 'start' | 'end' | 'single' }>({ visible: false, mode: 'single' });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const expRes = await fetchExpenses();
      const billsRes = await fetchBills();
      setExpenses(expRes);
      setOrders(billsRes.bills || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const range = useMemo(() => {
    if (filterMode === 'Day') return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
    if (filterMode === 'Week') return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
    if (filterMode === 'Month') return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    if (filterMode === 'Year') return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    return { start: startOfDay(customRange.start), end: endOfDay(customRange.end) };
  }, [filterMode, currentDate, customRange]);

  const { filteredExpenses, filteredOrders } = useMemo(() => {
    return {
      filteredExpenses: expenses.filter(e => {
        const d = new Date(e.date);
        return d >= range.start && d <= range.end;
      }),
      filteredOrders: orders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= range.start && d <= range.end;
      })
    };
  }, [expenses, orders, range]);

  const totalSales = filteredOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const navigate = (direction: 'prev' | 'next') => {
    if (filterMode === 'Custom') return;
    const factor = direction === 'next' ? 1 : -1;
    if (filterMode === 'Day') setCurrentDate(addDays(currentDate, factor));
    if (filterMode === 'Week') setCurrentDate(addWeeks(currentDate, factor));
    if (filterMode === 'Month') setCurrentDate(addMonths(currentDate, factor));
    if (filterMode === 'Year') setCurrentDate(addYears(currentDate, factor));
  };

  const trendData = useMemo(() => {
    if (filterMode === 'Day') {
      const tableData = [{ name: 'Today', sales: totalSales, expenses: totalExpenses, profit: totalSales - totalExpenses }];
      return { labels: ['Today'], sales: [totalSales], expenses: [totalExpenses], tableData };
    }

    let intervals: Date[] = [];
    if (filterMode === 'Week' || filterMode === 'Month' || filterMode === 'Custom') {
      intervals = eachDayOfInterval({ start: range.start, end: range.end });
      if (intervals.length > 31) {
        intervals = eachMonthOfInterval({ start: range.start, end: range.end });
      }
    } else if (filterMode === 'Year') {
      intervals = eachMonthOfInterval({ start: range.start, end: range.end });
    }

    if (intervals.length === 0) {
      return { labels: ['No Data'], sales: [0], expenses: [0], tableData: [] };
    }

    const labels = intervals.map((interval, i) => {
      const showLabel = i % Math.ceil(intervals.length / 6) === 0 || i === intervals.length - 1;
      return showLabel ? format(interval, intervals.length > 31 || filterMode === 'Year' ? "MMM" : "dd") : "";
    });

    const salesData = intervals.map(interval => {
      return orders
        .filter(ord => {
          const d = new Date(ord.createdAt);
          return (intervals.length > 31 || filterMode === 'Year') ? isSameMonth(d, interval) : isSameDay(d, interval);
        })
        .reduce((acc, curr) => acc + (curr.total || 0), 0);
    });

    const expData = intervals.map(interval => {
      return expenses
        .filter(e => {
          const d = new Date(e.date);
          return (intervals.length > 31 || filterMode === 'Year') ? isSameMonth(d, interval) : isSameDay(d, interval);
        })
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    });

    const tableData = intervals.map((interval, i) => ({
      name: format(interval, intervals.length > 31 || filterMode === 'Year' ? "MMM yyyy" : "dd MMM"),
      sales: salesData[i],
      expenses: expData[i],
      profit: salesData[i] - expData[i]
    }));

    return {
      labels,
      sales: salesData.length > 0 ? salesData : [0],
      expenses: expData.length > 0 ? expData : [0],
      tableData
    };
  }, [expenses, orders, range, filterMode, totalSales, totalExpenses]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker({ ...showPicker, visible: false });
    if (selectedDate) {
      if (showPicker.mode === 'single') {
        setCurrentDate(selectedDate);
      } else if (showPicker.mode === 'start') {
        setCustomRange(prev => ({ ...prev, start: selectedDate }));
      } else if (showPicker.mode === 'end') {
        setCustomRange(prev => ({ ...prev, end: selectedDate }));
      }
    }
  };

  const exportToCSV = async () => {
    try {
      const headerRow = "Time Interval,Gross Sales,Expenses,Net Profit,Efficiency\n";
      const rows = trendData.tableData.slice().reverse().map(row => {
        const eff = row.sales > 0 ? ((row.profit / row.sales) * 100).toFixed(0) : 0;
        return `${row.name},${row.sales},${row.expenses},${row.profit},${eff}%`;
      }).join('\n');
      const csv = headerRow + rows;
      const docDir = FileSystem.documentDirectory;
      if (!docDir) {
        console.log('Document directory is not available');
        return;
      }

      const fileUri = docDir + `Kravv_PnL_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export P&L Statement'
        });
      }
    } catch (e) {
      console.log('Error exporting CSV:', e);
    }
  };

  const ITEM_WIDTH = s(100);
  const chartWidth = Math.max(width - s(70), trendData.labels.length * ITEM_WIDTH);
  const dynamicBarWidth = s(30);
  const dynamicGap = s(6);

  // Custom Grouped Bar Chart calculations
  const maxBarValue = Math.max(...trendData.sales, ...trendData.expenses, 1);
  const CHART_HEIGHT = vs(180);
  const yAxisLabels = [maxBarValue, maxBarValue * 0.75, maxBarValue * 0.5, maxBarValue * 0.25, 0].map(v => Math.round(v));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={rf(20)} color="#64748B" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>Analytics</Text>
            <ChevronRight size={rf(10)} color="#94A3B8" />
            <Text style={[styles.breadcrumbText, { color: '#10B981' }]}>P&L Statement</Text>
          </View>
          <Text style={styles.title}>Financial Performance</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
          <Download size={rf(12)} color="#FFFFFF" />
          <Text style={styles.exportBtnText}>CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['Day', 'Week', 'Month', 'Year', 'Custom'] as FilterMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.filterBtn, filterMode === m && styles.filterBtnActive]}
              onPress={() => setFilterMode(m)}
            >
              <Text style={[styles.filterBtnText, filterMode === m && styles.filterBtnTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.dateNavRow}>
        {filterMode !== 'Custom' && (
          <TouchableOpacity onPress={() => navigate('prev')} style={styles.dateNavBtn}>
            <ChevronLeft size={rf(18)} color="#64748B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dateDisplay}
          onPress={() => {
            if (filterMode === 'Custom') setShowPicker({ visible: true, mode: 'start' });
            else setShowPicker({ visible: true, mode: 'single' });
          }}
        >
          <CalendarIcon size={rf(12)} color="#94A3B8" />
          <Text style={styles.dateDisplayText}>
            {filterMode === 'Day' && format(currentDate, "dd MMM yyyy")}
            {filterMode === 'Week' && `${format(range.start, "dd MMM")} - ${format(range.end, "dd MMM")}`}
            {filterMode === 'Month' && format(currentDate, "MMMM yyyy")}
            {filterMode === 'Year' && format(currentDate, "yyyy")}
            {filterMode === 'Custom' && `${format(customRange.start, "dd MMM")} - ${format(customRange.end, "dd MMM")}`}
          </Text>
        </TouchableOpacity>

        {filterMode === 'Custom' && (
          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => setShowPicker({ visible: true, mode: 'end' })}
          >
            <CalendarIcon size={rf(12)} color="#94A3B8" />
            <Text style={styles.dateDisplayText}>End: {format(customRange.end, "dd MMM")}</Text>
          </TouchableOpacity>
        )}

        {filterMode !== 'Custom' && (
          <TouchableOpacity onPress={() => navigate('next')} style={styles.dateNavBtn}>
            <ChevronRight size={rf(18)} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {showPicker.visible && (
        <DateTimePicker
          value={showPicker.mode === 'single' ? currentDate : showPicker.mode === 'start' ? customRange.start : customRange.end}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
              <ShoppingCart size={rf(16)} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Gross Sales</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>₹{totalSales.toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
              <Wallet size={rf(16)} color="#F43F5E" />
            </View>
            <Text style={styles.statLabel}>Operational Costs</Text>
            <Text style={[styles.statValue, { color: '#F43F5E' }]}>₹{totalExpenses.toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: netProfit >= 0 ? '#E0E7FF' : '#FFE4E6' }]}>
              {netProfit >= 0 ? <TrendingUp size={rf(16)} color="#6366F1" /> : <TrendingDown size={rf(16)} color="#F43F5E" />}
            </View>
            <Text style={styles.statLabel}>Net Profit</Text>
            <Text style={[styles.statValue, { color: netProfit >= 0 ? '#6366F1' : '#F43F5E' }]}>₹{netProfit.toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Scale size={rf(16)} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Profit Margin</Text>
            <Text style={[styles.statValue, { color: '#0F172A' }]}>{profitMargin.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Graph 1: Custom Side-by-Side Bar Chart (Matching Web Recharts) */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Sales vs Expenses</Text>
              <Text style={styles.chartSubtitle}>Comparison of inflows and outflows</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: s(10) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(4) }}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>Sales</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(4) }}><View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} /><Text style={styles.legendText}>Expenses</Text></View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', height: CHART_HEIGHT + vs(30), marginTop: vs(10) }}>
            {/* Y-Axis */}
            <View style={{ width: s(40), justifyContent: 'space-between', paddingBottom: vs(30) }}>
              {yAxisLabels.map((v, i) => (
                <Text key={`y-${i}`} style={{ fontSize: rf(8), fontWeight: '700', color: '#94A3B8', textAlign: 'right', paddingRight: s(5) }}>
                  {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                </Text>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ height: CHART_HEIGHT + vs(30), width: chartWidth, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: s(10) }}>
                {/* Grid Lines */}
                <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingBottom: vs(30) }}>
                  {[1, 2, 3, 4, 5].map(i => <View key={`grid-${i}`} style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderStyle: 'dashed' }} />)}
                </View>

                {/* Bars */}
                {trendData.labels.map((label, i) => {
                  const salesH = maxBarValue > 0 ? (trendData.sales[i] / maxBarValue) * CHART_HEIGHT : 0;
                  const expH = maxBarValue > 0 ? (trendData.expenses[i] / maxBarValue) * CHART_HEIGHT : 0;
                  return (
                    <View key={`bar-${i}`} style={{ alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT, flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: dynamicGap }}>
                        <View style={{ width: dynamicBarWidth, height: Math.max(salesH, 2), backgroundColor: '#10B981', borderTopLeftRadius: s(3), borderTopRightRadius: s(3) }} />
                        <View style={{ width: dynamicBarWidth, height: Math.max(expH, 2), backgroundColor: '#F43F5E', borderTopLeftRadius: s(3), borderTopRightRadius: s(3) }} />
                      </View>
                      <View style={{ position: 'absolute', bottom: -vs(20), width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: rf(9), fontWeight: '700', color: '#94A3B8', textAlign: 'center' }} numberOfLines={1}>{label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Graph 2: Profitability Curve */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Profitability Curve</Text>
          <Text style={styles.chartSubtitle}>Net income trend line</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: trendData.labels,
                datasets: [
                  {
                    data: trendData.sales.map((s, i) => s - trendData.expenses[i]),
                    color: (opacity = 1) => netProfit >= 0 ? `rgba(16, 185, 129, ${opacity})` : `rgba(244, 63, 94, ${opacity})`,
                    strokeWidth: 10,
                  }
                ]
              }}
              width={chartWidth}
              height={vs(240)}
              yAxisLabel="₹"
              yAxisSuffix=""
              withShadow={true}
              withInnerLines={true}
              withOuterLines={false}
              withDots={false}
              fromZero={false}
              chartConfig={{
                backgroundColor: "#FFFFFF",
                backgroundGradientFrom: "#FFFFFF",
                backgroundGradientTo: "#FFFFFF",
                color: (opacity = 1) => `rgba(241, 245, 249, 1)`,
                labelColor: (opacity = 1) => `#94A3B8`,
                fillShadowGradientFrom: netProfit >= 0 ? "#10B981" : "#F43F5E",
                fillShadowGradientFromOpacity: 0.2,
                fillShadowGradientTo: netProfit >= 0 ? "#10B981" : "#F43F5E",
                fillShadowGradientToOpacity: 0,
                strokeWidth: 10,
                useShadowColorFromDataset: false,
                decimalPlaces: 0,
                propsForBackgroundLines: {
                  strokeDasharray: "3 3",
                  stroke: "rgba(0,0,0,0.05)"
                },
                propsForLabels: {
                  fontSize: 9,
                  fontWeight: '700'
                }
              }}
              bezier
              style={{ borderRadius: s(16), marginLeft: -s(15) }}
            />
          </ScrollView>
        </View>

        {/* Performance Breakdown Table */}
        <View style={styles.tableCard}>
          <Text style={styles.chartTitle}>Performance Breakdown</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: s(130), paddingRight: s(15) }]}>Time Interval</Text>
                <Text style={[styles.tableHeaderCell, { width: s(110), textAlign: 'right', paddingRight: s(15) }]}>Gross Sales</Text>
                <Text style={[styles.tableHeaderCell, { width: s(110), textAlign: 'right', paddingRight: s(15) }]}>Expenses</Text>
                <Text style={[styles.tableHeaderCell, { width: s(110), textAlign: 'right', paddingRight: s(15) }]}>Net Profit</Text>
                <Text style={[styles.tableHeaderCell, { width: s(90), textAlign: 'center' }]}>Efficiency</Text>
              </View>

              {/* Table Body */}
              {trendData.tableData.slice().reverse().map((row, index) => {
                const eff = row.sales > 0 ? ((row.profit / row.sales) * 100).toFixed(0) : 0;
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellBold, { width: s(130), paddingRight: s(15) }]}>{row.name}</Text>
                    <Text style={[styles.tableCell, { width: s(110), textAlign: 'right', paddingRight: s(15), color: '#10B981', fontWeight: '900' }]}>₹{row.sales.toLocaleString()}</Text>
                    <Text style={[styles.tableCell, { width: s(110), textAlign: 'right', paddingRight: s(15), color: '#F43F5E', fontWeight: '900' }]}>₹{row.expenses.toLocaleString()}</Text>
                    <Text style={[styles.tableCell, { width: s(110), textAlign: 'right', paddingRight: s(15), color: row.profit >= 0 ? '#6366F1' : '#F43F5E', fontWeight: '900' }]}>₹{row.profit.toLocaleString()}</Text>
                    <View style={{ width: s(90), alignItems: 'center' }}>
                      <View style={[styles.effBadge, { backgroundColor: row.profit >= 0 ? '#D1FAE5' : '#FFE4E6' }]}>
                        <Text style={[styles.effBadgeText, { color: row.profit >= 0 ? '#10B981' : '#F43F5E' }]}>{eff}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {trendData.tableData.length === 0 && (
                <View style={{ padding: s(20), alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8', fontSize: rf(12), fontWeight: '800' }}>No Data Available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: s(20), paddingTop: vs(50), backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: s(40), height: s(40), borderRadius: s(12), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: s(15) },
  headerTextContainer: { flex: 1 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginBottom: vs(2) },
  breadcrumbText: { fontSize: rf(10), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: rf(20), fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: s(12), height: vs(32), borderRadius: s(10), gap: s(5), shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  exportBtnText: { color: '#FFFFFF', fontSize: rf(9), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  filterRow: { backgroundColor: '#FFFFFF', paddingTop: vs(10), paddingBottom: vs(10) },
  filterScroll: { paddingHorizontal: s(20), gap: s(10) },
  filterBtn: { paddingHorizontal: s(20), height: vs(36), borderRadius: s(12), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  filterBtnText: { fontSize: rf(11), fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  filterBtnTextActive: { color: '#FFFFFF' },
  dateNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(10), backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: s(10) },
  dateNavBtn: { width: s(36), height: s(36), borderRadius: s(10), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: s(15), height: vs(36), borderRadius: s(10), gap: s(8) },
  dateDisplayText: { fontSize: rf(12), fontWeight: '800', color: '#0F172A' },
  content: { padding: s(20) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: s(15), marginBottom: vs(25) },
  statCard: { width: (width - s(55)) / 2, backgroundColor: '#FFFFFF', padding: s(15), borderRadius: s(20), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconBox: { width: s(36), height: s(36), borderRadius: s(12), justifyContent: 'center', alignItems: 'center', marginBottom: vs(10) },
  statLabel: { fontSize: rf(10), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: vs(4) },
  statValue: { fontSize: rf(18), fontWeight: '900', letterSpacing: -0.5 },
  chartCard: { backgroundColor: '#FFFFFF', padding: s(20), borderRadius: s(24), shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, marginBottom: vs(20) },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: vs(5) },
  legendDot: { width: s(8), height: s(8), borderRadius: s(4) },
  legendText: { fontSize: rf(9), fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  chartTitle: { fontSize: rf(18), fontWeight: '900', color: '#0F172A' },
  chartSubtitle: { fontSize: rf(10), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: vs(2), marginBottom: vs(15) },
  tableCard: { backgroundColor: '#FFFFFF', padding: s(20), borderRadius: s(24), shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, marginBottom: vs(20) },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: vs(10), marginBottom: vs(10) },
  tableHeaderCell: { fontSize: rf(10), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  tableCell: { fontSize: rf(12), color: '#0F172A' },
  tableCellBold: { fontWeight: '800', color: '#64748B', textTransform: 'uppercase', fontSize: rf(10), letterSpacing: 1 },
  effBadge: { paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(8) },
  effBadgeText: { fontSize: rf(10), fontWeight: '900' }
});
