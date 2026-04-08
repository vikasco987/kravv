// app/CustomDrawer.tsx
// @ts-ignore
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { useRefresh } from "../context/RefreshContext";
import { rf, s, vs } from "../utils/responsive";
import CustomerHistory from "./customer-insights/CustomerHistory";
import ItemSalesReport from "./item-sales-report/item-sales-report";
import { EditMenuItem } from "./menu/EditMenuItem";
import { TableQrCodes } from "./menu/TableQrCodes";
import ProfitEngine from "./profit-engine/ProfitEngine";
import { LoginRequiredModal } from "./settings/LoginRequiredModal";
import VoiceOrder from "./voice-command/VoiceOrder";

export default function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { t } = useLanguage();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [editMenuModalVisible, setEditMenuModalVisible] = useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const { getToken } = useAuth();

  // --- Staff Session Info ---
  const [staffData, setStaffData] = useState<any>(null);
  const { refreshSignal } = useRefresh();

  React.useEffect(() => {
    const loadStaff = async () => {
      const session = await AsyncStorage.getItem("staff_session");
      if (session) setStaffData(JSON.parse(session));
      else setStaffData(null);
    };
    loadStaff();
  }, [refreshSignal]);

  const isAnySignedIn = !!user || !!staffData;

  // Smart AI Modal States
  const [profitModalVisible, setProfitModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [tablesModalVisible, setTablesModalVisible] = useState(false);

  // Data for AI features
  const [allBills, setAllBills] = useState([]);
  const [menus, setMenus] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  const COLORS = {
    primary: '#4F46E5',
    danger: '#EF4444',
  };

  const handleAuthenticatedNavigation = (screen: string, params?: any) => {
    if (!isAnySignedIn) {
      setLoginModalVisible(true);
    } else {
      if (params) {
        props.navigation.navigate(screen, params);
      } else {
        props.navigation.navigate(screen);
      }
    }
  };

  const fetchAIData = async () => {
    try {
      const token = await getToken();
      // If no clerk token, try staff token
      const authToken = token || staffData?.token;
      if (!authToken) return;

      // Fetch Bills
      const billRes = await fetch("https://billing.kravy.in/api/bill-manager", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (billRes.ok) {
        const data = await billRes.json();
        setAllBills(data.bills || []);
      }

      // Fetch Orders
      const orderRes = await fetch("https://billing.kravy.in/api/orders", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (orderRes.ok) {
        const oData = await orderRes.json();
        setAllOrders(Array.isArray(oData) ? oData : (oData.orders || []));
      }

      // Load cached menu for voice
      const cachedMenu = await AsyncStorage.getItem('@cached_menu');
      if (cachedMenu) setMenus(JSON.parse(cachedMenu));
    } catch (e) {
      console.error("CustomDrawer AI fetch error:", e);
    }
  };

  const handleSignIn = () => {
    setLoginModalVisible(false);
    router.push("/(auth)/sign-in");
  };

  const handleLogout = async () => {
    if (user) {
      await signOut();
    } else {
      await AsyncStorage.removeItem('staff_session');
      await AsyncStorage.removeItem('staff_business_id');
      setStaffData(null);
    }
    router.replace("/(auth)/sign-in");
  };

  const hasPermission = (permission: string) => {
    if (!isAnySignedIn) return true; // Show all to guest/logged-out users
    if (user) return true; // Owner has all permissions
    if (!staffData) return false;
    const userPermissions = staffData.permissions || [];
    return userPermissions.some((p: string) => p.toLowerCase().includes(permission.toLowerCase()));
  };

  return (
    <>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={rf(70)} color="#fff" />
          <Text style={styles.welcome}>
            {user ? `${t('hi')}, ${user.firstName || 'User'}` : (staffData ? `${t('hi')}, ${staffData.name}` : t('welcome_guest'))}
          </Text>
          {user && <Text style={styles.userId}>{user.primaryEmailAddress?.emailAddress}</Text>}
          {staffData && <Text style={styles.userId}>{staffData.email} (Staff)</Text>}
        </View>

        {hasPermission("Dashboard Permissions") && (
          <DrawerItem
            label={t('dashboard')}
            icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
            onPress={() => props.navigation.navigate("(tabs)", { screen: "Dashboard" })}
          />
        )}

        {hasPermission("Order & Billing Permissions") && (
          <DrawerItem
            label={t('home_menu')}
            icon={({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />}
            onPress={() => props.navigation.navigate("(tabs)", { screen: "menu" })}
          />
        )}

        {hasPermission("Invoices & Receipts - View Bill Records") && (
          <DrawerItem
            label={t('orders')}
            icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
            onPress={() => handleAuthenticatedNavigation("(tabs)", { screen: "orders" })}
          />
        )}

        {hasPermission("Menu & Items Permissions - Generate Table QR Codes") && (
          <DrawerItem
            label={t('table_qr_codes')}
            icon={({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />}
            onPress={() => {
              if (!isAnySignedIn) {
                setLoginModalVisible(true);
              } else {
                props.navigation.closeDrawer();
                setQrModalVisible(true);
              }
            }}
          />
        )}

        {hasPermission("Menu & Items Permissions - Edit Menu Items") && (
          <DrawerItem
            label={t('edit_menu_item')}
            icon={({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />}
            onPress={() => {
              if (!isAnySignedIn) {
                setLoginModalVisible(true);
              } else {
                props.navigation.closeDrawer();
                // Thoda aur zada delay (400ms) taaki Android par animation poori ho jaye
                setTimeout(() => {
                  setEditMenuModalVisible(true);
                }, 400);
              }
            }}
          />
        )}

        {hasPermission("Report Permissions - Item Sales Report") && (
          <DrawerItem
            label="Items Sales Report"
            icon={({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />}
            onPress={() => {
              if (!isAnySignedIn) {
                setLoginModalVisible(true);
              } else {
                props.navigation.closeDrawer();
                setTimeout(() => {
                  setInventoryModalVisible(true);
                }, 400);
              }
            }}
          />
        )}


        <DrawerItem
          label={t('settings')}
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => {
            if (!isAnySignedIn) {
              setLoginModalVisible(true);
            } else {
              props.navigation.navigate("(tabs)", { screen: "setting" });
            }
          }}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Smart Intelligence</Text>

        {hasPermission("AI Intelligence Tools - Access Profit Engine") && (
          <DrawerItem
            label="Profit Engine"
            icon={({ size }) => <Ionicons name="trending-up-outline" size={size} color="#10B981" />}
            onPress={() => {
              if (!isAnySignedIn) {
                setLoginModalVisible(true);
              } else {
                fetchAIData();
                props.navigation.closeDrawer();
                setTimeout(() => setProfitModalVisible(true), 400);
              }
            }}
          />
        )}

        {hasPermission("AI Intelligence Tools - Access Voice Command") && (
          <DrawerItem
            label="Voice Command"
            icon={({ size }) => <Ionicons name="mic-outline" size={size} color="#6366F1" />}
            onPress={() => {
              if (!isAnySignedIn) {
                setLoginModalVisible(true);
              } else {
                fetchAIData();
                props.navigation.closeDrawer();
                setTimeout(() => setVoiceModalVisible(true), 400);
              }
            }}
          />
        )}

        {hasPermission("Customer Permissions - View Customer Insights") && (
          <DrawerItem
            label="Customer Search"
            icon={({ size }) => <Ionicons name="search-outline" size={size} color="#f59e0b" />}
            onPress={() => {
              if (!isAnySignedIn) {
                setLoginModalVisible(true);
              } else {
                fetchAIData();
                props.navigation.closeDrawer();
                setTimeout(() => setHistoryModalVisible(true), 400);
              }
            }}
          />
        )}

        {!isAnySignedIn ? (
          <DrawerItem
            label={t('sign_in')}
            icon={({ color, size }) => <Ionicons name="log-in-outline" size={size} color={COLORS.primary} />}
            onPress={() => router.push("/(auth)/sign-in")}
            labelStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
          />
        ) : (
          <DrawerItem
            label={t('sign_out')}
            icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={COLORS.danger} />}
            onPress={handleLogout}
            labelStyle={{ color: COLORS.danger }}
          />
        )}
      </DrawerContentScrollView>

      <LoginRequiredModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSignIn={handleSignIn}
      />

      <Modal visible={qrModalVisible} animationType="slide" onRequestClose={() => setQrModalVisible(false)}>
        <TableQrCodes onBack={() => setQrModalVisible(false)} />
      </Modal>

      <Modal visible={editMenuModalVisible} animationType="slide" onRequestClose={() => setEditMenuModalVisible(false)}>
        <EditMenuItem onBack={() => setEditMenuModalVisible(false)} />
      </Modal>

      <Modal visible={inventoryModalVisible} animationType="slide" onRequestClose={() => setInventoryModalVisible(false)}>
        <ItemSalesReport onBack={() => setInventoryModalVisible(false)} />
      </Modal>

      <ProfitEngine
        visible={profitModalVisible}
        onClose={() => setProfitModalVisible(false)}
        bills={allBills}
      />

      <VoiceOrder
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        menus={menus}
        onItemMatched={(item, qty) => {
          // In sidebar, we just show it was matched
          alert(`Recognized: ${qty} x ${item.name}. Please go to Menu to add to cart.`);
        }}
      />

      <CustomerHistory
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        party={null}
        bills={allBills}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#4F46E5",
    padding: s(20),
    alignItems: "center",
  },
  welcome: { color: "#fff", fontSize: rf(18), fontWeight: "bold" },
  userId: { color: "rgba(255,255,255,0.8)", fontSize: rf(12), marginTop: vs(4) },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: vs(10), marginHorizontal: s(15) },
  sectionTitle: { fontSize: rf(12), fontWeight: 'bold', color: '#64748B', marginLeft: s(18), marginBottom: vs(5), textTransform: 'uppercase' },
});
