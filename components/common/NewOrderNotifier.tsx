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

const { width } = Dimensions.get('window');

const NewOrderNotifier = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [newOrderInfo, setNewOrderInfo] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const prevOrderCount = useRef(0);
  const fetchInProgress = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRingtone = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('Ringtone error:', error);
    }
  };

  const stopRingtone = async () => {
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
      toValue: vs(40),
      useNativeDriver: true,
      friction: 7,
    }).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    startRingtone();
  };

  const hideNotification = () => {
    stopRingtone();
    Animated.timing(slideAnim, {
      toValue: -250,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });
  };

  const handleAccept = async () => {
    hideNotification();
    try {
      const token = await getToken();
      if (token && newOrderInfo) {
        const cartItems = (newOrderInfo.items || []).map((it: any) => ({
          name: it.name,
          quantity: it.quantity
        }));
        if (cartItems.length > 0) {
           await SimpleKOT(cartItems, token, user?.id || "unknown", newOrderInfo.tableName || newOrderInfo.table?.name || "Table");
        }
      }
    } catch (e) {
      console.log("Accept Print Error:", e);
    }

    if (newOrderInfo?.tableId || (newOrderInfo?.table && (typeof newOrderInfo.table !== 'string'))) {
      const tId = newOrderInfo.tableId || newOrderInfo.table.id || newOrderInfo.table._id;
      router.push({
        pathname: '/orders/[tableId]',
        params: { tableId: tId, tableName: newOrderInfo.tableName || newOrderInfo.table?.name || 'Table' }
      });
    }
  };

  const fetchOrders = async () => {
    if (!isSignedIn || fetchInProgress.current || showNotification) return;
    try {
      fetchInProgress.current = true;
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`https://billing.kravy.in/api/orders?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const oData = await response.json();
        const orders = Array.isArray(oData) ? oData : (oData.orders || []);
        if (prevOrderCount.current > 0 && orders.length > prevOrderCount.current) {
          const latest = orders[orders.length - 1];
          triggerNotification(latest);
        }
        prevOrderCount.current = orders.length;
      }
    } catch (error) {
    } finally {
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      prevOrderCount.current = 0;
      stopRingtone();
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  if (!showNotification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: showNotification ? 1 : 0 }
      ]}
    >
      <View style={styles.vibrantCard}>
        <View style={styles.topSection}>
          <View style={styles.alertBadge}>
            <Text style={styles.badgeText}>🔔 New Booking 🔔</Text>
          </View>
          <TouchableOpacity onPress={hideNotification}>
            <Ionicons name="close-circle" size={rf(24)} color="#92400E" />
          </TouchableOpacity>
        </View>
        <View style={styles.mainInfo}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: rf(30) }}>🍱</Text>
          </View>
          <View style={styles.textStack}>
            <Text style={styles.mainTitle}>Order Received! 🍽️</Text>
            <Text style={styles.mainSubtitle}>
              {newOrderInfo?.tableName || 'Table'} has sent a new order. Check it now! 🏃‍♂️
            </Text>
          </View>
        </View>
        <View style={styles.btnStack}>
          <TouchableOpacity style={[styles.btnBase, styles.ignoreBtn]} onPress={hideNotification}>
            <Text style={styles.ignoreTxt}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnBase, styles.viewBtn]} onPress={handleAccept}>
            <Text style={styles.viewTxt}>Accept</Text>
            <Ionicons name="restaurant" size={rf(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - vs(120),
    left: s(20),
    right: s(20),
    zIndex: 9999999,
    elevation: 35,
  },
  vibrantCard: {
    backgroundColor: '#FCD34D',
    borderRadius: s(35),
    padding: s(25),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(15) },
  alertBadge: { backgroundColor: '#92400E', paddingVertical: vs(4), paddingHorizontal: s(15), borderRadius: s(20) },
  badgeText: { color: '#fff', fontSize: rf(12), fontWeight: '900' },
  mainInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(25) },
  iconBox: { width: s(60), height: s(60), backgroundColor: '#FFF', borderRadius: s(20), justifyContent: 'center', alignItems: 'center', elevation: 5 },
  textStack: { flex: 1, marginLeft: s(15) },
  mainTitle: { color: '#78350F', fontWeight: '900', fontSize: rf(22) },
  mainSubtitle: { color: '#92400E', fontSize: rf(14), marginTop: vs(4), fontWeight: '600', lineHeight: vs(18) },
  btnStack: { flexDirection: 'row', gap: s(12) },
  btnBase: { flex: 1, flexDirection: 'row', height: vs(55), alignItems: 'center', justifyContent: 'center', borderRadius: s(20), gap: s(8) },
  ignoreBtn: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  ignoreTxt: { color: '#92400E', fontWeight: '800', fontSize: rf(15) },
  viewBtn: { backgroundColor: '#92400E' },
  viewTxt: { color: '#fff', fontWeight: '800', fontSize: rf(15) },
});

export default NewOrderNotifier;
