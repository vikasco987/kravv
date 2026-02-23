


















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
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomDrawerContent from "../components/CustomDrawer";

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
      <AuthRedirect />
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

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready || !isLoaded) return;

    if (!isSignedIn) {
      setTimeout(() => tokenCache.clearToken(), 300);
      if (Platform.OS === "web") setTimeout(() => window.location.reload(), 15000);
      router.replace("/(auth)/sign-in");
      return;
    }

    const checkToken = async () => {
      const retries = 5;
      const delay = 500;
      let token: string | null = null;

      for (let i = 0; i < retries; i++) {
        token = await getToken({ skipCache: true });
        if (token) break;
        await new Promise((res) => setTimeout(res, delay));
      }

      if (!token) return;

      if (session?.id && session.id !== lastSessionId) {
        setLastSessionId(session.id);
        if (Platform.OS === "web") window.location.reload();
        else router.replace("/(tabs)/menu");
      }
    };

    checkToken();
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
            drawerLabel: "Home",
            drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="party/index"
          options={{
            drawerLabel: "Parties",
            drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
