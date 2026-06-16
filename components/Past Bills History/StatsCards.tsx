import { LinearGradient } from "expo-linear-gradient";
import {
  CreditCard,
  IndianRupee,
  Receipt,
  UtensilsCrossed
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface StatsCardsProps {
  totalRevenue: number;
  paidBillsCount: number;
  pendingBillsCount: number;
  cancelledBillsCount: number;
  cashRevenue: number;
  upiRevenue: number;
  walletRevenue: number;
  dineInCount: number;
  takeawayCount: number;
  counterCount: number;
  activeOrderCount: number;
  totalBills: number;
}

const format = (num: number) => new Intl.NumberFormat("en-IN").format(Math.round(num));

export const StatsCards = ({
  totalRevenue,
  paidBillsCount,
  pendingBillsCount,
  cancelledBillsCount,
  cashRevenue,
  upiRevenue,
  walletRevenue,
  dineInCount,
  takeawayCount,
  counterCount,
  activeOrderCount,
  totalBills,
}: StatsCardsProps) => {
  return (
    <View style={styles.container}>
      {/* Revenue Card */}
      <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={[styles.card, { padding: s(24) }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerLabel, { color: "rgba(255,255,255,0.8)" }]}>TOTAL REVENUE</Text>
            <Text style={[styles.revenueText, { color: "white" }]}>₹{format(totalRevenue)}</Text>
          </View>
          <View style={[styles.iconContainerBlue, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <IndianRupee size={rf(20)} color="white" />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View>
            <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.7)" }]}>ACTIVE ORDERS</Text>
            <Text style={[styles.statValue, { color: "#FCA5A5" }]}>{activeOrderCount}</Text>
          </View>
          <View style={{ marginLeft: s(24) }}>
            <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.7)" }]}>TOTAL BILLS</Text>
            <Text style={[styles.statValue, { color: "white" }]}>{totalBills}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Bill Status Card */}
      <GroupedCard title="BILL STATUS" icon={<Receipt size={rf(16)} color="white" />} colors={["#0F172A", "#1E293B"]}>
        <StatItem label="Paid" value={paidBillsCount} dot="#10B981" />
        <StatItem label="Pending" value={pendingBillsCount} dot="#F59E0B" />
        <StatItem label="Cancelled" value={cancelledBillsCount} dot="#EF4444" />
      </GroupedCard>

      {/* Payment Modes Card */}
      <GroupedCard title="PAYMENT MODES" icon={<CreditCard size={rf(16)} color="white" />} colors={["#0F172A", "#1E293B"]}>
        <StatItem label="Cash" value={`₹${format(cashRevenue)}`} dot="#059669" />
        <StatItem label="UPI" value={`₹${format(upiRevenue)}`} dot="#4F46E5" />
        <StatItem label="Wallet" value={`₹${format(walletRevenue)}`} dot="#7C3AED" />
      </GroupedCard>

      {/* Order Nature Card */}
      <GroupedCard title="ORDER NATURE" icon={<UtensilsCrossed size={rf(16)} color="white" />} colors={["#0F172A", "#1E293B"]}>
        <StatItem label="Dine-in" value={dineInCount} dot="#10B981" />
        <StatItem label="Takeaway" value={takeawayCount} dot="#F59E0B" />
        <StatItem label="Counter" value={counterCount} dot="#6366F1" />
      </GroupedCard>
    </View>
  );
};

const GroupedCard = ({ title, icon, children, colors }: any) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
    <View style={styles.groupedHeader}>
      <View style={[styles.groupedIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>{icon}</View>
      <Text style={[styles.groupedTitle, { color: "rgba(255,255,255,0.7)" }]}>{title}</Text>
    </View>
    <View style={styles.groupedContent}>{children}</View>
  </LinearGradient>
);

const StatItem = ({ label, value, dot }: any) => (
  <View style={styles.statItem}>
    <View style={styles.statItemLeft}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.statItemLabel, { color: "rgba(255,255,255,0.8)" }]}>{label}</Text>
    </View>
    <Text style={[styles.statItemValue, { color: "white" }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(16),
    paddingBottom: vs(16),
  },
  card: {
    flexGrow: 1,
    minWidth: "47%",
    borderRadius: s(20),
    padding: s(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLabel: {
    fontSize: rf(10),
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: vs(6),
  },
  revenueText: {
    fontSize: rf(32),
    fontWeight: "900",
    letterSpacing: -1,
  },
  iconContainerBlue: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: vs(20),
  },
  statLabel: {
    fontSize: rf(9),
    fontWeight: "700",
    marginBottom: vs(2),
  },
  statValue: {
    fontSize: rf(16),
    fontWeight: "900",
  },
  groupedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    marginBottom: vs(16),
  },
  groupedIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    justifyContent: "center",
    alignItems: "center",
  },
  groupedTitle: {
    fontSize: rf(10),
    fontWeight: "800",
    letterSpacing: 1,
  },
  groupedContent: {
    gap: vs(12),
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  dot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
  },
  statItemLabel: {
    fontSize: rf(12),
    fontWeight: "700",
  },
  statItemValue: {
    fontSize: rf(14),
    fontWeight: "900",
  },
});
