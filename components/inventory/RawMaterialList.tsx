import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RawMaterial } from "../../services/inventoryService";
import { rf, s, vs } from "../../utils/responsive";

interface RawMaterialListProps {
  materials: RawMaterial[];
  onEdit: (material: RawMaterial) => void;
  onDelete: (material: RawMaterial) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const RawMaterialList = ({
  materials,
  onEdit,
  onDelete,
  onRefresh,
  refreshing,
}: RawMaterialListProps) => {
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock <= 0)
      return { label: "OUT OF STOCK", color: "#DC2626", bg: "#FEF2F2" };
    if (stock <= threshold)
      return { label: "LOW STOCK", color: "#D97706", bg: "#FFFBEB" };
    return { label: "GOOD STOCK", color: "#059669", bg: "#ECFDF5" };
  };

  const renderItem = ({ item }: { item: RawMaterial }) => {
    const status = getStockStatus(item.currentStock, item.alertThreshold);
    const categoryName =
      typeof item.category === "object" && item.category !== null
        ? (item.category as any).name
        : item.category || "General";

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.itemMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {categoryName.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => onDelete(item)}>
            <Feather name="trash-2" size={rf(16)} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.iconSection}>
            <View style={styles.iconBox}>
              <Feather name="database" size={rf(22)} color="#4F46E5" />
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.idText}>
              ID: {item.id.slice(-6).toUpperCase()}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Cost</Text>
                <Text style={styles.priceValue}>₹{item.purchasePrice}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Current</Text>
                <Text style={[styles.stockValue, { color: status.color }]}>
                  {item.currentStock}{" "}
                  <Text style={styles.unit}>{item.unit}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => onEdit(item)}
          >
            <Feather name="edit-2" size={rf(14)} color="#4F46E5" />
            <Text style={styles.actionBtnTextPrimary}>
              Edit Material Details
            </Text>
          </TouchableOpacity>
        </View>

        {(item.gst !== undefined || item.hsnCode) && (
          <View style={styles.footerInfo}>
            {item.gst !== undefined && (
              <Text style={styles.footerText}>GST: {item.gst}%</Text>
            )}
            {item.hsnCode && (
              <Text style={styles.footerText}>HSN: {item.hsnCode}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={materials}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="database" size={rf(60)} color="#E2E8F0" />
          <Text style={styles.emptyText}>No materials found</Text>
          <Text style={styles.emptySubText}>
            Add materials to track raw ingredients
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: s(15),
    paddingBottom: vs(120),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(16),
    marginBottom: vs(15),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 4,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(6),
  },
  categoryText: {
    fontSize: rf(9),
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(6),
    gap: s(4),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  mainContent: {
    flexDirection: "row",
    marginBottom: vs(15),
  },
  iconSection: {
    marginRight: s(12),
  },
  iconBox: {
    width: s(50),
    height: s(50),
    borderRadius: s(14),
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsSection: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: rf(16),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: vs(2),
  },
  idText: {
    fontSize: rf(10),
    color: "#94A3B8",
    marginBottom: vs(8),
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: s(20),
  },
  statBox: {
    flexDirection: "column",
  },
  statLabel: {
    fontSize: rf(9),
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: vs(1),
  },
  priceValue: {
    fontSize: rf(14),
    fontWeight: "800",
    color: "#6366F1",
  },
  stockValue: {
    fontSize: rf(14),
    fontWeight: "800",
  },
  unit: {
    fontSize: rf(10),
    color: "#94A3B8",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: s(10),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(10),
    borderRadius: s(10),
    gap: s(6),
  },
  actionBtnTextPrimary: {
    color: "#4F46E5",
    fontSize: rf(12),
    fontWeight: "700",
  },
  footerInfo: {
    flexDirection: "row",
    gap: s(12),
    marginTop: vs(10),
    opacity: 0.7,
  },
  footerText: {
    fontSize: rf(9),
    color: "#64748B",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(80),
    paddingHorizontal: s(40),
  },
  emptyText: {
    fontSize: rf(18),
    fontWeight: "800",
    color: "#64748B",
    marginTop: vs(15),
    textAlign: "center",
  },
  emptySubText: {
    fontSize: rf(13),
    color: "#94A3B8",
    marginTop: vs(5),
    textAlign: "center",
  },
});

export default RawMaterialList;
