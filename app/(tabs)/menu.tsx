



















// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import SimpleBill from "../party/GenerateBill";

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn]);

//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Integrated Header Bar */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity style={styles.integratedActionButton} activeOpacity={0.7}>
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.integratedActionButton} activeOpacity={0.7}>
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.integratedActionButton} activeOpacity={0.7}>
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.row}>
//         {/* Sidebar */}
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Food Grid */}
//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Payment Selector */}
//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Buttons */}
//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={() =>
//                 SimpleBill({
//                   customerName: "",
//                   phone: "",
//                   cart: Object.values(cart),
//                   billNo: `MS-${Math.floor(Math.random() * 10000)}`,
//                   date: new Date().toLocaleDateString(),
//                 })
//               }
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ✅ Styles
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },

//   // Integrated Header Bar
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#1F2937",
//   },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#FFF",
//   },

//   // Footer
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });


















// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import SimpleBill from "../party/GenerateBill";

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn]);

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Integrated Header Bar */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           {/* Add Item Button */}
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")} // <-- Updated path
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           {/* HOLD placeholder */}
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")} // <-- optional placeholder route
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           {/* Parcel placeholder */}
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")} // <-- optional placeholder route
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={() =>
//                 SimpleBill({
//                   customerName: "",
//                   phone: "",
//                   cart: Object.values(cart),
//                   billNo: `MS-${Math.floor(Math.random() * 10000)}`,
//                   date: new Date().toLocaleDateString(),
//                 })
//               }
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },

//   // Integrated Header Bar
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#1F2937",
//   },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#FFF",
//   },

//   // Footer
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });





















// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import SimpleBill from "../components/SimpleBill"; // <-- updated import path

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn]);

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={() =>
//                 SimpleBill({
//                   customerName: "",
//                   phone: "",
//                   cart: Object.values(cart),
//                   billNo: `MS-${Math.floor(Math.random() * 10000)}`,
//                   date: new Date().toLocaleDateString(),
//                 })
//               }
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ...styles remain the same
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });












// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import { SimpleBill } from "../bill/SimpleBill";
// // <-- updated import path

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn]);

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={() =>
//                 SimpleBill({
//                   customerName: "",
//                   phone: "",
//                   cart: Object.values(cart),
//                   billNo: `MS-${Math.floor(Math.random() * 10000)}`,
//                   date: new Date().toLocaleDateString(),
//                 })
//               }
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ...styles remain the same
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });



































// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import { SimpleBill } from "../bill/SimpleBill"; // <-- Assumed SimpleBill is updated

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         // ✅ Only call getToken if user is loaded and signed in
//         if (!isLoaded || !isSignedIn) {
//           console.log("User not loaded or signed out, skipping menu fetch.");
//           return;
//         }

//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn]); // Added dependencies for clarity

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   // ⭐️ Refactored Print Bill function to use Clerk/Auth correctly ⭐️
//   const handlePrintBill = async () => {
//     try {
//       if (!isLoaded || !isSignedIn) {
//         console.log("User not loaded or signed out, cannot print bill.");
//         return;
//       }

//       const token = await getToken();
//       console.log("🟢 Clerk Token from MenuScreen for print:", token ? "Token received" : "No token");

//       const cartItems = Object.values(cart).map((item) => ({
//         id: item.id,
//         name: item.name,
//         quantity: item.quantity,
//         price: item.price || 0,
//       }));

//       // 🛑 Updated SimpleBill call to match the new signature (items, token, info)
//       await SimpleBill(
//         cartItems,
//         token, // Pass the token
//         {
//           customerName: "Walk-in",
//           phone: "-",
//           billNo: `MS-${Math.floor(Math.random() * 10000)}`,
//           date: new Date().toLocaleDateString(),
//         }
//       );
//     } catch (err) {
//       console.error("Error printing bill:", err);
//     }
//   };
//   // ⭐️ End of refactored Print Bill function ⭐️


