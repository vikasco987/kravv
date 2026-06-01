import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { rf, s, vs } from '../../utils/responsive';

const screenWidth = Dimensions.get("window").width;

interface PremiumSalesChartProps {
  bills: any[];
}

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

export default function PremiumSalesChart({ bills }: PremiumSalesChartProps) {
  const [selectedTab, setSelectedTab] = useState('month');

  const { data, prevData, chartData, orders, avgTicket, peak } = useMemo(() => {
    if (!bills) return { data: 0, prevData: 0, chartData: [0], orders: 0, avgTicket: 0, peak: '-' };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Prev periods
    const prevYesterdayStart = new Date(yesterdayStart);
    prevYesterdayStart.setDate(prevYesterdayStart.getDate() - 1);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let currentBills = [];
    let prevBills = [];

    if (selectedTab === 'today') {
      currentBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= todayStart);
      prevBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= yesterdayStart && new Date(b.createdAt || b.date) < todayStart);
    } else if (selectedTab === 'yesterday') {
      currentBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= yesterdayStart && new Date(b.createdAt || b.date) < todayStart);
      prevBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= prevYesterdayStart && new Date(b.createdAt || b.date) < yesterdayStart);
    } else if (selectedTab === 'week') {
      currentBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= weekStart);
      prevBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= prevWeekStart && new Date(b.createdAt || b.date) < weekStart);
    } else if (selectedTab === 'month') {
      currentBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= monthStart);
      prevBills = bills.filter(b => !b.isHeld && new Date(b.createdAt || b.date) >= prevMonthStart && new Date(b.createdAt || b.date) < monthStart);
    }

    const currentRevenue = currentBills.reduce((sum, b) => sum + (b.total || 0), 0);
    const prevRevenue = prevBills.reduce((sum, b) => sum + (b.total || 0), 0);
    const ordersCount = currentBills.length;
    const avgT = ordersCount > 0 ? currentRevenue / ordersCount : 0;

    // Chart Data & Peak calculation
    let cData = [0];
    let peakLabel = '-';

    if (selectedTab === 'today' || selectedTab === 'yesterday') {
      const hourMap: Record<number, number> = {};
      currentBills.forEach(b => {
        const h = new Date(b.createdAt || b.date).getHours();
        hourMap[h] = (hourMap[h] || 0) + (b.total || 0);
      });
      // create array for hours 0-23
      cData = Array.from({ length: 24 }, (_, i) => hourMap[i] || 0);

      let maxRev = 0;
      let peakH = 0;
      Object.entries(hourMap).forEach(([h, rev]) => {
        if (rev > maxRev) { maxRev = rev; peakH = Number(h); }
      });
      if (maxRev > 0) {
        peakLabel = `${peakH % 12 || 12} ${peakH >= 12 ? 'PM' : 'AM'}`;
      }
    } else if (selectedTab === 'week') {
      // last 7 days
      const dayMap: Record<string, number> = {};
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push(d.toDateString());
        dayMap[d.toDateString()] = 0;
      }
      currentBills.forEach(b => {
        const dStr = new Date(b.createdAt || b.date).toDateString();
        if (dayMap[dStr] !== undefined) dayMap[dStr] += (b.total || 0);
      });
      cData = days.map(d => dayMap[d]);

      let maxRev = 0;
      Object.entries(dayMap).forEach(([d, rev]) => {
        if (rev > maxRev) { maxRev = rev; peakLabel = new Date(d).toLocaleDateString('en-US', { weekday: 'short' }); }
      });
    } else {
      // month -> group by day of month
      const dayMap: Record<number, number> = {};
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) dayMap[i] = 0;

      currentBills.forEach(b => {
        const dt = new Date(b.createdAt || b.date);
        if (dt.getMonth() === now.getMonth()) {
          dayMap[dt.getDate()] += (b.total || 0);
        }
      });
      cData = Object.values(dayMap);

      let maxRev = 0;
      Object.entries(dayMap).forEach(([d, rev]) => {
        if (rev > maxRev) {
          maxRev = rev;
          peakLabel = `${d}th`;
        }
      });
    }

    if (cData.every(v => v === 0)) cData = [0, 0, 0];
    if (cData.length === 1) cData.unshift(0);

    return {
      data: currentRevenue,
      prevData: prevRevenue,
      chartData: cData,
      orders: ordersCount,
      avgTicket: avgT,
      peak: peakLabel
    };
  }, [bills, selectedTab]);

  const growth = prevData === 0 ? (data > 0 ? 100 : 0) : ((data - prevData) / prevData) * 100;
  const isPositive = growth >= 0;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
          const isActive = selectedTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Blue Card */}
      <View style={styles.blueCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardSubtitle}>
            {TABS.find(t => t.id === selectedTab)?.label.toUpperCase()} · SALES
          </Text>
          <Text style={styles.cardTitle}>₹{data.toLocaleString('en-IN')}</Text>

          <View style={styles.growthRow}>
            <Ionicons name={isPositive ? "arrow-up" : "arrow-down"} size={12} color={isPositive ? "#4ADE80" : "#F87171"} />
            <Text style={[styles.growthText, { color: isPositive ? "#4ADE80" : "#F87171" }]}>
              {Math.abs(growth).toFixed(1)}% vs previous
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: chartData.map(() => ""), // Hide labels but keep array length same as data
              datasets: [{ data: chartData }]
            }}
            width={screenWidth - s(8)}
            height={120}
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
            chartConfig={{
              backgroundColor: "#223577",
              backgroundGradientFrom: "#223577",
              backgroundGradientTo: "#223577",
              color: (opacity = 1) => `rgba(252, 211, 77, ${opacity})`,
              strokeWidth: 2.5,
              fillShadowGradientFrom: "#FCD34D",
              fillShadowGradientTo: "#223577",
              fillShadowGradientFromOpacity: 0.2,
              fillShadowGradientToOpacity: 0.0,
              propsForBackgroundLines: { strokeWidth: 0 },
            }}
            bezier
            style={{ paddingRight: 0, paddingLeft: 0, paddingTop: 10, paddingBottom: 0, margin: 0 }}
          />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Orders</Text>
            <Text style={styles.footerValue}>{orders}</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Avg ticket</Text>
            <Text style={styles.footerValue}>₹{Math.round(avgTicket).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Peak</Text>
            <Text style={styles.footerValue}>{peak}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: s(4),
    paddingTop: vs(20),
    paddingBottom: vs(10),
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(16),
    backgroundColor: '#fff',
    borderRadius: s(12),
    padding: s(4),
  },
  tab: {
    flex: 1,
    paddingVertical: vs(8),
    alignItems: 'center',
    borderRadius: s(8),
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#223577', // Deep blue
  },
  tabText: {
    fontSize: rf(11),
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  blueCard: {
    backgroundColor: '#223577', // Deep blue matching screenshot
    borderRadius: s(16),
    overflow: 'hidden',
  },
  cardHeader: {
    padding: s(20),
    paddingBottom: 0,
  },
  cardSubtitle: {
    color: '#93C5FD', // Light blue text
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: vs(4),
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: rf(32),
    fontWeight: '900',
    marginBottom: vs(4),
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  growthText: {
    fontSize: rf(10),
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: vs(10),
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: s(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerCol: {
    flex: 1,
  },
  footerLabel: {
    color: '#93C5FD',
    fontSize: rf(9),
    fontWeight: '600',
    marginBottom: vs(4),
  },
  footerValue: {
    color: '#FFFFFF',
    fontSize: rf(14),
    fontWeight: 'bold',
  }
});
