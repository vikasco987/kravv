import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import RNBluetoothClassic from "react-native-bluetooth-classic";
import "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoginRequiredModal } from "../../components/common/LoginRequiredModal";
import TopNavBar from "../../components/common/TopNavBar";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";

export default function TabsLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const { refreshSignal } = useRefresh();

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
    const interval = setInterval(checkAndConnectPrinter, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    if (pathname.includes("Dashboard")) return t('dashboard');
    if (pathname.includes("menu")) return t('menu');
    if (pathname.includes("orders")) return "Tables";
    if (pathname.includes("Client")) return t('client');
    if (pathname.includes("Printer")) return t('printer');
    if (pathname.includes("setting")) return t('settings');
    if (pathname.includes("kot")) return "KOT";
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
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
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
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: "Tables",
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "list" : "list-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Client"
          options={{
            title: t('client'),
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
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
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <View>
                <Ionicons
                  name={focused ? "print" : "print-outline"}
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
            href: undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={size}
                color={color}
              />
            ),
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
