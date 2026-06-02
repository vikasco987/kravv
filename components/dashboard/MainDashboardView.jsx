import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  DeviceEventEmitter,
  Modal,
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

import ProfitEngine from "../AI intelligence tools/ProfitEngine";
import CustomersView from "./CustomersView";
import DailySalesScreen from "./DailySalesScreen";
import DashboardMenuItem from "./DashboardMenuItem";
import DeepSaleView from "./DeepSaleView";
import DeleteHistoryView from "./DeleteHistoryView";
import GstReportsView from "./GstReportsView";
import MonthlySalesScreen from "./MonthlySalesScreen";
import PremiumSalesChart from "./PremiumSalesChart";
import TableManagementView from "./TableManagementView";
import TokenHistoryView from "./TokenHistoryView";
import WebDashboardWidgets from "./WebDashboardWidgets";
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
  const { canAccessSync, isOwner } = useStaffPermissions();

  const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBills, setAllBills] = useState([]);
  const [insightVisible, setInsightVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const { refreshSignal } = useRefresh();

  // Added state for Dashboard Sync
  const [activeCombos, setActiveCombos] = useState(0);
  const [activeOffers, setActiveOffers] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [effectiveId, setEffectiveId] = useState(null);

  // State for switching views inside the same tab
  const [currentView, setCurrentView] = useState("main"); // 'main', 'daily', 'weekly', 'monthly', 'deepsale'
  const currentViewRef = useRef(currentView);

  const [previousView, setPreviousView] = useState(null);
  const [renderReady, setRenderReady] = useState(false);

  useEffect(() => {
    if (currentView !== "main" && currentView !== "insight") {
      setPreviousView(currentView);
      setRenderReady(false);
      // Give the UI thread 50ms to start the modal animation before freezing JS
      const timer = setTimeout(() => setRenderReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      // Keep the view rendered for 300ms while it slides down
      const timer = setTimeout(() => setPreviousView(null), 300);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentViewRef.current !== "main") {
          setCurrentView("main");
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

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
      let staffToken = await AsyncStorage.getItem("staff_token");

      if (!staffToken) {
        const sessionStr = await AsyncStorage.getItem("staff_session");
        if (sessionStr) {
          try {
            const sessionData = JSON.parse(sessionStr);
            staffToken = sessionData.token;
          } catch (e) { }
        }
      }

      const finalToken = token || staffToken;

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

      setEffectiveId(bId || user?.id);

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

      // Fetch Active Combos & Offers for Web Dashboard
      try {
        const comboUrl = bId ? `https://billing.kravy.in/api/combos-offers?type=combo&businessId=${bId}` : `https://billing.kravy.in/api/combos-offers?type=combo`;
        const comboRes = await fetch(comboUrl, { headers: { Authorization: `Bearer ${finalToken}` } });
        if (comboRes.ok) {
          const comboData = await comboRes.json();
          const items = Array.isArray(comboData) ? comboData : (comboData?.data || []);
          setActiveCombos(items.filter(c => c.isActive).length);
        }

        const offerUrl = bId ? `https://billing.kravy.in/api/combos-offers?type=offer&businessId=${bId}` : `https://billing.kravy.in/api/combos-offers?type=offer`;
        const offerRes = await fetch(offerUrl, { headers: { Authorization: `Bearer ${finalToken}` } });
        if (offerRes.ok) {
          const offerData = await offerRes.json();
          const offers = Array.isArray(offerData) ? offerData : (offerData?.data || offerData?.offers || []);
          setActiveOffers(offers.filter(o => o.isActive).length);
        }

        const orderUrl = bId ? `https://billing.kravy.in/api/orders?active=true&includeDeleted=true&businessId=${bId}` : `https://billing.kravy.in/api/orders?active=true&includeDeleted=true`;
        const orderRes = await fetch(orderUrl, { headers: { Authorization: `Bearer ${finalToken}` } });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const activeOrds = Array.isArray(orderData) ? orderData : (orderData?.data || []);
          setActiveOrderCount(activeOrds.length);
        }
      } catch (e) {
        console.log("Combo/Offer fetch error", e);
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

    const sessionStr = await AsyncStorage.getItem("staff_session");
    if (!isSignedIn && !sessionStr) {
      setIsLoginModalVisible(true);
      return;
    }
    setCurrentView(viewName);
  };

  const handleDeleteAllBills = async () => {
    if (isLockedUser) {
      setIsLoginModalVisible(true);
      return;
    }

    Alert.alert(
      "Clear All Bills?",
      "Are you sure you want to delete ALL bill history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await getToken();
              const staffToken = await AsyncStorage.getItem("staff_token");
              const finalToken = token || staffToken;

              if (!finalToken) {
                Alert.alert("Error", "Authentication required.");
                setLoading(false);
                return;
              }

              const res = await fetch(
                "https://billing.kravy.in/api/bill-manager",
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${finalToken}`,
                  },
                },
              );

              if (res.ok) {
                Alert.alert("Success", "All bills deleted successfully.");
                fetchStats(); // Refresh dashboard
              } else {
                Alert.alert("Error", "Failed to clear bill history.");
              }
            } catch (e) {
              console.error("Delete all error:", e);
              Alert.alert("Error", "Something went wrong.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleOpenDeleteHistory = () => {
    if (isLockedUser) {
      setIsLoginModalVisible(true);
      return;
    }
    setCurrentView("deleteHistory");
  };

  const renderSubView = () => {
    const activeModalView = (currentView !== "main" && currentView !== "insight") ? currentView : previousView;

    if (!renderReady && activeModalView) {
      return (
        <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (activeModalView === "daily") return <DailySalesScreen onBack={() => setCurrentView("main")} allBills={allBills} />;
    if (activeModalView === "weekly") return <WeeklySalesScreen onBack={() => setCurrentView("main")} allBills={allBills} />;
    if (activeModalView === "monthly") return <MonthlySalesScreen onBack={() => setCurrentView("main")} allBills={allBills} />;
    if (activeModalView === "deepsale") return <DeepSaleView onBack={() => setCurrentView("main")} allBills={allBills} />;
    if (activeModalView === "token_history") return <TokenHistoryView onClose={() => setCurrentView("main")} allBills={allBills} />;
    if (activeModalView === "gst_reports") return <GstReportsView onClose={() => setCurrentView("main")} allBills={allBills} userProfile={user?.profile || user?.companyProfile || user} />;
    if (activeModalView === "customers") return <CustomersView onClose={() => setCurrentView("main")} />;
    if (activeModalView === "tables") return <TableManagementView onClose={() => setCurrentView("main")} />;
    if (activeModalView === "deleteHistory")
      return (
        <DeleteHistoryView
          onBack={() => setCurrentView("main")}
          bills={allBills}
          onRefresh={fetchStats}
        />
      );
    return null;
  };

  const dashboardContent = useMemo(() => (
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

      <PremiumSalesChart bills={allBills} />

      <WebDashboardWidgets
        allBills={allBills}
        activeCombosCount={activeCombos}
        activeOffersCount={activeOffers}
        activeOrderCount={activeOrderCount}
        effectiveId={effectiveId || user?.id}
        setCurrentView={setCurrentView}
      >
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>{t("analytics_reports")}</Text>
          <View style={styles.menuGrid}>
            <DashboardMenuItem
              title={t("daily_sales")}
              iconName="sunny"
              color={COLORS.primary}
              subtitle={t("performance")}
              onPress={() => handleProtectedAction("daily")}
              isLocked={isLockedUser}
            />
            <DashboardMenuItem
              title={t("weekly_sales")}
              iconName="calendar"
              color={COLORS.secondary}
              subtitle={t("trends")}
              onPress={() => handleProtectedAction("weekly")}
              isLocked={isLockedUser}
            />
            <DashboardMenuItem
              title={t("monthly_sales")}
              iconName="stats-chart"
              color={COLORS.accent}
              subtitle={t("growth")}
              onPress={() => handleProtectedAction("monthly")}
              isLocked={isLockedUser}
            />
            <DashboardMenuItem
              title={t("bill_records")}
              iconName="receipt"
              color="#6366F1"
              subtitle={t("invoices")}
              onPress={() => handleProtectedAction("deepsale")}
              isLocked={isLockedUser}
            />
            <DashboardMenuItem
              title="Profit Intelligence"
              iconName="bulb"
              color="#F59E0B"
              subtitle="Optimize your menu items"
              onPress={() => handleProtectedAction("insight")}
              isLocked={isLockedUser}
            />
            <DashboardMenuItem
              title="Delete Bills History"
              iconName="trash"
              color="#EF4444"
              subtitle="Clear all transaction history"
              onPress={handleOpenDeleteHistory}
              isLocked={isLockedUser}
            />
          </View>
        </View>
      </WebDashboardWidgets>

    </ScrollView>
  ), [
    refreshing, isLoginModalVisible, loading, stats, isLockedUser, allBills, activeCombos, activeOffers, effectiveId, t
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Modal
        visible={currentView !== "main" && currentView !== "insight"}
        animationType="slide"
        onRequestClose={() => setCurrentView("main")}
      >
        {renderSubView()}
      </Modal>

      {dashboardContent}

      <ProfitEngine
        visible={insightVisible || currentView === "insight"}
        onClose={() => {
          setInsightVisible(false);
          setCurrentView("main");
        }}
        bills={allBills}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: s(10), paddingBottom: vs(20), paddingTop: vs(10) },
  sectionTitle: {
    fontSize: rf(13),
    fontWeight: "700",
    color: '#334155',
    marginBottom: vs(10),
    marginLeft: s(4),
  },
  summaryContainer: { marginBottom: vs(25) },
  statsRow: {
    flexDirection: "column",
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  analyticsSection: { marginBottom: vs(25) },
  menuGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  loaderContainer: {
    height: vs(100),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MainDashboardView;
