import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

// --- Dashboard Logic Components ---
import DailySalesScreen from "./DailySalesScreen";
import DashboardMenuItem from "./DashboardMenuItem";
import DeepSaleView from "./DeepSaleView";
import MonthlySalesScreen from "./MonthlySalesScreen";
import ProfitEngine from "./ProfitEngine";
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
    const { isLoaded, isSignedIn } = useUser();
    const { t } = useLanguage();

    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [allBills, setAllBills] = useState([]);
    const [insightVisible, setInsightVisible] = useState(false);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const { refreshSignal } = useRefresh();

    // State for switching views inside the same tab
    const [currentView, setCurrentView] = useState("main"); // 'main', 'daily', 'weekly', 'monthly', 'deepsale'

    const fetchStats = async () => {
        if (!isLoaded) return;

        try {
            if (!isSignedIn) {
                setStats({ daily: 0, weekly: 0, monthly: 0 });
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (stats.daily === 0) setLoading(true);
            else setRefreshing(true);

            const authToken = await getToken();

            if (!authToken) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const res = await fetch("https://billing.kravy.in/api/bill-manager", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data.bills) {
                        setAllBills(data.bills);
                        calculateStats(data.bills);
                    }
                } else {
                    await res.text();
                }
            }
        } catch {
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (bills) => {

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let daily = 0;
        let weekly = 0;
        let monthly = 0;

        const onlySales = (bills || []).filter(b => b.isHeld !== true);

        onlySales.forEach(bill => {
            const billDate = new Date(bill.createdAt);
            const total = bill.total || 0;

            if (billDate >= startOfToday) daily += total;
            if (billDate >= startOfWeek) weekly += total;
            if (billDate >= startOfMonth) monthly += total;
        });

        setStats({ daily, weekly, monthly });
    };

    useEffect(() => {
        fetchStats();
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchStats();
        }
    }, [refreshSignal]);

    const handleProtectedAction = (viewName) => {

        if (!isSignedIn) {
            setIsLoginModalVisible(true);
        } else {
            setCurrentView(viewName);
        }
    };

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
