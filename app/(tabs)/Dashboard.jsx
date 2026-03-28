import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { useRefresh } from "../../context/RefreshContext";
import { useLanguage } from "../../context/LanguageContext";
import ProfitEngine from "../../components/profit-engine/ProfitEngine";


// --- Constants ---
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

// --- Summary Card Component ---
const SalesSummaryCard = ({ label, amount, icon, color }) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
        <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={rf(22)} color={color} />
        </View>
        <View>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryAmount}>₹{amount.toLocaleString('en-IN')}</Text>
        </View>
    </View>
);

// --- Dashboard Menu Item ---
const DashboardMenuItem = ({ title, iconName, path, router, color, subtitle, onPress }) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
    >
        <View style={[styles.menuIconContainer, { backgroundColor: color + '10' }]}>
            <Ionicons name={iconName} size={rf(28)} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={rf(20)} color="#CBD5E1" />
    </TouchableOpacity>
);

export default function SalesDashboard() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn } = useUser();
    const { t } = useLanguage();

    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [allBills, setAllBills] = useState([]);
    const [insightVisible, setInsightVisible] = useState(false);
    const { refreshSignal } = useRefresh();

    const fetchStats = async () => {
        if (!isLoaded || !isSignedIn) {
            setStats({ daily: 0, weekly: 0, monthly: 0 });
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            if (stats.daily === 0) setLoading(true);
            else setRefreshing(true);
            const token = await getToken();
            const res = await fetch("https://billing.kravy.in/api/bill-manager", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
                    const text = await res.text();
                    console.warn(`ℹ️ [Dashboard] Received non-JSON response. Status: ${res.status}. Body starts with: ${text.slice(0, 50)}`);
                }
            } else {
                console.warn(`Dashboard fetch failed: ${res.status}`);
            }
        } catch (err) {
            console.error("Dashboard Stats Fetch Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (bills) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Start of Week (assuming Monday)
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

    const menuItems = [
        { title: t('daily_sales'), path: "/sales/DailySalesScreen", icon: "sunny", color: COLORS.primary, subtitle: t('performance') },
        { title: t('weekly_sales'), path: "/sales/WeeklySalesScreen", icon: "calendar", color: COLORS.secondary, subtitle: t('trends') },
        { title: t('monthly_sales'), path: "/sales/MonthlySalesScreen", icon: "stats-chart", color: COLORS.accent, subtitle: t('growth') },
        { title: t('bill_records'), path: "/sales/deepsale", icon: "receipt", color: "#6366F1", subtitle: t('invoices') },
        { 
            title: "Profit Intelligence", 
            onPress: () => setInsightVisible(true), 
            icon: "bulb", 
            color: "#F59E0B", 
            subtitle: "Optimize your menu items" 
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchStats} colors={[COLORS.primary]} />
                }
            >

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
                        {menuItems.map((item, idx) => (
                            <DashboardMenuItem
                                key={idx}
                                router={router}
                                {...item}
                                onPress={item.onPress ? item.onPress : () => router.push(item.path)}
                            />
                        ))}
                    </View>
                </View>

                {/* Quick Action Box */}
                {/* <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => router.push('/(tabs)/menu')}
                >
                    <View>
                        <Text style={styles.quickActionTitle}>Create New Bill</Text>
                        <Text style={styles.quickActionSub}>Start a new transaction now</Text>
                    </View>
                    <View style={styles.quickActionButton}>
                        <Ionicons name="add" size={24} color={COLORS.white} />
                    </View>
                </TouchableOpacity> */}

                <ProfitEngine 
                    visible={insightVisible} 
                    onClose={() => setInsightVisible(false)} 
                    bills={allBills} 
                />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
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
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: s(16),
        padding: s(16),
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: s(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryIconContainer: {
        width: s(44),
        height: s(44),
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(15),
    },
    summaryLabel: {
        fontSize: rf(12),
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: vs(2),
    },
    summaryAmount: {
        fontSize: rf(20),
        fontWeight: 'bold',
        color: COLORS.text,
    },
    analyticsSection: {
        marginBottom: vs(25),
    },
    menuGrid: {
        gap: vs(12),
    },
    menuItem: {
        backgroundColor: COLORS.card,
        borderRadius: s(16),
        padding: s(16),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuIconContainer: {
        width: s(54),
        height: s(54),
        borderRadius: s(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(16),
    },
    menuTitle: {
        fontSize: rf(16),
        fontWeight: '700',
        color: COLORS.text,
    },
    menuSubtitle: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
    },
    quickActionCard: {
        backgroundColor: COLORS.primary,
        borderRadius: s(20),
        padding: s(20),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: vs(10),
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    quickActionTitle: {
        color: COLORS.white,
        fontSize: rf(18),
        fontWeight: 'bold',
    },
    quickActionSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: rf(14),
        marginTop: vs(2),
    },
    quickActionButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: s(10),
        borderRadius: s(12),
    },
    loaderContainer: {
        height: vs(100),
        justifyContent: 'center',
        alignItems: 'center',
    }
});
