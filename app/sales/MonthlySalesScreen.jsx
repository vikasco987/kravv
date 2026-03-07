import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl
} from "react-native";
import { useRefresh } from "../../context/RefreshContext";

const COLORS = {
    primary: '#5D3FD3',
    secondary: '#FFC107',
    background: '#F0F2F5',
    card: '#FFFFFF',
    text: '#1F2937',
    lightText: '#6B7280',
    borderColor: '#E5E7EB',
    success: '#10B981',
};

const SalesStat = ({ label, value, icon, color, isMain = false }) => (
    <View style={enhancedStyles.statContainer}>
        <Ionicons name={icon} size={isMain ? 28 : 20} color={color} />
        <Text style={[
            enhancedStyles.statValue,
            {
                color: isMain ? COLORS.text : COLORS.lightText,
                fontSize: isMain ? 18 : 14,
                fontWeight: isMain ? '700' : '500'
            }
        ]}>
            {value}
        </Text>
        <Text style={enhancedStyles.statLabel}>{label}</Text>
    </View>
);

const MonthlySalesCard = ({ monthLabel, numberOfBills, totalSales }) => (
    <View style={enhancedStyles.card}>
        <View style={enhancedStyles.cardHeader}>
            <Ionicons name="calendar-sharp" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={enhancedStyles.cardMonthLabel}>{monthLabel}</Text>
        </View>
        <View style={enhancedStyles.cardBody}>
            <SalesStat
                label="Bills Count"
                value={numberOfBills.toLocaleString()}
                icon="receipt-outline"
                color={COLORS.lightText}
            />
            <SalesStat
                label="Monthly Sales"
                value={`₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                icon="wallet-sharp"
                color={COLORS.success}
                isMain={true}
            />
        </View>
    </View>
);

const TableListView = ({ data, refreshing, onRefresh }) => (
    <View style={enhancedStyles.tableContainer}>
        <View style={enhancedStyles.tableHeaderRow}>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 3 }]}>Month</Text>
            <Text style={enhancedStyles.tableCellHeader}>Bills</Text>
            <Text style={[enhancedStyles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Sales</Text>
        </View>
        <FlatList
            data={data}
            keyExtractor={(item) => item.sortKey}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            renderItem={({ item }) => (
                <View style={enhancedStyles.tableRow}>
                    <Text style={[enhancedStyles.tableCell, { flex: 3, textAlign: 'left', fontWeight: 'bold' }]}>{item.monthLabel}</Text>
                    <Text style={enhancedStyles.tableCell}>{item.numberOfBills.toLocaleString()}</Text>
                    <Text style={[enhancedStyles.tableCell, { flex: 2, color: COLORS.success, fontWeight: 'bold', textAlign: 'right' }]}>
                        ₹{item.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            )}
            ListEmptyComponent={() => (
                <View style={enhancedStyles.emptyContainer}>
                    <Text style={enhancedStyles.emptyText}>No monthly sales found for Table View.</Text>
                </View>
            )}
        />
    </View>
);

export default function MonthlySalesScreen() {
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const { refreshSignal, triggerRefresh } = useRefresh();

    const [monthlySales, setMonthlySales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState('card');

    const totalGrandSales = useMemo(() => {
        return monthlySales.reduce((sum, item) => sum + item.totalSales, 0);
    }, [monthlySales]);

    const groupSalesByMonth = (bills) => {
        const grouped = {};
        bills.forEach((bill) => {
            const date = new Date(bill.createdAt);
            const sortKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
            if (!grouped[sortKey]) grouped[sortKey] = { sortKey, monthLabel, numberOfBills: 0, totalSales: 0 };
            grouped[sortKey].numberOfBills += 1;
            grouped[sortKey].totalSales += (bill.total || 0);
        });
        return Object.values(grouped).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    };

    const fetchBills = async (silent = false) => {
        if (!isLoaded || !isSignedIn) {
            setMonthlySales([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);
            const token = await getToken();
            const res = await fetch("https://billing.kravy.in/api/bill-manager", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.bills) {
                    setMonthlySales(groupSalesByMonth(data.bills.filter(b => b.isHeld !== true)));
                }
            }
        } catch (err) {
            console.warn("MonthlySales Fetch Error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchBills(); }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchBills(true);
        }
    }, [refreshSignal]);

    if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: "center" }} />;

    return (
        <SafeAreaView style={enhancedStyles.container}>
            <View style={enhancedStyles.pageHeader}>
                <View style={enhancedStyles.headerTopRow}>
                    <TouchableOpacity onPress={() => router.back()} style={enhancedStyles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={enhancedStyles.title}>Monthly Sales Report 📊</Text>
                    <TouchableOpacity onPress={triggerRefresh} style={enhancedStyles.reloadButton}>
                        <Ionicons name="refresh" size={26} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                <Text style={enhancedStyles.subtitle}>
                    All Time Revenue: <Text style={enhancedStyles.totalSalesValue}>₹{totalGrandSales.toLocaleString('en-IN')}</Text>
                </Text>

                <View style={enhancedStyles.controlButtons}>
                    <TouchableOpacity onPress={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} style={enhancedStyles.modeButton}>
                        <Ionicons name={viewMode === 'card' ? "list-outline" : "grid-outline"} size={22} color={COLORS.primary} />
                        <Text style={enhancedStyles.modeText}>{viewMode === 'card' ? 'Table View' : 'Card View'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, paddingTop: 10 }}>
                {viewMode === 'card' ? (
                    <FlatList
                        data={monthlySales}
                        keyExtractor={(item) => item.sortKey}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBills(true)} colors={[COLORS.primary]} />}
                        renderItem={({ item }) => (
                            <MonthlySalesCard
                                monthLabel={item.monthLabel}
                                numberOfBills={item.numberOfBills}
                                totalSales={item.totalSales}
                            />
                        )}
                        ListEmptyComponent={() => (
                            <View style={enhancedStyles.emptyContainer}>
                                <Ionicons name="close-circle-outline" size={50} color={COLORS.lightText} />
                                <Text style={enhancedStyles.emptyText}>No sales records found yet.</Text>
                            </View>
                        )}
                    />
                ) : (
                    <TableListView data={monthlySales} refreshing={refreshing} onRefresh={() => fetchBills(true)} />
                )}
            </View>
        </SafeAreaView>
    );
}

const enhancedStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    pageHeader: { padding: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, elevation: 2, paddingTop: 40 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    backButton: { padding: 4 },
    reloadButton: { padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, flex: 1, textAlign: 'center' },
    subtitle: { fontSize: 16, color: COLORS.lightText, textAlign: 'center', marginBottom: 12 },
    totalSalesValue: { fontWeight: 'bold', color: COLORS.success },
    controlButtons: { flexDirection: 'row', justifyContent: 'center' },
    modeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#DDD6FE' },
    modeText: { marginLeft: 8, color: COLORS.primary, fontWeight: '600' },
    card: { backgroundColor: COLORS.card, marginHorizontal: 16, marginVertical: 8, borderRadius: 12, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10, marginBottom: 12 },
    cardMonthLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    cardBody: { flexDirection: 'row', justifyContent: 'space-around' },
    statContainer: { alignItems: 'center' },
    statValue: { marginTop: 4 },
    statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    tableContainer: { flex: 1, backgroundColor: COLORS.card, margin: 16, borderRadius: 12, overflow: 'hidden', elevation: 2 },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor },
    tableCellHeader: { fontWeight: 'bold', color: COLORS.lightText, fontSize: 13, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    tableCell: { fontSize: 14, color: COLORS.text },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { marginTop: 12, fontSize: 16, color: COLORS.lightText },
});
