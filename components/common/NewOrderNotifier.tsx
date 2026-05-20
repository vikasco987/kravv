import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
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
  const processedOrderIds = useRef(new Set<string>());
  const { refreshSignal } = useRefresh();
  const [staffData, setStaffData] = useState<{
    token: string;
    id: string;
  } | null>(null);

  const slideAnim = useRef(new Animated.Value(-500)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const fetchInProgress = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Setup Notifications Handler
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }) as any,
  });

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

  // Check for Staff Session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const staffToken = await AsyncStorage.getItem("staff_token");
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
    } catch (error) {}
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
      } catch (e) {}
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
      let token = null;
      let userId = "unknown";

      if (isSignedIn) {
        token = await getToken();
        userId = user?.id || "unknown";
      } else if (staffData) {
        token = staffData.token;
        userId = staffData.id;
      }

      if (token && currentOrder) {
        // 🚀 Mark order as PREPARING so it shows up as "Live" in the app and doesn't auto-hold
        await fetch("https://billing.kravy.in/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
          const tokenNo = await getNextTokenNumber();
          await SimpleKOT(items, token, userId, tableName, tokenNo);
        }
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

  const fetchOrders = async () => {
    if ((!isSignedIn && !staffData) || fetchInProgress.current) return;
    try {
      fetchInProgress.current = true;
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const token = authToken || staffToken;

      if (!token) return;

      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      const url = bId
        ? `https://billing.kravy.in/api/orders?businessId=${bId}&t=${Date.now()}`
        : `https://billing.kravy.in/api/orders?t=${Date.now()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const oData = await response.json();
        const orders: any[] = Array.isArray(oData) ? oData : oData.orders || [];

        if (processedOrderIds.current.size === 0) {
          orders.forEach((o) => processedOrderIds.current.add(o._id || o.id));
          return;
        }

        const newlyArrivedOrders = orders.filter(
          (o) => !processedOrderIds.current.has(o._id || o.id),
        );

        if (newlyArrivedOrders.length > 0) {
          newlyArrivedOrders.forEach((o) =>
            processedOrderIds.current.add(o._id || o.id),
          );

          // ✅ TRIGGER SYSTEM NOTIFICATION FOR BACKGROUND
          if (AppState.currentState !== "active") {
            const firstOrder = newlyArrivedOrders[0];
            const tableName =
              firstOrder.tableName || firstOrder.table?.name || "Online Order";
            Notifications.scheduleNotificationAsync({
              content: {
                title: "🚨 NEW URGENT ORDER!",
                body: `${tableName} has sent a new order. Open app to accept!`,
                data: { orderId: firstOrder._id || firstOrder.id },
                sound: true,
                priority: "max",
              },
              trigger: null, // show immediately
            });
          }

          setPendingOrders((prev) => {
            const updated = [...prev, ...newlyArrivedOrders];
            if (prev.length === 0 && !showNotification) {
              triggerNotification(updated[0]);
            }
            return updated;
          });
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

    // ✅ Extreme fast polling (1 second) for "instant" feel
    const interval = setInterval(fetchOrders, 1000);

    // ✅ Refresh immediately when app returns to foreground
    const appStateSub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchOrders();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      refreshSub.remove();
    };
  }, [isSignedIn, staffData]);

  if (!showNotification || !newOrderInfo) return null;

  return (
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
