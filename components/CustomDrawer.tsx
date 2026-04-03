// app/CustomDrawer.tsx
// @ts-ignore
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { rf, s, vs } from "../utils/responsive";
import ItemSalesReport from "./item-sales-report/item-sales-report";
import { EditMenuItem } from "./menu/EditMenuItem";
import { TableQrCodes } from "./menu/TableQrCodes";
import { LoginRequiredModal } from "./settings/LoginRequiredModal";
import ProfitEngine from "./profit-engine/ProfitEngine";
import CustomerHistory from "./customer-insights/CustomerHistory";
import TableRotation from "./table-insights/TableRotation";
import VoiceOrder from "./voice-command/VoiceOrder";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    if (!user) {
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
      if (!token) return;

      // Fetch Bills
      const billRes = await fetch("https://billing.kravy.in/api/bill-manager", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (billRes.ok) {
        const data = await billRes.json();
        setAllBills(data.bills || []);
      }

      // Fetch Orders
      const orderRes = await fetch("https://billing.kravy.in/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={rf(70)} color="#fff" />
          <Text style={styles.welcome}>{user ? `${t('hi')}, ${user.firstName || 'User'}` : t('welcome_guest')}</Text>
          {user && <Text style={styles.userId}>{user.primaryEmailAddress?.emailAddress}</Text>}
        </View>

        <DrawerItem
          label={t('dashboard')}
          icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("(tabs)", { screen: "Dashboard" })}
        />

        <DrawerItem
          label={t('home_menu')}
          icon={({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("(tabs)", { screen: "menu" })}
        />
        <DrawerItem
          label={t('orders')}
          icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
          onPress={() => handleAuthenticatedNavigation("(tabs)", { screen: "orders" })}
        />

        <DrawerItem
          label={t('table_qr_codes')}
          icon={({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              props.navigation.closeDrawer();
              setQrModalVisible(true);
            }
          }}
        />
        <DrawerItem
          label={t('edit_menu_item')}
          icon={({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />}
          onPress={() => {
            if (!user) {
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

        <DrawerItem
          label="Items Sales Report"
          icon={({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              props.navigation.closeDrawer();
              setTimeout(() => {
                setInventoryModalVisible(true);
              }, 400);
            }
          }}
        />


        <DrawerItem
          label={t('settings')}
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              props.navigation.navigate("(tabs)", { screen: "setting" });
            }
          }}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Smart Intelligence</Text>

        <DrawerItem
          label="Profit Engine"
          icon={({ size }) => <Ionicons name="trending-up-outline" size={size} color="#10B981" />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              fetchAIData();
              props.navigation.closeDrawer();
              setTimeout(() => setProfitModalVisible(true), 400);
            }
          }}
        />

        <DrawerItem
          label="Voice Command"
          icon={({ size }) => <Ionicons name="mic-outline" size={size} color="#6366F1" />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              fetchAIData();
              props.navigation.closeDrawer();
              setTimeout(() => setVoiceModalVisible(true), 400);
            }
          }}
        />

        <DrawerItem
          label="Customer Search"
          icon={({ size }) => <Ionicons name="search-outline" size={size} color="#f59e0b" />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              fetchAIData();
              props.navigation.closeDrawer();
              setTimeout(() => setHistoryModalVisible(true), 400);
            }
          }}
        />

        {!user ? (
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
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/sign-in");
            }}
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
