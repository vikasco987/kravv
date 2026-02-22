import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

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
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <View>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryAmount}>₹{amount.toLocaleString('en-IN')}</Text>
        </View>
    </View>
);

// --- Dashboard Menu Item ---
const DashboardMenuItem = ({ title, iconName, path, router, color, subtitle }) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push(path)}
    >
        <View style={[styles.menuIconContainer, { backgroundColor: color + '10' }]}>
            <Ionicons name={iconName} size={28} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#CBD5E1" />
    </TouchableOpacity>
);

export default function SalesDashboard() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn } = useUser();

    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        if (!isLoaded || !isSignedIn) return;
        try {
            setLoading(true);
            const token = await getToken();
            const res = await fetch("https://billing-backend-sable.vercel.app/api/billing/list", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (res.ok && data.bills) {
                calculateStats(data.bills);
            }
        } catch (err) {
            console.error("Dashboard Stats Fetch Error:", err);
        } finally {
            setLoading(false);
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

        bills.forEach(bill => {
            const billDate = new Date(bill.createdAt);
            const total = bill.grandTotal || 0;

            if (billDate >= startOfToday) daily += total;
            if (billDate >= startOfWeek) weekly += total;
            if (billDate >= startOfMonth) monthly += total;
        });

        setStats({ daily, weekly, monthly });
    };

    useEffect(() => {
        fetchStats();
    }, [isLoaded, isSignedIn]);

    const menuItems = [
        { title: "Daily Sales", path: "/sales/DailySalesScreen", icon: "sunny", color: COLORS.primary, subtitle: "Track today's performance" },
        { title: "Weekly Sales", path: "/sales/WeeklySalesScreen", icon: "calendar", color: COLORS.secondary, subtitle: "7-day revenue trends" },
        { title: "Monthly Sales", path: "/sales/MonthlySalesScreen", icon: "stats-chart", color: COLORS.accent, subtitle: "Monthly growth overview" },
        { title: "Bill Records", path: "/sales/deepsale", icon: "receipt", color: "#6366F1", subtitle: "All historical invoices" },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Sales Summary Cards */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Sales Summary</Text>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator color={COLORS.primary} size="small" />
                        </View>
                    ) : (
                        <View style={styles.statsRow}>
                            <SalesSummaryCard label="Today" amount={stats.daily} icon="today-outline" color={COLORS.primary} />
                            <SalesSummaryCard label="Weekly" amount={stats.weekly} icon="trending-up-outline" color={COLORS.secondary} />
                            <SalesSummaryCard label="Monthly" amount={stats.monthly} icon="pie-chart-outline" color={COLORS.accent} />
                        </View>
                    )}
                </View>

                {/* Analytics Section */}
                <View style={styles.analyticsSection}>
                    <Text style={styles.sectionTitle}>Analytics & Reports</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item, idx) => (
                            <DashboardMenuItem
                                key={idx}
                                router={router}
                                {...item}
                            />
                        ))}
                    </View>
                </View>

                {/* Quick Action Box */}
                <TouchableOpacity
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
                </TouchableOpacity>

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
        padding: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 15,
    },
    summaryContainer: {
        marginBottom: 25,
    },
    statsRow: {
        flexDirection: 'column',
        gap: 12,
    },
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    summaryLabel: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: 2,
    },
    summaryAmount: {
        fontSize: 20,
        fontWeight: 'Bold',
        color: COLORS.text,
    },
    analyticsSection: {
        marginBottom: 25,
    },
    menuGrid: {
        gap: 12,
    },
    menuItem: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    menuSubtitle: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    quickActionCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    quickActionTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickActionSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 2,
    },
    quickActionButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 12,
    },
    loaderContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    }
});