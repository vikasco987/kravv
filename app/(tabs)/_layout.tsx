import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopNavBar from "../../components/TopNavBar";
import { LoginRequiredModal } from "../../components/settings/LoginRequiredModal";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { View } from "react-native";
// @ts-ignore
import RNBluetoothClassic from "react-native-bluetooth-classic";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

export default function TabsLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [staffPerms, setStaffPerms] = useState<string[]>([]);
  const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);
  const { refreshSignal } = useRefresh();

  useEffect(() => {
    const checkAuth = async () => {
       const staffSession = await AsyncStorage.getItem("staff_session");
       if (staffSession) {
         const data = JSON.parse(staffSession);
         setIsStaffSignedIn(true);
         setStaffPerms(data.permissions || []);
       } else {
         setIsStaffSignedIn(false);
         setStaffPerms([]);
       }
    };
    checkAuth();
  }, [pathname, refreshSignal]);

  const hasTabPermission = (tabName: string) => {
    if (isSignedIn) return true; // Owner has all
    if (!isStaffSignedIn) return true; // Show all if no session exists (guest mode)
    
    const permissions = staffPerms.map(p => p.toLowerCase());
    
    switch (tabName) {
      case "Dashboard":
        return permissions.some(p => p.includes("sales") || p.includes("analytics") || p.includes("view"));
      case "Menu":
        return permissions.some(p => p.includes("create") || p.includes("bill") || p.includes("cart") || p.includes("discount") || p.includes("tax") || p.includes("items") || p.includes("categories"));
      case "Orders":
        return permissions.some(p => p.includes("records") || p.includes("reprint") || p.includes("edit saved"));
      case "Client":
        return permissions.some(p => p.includes("customer") || p.includes("ledger"));
      case "Intelligence":
        return permissions.some(p => p.includes("profit") || p.includes("voice") || p.includes("rotation"));
      case "Reports":
        return permissions.some(p => p.includes("report") || p.includes("records"));
      case "Settings":
        return permissions.some(p => p.includes("manage staff") || p.includes("printer") || p.includes("pin") || p.includes("whatsapp"));
      default:
        return false;
    }
  };

  useEffect(() => {
    const checkPrinter = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("saved_printer");
        if (!savedAddress) {
          setIsPrinterConnected(false);
          return;
        }
        
        const devices = await RNBluetoothClassic.getBondedDevices();
        const printer = devices.find((d: any) => d.address === savedAddress);
        
        if (printer) {
          const connected = await printer.isConnected();
          setIsPrinterConnected(connected);
        } else {
          setIsPrinterConnected(false);
        }
      } catch (err) {
        setIsPrinterConnected(false);
      }
    };

    checkPrinter();
    const interval = setInterval(checkPrinter, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // ✅ AUTO-REDIRECT FOR STAFF
  useEffect(() => {
    if (!isStaffSignedIn || isSignedIn) return;

    const currentTab = pathname.split('/').pop() || "";
    const tabMapping: Record<string, string> = {
      "Dashboard": "Dashboard",
      "menu": "Menu",
      "orders": "Orders",
      "Client": "Client",
      "setting": "Settings",
      "Printer": "Settings"
    };

    const activeTabName = tabMapping[currentTab];
    if (activeTabName && !hasTabPermission(activeTabName)) {
      // Redirect to first allowed tab
      const order = ["Dashboard", "menu", "Client", "orders", "setting"];
      for (const tab of order) {
        if (hasTabPermission(tabMapping[tab] || tab)) {
          router.replace(`/(tabs)/${tab}` as any);
          return;
        }
      }
    }
  }, [pathname, isStaffSignedIn, isSignedIn]);

  // Dynamic title logic: matches file names
  const getTitle = () => {
    if (pathname.includes("Dashboard")) return t('dashboard');
    if (pathname.includes("menu")) return t('menu');
    if (pathname.includes("orders")) return t('orders');
    if (pathname.includes("Client")) return t('client');
    if (pathname.includes("Printer")) return t('printer');
    if (pathname.includes("setting")) return t('settings');
    return "App";
  };

  return (
    <>
      <TopNavBar title={getTitle()} showSearch={pathname.includes("menu")} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1E90FF",
          tabBarInactiveTintColor: "#6B7280",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            height: 60 + (insets.bottom || 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          }
        }}
      >
        <Tabs.Screen
          name="Dashboard"
          options={{
            title: t('dashboard'),
            href: hasTabPermission("Dashboard") ? undefined : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "stats-chart" : "stats-chart-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: t('menu'),
            href: hasTabPermission("Menu") ? undefined : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "grid" : "grid-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: t('orders'),
            href: hasTabPermission("Orders") ? undefined : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "list" : "list-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!isSignedIn && !isStaffSignedIn) {
                e.preventDefault();
                setLoginModalVisible(true);
              }
            },
          }}
        />

        <Tabs.Screen
          name="Client"
          options={{
            title: t('client'),
            href: hasTabPermission("Client") ? undefined : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "people" : "people-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Printer"
          options={{
            title: t('printer'),
            href: hasTabPermission("Settings") ? undefined : null,
            tabBarIcon: ({ color, size, focused }) => (
              <View>
                <Ionicons
                  name={(focused ? "print" : "print-outline") as any}
                  size={size}
                  color={color}
                />
                <View style={{
                  position: 'absolute',
                  right: -4,
                  top: -2,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isPrinterConnected ? "#10B981" : "#EF4444",
                  borderWidth: 1.5,
                  borderColor: '#fff'
                }} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="setting"
          options={{
            title: t('settings'),
            href: hasTabPermission("Settings") ? undefined : null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "settings" : "settings-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <LoginRequiredModal 
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSignIn={() => {
          setLoginModalVisible(false);
          router.push("/(auth)/sign-in");
        }}
      />
    </>
  );
}
