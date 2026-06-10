import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  DeviceEventEmitter,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import BackgroundTimer from 'react-native-background-timer';
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
import { resolveOrderToken } from "../../utils/SimpleBill";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { SimpleKOT } from "./SimpleKOT";

const { width } = Dimensions.get("window");

const NewOrderNotifier = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [newOrderInfo, setNewOrderInfo] = useState<any>(null);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const processedOrderIds = useRef(new Set<string>());
  const isInitialized = useRef(false);
  const { refreshSignal } = useRefresh();
  const [staffData, setStaffData] = useState<{
    token: string;
    id: string;
  } | null>(null);

  const slideAnim = useRef(new Animated.Value(-500)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const fetchInProgress = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const displayedNotifIds = useRef<string[]>([]);

  // Setup Notifications Handler
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }) as any,
  });

  // ✅ SILENT AUDIO HACK to keep JS thread 100% awake in Android background
  useEffect(() => {
    let bgSound: Audio.Sound | null = null;
    const playSilentAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/add.wav"),
          { isLooping: true, volume: 0 }
        );
        bgSound = sound;

        // Force JS bridge to wake up every 1000ms by receiving native audio updates
        bgSound.setProgressUpdateIntervalAsync(1000);
        bgSound.setOnPlaybackStatusUpdate((status) => {
          // Empty callback is enough to keep the JS event loop ticking exactly on time!
        });

        await bgSound.playAsync();
      } catch (e) {
        console.log("Silent audio failed:", e);
      }
    };

    if (isSignedIn || staffData) {
      playSilentAudio();
    }

    return () => {
      if (bgSound) {
        bgSound.stopAsync().catch(() => { });
        bgSound.unloadAsync().catch(() => { });
      }
    };
  }, [isSignedIn, staffData]);

  // Setup Notification Channels and Permissions
  useEffect(() => {
    async function setupNotifications() {
      // Create Channel for Android
      await Notifications.setNotificationChannelAsync("urgent-orders", {
        name: "Urgent Orders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "urgent_order.wav", // Fallback for custom sound if added in assets
      });

      // Request Permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    }

    setupNotifications();

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });
  }, []);

  // Sync Push Token to Backend
  useEffect(() => {
    async function registerAndSyncPushToken() {
      if (!user?.id) return;

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== "granted") return; // already requested in setupNotifications

        // Use default projectId resolving
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const pushToken = tokenData.data;

        if (pushToken) {
          console.log("📲 Syncing Push Token to Backend:", pushToken);
          await fetch("https://billing.kravy.in/api/profile/push-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerkUserId: user.id, token: pushToken }),
          }).catch((err) => console.log("Push token sync failed:", err));
        }
      } catch (error) {
        console.log("Failed to get push token:", error);
      }
    }

    registerAndSyncPushToken();
  }, [user?.id]);

  // Check for Staff Session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let staffToken = await AsyncStorage.getItem("staff_token");
        if (!staffToken) {
          const sessionStr = await AsyncStorage.getItem("staff_session");
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            staffToken = session.token;
          }
        }

        const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

        if (staffToken) {
          setStaffData({
            token: staffToken,
            id: bId || "staff",
          });
        } else {
          setStaffData(null);
        }
      } catch (e) {
        setStaffData(null);
      }
    };
    checkAuth();
  }, [refreshSignal, isSignedIn]);

  const startRingtone = async () => {
    try {
      if (soundRef.current) return; // Already playing
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: "https://assets.mixkit.co/active_storage/sfx/1357/1357-preview.mp3",
        },
        { shouldPlay: true, isLooping: true, volume: 1.0 },
      );
      soundRef.current = sound;

      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } catch (error) { }
  };

  const stopRingtone = async () => {
    if (pendingOrders.length > 1) return; // Keep playing if more orders exist
    flashAnim.stopAnimation();
    flashAnim.setValue(1);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) { }
    }
  };

  const triggerNotification = (order: any) => {
    setNewOrderInfo(order);
    setShowNotification(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    startRingtone();
  };

  const hideNotification = () => {
    const nextOrders = pendingOrders.slice(1);
    setPendingOrders(nextOrders);

    if (nextOrders.length === 0) {
      stopRingtone();
      setShowNotification(false);
      setNewOrderInfo(null);
      slideAnim.setValue(-1000);
    } else {
      // Immediately show next order
      setNewOrderInfo(nextOrders[0]);
    }
  };

  const getNextTokenNumber = async () => {
    try {
      const currentToken = await AsyncStorage.getItem("@token_counter");
      const nextToken = currentToken ? parseInt(currentToken) + 1 : 1;
      await AsyncStorage.setItem("@token_counter", String(nextToken));
      return String(nextToken);
    } catch (e) {
      return String(Math.floor(100 + Math.random() * 900));
    }
  };

  const handleAccept = async () => {
    const currentOrder = newOrderInfo; // Capture current
    // Hide/Next happens immediately in UI but logic continues
    hideNotification();

    try {
      let authToken = null;
      let userId = "unknown";

      if (isSignedIn) {
        authToken = await getToken();
        userId = user?.id || "unknown";
      } else if (staffData) {
        // Leave authToken as null so backend falls back to cookie and doesn't reject staff token
        userId = staffData.id;
      }

      if (currentOrder) {
        // 🚀 Mark order as PREPARING so it shows up as "Live" in the app and doesn't auto-hold
        await fetch("https://billing.kravy.in/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            orderId: currentOrder._id || currentOrder.id,
            status: "PREPARING",
          }),
        }).catch((err) => console.log("[NewOrder] Status update failed:", err));

        DeviceEventEmitter.emit("REFRESH_ORDERS");

        // --- DEEP SEARCH FOR ITEMS ---
        let rawItems =
          currentOrder.items ||
          currentOrder.cart ||
          currentOrder.products ||
          currentOrder.orderItems ||
          currentOrder.order_items ||
          currentOrder.data?.items ||
          currentOrder.cart_items ||
          [];

        // If items are in an object (keyed by ID), convert to array
        if (
          rawItems &&
          !Array.isArray(rawItems) &&
          typeof rawItems === "object"
        ) {
          rawItems = Object.values(rawItems);
        }

        const items = (Array.isArray(rawItems) ? rawItems : []).map(
          (it: any) => ({
            name: String(
              it.name ||
              it.itemName ||
              it.item_name ||
              it.productName ||
              it.product_name ||
              it.title ||
              it.label ||
              it.item ||
              "Item",
            ),
            quantity: Number(
              it.quantity ||
              it.qty ||
              it.qnt ||
              it.count ||
              it.amount ||
              it.unit ||
              it.Quantity ||
              1,
            ),
          }),
        );

        console.log(
          `[NewOrder] Raw Items Count: ${rawItems?.length || 0}, Mapped: ${items.length}`,
        );

        if (items.length > 0) {
          const tableName =
            currentOrder.tableName ||
            currentOrder.table?.name ||
            currentOrder.table_name ||
            "Online Order";
          const backendToken = currentOrder.tokenNumber || currentOrder.dailyTokenNumber || currentOrder.orderNumber || currentOrder.billNumber || currentOrder.kotNumbers?.[0]?.toString();
          const orderId = currentOrder._id || currentOrder.id;
          const tokenNo = await resolveOrderToken(orderId, backendToken);
          await SimpleKOT(
            items,
            authToken,
            userId,
            tableName,
            tokenNo,
            undefined,
            currentOrder.customerName || currentOrder.customer?.name,
          );
        }

        // 🚀 Force UI Update
        DeviceEventEmitter.emit("REFRESH_ORDERS");
        DeviceEventEmitter.emit("refresh_orders_list");
        fetchOrders();
      }
    } catch (e) {
      console.log("Auto KOT Print Error:", e);
    }
  };

  // ✅ AUTO ACCEPT LOGIC
  useEffect(() => {
    let autoAcceptTimer: any;

    const checkAndAutoAccept = async () => {
      if (showNotification && newOrderInfo) {
        try {
          const autoAcceptSaved =
            await AsyncStorage.getItem("order_auto_accept");
          if (autoAcceptSaved === "true") {
            console.log(
              "[NewOrder] Auto Accept is ENABLED. Timing out for 4 seconds...",
            );
            autoAcceptTimer = setTimeout(() => {
              console.log("[NewOrder] Timer finished. Executing AUTO-ACCEPT!");
              handleAccept();
            }, 4000); // Wait 4 seconds for reach/ring
          }
        } catch (e) {
          console.error("Auto Accept Check failed:", e);
        }
      }
    };

    checkAndAutoAccept();

    return () => {
      if (autoAcceptTimer) clearTimeout(autoAcceptTimer);
    };
  }, [showNotification, newOrderInfo]);

  // ✅ AUTO DISMISS IF ACCEPTED ON WEB
  useEffect(() => {
    if (showNotification && newOrderInfo && latestOrders.length > 0) {
      const dbOrder = latestOrders.find((o) => (o._id || o.id) === (newOrderInfo._id || newOrderInfo.id));
      if (dbOrder && dbOrder.status !== "PENDING") {
        console.log("[NewOrder] Order was accepted on another device/web. Dismissing popup.");
        ToastAndroid.show("Order accepted on Web/Another device", ToastAndroid.SHORT);
        hideNotification();
      }
    }
  }, [latestOrders, showNotification, newOrderInfo]);

  const fetchOrders = async () => {
    if ((!isSignedIn && !staffData) || fetchInProgress.current) return;
    try {
      fetchInProgress.current = true;
      const authToken = await getToken();

      const url = `https://billing.kravy.in/api/orders?active=true&t=${Date.now()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const oData = await response.json();
        const orders: any[] = Array.isArray(oData) ? oData : oData.orders || [];
        setLatestOrders(orders);

        if (!isInitialized.current) {
          orders.forEach((o) => processedOrderIds.current.add(o._id || o.id));
          isInitialized.current = true;
          return;
        }

        const newlyArrivedOrders = orders.filter(
          (o) => !processedOrderIds.current.has(o._id || o.id),
        );

        if (newlyArrivedOrders.length > 0) {
          newlyArrivedOrders.forEach((o) =>
            processedOrderIds.current.add(o._id || o.id),
          );

          // Only alert for online/QR orders
          const alertableOrders = newlyArrivedOrders.filter((o) => o.source !== "OFFLINE");

          if (alertableOrders.length > 0) {
            // ✅ TRIGGER SYSTEM NOTIFICATION
            const firstOrder = alertableOrders[0];
            const notifId = String(firstOrder._id || firstOrder.id || Date.now());
            displayedNotifIds.current.push(notifId);

            setPendingOrders((prev) => {
              const updated = [...prev, ...alertableOrders];
              if (prev.length === 0 && !showNotification) {
                triggerNotification(updated[0]);
              }
              return updated;
            });
          }
        }
      }
    } catch (error) {
    } finally {
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    if (!isSignedIn && !staffData) {
      processedOrderIds.current.clear();
      isInitialized.current = false;
      setPendingOrders([]);
      stopRingtone();
      return;
    }
    fetchOrders();

    // ✅ Listen for manual refresh signals to show popup instantly
    const refreshSub = DeviceEventEmitter.addListener(
      "REFRESH_ORDERS",
      fetchOrders,
    );

    // ✅ Listen for local offline orders so they don't trigger alarms
    const localOrderSub = DeviceEventEmitter.addListener(
      "LOCAL_ORDER_CREATED",
      (orderId) => {
        if (orderId) {
          processedOrderIds.current.add(String(orderId));
        }
      }
    );

    // ✅ Extreme fast polling (1 second) for "instant" feel even in background
    if (Platform.OS === 'android') {
      BackgroundTimer.start(); // Acquires WakeLock so CPU never sleeps!
    }
    const intervalId = setInterval(fetchOrders, 1000);

    // ✅ Start Foreground Service to keep app alive
    const startKeepAlive = async () => {
      try {
        const channelId = await notifee.createChannel({
          id: 'kravy_pos_service',
          name: 'POS Service',
          importance: AndroidImportance.MIN,
        });

        await notifee.displayNotification({
          title: 'Kravy POS Active',
          body: 'Monitoring new orders...',
          android: {
            channelId,
            asForegroundService: true,
            ongoing: true,
          },
        });
      } catch (e) {
        console.log('Failed to start foreground service:', e);
      }
    };
    startKeepAlive();

    // ✅ Refresh immediately when app returns to foreground
    const appStateSub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        displayedNotifIds.current.forEach(id => {
          notifee.cancelNotification(id).catch(() => { });
        });
        displayedNotifIds.current = [];
        fetchOrders();
      }
    });

    return () => {
      clearInterval(intervalId);
      if (Platform.OS === 'android') {
        BackgroundTimer.stop(); // Release WakeLock
      }
      appStateSub.remove();
      refreshSub.remove();
      localOrderSub.remove();
      // Stop service when unmounted
      notifee.stopForegroundService().catch(() => { });
    };
  }, [isSignedIn, staffData]);

  if (!showNotification || !newOrderInfo) return null;

  return (
    <Modal
      transparent={true}
      visible={showNotification}
      animationType="none"
      onRequestClose={hideNotification}
    >
      <View style={styles.fullscreenOverlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }], opacity: flashAnim },
          ]}
        >
          <View style={styles.emergencyCard}>
            <View style={styles.topSection}>
              <View style={styles.dangerBadge}>
                <Text style={styles.badgeText}>🧨 URGENT ORDER 🧨</Text>
              </View>
              <TouchableOpacity onPress={hideNotification}>
                <Ionicons name="close-circle" size={rf(30)} color="#7F1D1D" />
              </TouchableOpacity>
            </View>

            <View style={styles.mainInfo}>
              <View style={styles.pulseBox}>
                <Ionicons name="notifications" size={rf(40)} color="#EF4444" />
              </View>
              <View style={styles.textStack}>
                <Text style={styles.mainTitle}>NEW ORDER! 🛎️</Text>
                <Text style={styles.mainSubtitle}>
                  {newOrderInfo?.tableName || "Table"} has sent a new order.{"\n"}
                  <Text style={{ fontWeight: "900", color: "#B91C1C" }}>
                    ACCEPT IMMEDIATELY!
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.btnStack}>
              <TouchableOpacity
                style={[styles.btnBase, styles.ignoreBtn]}
                onPress={hideNotification}
              >
                <Text style={styles.ignoreTxt}>DISMISS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnBase, styles.viewBtn]}
                onPress={handleAccept}
              >
                <Text style={styles.viewTxt}>ACCEPT ORDER</Text>
                <Ionicons
                  name="checkmark-done-circle"
                  size={rf(22)}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999999,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width - s(30),
    zIndex: 10000000,
  },
  emergencyCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: s(30),
    padding: s(20),
    borderWidth: 4,
    borderColor: "#EF4444",
    elevation: 40,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
  },
  dangerBadge: {
    backgroundColor: "#EF4444",
    paddingVertical: vs(5),
    paddingHorizontal: s(15),
    borderRadius: s(20),
  },
  badgeText: { color: "#fff", fontSize: rf(14), fontWeight: "900" },
  mainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(30),
  },
  pulseBox: {
    width: s(80),
    height: s(80),
    backgroundColor: "#FFF",
    borderRadius: s(40),
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  textStack: { flex: 1, marginLeft: s(15) },
  mainTitle: { color: "#991B1B", fontWeight: "900", fontSize: rf(26) },
  mainSubtitle: {
    color: "#B91C1C",
    fontSize: rf(16),
    marginTop: vs(6),
    fontWeight: "600",
    lineHeight: vs(22),
  },
  btnStack: { flexDirection: "column", gap: vs(12) },
  btnBase: {
    width: "100%",
    flexDirection: "row",
    height: vs(65),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: s(20),
    gap: s(8),
  },
  ignoreBtn: {
    backgroundColor: "#FCA5A5",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  ignoreTxt: { color: "#7F1D1D", fontWeight: "900", fontSize: rf(18) },
  viewBtn: { backgroundColor: "#EF4444" },
  viewTxt: { color: "#fff", fontWeight: "900", fontSize: rf(20) },
});

export default NewOrderNotifier;
