import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { applyTrueBillTotals } from "../../utils/billCalculator";
import { rf, s, vs } from "../../utils/responsive";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";

// --- Dashboard Logic Components ---
import ProfitEngine from "../AI intelligence tools/ProfitEngine";
import DailySalesScreen from "./DailySalesScreen";
import DashboardMenuItem from "./DashboardMenuItem";
import DeepSaleView from "./DeepSaleView";
import MonthlySalesScreen from "./MonthlySalesScreen";
import SalesSummaryCard from "./SalesSummaryCard";
import WeeklySalesScreen from "./WeeklySalesScreen";

const COLORS = {
  primary: "#4F46E5", // Indigo
  secondary: "#10B981", // Emerald
  accent: "#F59E0B", // Amber
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  white: "#FFFFFF",
};

const MainDashboardView = ({ isLockedUser }) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { t } = useLanguage();
  const { canAccessSync } = useStaffPermissions();

  const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBills, setAllBills] = useState([]);
  const [insightVisible, setInsightVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const { refreshSignal } = useRefresh();

  // State for switching views inside the same tab
  const [currentView, setCurrentView] = useState("main"); // 'main', 'daily', 'weekly', 'monthly', 'deepsale'

  const calculateStats = async (bills) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekTs = startOfWeek.getTime();

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthTs = startOfMonth.getTime();

    let daily = 0;
    let weekly = 0;
    let monthly = 0;

    const onlySales = (bills || []).filter((b) => b.isHeld !== true);

    // Mutate bill.total with true full amount dynamically
    await applyTrueBillTotals(onlySales);

    onlySales.forEach((bill) => {
      const billDate = new Date(
        bill.createdAt || bill.date || bill.billDate || bill.bill_date,
      );
      const billTs = billDate.getTime();
      const total = bill.total || 0;

      if (billTs >= todayTs) daily += total;
      if (billTs >= weekTs) weekly += total;
      if (billTs >= monthTs) monthly += total;
    });

    const newStats = {
      daily: Math.round(daily),
      weekly: Math.round(weekly),
      monthly: Math.round(monthly),
    };
    setStats(newStats);
    if (!isLockedUser) {
      AsyncStorage.setItem(
        "@cached_dash_stats",
        JSON.stringify({ stats: newStats, bills: onlySales }),
      );
    }
  };

  const fetchStats = async () => {
    if (!isLoaded) return;

    if (isLockedUser) {
      setStats({ daily: 0, weekly: 0, monthly: 0 });
      setAllBills([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const token = await getToken();
      const session = await StaffPermissionEngine.getSession();
      const finalToken = token || session?.token;

      let bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      // Recovery logic for Owners
      if (!bId && isSignedIn && finalToken) {
        try {
          const profRes = await fetch("https://billing.kravy.in/api/profile", {
            headers: { Authorization: `Bearer ${finalToken}` },
          });
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData) {
              const actualData = profData.data || profData;
              if (actualData) {
                bId = actualData._id || actualData.id || actualData.businessId;
                if (bId) {
                  await AsyncStorage.setItem(
                    "@cached_business_profile",
                    JSON.stringify(actualData),
                  );
                }
              }
            }
          }
        } catch (e) {
          console.error("Dashboard Profile Recovery Error:", e);
        }
      }

      if (!finalToken) {
        const cached = await AsyncStorage.getItem("@cached_dash_stats");
        if (cached) {
          const parsed = JSON.parse(cached);
          const cachedBills = parsed.bills || [];
          setAllBills(cachedBills);
          await calculateStats(cachedBills);
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = bId
        ? `https://billing.kravy.in/api/bill-manager?businessId=${bId}&limit=2000&t=${Date.now()}`
        : `https://billing.kravy.in/api/bill-manager?limit=2000&t=${Date.now()}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${finalToken}`,
          Cookie: `staff_token=${finalToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          const billsList = Array.isArray(data) ? data : data.bills || [];
          setAllBills(billsList);
          await calculateStats(billsList);
        }
      }
    } catch (err) {
      const cached = await AsyncStorage.getItem("@cached_dash_stats");
      if (cached) {
        const parsed = JSON.parse(cached);
        const cachedBills = parsed.bills || [];
        setAllBills(cachedBills);
        await calculateStats(cachedBills);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const sub = DeviceEventEmitter.addListener("REFRESH_DASHBOARD", fetchStats);
    return () => sub.remove();
  }, [isLoaded, isSignedIn, isLockedUser]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [isLoaded, isSignedIn, isLockedUser]),
  );

  useEffect(() => {
    if (refreshSignal > 0) fetchStats();
  }, [refreshSignal]);

  const handleProtectedAction = async (viewName) => {
    // If locked user, strictly show login modal
    if (isLockedUser) {
      setIsLoginModalVisible(true);
      return;
    }

    // Permission gate for AI tools
    if (viewName === "insight" && !canAccessSync("AI Intelligence Tools")) {
      return; // MenuItem will already show lock and handle disabled state visually
    }

    const sessionStr = await AsyncStorage.getItem("staff_session");
    if (!isSignedIn && !sessionStr) {
      setIsLoginModalVisible(true);
      return;
    }
    setCurrentView(viewName);
  };

  if (currentView === "daily")
    return (
      <DailySalesScreen
        onBack={() => setCurrentView("main")}
        allBills={allBills}
      />
    );
  if (currentView === "weekly")
    return (
      <WeeklySalesScreen
        onBack={() => setCurrentView("main")}
        allBills={allBills}
      />
    );
  if (currentView === "monthly")
    return (
      <MonthlySalesScreen
        onBack={() => setCurrentView("main")}
        allBills={allBills}
      />
    );
  if (currentView === "deepsale")
    return (
      <DeepSaleView onBack={() => setCurrentView("main")} allBills={allBills} />
    );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchStats}
          colors={[COLORS.primary]}
        />
      }
    >
      <LoginRequiredModal
        visible={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
        onSignIn={() => {
          setIsLoginModalVisible(false);
          router.push("/(auth)/sign-in");
        }}
      />

      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>{t("sales_summary")}</Text>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={COLORS.primary} size="small" />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <SalesSummaryCard
              label={t("today")}
              amount={stats.daily}
              icon="today-outline"
              color={COLORS.primary}
              isLocked={isLockedUser}
            />
            <SalesSummaryCard
              label={t("weekly")}
              amount={stats.weekly}
              icon="trending-up-outline"
              color={COLORS.secondary}
              isLocked={isLockedUser}
            />
            <SalesSummaryCard
              label={t("monthly")}
              amount={stats.monthly}
              icon="pie-chart-outline"
              color={COLORS.accent}
              isLocked={isLockedUser}
            />
          </View>
        )}
      </View>

      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>{t("analytics_reports")}</Text>
        <View style={styles.menuGrid}>
          <DashboardMenuItem
            title={t("daily_sales")}
            iconName="sunny"
            color={COLORS.primary}
            subtitle={t("performance")}
            onPress={() => handleProtectedAction("daily")}
            isLocked={isLockedUser || !canAccessSync("Dashboard")}
          />
          <DashboardMenuItem
            title={t("weekly_sales")}
            iconName="calendar"
            color={COLORS.secondary}
            subtitle={t("trends")}
            onPress={() => handleProtectedAction("weekly")}
            isLocked={isLockedUser || !canAccessSync("Dashboard")}
          />
          <DashboardMenuItem
            title={t("monthly_sales")}
            iconName="stats-chart"
            color={COLORS.accent}
            subtitle={t("growth")}
            onPress={() => handleProtectedAction("monthly")}
            isLocked={isLockedUser || !canAccessSync("Dashboard")}
          />
          <DashboardMenuItem
            title={t("bill_records")}
            iconName="receipt"
            color="#6366F1"
            subtitle={t("invoices")}
            onPress={() => handleProtectedAction("deepsale")}
            isLocked={isLockedUser || !canAccessSync("Reports")}
          />
          <DashboardMenuItem
            title="Profit Intelligence"
            iconName="bulb"
            color="#F59E0B"
            subtitle="Optimize your menu items"
            onPress={() => handleProtectedAction("insight")}
            isLocked={isLockedUser || !canAccessSync("AI Intelligence Tools")}
          />
        </View>
      </View>

      <ProfitEngine
        visible={insightVisible || currentView === "insight"}
        onClose={() => {
          setInsightVisible(false);
          setCurrentView("main");
        }}
        bills={allBills}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: s(20), paddingTop: vs(10) },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: vs(15),
  },
  summaryContainer: { marginBottom: vs(25) },
  statsRow: { flexDirection: "column", gap: vs(12) },
  analyticsSection: { marginBottom: vs(25) },
  menuGrid: { gap: vs(12) },
  loaderContainer: {
    height: vs(100),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MainDashboardView;
