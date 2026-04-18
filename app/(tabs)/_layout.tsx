import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { View, Alert, DeviceEventEmitter } from "react-native";
import "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoginRequiredModal } from "../../components/common/LoginRequiredModal";
import TopNavBar from "../../components/common/TopNavBar";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  const checkAuth = useCallback(async () => {
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
  }, [isSignedIn]);

  useEffect(() => {
    checkAuth();
  }, [pathname, refreshSignal, checkAuth]);

  const hasTabPermission = (tabName: string) => {
    // If not signed in at all (guest), show all (they'll be blocked by modals later)
    if (!isSignedIn && !isStaffSignedIn) return true;

    // In other cases, use pre-calculated state
    return !!allowedTabs[tabName];
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('PERMISSIONS_UPDATED', () => {
      checkAuth();
    });
    return () => sub.remove();
  }, [checkAuth]);

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
    if (pathname.includes("kot")) return "KOT";
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
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => {
              const hasPerm = hasTabPermission("Dashboard");
              return (
                <Ionicons
                  name={(hasPerm ? (focused ? "stats-chart" : "stats-chart-outline") : "lock-closed") as any}
                  size={size}
                  color={hasPerm ? color : "#9CA3AF"}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!hasTabPermission("Dashboard")) {
                e.preventDefault();
                Alert.alert("Access Denied", "Dashboard access is restricted.");
              }
            }
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: t('menu'),
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => {
              const hasPerm = hasTabPermission("Menu");
              return (
                <Ionicons
                  name={(hasPerm ? (focused ? "grid" : "grid-outline") : "lock-closed") as any}
                  size={size}
                  color={hasPerm ? color : "#9CA3AF"}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!hasTabPermission("Menu")) {
                e.preventDefault();
                Alert.alert("Access Denied", "Menu management is restricted for your account.");
              }
            }
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: t('orders'),
            href: undefined, // Always show, but lock if no permission
            tabBarIcon: ({ color, size, focused }) => {
              const hasPerm = hasTabPermission("Orders");
              return (
                <Ionicons
                  name={(hasPerm ? (focused ? "list" : "list-outline") : "lock-closed") as any}
                  size={size}
                  color={hasPerm ? color : "#9CA3AF"}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!isSignedIn && !isStaffSignedIn) {
                e.preventDefault();
                setLoginModalVisible(true);
              } else if (!hasTabPermission("Orders")) {
                e.preventDefault();
                Alert.alert("Access Denied", "You don't have permission to access Orders & Tables. Please contact your administrator.");
              }
            },
          }}
        />

        <Tabs.Screen
          name="Client"
          options={{
            title: t('client'),
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => {
              const hasPerm = hasTabPermission("Client");
              return (
                <Ionicons
                  name={(hasPerm ? (focused ? "people" : "people-outline") : "lock-closed") as any}
                  size={size}
                  color={hasPerm ? color : "#9CA3AF"}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!hasTabPermission("Client")) {
                e.preventDefault();
                Alert.alert("Access Denied", "Customer management and ledger access is restricted.");
              }
            }
          }}
        />

        <Tabs.Screen
          name="Printer"
          options={{
            title: t('printer'),
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => {
              const hasPerm = hasTabPermission("Settings");
              return (
                <View>
                  <Ionicons
                    name={(hasPerm ? (focused ? "print" : "print-outline") : "lock-closed") as any}
                    size={size}
                    color={hasPerm ? color : "#9CA3AF"}
                  />
                  {hasPerm && (
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
                  )}
                </View>
              );
            },
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!hasTabPermission("Settings")) {
                e.preventDefault();
                Alert.alert("Access Denied", "Printer settings are restricted.");
              }
            }
          }}
        />

        <Tabs.Screen
          name="setting"
          options={{
            title: t('settings'),
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => {
              const hasPerm = hasTabPermission("Settings");
              return (
                <Ionicons
                  name={(hasPerm ? (focused ? "settings" : "settings-outline") : "lock-closed") as any}
                  size={size}
                  color={hasPerm ? color : "#9CA3AF"}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e: any) => {
              if (!hasTabPermission("Settings")) {
                e.preventDefault();
                Alert.alert("Access Denied", "Settings access is restricted.");
              }
            }
          }}
        />
        <Tabs.Screen
          name="kot"
          options={{
            title: "KOT",
            href: null,
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
