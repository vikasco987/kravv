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
import { ArrowLeft, BarChart3, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, History, TrendingDown, Zap } from 'lucide-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

import { rf, s, vs } from '../../utils/responsive';
import { fetchCategories, fetchExpenses } from './ExpensesAPI';

const { width } = Dimensions.get('window');

type FilterMode = 'Day' | 'Week' | 'Month' | 'Year' | 'Custom';

interface ExpenseReportsProps {
  onBack: () => void;
}

const ExpenseReports = forwardRef(({ onBack }: ExpenseReportsProps, ref) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customRange, setCustomRange] = useState({ start: new Date(), end: new Date() });
  const [showPicker, setShowPicker] = useState<{ visible: boolean, mode: 'start' | 'end' | 'single' }>({ visible: false, mode: 'single' });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useImperativeHandle(ref, () => ({
    handleBack: () => {
      if (showPicker.visible) {
        setShowPicker(prev => ({ ...prev, visible: false }));
        return true;
      }
      return false;
    }
  }));

  const loadData = async () => {
    try {
      const expRes = await fetchExpenses();
      const catRes = await fetchCategories();
      setExpenses(expRes);
      setCategories(catRes);
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

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= range.start && d <= range.end;
    });
  }, [expenses, range]);

  const totalAmount = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const navigate = (direction: 'prev' | 'next') => {
    if (filterMode === 'Custom') return;
    const factor = direction === 'next' ? 1 : -1;
    if (filterMode === 'Day') setCurrentDate(addDays(currentDate, factor));
    if (filterMode === 'Week') setCurrentDate(addWeeks(currentDate, factor));
    if (filterMode === 'Month') setCurrentDate(addMonths(currentDate, factor));
    if (filterMode === 'Year') setCurrentDate(addYears(currentDate, factor));
  };

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

  const chartData = useMemo(() => {
    const data = categories.map(cat => {
      const amount = filtered
        .filter(exp => exp.category === cat.name)
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
      return {
        name: cat.name,
        population: amount,
        color: cat.color || '#94A3B8',
        legendFontColor: '#64748B',
        legendFontSize: 12
      };
    }).filter(d => d.population > 0);
    return data.sort((a, b) => b.population - a.population);
  }, [categories, filtered]);

  const trendData = useMemo(() => {
    if (!filtered || filtered.length === 0) return { labels: [], amounts: [] };

    let intervals: Date[] = [];
    if (filterMode === 'Week' || filterMode === 'Month' || filterMode === 'Custom') {
      intervals = eachDayOfInterval({ start: range.start, end: range.end });
    } else if (filterMode === 'Year') {
      intervals = eachMonthOfInterval({ start: range.start, end: range.end });
    }

    if (intervals.length === 0) return { labels: [], amounts: [] };

    const labels = intervals.map(d => filterMode === 'Year' ? format(d, 'MMM') : format(d, 'dd MMM'));
    const amounts = intervals.map(d => {
      const expInInterval = filtered.filter(e => {
        const ed = new Date(e.date);
        return filterMode === 'Year' ? isSameMonth(ed, d) : isSameDay(ed, d);
      });
      return expInInterval.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    });

    return { labels, amounts };
  }, [filtered, filterMode, range]);

  const topCategory = chartData.length > 0 ? chartData[0] : null;

  const exportToCSV = async () => {
    try {
      const headerRow = "Category,Total Amount,Contribution (%)\n";
      const rows = chartData.map(cat => {
        const percentage = totalAmount > 0 ? ((cat.population / totalAmount) * 100) : 0;
        return `${cat.name},${cat.population},${percentage.toFixed(2)}%`;
      }).join('\n');
      const csv = headerRow + rows;

      const docDir = FileSystem.documentDirectory;
      if (!docDir) return;

      const fileUri = docDir + `Expense_Report_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Expense Report'
        });
      }
    } catch (e) {
      console.log('Error exporting CSV:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0F172A" />
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
            <Text style={[styles.breadcrumbText, { color: '#0F172A' }]}>Expense Reporting</Text>
          </View>
          <Text style={styles.title}>Expense Reporting</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
          <Download size={rf(14)} color="#FFFFFF" />
          <Text style={styles.exportBtnText}>Export CSV</Text>
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
            <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
              <TrendingDown size={rf(16)} color="#F43F5E" />
            </View>
            <Text style={styles.statLabel}>Total Outflow</Text>
            <Text style={[styles.statValue, { color: '#0F172A' }]}>₹{totalAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Zap size={rf(16)} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Top Category</Text>
            <Text style={[styles.statValue, { color: '#0F172A', fontSize: rf(14) }]} numberOfLines={1}>
              {topCategory?.name || "N/A"}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
              <History size={rf(16)} color="#6366F1" />
            </View>
            <Text style={styles.statLabel}>Records</Text>
            <Text style={[styles.statValue, { color: '#0F172A' }]}>{filtered.length}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
              <BarChart3 size={rf(16)} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Period Avg</Text>
            <Text style={[styles.statValue, { color: '#0F172A' }]}>
              ₹{filtered.length > 0 ? (totalAmount / filtered.length).toFixed(0) : "0"}
            </Text>
          </View>
        </View>

        {/* Spending Curve */}
        <View style={[styles.chartCard, { marginBottom: vs(20) }]}>
          <View style={{ marginBottom: vs(20) }}>
            <Text style={styles.chartTitle}>Spending Curve</Text>
            <Text style={styles.chartSubtitle}>Expense flow for the selected period</Text>
          </View>

          {filterMode === 'Day' ? (
            <View style={{ height: vs(200), justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontSize: rf(12), fontWeight: '800', textTransform: 'uppercase' }}>Single Day View</Text>
            </View>
          ) : trendData.labels.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: trendData.labels,
                  datasets: [{
                    data: trendData.amounts,
                    color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`,
                    strokeWidth: 6
                  }]
                }}
                width={Math.max(width - s(70), trendData.labels.length * s(80))}
                height={vs(200)}
                yAxisLabel="₹"
                yAxisSuffix=""
                withShadow={true}
                withInnerLines={true}
                withOuterLines={false}
                withDots={false}
                fromZero={true}
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  color: (opacity = 1) => `rgba(241, 245, 249, 1)`,
                  labelColor: (opacity = 1) => `#94A3B8`,
                  fillShadowGradientFrom: "#F43F5E",
                  fillShadowGradientFromOpacity: 0.2,
                  fillShadowGradientTo: "#F43F5E",
                  fillShadowGradientToOpacity: 0,
                  strokeWidth: 6,
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
          ) : (
            <View style={{ height: vs(200), justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontSize: rf(12), fontWeight: '800', textTransform: 'uppercase' }}>No Data</Text>
            </View>
          )}
        </View>

        <View style={styles.chartCard}>
          <View style={{ marginBottom: vs(20) }}>
            <Text style={styles.chartTitle}>Distribution</Text>
            <Text style={styles.chartSubtitle}>Share per Category</Text>
          </View>

          {chartData.length > 0 ? (
            <PieChart
              data={chartData}
              width={width - s(40)}
              height={vs(200)}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[0, 0]}
              absolute
            />
          ) : (
            <View style={{ height: vs(200), justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontSize: rf(12), fontWeight: '800', textTransform: 'uppercase' }}>No Data Available for {filterMode}</Text>
            </View>
          )}

          <View style={styles.breakdownList}>
            {chartData.map(cat => {
              const percentage = totalAmount > 0 ? ((cat.population / totalAmount) * 100) : 0;
              return (
                <View key={cat.name} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                      <View style={[styles.dot, { backgroundColor: cat.color }]} />
                      <Text style={styles.breakdownName}>{cat.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                      <Text style={styles.breakdownAmount}>₹{cat.population.toLocaleString()}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{percentage.toFixed(0)}%</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Intelligence */}
        <View style={[styles.chartCard, { marginBottom: vs(40), marginTop: vs(20) }]}>
          <View style={{ marginBottom: vs(20) }}>
            <Text style={styles.chartTitle}>Category Intelligence</Text>
            <Text style={styles.chartSubtitle}>Deep analysis of operational costs</Text>
          </View>
          <View style={{ gap: vs(15) }}>
            {categories.map((cat, idx) => {
              const amount = filtered.filter(exp => exp.category === cat.name).reduce((acc, curr) => acc + (curr.amount || 0), 0);
              const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
              return (
                <View key={cat.id || idx} style={{ padding: s(15), backgroundColor: '#F8FAFC', borderRadius: s(16), gap: vs(15) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
                      <View style={{ width: s(40), height: s(40), borderRadius: s(12), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                        <Zap size={rf(18)} color={cat.color || "#94A3B8"} />
                      </View>
                      <View>
                        <Text style={{ fontSize: rf(14), fontWeight: '900', color: '#0F172A' }}>{cat.name}</Text>
                        <Text style={{ fontSize: rf(9), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginTop: vs(2) }}>{percentage.toFixed(1)}% contribution</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: rf(16), fontWeight: '900', color: '#0F172A' }}>₹{amount.toLocaleString()}</Text>
                      <Text style={{ fontSize: rf(8), fontWeight: '900', color: '#F43F5E', textTransform: 'uppercase', marginTop: vs(2) }}>Outflow</Text>
                    </View>
                  </View>
                  <View style={{ height: vs(8), backgroundColor: '#E2E8F0', borderRadius: s(4), overflow: 'hidden' }}>
                    <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: cat.color || "#10B981", borderRadius: s(4) }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

export default ExpenseReports;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: s(20), paddingTop: vs(70), backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: s(40), height: s(40), borderRadius: s(12), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: s(15) },
  headerTextContainer: { flex: 1 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginBottom: vs(2) },
  breadcrumbText: { fontSize: rf(10), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: rf(20), fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: s(15), height: vs(36), borderRadius: s(12), gap: s(8) },
  exportBtnText: { color: '#FFFFFF', fontSize: rf(12), fontWeight: '800' },
  filterRow: { backgroundColor: '#FFFFFF', paddingTop: vs(10), paddingBottom: vs(10) },
  filterScroll: { paddingHorizontal: s(20), gap: s(10) },
  filterBtn: { paddingHorizontal: s(20), height: vs(36), borderRadius: s(12), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#0F172A', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
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
  chartCard: { backgroundColor: '#FFFFFF', padding: s(20), borderRadius: s(24), shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  chartTitle: { fontSize: rf(18), fontWeight: '900', color: '#0F172A' },
  chartSubtitle: { fontSize: rf(10), fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: vs(2) },
  breakdownList: { marginTop: vs(20), gap: vs(15) },
  breakdownItem: { backgroundColor: '#F8FAFC', padding: s(15), borderRadius: s(16) },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(10) },
  dot: { width: s(10), height: s(10), borderRadius: s(5) },
  breakdownName: { fontSize: rf(12), fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  breakdownAmount: { fontSize: rf(14), fontWeight: '900', color: '#0F172A' },
  badge: { backgroundColor: '#FFE4E6', paddingHorizontal: s(6), paddingVertical: vs(2), borderRadius: s(6) },
  badgeText: { color: '#F43F5E', fontSize: rf(10), fontWeight: '900' },
  progressBarBg: { height: vs(6), backgroundColor: '#E2E8F0', borderRadius: s(3), overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: s(3) }
});
