import { useAuth, useUser } from '@clerk/clerk-expo';
import { SimpleKOT } from './SimpleKOT';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { rf, s, vs } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRefresh } from '../../context/RefreshContext';

const { width } = Dimensions.get('window');

const NewOrderNotifier = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [newOrderInfo, setNewOrderInfo] = useState<any>(null);
  const processedOrderIds = useRef(new Set<string>());
  const { refreshSignal } = useRefresh();
  const [staffData, setStaffData] = useState<{token: string, id: string} | null>(null);
  
  const slideAnim = useRef(new Animated.Value(-500)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const fetchInProgress = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Setup Audio Mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });
  }, []);

  // Check for Staff Session
  useEffect(() => {
    const checkStaff = async () => {
      try {
        const session = await AsyncStorage.getItem("staff_session");
        if (session) {
          const parsed = JSON.parse(session);
          setStaffData({ token: parsed.token, id: parsed.id || parsed._id || "staff" });
        } else {
          setStaffData(null);
        }
      } catch (e) {
        setStaffData(null);
      }
    };
    checkStaff();
  }, [refreshSignal, isSignedIn]);

  const startRingtone = async () => {
    try {
      if (soundRef.current) return; // Already playing
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ])
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
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 4, tension: 40 }).start();
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
        // --- DEEP SEARCH FOR ITEMS ---
        let rawItems = currentOrder.items || currentOrder.cart || currentOrder.products || 
                       currentOrder.orderItems || currentOrder.order_items || 
                       currentOrder.data?.items || currentOrder.cart_items || [];
        
        // If items are in an object (keyed by ID), convert to array
        if (rawItems && !Array.isArray(rawItems) && typeof rawItems === 'object') {
          rawItems = Object.values(rawItems);
        }

        const items = (Array.isArray(rawItems) ? rawItems : []).map((it: any) => ({
          name: String(it.name || it.itemName || it.item_name || it.productName || it.product_name || it.title || it.label || it.item || "Item"),
          quantity: Number(it.quantity || it.qty || it.qnt || it.count || it.amount || it.unit || it.Quantity || 1)
        }));

        console.log(`[NewOrder] Raw Items Count: ${rawItems?.length || 0}, Mapped: ${items.length}`);
        
        if (items.length > 0) {
           const tableName = currentOrder.tableName || currentOrder.table?.name || currentOrder.table_name || "Online Order";
           await SimpleKOT(items, token, userId, tableName);
        }
      }
    } catch (e) {
      console.log("Auto KOT Print Error:", e);
    }
  };

  const fetchOrders = async () => {
    if ((!isSignedIn && !staffData) || fetchInProgress.current) return;
    try {
      fetchInProgress.current = true;
      let token = null;

      if (isSignedIn) {
        token = await getToken();
      } else if (staffData) {
        token = staffData.token;
      }

      if (!token) return;
      
      const response = await fetch(`https://billing.kravy.in/api/orders?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const oData = await response.json();
        const orders: any[] = Array.isArray(oData) ? oData : (oData.orders || []);
        
        if (processedOrderIds.current.size === 0) {
          orders.forEach(o => processedOrderIds.current.add(o._id || o.id));
          return;
        }

        const newlyArrivedOrders = orders.filter(o => !processedOrderIds.current.has(o._id || o.id));

        if (newlyArrivedOrders.length > 0) {
          newlyArrivedOrders.forEach(o => processedOrderIds.current.add(o._id || o.id));
          setPendingOrders(prev => {
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
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [isSignedIn, staffData]);

  if (!showNotification || !newOrderInfo) return null;

  return (
    <View style={styles.fullscreenOverlay}>
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }], opacity: flashAnim }
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
                {newOrderInfo?.tableName || 'Table'} has sent a new order.{"\n"}
                <Text style={{fontWeight: '900', color: '#B91C1C'}}>ACCEPT IMMEDIATELY!</Text>
              </Text>
            </View>
          </View>

          <View style={styles.btnStack}>
            <TouchableOpacity style={[styles.btnBase, styles.ignoreBtn]} onPress={hideNotification}>
              <Text style={styles.ignoreTxt}>DISMISS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnBase, styles.viewBtn]} onPress={handleAccept}>
              <Text style={styles.viewTxt}>ACCEPT ORDER</Text>
              <Ionicons name="checkmark-done-circle" size={rf(22)} color="#fff" />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - s(30),
    zIndex: 10000000,
  },
  emergencyCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: s(30),
    padding: s(20),
    borderWidth: 4,
    borderColor: '#EF4444',
    elevation: 40,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(20) },
  dangerBadge: { backgroundColor: '#EF4444', paddingVertical: vs(5), paddingHorizontal: s(15), borderRadius: s(20) },
  badgeText: { color: '#fff', fontSize: rf(14), fontWeight: '900' },
  mainInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(30) },
  pulseBox: { width: s(80), height: s(80), backgroundColor: '#FFF', borderRadius: s(40), justifyContent: 'center', alignItems: 'center', elevation: 10, borderWidth: 2, borderColor: '#EF4444' },
  textStack: { flex: 1, marginLeft: s(15) },
  mainTitle: { color: '#991B1B', fontWeight: '900', fontSize: rf(26) },
  mainSubtitle: { color: '#B91C1C', fontSize: rf(16), marginTop: vs(6), fontWeight: '600', lineHeight: vs(22) },
  btnStack: { flexDirection: 'column', gap: vs(12) },
  btnBase: { width: '100%', flexDirection: 'row', height: vs(65), alignItems: 'center', justifyContent: 'center', borderRadius: s(20), gap: s(8) },
  ignoreBtn: { backgroundColor: '#FCA5A5', borderWidth: 1, borderColor: '#EF4444' },
  ignoreTxt: { color: '#7F1D1D', fontWeight: '900', fontSize: rf(18) },
  viewBtn: { backgroundColor: '#EF4444' },
  viewTxt: { color: '#fff', fontWeight: '900', fontSize: rf(20) },
});

export default NewOrderNotifier;
