import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { applyTrueBillTotals } from "../../utils/billCalculator";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import DetailedBillListView from "./DetailedBillListView";

const COLORS = {
  primary: "#FF9800",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#333333",
  lightText: "#666666",
  borderColor: "#E0E0E0",
  success: "#4CAF50",
};

const SalesStat = ({ label, value, icon, color, isMain = false }) => (
  <View style={enhancedStyles.statContainer}>
    <Ionicons name={icon} size={isMain ? rf(24) : rf(18)} color={color} />
    <Text
      style={[
        enhancedStyles.statValue,
        {
          color: isMain ? COLORS.text : COLORS.lightText,
          fontWeight: isMain ? "bold" : "500",
        },
      ]}
    >
      {value}
    </Text>
    <Text style={enhancedStyles.statLabel}>{label}</Text>
  </View>
);

const WeeklySalesCard = ({ weekLabel, numberOfBills, totalSales, t }) => (
  <View style={enhancedStyles.card}>
    <View style={enhancedStyles.cardHeader}>
      <Ionicons
        name="stats-chart-outline"
        size={rf(20)}
        color={COLORS.primary}
        style={{ marginRight: s(8) }}
      />
      <Text style={enhancedStyles.cardDate}>{weekLabel}</Text>
    </View>
    <View style={enhancedStyles.cardBody}>
      <SalesStat
        label={t("bills") || "Bills"}
        value={numberOfBills.toLocaleString()}
        icon="receipt-outline"
        color={COLORS.lightText}
      />
      <SalesStat
        label={t("weekly_sales_label") || "Weekly Sales"}
        value={`₹${totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
        icon="wallet-outline"
        color={COLORS.success}
        isMain={true}
      />
    </View>
  </View>
);

const TableListView = ({ data, refreshing, onRefresh, t, onRowPress }) => (
  <View style={enhancedStyles.tableContainer}>
    <View style={enhancedStyles.tableHeaderRow}>
      <Text
        style={[enhancedStyles.tableCellHeader, { flex: 3, textAlign: "left" }]}
      >
        {t("week") || "Week"}
      </Text>
      <Text style={enhancedStyles.tableCellHeader}>
        {t("bills") || "Bills"}
      </Text>
      <Text
        style={[
          enhancedStyles.tableCellHeader,
          { flex: 2, textAlign: "right" },
        ]}
      >
        {t("sales") || "Sales"}
      </Text>
    </View>
    <FlatList
      data={data}
      keyExtractor={(item) => item.weekLabel}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
      renderItem={({ item, index }) => (
        <TouchableOpacity
          onPress={() => onRowPress && onRowPress(item.sortKey)}
          activeOpacity={0.8}
          style={[
            enhancedStyles.tableRow,
            index % 2 === 0 ? enhancedStyles.evenRow : enhancedStyles.oddRow,
          ]}
        >
          <Text
            style={[
              enhancedStyles.tableCell,
              { flex: 3, textAlign: "left", fontWeight: "bold" },
            ]}
          >
            {item.weekLabel}
          </Text>
          <Text style={enhancedStyles.tableCell}>
            {item.numberOfBills.toLocaleString()}
          </Text>
          <Text
            style={[
              enhancedStyles.tableCell,
              {
                flex: 2,
                color: COLORS.success,
                fontWeight: "bold",
                textAlign: "right",
              },
            ]}
          >
            ₹
            {item.totalSales.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <View style={enhancedStyles.emptyContainer}>
          <Text style={enhancedStyles.emptyText}>
            {t("no_sales_found_weekly") ||
              "No weekly sales found for Table View."}
          </Text>
        </View>
      )}
    />
  </View>
);

export default function WeeklySalesScreen({ onBack, allBills }) {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  const { refreshSignal, triggerRefresh } = useRefresh();
  const { t } = useLanguage();

  const [rawBills, setRawBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("card");
  const [selectedWeekReport, setSelectedWeekReport] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedWeekReport) {
          setSelectedWeekReport(null);
          return true;
        }
        if (onBack) {
          onBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [selectedWeekReport, onBack])
  );

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const groupedSales = useMemo(() => {
    const grouped = {};

    rawBills.forEach((bill) => {
      const date = new Date(bill.createdAt);
      const week = getWeekNumber(date);
      const key = `${date.getFullYear()}-W${week.toString().padStart(2, "0")}`;
      if (!grouped[key])
        grouped[key] = {
          weekLabel: `${t("week") || "Week"} ${week} (${date.getFullYear()})`,
          numberOfBills: 0,
          totalSales: 0,
          sortKey: key,
        };
      grouped[key].numberOfBills += 1;
      grouped[key].totalSales += bill.total || 0;
    });
    return Object.values(grouped).sort((a, b) =>
      a.sortKey < b.sortKey ? 1 : -1,
    );
  }, [rawBills, t]);

  const totalGrandSales = useMemo(
    () => rawBills.reduce((acc, bill) => acc + (bill.total || 0), 0),
    [rawBills],
  );

  useEffect(() => {
    if (allBills && allBills.length > 0) {
      setRawBills(allBills.filter((b) => b.isHeld !== true));
      setLoading(false);
      setRefreshing(false);
    } else {
      fetchBills();
    }
  }, [allBills, isLoaded, isSignedIn, user]);

  const fetchBills = async (silent = false) => {
    if (!isLoaded) return;
    if (allBills) return;

    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;

      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      if (!finalToken && !bId) {
        setRawBills([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = bId
        ? `https://billing.kravy.in/api/bill-manager?businessId=${bId}`
        : "https://billing.kravy.in/api/bill-manager";
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${finalToken}`,
          Cookie: `staff_token=${finalToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const billsList = Array.isArray(data) ? data : data.bills || [];
        await applyTrueBillTotals(billsList);
        setRawBills(billsList.filter((b) => b.isHeld !== true));
      }
    } catch (err) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : String(err);
      console.warn("WeeklySales Fetch Error:", errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (refreshSignal > 0) {
      setRefreshing(true);
    }
  }, [refreshSignal]);

  if (selectedWeekReport) {
    return (
      <DetailedBillListView
        onBack={() => setSelectedWeekReport(null)}
        allBills={rawBills}
        filterType="weekly"
        filterKey={selectedWeekReport}
        title={`Bills for ${selectedWeekReport.replace("-W", " Week ")}`}
        onRefresh={() => fetchBills(true)}
      />
    );
  }

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1, justifyContent: "center" }}
      />
    );

  return (
    <SafeAreaView style={enhancedStyles.container}>
      <View style={enhancedStyles.pageHeader}>
        <View style={enhancedStyles.headerTopRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={enhancedStyles.backButton}
          >
            <Ionicons name="arrow-back" size={rf(24)} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={enhancedStyles.title}>
            {t("weekly_sales_report") || "Weekly Sales Report"} 📈
          </Text>
        </View>
        <Text style={enhancedStyles.subtitle}>
          {t("all_time_sales") || "All Time Sales"}:{" "}
          <Text style={enhancedStyles.totalSalesValue}>
            ₹{totalGrandSales.toLocaleString("en-IN")}
          </Text>
        </Text>

        <View style={enhancedStyles.controlButtons}>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === "card" ? "table" : "card")}
            style={enhancedStyles.modeButton}
          >
            <Ionicons
              name={viewMode === "card" ? "list-outline" : "grid-outline"}
              size={rf(22)}
              color={COLORS.primary}
            />
            <Text style={enhancedStyles.modeText}>
              {viewMode === "card"
                ? t("table_view") || "Table View"
                : t("card_view") || "Card View"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: vs(10) }}>
        {viewMode === "card" ? (
          <FlatList
            data={groupedSales}
            keyExtractor={(item) => item.weekLabel}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => triggerRefresh()}
                colors={[COLORS.primary]}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedWeekReport(item.sortKey)}
                activeOpacity={0.8}
              >
                <WeeklySalesCard
                  weekLabel={item.weekLabel}
                  numberOfBills={item.numberOfBills}
                  totalSales={item.totalSales}
                  t={t}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={enhancedStyles.emptyContainer}>
                <Ionicons
                  name="close-circle-outline"
                  size={rf(50)}
                  color={COLORS.lightText}
                />
                <Text style={enhancedStyles.emptyText}>
                  {t("no_sales_records") || "No sales records found yet."}
                </Text>
              </View>
            )}
          />
        ) : (
          <TableListView
            data={groupedSales}
            refreshing={refreshing}
            onRefresh={() => triggerRefresh()}
            t={t}
            onRowPress={(key) => setSelectedWeekReport(key)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const enhancedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageHeader: {
    padding: s(16),
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    elevation: 2,
    paddingTop: vs(40),
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(12),
  },
  backButton: { padding: s(4) },
  reloadButton: { padding: s(4) },
  title: {
    fontSize: rf(20),
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  subtitle: {
    fontSize: rf(16),
    color: COLORS.lightText,
    textAlign: "center",
    marginBottom: vs(15),
  },
  totalSalesValue: { fontWeight: "bold", color: "#4CAF50" },
  controlButtons: { flexDirection: "row", justifyContent: "center" },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E5",
    paddingVertical: vs(8),
    paddingHorizontal: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  modeText: {
    marginLeft: s(8),
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: rf(14),
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: s(16),
    marginVertical: vs(8),
    borderRadius: s(12),
    padding: s(16),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: vs(10),
    marginBottom: vs(12),
  },
  cardDate: { fontSize: rf(16), fontWeight: "600", color: COLORS.text },
  cardBody: { flexDirection: "row", justifyContent: "space-around" },
  statContainer: { alignItems: "center" },
  statValue: { fontSize: rf(17), marginTop: vs(4) },
  statLabel: {
    fontSize: rf(11),
    color: "#999",
    marginTop: vs(2),
    textTransform: "uppercase",
  },
  tableContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    margin: s(16),
    borderRadius: s(12),
    overflow: "hidden",
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    padding: s(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  tableCellHeader: {
    fontWeight: "bold",
    color: COLORS.lightText,
    fontSize: rf(12),
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: s(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "center",
  },
  tableCell: { fontSize: rf(13), color: COLORS.text },
  evenRow: { backgroundColor: "#fff" },
  oddRow: { backgroundColor: "#FBFCFD" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: vs(100),
  },
  emptyText: { marginTop: vs(12), fontSize: rf(16), color: COLORS.lightText },
});
