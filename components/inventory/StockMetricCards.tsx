import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  colors: [string, string];
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  icon,
  colors,
  subtitle,
}: MetricCardProps) => (
  <LinearGradient
    colors={colors}
    style={styles.card}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <View style={styles.cardHeader}>
      <View style={styles.iconContainer}>
        <Feather name={icon} size={rf(18)} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
      </View>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {subtitle && (
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}
    </View>
  </LinearGradient>
);

interface StockMetricCardsProps {
  metrics: {
    totalAssets: number;
    criticalStockCount: number;
    inventoryValue: number;
    totalCategories?: number;
  };
}

const StockMetricCards = ({ metrics }: StockMetricCardsProps) => {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <MetricCard
          title="Total Assets"
          value={String(metrics.totalAssets)}
          icon="package"
          colors={["#6366F1", "#4F46E5"]}
          subtitle="Total Items"
        />
        <MetricCard
          title="Categories"
          value={String(metrics.totalCategories || 0)}
          icon="list"
          colors={["#EC4899", "#DB2777"]}
          subtitle="Active Groups"
        />
        <MetricCard
          title="Critical Stock"
          value={String(metrics.criticalStockCount)}
          icon="alert-triangle"
          colors={["#F87171", "#EF4444"]}
          subtitle="Low Inventory"
        />
        <MetricCard
          title="Live Value"
          value={`₹${(metrics.inventoryValue || 0).toLocaleString()}`}
          icon="trending-up"
          colors={["#10B981", "#059669"]}
          subtitle="Total Worth"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: s(15),
    paddingVertical: vs(15),
    gap: s(12),
  },
  card: {
    width: s(140),
    borderRadius: s(18),
    padding: s(14),
    minHeight: vs(120),
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  iconContainer: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardBody: {
    marginTop: vs(12),
  },
  cardValue: {
    fontSize: rf(20),
    fontWeight: "900",
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: rf(10),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: vs(2),
    fontWeight: "500",
  },
});

export default StockMetricCards;
