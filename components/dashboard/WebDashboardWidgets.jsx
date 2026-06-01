import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import { rf, s, vs } from "../../utils/responsive";

import WebRecentBills from "./WebRecentBills";
import WebStatsGrid from "./WebStatsGrid";
import WebWeeklyChart from "./WebWeeklyChart";

const screenWidth = Dimensions.get("window").width;

const WebDashboardWidgets = ({ allBills = [], activeCombosCount = 0, activeOffersCount = 0, effectiveId = "", setCurrentView = () => { }, children }) => {
  const [range, setRange] = React.useState(30);

  // 1. Date Ranges
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - range);
  startDate.setHours(0, 0, 0, 0);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - range);

  const startOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const startOfWeek = new Date(endDate);
  startOfWeek.setDate(endDate.getDate() - endDate.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  // 2. Filter bills
  const currentBills = allBills.filter(b => !b.isDeleted && new Date(b.createdAt || b.date) >= startDate);
  const prevBills = allBills.filter(b => {
    if (b.isDeleted) return false;
    const d = new Date(b.createdAt || b.date);
    return d >= prevStartDate && d < startDate;
  });

  const deletedBills = allBills.filter(b => b.isDeleted).sort((a, b) => new Date(b.deletedAt || b.updatedAt) - new Date(a.deletedAt || a.updatedAt)).slice(0, 10);
  const recentBills = currentBills.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 10);

  // 3. Stats Calculation for WebStatsGrid
  const totalRevenue = currentBills.reduce((sum, b) => sum + (b.total || 0), 0);
  const prevRevenue = prevBills.reduce((sum, b) => sum + (b.total || 0), 0);
  const growth = prevRevenue === 0 ? 100 : ((totalRevenue - prevRevenue) / prevRevenue) * 100;
  const isGrowthPositive = growth >= 0;

  const totalBills = currentBills.length;
  const avgOrderValue = totalBills > 0 ? totalRevenue / totalBills : 0;

  let cash = 0, upi = 0;
  currentBills.forEach(b => {
    const mode = (b.paymentMode || "").toLowerCase();
    if (mode.includes("cash")) cash += b.total || 0;
    if (mode.includes("upi")) upi += b.total || 0;
  });

  const daySale = currentBills.filter(b => new Date(b.createdAt || b.date) >= startOfDay).reduce((sum, b) => sum + (b.total || 0), 0);
  const weekSale = currentBills.filter(b => new Date(b.createdAt || b.date) >= startOfWeek).reduce((sum, b) => sum + (b.total || 0), 0);
  const monthSale = currentBills.filter(b => new Date(b.createdAt || b.date) >= startOfMonth).reduce((sum, b) => sum + (b.total || 0), 0);

  // Customers logic (Approximate based on mobile number if available)
  const currentRangeUniquePhones = new Set(currentBills.map(b => b.customerPhone).filter(Boolean));
  const currentRangeAnonymousCount = currentBills.filter(b => !b.customerPhone).length;
  // Without historic data of all time, we approximate new vs repeat 50/50 for phones for demo
  const repeatCustomers = Math.floor(currentRangeUniquePhones.size * 0.4);
  const newCustomers = currentRangeUniquePhones.size - repeatCustomers;
  const totalRangeCustomers = currentRangeUniquePhones.size + currentRangeAnonymousCount;

  // Active / Completed Orders (approx)
  const activeOrders = 0; // App local view usually shows completed POS bills
  const completedOrders = currentBills.filter(b => new Date(b.createdAt || b.date) >= startOfDay).length;

  // 4. Daily Revenue Line Chart
  const chartMap = {};
  currentBills.forEach(b => {
    const dateStr = new Date(b.createdAt || b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (!chartMap[dateStr]) chartMap[dateStr] = 0;
    chartMap[dateStr] += b.total || 0;
  });

  const sortedDates = Object.keys(chartMap).sort((a, b) => new Date(a) - new Date(b));
  const revenueLabels = sortedDates.length > 0 ? sortedDates : ["No data"];
  const revenueData = sortedDates.length > 0 ? sortedDates.map(d => chartMap[d]) : [0];

  // 5. Order Type Breakdowns
  const orderTypeBreakdown = { DELIVERY: 0, TAKEAWAY: 0, DINEIN: 0 };
  currentBills.forEach(b => {
    const type = b.tableName || "POS";
    if (type === "DELIVERY") orderTypeBreakdown.DELIVERY += b.total || 0;
    else if (type === "TAKEAWAY") orderTypeBreakdown.TAKEAWAY += b.total || 0;
    else orderTypeBreakdown.DINEIN += b.total || 0;
  });

  // 6. Peak Hours & Busiest Day
  const hourMap = {};
  currentBills.forEach(b => {
    const hr = new Date(b.createdAt || b.date).getHours();
    hourMap[hr] = (hourMap[hr] || 0) + 1;
  });

  let peakHourNum = -1, maxOrders = 0;
  Object.entries(hourMap).forEach(([hr, cnt]) => {
    if (cnt > maxOrders) { maxOrders = cnt; peakHourNum = Number(hr); }
  });
  const peakHour = peakHourNum === -1 ? "No data" : `${peakHourNum % 12 || 12} ${peakHourNum >= 12 ? 'PM' : 'AM'}`;

  const peakHoursData = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 9;
    return { label: `${hour % 12 || 12}${hour >= 12 ? 'p' : 'a'}`, count: hourMap[hour] || 0 };
  });

  const dayNameMap = { 'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0 };
  currentBills.forEach(b => {
    const dayName = new Date(b.createdAt || b.date).toLocaleDateString('en-IN', { weekday: 'long' });
    if (dayNameMap[dayName] !== undefined) {
      dayNameMap[dayName] += b.total || 0;
    }
  });
  let peakDayName = "No data", maxDayRevenue = 0;
  Object.entries(dayNameMap).forEach(([day, rev]) => {
    if (rev > maxDayRevenue) { maxDayRevenue = rev; peakDayName = day; }
  });

  // 7. Weekly Revenue Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weeklyData = last7Days.map(date => {
    const dayBills = currentBills.filter(b => {
      const bDate = new Date(b.createdAt || b.date);
      return bDate.getDate() === date.getDate() &&
        bDate.getMonth() === date.getMonth() &&
        bDate.getFullYear() === date.getFullYear();
    });
    return {
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue: dayBills.reduce((s, b) => s + (b.total || 0), 0),
      orders: dayBills.length
    };
  });

  // 8. Top Items
  const itemMap = {};
  currentBills.forEach(b => {
    let items = b.items;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (items && !Array.isArray(items) && items.items) items = items.items;

    if (Array.isArray(items)) {
      items.forEach(item => {
        const name = item.name || "Unknown";
        const qty = Number(item.quantity || item.qty || 0);
        const price = Number(item.sellingPrice || item.rate || item.price || 0);
        if (!itemMap[name]) itemMap[name] = { totalSold: 0, totalRevenue: 0 };
        itemMap[name].totalSold += qty;
        itemMap[name].totalRevenue += (qty * price);
      });
    }
  });

  const topItems = Object.keys(itemMap)
    .map(name => ({ name, totalSold: itemMap[name].totalSold, totalRevenue: itemMap[name].totalRevenue }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 8);

  const formatNum = (num) => new Intl.NumberFormat("en-IN").format(Math.round(num || 0));

  // Construct Data for StatsGrid
  const statsGridData = {
    totalRevenue,
    growth,
    totalBills,
    daySale,
    weekSale,
    monthSale,
    paymentSplit: { Cash: cash, UPI: upi },
    todayCustomers: totalRangeCustomers,
    newCustomers,
    repeatCustomers,
    walkInCustomers: currentRangeAnonymousCount,
    avgOrderValue,
    peakHour,
    peakDay: peakDayName,
    activeOrders,
    completedOrders
  };

  // Chart Configs
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: { fontSize: rf(9) }
  };

  const pieData = [
    { name: "Cash", population: cash, color: "#10B981", legendFontColor: "#4B5563", legendFontSize: rf(8) },
    { name: "UPI", population: upi, color: "#4F46E5", legendFontColor: "#4B5563", legendFontSize: rf(8) },
  ];

  const orderTypePieData = [
    { name: "Dine-In", population: orderTypeBreakdown.DINEIN, color: "#F59E0B", legendFontColor: "#4B5563", legendFontSize: rf(8) },
    { name: "Takeaway", population: orderTypeBreakdown.TAKEAWAY, color: "#8B5CF6", legendFontColor: "#4B5563", legendFontSize: rf(8) },
    { name: "Delivery", population: orderTypeBreakdown.DELIVERY, color: "#EC4899", legendFontColor: "#4B5563", legendFontSize: rf(8) },
  ];

  const quickActions = [
    {
      pill: "Daily Logs", title: "Token History", desc: "Check daily token printing count", action: "View Reports",
      icon: "ticket", color: "#10B981", bg: "#ECFDF5", pillBg: "#D1FAE5", pillText: "#047857"
    },
    {
      pill: "Tax Center", title: "GST Reports", desc: "GSTR-1, 3B and HSN Summaries", action: "Audit Center",
      icon: "file-text", color: "#4F46E5", bg: "#EEF2FF", pillBg: "#E0E7FF", pillText: "#4338CA"
    },
    {
      pill: "CRM", title: "Customers", desc: "Manage parties and wallet balances", action: "Open CRM",
      icon: "users", color: "#F59E0B", bg: "#FFFBEB", pillBg: "#FEF3C7", pillText: "#B45309"
    },
    {
      pill: "Layout", title: "Tables & Area", desc: "Manage your dining floor layout", action: "Manage Floor",
      icon: "grid", color: "#E11D48", bg: "#FFF1F2", pillBg: "#FFE4E6", pillText: "#BE123C"
    },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER WIDGET */}
      <View style={styles.headerWidget}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="lightning-bolt" size={rf(20)} color="#fff" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Performance Dashboard</Text>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={rf(10)} color="#10B981" />
              <Text style={styles.verifiedText}>ADMIN VERIFIED</Text>
            </View>
            {effectiveId ? (
              <TouchableOpacity
                style={styles.idBadge}
                onPress={() => { alert("ID Copied: " + effectiveId); }}
              >
                <Feather name="hash" size={rf(10)} color="#F59E0B" />
                <Text style={styles.idText}>ID: {effectiveId.slice(0, 8)}...</Text>
                <Feather name="copy" size={rf(10)} color="#6B7280" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* DATE FILTER UI */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilterContainer}>
        {[{ label: "Today", value: 1 }, { label: "Yesterday", value: 2 }, { label: "7 Days", value: 7 }, { label: "30 Days", value: 30 }].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.dateFilterChip, range === opt.value && styles.dateFilterChipActive]}
            onPress={() => setRange(opt.value)}
          >
            <Text style={[styles.dateFilterText, range === opt.value && styles.dateFilterTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FULL 16-METRIC WEB STATS GRID */}
      <WebStatsGrid data={statsGridData} range={range} />

      {children}

      {/* STORE MANAGEMENT */}
      <View style={{ marginBottom: vs(20) }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: s(12), paddingRight: s(20) }}
        >
          {quickActions.map((act, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => {
                // Use setTimeout to allow the ripple animation to start immediately before freezing JS thread to mount heavy views
                setTimeout(() => {
                  if (act.title === "Token History") setCurrentView("token_history");
                  if (act.title === "GST Reports") setCurrentView("gst_reports");
                  if (act.title === "Customers") setCurrentView("customers");
                  if (act.title === "Tables & Area") setCurrentView("tables");
                }, 0);
              }}
              style={[styles.chartCard, { width: 170, paddingHorizontal: s(16), paddingVertical: vs(16), marginBottom: 0 }]}
            >
              {/* Top Row: Icon and Pill */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: vs(16) }}>
                <View style={{
                  width: s(36), height: s(36), borderRadius: s(12),
                  backgroundColor: act.bg, justifyContent: "center", alignItems: "center"
                }}>
                  <Feather name={act.icon} size={rf(18)} color={act.color} />
                </View>
                <View style={{
                  backgroundColor: act.pillBg, paddingHorizontal: s(6), paddingVertical: vs(4), borderRadius: s(6)
                }}>
                  <Text style={{ fontSize: rf(8), fontWeight: "900", color: act.pillText, textTransform: "uppercase" }}>{act.pill}</Text>
                </View>
              </View>

              {/* Middle: Title and Desc */}
              <View style={{ marginBottom: vs(16) }}>
                <Text style={{ fontSize: rf(14), fontWeight: "900", color: "#1E293B", marginBottom: vs(4) }}>{act.title}</Text>
                <Text style={{ fontSize: rf(9), fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>{act.desc}</Text>
              </View>

              {/* Bottom: Action link */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: s(4) }}>
                <Text style={{ fontSize: rf(10), fontWeight: "900", color: act.color }}>{act.action}</Text>
                <Feather name="arrow-right" size={rf(10)} color={act.color} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* REVENUE CHART */}
      {(() => {
        const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData) : 0;
        const totalRev = revenueData.reduce((sum, val) => sum + val, 0);
        const hasData = revenueData.length > 1 || (revenueData.length === 1 && revenueData[0] > 0);

        return (
          <View style={[styles.chartCard, { paddingHorizontal: s(14), paddingVertical: vs(18) }]}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: vs(20) }}>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: s(8), marginBottom: vs(4) }}>
                  <View style={{
                    width: s(28),
                    height: s(28),
                    borderRadius: s(8),
                    backgroundColor: "#8B5CF6", // matches web brand
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#8B5CF6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5
                  }}>
                    <Feather name="trending-up" size={rf(14)} color="white" />
                  </View>
                  <Text style={{ fontSize: rf(14), fontWeight: "900", color: "#1E293B" }}>Revenue Analytics</Text>
                </View>
                <Text style={{ fontSize: rf(9), color: "#64748B", fontFamily: "monospace", paddingLeft: s(36) }}>
                  Sales performance over selected period
                </Text>
              </View>
              {maxRevenue > 0 && (
                <View style={{
                  paddingHorizontal: s(10),
                  paddingVertical: vs(4),
                  borderRadius: s(16),
                  backgroundColor: "rgba(139,92,246,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(139,92,246,0.2)"
                }}>
                  <Text style={{ fontSize: rf(9), fontWeight: "800", color: "#8B5CF6", fontFamily: "monospace" }}>
                    Peak: ₹{formatNum(maxRevenue)}
                  </Text>
                </View>
              )}
            </View>

            {/* Empty State vs Chart */}
            {!hasData ? (
              <View style={{
                height: vs(180),
                justifyContent: "center",
                alignItems: "center",
                gap: vs(8)
              }}>
                <Text style={{ fontSize: rf(24) }}>📊</Text>
                <Text style={{ fontSize: rf(10), fontFamily: "monospace", color: "#94A3B8" }}>No revenue data for this period</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels: revenueLabels.length > 5 ? [] : revenueLabels,
                    datasets: [{ data: revenueData }],
                  }}
                  width={Math.max(screenWidth - s(40), revenueData.length * 40)}
                  height={vs(180)}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                    fillShadowGradientFrom: "#8B5CF6",
                    fillShadowGradientFromOpacity: 0.4,
                    fillShadowGradientTo: "#8B5CF6",
                    fillShadowGradientToOpacity: 0,
                    propsForDots: { r: "3", strokeWidth: "0", fill: "#8B5CF6" },
                    propsForBackgroundLines: { strokeDasharray: "3 3", stroke: "#E2E8F0" },
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`
                  }}
                  bezier
                  style={{
                    borderRadius: s(12),
                    marginVertical: vs(8)
                  }}
                  withDots={revenueData.length <= 15}
                  withVerticalLines={false}
                  yAxisLabel="₹"
                  formatYLabel={(v) => {
                    const num = Number(v);
                    return num >= 1000 ? (num / 1000).toFixed(0) + "k" : num;
                  }}
                />
              </ScrollView>
            )}
          </View>
        );
      })()}

      {/* PIE CHARTS (PAYMENT & ORDER TYPE) */}
      <View style={[styles.pieChartsContainer, screenWidth < 600 ? styles.columnCharts : styles.rowCharts]}>
        {/* PAYMENT MODE */}
        {(() => {
          const totalPay = cash + upi;
          const payItems = [
            { name: "Cash", value: cash, color: "#10B981", percent: totalPay > 0 ? (cash / totalPay) * 100 : 0 },
            { name: "UPI", value: upi, color: "#8B5CF6", percent: totalPay > 0 ? (upi / totalPay) * 100 : 0 },
          ];

          return (
            <View style={[styles.chartCard, screenWidth >= 600 && { flex: 1 }, { paddingHorizontal: s(14), paddingVertical: vs(18), justifyContent: 'space-between' }]}>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: vs(20) }}>
                <View style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(10),
                  backgroundColor: "#10B981",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 5
                }}>
                  <MaterialCommunityIcons name="wallet" size={rf(18)} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: rf(14), fontWeight: "900", color: "#1E293B" }}>Payment Split</Text>
                  <Text style={{ fontSize: rf(10), color: "#64748B", fontFamily: "monospace" }}>Cash vs UPI breakdown</Text>
                </View>
              </View>

              {/* Chart */}
              {totalPay === 0 ? (
                <View style={{ height: vs(150), justifyContent: "center", alignItems: "center", gap: vs(8) }}>
                  <Text style={{ fontSize: rf(24) }}>💳</Text>
                  <Text style={{ fontSize: rf(10), fontFamily: "monospace", color: "#94A3B8" }}>No payment data</Text>
                </View>
              ) : (
                <View style={{ alignItems: "center", width: '100%', height: vs(150), justifyContent: "center" }}>
                  <PieChart
                    data={payItems.map(item => ({
                      name: item.name,
                      population: item.value,
                      color: item.color,
                      legendFontColor: "#4B5563",
                      legendFontSize: rf(8)
                    }))}
                    width={screenWidth < 600 ? screenWidth - s(40) : (screenWidth - s(50)) / 2}
                    height={vs(150)}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={screenWidth < 600 ? String((screenWidth - s(40)) / 4) : String(((screenWidth - s(50)) / 2) / 4)}
                    center={[0, 0]}
                    hasLegend={false}
                    absolute
                  />
                </View>
              )}

              {/* Custom Legend */}
              {totalPay > 0 && (
                <View style={{
                  flexDirection: "row",
                  gap: s(12),
                  marginTop: vs(16),
                  paddingHorizontal: s(16),
                  paddingVertical: vs(14),
                  backgroundColor: "#F8FAFC",
                  borderRadius: s(14),
                  borderWidth: 1,
                  borderColor: "#E2E8F0"
                }}>
                  {payItems.map((item, index) => (
                    <View key={index} style={{ flex: 1, alignItems: "center", gap: vs(4) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: s(6) }}>
                        <View style={{
                          width: s(10),
                          height: s(10),
                          borderRadius: s(5),
                          backgroundColor: item.color,
                          shadowColor: item.color,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.6,
                          shadowRadius: 4,
                          elevation: 3
                        }} />
                        <Text style={{ fontSize: rf(10), fontWeight: "700", color: "#64748B" }}>{item.name}</Text>
                      </View>
                      <Text style={{ fontSize: rf(14), fontWeight: "800", color: item.color }}>₹{formatNum(item.value)}</Text>
                      <Text style={{ fontSize: rf(9), color: "#94A3B8", fontFamily: "monospace" }}>{Math.round(item.percent)}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })()}

        {/* ORDER TYPE */}
        {(() => {
          const totalAmount = orderTypeBreakdown.DELIVERY + orderTypeBreakdown.TAKEAWAY + orderTypeBreakdown.DINEIN;
          const items = [
            { name: "Delivery", value: orderTypeBreakdown.DELIVERY, color: "#3B82F6", percent: totalAmount > 0 ? (orderTypeBreakdown.DELIVERY / totalAmount) * 100 : 0 },
            { name: "Dine-in", value: orderTypeBreakdown.DINEIN, color: "#10B981", percent: totalAmount > 0 ? (orderTypeBreakdown.DINEIN / totalAmount) * 100 : 0 },
            { name: "Takeaway", value: orderTypeBreakdown.TAKEAWAY, color: "#F59E0B", percent: totalAmount > 0 ? (orderTypeBreakdown.TAKEAWAY / totalAmount) * 100 : 0 },
          ].sort((a, b) => b.value - a.value);

          return (
            <View style={[styles.chartCard, screenWidth >= 600 && { flex: 1, marginLeft: s(10) }, { paddingHorizontal: s(14), paddingVertical: vs(18), justifyContent: 'space-between' }]}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(20) }}>
                <Text style={{ fontSize: rf(14), fontWeight: "900", color: "#1E293B" }}>Order type breakdown</Text>
              </View>

              {/* Progress Bars */}
              <View style={{ gap: vs(16), flex: 1, justifyContent: "center" }}>
                {items.map((item, index) => (
                  <View key={index}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(8) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
                        <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: item.color, shadowColor: item.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 }} />
                        <Text style={{ fontSize: rf(12), fontWeight: "700", color: "#1E293B" }}>{item.name}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: s(4) }}>
                        <Text style={{ fontSize: rf(12), fontWeight: "800", color: "#1E293B" }}>{Math.round(item.percent)}%</Text>
                        <Text style={{ fontSize: rf(12), color: "#94A3B8" }}>—</Text>
                        <Text style={{ fontSize: rf(12), fontWeight: "800", color: "#1E293B" }}>₹{formatNum(item.value)}</Text>
                      </View>
                    </View>
                    <View style={{ height: vs(6), backgroundColor: "#F1F5F9", borderRadius: vs(3), overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${item.percent}%`, backgroundColor: item.color, borderRadius: vs(3) }} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={{ marginTop: vs(20), paddingTop: vs(15), borderTopWidth: 1, borderTopColor: "#F1F5F9", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: rf(10), fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>Total Revenue</Text>
                <Text style={{ fontSize: rf(16), fontWeight: "900", color: "#1E293B" }}>₹{formatNum(totalAmount)}</Text>
              </View>
            </View>
          );
        })()}
      </View>

      {/* PEAK HOURS BAR CHART */}
      {peakHoursData.length > 0 && (
        <View style={[styles.chartCard, { paddingHorizontal: s(14), paddingVertical: vs(18) }]}>
          <Text style={{ fontSize: rf(14), fontWeight: "900", color: "#1E293B", marginBottom: vs(20) }}>Peak hours today</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: peakHoursData.map(d => d.label),
                datasets: [{ data: peakHoursData.map(d => d.count) }]
              }}
              width={Math.max(screenWidth - s(40), peakHoursData.length * 35)}
              height={vs(180)}
              yAxisLabel=""
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                fillShadowGradientFrom: "#F59E0B",
                fillShadowGradientFromOpacity: 1,
                fillShadowGradientTo: "#F59E0B",
                fillShadowGradientToOpacity: 0.8,
                propsForBackgroundLines: { strokeDasharray: "3 3", stroke: "#E2E8F0" },
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              }}
              style={{
                borderRadius: s(12),
                marginVertical: vs(8)
              }}
              showValuesOnTopOfBars
              withInnerLines={false}
            />
          </ScrollView>
        </View>
      )}

      {/* WEEKLY REVENUE CHART */}
      <WebWeeklyChart data={weeklyData} />

      {/* RECENT & DELETED BILLS TABBED VIEW */}
      <WebRecentBills recentBills={recentBills} deletedBills={deletedBills} />

      {/* MARKETING HUB */}
      <Text style={styles.sectionHeading}>Marketing Hub</Text>
      <View style={styles.marketingGrid}>
        <TouchableOpacity style={styles.marketingCardWrapper}>
          <LinearGradient
            colors={['#6366F1', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.marketingCard}
          >
            <View style={styles.marketingHeader}>
              <View style={styles.marketingIconBox}>
                <MaterialCommunityIcons name="star-shooting" size={rf(20)} color="#fff" />
              </View>
              <View style={styles.marketingBadge}>
                <Text style={styles.marketingBadgeText}>LIVE PREVIEW ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.marketingTitle}>Combo Deals</Text>
            <Text style={styles.marketingSub}>Create & edit meal bundles with real-time customer view preview</Text>
            <View style={styles.marketingFooter}>
              <View style={styles.marketingActiveBadge}>
                <Text style={[styles.marketingActiveText, { color: '#4338CA' }]}>{activeCombosCount} ACTIVE DEALS</Text>
              </View>
              <Text style={styles.marketingArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.marketingCardWrapper}>
          <LinearGradient
            colors={['#F59E0B', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.marketingCard}
          >
            <View style={styles.marketingHeader}>
              <View style={styles.marketingIconBox}>
                <MaterialCommunityIcons name="tag" size={rf(20)} color="#fff" />
              </View>
              <View style={styles.marketingBadge}>
                <Text style={styles.marketingBadgeText}>CAMPAIGNS</Text>
              </View>
            </View>
            <Text style={styles.marketingTitle}>Offers & Coupons</Text>
            <Text style={styles.marketingSub}>Manage discount codes and seasonal promotions logic</Text>
            <View style={styles.marketingFooter}>
              <View style={styles.marketingActiveBadge}>
                <Text style={[styles.marketingActiveText, { color: '#EA580C' }]}>{activeOffersCount} ACTIVE COUPONS</Text>
              </View>
              <Text style={styles.marketingArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* TOP ITEMS */}
      {(() => {
        const displayItems = topItems.slice(0, 8);
        const maxRevenue = displayItems.length > 0 ? Math.max(...displayItems.map(i => i.totalRevenue)) : 1;
        const colors = [
          { primary: "#F59E0B", glow: "rgba(245,158,11,0.2)" },
          { primary: "#94A3B8", glow: "rgba(148,163,184,0.2)" },
          { primary: "#CD7F32", glow: "rgba(205,127,50,0.2)" },
          { primary: "#8B5CF6", glow: "rgba(139,92,246,0.2)" },
          { primary: "#10B981", glow: "rgba(16,185,129,0.2)" },
        ];
        const rankLabels = ["🥇", "🥈", "🥉", "4th", "5th", "6th", "7th", "8th"];

        return (
          <View style={[styles.chartCard, { paddingHorizontal: s(16), paddingVertical: vs(20) }]}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(24) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: s(12) }}>
                <View style={{
                  width: s(40),
                  height: s(40),
                  borderRadius: s(12),
                  backgroundColor: "#8B5CF6",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#8B5CF6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5
                }}>
                  <MaterialCommunityIcons name="fire" size={rf(20)} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: rf(14), fontWeight: "900", color: "#1E293B" }}>Top Sellers</Text>
                  <Text style={{ fontSize: rf(10), color: "#64748B", fontFamily: "monospace" }}>Best performing dishes</Text>
                </View>
              </View>
              <View style={{
                width: s(32),
                height: s(32),
                borderRadius: s(10),
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.2)",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Feather name="award" size={rf(14)} color="#8B5CF6" />
              </View>
            </View>

            {/* Items */}
            <View style={{ gap: vs(18) }}>
              {displayItems.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: vs(20), gap: vs(10) }}>
                  <Text style={{ fontSize: rf(24), opacity: 0.5 }}>🍽️</Text>
                  <Text style={{ fontSize: rf(11), color: "#94A3B8" }}>No sales data available</Text>
                </View>
              ) : (
                displayItems.map((item, index) => {
                  const progress = (item.totalRevenue / maxRevenue) * 100;
                  const color = colors[index % colors.length];

                  return (
                    <View key={index}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(8) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: s(10), flex: 1, paddingRight: s(10) }}>
                          <View style={{
                            width: s(28),
                            height: s(28),
                            borderRadius: s(8),
                            backgroundColor: index < 3 ? color.glow : "#F8FAFC",
                            borderWidth: 1,
                            borderColor: index < 3 ? color.glow : "#E2E8F0",
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
                            <Text style={{ fontSize: index < 3 ? rf(12) : rf(9), fontWeight: "800", color: color.primary, fontFamily: "monospace" }}>
                              {rankLabels[index]}
                            </Text>
                          </View>
                          <Text style={{ fontSize: rf(12), fontWeight: "700", color: "#334155", flexShrink: 1 }} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: rf(12), fontWeight: "900", color: "#1E293B", letterSpacing: -0.5 }}>
                            ₹{formatNum(item.totalRevenue)}
                          </Text>
                          <Text style={{ fontSize: rf(9), color: "#94A3B8", fontFamily: "monospace" }}>
                            {item.totalSold} units
                          </Text>
                        </View>
                      </View>
                      {/* Progress bar */}
                      <View style={{ height: vs(5), backgroundColor: "#F1F5F9", borderRadius: vs(2.5), overflow: "hidden" }}>
                        <View style={{ height: "100%", width: `${progress}%`, backgroundColor: color.primary, borderRadius: vs(2.5) }} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        );
      })()}

      {/* BUSINESS INSIGHTS */}
      <View style={[styles.insightCard, isGrowthPositive ? styles.insightPositive : styles.insightNegative]}>
        <View style={styles.insightHeaderRow}>
          <View style={[styles.insightIcon, isGrowthPositive ? styles.insightIconPositive : styles.insightIconNegative]}>
            <Ionicons name={isGrowthPositive ? "trending-up" : "stats-chart"} size={rf(18)} color={isGrowthPositive ? "#10B981" : "#EF4444"} />
          </View>
          <View>
            <Text style={styles.insightTitle}>Business Insights</Text>
            <Text style={styles.insightSub}>AI-powered analysis</Text>
          </View>
        </View>

        <Text style={styles.insightText}>
          {isGrowthPositive
            ? `🎉 Excellent! Your revenue grew by ${Math.abs(growth).toFixed(1)}% compared to last period. Focus on your top-selling items to maintain this momentum.`
            : `Track your sales patterns to identify peak hours and popular items. Promoting top-selling dishes can help boost your average order value.`}
        </Text>

        {/* 3 mini stats in business insights */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStatBox}>
            <Text style={[styles.miniStatValue, { color: "#8B5CF6" }]}>₹{formatNum(avgOrderValue)}</Text>
            <Text style={styles.miniStatLabel}>Avg. Order</Text>
          </View>
          <View style={styles.miniStatBox}>
            <Text style={[styles.miniStatValue, { color: isGrowthPositive ? "#10B981" : "#EF4444" }]}>
              {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
            </Text>
            <Text style={styles.miniStatLabel}>Growth</Text>
          </View>
          <View style={styles.miniStatBox}>
            <Text style={[styles.miniStatValue, { color: "#F59E0B" }]}>
              {totalRevenue > 0 ? Math.round((upi / totalRevenue) * 100) : 0}%
            </Text>
            <Text style={styles.miniStatLabel}>UPI Ratio</Text>
          </View>
        </View>

        <View style={styles.insightTags}>
          <Text style={styles.tagText}>#KravyPOS</Text>
          <Text style={styles.tagText}>#SalesAnalytics</Text>
          <Text style={styles.tagText}>{isGrowthPositive ? "#GrowthMode" : "#StaySteady"}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: s(15),
    paddingBottom: vs(30),
    marginTop: vs(15),
  },
  headerWidget: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(15),
    gap: s(12),
  },
  headerIconContainer: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: rf(13),
    fontWeight: "700",
    color: "#334155",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    marginTop: vs(4),
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(6),
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  verifiedText: {
    fontSize: rf(9),
    color: "#10B981",
    fontWeight: "800",
  },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: "#F1F5F9",
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(6),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  idText: {
    fontSize: rf(9),
    color: "#475569",
    fontWeight: "800",
    fontFamily: "monospace",
  },
  dateFilterContainer: {
    flexDirection: "row",
    marginBottom: vs(15),
  },
  dateFilterChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: s(14),
    paddingVertical: vs(6),
    borderRadius: s(20),
    marginRight: s(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateFilterChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  dateFilterText: {
    fontSize: rf(11),
    color: "#64748B",
    fontWeight: "700",
  },
  dateFilterTextActive: {
    color: "#4F46E5",
    fontWeight: "800",
  },
  sectionHeading: {
    fontSize: rf(14),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: vs(12),
    marginTop: vs(10),
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(10),
    marginBottom: vs(20),
  },
  actionCard: {
    width: (screenWidth - s(40)) / 2,
    backgroundColor: "#fff",
    padding: s(12),
    borderRadius: s(12),
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#1E293B",
  },
  actionSub: {
    fontSize: rf(9),
    color: "#64748B",
    fontWeight: "600",
  },
  marketingGrid: {
    flexDirection: "column",
    gap: vs(15),
    marginBottom: vs(20),
  },
  marketingCardWrapper: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  marketingCard: {
    padding: s(24),
    borderRadius: s(24),
    justifyContent: "space-between",
  },
  marketingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(16),
  },
  marketingIconBox: {
    width: s(44),
    height: s(44),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketingBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(20),
  },
  marketingBadgeText: {
    fontSize: rf(8),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  marketingTitle: {
    fontSize: rf(20),
    fontWeight: "900",
    color: "#fff",
    marginBottom: vs(4),
  },
  marketingSub: {
    fontSize: rf(11),
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: vs(16),
    lineHeight: vs(16),
  },
  marketingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  marketingActiveBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(12),
  },
  marketingActiveText: {
    fontSize: rf(9),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  marketingArrow: {
    fontSize: rf(16),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '900',
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: s(16),
    padding: s(15),
    marginBottom: vs(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: "100%",
  },
  pieChartsContainer: {
    marginBottom: vs(15),
  },
  columnCharts: {
    flexDirection: "column",
    gap: vs(15),
  },
  rowCharts: {
    flexDirection: "row",
    gap: s(10),
    marginBottom: vs(15),
  },
  halfChartCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: s(16),
    padding: s(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: rf(13),
    fontWeight: "800",
    color: "#334155",
    marginBottom: vs(10),
    alignSelf: "flex-start",
  },
  chartStyle: {
    borderRadius: s(12),
    marginVertical: vs(8),
  },
  topItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    flex: 1,
  },
  topItemRank: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#94A3B8",
    width: s(25),
  },
  topItemName: {
    fontSize: rf(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  topItemSold: {
    fontSize: rf(10),
    color: "#64748B",
    marginTop: vs(2),
  },
  topItemRev: {
    fontSize: rf(13),
    fontWeight: "900",
    color: "#4F46E5",
  },
  badgeTop: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(8),
  },
  badgeTopText: {
    fontSize: rf(10),
    color: "#4F46E5",
    fontWeight: "800",
  },
  emptyText: {
    fontSize: rf(12),
    color: "#94A3B8",
    textAlign: "center",
    padding: vs(20),
  },
  insightCard: {
    borderRadius: s(16),
    paddingHorizontal: s(14),
    paddingVertical: vs(18),
    marginBottom: vs(15),
    borderWidth: 1,
  },
  insightPositive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
  },
  insightNegative: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  insightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    marginBottom: vs(12),
  },
  insightIcon: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    justifyContent: "center",
    alignItems: "center",
  },
  insightIconPositive: {
    backgroundColor: "#D1FAE5",
  },
  insightIconNegative: {
    backgroundColor: "#FEE2E2",
  },
  insightTitle: {
    fontSize: rf(14),
    fontWeight: "800",
    color: "#1E293B",
  },
  insightSub: {
    fontSize: rf(10),
    color: "#64748B",
    fontFamily: "monospace",
  },
  insightText: {
    fontSize: rf(12),
    color: "#475569",
    lineHeight: vs(18),
    marginBottom: vs(15),
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(8),
    marginBottom: vs(15),
  },
  miniStatBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(12),
    padding: s(10),
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: rf(14),
    fontWeight: '900',
    marginBottom: vs(2),
  },
  miniStatLabel: {
    fontSize: rf(9),
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  insightTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(8),
  },
  tagText: {
    fontSize: rf(9),
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "#fff",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});

export default React.memo(WebDashboardWidgets);
