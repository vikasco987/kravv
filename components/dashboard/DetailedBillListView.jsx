import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const COLORS = {
  bg: "#121214",
  cardBg: "#1C1C1E",
  text: "#FFFFFF",
  textDim: "#A1A1AA",
  border: "#2C2C2E",
  chipBg: "#2C2C2E",
  brand: "#3154D4",
  success: "#34C759",
  danger: "#FF453A",
  statusPaid: "#D1FAE5",
  statusPaidText: "#065F46",
  statusCancelled: "#FEE2E2",
  statusCancelledText: "#991B1B",
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusStyle = (status) => {
  const sStr = (status || "paid").toLowerCase();
  if (sStr.includes("cancel"))
    return { bg: COLORS.statusCancelled, text: COLORS.statusCancelledText };
  return { bg: COLORS.statusPaid, text: COLORS.statusPaidText };
};

const BillCard = ({
  bill,
  index,
  expanded,
  toggleExpand,
  settings,
  onDelete,
}) => {
  const statusStyle = getStatusStyle(bill.status);

  // Use pre-calculated fields if available (added by billCalculator.js / applyTrueBillTotals)
  // Otherwise fallback to local calculation (legacy compatibility)
  const itemsSubtotal =
    bill.itemsSubtotal !== undefined
      ? bill.itemsSubtotal
      : (bill.items || []).reduce(
          (acc, it) =>
            acc + Number(it.qty || 1) * Number(it.rate || it.price || 0),
          0,
        );
  const discPercent =
    bill.calculatedDiscountRate !== undefined
      ? bill.calculatedDiscountRate
      : (bill.discountRate ?? settings.discount_rate ?? 0);

  const discountAmount =
    bill.calculatedDiscount !== undefined && bill.calculatedDiscount > 0
      ? bill.calculatedDiscount
      : bill.discountAmount ||
        bill.discount_amount ||
        bill.discount ||
        (settings.discount_enabled ? itemsSubtotal * (discPercent / 100) : 0);

  const taxableAfterDiscount =
    bill.calculatedTaxable !== undefined &&
    bill.calculatedTaxable !== itemsSubtotal
      ? bill.calculatedTaxable
      : itemsSubtotal - discountAmount;
  // Logic for Detailed GST Breakdown (Global + Per-Product by Rate)
  const globalTaxMap = {};
  const itemTaxMap = {};

  (bill.items || []).forEach((it) => {
    const qty = Number(it.qty || it.quantity || 1);
    const rate = Number(it.rate || it.price || 0);
    const itemGross = qty * rate;
    const itemDiscount =
      itemsSubtotal > 0 ? (itemGross / itemsSubtotal) * discountAmount : 0;
    const itemTaxable = itemGross - itemDiscount;
    const pGst = Number(it.gst || it.gstRate || it.gst_rate || 0);

    if (settings.tax_enabled && settings.per_product_tax) {
      if (pGst > 0) {
        itemTaxMap[pGst] = (itemTaxMap[pGst] || 0) + itemGross * (pGst / 100);
      } else if (settings.tax_rate > 0) {
        globalTaxMap[settings.tax_rate] =
          (globalTaxMap[settings.tax_rate] || 0) +
          itemGross * (settings.tax_rate / 100);
      }
    } else if (settings.tax_enabled && settings.tax_rate > 0) {
      globalTaxMap[settings.tax_rate] =
        (globalTaxMap[settings.tax_rate] || 0) +
        itemGross * (settings.tax_rate / 100);
    } else if (settings.per_product_tax && pGst > 0) {
      itemTaxMap[pGst] = (itemTaxMap[pGst] || 0) + itemGross * (pGst / 100);
    }
  });

  const totalGlobalGst = Object.values(globalTaxMap).reduce((a, b) => a + b, 0);
  const totalItemGst = Object.values(itemTaxMap).reduce((a, b) => a + b, 0);

  const isExistingBill = !!(bill.id || bill._id);

  const globalGst =
    bill.calculatedGlobalGst !== undefined
      ? bill.calculatedGlobalGst
      : settings.tax_enabled || settings.per_product_tax
        ? totalGlobalGst
        : 0;

  const itemGst =
    bill.calculatedItemGst !== undefined
      ? bill.calculatedItemGst
      : settings.tax_enabled || settings.per_product_tax
        ? totalItemGst
        : 0;

  const gstToShow = globalGst + itemGst;
  const serviceCharge =
    bill.calculatedServiceCharge !== undefined &&
    bill.calculatedServiceCharge > 0
      ? bill.calculatedServiceCharge
      : bill.serviceCharge || 0;

  const serviceGst =
    bill.calculatedServiceGst !== undefined && bill.calculatedServiceGst > 0
      ? bill.calculatedServiceGst
      : settings.service_gst_enabled && serviceCharge > 0
        ? (serviceCharge * settings.service_gst_rate) / 100
        : 0;

  const deliveryCharge =
    bill.calculatedDeliveryCharge !== undefined &&
    bill.calculatedDeliveryCharge > 0
      ? bill.calculatedDeliveryCharge
      : bill.deliveryCharge || bill.deliveryCharges || 0;

  const deliveryGst =
    bill.calculatedDeliveryGst !== undefined && bill.calculatedDeliveryGst > 0
      ? bill.calculatedDeliveryGst
      : settings.delivery_gst_enabled && deliveryCharge > 0
        ? (deliveryCharge * settings.delivery_gst_rate) / 100
        : 0;

  const packagingCharge =
    bill.calculatedPackagingCharge !== undefined &&
    bill.calculatedPackagingCharge > 0
      ? bill.calculatedPackagingCharge
      : bill.packagingCharge || bill.packagingCharges || 0;

  const packagingGst =
    bill.calculatedPackagingGst !== undefined && bill.calculatedPackagingGst > 0
      ? bill.calculatedPackagingGst
      : settings.packaging_gst_enabled && packagingCharge > 0
        ? (packagingCharge * settings.packaging_gst_rate) / 100
        : 0;

  const calculatedTotal =
    taxableAfterDiscount +
    gstToShow +
    serviceCharge +
    serviceGst +
    deliveryCharge +
    deliveryGst +
    packagingCharge +
    packagingGst;

  // We should prioritize bill.total ONLY if it already includes the calculated components and has a stored discount.
  // Otherwise use the calculated total (for dynamic discount handling).
  const hasStoredDiscount =
    bill.calculatedDiscount > 0 ||
    bill.discountAmount > 0 ||
    bill.discount_amount > 0 ||
    bill.discount > 0;
  const displayTotal = hasStoredDiscount
    ? bill.total || calculatedTotal
    : calculatedTotal;

  // Only update bill.total if it is missing or different from displayTotal
  bill.total = displayTotal;

  const avgGstPercent =
    bill.calculatedGstRate !== undefined
      ? bill.calculatedGstRate
      : settings.tax_enabled && !settings.per_product_tax
        ? settings.tax_rate
        : 0;
  const servGstPercent =
    bill.calculatedServiceGstRate || settings.service_gst_rate || 0;
  const delGstPercent =
    bill.calculatedDeliveryGstRate || settings.delivery_gst_rate || 0;
  const pkgGstPercent =
    bill.calculatedPackagingGstRate || settings.packaging_gst_rate || 0;

  const avgItemGstPercent =
    (bill.items || []).find((it) => Number(it.gst || 0) > 0)?.gst || 0;

  // Format time
  const billTime = formatTime(bill.createdAt);

  return (
    <View style={styles.cardContainer}>
      {/* Row 1: Bill No & Total */}
      <View style={styles.cardHeader}>
        <Text style={styles.billNoText}>
          {bill.billNumber ||
            bill.billNo ||
            bill.invoiceNo ||
            bill._id ||
            "N/A"}
        </Text>
        <Text style={styles.totalText}>
          ₹
          {Number(bill.total || 0)
            .toFixed(2)
            .replace(/\.00$/, "")}
        </Text>
        <TouchableOpacity
          onPress={() => onDelete && onDelete(bill)}
          style={{ padding: s(5), marginLeft: s(10) }}
        >
          <Ionicons name="trash-outline" size={rf(20)} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Row 2: Time & Token & Status */}
      <View style={styles.cardSubHeader}>
        <Text style={styles.timeTokenText}>
          {billTime} • Token #{bill.tokenNo || index + 1}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
            {(bill.status || "Paid").toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Row 3: Chips */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.chipText}>{bill.orderType || "Dine-in"}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{bill.paymentMethod || "Cash"}</Text>
        </View>
        {gstToShow > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              GST ₹{gstToShow.toFixed(2).replace(/\.00$/, "")}
            </Text>
          </View>
        )}
      </View>

      {/* Row 4: Summary & Buttons */}
      <View style={styles.summaryButtonsRow}>
        <Text style={styles.itemsSubtotalText}>
          {(bill.items || []).length} items • Subtotal ₹{itemsSubtotal}
        </Text>
        <View style={styles.buttonsGroup}>
          <TouchableOpacity style={styles.waButton}>
            <Text style={styles.buttonText}>WA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailsButton} onPress={toggleExpand}>
            <Text style={styles.buttonText}>
              Details {expanded ? "▲" : "▾"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Items List */}
          {(bill.items || []).map((item, idx) => {
            return (
              <View key={idx} style={styles.expandedItemContainer}>
                <View style={styles.expandedItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expandedItemName}>
                      {item.name} x{item.qty || item.quantity || 1}
                    </Text>
                  </View>
                  <Text style={styles.expandedItemPrice}>
                    ₹
                    {Number(
                      (item.qty || item.quantity || 1) *
                        (item.rate || item.price || 0),
                    )
                      .toFixed(2)
                      .replace(/\.00$/, "")}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={styles.verticalMargin} />

          {/* Bill Print Receipt Structure */}
          <View style={styles.printContainer}>
            <View style={styles.printRow}>
              <Text style={styles.printLabel}>subtotal:</Text>
              <Text style={styles.printValue}>
                {Number(itemsSubtotal || 0).toFixed(2)}
              </Text>
            </View>

            {settings.discount_enabled && (
              <View style={styles.printRow}>
                <Text style={styles.printLabel}>Disc ({discPercent}%):</Text>
                <Text style={styles.printValue}>
                  -{Number(discountAmount || 0).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.printRow}>
              <Text style={styles.printLabel}>Taxable:</Text>
              <Text style={styles.printValue}>
                {Number(taxableAfterDiscount || 0).toFixed(2)}
              </Text>
            </View>

            {Object.entries(globalTaxMap).map(([rate, amount]) => (
              <View style={styles.printRow} key={`global-${rate}`}>
                <Text style={styles.printLabel}>Global GST({rate}%):</Text>
                <Text style={styles.printValue}>{amount.toFixed(2)}</Text>
              </View>
            ))}

            {Object.entries(itemTaxMap).map(([rate, amount]) => (
              <View style={styles.printRow} key={`item-${rate}`}>
                <Text style={styles.printLabel}>Item GST({rate}%):</Text>
                <Text style={styles.printValue}>{amount.toFixed(2)}</Text>
              </View>
            ))}

            {Object.keys(globalTaxMap).length === 0 &&
              Object.keys(itemTaxMap).length === 0 &&
              gstToShow > 0 && (
                <View style={styles.printRow}>
                  <Text style={styles.printLabel}>GST({avgGstPercent}%):</Text>
                  <Text style={styles.printValue}>
                    {Number(gstToShow).toFixed(2)}
                  </Text>
                </View>
              )}

            {serviceCharge > 0 && (
              <>
                <View style={styles.printRow}>
                  <Text style={styles.printLabel}>Service:</Text>
                  <Text style={styles.printValue}>
                    {Number(serviceCharge).toFixed(2)}
                  </Text>
                </View>
                {serviceGst > 0 && (
                  <View style={styles.printRow}>
                    <Text style={styles.printLabel}>
                      Serv GST({servGstPercent}%):
                    </Text>
                    <Text style={styles.printValue}>
                      {Number(serviceGst).toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {deliveryCharge > 0 && (
              <>
                <View style={styles.printRow}>
                  <Text style={styles.printLabel}>Delivery:</Text>
                  <Text style={styles.printValue}>
                    {Number(deliveryCharge).toFixed(2)}
                  </Text>
                </View>
                {deliveryGst > 0 && (
                  <View style={styles.printRow}>
                    <Text style={styles.printLabel}>
                      Del GST({delGstPercent}%):
                    </Text>
                    <Text style={styles.printValue}>
                      {Number(deliveryGst).toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {packagingCharge > 0 && (
              <>
                <View style={styles.printRow}>
                  <Text style={styles.printLabel}>Packaging:</Text>
                  <Text style={styles.printValue}>
                    {Number(packagingCharge).toFixed(2)}
                  </Text>
                </View>
                {packagingGst > 0 && (
                  <View style={styles.printRow}>
                    <Text style={styles.printLabel}>
                      Pkg GST({pkgGstPercent}%):
                    </Text>
                    <Text style={styles.printValue}>
                      {Number(packagingGst).toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.printDivider} />

            <View style={styles.printRow}>
              <Text style={styles.printTotalLabel}>TOTAL:</Text>
              <Text style={styles.printTotalValue}>
                {Number(bill.total || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const DetailedBillListView = ({
  onBack,
  allBills,
  filterType,
  filterKey,
  title,
  onRefresh,
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [expandedRow, setExpandedRow] = useState(null);
  const [taxSettings, setTaxSettings] = useState({
    tax_enabled: false,
    tax_rate: 0.0,
    per_product_tax: false,
    discount_enabled: false,
    discount_rate: 0,
    service_charge_enabled: false,
    service_charge_rate: 0,
    service_gst_enabled: false,
    service_gst_rate: 0,
    delivery_charge_enabled: false,
    delivery_charge_amount: 0,
    delivery_gst_enabled: false,
    delivery_gst_rate: 0,
    packaging_charge_enabled: false,
    packaging_charge_amount: 0,
    packaging_gst_enabled: false,
    packaging_gst_rate: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const keys = [
          "tax_enabled",
          "tax_rate",
          "per_product_tax",
          "discount_enabled",
          "discount_rate",
          "service_charge_enabled",
          "service_charge_rate",
          "service_gst_enabled",
          "service_gst_rate",
          "delivery_charge_enabled",
          "delivery_charge_amount",
          "delivery_gst_enabled",
          "delivery_gst_rate",
          "packaging_charge_enabled",
          "packaging_charge_amount",
          "packaging_gst_enabled",
          "packaging_gst_rate",
        ];
        const s = await AsyncStorage.multiGet(keys);
        if (!isMounted) return;

        const sMap = {};
        s.forEach(([k, v]) => (sMap[k] = v));

        setTaxSettings({
          tax_enabled: sMap["tax_enabled"] === "true",
          tax_rate: parseFloat(sMap["tax_rate"] || "0"),
          per_product_tax: sMap["per_product_tax"] === "true",
          discount_enabled: sMap["discount_enabled"] === "true",
          discount_rate: parseFloat(sMap["discount_rate"] || "0"),
          service_charge_enabled: sMap["service_charge_enabled"] === "true",
          service_charge_rate: parseFloat(sMap["service_charge_rate"] || "0"),
          service_gst_enabled: sMap["service_gst_enabled"] === "true",
          service_gst_rate: parseFloat(sMap["service_gst_rate"] || "0"),
          delivery_charge_enabled: sMap["delivery_charge_enabled"] === "true",
          delivery_charge_amount: parseFloat(
            sMap["delivery_charge_amount"] || "0",
          ),
          delivery_gst_enabled: sMap["delivery_gst_enabled"] === "true",
          delivery_gst_rate: parseFloat(sMap["delivery_gst_rate"] || "0"),
          packaging_charge_enabled: sMap["packaging_charge_enabled"] === "true",
          packaging_charge_amount: parseFloat(
            sMap["packaging_charge_amount"] || "0",
          ),
          packaging_gst_enabled: sMap["packaging_gst_enabled"] === "true",
          packaging_gst_rate: parseFloat(sMap["packaging_gst_rate"] || "0"),
        });
      } catch (e) {}
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((Number(d) - Number(yearStart)) / 86400000 + 1) / 7);
  };

  const filteredBills = useMemo(() => {
    if (!allBills || !filterKey) return [];

    const sorted = [...allBills].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return sorted.filter((bill) => {
      if (bill.isHeld === true) return false;

      const d = new Date(bill.createdAt);
      if (filterType === "daily") {
        const dateKey = d.toISOString().split("T")[0];
        return dateKey === filterKey;
      } else if (filterType === "weekly") {
        const week = getWeekNumber(d);
        const key = `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
        return key === filterKey;
      } else if (filterType === "monthly") {
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        return key === filterKey;
      }
      return true;
    });
  }, [allBills, filterType, filterKey]);

  // Calculate top bar stats
  const stats = useMemo(() => {
    let bills = 0;
    let revenue = 0;
    let paid = 0;
    let cancelled = 0;

    filteredBills.forEach((bill) => {
      bills++;
      const status = (bill.status || "paid").toLowerCase();
      if (status.includes("cancel")) {
        cancelled++;
      } else {
        paid++;
        revenue += bill.total || 0;
      }
    });

    return { bills, revenue, paid, cancelled };
  }, [filteredBills]);

  const toggleRow = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDeleteBill = async (bill) => {
    if (!bill) return;

    Alert.alert("Delete Bill", "Are you sure you want to delete this bill?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const authToken = await getToken();
            const staffToken = await AsyncStorage.getItem("staff_token");
            const finalToken = authToken || staffToken;

            if (!finalToken) {
              Alert.alert("Error", "Authentication required.");
              return;
            }

            const bId = await StaffPermissionEngine.getActiveBusinessId(
              user?.id,
            );
            const billId = bill._id || bill.id;

            const url = bId
              ? `https://billing.kravy.in/api/bill-manager/${billId}?businessId=${bId}`
              : `https://billing.kravy.in/api/bill-manager/${billId}`;

            const res = await fetch(url, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${finalToken}`,
                "Content-Type": "application/json",
              },
            });

            if (res.ok) {
              Alert.alert("Success", "Bill deleted successfully.");
              if (onRefresh) onRefresh();
            } else {
              Alert.alert("Error", "Failed to delete bill.");
            }
          } catch (e) {
            console.error("Delete error:", e);
            Alert.alert("Error", "Something went wrong.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back and Title */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rf(24)} color="#FFFFFF" />
            <Text style={styles.headerTitle}>{title || "Sales Details"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reloadButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={rf(20)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.bills}</Text>
            <Text style={styles.statLabel}>Bills</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>₹{Math.round(stats.revenue)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.paid}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>
      </View>

      {/* Bills List */}
      <FlatList
        data={filteredBills}
        keyExtractor={(item, index) => item._id || item.id || String(index)}
        contentContainerStyle={{ paddingBottom: vs(50) }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        renderItem={({ item, index }) => (
          <BillCard
            bill={item}
            index={index}
            expanded={expandedRow === (item._id || item.id || String(index))}
            toggleExpand={() => toggleRow(item._id || item.id || String(index))}
            settings={taxSettings}
            onDelete={handleDeleteBill}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No bills found for this selection.
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: "#3154D4",
    paddingTop: vs(25),
    paddingBottom: vs(15),
    paddingHorizontal: s(16),
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
  },
  appTitle: {
    fontSize: rf(20),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  appSubtitle: {
    fontSize: rf(13),
    color: "#E0E7FF",
    marginTop: vs(2),
  },
  reloadButton: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(12),
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: rf(18),
    fontWeight: "700",
    marginLeft: s(8),
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: vs(10),
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: vs(4),
  },
  statLabel: {
    fontSize: rf(11),
    color: "#E0E7FF",
  },
  statDivider: {
    width: 1,
    height: vs(20),
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  // Card Styles
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: s(16),
    marginTop: vs(16),
    borderRadius: s(12),
    padding: s(16),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(6),
  },
  billNoText: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#7D8BFF",
  },
  totalText: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
  },
  timeTokenText: {
    fontSize: rf(13),
    color: COLORS.textDim,
  },
  statusPill: {
    paddingHorizontal: s(10),
    paddingVertical: vs(2),
    borderRadius: s(6),
  },
  statusPillText: {
    fontSize: rf(11),
    fontWeight: "bold",
  },
  chipsRow: {
    flexDirection: "row",
    gap: s(8),
    marginBottom: vs(15),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(8),
  },
  dot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    marginRight: s(6),
  },
  chipText: {
    fontSize: rf(12),
    color: "#FFFFFF",
    fontWeight: "500",
  },
  summaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsSubtotalText: {
    fontSize: rf(13),
    color: COLORS.textDim,
  },
  buttonsGroup: {
    flexDirection: "row",
    gap: s(8),
  },
  waButton: {
    borderWidth: 1,
    borderColor: "#48484A",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    alignItems: "center",
    justifyContent: "center",
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: "#48484A",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: rf(13),
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Expanded Content
  expandedContent: {
    marginTop: vs(15),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: vs(15),
  },
  expandedItemContainer: {
    marginBottom: vs(12),
  },
  expandedItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  expandedItemName: {
    fontSize: rf(14),
    color: "#FFFFFF",
    fontWeight: "500",
  },
  taxTypeLabel: {
    fontSize: rf(11),
    color: "#34C759",
    marginTop: vs(2),
    fontStyle: "italic",
  },
  expandedItemPrice: {
    fontSize: rf(14),
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: s(10),
  },
  verticalMargin: {
    height: vs(10),
  },
  // Print Formatting
  printContainer: {
    marginTop: vs(10),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: vs(12),
  },
  printRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(6),
  },
  printLabel: {
    fontSize: rf(14),
    color: COLORS.textDim,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  printValue: {
    fontSize: rf(14),
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  printDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: vs(10),
    borderStyle: "dashed",
  },
  printTotalLabel: {
    fontSize: rf(16),
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
  },
  printTotalValue: {
    fontSize: rf(16),
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier-Bold" : "monospace",
  },
  emptyContainer: {
    padding: s(40),
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: rf(16),
  },
});

export default DetailedBillListView;