//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={handlePrintBill} // ⭐️ Using the refactored function ⭐️
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ...styles remain the same
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });













// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// // ⭐️ UPDATED: Import useUser to get the 'user' object for the Clerk ID ⭐️
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import { SimpleBill } from "../bill/SimpleBill"; // <-- Assumed SimpleBill is updated

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   // ⭐️ ACCESS THE 'user' OBJECT ⭐️
//   const { isLoaded, isSignedIn, user } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         // ✅ Only call getToken if user is loaded and signed in
//         if (!isLoaded || !isSignedIn) {
//           console.log("User not loaded or signed out, skipping menu fetch.");
//           return;
//         }

//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     // Added 'user' as a dependency for completeness, though it's typically stable
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn, user]); 

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   // ⭐️ REFACTORED: Now correctly retrieves and passes userClerkId ⭐️
//   const handlePrintBill = async () => {
//     try {
//       // 🛑 Ensure user data is fully loaded and the ID is available
//       if (!isLoaded || !isSignedIn || !user || !user.id) {
//         console.log("User not loaded or signed out, cannot print bill.");
//         return;
//       }

//       const token = await getToken();
//       const userClerkId = user.id; // Get the string ID
      
//       console.log("🟢 Clerk Token from MenuScreen for print:", token ? "Token received" : "No token");
//       console.log("👤 User Clerk ID for bill:", userClerkId);


//       const cartItems = Object.values(cart).map((item) => ({
//         id: item.id,
//         name: item.name,
//         quantity: item.quantity,
//         price: item.price || 0,
//         // Assuming sellingPrice is needed for SimpleBill
//         sellingPrice: item.price || 0,
//       }));

//       // ✅ UPDATED SimpleBill call: token and userClerkId are now the second and third arguments
//       await SimpleBill(
//         cartItems,
//         token,         // 2nd argument: token (string)
//         userClerkId,   // 3rd argument: userClerkId (string)
//         {
//           customerName: "Walk-in",
//           phone: "-",
//           // Removed billNo and date as they are now handled inside SimpleBill.ts
//         }
//       );
//     } catch (err) {
//       console.error("Error printing bill:", err);
//     }
//   };
//   // ⭐️ END of refactored Print Bill function ⭐️


//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={handlePrintBill} // ⭐️ Correct function call ⭐️
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ...styles remain the same
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });















// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import SimpleBill from "../bill/SimpleBill"; // <-- updated import path

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn]);

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={() =>
//                 SimpleBill({
//                   customerName: "",
//                   phone: "",
//                   cart: Object.values(cart),
//                   billNo: `MS-${Math.floor(Math.random() * 10000)}`,
//                   date: new Date().toLocaleDateString(),
//                 })
//               }
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ...styles remain the same
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });













// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
//   ToastAndroid, // ⬅️ UPDATED: Added ToastAndroid for feedback
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import { SimpleBill } from "../bill/SimpleBill"; // ✅ Correct named import

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   // ⭐️ ACCESS THE 'user' OBJECT ⭐️
//   const { isLoaded, isSignedIn, user } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         // ✅ Only call getToken if user is loaded and signed in
//         if (!isLoaded || !isSignedIn) {
//           console.log("User not loaded or signed out, skipping menu fetch.");
//           return;
//         }

