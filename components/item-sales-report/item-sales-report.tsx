import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { rf, s, vs } from "../../utils/responsive";
import { useRefresh } from "../../context/RefreshContext";
import DailyItemSalesReport from './DailyItemSalesReport';
import WeeklyItemSalesReport from './WeeklyItemSalesReport';
import MonthlyItemSalesReport from './MonthlyItemSalesReport';
import { applyTrueBillTotals } from "../../utils/billCalculator";

const ItemSalesReport = ({ onBack, defaultReport, targetDate, targetSortKey }: { onBack: () => void, defaultReport?: string, targetDate?: string, targetSortKey?: string }) => {
  const [activeReport, setActiveReport] = React.useState<string | null>(defaultReport || null);
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { refreshSignal } = useRefresh();
  const [hasReportsAccess, setHasReportsAccess] = useState(true);

  const [loadingData, setLoadingData] = useState(true);
  const [sharedData, setSharedData] = useState<{ categories: any[], itemCategoryMap: Record<string, string>, allBills: any[] } | null>(null);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_sales_report_data');
        if (cached) {
          setSharedData(JSON.parse(cached));
          setLoadingData(false);
        }
      } catch (e) {}
    };
    loadCache();
  }, []);

  const fetchAllData = async () => {
    if (!isLoaded) return;
    try {
      setLoadingData(true);
      const authToken = await getToken();
      const sessionStr = await AsyncStorage.getItem('staff_session');
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;

      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      const finalToken = authToken || staffSession?.token;

      if (!finalToken && !bId) {
        setLoadingData(false);
        return;
      }

      const catUrl = bId ? `https://billing.kravy.in/api/categories?t=${Date.now()}&businessId=${bId}` : `https://billing.kravy.in/api/categories?t=${Date.now()}`;
      const menuUrl = bId ? `https://billing.kravy.in/api/menu/view?t=${Date.now()}&businessId=${bId}` : `https://billing.kravy.in/api/menu/view?t=${Date.now()}`;
      const billUrl = bId ? `https://billing.kravy.in/api/bill-manager?t=${Date.now()}&businessId=${bId}` : `https://billing.kravy.in/api/bill-manager?t=${Date.now()}`;

      const [catRes, menuRes, billRes] = await Promise.all([
        fetch(catUrl, { headers: { Authorization: `Bearer ${finalToken}` } }),
        fetch(menuUrl, { headers: { Authorization: `Bearer ${finalToken}` } }),
        fetch(billUrl, { headers: { Authorization: `Bearer ${finalToken}` } })
      ]);

      let cats = [];
      let mapping: Record<string, string> = {};
      let bills = [];

      if (catRes.ok) {
        const catData = await catRes.json();
        cats = Array.isArray(catData) ? catData : [];
      }

      if (menuRes.ok) {
        let menuItemsRaw = await menuRes.json();
        let allItems: any[] = [];
        if (Array.isArray(menuItemsRaw)) {
          allItems = menuItemsRaw;
        } else if (menuItemsRaw?.menus) {
          menuItemsRaw.menus.forEach((m: any) => {
            if (m.items) {
              m.items.forEach((it: any) => {
                allItems.push({ ...it, categoryName: m.name });
              });
            }
          });
        }
        allItems.forEach((item: any) => {
          const name = (item.name || "").toLowerCase().trim();
          const catName = item.category?.name || item.categoryName || "Others";
          mapping[name] = catName;
        });
      }

      if (billRes.ok) {
        const data = await billRes.json();
        bills = Array.isArray(data) ? data : (data.bills || []);
        await applyTrueBillTotals(bills);
      }

        const fetchedData = { categories: cats, itemCategoryMap: mapping, allBills: bills };
        setSharedData(fetchedData);
        AsyncStorage.setItem('cached_sales_report_data', JSON.stringify(fetchedData));
      } catch (error) {
        console.error("Sales report preload error:", error);
      } finally {
        setLoadingData(false);
      }
    };

  useEffect(() => {
    fetchAllData();
  }, [isLoaded, isSignedIn, user, refreshSignal]);

  useEffect(() => {
    const checkAccess = async () => {
        if (isSignedIn) return;
        const sessionStr = await AsyncStorage.getItem('staff_session');
        if (sessionStr) {
            const access = await StaffPermissionEngine.hasCategoryAccess("Reports", false);
            setHasReportsAccess(access);
        }
    };
    checkAccess();
  }, [isSignedIn]);

  if (activeReport === 'daily') return <DailyItemSalesReport onBack={() => { if(defaultReport) onBack(); else setActiveReport(null); }} preloadedData={sharedData} loadingData={loadingData} onRefresh={fetchAllData} targetDate={targetDate} />;
  if (activeReport === 'weekly') return <WeeklyItemSalesReport onBack={() => { if(defaultReport) onBack(); else setActiveReport(null); }} preloadedData={sharedData} loadingData={loadingData} onRefresh={fetchAllData} targetSortKey={targetSortKey} />;
  if (activeReport === 'monthly') return <MonthlyItemSalesReport onBack={() => { if(defaultReport) onBack(); else setActiveReport(null); }} preloadedData={sharedData} loadingData={loadingData} onRefresh={fetchAllData} targetSortKey={targetSortKey} />;

  if (!hasReportsAccess && !isSignedIn) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: s(30) }}>
             <View style={{ backgroundColor: '#DBEAFE', padding: s(20), borderRadius: s(100), marginBottom: vs(20) }}>
                <Ionicons name="lock-closed" size={s(40)} color="#1D4ED8" />
            </View>
            <Text style={{ fontSize: rf(20), fontWeight: '800', color: "#111827", textAlign: 'center' }}>
                Reports Restricted
            </Text>
            <Text style={{ fontSize: rf(14), color: "#6B7280", textAlign: 'center', marginTop: vs(10), lineHeight: vs(20) }}>
                You don't have permission to view Sales Reports. Please contact your manager.
            </Text>
            <TouchableOpacity onPress={onBack} style={{ marginTop: vs(20), padding: s(10) }}>
                <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Basic Header */}
      <View style={{
        height: vs(100),
        paddingTop: vs(30),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(20),
        backgroundColor: '#4F46E5'
      }}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
        </TouchableOpacity>
        <Text style={{
          marginLeft: s(20),
          color: '#fff',
          fontSize: rf(20),
          fontWeight: 'bold'
        }}>Item Sales Report</Text>
      </View>

      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => setActiveReport('daily')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="stats-chart" size={rf(24)} color="#4F46E5" />
          </View>
          <Text style={styles.menuText}>Daily Item Sales Report</Text>
          <Ionicons name="chevron-forward" size={rf(20)} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: vs(15) }]} 
          onPress={() => setActiveReport('weekly')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="calendar" size={rf(24)} color="#0284C7" />
          </View>
          <Text style={styles.menuText}>Weekly Item Sales Report</Text>
          <Ionicons name="chevron-forward" size={rf(20)} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: vs(15) }]} 
          onPress={() => setActiveReport('monthly')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="pie-chart" size={rf(24)} color="#16A34A" />
          </View>
          <Text style={styles.menuText}>Monthly Item Sales Report</Text>
          <Ionicons name="chevron-forward" size={rf(20)} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: s(20),
  },
  menuItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(15),
    borderRadius: s(12),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: s(45),
    height: s(45),
    borderRadius: s(10),
    backgroundColor: '#F3F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(15),
  },
  menuText: {
    flex: 1,
    fontSize: rf(16),
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default ItemSalesReport;
