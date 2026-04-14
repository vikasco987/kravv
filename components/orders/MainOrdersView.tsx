import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import TableRotation from "../table-insights/TableRotation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";


// --- Orders Components ---
import CreateTableModal from "./CreateTableModal";
import OrderHeader from "./OrderHeader";
import TableCard from "./TableCard";
import TableOrdersView from "./TableOrdersView";


const THEME_PRIMARY = "#4F46E5";

interface Table {
    id: string;
    name: string;
    orderCount?: number;
}

const MainOrdersView = () => {
    const { getToken } = useAuth();
    const { isSignedIn } = useUser();
    const router = useRouter();
    const { t } = useLanguage();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCreateTableVisible, setIsCreateTableVisible] = useState(false);
    const [newTableName, setNewTableName] = useState("");
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [rotationVisible, setRotationVisible] = useState(false);
    const [selectedTableData, setSelectedTableData] = useState<any>(null);
    const [currentView, setCurrentView] = useState<"main" | "tableOrders">("main");
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [hasOrdersAccess, setHasOrdersAccess] = useState(true);



    const fetchInProgress = React.useRef(false);

    const fetchTables = useCallback(async () => {
        if (fetchInProgress.current) return;

        try {
            fetchInProgress.current = true;
            const token = await getToken();

            // Load from cache first if we have nothing yet
            if (tables.length === 0) {
                const cachedTables = await AsyncStorage.getItem('@cached_tables');
                if (cachedTables) {
                    setTables(JSON.parse(cachedTables));
                    setLoading(false);
                }
            }

            const response = await fetch(`https://billing.kravy.in/api/tables?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const tablesData = await response.json();
                    const tablesArray = Array.isArray(tablesData) ? tablesData : (tablesData.tables || []);

                    const ordersResponse = await fetch(`https://billing.kravy.in/api/orders?t=${Date.now()}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    let currentOrders: any[] = [];
                    if (ordersResponse.ok) {
                        const oContentType = ordersResponse.headers.get("content-type");
                        if (oContentType && oContentType.includes("application/json")) {
                            const oData = await ordersResponse.json();
                            currentOrders = Array.isArray(oData) ? oData : (oData.orders || []);
                            setAllOrders(currentOrders);
                        }
                    }

                    const normalizedTables = tablesArray.map((t: any) => {
                        const tId = t.id || t._id || "";
                        const activeOrdersForTable = currentOrders.filter((o: any) => {
                            const oTableId = String(o.tableId ||
                                (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) ||
                                "");
                            return oTableId === String(tId);
                        });

                        return {
                            ...t,
                            id: tId || Math.random().toString(),
                            orderCount: activeOrdersForTable.length
                        };
                    });

                    setTables(normalizedTables);
                    await AsyncStorage.setItem('@cached_tables', JSON.stringify(normalizedTables));
                }
            }
        } catch (error) {
            console.log("Offline mode: Fetching from cache");
            const cachedTables = await AsyncStorage.getItem('@cached_tables');
            if (cachedTables) setTables(JSON.parse(cachedTables));
        } finally {
            fetchInProgress.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken, tables.length]);

    const createTable = async () => {
        if (!newTableName.trim()) return;
        try {
            const token = await getToken();
            const response = await fetch("https://billing.kravy.in/api/tables", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newTableName }),
            });
            if (response.ok) {
                setNewTableName("");
                setIsCreateTableVisible(false);
                fetchTables();
            }
        } catch (error) {
            console.error("Create table error:", error);
        }
    };

    useEffect(() => {
        const checkAccess = async () => {
            if (isSignedIn) {
                setHasOrdersAccess(true);
                return;
            }
            const sessionStr = await AsyncStorage.getItem('staff_session');
            if (sessionStr) {
                const access = await StaffPermissionEngine.hasCategoryAccess("Orders", false);
                setHasOrdersAccess(access);
            } else {
                setHasOrdersAccess(true); // Guest mode
            }
        };
        checkAccess();

        fetchTables();
        const interval = setInterval(fetchTables, 5000);
        return () => clearInterval(interval);
    }, [fetchTables, isSignedIn]);


    const onRefresh = () => {
        setRefreshing(true);
        fetchTables();
    };

    const navigateToTable = (item: Table) => {
        setSelectedTable(item);
        setCurrentView("tableOrders");
    };


    const showTableInsights = (item: Table) => {
        const tableOrders = allOrders.filter((o: any) => {
            const oTableId = String(o.tableId ||
                (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) ||
                "");
            return oTableId === String(item.id);
        });
        setSelectedTableData({ name: item.name, orders: tableOrders });
        setRotationVisible(true);
    };


    if (!hasOrdersAccess && !isSignedIn) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#F9FAFB", padding: s(30) }}>
                 <View style={{ backgroundColor: '#E0E7FF', padding: s(20), borderRadius: s(100), marginBottom: vs(20) }}>
                    <Ionicons name="lock-closed" size={s(40)} color="#4F46E5" />
                </View>
                <Text style={{ fontSize: rf(20), fontWeight: '800', color: "#111827", textAlign: 'center' }}>
                    Orders Restricted
                </Text>
                <Text style={{ fontSize: rf(14), color: "#6B7280", textAlign: 'center', marginTop: vs(10), lineHeight: vs(20) }}>
                    You don't have permission to view or manage Table Orders. Please contact your administrator.
                </Text>
            </View>
        );
    }

    if (currentView === "tableOrders" && selectedTable) {

        const tableOrders = allOrders.filter((o: any) => {
            const oTableId = String(o.tableId || (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) || "");
            return oTableId === String(selectedTable.id);
        });
        return <TableOrdersView tableId={selectedTable.id} tableName={selectedTable.name} initialOrders={tableOrders} onBack={() => setCurrentView("main")} />;
    }


    return (
        <View style={styles.content}>

            <OrderHeader 
                title={t('live_orders')}
                subtitle={t('tap_table')}
                addButtonText={t('add_table')}
                onAddPress={() => setIsCreateTableVisible(true)}
            />

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={tables}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listPadding}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME_PRIMARY} />
                    }
                    renderItem={({ item }) => (
                        <TableCard 
                            name={item.name}
                            orderCount={item.orderCount || 0}
                            activeOrdersText={t('active_orders')}
                            noActiveOrdersText={t('no_active_orders')}
                            onPress={() => navigateToTable(item)}
                            onInsightPress={() => showTableInsights(item)}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <Ionicons name="grid-outline" size={rf(60)} color="#D1D5DB" />
                            <Text style={styles.emptyText}>{t('no_tables_created')}</Text>
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsCreateTableVisible(true)}>
                                <Text style={styles.emptyAddBtnText}>{t('get_started_create_table')}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <CreateTableModal 
                visible={isCreateTableVisible}
                onClose={() => setIsCreateTableVisible(false)}
                onSave={createTable}
                tableName={newTableName}
                onTableNameChange={setNewTableName}
                title={t('quick_add_table')}
                placeholder={t('table_name')}
                cancelText={t('cancel')}
                createText={t('create')}
            />

            <TableRotation
                visible={rotationVisible}
                onClose={() => setRotationVisible(false)}
                tableName={selectedTableData?.name || ''}
                orders={selectedTableData?.orders || []}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    content: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listPadding: { padding: s(10) },
    emptyView: { alignItems: 'center', marginTop: vs(100), paddingHorizontal: s(40) },
    emptyText: { color: '#9CA3AF', marginTop: vs(15), fontSize: rf(16), textAlign: 'center' },
    emptyAddBtn: { marginTop: vs(25), backgroundColor: THEME_PRIMARY + '10', padding: s(15), borderRadius: s(15) },
    emptyAddBtnText: { color: THEME_PRIMARY, fontWeight: 'bold' },
});

export default MainOrdersView;
