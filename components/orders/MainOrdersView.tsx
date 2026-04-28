import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    DeviceEventEmitter,
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

// --- Orders Components ---
import { LoginRequiredModal } from "../common/LoginRequiredModal";
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

const MainOrdersView = ({ isLockedUser = false }: { isLockedUser?: boolean }) => {
    const { getToken } = useAuth();
    const { isSignedIn, user } = useUser();
    const { t } = useLanguage();
    const router = useRouter();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCreateTableVisible, setIsCreateTableVisible] = useState(false);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [newTableName, setNewTableName] = useState("");
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [rotationVisible, setRotationVisible] = useState(false);
    const [selectedTableData, setSelectedTableData] = useState<any>(null);
    const [currentView, setCurrentView] = useState<"main" | "tableOrders">("main");
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    const fetchInProgress = React.useRef(false);

    const getTokenRef = React.useRef(getToken);
    const isLockedRef = React.useRef(isLockedUser);

    useEffect(() => {
        getTokenRef.current = getToken;
        isLockedRef.current = isLockedUser;
    });

    const fetchTables = useCallback(async () => {
        if (fetchInProgress.current) return;
        const currentLock = isLockedRef.current;
        if (currentLock) {
            setTables([]); // Clear tables on logout/lock
            setAllOrders([]); // Clear orders on logout/lock
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            fetchInProgress.current = true;
            const token = await getTokenRef.current();

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
                            const oTableId = String(o.tableId || (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) || "");
                            return oTableId === String(tId);
                        });

                        return { ...t, id: tId || Math.random().toString(), orderCount: activeOrdersForTable.length };
                    });

                    setTables(normalizedTables);
                    await AsyncStorage.setItem('@cached_tables', JSON.stringify(normalizedTables));
                }
            }
        } catch (error) {
            const cachedTables = await AsyncStorage.getItem('@cached_tables');
            if (cachedTables) setTables(JSON.parse(cachedTables));
        } finally {
            fetchInProgress.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const loadCache = async () => {
            if (!isLockedUser && tables.length === 0) {
                const cachedTables = await AsyncStorage.getItem('@cached_tables');
                if (cachedTables) {
                    setTables(JSON.parse(cachedTables));
                    setLoading(false);
                }
            }
        };
        loadCache();
    }, [isLockedUser]);

    const createTable = async () => {
        if (!newTableName.trim()) return;
        try {
            const token = await getToken();
            const response = await fetch("https://billing.kravy.in/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        fetchTables();
    }, [isLockedUser]);

    useFocusEffect(
        useCallback(() => {
            fetchTables();
        }, [fetchTables])
    );

    useEffect(() => {
        const sub1 = DeviceEventEmitter.addListener('REFRESH_ORDERS', fetchTables);
        const sub2 = DeviceEventEmitter.addListener('REFRESH_TABLES', fetchTables);
        return () => {
            sub1.remove();
            sub2.remove();
        };
    }, [fetchTables]);

    useEffect(() => {
        const interval = setInterval(fetchTables, 5000);
        return () => clearInterval(interval);
    }, [fetchTables]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTables();
    };

    const navigateToTable = useCallback((item: Table) => {
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        setSelectedTable(item);
        setCurrentView("tableOrders");
    }, [isLockedUser]);

    const showTableInsights = useCallback((item: Table) => {
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        const tableOrders = allOrders.filter((o: any) => {
            const oTableId = String(o.tableId || (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) || "");
            return oTableId === String(item.id);
        });
        setSelectedTableData({ name: item.name, orders: tableOrders });
        setRotationVisible(true);
    }, [isLockedUser, allOrders]);

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
                onAddPress={() => {
                    if (isLockedUser) {
                        setIsLoginModalVisible(true);
                    } else {
                        setIsCreateTableVisible(true);
                    }
                }}
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
                    initialNumToRender={6}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
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

            <LoginRequiredModal
                visible={isLoginModalVisible}
                onClose={() => setIsLoginModalVisible(false)}
                onSignIn={() => {
                    setIsLoginModalVisible(false);
                    router.push("/(auth)/sign-in");
                }}
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
