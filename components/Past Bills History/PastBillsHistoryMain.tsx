import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Download } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { BillTable } from "./BillTable";
import { FilterSection } from "./FilterSection";
import { StatsCards } from "./StatsCards";

interface PastBillsHistoryMainProps {
  onBack: () => void;
}

const PastBillsHistoryMain = ({ onBack }: PastBillsHistoryMainProps) => {
  const { getToken, isSignedIn } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [colFilters, setColFilters] = useState({
    billNumber: "",
    orderType: "All Types",
    paymentModeFilter: "All Payments",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];
    return { start: firstDay, end: today };
  });

  useEffect(() => {
    const loadData = async () => {
      // 1. Instantly load from cache to make UI fast
      try {
        const cachedBills = await AsyncStorage.getItem("@cached_dash_stats");
        if (cachedBills) {
          const parsed = JSON.parse(cachedBills);
          if (parsed.bills && parsed.bills.length > 0) {
            const mapped = parsed.bills.map((b: any) => ({ ...b, isOrder: false }));
            setBills(mapped);
            setLoading(false); // Remove loader instantly
          }
        }
        const prof = await AsyncStorage.getItem("@cached_business_profile");
        if (prof) setBusiness(JSON.parse(prof));
      } catch (e) { }

      // 2. Fetch fresh data in background
      fetchBills(true);
      fetchProfile();
    };
    loadData();
  }, []);

  const fetchProfile = async () => {
    try {
      let token = await getToken();
      if (!token) {
        const staffSession = await AsyncStorage.getItem("staff_session");
        if (staffSession) token = JSON.parse(staffSession).token || "";
      }
      const res = await fetch("https://billing.kravy.in/api/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
        AsyncStorage.setItem("@cached_business_profile", JSON.stringify(data));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchBills = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [billsRes, ordersRes, profileRes] = await Promise.all([
        fetch("https://billing.kravy.in/api/bill-manager", { headers }),
        fetch("https://billing.kravy.in/api/orders", { headers }),
        fetch("https://billing.kravy.in/api/profile", { headers }),
      ]);

      const prof = profileRes.ok ? await profileRes.json() : business;
      if (prof) setBusiness(prof);

      let combined: any[] = [];
      if (billsRes.ok) {
        const bData = await billsRes.json();
        combined = (bData.bills ?? []).map((b: any) => ({ ...b, isOrder: false }));
      }

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        const globalRate = prof?.taxRate ?? 5;
        const taxActive = prof?.taxEnabled ?? true;

        const activeOrders = oData
          .filter((o: any) => o.status !== "COMPLETED" && !o.isDeleted)
          .map((o: any) => {
            const items = Array.isArray(o.items) ? o.items : [];
            let calcTax = 0;
            let calcSubtotal = 0;

            items.forEach((it: any) => {
              const q = Number(it.quantity || it.qty || 0);
              const p = Number(it.price || it.rate || 0);
              const lineTotal = q * p;
              const rate = it.gst ?? (taxActive ? globalRate : 0);

              if (it.taxStatus === "With Tax") {
                const taxable = lineTotal / (1 + rate / 100);
                calcTax += lineTotal - taxable;
                calcSubtotal += taxable;
              } else {
                calcTax += (lineTotal * rate) / 100;
                calcSubtotal += lineTotal;
              }
            });

            return {
              id: o.id,
              billNumber: `ORD-${o.id.slice(-4).toUpperCase()}`,
              createdAt: o.createdAt,
              total: o.total,
              subtotal: calcSubtotal,
              tax: calcTax,
              paymentMode: "Pending",
              paymentStatus: "Pending",
              customerName: o.customerName || "Walk-in",
              customerPhone: o.customerPhone,
              isHeld: false,
              tableName: o.table?.name || "Counter",
              isOrder: true,
              orderStatus: o.status,
              items: o.items,
              tokenNumber: o.tokenNumber,
              kotNumbers: o.kotNumbers,
            };
          });
        combined = [...combined, ...activeOrders];
      }

      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBills(combined);
    } catch (err) {
      console.log("Error fetching bills", err);
    } finally {
      setLoading(false);
    }
  };

  const isFilterActive = !!(colFilters.billNumber || colFilters.orderType !== "All Types" || colFilters.paymentModeFilter !== "All Payments");

  const filteredBills = bills.filter((b) => {
    const q = colFilters.billNumber.toLowerCase();
    const mGlobal = !q || (
      (b.billNumber?.toLowerCase() || "").includes(q) ||
      (b.customerName?.toLowerCase() || "").includes(q) ||
      (b.customerPhone || "").includes(q) ||
      (b.tableName?.toLowerCase() || "").includes(q)
    );

    const matchesType = colFilters.orderType === "All Types" ||
      (colFilters.orderType === "Counter" && (b.tableName || "POS") === "POS") ||
      (colFilters.orderType === "Takeaway" && (b.tableName || "").includes("TAKEAWAY")) ||
      (colFilters.orderType === "Dine-in" && (b.tableName || "").startsWith("Table"));

    const matchesPayment = colFilters.paymentModeFilter === "All Payments" ||
      (b.paymentMode?.toLowerCase() === colFilters.paymentModeFilter.toLowerCase());

    const bDate = new Date(b.createdAt).toISOString().split("T")[0];
    const matchesDate = (!dateRange.start || bDate >= dateRange.start) && (!dateRange.end || bDate <= dateRange.end);

    return mGlobal && matchesType && matchesPayment && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [colFilters, dateRange]);

  const handleExport = async () => {
    try {
      const header = "S.No,Date,Time,Bill No,Token,Type,Items,Customer,Phone,Subtotal,Discount,GST,Net Total,Payment Mode,Status\n";
      const rows = filteredBills.map((b, idx) => {
        const dt = new Date(b.createdAt);
        const dateStr = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/,/g, '');
        const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
        const typeLabel = (b.tableName || "POS") === "POS" ? "Counter" : b.tableName;
        const itemsCount = b.items?.length || 0;
        const token = b.tokenNumber ? `#${b.tokenNumber}` : (b.kotNumbers && b.kotNumbers.length > 0 ? `KOT-${b.kotNumbers[0]}` : "—");
        const status = b.isOrder ? b.orderStatus : (b.paymentStatus || "Paid");

        return [
          idx + 1,
          dateStr,
          timeStr,
          b.billNumber || "",
          token,
          typeLabel,
          itemsCount,
          (b.customerName || "Walk-in").replace(/,/g, ' '),
          b.customerPhone || "",
          b.subtotal || b.total,
          b.discountAmount || 0,
          b.tax || 0,
          b.total,
          b.paymentMode || "Cash",
          status
        ].join(',');
      }).join("\n");

      const csvData = header + rows;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Kravy_Bills_Report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

      if (!docDir) {
        alert("File system is not available on this device.");
        return;
      }

      const fileUri = docDir + "Kravy_Bills_Report.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvData);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export Bills" });
      } else {
        alert("Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export bills.");
    }
  };

  const totalRevenue = filteredBills.filter((b) => !b.isOrder && b.paymentStatus?.toLowerCase() === "paid").reduce((s, b) => s + b.total, 0);
  const paidBillsCount = filteredBills.filter((b) => !b.isOrder && b.paymentStatus?.toLowerCase() === "paid").length;
  const pendingBillsCount = filteredBills.filter((b) => b.paymentStatus?.toLowerCase() === "pending" || b.isHeld).length;
  const cancelledBillsCount = filteredBills.filter((b) => b.paymentStatus?.toLowerCase() === "cancelled").length;

  const cashRevenue = filteredBills.filter((b) => !b.isOrder && b.paymentMode?.toLowerCase() === "cash" && b.paymentStatus?.toLowerCase() === "paid").reduce((s, b) => s + b.total, 0);
  const upiRevenue = filteredBills.filter((b) => !b.isOrder && (b.paymentMode?.toLowerCase() === "upi" || b.paymentMode?.toLowerCase() === "phonepe" || b.paymentMode?.toLowerCase() === "gpay") && b.paymentStatus?.toLowerCase() === "paid").reduce((s, b) => s + b.total, 0);
  const walletRevenue = filteredBills.filter((b) => !b.isOrder && b.paymentMode?.toLowerCase() === "wallet" && b.paymentStatus?.toLowerCase() === "paid").reduce((s, b) => s + b.total, 0);

  const counterCount = filteredBills.filter((b) => (b.tableName || "POS") === "POS").length;
  const takeawayCount = filteredBills.filter((b) => (b.tableName || "").includes("TAKEAWAY")).length;
  const dineInCount = filteredBills.filter((b) => (b.tableName || "").startsWith("Table")).length;
  const activeOrderCount = filteredBills.filter((b) => b.isOrder).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: s(16), flex: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeft size={rf(20)} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Bill Manager</Text>
            <Text style={styles.subtitle}>
              {isFilterActive ? `Showing ${filteredBills.length} records` : `All transactions · ${bills.length} total records`}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Download size={rf(14)} color="white" />
          <Text style={styles.exportBtnText}>Export Excel</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Fetching Records...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <StatsCards
            totalRevenue={totalRevenue}
            paidBillsCount={paidBillsCount}
            pendingBillsCount={pendingBillsCount}
            cancelledBillsCount={cancelledBillsCount}
            cashRevenue={cashRevenue}
            upiRevenue={upiRevenue}
            walletRevenue={walletRevenue}
            dineInCount={dineInCount}
            takeawayCount={takeawayCount}
            counterCount={counterCount}
            activeOrderCount={activeOrderCount}
            totalBills={filteredBills.length}
          />

          <FilterSection
            colFilters={colFilters}
            setColFilters={setColFilters}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onApply={fetchBills}
          />

          <BillTable
            bills={filteredBills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
            business={business}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredBills.length}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: s(16),
    paddingTop: (Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0) + s(16),
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(10),
    gap: s(6),
  },
  exportBtnText: {
    color: "white",
    fontSize: rf(11),
    fontWeight: "800",
  },
  title: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: rf(11),
    fontWeight: "600",
    color: "#64748B",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: vs(12),
    fontSize: rf(14),
    fontWeight: "700",
    color: "#64748B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: s(16),
    paddingBottom: vs(80),
  },
});

export default PastBillsHistoryMain;
