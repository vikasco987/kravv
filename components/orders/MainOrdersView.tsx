import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    DeviceEventEmitter,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";

// --- Orders Components ---
import { CustomToast } from "../common/CustomToast";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import CreateTableModal from "./CreateTableModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import TableCard, { TableStatus } from "./TableCard";
import TableOrdersView from "./TableOrdersView";

const THEME_PRIMARY = "#4F46E5";

interface Table {
    id: string;
    name: string;
    zone?: string;
    status: TableStatus;
    activeCount: number;
    startTime?: string;
}

const MainOrdersView = ({ isLockedUser = false }: { isLockedUser?: boolean }) => {
    const { getToken } = useAuth();
    const { isSignedIn, user } = useUser();
    const { t } = useLanguage();
    const { refreshSignal, triggerRefresh } = useRefresh();
    const router = useRouter();
    const { canAccessSync } = useStaffPermissions();
    const canEditTables = canAccessSync("edit tables and delete");

    const [tables, setTables] = useState<Table[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [isCreateTableVisible, setIsCreateTableVisible] = useState(false);
    const [isEditTableVisible, setIsEditTableVisible] = useState(false);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [newTableName, setNewTableName] = useState("");
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isSubmittingTable, setIsSubmittingTable] = useState(false);
    const [tableToDelete, setTableToDelete] = useState<string | null>(null);

    // Custom Toast State
    const [toastState, setToastState] = useState<{ visible: boolean, message: string, type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastState({ visible: true, message, type });
    };

    // Floor Management Filters
    const [tableFilter, setTableFilter] = useState<"ALL" | "RUNNING" | "READY">("ALL");
    const [activeZone, setActiveZone] = useState<string>("ALL");

    const fetchInProgress = React.useRef(false);
    const pendingDeletes = React.useRef(new Set<string>());
    const pendingCreates = React.useRef(new Map<string, Table>());
    const pendingUpdates = React.useRef(new Map<string, string>());
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
            setTables([]);
            setAllOrders([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            fetchInProgress.current = true;
            const token = await getTokenRef.current();

            const [tablesRes, ordersRes] = await Promise.all([
                fetch(`https://billing.kravy.in/api/tables?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`https://billing.kravy.in/api/orders?active=true&t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                const tablesArray = Array.isArray(tablesData) ? tablesData : (tablesData.tables || []);

                let currentOrders: any[] = [];
                if (ordersRes.ok) {
                    const oData = await ordersRes.json();
                    currentOrders = Array.isArray(oData) ? oData : (oData.orders || []);
                    setAllOrders(currentOrders);
                }

                // Group orders by tableId for fast lookup
                const ordersByTableId: Record<string, any[]> = {};
                currentOrders.forEach(o => {
                    if (o.isDeleted || o.status === "COMPLETED") return;
                    const oTableId = String(o.tableId || (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) || "");
                    if (oTableId) {
                        if (!ordersByTableId[oTableId]) ordersByTableId[oTableId] = [];
                        ordersByTableId[oTableId].push(o);
                    }
                });

                const normalizedTables = tablesArray.map((t: any) => {
                    const tId = t.id || t._id || "";
                    const tableOrders = ordersByTableId[tId] || [];

                    const validTableOrders = tableOrders.filter((o: any) => o.items && o.items.length > 0);

                    let status: TableStatus = "FREE";
                    if (validTableOrders.some(o => o.status === "READY")) status = "READY";
                    else if (validTableOrders.some(o => o.status === "PREPARING")) status = "PREPARING";
                    else if (validTableOrders.some(o => o.status === "ACCEPTED")) status = "ACCEPTED";
                    else if (validTableOrders.some(o => o.status === "PENDING")) status = "PENDING";

                    const activeCount = validTableOrders.length;
                    const sortedOrders = [...validTableOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    const startTime = sortedOrders.length > 0 ? sortedOrders[0].createdAt : undefined;

                    return {
                        ...t,
                        id: tId || Math.random().toString(),
                        name: pendingUpdates.current.get(tId) || t.name, // Apply pending update if exists
                        status,
                        activeCount,
                        startTime
                    };
                }).filter((t: any) => !pendingDeletes.current.has(t.id));

                let finalTables = [...normalizedTables];
                pendingCreates.current.forEach((tableObj, tableId) => {
                    if (!finalTables.find(t => t.id === tableId)) {
                        finalTables.push(tableObj);
                    } else {
                        // Server successfully returned it, remove from pending
                        pendingCreates.current.delete(tableId);
                    }
                });

                // Clear pending updates if they match server or just clear them since we got fresh data
                // To be safe, if we get data, we just assume it's syncing soon, but if server matches we can delete
                finalTables.forEach(t => {
                    if (pendingUpdates.current.has(t.id) && t.name === pendingUpdates.current.get(t.id)) {
                        pendingUpdates.current.delete(t.id);
                    }
                });

                finalTables.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                setTables(finalTables);
                await AsyncStorage.setItem('@cached_tables', JSON.stringify(finalTables));

                return finalTables;
            }
            return null;
        } catch (error) {
            const cachedTables = await AsyncStorage.getItem('@cached_tables');
            if (cachedTables) {
                const parsed = JSON.parse(cachedTables);
                setTables(parsed);
                return parsed;
            }
            return null;
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
        setIsSubmittingTable(true);
        try {
            const token = await getToken();
            const response = await fetch("https://billing.kravy.in/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newTableName }),
            });
            setIsSubmittingTable(false); // Stop button spinning immediately

            if (response.ok) {
                const responseData = await response.json();
                const actualTable = responseData.table || responseData.data || responseData;
                const newTableId = actualTable.id || actualTable._id || Math.random().toString();

                const optimisticTable: Table = {
                    ...actualTable,
                    id: newTableId,
                    status: "FREE",
                    activeCount: 0,
                };

                // Track optimistic creation to prevent ghosting
                pendingCreates.current.set(newTableId, optimisticTable);

                setTables(prev => {
                    const exists = prev.find(t => t.id === newTableId);
                    if (exists) return prev;
                    return [...prev, optimisticTable].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                });

                setNewTableName("");
                setIsCreateTableVisible(false);

                showToast("Table created successfully!", "success");

                fetchTables(); // Sync with backend silently
            } else {
                showToast("Failed to create table", "error");
            }
        } catch (error) {
            setIsSubmittingTable(false);
            console.error("Create table error:", error);
            showToast("Error creating table", "error");
        }
    };

    const updateTable = async () => {
        if (!editingTable || !newTableName.trim()) return;
        setIsSubmittingTable(true);
        try {
            const token = await getToken();
            const response = await fetch(`https://billing.kravy.in/api/tables/${editingTable.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newTableName }),
            });
            setIsSubmittingTable(false); // Stop button spinning immediately

            if (response.ok) {
                const updatedName = newTableName;

                // Track pending update to prevent ghosting
                pendingUpdates.current.set(editingTable.id, updatedName);

                setTables(prev => {
                    return prev.map(t => {
                        if (t.id === editingTable.id) {
                            return { ...t, name: updatedName };
                        }
                        return t;
                    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                });

                setNewTableName("");
                setIsEditTableVisible(false);
                setEditingTable(null);

                fetchTables(); // Sync with backend silently
            }
        } catch (error) {
            setIsSubmittingTable(false);
            console.error("Update table error:", error);
        }
    };

    const deleteTable = async (tableId: string) => {
        // Optimistic UI update: Instantly remove the table from UI
        pendingDeletes.current.add(tableId);
        setTables(prev => prev.filter(t => t.id !== tableId));

        try {
            const token = await getToken();
            const response = await fetch(`https://billing.kravy.in/api/tables/${tableId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                showToast("Table deleted successfully!", "success");
            } else {
                pendingDeletes.current.delete(tableId); // Revert on failure

                let errorMessage = "Failed to delete table";
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Ignore JSON parse error, stick to default message
                }

                showToast(errorMessage, "error");
            }
        } catch (error) {
            console.error("Delete table error:", error);
            pendingDeletes.current.delete(tableId); // Revert on failure
            showToast("Error deleting table", "error");
        } finally {
            fetchTables(); // Sync in background without blocking UI
        }
    };

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

    useEffect(() => {
        if (refreshSignal > 0) {
            setRefreshing(true);
            fetchTables();
        }
    }, [refreshSignal, fetchTables]);

    const [currentView, setCurrentView] = useState<"main" | "tableOrders">("main");

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (currentView !== "main") {
                    setSelectedTable(null);
                    setCurrentView("main");
                    return true;
                }
                return false;
            };

            const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
            return () => subscription.remove();
        }, [currentView])
    );

    useFocusEffect(
        useCallback(() => {
            return () => {
                // Reset view when leaving the tab
                setCurrentView("main");
                setSelectedTable(null);
            };
        }, [])
    );

    const navigateToTable = useCallback((item: Table) => {
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        setSelectedTable(item);
        setCurrentView("tableOrders");
    }, [isLockedUser]);

    // Computed Properties for Floor Management
    const availableZones = useMemo(() => {
        const zones = new Set<string>();
        tables.forEach(t => {
            if (t.zone) {
                const normalized = t.zone.trim().toUpperCase();
                if (normalized) zones.add(normalized);
            }
        });
        return Array.from(zones).sort();
    }, [tables]);

    const filteredTables = useMemo(() => {
        return tables.filter(t => {
            const matchFilter = tableFilter === "ALL" ||
                (tableFilter === "RUNNING" && t.status === "PREPARING") ||
                (tableFilter === "READY" && t.status === "READY");
            const matchZone = activeZone === "ALL" || (t.zone ? t.zone.trim().toUpperCase() === activeZone.toUpperCase() : false);
            return matchFilter && matchZone;
        }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }, [tables, tableFilter, activeZone]);

    const stats = useMemo(() => {
        const activeOrders = allOrders.filter(o => !o.isDeleted && o.status !== "COMPLETED");
        return {
            running: activeOrders.filter(o => o.status === "PREPARING").length,
            ready: activeOrders.filter(o => o.status === "READY").length,
            pending: activeOrders.filter(o => o.status === "PENDING" || o.status === "ACCEPTED").length,
            sales: allOrders.filter(o => o.status === "COMPLETED" && !o.isDeleted).reduce((s, o) => s + (o.total || 0), 0)
        };
    }, [allOrders]);

    if (currentView === "tableOrders" && selectedTable) {
        const activeTableOrders = allOrders.filter((o: any) => {
            const oTableId = String(o.tableId || (o.table && (typeof o.table === 'string' ? o.table : (o.table.id || o.table._id))) || "");
            return oTableId === selectedTable.id && !o.isDeleted && o.status !== "COMPLETED" && o.status !== "SERVED";
        });
        // Sort by newest first like TableOrdersView does
        activeTableOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return (
            <TableOrdersView
                tableId={selectedTable.id}
                tableName={selectedTable.name}
                initialOrders={activeTableOrders.length > 0 ? activeTableOrders : undefined}
                onBack={() => {
                    setSelectedTable(null);
                    setCurrentView("main");
                }}
            />
        );
    }

    return (
        <View style={styles.content}>
            {/* Header & Stats */}
            <View style={styles.terminalHeader}>
                <View style={styles.headerTop}>
                    <Text style={styles.mainTitle}>Floor Management</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => {
                        if (isLockedUser) setIsLoginModalVisible(true);
                        else setIsCreateTableVisible(true);
                    }}>
                        <Ionicons name="add" size={rf(16)} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Add Table</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Queue</Text>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Preparing</Text>
                        <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{stats.running}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Ready</Text>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.ready}</Text>
                    </View>
                    <View style={[styles.statBox, { borderRightWidth: 0, alignItems: 'flex-end', flex: 1 }]}>
                        <Text style={styles.statLabel}>Sales</Text>
                        <Text style={[styles.statValue, { color: '#4F46E5', fontSize: rf(14) }]}>₹{stats.sales}</Text>
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                        <View style={styles.filterGroup}>
                            {(["ALL", "RUNNING", "READY"] as const).map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.filterBtn, tableFilter === f && styles.filterBtnActive]}
                                    onPress={() => setTableFilter(f)}
                                >
                                    <Text style={[styles.filterBtnText, tableFilter === f && styles.filterBtnTextActive]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {availableZones.length > 0 && (
                            <View style={styles.filterGroup}>
                                <View style={styles.divider} />
                                <TouchableOpacity
                                    style={[styles.zoneBtn, activeZone === "ALL" && styles.zoneBtnActive]}
                                    onPress={() => setActiveZone("ALL")}
                                >
                                    <Text style={[styles.zoneBtnText, activeZone === "ALL" && styles.zoneBtnTextActive]}>All Floors</Text>
                                </TouchableOpacity>
                                {availableZones.map(z => (
                                    <TouchableOpacity
                                        key={z}
                                        style={[styles.zoneBtn, activeZone === z && styles.zoneBtnActive]}
                                        onPress={() => setActiveZone(z)}
                                    >
                                        <Text style={[styles.zoneBtnText, activeZone === z && styles.zoneBtnTextActive]}>{z}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={filteredTables}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    contentContainerStyle={styles.listPadding}
                    initialNumToRender={12}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => triggerRefresh()} tintColor={THEME_PRIMARY} />
                    }
                    renderItem={({ item }) => (
                        <View style={{ width: '33.33%', padding: s(5) }}>
                            <TableCard
                                name={item.name}
                                status={item.status}
                                activeCount={item.activeCount}
                                startTime={item.startTime}
                                onPress={() => navigateToTable(item)}
                                onEdit={canEditTables ? () => {
                                    setEditingTable(item);
                                    setNewTableName(item.name);
                                    setIsEditTableVisible(true);
                                } : undefined}
                                onDelete={canEditTables ? () => setTableToDelete(item.id) : undefined}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <Ionicons name="grid-outline" size={rf(60)} color="#D1D5DB" />
                            <Text style={styles.emptyText}>{t('no_tables_created')}</Text>
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
                isSubmitting={isSubmittingTable}
            />

            <CreateTableModal
                visible={isEditTableVisible}
                onClose={() => {
                    setIsEditTableVisible(false);
                    setEditingTable(null);
                    setNewTableName("");
                }}
                onSave={updateTable}
                tableName={newTableName}
                onTableNameChange={setNewTableName}
                title="Edit Table"
                placeholder="Table Name"
                cancelText="Cancel"
                createText="Update"
                isSubmitting={isSubmittingTable}
            />

            <DeleteConfirmModal
                visible={tableToDelete !== null}
                onClose={() => setTableToDelete(null)}
                onConfirm={() => {
                    if (tableToDelete) {
                        deleteTable(tableToDelete);
                        setTableToDelete(null);
                    }
                }}
            />

            <LoginRequiredModal
                visible={isLoginModalVisible}
                onClose={() => setIsLoginModalVisible(false)}
                onSignIn={() => {
                    setIsLoginModalVisible(false);
                    router.push("/(auth)/sign-in");
                }}
            />

            <CustomToast
                visible={toastState.visible}
                message={toastState.message}
                type={toastState.type}
                onHide={() => setToastState(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listPadding: { padding: s(10) },
    terminalHeader: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingTop: vs(15),
        paddingBottom: vs(10),
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: s(15),
        marginBottom: vs(10),
    },
    mainTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#111827',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
        paddingHorizontal: s(12),
        paddingVertical: vs(8),
        borderRadius: s(8),
    },
    addBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: s(5),
        fontSize: rf(12),
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: s(15),
        paddingVertical: vs(5),
    },
    statBox: {
        paddingRight: s(15),
        marginRight: s(15),
        borderRightWidth: 1,
        borderRightColor: '#F3F4F6',
    },
    statLabel: {
        fontSize: rf(9),
        color: '#9CA3AF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: rf(16),
        fontWeight: '900',
        marginTop: vs(2),
    },
    filtersContainer: {
        marginTop: vs(10),
    },
    filterScroll: {
        paddingHorizontal: s(15),
        alignItems: 'center',
    },
    filterGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: vs(20),
        backgroundColor: '#E5E7EB',
        marginHorizontal: s(10),
    },
    filterBtn: {
        paddingHorizontal: s(12),
        paddingVertical: vs(6),
        borderRadius: s(8),
        backgroundColor: '#F3F4F6',
        marginRight: s(8),
    },
    filterBtnActive: {
        backgroundColor: '#111827',
    },
    filterBtnText: {
        fontSize: rf(10),
        fontWeight: 'bold',
        color: '#6B7280',
    },
    filterBtnTextActive: {
        color: '#FFFFFF',
    },
    zoneBtn: {
        paddingHorizontal: s(12),
        paddingVertical: vs(6),
        borderRadius: s(8),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        marginRight: s(8),
    },
    zoneBtnActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
    },
    zoneBtnText: {
        fontSize: rf(10),
        fontWeight: 'bold',
        color: '#6B7280',
    },
    zoneBtnTextActive: {
        color: '#FFFFFF',
    },
    emptyView: { alignItems: 'center', marginTop: vs(100), paddingHorizontal: s(40) },
    emptyText: { color: '#9CA3AF', marginTop: vs(15), fontSize: rf(16), textAlign: 'center' },
});

export default MainOrdersView;

