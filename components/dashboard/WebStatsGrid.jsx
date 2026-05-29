import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  Banknote,
  BarChart3,
  Clock,
  FileText,
  History,
  IndianRupee,
  Smartphone,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react-native';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

const screenWidth = Dimensions.get('window').width;

const WebStatsGrid = ({ data, range = 30 }) => {
  const totalRevenue = data.totalRevenue || 0;
  const growth = data.growth || 0;
  const isPositive = growth >= 0;

  const daySale = data.daySale || 0;
  const weekSale = data.weekSale || 0;
  const monthSale = data.monthSale || 0;
  const totalBills = data.totalBills || 0;
  const cash = data.paymentSplit?.Cash || 0;
  const upi = data.paymentSplit?.UPI || 0;

  const fmt = (n) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

  const rangeShort = range === 1 ? "Today" : range === 2 ? "Yesterday" : `${range} Days`;
  const rangeSub = range === 1 ? "today" : range === 2 ? "yesterday" : `in last ${range} days`;

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${fmt(totalRevenue)}`,
      sub: `${isPositive ? "+" : ""}${growth.toFixed(1)}% vs prev`,
      icon: <IndianRupee size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#10B981",
      gradient: ["#10B981", "#059669"],
      glow: "rgba(16,185,129,0.15)",
      trend: isPositive,
      showTrend: true,
    },
    {
      label: "Today's Sale",
      value: `₹${fmt(daySale)}`,
      sub: "Sales since midnight",
      icon: <Banknote size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#FF6B35",
      gradient: ["#FF6B35", "#F59E0B"],
      glow: "rgba(255,107,53,0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "This Week",
      value: `₹${fmt(weekSale)}`,
      sub: "Sales since Sunday",
      icon: <FileText size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#8B5CF6",
      gradient: ["#8B5CF6", "#7C3AED"],
      glow: "rgba(139, 92, 246, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "This Month",
      value: `₹${fmt(monthSale)}`,
      sub: "Sales in current month",
      icon: <Smartphone size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#0EA5E9",
      gradient: ["#0EA5E9", "#0284C7"],
      glow: "rgba(14, 165, 233, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Total Bills",
      value: fmt(totalBills),
      sub: `Orders ${rangeSub}`,
      icon: <FileText size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#64748B",
      gradient: ["#64748B", "#475569"],
      glow: "rgba(100, 116, 139, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Cash Collected",
      value: `₹${fmt(cash)}`,
      sub: "Physical payments",
      icon: <Banknote size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
      glow: "rgba(245,158,11,0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "UPI Payments",
      value: `₹${fmt(upi)}`,
      sub: "Digital transactions",
      icon: <Smartphone size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#EC4899",
      gradient: ["#EC4899", "#DB2777"],
      glow: "rgba(236, 72, 153, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: `${rangeShort} Customers`,
      value: fmt(data.todayCustomers || 0),
      sub: `Unique visitors ${rangeSub}`,
      icon: <Users size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#06B6D4",
      gradient: ["#06B6D4", "#0891B2"],
      glow: "rgba(6, 182, 212, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "New Customers",
      value: fmt(data.newCustomers || 0),
      sub: `First-time visits ${rangeSub}`,
      icon: <UserPlus size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#10B981",
      gradient: ["#10B981", "#059669"],
      glow: "rgba(16, 185, 129, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Repeat Customers",
      value: fmt(data.repeatCustomers || 0),
      sub: `Returning ${rangeSub}`,
      icon: <UserCheck size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
      glow: "rgba(245, 158, 11, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Walk-in Guests",
      value: fmt(data.walkInCustomers || 0),
      sub: `Anonymous footfall`,
      icon: <Users size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#64748B",
      gradient: ["#64748B", "#475569"],
      glow: "rgba(100, 116, 139, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Avg Bill Value",
      value: `₹${fmt(data.avgOrderValue || 0)}`,
      sub: `Average per order`,
      icon: <BarChart3 size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#8B5CF6",
      gradient: ["#8B5CF6", "#7C3AED"],
      glow: "rgba(139, 92, 246, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: `${rangeShort} Peak`,
      value: data.peakHour || "N/A",
      sub: `Busiest hour`,
      icon: <Clock size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
      glow: "rgba(245, 158, 11, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Performance Pulse",
      value: "View Ledger",
      sub: "Historical comparisons",
      icon: <History size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#EC4899",
      gradient: ["#EC4899", "#DB2777"],
      glow: "rgba(236, 72, 153, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Peak Performance Day",
      value: data.peakDay || "No data",
      sub: `Highest volume on ${data.peakDay || "..."}`,
      icon: <TrendingUp size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#10B981",
      gradient: ["#10B981", "#059669"],
      glow: "rgba(16, 185, 129, 0.15)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Live Status",
      value: `${data.activeOrders || 0} Active`,
      sub: `${data.completedOrders || 0} Completed today`,
      icon: <Activity size={rf(16)} color="#fff" strokeWidth={2.5} />,
      accent: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
      glow: "rgba(245, 158, 11, 0.15)",
      trend: true,
      showTrend: false,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {stats.map((item, idx) => (
        <View key={idx} style={styles.cardContainer}>
          {/* Top colored line via LinearGradient */}
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBar}
          />

          {/* Glow orb effect top right */}
          <View style={[styles.glowOrbRight, { backgroundColor: item.glow }]} />
          {/* Glow orb effect bottom left */}
          <View style={[styles.glowOrbLeft, { backgroundColor: item.glow }]} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              {item.icon}
            </LinearGradient>

            {item.showTrend ? (
              <View style={[styles.trendBadge, {
                backgroundColor: item.trend ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                borderColor: item.trend ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"
              }]}>
                {item.trend ? <TrendingUp size={rf(9)} color="#10B981" /> : <TrendingDown size={rf(9)} color="#EF4444" />}
                <Text style={[styles.trendText, { color: item.trend ? "#10B981" : "#EF4444" }]}>
                  {growth.toFixed(1)}%
                </Text>
              </View>
            ) : (
              <View style={[styles.categoryBadge, {
                backgroundColor: `${item.accent}14`,
                borderColor: `${item.accent}30`
              }]}>
                <Text style={[styles.categoryText, { color: item.accent }]}>
                  {idx === 1 ? "📋" : idx === 2 ? "💵" : idx === 3 ? "📅" : idx === 4 ? "📊" : idx === 5 ? "💳" : idx === 6 ? "📱" : "👤"} {item.label.split(' ')[0]}
                </Text>
              </View>
            )}
          </View>

          {/* Value */}
          <Text style={styles.valueText}>{item.value}</Text>

          {/* Separator */}
          <LinearGradient
            colors={[`${item.accent}30`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />

          {/* Label + Sub */}
          <View style={styles.footerInfo}>
            <Text style={styles.labelText}>{item.label}</Text>
            <View style={styles.subRow}>
              {item.showTrend && (item.trend ? <TrendingUp size={rf(9)} color="#10B981" /> : <TrendingDown size={rf(9)} color="#EF4444" />)}
              <Text style={[
                styles.subText,
                item.showTrend ? { color: item.trend ? "#10B981" : "#EF4444" } : { color: "#94A3B8" }
              ]}>
                {item.sub}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: s(15),
    paddingBottom: vs(15),
    gap: s(15),
  },
  cardContainer: {
    width: s(220),
    backgroundColor: '#fff',
    borderRadius: s(16),
    padding: s(15),
    paddingTop: s(18),
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  glowOrbRight: {
    position: 'absolute',
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    top: -s(20),
    right: -s(20),
    opacity: 0.8,
  },
  glowOrbLeft: {
    position: 'absolute',
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    bottom: -s(10),
    left: -s(10),
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(12),
    zIndex: 2,
  },
  iconBox: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(20),
    borderWidth: 1,
  },
  trendText: {
    fontSize: rf(9),
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(20),
    borderWidth: 1,
  },
  categoryText: {
    fontSize: rf(8),
    fontWeight: '700',
  },
  valueText: {
    fontSize: rf(20),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: vs(8),
    zIndex: 2,
  },
  separator: {
    height: 1,
    marginBottom: vs(8),
    zIndex: 2,
  },
  footerInfo: {
    zIndex: 2,
  },
  labelText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vs(2),
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  subText: {
    fontSize: rf(9),
    fontWeight: '600',
  }
});

export default WebStatsGrid;