//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     // Added 'user' as a dependency for completeness, though it's typically stable
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn, user]); 

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   // ❌ DELETED: The old handlePrintBill function is removed as per instructions

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={async () => { // ⬅️ UPDATED: New inline onPress function
//                 try {
//                   if (Object.keys(cart).length === 0) {
//                     ToastAndroid.show("⚠️ Cart is empty!", ToastAndroid.SHORT);
//                     return;
//                   }

//                   const token = await getToken();
//                   const userClerkId = user?.id;

//                   if (!token || !userClerkId) {
//                     ToastAndroid.show("⚠️ Please login again", ToastAndroid.SHORT);
//                     return;
//                   }

//                   // ✅ call the improved SimpleBill function
//                   await SimpleBill(Object.values(cart), token, userClerkId, {
//                     customerName: "Walk-in",
//                     phone: "",
//                     notes: `Mode: ${paymentMethod}`,
//                   });

//                   // ✅ clear cart and show success message
//                   setCart({});
//                   ToastAndroid.show("🧾 Bill Printed Successfully!", ToastAndroid.LONG);
//                 } catch (err) {
//                   console.log("❌ Print Bill Error:", err);
//                   ToastAndroid.show("⚠️ Failed to print bill", ToastAndroid.SHORT);
//                 }
//               }}
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// // ...styles remain the same
// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeighsimt: "700", fontSize: 13 },
// });












// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
//   ToastAndroid,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import { SimpleBill } from "../bill/SimpleBill";

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn, user } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         if (!isLoaded || !isSignedIn) {
//           console.log("User not loaded or signed out, skipping menu fetch.");
//           return;
//         }

//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn, user]);

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/parcel")}
//           >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={async () => {
//                 try {
//                   if (Object.keys(cart).length === 0) {
//                     ToastAndroid.show("⚠️ Cart is empty!", ToastAndroid.SHORT);
//                     return;
//                   }

//                   const token = await getToken();
//                   const userClerkId = user?.id;

//                   if (!token || !userClerkId) {
//                     ToastAndroid.show("⚠️ Please login again", ToastAndroid.SHORT);
//                     return;
//                   }

//                   await SimpleBill(Object.values(cart), token, userClerkId, {
//                     customerName: "Walk-in",
//                     phone: "",
//                     paymentMode: paymentMethod, // ✅ proper field
//                     notes: `Paid via ${paymentMethod}`, // ✅ updated note
//                   });

//                   setCart({});
//                   ToastAndroid.show("🧾 Bill Printed Successfully!", ToastAndroid.LONG);
//                 } catch (err) {
//                   console.log("❌ Print Bill Error:", err);
//                   ToastAndroid.show("⚠️ Failed to print bill", ToastAndroid.SHORT);
//                 }
//               }}
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() =>
//                 router.push({
//                   pathname: "/bill",
//                   params: { cart: JSON.stringify(cart), paymentMethod },
//                 })
//               }
//             >
//               <Text style={styles.primaryButtonText}>Next</Text>
//               <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });





// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Platform,
//   ToastAndroid,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { Feather, Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Audio } from "expo-av";
// import { SimpleBill } from "../bill/SimpleBill";

// type MenuItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
// };

// type MenuCategory = {
//   id: string;
//   name: string;
//   items: MenuItem[];
// };

// type CartItem = MenuItem & { quantity: number };

// const THEME_PRIMARY = "#4F46E5"; // Indigo
// const THEME_SECONDARY = "#10B981"; // Green
// const THEME_DANGER = "#DC2626"; // Red
// const COLOR_BG_LIGHT = "#F9FAFB";
// const COLOR_BG_DARK = "#FFFFFF";
// const COLOR_BG_LIGHT_GREY = "#E5E7EB";

// export default function MenuScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn, user } = useUser();
//   const router = useRouter();
//   const screenWidth = Dimensions.get("window").width;

//   const [menus, setMenus] = useState<MenuCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState<Record<string, CartItem>>({});
//   const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Check">("Cash");
//   const [received, setReceived] = useState(false);
//   const flatListRef = useRef<FlatList>(null);

//   const addSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;
//   const removeSound = useRef(Platform.OS !== "web" ? new Audio.Sound() : null).current;

//   // Load sounds
//   useEffect(() => {
//     if (Platform.OS === "web") return;
//     async function loadSounds() {
//       try {
//         await addSound?.loadAsync(require("../../assets/images/sounds/add.mp3"));
//         await removeSound?.loadAsync(require("../../assets/images/sounds/remove.mp3"));
//       } catch (err) {
//         console.log("Sound load error:", err);
//       }
//     }
//     loadSounds();
//     return () => {
//       addSound?.unloadAsync();
//       removeSound?.unloadAsync();
//     };
//   }, []);

//   // Fetch menus
//   useEffect(() => {
//     async function fetchMenus() {
//       try {
//         setLoading(true);
//         if (!isLoaded || !isSignedIn) {
//           console.log("User not loaded or signed out, skipping menu fetch.");
//           return;
//         }

//         const token = await getToken();
//         if (!token) throw new Error("Unauthorized");
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/menu/view", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setMenus(data.menus || []);
//       } catch (err) {
//         console.error("Menu fetch error:", err);
//         setMenus([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     if (isLoaded && isSignedIn) fetchMenus();
//   }, [isLoaded, isSignedIn, user]);

//   // Add / remove from cart
//   const addToCart = async (item: MenuItem) => {
//     setCart((prev) => ({
//       ...prev,
//       [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
//     }));
//     try {
//       await addSound?.replayAsync();
//     } catch {}
//   };

//   const removeFromCart = async (item: MenuItem) => {
//     setCart((prev) => {
//       const existing = prev[item.id];
//       if (!existing) return prev;
//       if (existing.quantity === 1) {
//         const newCart = { ...prev };
//         delete newCart[item.id];
//         return newCart;
//       }
//       return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
//     });
//     try {
//       await removeSound?.replayAsync();
//     } catch {}
//   };

//   const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
//   const totalAmount = Object.values(cart).reduce(
//     (sum, i) => sum + (i.price || 0) * i.quantity,
//     0
//   );

//   const numColumns = screenWidth < 400 ? 2 : screenWidth < 700 ? 3 : 4;
//   const itemWidth = (screenWidth - 120) / numColumns - 10;

//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={THEME_PRIMARY} />
//         <Text style={{ marginTop: 10 }}>Loading menu...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.integratedHeaderBar}>
//         <Text style={styles.headerTitle}>Menu</Text>
//         <View style={styles.headerActionGroup}>
//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             onPress={() => router.push("/party/add-item")}
//           >
//             <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Item</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//             // onPress={() => router.push("/party/hold")}
//           >
//             <Ionicons name="timer-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>HOLD</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.integratedActionButton}
//             activeOpacity={0.7}
//           //   onPress={() => router.push("/party/parcel")}
//            >
//             <Feather name="package" size={16} color="#FFF" style={{ marginRight: 4 }} />
//             <Text style={styles.integratedButtonText}>Parcel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Menu Sidebar + Grid */}
//       <View style={styles.row}>
//         <ScrollView style={styles.categoryColumn}>
//           {menus.map((cat) => (
//             <TouchableOpacity
//               key={cat.id}
//               style={styles.categoryButton}
//               onPress={() => {
//                 const index = menus.findIndex((c) => c.id === cat.id);
//                 if (index >= 0) flatListRef.current?.scrollToIndex({ index, animated: true });
//               }}
//             >
//               <Ionicons name="fast-food-outline" size={12} color="#fff" />
//               <Text style={styles.categoryText}>{cat.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <FlatList
//           ref={flatListRef}
//           data={menus}
//           keyExtractor={(cat) => cat.id}
//           contentContainerStyle={{ paddingBottom: 180 }}
//           renderItem={({ item: cat }) => (
//             <View>
//               <Text style={styles.categoryHeader}>{cat.name}</Text>
//               <View style={styles.gridContainer}>
//                 {cat.items.map((item) => {
//                   const quantity = cart[item.id]?.quantity || 0;
//                   return (
//                     <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
//                       <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
//                         <View>
//                           <Image
//                             source={{
//                               uri:
//                                 item.imageUrl && item.imageUrl.startsWith("http")
//                                   ? item.imageUrl
//                                   : "https://via.placeholder.com/80?text=No+Image",
//                             }}
//                             style={styles.itemImage}
//                             resizeMode="cover"
//                           />
//                           {quantity > 0 && (
//                             <TouchableOpacity
//                               style={styles.minusIcon}
//                               onPress={() => removeFromCart(item)}
//                             >
//                               <Feather name="minus" size={12} color="#fff" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <Text style={styles.itemName}>{item.name}</Text>
//                         <Text style={styles.itemPrice}>₹{item.price ?? "N/A"}</Text>
//                       </TouchableOpacity>
//                       {quantity > 0 && (
//                         <View style={styles.quantityBadge}>
//                           <Text style={styles.quantityText}>{quantity}</Text>
//                         </View>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </View>
//           )}
//         />
//       </View>

//       {/* Footer */}
//       {totalItems > 0 && (
//         <View style={styles.cartBar}>
//           <View style={styles.summaryRow}>
//             <Text style={styles.totalText}>
//               Total: <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
//             </Text>
//             <TouchableOpacity
//               style={styles.receivedContainer}
//               onPress={() => setReceived(!received)}
//             >
//               <View
//                 style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}
//               >
//                 {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
//               </View>
//               <Text style={styles.receivedText}>Received</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.paymentSelector}>
//             {["Cash", "Bank", "Check"].map((method) => (
//               <TouchableOpacity
//                 key={method}
//                 style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
//                 onPress={() => setPaymentMethod(method as "Cash" | "Bank" | "Check")}
//               >
//                 <Text
//                   style={[
//                     styles.paymentText,
//                     paymentMethod === method && { color: "#fff", fontWeight: "700" },
//                   ]}
//                 >
//                   {method}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.actionButtonsRow}>
//             <TouchableOpacity
//               style={styles.printBillButton}
//               onPress={async () => {
//                 try {
//                   if (Object.keys(cart).length === 0) {
//                     ToastAndroid.show("⚠️ Cart is empty!", ToastAndroid.SHORT);
//                     return;
//                   }

//                   const token = await getToken();
//                   const userClerkId = user?.id;

//                   if (!token || !userClerkId) {
//                     ToastAndroid.show("⚠️ Please login again", ToastAndroid.SHORT);
//                     return;
//                   }

//                   await SimpleBill(Object.values(cart), token, userClerkId, {
//                     customerName: "Walk-in",
//                     phone: "",
//                     paymentMode: paymentMethod, // ✅ proper field
//                     notes: `Paid via ${paymentMethod}`, // ✅ updated note
//                   });

//                   setCart({});
//                   ToastAndroid.show("🧾 Bill Printed Successfully!", ToastAndroid.LONG);
//                 } catch (err) {
//                   console.log("❌ Print Bill Error:", err);
//                   ToastAndroid.show("⚠️ Failed to print bill", ToastAndroid.SHORT);
//                 }
//               }}
//             >
//               <Feather name="printer" size={16} color="#fff" style={{ marginRight: 5 }} />
//               <Text style={styles.printBillText}>PRINT BILL</Text>
//             </TouchableOpacity>

//             {/* <TouchableOpacity
//   style={styles.primaryButton}
//   onPress={() =>
//     router.push({
//       pathname: "/bill",
//       params: { cart: JSON.stringify(cart), paymentMethod },
//     })
//   }
// >
//   <Text style={styles.primaryButtonText}>Next</Text>
//   <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
// </TouchableOpacity> */}



// <TouchableOpacity
//   style={styles.primaryButton}
//   onPress={() =>
//     router.push({
//       pathname: "/party/bill",
//       params: { 
//         cart: JSON.stringify(cart), 
//         paymentMethod 
//       },
//     })
//   }
// >
//   <Text style={styles.primaryButtonText}>Next</Text>
//   <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 5 }} />
// </TouchableOpacity>


//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 20, backgroundColor: COLOR_BG_LIGHT },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   row: { flex: 1, flexDirection: "row" },
//   categoryColumn: {
//     width: 80,
//     backgroundColor: COLOR_BG_DARK,
//     paddingVertical: 4,
//     borderRightWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   categoryButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     marginVertical: 3,
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 8,
//   },
//   categoryText: { fontWeight: "600", color: "#fff", marginLeft: 3, fontSize: 10 },
//   categoryHeader: {
//     fontSize: 13,
//     fontWeight: "bold",
//     backgroundColor: "#E0E7FF",
//     padding: 4,
//     marginTop: 4,
//     borderRadius: 8,
//     textAlign: "center",
//     color: THEME_PRIMARY,
//   },
//   gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
//   gridItem: {
//     backgroundColor: COLOR_BG_DARK,
//     borderRadius: 10,
//     padding: 6,
//     margin: 4,
//     alignItems: "center",
//     elevation: 3,
//   },
//   itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
//   itemName: { fontSize: 15, fontWeight: "600", textAlign: "center", color: "#111" },
//   itemPrice: { fontSize: 10, color: THEME_DANGER, fontWeight: "bold" },
//   minusIcon: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 14,
//     padding: 2,
//   },
//   quantityBadge: {
//     position: "absolute",
//     bottom: 4,
//     right: 4,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingHorizontal: 3,
//   },
//   quantityText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
//   integratedHeaderBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     paddingBottom: 5,
//     backgroundColor: "transparent",
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
//   headerActionGroup: {
//     flexDirection: "row",
//     backgroundColor: THEME_PRIMARY,
//     borderRadius: 10,
//     padding: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   integratedActionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "transparent",
//     marginHorizontal: 2,
//   },
//   integratedButtonText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
//   cartBar: {
//     position: "absolute",
//     bottom: 6,
//     left: 6,
//     right: 6,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 6,
//     elevation: 8,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 6,
//     paddingHorizontal: 8,
//   },
//   totalText: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
//   totalAmount: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
//   receivedContainer: { flexDirection: "row", alignItems: "center" },
//   receivedCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: THEME_PRIMARY,
//     marginRight: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   receivedText: { fontSize: 12, color: "#1F2937", fontWeight: "500" },
//   paymentSelector: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//     marginBottom: 6,
//     padding: 4,
//   },
//   paymentOption: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 5,
//     marginHorizontal: 2,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: THEME_PRIMARY,
//   },
//   paymentSelected: {
//     backgroundColor: THEME_PRIMARY,
//     shadowColor: THEME_PRIMARY,
//     shadowOpacity: 0.3,
//     elevation: 5,
//   },
//   paymentText: { color: THEME_PRIMARY, fontWeight: "600", fontSize: 11 },
//   actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
//   printBillButton: {
//     flex: 1,
//     backgroundColor: THEME_DANGER,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   printBillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: THEME_SECONDARY,
//     borderRadius: 8,
//     paddingVertical: 8,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
// });








// app/(tabs)/settings.tsx
import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useClerk, useUser } from "@clerk/clerk-expo";

export default function SettingsScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      console.log("👋 Signing out user...");
      await SecureStore.deleteItemAsync("__clerk_client_jwt");
      console.log("🧹 Cleared saved token (__clerk_client_jwt)");

      await signOut();
      console.log("✅ Clerk sign-out complete.");

      navigation.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("❌ Error during sign-out:", error);
    }
  };

  useEffect(() => {
    const debugStoredToken = async () => {
      const stored = await SecureStore.getItemAsync("__clerk_client_jwt");
      console.log(
        "🔍 Stored token (for debug):",
        stored ? stored.substring(0, 25) + "..." : "null"
      );
    };
    debugStoredToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.firstName || "User"} 👋</Text>
      <Text style={styles.subtitle}>Here’s your settings page</Text>

      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 10, marginBottom: 20 },
});
