import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Minus, Plus, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { rf } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// BRAND COLORS
const COLORS = {
  PRIMARY: "#FC5C04", // Kravy Orange
  SECONDARY: "#111827", // Dark Gray/Black
  WHITE: "#FFFFFF",
  BG_LIGHT: "#F9FAFB",
  GRAY: "#6B7280",
  LIGHT_GRAY: "#E5E7EB",
  SUCCESS: "#10B981",
  DANGER: "#EF4444",
  VEG: "#008000",
  NON_VEG: "#800000",
};

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isVeg?: boolean;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface BusinessProfile {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
}

export const PublicMenuView = ({ clerkId, tableId }: { clerkId: string, tableId?: string }) => {
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number }>>({});
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tracking
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("PENDING");

  // Checkout Form States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [isCheckingLoyalty, setIsCheckingLoyalty] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("QR / UPI");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (clerkId) fetchMenu();
  }, [clerkId]);

  useEffect(() => {
    let interval: any;
    if (activeOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`https://billing.kravy.in/api/public/menu/${clerkId}`); // We use menu for metadata, but need order status
          // Note: Assuming there's a public endpoint for order status or we can check the general orders list
          const ordersRes = await fetch(`https://billing.kravy.in/api/public/orders?clerkUserId=${clerkId}&tag=${tableId || "Online"}`);
          if (ordersRes.ok) {
            const data = await ordersRes.json();
            const orders = Array.isArray(data) ? data : (data.orders || []);
            const myOrder = orders.find((o: any) => o.id === activeOrderId || o._id === activeOrderId);
            if (myOrder) {
              setOrderStatus(myOrder.status);
              if (myOrder.status === 'SERVED') {
                setTimeout(() => setActiveOrderId(null), 10000); // Clear tracking after 10s of being served
              }
            }
          }
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeOrderId, clerkId, tableId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://billing.kravy.in/api/public/menu/${clerkId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Profile mapping
        setProfile({
          name: data.businessName || data.companyName || "Restaurant",
          logoUrl: data.logoUrl || data.logo,
          address: data.address,
          phone: data.phone
        });

        // Categories & Items mapping
        let categories: Category[] = [];
        if (Array.isArray(data.categories)) {
          categories = data.categories.map((cat: any) => ({
            id: cat.id || cat._id,
            name: cat.name,
            items: (cat.items || []).map((item: any) => ({
              id: item.id || item._id,
              name: item.name,
              price: item.sellingPrice || item.price || 0,
              description: item.description,
              imageUrl: item.imageUrl,
              isVeg: item.isVeg !== undefined ? item.isVeg : true,
              category: cat.name
            }))
          }));
        } else if (data.items && Array.isArray(data.items)) {
           const catMap: Record<string, Category> = {};
           data.items.forEach((item: any) => {
             const catRaw = item.category || { id: "others", name: "Others" };
             const catName = catRaw.name || "Others";
             if (!catMap[catName]) {
               catMap[catName] = { id: catName, name: catName, items: [] };
             }
             catMap[catName].items.push({
               id: item.id || item._id,
               name: item.name,
               price: item.sellingPrice || item.price || 0,
               description: item.description,
               imageUrl: item.imageUrl,
               isVeg: item.isVeg !== undefined ? item.isVeg : true,
               category: catName
             });
           });
           categories = Object.values(catMap);
        }

        setMenuData(categories);
        if (categories.length > 0) setActiveCategory(categories[0].id);
      }
    } catch (error) {
      console.error("Fetch menu error:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLoyalty = async () => {
    if (!customerPhone || customerPhone.length < 10) return;
    try {
      setIsCheckingLoyalty(true);
      const url = `https://billing.kravy.in/api/public/loyalty?phone=${customerPhone}&clerkUserId=${clerkId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLoyaltyPoints(data.points || 0);
      }
    } catch (e) { } finally {
      setIsCheckingLoyalty(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, quantity: (existing?.quantity || 0) + 1 } };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity === 1) {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const cartItems = Object.values(cart);
  const totalAmount = cartItems.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const totalItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      const category = menuData.find(c => c.id === activeCategory);
      return category ? category.items : [];
    }
    const query = searchQuery.toLowerCase();
    let result: MenuItem[] = [];
    menuData.forEach(cat => cat.items.forEach(item => {
      if (item.name.toLowerCase().includes(query)) result.push(item);
    }));
    return result;
  }, [activeCategory, menuData, searchQuery]);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const payload = {
        clerkUserId: clerkId,
        tableId: tableId || "Online",
        total: totalAmount,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod: paymentMethod,
        items: cartItems.map(ci => ({
          itemId: ci.item.id,
          name: ci.item.name,
          price: ci.item.price,
          quantity: ci.quantity,
          total: ci.item.price * ci.quantity,
          isVeg: ci.item.isVeg
        }))
      };

      const response = await fetch("https://billing.kravy.in/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        setActiveOrderId(resData.orderId || resData.id || "latest");
        setOrderStatus("PENDING");
        setOrderSuccess(true);
        setCart({});
        setIsCheckoutModalVisible(false);
      }
    } catch (error) {
      Alert.alert("Error", "Order placement failed");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return COLORS.GRAY;
      case 'PREPARING': return COLORS.PRIMARY;
      case 'READY': return COLORS.SUCCESS;
      case 'SERVED': return COLORS.DANGER;
      default: return COLORS.GRAY;
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
  );

  if (orderSuccess) return (
    <View style={styles.successContainer}>
      <LinearGradient colors={[COLORS.PRIMARY, '#FF8C00']} style={styles.successGradient}>
        <View style={styles.successCard}>
          <Check size={rf(50)} color={COLORS.PRIMARY} style={{ marginBottom: 20 }} />
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successDesc}>Your order for Table {tableId} is on the way.</Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => setOrderSuccess(false)}>
            <Text style={styles.successBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {profile?.logoUrl && <Image source={{ uri: profile.logoUrl }} style={styles.logo} />}
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.businessName}>{profile?.name}</Text>
            <Text style={styles.tableLabel}>{tableId ? `Table: ${tableId}` : 'Digital Menu'}</Text>
          </View>
        </View>

        {activeOrderId && !orderSuccess && (
          <View style={styles.trackingBar}>
             <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>Order Status:</Text>
                <Text style={[styles.trackingStatus, { color: getStatusColor(orderStatus) }]}>
                   {orderStatus}
                </Text>
             </View>
             <View style={styles.progressSteps}>
                <View style={[styles.step, { backgroundColor: ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(orderStatus) ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
                <View style={[styles.stepLine, { backgroundColor: ['PREPARING', 'READY', 'SERVED'].includes(orderStatus) ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
                <View style={[styles.step, { backgroundColor: ['PREPARING', 'READY', 'SERVED'].includes(orderStatus) ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
                <View style={[styles.stepLine, { backgroundColor: ['READY', 'SERVED'].includes(orderStatus) ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
                <View style={[styles.step, { backgroundColor: ['READY', 'SERVED'].includes(orderStatus) ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
                <View style={[styles.stepLine, { backgroundColor: orderStatus === 'SERVED' ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
                <View style={[styles.step, { backgroundColor: orderStatus === 'SERVED' ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }]} />
             </View>
          </View>
        )}

        <View style={styles.searchBox}>
          <Search size={rf(18)} color={COLORS.GRAY} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search for dishes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {!searchQuery && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
          {menuData.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setActiveCategory(cat.id)}
              style={[styles.catTab, activeCategory === cat.id && styles.activeCatTab]}
            >
              <Text style={[styles.catText, activeCategory === cat.id && styles.activeCatText]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.vegIcon, { borderColor: item.isVeg ? COLORS.VEG : COLORS.NON_VEG }]}>
                  <View style={[styles.vegDot, { backgroundColor: item.isVeg ? COLORS.VEG : COLORS.NON_VEG }]} />
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
              {item.description && <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>}
            </View>
            <View style={styles.itemImageContainer}>
              {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />}
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Text style={styles.addBtnText}>{cart[item.id] ? `x${cart[item.id].quantity}` : 'ADD'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {totalItemsCount > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => setIsCartModalVisible(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.cartBadge}><Text style={styles.badgeText}>{totalItemsCount}</Text></View>
            <Text style={styles.cartBarText}>View Cart</Text>
          </View>
          <Text style={styles.cartBarPrice}>₹{totalAmount}</Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={isCartModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Order</Text>
              <TouchableOpacity onPress={() => setIsCartModalVisible(false)}><X size={24} color="#000" /></TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 20 }} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
              {cartItems.map(ci => (
                <View key={ci.item.id} style={styles.cartRow}>
                  <Text style={styles.cartItemName}>{ci.item.name}</Text>
                  <View style={styles.cartQtyControls}>
                    <TouchableOpacity onPress={() => removeFromCart(ci.item.id)}><Minus size={18} color={COLORS.PRIMARY} /></TouchableOpacity>
                    <Text style={styles.cartQtyText}>{ci.quantity}</Text>
                    <TouchableOpacity onPress={() => addToCart(ci.item)}><Plus size={18} color={COLORS.PRIMARY} /></TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>₹{ci.item.price * ci.quantity}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => setIsCheckoutModalVisible(true)}>
              <Text style={styles.checkoutBtnText}>Checkout • ₹{totalAmount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={isCheckoutModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <TouchableOpacity onPress={() => setIsCheckoutModalVisible(false)}><ArrowLeft size={24} color="#000" /></TouchableOpacity>
               <Text style={styles.modalTitle}>Details</Text>
               <View style={{ width: 24 }} />
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.input} placeholder="Your Name" value={customerName} onChangeText={setCustomerName} />
              
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>Phone</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Phone Number" value={customerPhone} keyboardType="phone-pad" onChangeText={setCustomerPhone} />
                <TouchableOpacity onPress={checkLoyalty} style={styles.loyaltyBtn}>
                  {isCheckingLoyalty ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Points</Text>}
                </TouchableOpacity>
              </View>
              
              {loyaltyPoints !== null && (
                <Text style={styles.loyaltyText}>Coins: {loyaltyPoints}</Text>
              )}

              <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder} disabled={isPlacingOrder}>
                {isPlacingOrder ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeBtnText}>Confirm Order</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  trackingBar: { 
    backgroundColor: COLORS.BG_LIGHT, 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY
  },
  trackingInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  trackingLabel: { fontWeight: 'bold', color: COLORS.GRAY, fontSize: rf(12) },
  trackingStatus: { fontWeight: '900', fontSize: rf(12) },
  progressSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  step: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 2 },

  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  logo: { width: 50, height: 50, borderRadius: 10 },
  businessName: { fontSize: rf(20), fontWeight: 'bold' },
  tableLabel: { color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: rf(12) },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: rf(14) },
  catScroll: { paddingHorizontal: 15, marginVertical: 10, maxHeight: 50 },
  catTab: { paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, borderRadius: 20, backgroundColor: '#EEE' },
  activeCatTab: { backgroundColor: COLORS.PRIMARY },
  catText: { fontWeight: '700', color: '#666' },
  activeCatText: { color: '#fff' },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  itemName: { fontSize: rf(16), fontWeight: 'bold', flex: 1 },
  vegIcon: { width: 14, height: 14, borderWidth: 1, marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemPrice: { fontSize: rf(15), fontWeight: 'bold', marginVertical: 4 },
  itemDesc: { fontSize: rf(12), color: '#888' },
  itemImageContainer: { alignItems: 'center' },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  addBtn: { marginTop: -15, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.PRIMARY, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 8, elevation: 3 },
  addBtnText: { color: COLORS.PRIMARY, fontWeight: 'bold' },
  cartBar: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: COLORS.PRIMARY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, elevation: 5 },
  cartBadge: { backgroundColor: '#fff', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  badgeText: { color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: 12 },
  cartBarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cartBarPrice: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cartItemName: { flex: 1, fontWeight: 'bold' },
  cartQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 15, marginHorizontal: 20 },
  cartQtyText: { fontWeight: 'bold', fontSize: 16 },
  cartItemPrice: { fontWeight: 'bold', width: 60, textAlign: 'right' },
  checkoutBtn: { backgroundColor: COLORS.PRIMARY, margin: 20, padding: 18, borderRadius: 15, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  inputLabel: { fontWeight: 'bold', color: '#555', marginBottom: 5 },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, fontSize: 16 },
  loyaltyBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 12 },
  loyaltyText: { marginTop: 10, color: '#10B981', fontWeight: 'bold' },
  placeBtn: { backgroundColor: '#10B981', marginTop: 30, padding: 18, borderRadius: 15, alignItems: 'center' },
  placeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  successContainer: { flex: 1 },
  successGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: '#fff', width: '80%', padding: 40, borderRadius: 30, alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  successDesc: { textAlign: 'center', color: '#666', marginBottom: 30 },
  successBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 20 },
  successBtnText: { color: '#fff', fontWeight: 'bold' },
});
