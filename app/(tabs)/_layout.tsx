import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import React from "react";
import "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopNavBar from "../../components/TopNavBar";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Dynamic title logic: matches file names
  const getTitle = () => {
    if (pathname.includes("Dashboard")) return "Sales Dashboard";
    if (pathname.includes("menu")) return "POS Menu";
    if (pathname.includes("Inventory")) return "Inventory";
    if (pathname.includes("Client")) return "Customers & Parties";
    if (pathname.includes("Printer")) return "Printer Setup";
    if (pathname.includes("setting")) return "Settings";
    return "App";
  };

  return (
    <>
      <TopNavBar title={getTitle()} />

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
            title: "Dashboard",
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
            title: "Menu",
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
          name="Inventory"
          options={{
            title: "Inventory",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? "cube" : "cube-outline") as any}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Client"
          options={{
            title: "Customers",
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
            title: "Printer",
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
            title: "Settings",
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
    </>
  );
}
