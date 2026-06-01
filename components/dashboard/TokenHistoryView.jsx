import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

export default function TokenHistoryView({ allBills = [], onClose }) {
  const stats = useMemo(() => {
    const dailyStats = {};

    allBills.forEach((bill) => {
      if (!bill.createdAt && !bill.date) return;
      const dateObj = new Date(bill.createdAt || bill.date);

      const dateStr = dateObj.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = { date: dateStr, totalTokens: 0, orders: 0, timestamp: dateObj.setHours(0, 0, 0, 0) };
      }

      dailyStats[dateStr].orders += 1;
      const tokenNum = parseInt(bill.tokenNumber) || 0;
      if (tokenNum > dailyStats[dateStr].totalTokens) {
        dailyStats[dateStr].totalTokens = tokenNum;
      }
    });

    return Object.values(dailyStats).sort((a, b) => b.timestamp - a.timestamp);
  }, [allBills]);

  const latestCount = stats[0]?.totalTokens || 0;
  const latestDate = stats[0]?.date || "N/A";
  const avgDaily = stats.length > 0 ? Math.round(stats.reduce((acc, curr) => acc + curr.totalTokens, 0) / stats.length) : 0;
  const bestDay = stats.length > 0 ? Math.max(...stats.map(s => s.totalTokens)) : 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Feather name="chevron-left" size={rf(20)} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Token Printing History</Text>
            <Text style={styles.headerSubtitle}>DAILY TOKEN CONSUMPTION REPORT</Text>
          </View>
        </View>
        <View style={styles.headerIconWrapper}>
          <MaterialCommunityIcons name="ticket" size={rf(20)} color="#4F46E5" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stats.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Feather name="clock" size={rf(32)} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Token Data Yet</Text>
            <Text style={styles.emptyDesc}>Once you start printing bills with tokens, your daily history will appear here.</Text>
          </View>
        ) : (
          <View>
            {/* STATS CARDS */}
            <View style={styles.statsGrid}>
              {/* Latest Count */}
              <View style={styles.statCard}>
                <View>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: "#ECFDF5" }]}>
                      <Feather name="trending-up" size={rf(14)} color="#10B981" />
                    </View>
                    <Text style={styles.statLabel}>LATEST COUNT</Text>
                  </View>
                  <Text style={styles.statValue}>{latestCount}</Text>
                </View>
                <Text style={styles.statSubText}>TOKENS ON {latestDate}</Text>
              </View>

              {/* Avg Daily */}
              <View style={styles.statCard}>
                <View>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: "#EEF2FF" }]}>
                      <Feather name="bar-chart-2" size={rf(14)} color="#4F46E5" />
                    </View>
                    <Text style={styles.statLabel}>AVG DAILY</Text>
                  </View>
                  <Text style={styles.statValue}>{avgDaily}</Text>
                </View>
                <Text style={styles.statSubText}>ACROSS LAST {stats.length} DAYS</Text>
              </View>

              {/* Best Day */}
              <View style={styles.statCard}>
                <View>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: "#FFFBEB" }]}>
                      <Feather name="calendar" size={rf(14)} color="#D97706" />
                    </View>
                    <Text style={styles.statLabel}>BEST DAY</Text>
                  </View>
                  <Text style={styles.statValue}>{bestDay}</Text>
                </View>
                <Text style={styles.statSubText}>HIGHEST DAILY TOKEN PEAK</Text>
              </View>
            </View>

            {/* TABLE */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>DAILY BREAKDOWN</Text>
                <View style={styles.tableBadge}>
                  <Text style={styles.tableBadgeText}>MAX TOKEN USED</Text>
                </View>
              </View>

              <View style={styles.tableColHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>DATE</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: "center" }]}>TOTAL ORDERS</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: "right" }]}>LAST TOKEN NO.</Text>
              </View>

              {stats.map((row, idx) => (
                <View key={idx} style={styles.tableRow}>
                  {/* Date Column */}
                  <View style={[styles.tableColDate, { flex: 2 }]}>
                    <View style={styles.rowDateIcon}>
                      <Feather name="calendar" size={rf(12)} color="#64748B" />
                    </View>
                    <Text style={styles.rowDateText}>{row.date}</Text>
                  </View>

                  {/* Orders Column */}
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <View style={styles.ordersBadge}>
                      <Text style={styles.ordersBadgeText}>{row.orders} Orders</Text>
                    </View>
                  </View>

                  {/* Token Number Column */}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={styles.tokenNumberText}>#{row.totalTokens}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: s(20),
    paddingTop: Platform.OS === "android" ? vs(50) : vs(20),
    paddingBottom: vs(15),
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
  },
  backBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: rf(8),
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginTop: vs(2),
  },
  headerIconWrapper: {
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: s(20),
    paddingBottom: vs(40),
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(40),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  emptyIconBox: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(20),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(8),
  },
  emptyDesc: {
    fontSize: rf(12),
    color: "#64748B",
    textAlign: "center",
    maxWidth: s(250),
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: s(8),
    marginBottom: vs(24),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: s(16),
    padding: s(12),
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    marginBottom: vs(12),
  },
  statIconBox: {
    width: s(24),
    height: s(24),
    borderRadius: s(6),
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: rf(7),
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#64748B",
    flexShrink: 1,
  },
  statValue: {
    fontSize: rf(20),
    fontWeight: "900",
    color: "#0F172A",
  },
  statSubText: {
    fontSize: rf(7),
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: vs(12),
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tableTitle: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  tableBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
  },
  tableBadgeText: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#4F46E5",
  },
  tableColHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
    backgroundColor: "rgba(248,250,252,0.5)",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tableColHeader: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  tableColDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
  },
  rowDateIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  rowDateText: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#475569",
  },
  ordersBadge: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",
    paddingHorizontal: s(10),
    paddingVertical: vs(2),
    borderRadius: s(12),
  },
  ordersBadgeText: {
    fontSize: rf(9),
    fontWeight: "800",
    color: "#1D4ED8",
  },
  tokenNumberText: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#0F172A",
  },
});
