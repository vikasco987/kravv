"use client";

import { ClerkProvider, useAuth, useSession } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import Constants from "expo-constants";
import { Stack, usePathname, useRouter } from "expo-router";
// @ts-ignore
import { Drawer } from "expo-router/drawer";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, ToastAndroid, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import NewOrderNotifier from "../components/common/NewOrderNotifier";
import CustomDrawerContent from "../components/sidebar/CustomDrawer";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";
import { RefreshProvider, useRefresh } from "../context/RefreshContext";
import { SoundManager } from "../utils/SoundManager";

// --- BACKGROUND WAKEUP LOGIC FOR NOTIFEE ---
import notifee, { AndroidCategory, AndroidImportance } from '@notifee/react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (data) {
    try {
      const channelId = await notifee.createChannel({
        id: 'urgent_orders_fullscreen',
        name: 'Urgent Orders',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: '🚨 NEW URGENT ORDER! 🚨',
        body: 'Tap to open the app and view the order.',
        android: {
          channelId,
          category: AndroidCategory.CALL,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
            mainComponent: 'main',
          },
          fullScreenAction: {
            id: 'default',
          },
        },
      });
    } catch (e) {
      console.log('Notifee background error:', e);
    }
  }
});

// Register background task and handle Notifee background actions
try {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    // Handle action press in background if needed
  });

  // Keep the app alive when Foreground Service is active
  notifee.registerForegroundService((notification) => {
    return new Promise(() => {
      // Promise remains pending to keep the service running indefinitely
    });
  });
} catch (e) {
  console.log('Background task setup error:', e);
}
// -------------------------------------------

WebBrowser.maybeCompleteAuthSession();

// Clerk token cache
const tokenCache = {
  async getToken(key: string) {
    const value = await SecureStore.getItemAsync(key);
    console.log("🗄️ getToken:", key, value ? value.slice(0, 15) + "..." : null);
    return value;
  },
  async saveToken(key: string, value: string) {
    console.log(
      "💾 saveToken:",
      key,
      value ? value.slice(0, 15) + "..." : null,
    );
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
  // Initialise global click sound once when app mounts
  useEffect(() => {
    SoundManager.init();
    return () => {
      SoundManager.destroy();
    };
  }, []);

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
  const [isStaffSignedIn, setIsStaffSignedIn] = useState<boolean | null>(null);
  const { t } = useLanguage();

  const { refreshSignal } = useRefresh();

  const soundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backPressCountRef = useRef(0);
  const backPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleBackPress = () => {
      backPressCountRef.current += 1;

      if (backPressCountRef.current >= 3) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Exiting app...', ToastAndroid.SHORT);
        }
        BackHandler.exitApp();
        return true;
      }

      const pressesLeft = 3 - backPressCountRef.current;

      if (Platform.OS === 'android') {
        ToastAndroid.show(`Press back ${pressesLeft} more time${pressesLeft > 1 ? 's' : ''} to exit`, ToastAndroid.SHORT);
      }

      if (backPressTimerRef.current) {
        clearTimeout(backPressTimerRef.current);
      }

      backPressTimerRef.current = setTimeout(() => {
        backPressCountRef.current = 0;
      }, 2000);

      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      backHandler.remove();
      if (backPressTimerRef.current) clearTimeout(backPressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setReady(true);
    checkStaffSession();
  }, [refreshSignal]);

  const checkStaffSession = async () => {
    try {
      const session = await AsyncStorage.getItem("staff_session");
      setIsStaffSignedIn(!!session);
    } catch (e) {
      setIsStaffSignedIn(false);
    }
  };

  const pathname = usePathname();
  const isPublicMenu = pathname?.startsWith("/menu/");

  useEffect(() => {
    if (!ready || !isLoaded || isStaffSignedIn === null) return;

    const isAuthRoute = pathname?.startsWith("/(auth)");

    // 1. If signed in (Google or Staff) and on an auth page, go to Menu
    if ((isSignedIn || isStaffSignedIn) && isAuthRoute) {
      router.replace("/(tabs)/menu?login=true");
    }

    // [REMOVED] Forced redirect to sign-in to allow back button to work properly.
    // The Menu screen handles restricted access via MenuAccessWrapper.
  }, [ready, isLoaded, isSignedIn, isStaffSignedIn, pathname]);

  if (!isLoaded || !ready || isStaffSignedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const isAuthRoute = pathname?.startsWith("/(auth)");

  // Handle Public Menu & Auth Routes separately (bypass Drawer)
  if (isPublicMenu || isAuthRoute) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{ flex: 1 }}
          onStartShouldSetResponderCapture={() => {
            // Fires for EVERY touch — schedule sound tentatively
            soundTimerRef.current = setTimeout(() => {
              SoundManager.play();
              soundTimerRef.current = null;
            }, 0);
            return false; // Don't capture — let children handle
          }}
          onStartShouldSetResponder={() => {
            // Fires ONLY when no child claimed the touch (empty area tap) — cancel sound
            if (soundTimerRef.current) {
              clearTimeout(soundTimerRef.current);
              soundTimerRef.current = null;
            }
            return false; // Don't become responder
          }}
        >
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onStartShouldSetResponderCapture={() => {
          // Fires for EVERY touch — schedule sound tentatively
          soundTimerRef.current = setTimeout(() => {
            SoundManager.play();
            soundTimerRef.current = null;
          }, 0);
          return false; // Don't capture — let children handle
        }}
        onStartShouldSetResponder={() => {
          // Fires ONLY when no child claimed the touch (empty area tap) — cancel sound
          if (soundTimerRef.current) {
            clearTimeout(soundTimerRef.current);
            soundTimerRef.current = null;
          }
          return false; // Don't become responder
        }}
      >
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
              drawerLabel: t("home"),
              drawerIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
        </Drawer>
      </View>
    </GestureHandlerRootView>
  );
}
