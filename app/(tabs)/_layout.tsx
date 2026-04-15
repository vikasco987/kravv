import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoginRequiredModal } from "../../components/common/LoginRequiredModal";
import TopNavBar from "../../components/common/TopNavBar";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import RNBluetoothClassic from "react-native-bluetooth-classic";
import { StaffPermissionEngine } from "../../components/staff creat/StaffPermissionEngine";

import { NoAccessView } from "../../components/staff creat/NoAccessView";

export default function TabsLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);
  const [allowedTabs, setAllowedTabs] = useState<Record<string, boolean>>({});
  const { refreshSignal } = useRefresh();

  // Determine if there is at least one accessible tab for staff
  const hasAnyAccess = Object.values(allowedTabs).some(v => v === true);

  useEffect(() => {
    const checkAuth = async () => {
      const staffSession = await AsyncStorage.getItem("staff_session");
      const isStaff = !!staffSession;
      setIsStaffSignedIn(isStaff);

      // Pre-calculate permissions for all tabs
      const tabs = ["Dashboard", "Menu", "Orders", "Client", "Intelligence", "Reports", "Settings"];
      const results: Record<string, boolean> = {};

      for (const tab of tabs) {
        results[tab] = await StaffPermissionEngine.hasCategoryAccess(tab, !!isSignedIn);
      }
      setAllowedTabs(results);
    };
    checkAuth();
  }, [pathname, refreshSignal, isSignedIn]);

  const hasTabPermission = (tabName: string) => {
    // If not signed in at all (guest), show all (they'll be blocked by modals later)
    if (!isSignedIn && !isStaffSignedIn) return true;

    // In other cases, use pre-calculated state
    return !!allowedTabs[tabName];
  };

  useEffect(() => {
    const checkAndConnectPrinter = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("saved_printer");
        if (!savedAddress) {
          setIsPrinterConnected(false);
          return;
        }

        const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
        if (!isEnabled) {
          setIsPrinterConnected(false);
          return;
        }

        const isConnected = await RNBluetoothClassic.isDeviceConnected(savedAddress);
        if (isConnected) {
          setIsPrinterConnected(true);
        } else {
          // Attempt silent auto-connect in background
          try {
            const connection = await RNBluetoothClassic.connectToDevice(savedAddress, {
              connectorType: "rfcomm",
              secure: false,
            });
            setIsPrinterConnected(!!connection);
          } catch (e) {
            setIsPrinterConnected(false);
          }
        }
      } catch (err) {
        setIsPrinterConnected(false);
      }
    };

    checkAndConnectPrinter();
    const interval = setInterval(checkAndConnectPrinter, 5000); // Check and reconnect every 5 seconds
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
  }, [pathname, isStaffSignedIn, isSignedIn, allowedTabs]);

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

  // If a staff is signed in but has ZERO permissions, show the NoAccessView
  if (isStaffSignedIn && !isSignedIn && !hasAnyAccess && Object.keys(allowedTabs).length > 0) {
    return <NoAccessView />;
  }

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
