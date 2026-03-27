import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";
import TableRotation from "../../components/table-insights/TableRotation";

const THEME_PRIMARY = "#4F46E5";

interface Table {
  id: string;
  name: string;
  orderCount?: number;
}

export default function OrderScreen() {
  const { getToken } = useAuth();
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

  const fetchInProgress = React.useRef(false);

  const fetchTables = useCallback(async () => {
    if (fetchInProgress.current) return;
    
    try {
      fetchInProgress.current = true;
      const token = await getToken();
      
      // Fetch tables with cache-buster
      const response = await fetch(`https://billing.kravy.in/api/tables?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const tablesData = await response.json();
          const tablesArray = Array.isArray(tablesData) ? tablesData : (tablesData.tables || []);

          // Fetch all orders with cache-buster to get accurate counts
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
        }
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

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


  useFocusEffect(
    useCallback(() => {
      fetchTables();
      const interval = setInterval(fetchTables, 15000);
      return () => clearInterval(interval);
    }, [fetchTables])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const navigateToTable = (item: Table) => {
    router.push({
      pathname: `/orders/[tableId]`,
      params: { tableId: item.id, tableName: item.name }
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('live_orders')}</Text>
          <Text style={styles.headerSubtitle}>{t('tap_table')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateTableVisible(true)}
        >
          <Ionicons name="add" size={rf(22)} color="#fff" />
          <Text style={styles.addButtonText}>{t('add_table')}</Text>
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity
                style={styles.tableCard}
                onPress={() => navigateToTable(item)}
              >
                {item.orderCount ? (
                    <TouchableOpacity 
                        style={styles.insightIcon} 
                        onPress={(e) => {
                            e.stopPropagation();
                            showTableInsights(item);
                        }}
                    >
                        <Ionicons name="flash" size={rf(14)} color="#F59E0B" />
                    </TouchableOpacity>
                ) : null}
                <View style={[styles.tableIcon, item.orderCount ? styles.activeTableIcon : null]}>
                  <Ionicons
                    name="restaurant-outline"
                    size={rf(26)}
                    color={item.orderCount ? "#fff" : THEME_PRIMARY}
                  />
                </View>
                <Text style={styles.tableName}>{item.name}</Text>
                <View style={styles.statusBox}>
                  <View style={[styles.statusDot, { backgroundColor: item.orderCount ? "#10B981" : "#D1D5DB" }]} />
                  <Text style={styles.orderStatus}>
                    {item.orderCount ? `${item.orderCount} ${t('active_orders')}` : t('no_active_orders')}
                  </Text>
                </View>
              </TouchableOpacity>
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

      <Modal
        visible={isCreateTableVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('quick_add_table')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('table_name')}
              value={newTableName}
              onChangeText={setNewTableName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateTableVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={createTable}
              >
                <Text style={styles.saveBtnText}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TableRotation 
        visible={rotationVisible} 
        onClose={() => setRotationVisible(false)} 
        tableName={selectedTableData?.name || ''} 
        orders={selectedTableData?.orders || []} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(20),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: vs(20)
  },
  headerTitle: { fontSize: rf(22), fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: rf(13), color: '#6B7280' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_PRIMARY,
    paddingVertical: vs(10),
    paddingHorizontal: s(15),
    borderRadius: s(12),
    elevation: 3
  },
  addButtonText: { color: '#fff', marginLeft: s(5), fontWeight: '700', fontSize: rf(14) },
  listPadding: { padding: s(10) },
  tableCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: s(10),
    padding: s(20),
    borderRadius: s(20),
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableIcon: {
    width: s(55),
    height: s(55),
    borderRadius: s(28),
    backgroundColor: THEME_PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  activeTableIcon: {
    backgroundColor: THEME_PRIMARY,
  },
  tableName: { fontSize: rf(18), fontWeight: 'bold', color: '#111827' },
  statusBox: { flexDirection: 'row', alignItems: 'center', marginTop: vs(8) },
  statusDot: { width: s(8), height: s(8), borderRadius: s(4), marginRight: s(5) },
  orderStatus: { fontSize: rf(12), color: '#6B7280', fontWeight: '500' },
  emptyView: { alignItems: 'center', marginTop: vs(100), paddingHorizontal: s(40) },
  emptyText: { color: '#9CA3AF', marginTop: vs(15), fontSize: rf(16), textAlign: 'center' },
  emptyAddBtn: { marginTop: vs(25), backgroundColor: THEME_PRIMARY + '10', padding: s(15), borderRadius: s(15) },
  emptyAddBtnText: { color: THEME_PRIMARY, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: s(25), borderRadius: s(30), elevation: 10 },
  modalTitle: { fontSize: rf(20), fontWeight: 'bold', marginBottom: vs(20), color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: s(15),
    padding: s(15),
    marginBottom: vs(25),
    fontSize: rf(16),
    color: '#111827',
    backgroundColor: '#F9FAFB'
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: s(15) },
  cancelBtn: { padding: s(10) },
  cancelBtnText: { color: '#6B7280', fontSize: rf(15), fontWeight: '600' },
  saveBtn: { backgroundColor: THEME_PRIMARY, paddingVertical: vs(12), paddingHorizontal: s(25), borderRadius: s(15) },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(15) },
  insightIcon: {
    position: 'absolute',
    top: s(12),
    right: s(12),
    backgroundColor: '#FFFBEB',
    padding: s(6),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: '#FEF3C7',
    zIndex: 10,
  }
});
