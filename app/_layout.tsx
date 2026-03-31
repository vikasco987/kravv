"use client";

import { ClerkProvider, useAuth, useSession } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import Constants from "expo-constants";
import { useRouter } from "expo-router";
// @ts-ignore
import { Drawer } from "expo-router/drawer";
// @ts-ignore
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomDrawerContent from "../components/CustomDrawer";
import { RefreshProvider } from "../context/RefreshContext";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";
import NewOrderNotifier from "../components/NewOrderNotifier";

WebBrowser.maybeCompleteAuthSession();

// Clerk token cache
const tokenCache = {
  async getToken(key: string) {
    const value = await SecureStore.getItemAsync(key);
    console.log("🗄️ getToken:", key, value ? value.slice(0, 15) + "..." : null);
    return value;
  },
  async saveToken(key: string, value: string) {
    console.log("💾 saveToken:", key, value ? value.slice(0, 15) + "..." : null);
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken() {
    try {
      await SecureStore.deleteItemAsync("__clerk_client_jwt");
      console.log("🧹 Cleared old token");
    } catch (err) {
      console.log("⚠️ Failed to clear token:", err);
    }
  },
};

export default function RootLayout() {
  const publishableKey =
    Constants.expoConfig?.extra?.clerkPublishableKey ||
    // @ts-ignore
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) throw new Error("Missing Clerk Publishable Key");

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <LanguageProvider>
        <RefreshProvider>
          <AuthRedirect />
        </RefreshProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}

// Auth redirect logic
function AuthRedirect() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();
  const [ready, setReady] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready || !isLoaded) return;

    // Only redirect to menu if we are at the root or just signed in and not yet on a screen
    if (isSignedIn && session?.id && session.id !== lastSessionId) {
      setLastSessionId(session.id);
      // Removed the forced router.replace("/(tabs)/menu") to allow navigation to other screens
    }
  }, [ready, isLoaded, isSignedIn, session?.id]);

  if (!isLoaded || !ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NewOrderNotifier />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: "#4F46E5",
          drawerLabelStyle: { fontSize: 16 },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: t('home'),
            drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="party/index"
          options={{
            drawerLabel: t('parties'),
            drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="party/items"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="party/bill"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="party/add"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="party/info"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />

      </Drawer>
    </GestureHandlerRootView>
  );
}
