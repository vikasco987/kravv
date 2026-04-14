import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

// --- Dashboard Logic Components ---
import ProfitEngine from "../AI intelligence tools/ProfitEngine";
import DailySalesScreen from "./DailySalesScreen";
import DashboardMenuItem from "./DashboardMenuItem";
import DeepSaleView from "./DeepSaleView";
import MonthlySalesScreen from "./MonthlySalesScreen";
import SalesSummaryCard from "./SalesSummaryCard";
import WeeklySalesScreen from "./WeeklySalesScreen";

const COLORS = {
    primary: '#4F46E5', // Indigo
    secondary: '#10B981', // Emerald
    accent: '#F59E0B', // Amber
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

const MainDashboardView = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();
    const { t } = useLanguage();

    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [allBills, setAllBills] = useState([]);
    const [insightVisible, setInsightVisible] = useState(false);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);
    const { refreshSignal } = useRefresh();

    const [hasDashAccess, setHasDashAccess] = useState(true);
    const [hasIntelAccess, setHasIntelAccess] = useState(true);
    const [hasReportsAccess, setHasReportsAccess] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (isSignedIn) {
                setHasDashAccess(true);
                setIsStaffSignedIn(false);
                return;
            }

            const sessionStr = await AsyncStorage.getItem('staff_session');
            if (sessionStr) {
                setIsStaffSignedIn(true);
                const dash = await StaffPermissionEngine.hasCategoryAccess("Dashboard", false);
                const intel = await StaffPermissionEngine.hasCategoryAccess("Intelligence", false);
                const reports = await StaffPermissionEngine.hasCategoryAccess("Reports", false);
                setHasDashAccess(dash);
                setHasIntelAccess(intel);
                setHasReportsAccess(reports);
            } else {
                setIsStaffSignedIn(false);
                setHasDashAccess(true);
                setHasIntelAccess(true);
                setHasReportsAccess(true);
            }
        };
        checkAccess();
    }, [isSignedIn, refreshSignal]);

    // State for switching views inside the same tab
    const [currentView, setCurrentView] = useState("main"); // 'main', 'daily', 'weekly', 'monthly', 'deepsale'

    const fetchStats = async () => {
        if (!isLoaded) return;

        try {
            if (!isSignedIn && !isStaffSignedIn) {
                setStats({ daily: 0, weekly: 0, monthly: 0 });
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (stats.daily === 0) {
                setLoading(true);
                const cached = await AsyncStorage.getItem('@cached_dash_stats');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setStats(parsed.stats);
                    setAllBills(parsed.bills || []);
                    setLoading(false);
                }
            } else {
                setRefreshing(true);
            }

            const authToken = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;

            // Use helper to get correct business ID
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

            // Use staff token if clerk token is not available
            const finalToken = authToken || staffSession?.token;

            if (!finalToken && !bId) {
                setStats({ daily: 0, weekly: 0, monthly: 0 });
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const url = bId ? `https://billing.kravy.in/api/bill-manager?businessId=${bId}` : "https://billing.kravy.in/api/bill-manager";
            const res = await fetch(url, {
                headers: finalToken ? { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` } : { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                const billsList = Array.isArray(data) ? data : (data.bills || []);
                setAllBills(billsList);
                calculateStats(billsList);
            }
        } catch {
            const cached = await AsyncStorage.getItem('@cached_dash_stats');
            if (cached) {
                const parsed = JSON.parse(cached);
                setStats(parsed.stats);
                setAllBills(parsed.bills || []);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (bills) => {
        const now = new Date();

        // Today boundary
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const todayTs = today.getTime();

        // Weekly boundary (Starts from Monday 00:00)
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const weekTs = startOfWeek.getTime();

        // Monthly boundary (Starts from 1st 00:00)
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthTs = startOfMonth.getTime();

        let daily = 0;
        let weekly = 0;
        let monthly = 0;

        const onlySales = (bills || []).filter(b => b.isHeld !== true);

        onlySales.forEach(bill => {
            const billDate = new Date(bill.createdAt);
            const billTs = billDate.getTime();
            const total = Number(bill.total) || 0;

            if (billTs >= todayTs) daily += total;
            if (billTs >= weekTs) weekly += total;
            if (billTs >= monthTs) monthly += total;
        });

        const newStats = {
            daily: Math.round(daily),
            weekly: Math.round(weekly),
            monthly: Math.round(monthly)
        };
        setStats(newStats);
        AsyncStorage.setItem('@cached_dash_stats', JSON.stringify({ stats: newStats, bills: onlySales }));
    };

    useEffect(() => {
        fetchStats();
    }, [isLoaded, isSignedIn, isStaffSignedIn]);

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchStats();
        }
    }, [refreshSignal]);

    const handleProtectedAction = (viewName) => {

        if (!isSignedIn && !isStaffSignedIn) {
            setIsLoginModalVisible(true);
        } else {
            // Permission checks
            if (!isSignedIn) {
                if (viewName === "insight" && !hasIntelAccess) {
                    Alert.alert("Restricted", "You don't have permission to access Intelligence tools.");
                    return;
                }
                const reportViews = ["daily", "weekly", "monthly", "inventory"];
                if (reportViews.includes(viewName) && !hasReportsAccess) {
                    Alert.alert("Restricted", "You don't have permission to view Sales Reports.");
                    return;
                }
            }
            setCurrentView(viewName);
        }
    };

    // Render Protected Access View
    if (!hasDashAccess && !isSignedIn) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: s(30) }}>
                <View style={{ backgroundColor: '#FEE2E2', padding: s(20), borderRadius: s(100), marginBottom: vs(20) }}>
                    <Ionicons name="lock-closed" size={s(40)} color="#EF4444" />
                </View>
                <Text style={{ fontSize: rf(20), fontWeight: '800', color: COLORS.text, textAlign: 'center' }}>
                    Access Restricted
                </Text>
                <Text style={{ fontSize: rf(14), color: COLORS.textLight, textAlign: 'center', marginTop: vs(10), lineHeight: vs(20) }}>
                    You don't have permission to view Dashboard Analytics. Please contact your administrator.
                </Text>
            </View>
        );
    }

    // Render Conditional View
    if (currentView === "daily") return <DailySalesScreen onBack={() => setCurrentView("main")} />;
    if (currentView === "weekly") return <WeeklySalesScreen onBack={() => setCurrentView("main")} />;
    if (currentView === "monthly") return <MonthlySalesScreen onBack={() => setCurrentView("main")} />;
    if (currentView === "deepsale") return <DeepSaleView onBack={() => setCurrentView("main")} />;

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={fetchStats} colors={[COLORS.primary]} />
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

            {/* Sales Summary Cards */}
            <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>{t('sales_summary')}</Text>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    </View>
                ) : (
                    <View style={styles.statsRow}>
                        <SalesSummaryCard label={t('today')} amount={stats.daily} icon="today-outline" color={COLORS.primary} />
                        <SalesSummaryCard label={t('weekly')} amount={stats.weekly} icon="trending-up-outline" color={COLORS.secondary} />
                        <SalesSummaryCard label={t('monthly')} amount={stats.monthly} icon="pie-chart-outline" color={COLORS.accent} />
                    </View>
                )}
            </View>

            {/* Analytics Section */}
            <View style={styles.analyticsSection}>
                <Text style={styles.sectionTitle}>{t('analytics_reports')}</Text>
                <View style={styles.menuGrid}>
                    <DashboardMenuItem
                        title={t('daily_sales')}
                        iconName="sunny"
                        color={COLORS.primary}
                        subtitle={t('performance')}
                        onPress={() => handleProtectedAction("daily")}
                    />
                    <DashboardMenuItem
                        title={t('weekly_sales')}
                        iconName="calendar"
                        color={COLORS.secondary}
                        subtitle={t('trends')}
                        onPress={() => handleProtectedAction("weekly")}
                    />
                    <DashboardMenuItem
                        title={t('monthly_sales')}
                        iconName="stats-chart"
                        color={COLORS.accent}
                        subtitle={t('growth')}
                        onPress={() => handleProtectedAction("monthly")}
                    />
                    <DashboardMenuItem
                        title={t('bill_records')}
                        iconName="receipt"
                        color="#6366F1"
                        subtitle={t('invoices')}
                        onPress={() => handleProtectedAction("deepsale")}
                    />
                    <DashboardMenuItem
                        title="Profit Intelligence"
                        iconName="bulb"
                        color="#F59E0B"
                        subtitle="Optimize your menu items"
                        onPress={() => handleProtectedAction("insight")}
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
    scrollContent: {
        padding: s(20),
        paddingTop: vs(10),
    },
    sectionTitle: {
        fontSize: rf(18),
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: vs(15),
    },
    summaryContainer: {
        marginBottom: vs(25),
    },
    statsRow: {
        flexDirection: 'column',
        gap: vs(12),
    },
    analyticsSection: {
        marginBottom: vs(25),
    },
    menuGrid: {
        gap: vs(12),
    },
    loaderContainer: {
        height: vs(100),
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MainDashboardView;
