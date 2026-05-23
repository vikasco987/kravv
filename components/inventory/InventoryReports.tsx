import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { InventoryProduct, RawMaterial } from "../../services/inventoryService";
import { rf, s, vs } from "../../utils/responsive";

const { width } = Dimensions.get("window");

interface InventoryReportsProps {
  products: InventoryProduct[];
  materials: RawMaterial[];
  bills?: any[]; // For velocity calculation
}

const InventoryReports: React.FC<InventoryReportsProps> = ({
  products,
  materials,
  bills = [],
}) => {
  // Aggregate Stats
  const stats = React.useMemo(() => {
    let totalProductValue = 0;
    let totalMaterialValue = 0;
    let lowStockProducts = 0;
    let lowStockMaterials = 0;
    const categoryValuation: Record<string, number> = {};

    products.forEach((item) => {
      const price = item.price || item.sellingPrice || 0;
      const val = (item.currentStock || 0) * price;
      totalProductValue += val;

      if ((item.currentStock || 0) <= (item.reorderLevel || 0)) {
        lowStockProducts++;
      }

      // Safe category name extraction with explicit casting to fix red lines
      const catName =
        typeof item.category === "object" && item.category !== null
          ? (item.category as { name: string }).name
          : (item.category as string) || "General";

      categoryValuation[catName] = (categoryValuation[catName] || 0) + val;
    });

    materials.forEach((item) => {
      const val = (item.currentStock || 0) * (item.purchasePrice || 0);
      totalMaterialValue += val;

      if ((item.currentStock || 0) <= (item.alertThreshold || 0)) {
        lowStockMaterials++;
      }

      const catName =
        typeof item.category === "object" && item.category !== null
          ? (item.category as { name: string }).name
          : (item.category as string) || "General Material";

      categoryValuation[catName] = (categoryValuation[catName] || 0) + val;
    });

    // Velocity Calculation from Bills
    const itemVelocity: Record<string, number> = {};
    bills.forEach((bill) => {
      if (bill.isDeleted) return;
      const items = Array.isArray(bill.items) ? bill.items : [];
      items.forEach((it: any) => {
        const name = it.name || "Unknown";
        itemVelocity[name] =
          (itemVelocity[name] || 0) + (it.qty || it.quantity || 1);
      });
    });

    const topSellingItems = Object.entries(itemVelocity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => {
        const product = products.find((p) => p.name === name);
        return {
          name,
          qty,
          stock: product ? product.currentStock : 0,
          unit: product ? product.unit : "pcs",
        };
      });

    return {
      totalValue: totalProductValue + totalMaterialValue,
      productValue: totalProductValue,
      materialValue: totalMaterialValue,
      lowStockTotal: lowStockProducts + lowStockMaterials,
      categoryValuation: Object.entries(categoryValuation).sort(
        (a, b) => b[1] - a[1],
      ),
      topSellingItems,
    };
  }, [products, materials, bills]);

  const formatCurrency = (val: number) => {
    return "₹" + val.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  };

  const renderMetricCard = (
    label: string,
    value: string | number,
    icon: any,
    colors: string[],
    subtext: string,
  ) => (
    <LinearGradient
      colors={colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.metricCard}
    >
      <View style={styles.metricHeader}>
        <View style={styles.metricIconContainer}>
          <MaterialCommunityIcons
            name={icon as any}
            size={rf(24)}
            color="#fff"
          />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtext}>{subtext}</Text>
    </LinearGradient>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Actions */}
      <View style={styles.topActions}>
        <View>
          <Text style={styles.title}>Inventory Intelligence</Text>
          <Text style={styles.subtitle}>ASSET VALUATION & PERFORMANCE</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Feather name="download" size={rf(18)} color="#4F46E5" />
          <Text style={styles.exportText}>EXPORT</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          "TOTAL ASSETS",
          formatCurrency(stats.totalValue),
          "wallet",
          ["#4F46E5", "#3730A3"],
          "Net inventory valuation",
        )}
        {renderMetricCard(
          "CRITICAL STOCK",
          stats.lowStockTotal,
          "alert-decagram",
          ["#EF4444", "#991B1B"],
          "Items below reorder floor",
        )}
      </View>

      {/* Stock Health Matrix */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock Health Matrix</Text>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={rf(20)}
            color="#10B981"
          />
        </View>
        <View style={styles.healthMatrix}>
          <View
            style={[
              styles.healthCard,
              { backgroundColor: "#ECFDF5", borderColor: "#10B981" },
            ]}
          >
            <Text style={[styles.healthLabel, { color: "#10B981" }]}>
              HEALTHY
            </Text>
            <Text style={[styles.healthValue, { color: "#065F46" }]}>
              {products.length + materials.length - stats.lowStockTotal}
            </Text>
            <Text style={styles.healthSub}>Optimization Target</Text>
          </View>
          <View
            style={[
              styles.healthCard,
              { backgroundColor: "#FEF2F2", borderColor: "#EF4444" },
            ]}
          >
            <Text style={[styles.healthLabel, { color: "#EF4444" }]}>
              CRITICAL
            </Text>
            <Text style={[styles.healthValue, { color: "#991B1B" }]}>
              {stats.lowStockTotal}
            </Text>
            <Text style={styles.healthSub}>Requires Action</Text>
          </View>
        </View>
      </View>

      {/* Item Performance / Velocity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Moving Assets</Text>
          <MaterialCommunityIcons
            name="trending-up"
            size={rf(20)}
            color="#8B5CF6"
          />
        </View>
        <View style={styles.velocityContainer}>
          {stats.topSellingItems.length > 0 ? (
            stats.topSellingItems.map((item, index) => (
              <View key={index} style={styles.velocityRow}>
                <View style={styles.velocityInfo}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.velocityName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.velocityStock}>
                      In Stock: {item.stock} {item.unit}
                    </Text>
                  </View>
                </View>
                <View style={styles.velocityStats}>
                  <Text style={styles.velocityQty}>{item.qty}</Text>
                  <Text style={styles.velocityLabel}>SOLD</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyVelocity}>
              <Text style={styles.emptyText}>
                No sales data linked to assets yet.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Category Distribution */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Capital Allocation</Text>
          <MaterialCommunityIcons
            name="chart-pie"
            size={rf(20)}
            color="#F59E0B"
          />
        </View>
        <View style={styles.allocationList}>
          {stats.categoryValuation.map(([cat, val], index) => {
            const percentage = (val / (stats.totalValue || 1)) * 100;
            return (
              <View key={index} style={styles.allocationRow}>
                <View style={styles.allocationHeader}>
                  <Text style={styles.allocationLabel}>{cat}</Text>
                  <Text style={styles.allocationValue}>
                    {formatCurrency(val)}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          index % 2 === 0 ? "#4F46E5" : "#10B981",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.allocationPercent}>
                  {percentage.toFixed(1)}% of total value
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: vs(40) }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: s(20),
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: vs(20),
  },
  title: {
    fontSize: rf(22),
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: rf(10),
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 2,
    marginTop: vs(2),
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: s(6),
  },
  exportText: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#4F46E5",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(20),
  },
  metricCard: {
    width: "48%",
    padding: s(20),
    borderRadius: s(24),
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    marginBottom: vs(12),
  },
  metricIconContainer: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: rf(10),
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: rf(20),
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  metricSubtext: {
    fontSize: rf(9),
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginTop: vs(4),
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: s(24),
    padding: s(20),
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(15),
  },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: "900",
    color: "#334155",
    letterSpacing: -0.5,
  },
  healthMatrix: {
    flexDirection: "row",
    gap: s(12),
  },
  healthCard: {
    flex: 1,
    padding: s(15),
    borderRadius: s(18),
    borderWidth: 1,
    alignItems: "center",
  },
  healthLabel: {
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 1,
  },
  healthValue: {
    fontSize: rf(24),
    fontWeight: "900",
    marginVertical: vs(4),
  },
  healthSub: {
    fontSize: rf(9),
    fontWeight: "600",
    color: "#64748B",
  },
  velocityContainer: {
    gap: vs(12),
  },
  velocityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  velocityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    flex: 1,
  },
  rankBadge: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#64748B",
  },
  velocityName: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#1E293B",
    width: s(140),
  },
  velocityStock: {
    fontSize: rf(10),
    fontWeight: "600",
    color: "#94A3B8",
  },
  velocityStats: {
    alignItems: "flex-end",
  },
  velocityQty: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#8B5CF6",
  },
  velocityLabel: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#A78BFA",
  },
  emptyVelocity: {
    padding: vs(20),
    alignItems: "center",
  },
  emptyText: {
    fontSize: rf(12),
    color: "#94A3B8",
    fontWeight: "500",
    fontStyle: "italic",
  },
  allocationList: {
    gap: vs(15),
  },
  allocationRow: {
    gap: vs(6),
  },
  allocationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  allocationLabel: {
    fontSize: rf(13),
    fontWeight: "700",
    color: "#475569",
  },
  allocationValue: {
    fontSize: rf(13),
    fontWeight: "900",
    color: "#1E293B",
  },
  progressBarContainer: {
    height: vs(6),
    backgroundColor: "#F1F5F9",
    borderRadius: s(3),
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: s(3),
  },
  allocationPercent: {
    fontSize: rf(9),
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "right",
  },
});

export default InventoryReports;
