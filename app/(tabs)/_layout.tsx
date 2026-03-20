import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopNavBar from "../../components/TopNavBar";
import { LoginRequiredModal } from "../../components/settings/LoginRequiredModal";
import { useLanguage } from "../../context/LanguageContext";

export default function TabsLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loginModalVisible, setLoginModalVisible] = useState(false);

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
              if (!isSignedIn) {
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
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "print" : "print-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="setting"
          options={{
            title: t('settings'),
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
