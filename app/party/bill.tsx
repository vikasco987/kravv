// "use client";
// import React from "react";
// import { View, Text, FlatList, StyleSheet } from "react-native";
// import { useSearchParams } from "expo-router"; // ✅ Expo Router

// export default function BillPage() {
//   const params = useSearchParams();
//   const cartParam = params.cart || "{}"; // gets passed from router.push
//   const cart = JSON.parse(cartParam);
//   const cartItems = Object.values(cart);

//   const totalPrice = cartItems.reduce(
//     (sum: number, item: any) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Your Bill</Text>
//       <FlatList
//         data={cartItems}
//         keyExtractor={(item: any) => item.id}
//         renderItem={({ item }: any) => (
//           <View style={styles.itemRow}>
//             <Text style={styles.itemName}>
//               {item.name} x {item.quantity}
//             </Text>
//             <Text style={styles.itemPrice}>
//               ₹{(item.price || 0) * item.quantity}
//             </Text>
//           </View>
//         )}
//         ListFooterComponent={
//           <View style={styles.totalRow}>
//             <Text style={styles.totalText}>Total:</Text>
//             <Text style={styles.totalText}>₹{totalPrice}</Text>
//           </View>
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ddd",
//   },
//   itemName: { fontSize: 16 },
//   itemPrice: { fontSize: 16, fontWeight: "bold" },
//   totalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 20,
//     paddingVertical: 10,
//     borderTopWidth: 1,
//     borderTopColor: "#000",
//   },
//   totalText: { fontSize: 18, fontWeight: "bold" },
// });





// "use client";
// import React, { useEffect, useState } from "react";
// import { View, Text, FlatList, StyleSheet } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router"; // ✅ correct hook
// import { Feather } from "@expo/vector-icons";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   imageUrl?: string;
//   unit?: string;
//   quantity: number;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams(); // ✅ Expo Router native-safe
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);

//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const totalPrice = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Your Bill</Text>
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <Text style={styles.itemQty}>x {item.quantity}</Text>
//             <Text style={styles.itemPrice}>₹{item.price}</Text>
//           </View>
//         )}
//       />
//       <View style={styles.total}>
//         <Text style={styles.totalText}>Total: ₹{totalPrice}</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ccc",
//   },
//   itemName: { fontSize: 16, flex: 2 },
//   itemQty: { fontSize: 16, flex: 1, textAlign: "center" },
//   itemPrice: { fontSize: 16, flex: 1, textAlign: "right" },
//   total: { marginTop: 20, alignItems: "flex-end" },
//   totalText: { fontSize: 18, fontWeight: "bold" },
// });


// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router"; 
// import { Feather } from "@expo/vector-icons";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams(); 
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);

//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const increaseQty = (id: string) => {
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );
//   };

//   const decreaseQty = (id: string) => {
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );
//   };

//   const clearCart = () => setCart([]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const screenWidth = Dimensions.get("window").width;

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.closeButton}
//         >
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 150 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => decreaseQty(item.id)}
//               >
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => increaseQty(item.id)}
//               >
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Sticky Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>
//         <TouchableOpacity style={styles.processBtn}>
//           <Text style={styles.processText}>PROCESS ORDER</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#ef4444", borderRadius: 8 },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     marginHorizontal: 15,
//     marginVertical: 6,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
//   qtyBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#d1fae5",
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 6,
//   },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16, color: "#111" },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: {
//     backgroundColor: "#ef4444",
//     borderRadius: 14,
//     paddingVertical: 16,
//     marginTop: 15,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });



















// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   ActivityIndicator,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import { Picker } from "@react-native-picker/picker";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// type Party = {
//   id: string;
//   customerName: string;
//   phone: string;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [parties, setParties] = useState<Party[]>([]);
//   const [selectedParty, setSelectedParty] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   // Load cart
//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   // Load customers from your Party API
//   useEffect(() => {
//     const fetchParties = async () => {
//       setLoading(true);
//       try {
//         const res = await fetch("https://billing-backend-sable.vercel.app/api/party");
//         const data = await res.json();
//         setParties(data);
//       } catch (err) {
//         console.error("Error loading parties:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchParties();
//   }, []);

//   const increaseQty = (id: string) => {
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );
//   };

//   const decreaseQty = (id: string) => {
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );
//   };

//   const clearCart = () => setCart([]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       alert("Please select a customer before processing the order.");
//       return;
//     }

//     try {
//       const res = await fetch("https://billing-backend-sable.vercel.app/api/bills", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           customerId: selectedParty,
//           items: cart,
//           total: subtotal,
//         }),
//       });

//       if (res.ok) {
//         alert("✅ Order saved successfully!");
//         clearCart();
//         setSelectedParty(null);
//       } else {
//         const err = await res.json();
//         alert("❌ Failed to process order: " + err.message);
//       }
//     } catch (error) {
//       console.error(error);
//       alert("❌ Network error. Try again.");
//     }
//   };

//   const screenWidth = Dimensions.get("window").width;

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Customer Picker */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Select Customer</Text>
//         {loading ? (
//           <ActivityIndicator color="#ef4444" />
//         ) : (
//           <Picker
//             selectedValue={selectedParty}
//             onValueChange={(value) => setSelectedParty(value)}
//             style={styles.picker}
//           >
//             <Picker.Item label="-- Choose Customer --" value={null} />
//             {parties.map((p) => (
//               <Picker.Item
//                 key={p.id}
//                 label={`${p.customerName} (${p.phone})`}
//                 value={p.id}
//               />
//             ))}
//           </Picker>
//         )}
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 150 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => decreaseQty(item.id)}
//               >
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => increaseQty(item.id)}
//               >
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>
//               ₹{(item.price || 0) * item.quantity}
//             </Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>
//         <TouchableOpacity style={styles.processBtn} onPress={handleProcessOrder}>
//           <Text style={styles.processText}>PROCESS ORDER</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//     backgroundColor: "#fff",
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#ef4444",
//     borderRadius: 8,
//   },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: {
//     margin: 15,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 10,
//     elevation: 2,
//   },
//   label: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
//   picker: { height: 50, width: "100%" },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     marginHorizontal: 15,
//     marginVertical: 6,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     justifyContent: "center",
//   },
//   qtyBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#d1fae5",
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 6,
//   },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#ef4444",
//   },
//   footer: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginVertical: 5,
//   },
//   summaryText: { fontSize: 16, color: "#111" },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: {
//     backgroundColor: "#ef4444",
//     borderRadius: 14,
//     paddingVertical: 16,
//     marginTop: 15,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });










// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// type Party = {
//   id: string;
//   customerName: string;
//   phone: string;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<string | null>(null);

//   // AddCustomerForm state
//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);

//   // Load cart
//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   // Cart functions
//   const increaseQty = (id: string) => {
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );
//   };

//   const decreaseQty = (id: string) => {
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );
//   };

//   const clearCart = () => setCart([]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       alert("Please add a customer before processing the order.");
//       return;
//     }

//     try {
//       const res = await fetch("https://billing-backend-sable.vercel.app/api/bills", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           customerId: selectedParty,
//           items: cart,
//           total: subtotal,
//         }),
//       });

//       if (res.ok) {
//         alert("✅ Order saved successfully!");
//         clearCart();
//         setSelectedParty(null);
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         const err = await res.json();
//         alert("❌ Failed to process order: " + err.message);
//       }
//     } catch (error) {
//       console.error(error);
//       alert("❌ Network error. Try again.");
//     }
//   };

//   // Add Customer form submit
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             customerName,
//             phone,
//             billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data.id); // auto-select the new customer
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err) {
//       console.error(err);
//       Alert.alert("Error", "Something went wrong. Please try again.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Add Customer Form */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add Customer</Text>

//         <TextInput
//           value={customerName}
//           onChangeText={setCustomerName}
//           placeholder="Customer Name"
//           style={styles.input}
//         />

//         <TextInput
//           value={phone}
//           onChangeText={setPhone}
//           placeholder="Phone"
//           keyboardType="phone-pad"
//           style={styles.input}
//         />

//         <TextInput
//           value={billingAddress}
//           onChangeText={setBillingAddress}
//           placeholder="Billing Address"
//           multiline
//           numberOfLines={3}
//           style={[styles.input, { height: 80 }]}
//         />

//         <TouchableOpacity
//           onPress={() => setShowPicker(true)}
//           style={[styles.input, { justifyContent: "center" }]}
//         >
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>

//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}

//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => decreaseQty(item.id)}
//               >
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => increaseQty(item.id)}
//               >
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>
//         <TouchableOpacity style={styles.processBtn} onPress={handleProcessOrder}>
//           <Text style={styles.processText}>PROCESS ORDER</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//     backgroundColor: "#fff",
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#ef4444",
//     borderRadius: 8,
//   },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: {
//     margin: 15,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     elevation: 2,
//   },
//   label: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     backgroundColor: "white",
//   },
//   button: {
//     backgroundColor: "#4f46e5",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     marginHorizontal: 15,
//     marginVertical: 6,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     justifyContent: "center",
//   },
//   qtyBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#d1fae5",
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 6,
//   },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16, color: "#111" },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: {
//     backgroundColor: "#ef4444",
//     borderRadius: 14,
//     paddingVertical: 16,
//     marginTop: 15,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });













// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<string | null>(null);

//   // Clerk auth
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   // AddCustomerForm state
//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);

//   // Load cart from params
//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // Process order
//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       alert("Please add a customer before processing the order.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;

//       const res = await fetch(
//         "https://billing-backend-sable.vercel.app/api/bills",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             customerId: selectedParty,
//             items: cart,
//             total: subtotal,
//           }),
//         }
//       );

//       const data = await res.json();

//       if (res.ok) {
//         alert("✅ Order saved successfully!");
//         clearCart();
//         setSelectedParty(null);
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         alert("❌ Failed to process order: " + data.error || data.message);
//       }
//     } catch (error: any) {
//       console.error(error);
//       alert("❌ Network error. Try again.");
//     }
//   };

//   // Add Customer form submit (Clerk token + correct payload keys)
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;

//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName, // <-- must match backend
//             phone,
//             address: billingAddress, // <-- must match backend
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data.id); // auto-select the new customer
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong. Please try again.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Add Customer Form */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add Customer</Text>

//         <TextInput
//           value={customerName}
//           onChangeText={setCustomerName}
//           placeholder="Customer Name"
//           style={styles.input}
//         />

//         <TextInput
//           value={phone}
//           onChangeText={setPhone}
//           placeholder="Phone"
//           keyboardType="phone-pad"
//           style={styles.input}
//         />

//         <TextInput
//           value={billingAddress}
//           onChangeText={setBillingAddress}
//           placeholder="Billing Address"
//           multiline
//           numberOfLines={3}
//           style={[styles.input, { height: 80 }]}
//         />

//         <TouchableOpacity
//           onPress={() => setShowPicker(true)}
//           style={[styles.input, { justifyContent: "center" }]}
//         >
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>

//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}

//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => decreaseQty(item.id)}
//               >
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => increaseQty(item.id)}
//               >
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>
//         <TouchableOpacity style={styles.processBtn} onPress={handleProcessOrder}>
//           <Text style={styles.processText}>PROCESS ORDER</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//     backgroundColor: "#fff",
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#ef4444",
//     borderRadius: 8,
//   },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: {
//     margin: 15,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     elevation: 2,
//   },
//   label: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     backgroundColor: "white",
//   },
//   button: {
//     backgroundColor: "#4f46e5",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     marginHorizontal: 15,
//     marginVertical: 6,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     justifyContent: "center",
//   },
//   qtyBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#d1fae5",
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 6,
//   },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#ef4444",
//   },
//   footer: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16, color: "#111" },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: {
//     backgroundColor: "#ef4444",
//     borderRadius: 14,
//     paddingVertical: 16,
//     marginTop: 15,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });
















// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // ✅ Import your Company Info component
// import CompanyInfoScreen from "../party/CompanyInfoScreen";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<string | null>(null);

//   // Clerk auth
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   // Customer form
//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);

//   // ✅ Company info expand/collapse state
//   const [showCompanyInfo, setShowCompanyInfo] = useState(false);

//   // Load cart from params
//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // Process order
//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       alert("Please add a customer before processing the order.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;

//       const res = await fetch(
//         "https://billing-backend-sable.vercel.app/api/bills",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             customerId: selectedParty,
//             items: cart,
//             total: subtotal,
//           }),
//         }
//       );

//       const data = await res.json();

//       if (res.ok) {
//         alert("✅ Order saved successfully!");
//         clearCart();
//         setSelectedParty(null);
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         alert("❌ Failed to process order: " + (data.error || data.message));
//       }
//     } catch (error: any) {
//       console.error(error);
//       alert("❌ Network error. Try again.");
//     }
//   };

//   // Add Customer form
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;

//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName,
//             phone,
//             address: billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data.id);
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ✅ Company Info Section (Collapsible) */}
//       <View style={styles.pickerContainer}>
//         <TouchableOpacity
//           onPress={() => setShowCompanyInfo((prev) => !prev)}
//           style={styles.expandHeader}
//         >
//           <Text style={styles.label}>Company Information</Text>
//           <Feather
//             name={showCompanyInfo ? "chevron-up" : "chevron-down"}
//             size={20}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>

//         {showCompanyInfo && (
//           <View style={styles.companyBox}>
//             {/* Show company details and allow edit */}
//             <CompanyInfoScreen />
//           </View>
//         )}
//       </View>

//       {/* Add Customer Form */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add Customer</Text>

//         <TextInput
//           value={customerName}
//           onChangeText={setCustomerName}
//           placeholder="Customer Name"
//           style={styles.input}
//         />

//         <TextInput
//           value={phone}
//           onChangeText={setPhone}
//           placeholder="Phone"
//           keyboardType="phone-pad"
//           style={styles.input}
//         />

//         <TextInput
//           value={billingAddress}
//           onChangeText={setBillingAddress}
//           placeholder="Billing Address"
//           multiline
//           numberOfLines={3}
//           style={[styles.input, { height: 80 }]}
//         />

//         <TouchableOpacity
//           onPress={() => setShowPicker(true)}
//           style={[styles.input, { justifyContent: "center" }]}
//         >
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>

//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}

//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => decreaseQty(item.id)}
//               >
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity
//                 style={styles.qtyBtn}
//                 onPress={() => increaseQty(item.id)}
//               >
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>
//         <TouchableOpacity style={styles.processBtn} onPress={handleProcessOrder}>
//           <Text style={styles.processText}>PROCESS ORDER</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//     backgroundColor: "#fff",
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//   },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#ef4444",
//     borderRadius: 8,
//   },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

//   pickerContainer: {
//     margin: 15,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     elevation: 2,
//   },
//   label: { fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#111" },

//   expandHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   companyBox: {
//     borderTopWidth: 1,
//     borderColor: "#ddd",
//     marginTop: 10,
//     paddingTop: 10,
//   },

//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     backgroundColor: "white",
//   },
//   button: {
//     backgroundColor: "#4f46e5",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 15,
//     marginHorizontal: 15,
//     marginVertical: 6,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     justifyContent: "center",
//   },
//   qtyBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#d1fae5",
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 6,
//   },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#ef4444",
//   },
//   footer: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16, color: "#111" },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: {
//     backgroundColor: "#ef4444",
//     borderRadius: 14,
//     paddingVertical: 16,
//     marginTop: 15,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });


























// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";

// import CompanyInfoScreen from "../party/CompanyInfoScreen";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<string | null>(null);
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);
//   const [showCompanyInfo, setShowCompanyInfo] = useState(false);

//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // 🔹 Generate and open PDF Bill
//   const generateBillPDF = async () => {
//     const currentDate = new Date().toLocaleString();

//     const htmlContent = `
//       <html>
//         <head>
//           <style>
//             body { font-family: Arial, sans-serif; padding: 20px; }
//             h1 { text-align: center; color: #333; }
//             .info, .footer { margin-bottom: 20px; }
//             .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//             .table th, .table td {
//               border: 1px solid #ddd;
//               padding: 10px;
//               text-align: center;
//             }
//             .table th { background-color: #f5f5f5; }
//             .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; }
//           </style>
//         </head>
//         <body>
//           <h1>🧾 MealCloud Bill</h1>
//           <div class="info">
//             <p><strong>Customer:</strong> ${customerName}</p>
//             <p><strong>Phone:</strong> ${phone}</p>
//             <p><strong>Address:</strong> ${billingAddress}</p>
//             <p><strong>Date:</strong> ${currentDate}</p>
//           </div>

//           <table class="table">
//             <tr>
//               <th>Item</th>
//               <th>Qty</th>
//               <th>Price</th>
//               <th>Total</th>
//             </tr>
//             ${cart
//               .map(
//                 (item) => `
//               <tr>
//                 <td>${item.name}</td>
//                 <td>${item.quantity}</td>
//                 <td>₹${item.price?.toFixed(2) || 0}</td>
//                 <td>₹${((item.price || 0) * item.quantity).toFixed(2)}</td>
//               </tr>`
//               )
//               .join("")}
//           </table>

//           <div class="total">Total: ₹${subtotal.toFixed(2)}</div>

//           <div class="footer">
//             <p>Thank you for your purchase! 💚</p>
//             <p>Powered by MealCloud</p>
//           </div>
//         </body>
//       </html>
//     `;

//     const { uri } = await Print.printToFileAsync({ html: htmlContent });
//     if (Platform.OS === "ios" || (await Sharing.isAvailableAsync())) {
//       await Sharing.shareAsync(uri);
//     } else {
//       Alert.alert("Bill Generated", `Saved at: ${uri}`);
//     }
//   };

//   // 🔹 Process order
//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       alert("Please add a customer before processing the order.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;

//       const res = await fetch(
//         "https://billing-backend-sable.vercel.app/api/bills",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             customerId: selectedParty,
//             items: cart,
//             total: subtotal,
//           }),
//         }
//       );

//       const data = await res.json();

//       if (res.ok) {
//         Alert.alert("✅ Order saved successfully!");
//         await generateBillPDF(); // ✅ generate bill after saving
//         clearCart();
//         setSelectedParty(null);
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         Alert.alert("❌ Failed to process order", data.error || data.message);
//       }
//     } catch (error: any) {
//       console.error(error);
//       Alert.alert("❌ Network error. Try again.");
//     }
//   };

//   // 🔹 Add new customer
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName,
//             phone,
//             address: billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data.id);
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Company Info */}
//       <View style={styles.pickerContainer}>
//         <TouchableOpacity
//           onPress={() => setShowCompanyInfo((prev) => !prev)}
//           style={styles.expandHeader}
//         >
//           <Text style={styles.label}>Company Information</Text>
//           <Feather
//             name={showCompanyInfo ? "chevron-up" : "chevron-down"}
//             size={20}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>
//         {showCompanyInfo && (
//           <View style={styles.companyBox}>
//             <CompanyInfoScreen />
//           </View>
//         )}
//       </View>

//       {/* Add Customer Form */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add Customer</Text>
//         <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Customer Name" style={styles.input} />
//         <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" style={styles.input} />
//         <TextInput value={billingAddress} onChangeText={setBillingAddress} placeholder="Billing Address" multiline numberOfLines={3} style={[styles.input, { height: 80 }]} />
//         <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: "center" }]}>
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>
//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}
//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>
//         <TouchableOpacity style={styles.processBtn} onPress={handleProcessOrder}>
//           <Text style={styles.processText}>GENERATE BILL</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", elevation: 3 },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: { margin: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 2 },
//   label: { fontSize: 16, fontWeight: "bold", color: "#111" },
//   expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   companyBox: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 10, paddingTop: 10 },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
//   button: { backgroundColor: "#4f46e5", padding: 15, borderRadius: 10, alignItems: "center" },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12 },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
//   qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginHorizontal: 6 },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16 },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: { backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 16, marginTop: 15, alignItems: "center" },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });














// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // ✅ Import GenerateBill component
// import GenerateBill from "../party/GenerateBill";
// import CompanyInfoScreen from "../party/CompanyInfoScreen";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<string | null>(null);
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);
//   const [showCompanyInfo, setShowCompanyInfo] = useState(false);

//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // 🔹 Process order
//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       alert("Please add a customer before processing the order.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;

//       const res = await fetch(
//         "https://billing-backend-sable.vercel.app/api/bills",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             customerId: selectedParty,
//             items: cart,
//             total: subtotal,
//           }),
//         }
//       );

//       const data = await res.json();

//       if (res.ok) {
//         Alert.alert("✅ Order saved successfully!");
//         clearCart();
//         setSelectedParty(null);
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         Alert.alert("❌ Failed to process order", data.error || data.message);
//       }
//     } catch (error: any) {
//       console.error(error);
//       Alert.alert("❌ Network error. Try again.");
//     }
//   };

//   // 🔹 Add new customer
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName,
//             phone,
//             address: billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data.id);
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Company Info */}
//       <View style={styles.pickerContainer}>
//         <TouchableOpacity
//           onPress={() => setShowCompanyInfo((prev) => !prev)}
//           style={styles.expandHeader}
//         >
//           <Text style={styles.label}>Company Information</Text>
//           <Feather
//             name={showCompanyInfo ? "chevron-up" : "chevron-down"}
//             size={20}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>
//         {showCompanyInfo && (
//           <View style={styles.companyBox}>
//             <CompanyInfoScreen />
//           </View>
//         )}
//       </View>

//       {/* Add Customer Form */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add Customer</Text>
//         <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Customer Name" style={styles.input} />
//         <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" style={styles.input} />
//         <TextInput value={billingAddress} onChangeText={setBillingAddress} placeholder="Billing Address" multiline numberOfLines={3} style={[styles.input, { height: 80 }]} />
//         <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: "center" }]}>
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>
//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}
//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>

//         {/* ✅ Generate Bill Button (uses separate component) */}
//         {cart.length > 0 && selectedParty && (
//           <GenerateBill
//             customerName={customerName}
//             phone={phone}
//             billingAddress={billingAddress}
//             cart={cart}
//             companyInfo={{
//               name: "MealCloud",
//               address: "123 Main Street",
//               phone: "9876543210",
//               gst: "27ABCDE1234F1Z5",
//             }}
//           />
//         )}

//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", elevation: 3 },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: { margin: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 2 },
//   label: { fontSize: 16, fontWeight: "bold", color: "#111" },
//   expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   companyBox: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 10, paddingTop: 10 },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
//   button: { backgroundColor: "#4f46e5", padding: 15, borderRadius: 10, alignItems: "center" },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12 },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
//   qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginHorizontal: 6 },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16 },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: { backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 16, marginTop: 15, alignItems: "center" },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
// });















// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // ✅ Import GenerateBill component
// import GenerateBill from "../party/GenerateBill";
// import CompanyInfoScreen from "../party/CompanyInfoScreen";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// type Party = {
//   id: string;
//   name: string;
//   phone: string;
//   address?: string;
//   dob?: string;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<Party | null>(null);
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);
//   const [showCompanyInfo, setShowCompanyInfo] = useState(false);

//   // Dropdown state
//   const [parties, setParties] = useState<Party[]>([]);
//   const [showPartyDropdown, setShowPartyDropdown] = useState(false);

//   // Fetch cart from params
//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   // Fetch all existing parties
//   const fetchParties = async () => {
//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const res = await fetch("https://billing-backend-sable.vercel.app/api/parties", {
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       });
//       const data = await res.json();
//       if (res.ok) setParties(data);
//     } catch (err) {
//       console.error("Fetch parties error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchParties();
//   }, [isLoaded, isSignedIn]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // 🔹 Process order
//   const handleProcessOrder = async () => {
//     if (!selectedParty) {
//       Alert.alert("Please select or add a customer before processing the order.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const res = await fetch(
//         "https://billing-backend-sable.vercel.app/api/bills",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             customerId: selectedParty.id,
//             items: cart,
//             total: subtotal,
//           }),
//         }
//       );

//       const data = await res.json();
//       if (res.ok) {
//         Alert.alert("✅ Order saved successfully!");
//         clearCart();
//         setSelectedParty(null);
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         Alert.alert("❌ Failed to process order", data.error || data.message);
//       }
//     } catch (error: any) {
//       console.error(error);
//       Alert.alert("❌ Network error. Try again.");
//     }
//   };

//   // 🔹 Add new customer
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName,
//             phone,
//             address: billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data);
//         fetchParties(); // Refresh dropdown
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Company Info */}
//       <View style={styles.pickerContainer}>
//         <TouchableOpacity
//           onPress={() => setShowCompanyInfo((prev) => !prev)}
//           style={styles.expandHeader}
//         >
//           <Text style={styles.label}>Company Information</Text>
//           <Feather
//             name={showCompanyInfo ? "chevron-up" : "chevron-down"}
//             size={20}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>
//         {showCompanyInfo && (
//           <View style={styles.companyBox}>
//             <CompanyInfoScreen />
//           </View>
//         )}
//       </View>

//       {/* Select Existing Customer */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Select Customer</Text>
//         <TouchableOpacity
//           style={styles.selectBox}
//           onPress={() => setShowPartyDropdown((prev) => !prev)}
//         >
//           <Text>{selectedParty ? selectedParty.name : "Select Customer"}</Text>
//           <Feather name={showPartyDropdown ? "chevron-up" : "chevron-down"} size={18} color="#4f46e5" />
//         </TouchableOpacity>
//         {showPartyDropdown && (
//           <View style={styles.dropdown}>
//             {parties.map((p) => (
//               <TouchableOpacity
//                 key={p.id}
//                 style={styles.dropdownItem}
//                 onPress={() => {
//                   setSelectedParty(p);
//                   setShowPartyDropdown(false);
//                   setCustomerName(p.name);
//                   setPhone(p.phone);
//                   setBillingAddress(p.address || "");
//                   if (p.dob) setDob(new Date(p.dob));
//                 }}
//               >
//                 <Text>{p.name} ({p.phone})</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}
//       </View>

//       {/* Add Customer Form */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add New Customer</Text>
//         <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Customer Name" style={styles.input} />
//         <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" style={styles.input} />
//         <TextInput value={billingAddress} onChangeText={setBillingAddress} placeholder="Billing Address" multiline numberOfLines={3} style={[styles.input, { height: 80 }]} />
//         <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: "center" }]}>
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>
//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}
//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>

//         {/* ✅ Generate Bill Button */}
//         {cart.length > 0 && selectedParty && (
//           <GenerateBill
//             customerName={customerName}
//             phone={phone}
//             billingAddress={billingAddress}
//             cart={cart}
//             companyInfo={{
//               name: "MealCloud",
//               address: "123 Main Street",
//               phone: "9876543210",
//               gst: "27ABCDE1234F1Z5",
//             }}
//           />
//         )}

//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", elevation: 3 },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: { margin: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 2 },
//   label: { fontSize: 16, fontWeight: "bold", color: "#111" },
//   expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   companyBox: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 10, paddingTop: 10 },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
//   button: { backgroundColor: "#4f46e5", padding: 15, borderRadius: 10, alignItems: "center" },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12 },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
//   qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginHorizontal: 6 },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16 },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: { backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 16, marginTop: 15, alignItems: "center" },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
//   selectBox: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
//   dropdown: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, maxHeight: 200 },
//   dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
// });













// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import * as Print from "expo-print";

// // Import company info
// import CompanyInfoScreen from "../party/CompanyInfoScreen";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// type Party = {
//   id: string;
//   name: string;
//   phone: string;
//   address?: string;
//   dob?: string;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<Party | null>(null);
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);
//   const [showCompanyInfo, setShowCompanyInfo] = useState(false);

//   const [parties, setParties] = useState<Party[]>([]);
//   const [showPartyDropdown, setShowPartyDropdown] = useState(false);

//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   const fetchParties = async () => {
//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const res = await fetch("https://billing-backend-sable.vercel.app/api/parties", {
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       });
//       const data = await res.json();
//       if (res.ok) setParties(data);
//     } catch (err) {
//       console.error("Fetch parties error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchParties();
//   }, [isLoaded, isSignedIn]);

//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // 🔹 Generate printable bill text
//   const generateBillText = () => {
//     const billNo = "MS-" + Math.floor(Math.random() * 100000);
//     const gstPercent = 5;
//     const gstAmount = (subtotal * gstPercent) / 100;
//     const totalAmount = subtotal + gstAmount;

//     let billText = `
// ------------------------------------------------------------
//                         MEALCLOUD
//                   GSTIN: 07ABCDE1234F1Z5
//                 Address: Delhi, India - 110001
//                  Phone: +91 98765 43210
// ------------------------------------------------------------
// Date: ${new Date().toLocaleDateString()}                   Bill No: ${billNo}
// Customer Name: ${customerName}
// Phone: ${phone}
// ------------------------------------------------------------
// S.No   Item Name              Qty   Price   Amount
// ------------------------------------------------------------
// `;
//     cart.forEach((item, index) => {
//       const amount = (item.price || 0) * item.quantity;
//       billText += `${index + 1}   ${item.name.padEnd(20)} ${item.quantity}    ${(item.price || 0).toFixed(
//         2
//       )}   ${amount.toFixed(2)}\n`;
//     });

//     billText += `------------------------------------------------------------
// Subtotal: ₹${subtotal.toFixed(2)}
// GST (${gstPercent}%): ₹${gstAmount.toFixed(2)}
// ------------------------------------------------------------
// TOTAL AMOUNT: ₹${totalAmount.toFixed(2)}
// ------------------------------------------------------------
// Payment Mode: Cash
// Thank you for your purchase!
// ------------------------------------------------------------
// `;
//     return { billText, billNo, gstAmount, totalAmount, gstPercent };
//   };

//   // 🔹 Print + Save Bill
//   const handlePrintAndSaveBill = async () => {
//     if (!selectedParty) {
//       Alert.alert("Please select or add a customer before printing.");
//       return;
//     }

//     const { billText, billNo, gstAmount, totalAmount, gstPercent } =
//       generateBillText();

//     try {
//       const htmlContent = `<pre style="font-family: monospace; font-size: 14px;">${billText}</pre>`;

//       // 🖨️ Print
//       await Print.printAsync({ html: htmlContent });

//       // 💾 Save to backend
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const res = await fetch(
//         "https://billing-backend-sable.vercel.app/api/bills",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             billNo,
//             customerId: selectedParty.id,
//             items: cart,
//             subtotal,
//             gstPercent,
//             gstAmount,
//             total: totalAmount,
//             date: new Date().toISOString(),
//           }),
//         }
//       );

//       if (res.ok) {
//         Alert.alert("✅ Bill printed and saved successfully!");
//         clearCart();
//       } else {
//         const data = await res.json();
//         Alert.alert("❌ Failed to save bill", data.error || "Unknown error");
//       }
//     } catch (error) {
//       console.error(error);
//       Alert.alert("Error", "Failed to print or save bill.");
//     }
//   };

//   // 🔹 Add new customer
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName,
//             phone,
//             address: billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data);
//         fetchParties();
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Company Info */}
//       <View style={styles.pickerContainer}>
//         <TouchableOpacity
//           onPress={() => setShowCompanyInfo((prev) => !prev)}
//           style={styles.expandHeader}
//         >
//           <Text style={styles.label}>Company Information</Text>
//           <Feather
//             name={showCompanyInfo ? "chevron-up" : "chevron-down"}
//             size={20}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>
//         {showCompanyInfo && (
//           <View style={styles.companyBox}>
//             <CompanyInfoScreen />
//           </View>
//         )}
//       </View>

//       {/* Select Customer */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Select Customer</Text>
//         <TouchableOpacity
//           style={styles.selectBox}
//           onPress={() => setShowPartyDropdown((prev) => !prev)}
//         >
//           <Text>{selectedParty ? selectedParty.name : "Select Customer"}</Text>
//           <Feather
//             name={showPartyDropdown ? "chevron-up" : "chevron-down"}
//             size={18}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>
//         {showPartyDropdown && (
//           <View style={styles.dropdown}>
//             {parties.map((p) => (
//               <TouchableOpacity
//                 key={p.id}
//                 style={styles.dropdownItem}
//                 onPress={() => {
//                   setSelectedParty(p);
//                   setShowPartyDropdown(false);
//                   setCustomerName(p.name);
//                   setPhone(p.phone);
//                   setBillingAddress(p.address || "");
//                   if (p.dob) setDob(new Date(p.dob));
//                 }}
//               >
//                 <Text>{p.name} ({p.phone})</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}
//       </View>

//       {/* Add Customer */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Add New Customer</Text>
//         <TextInput
//           value={customerName}
//           onChangeText={setCustomerName}
//           placeholder="Customer Name"
//           style={styles.input}
//         />
//         <TextInput
//           value={phone}
//           onChangeText={setPhone}
//           placeholder="Phone"
//           keyboardType="phone-pad"
//           style={styles.input}
//         />
//         <TextInput
//           value={billingAddress}
//           onChangeText={setBillingAddress}
//           placeholder="Billing Address"
//           multiline
//           numberOfLines={3}
//           style={[styles.input, { height: 80 }]}
//         />
//         <TouchableOpacity
//           onPress={() => setShowPicker(true)}
//           style={[styles.input, { justifyContent: "center" }]}
//         >
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>
//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}
//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Bill Items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>

//         {cart.length > 0 && selectedParty && (
//           <TouchableOpacity
//             onPress={handlePrintAndSaveBill}
//             style={styles.processBtn}
//           >
//             <Text style={styles.processText}>🖨️ PRINT & SAVE BILL</Text>
//           </TouchableOpacity>
//         )}

//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", elevation: 3 },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: { margin: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 2 },
//   label: { fontSize: 16, fontWeight: "bold", color: "#111" },
//   expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   companyBox: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 10, paddingTop: 10 },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
//   button: { backgroundColor: "#4f46e5", padding: 15, borderRadius: 10, alignItems: "center" },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12 },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
//   qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginHorizontal: 6 },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16 },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: { backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 16, marginTop: 15, alignItems: "center" },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
//   selectBox: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
//   dropdown: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, maxHeight: 200 },
//   dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
// });














// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
//   ToastAndroid,
// } from "react-native";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { SimpleBill } from "../bill/SimpleBill";

// // ✅ instant print + save
// import CompanyInfoScreen from "../party/CompanyInfoScreen";

// type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   quantity: number;
// };

// type Party = {
//   id: string;
//   name: string;
//   phone: string;
//   address?: string;
//   dob?: string;
// };

// export default function BillPage() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [selectedParty, setSelectedParty] = useState<Party | null>(null);
//   const { getToken } = useAuth();
//   const { user, isLoaded, isSignedIn } = useUser();

//   const [customerName, setCustomerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [dob, setDob] = useState<Date | null>(null);
//   const [showPicker, setShowPicker] = useState(false);
//   const [showCompanyInfo, setShowCompanyInfo] = useState(false);

//   const [parties, setParties] = useState<Party[]>([]);
//   const [showPartyDropdown, setShowPartyDropdown] = useState(false);

//   // 🔹 Fetch cart from params
//   useEffect(() => {
//     if (params.cart) {
//       try {
//         const parsed = JSON.parse(params.cart as string);
//         setCart(Object.values(parsed));
//       } catch (err) {
//         console.error("Failed to parse cart params:", err);
//       }
//     }
//   }, [params.cart]);

//   // 🔹 Fetch all existing parties
//   const fetchParties = async () => {
//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const res = await fetch("https://billing-backend-sable.vercel.app/api/parties", {
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       });
//       const data = await res.json();
//       if (res.ok) setParties(data);
//     } catch (err) {
//       console.error("Fetch parties error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchParties();
//   }, [isLoaded, isSignedIn]);

//   // 🔹 Subtotal
//   const subtotal = cart.reduce(
//     (sum, item) => sum + (item.price || 0) * item.quantity,
//     0
//   );

//   const increaseQty = (id: string) =>
//     setCart((prev) =>
//       prev.map((item) =>
//         item.id === id ? { ...item, quantity: item.quantity + 1 } : item
//       )
//     );

//   const decreaseQty = (id: string) =>
//     setCart((prev) =>
//       prev
//         .map((item) =>
//           item.id === id
//             ? { ...item, quantity: Math.max(1, item.quantity - 1) }
//             : item
//         )
//         .filter((item) => item.quantity > 0)
//     );

//   const clearCart = () => setCart([]);

//   // ✅ Instant Print & Save Bill
//   const handlePrintAndSave = async () => {
//     if (!cart.length) return ToastAndroid.show("🛒 Cart empty!", ToastAndroid.SHORT);
//     if (!selectedParty && (!customerName || !phone)) {
//       Alert.alert("Missing Info", "Please select or add a customer first.");
//       return;
//     }

//     try {
//       const token = await getToken();
//       if (!token) throw new Error("User not authenticated!");

//       const userClerkId = user?.id || "";

//       const result = await SimpleBill(cart, token, userClerkId, {
//         customerName: selectedParty?.name || customerName,
//         phone: selectedParty?.phone || phone,
//         paymentMode: "CASH",
//         notes: "Printed via Bluetooth",
//       });

//       if (result?.status === "success") {
//         ToastAndroid.show("✅ Bill Printed & Saved!", ToastAndroid.SHORT);
//         clearCart();
//         setSelectedParty(null);
//       } else {
//         ToastAndroid.show("⚠️ Failed to print or save bill", ToastAndroid.SHORT);
//       }
//     } catch (err: any) {
//       console.error("Print error:", err);
//       ToastAndroid.show("❌ Printing failed", ToastAndroid.SHORT);
//     }
//   };

//   // 🔹 Add new customer
//   const handleAddCustomer = async () => {
//     if (!customerName || !phone) {
//       Alert.alert("Missing Fields", "Please enter name and phone number.");
//       return;
//     }

//     try {
//       const token = isLoaded && isSignedIn ? await getToken() : null;
//       const response = await fetch(
//         "https://billing-backend-sable.vercel.app/api/parties",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({
//             name: customerName,
//             phone,
//             address: billingAddress,
//             dob: dob ? dob.toISOString() : null,
//           }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         Alert.alert("✅ Success", "Customer added successfully!");
//         setSelectedParty(data);
//         fetchParties();
//         setCustomerName("");
//         setPhone("");
//         setBillingAddress("");
//         setDob(null);
//       } else {
//         Alert.alert("Error", data.error || "Failed to add customer.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f5f5f5" }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Current Bill Details</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Text style={styles.closeText}>CLOSE X</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Company Info */}
//       <View style={styles.pickerContainer}>
//         <TouchableOpacity
//           onPress={() => setShowCompanyInfo((prev) => !prev)}
//           style={styles.expandHeader}
//         >
//           <Text style={styles.label}>Company Information</Text>
//           <Feather
//             name={showCompanyInfo ? "chevron-up" : "chevron-down"}
//             size={20}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>
//         {showCompanyInfo && (
//           <View style={styles.companyBox}>
//             <CompanyInfoScreen />
//           </View>
//         )}
//       </View>

//       {/* Customer selection & add */}
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Select Customer</Text>
//         <TouchableOpacity
//           style={styles.selectBox}
//           onPress={() => setShowPartyDropdown((prev) => !prev)}
//         >
//           <Text>{selectedParty ? selectedParty.name : "Select Customer"}</Text>
//           <Feather
//             name={showPartyDropdown ? "chevron-up" : "chevron-down"}
//             size={18}
//             color="#4f46e5"
//           />
//         </TouchableOpacity>

//         {showPartyDropdown && (
//           <View style={styles.dropdown}>
//             {parties.map((p) => (
//               <TouchableOpacity
//                 key={p.id}
//                 style={styles.dropdownItem}
//                 onPress={() => {
//                   setSelectedParty(p);
//                   setShowPartyDropdown(false);
//                   setCustomerName(p.name);
//                   setPhone(p.phone);
//                   setBillingAddress(p.address || "");
//                   if (p.dob) setDob(new Date(p.dob));
//                 }}
//               >
//                 <Text>{p.name} ({p.phone})</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         <Text style={styles.label}>Add New Customer</Text>
//         <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Customer Name" style={styles.input} />
//         <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" style={styles.input} />
//         <TextInput value={billingAddress} onChangeText={setBillingAddress} placeholder="Billing Address" multiline numberOfLines={3} style={[styles.input, { height: 80 }]} />

//         <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: "center" }]}>
//           <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
//         </TouchableOpacity>

//         {showPicker && (
//           <DateTimePicker
//             value={dob || new Date()}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={(event, selectedDate) => {
//               setShowPicker(Platform.OS === "ios");
//               if (selectedDate) setDob(selectedDate);
//             }}
//           />
//         )}

//         <TouchableOpacity onPress={handleAddCustomer} style={styles.button}>
//           <Text style={styles.buttonText}>Add Customer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Cart items */}
//       <FlatList
//         data={cart}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingBottom: 200 }}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.itemName}>{item.name}</Text>
//             <View style={styles.qtyContainer}>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
//                 <Feather name="minus" size={18} color="#065f46" />
//               </TouchableOpacity>
//               <Text style={styles.qtyText}>{item.quantity}</Text>
//               <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
//                 <Feather name="plus" size={18} color="#065f46" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
//           </View>
//         )}
//       />

//       {/* Footer */}
//       <View style={styles.footer}>
//         <View style={styles.summaryRow}>
//           <Text style={styles.summaryText}>Subtotal:</Text>
//           <Text style={styles.summaryValue}>₹{subtotal}</Text>
//         </View>

//         <View style={styles.summaryRow}>
//           <Text style={styles.totalDueText}>TOTAL DUE:</Text>
//           <Text style={styles.totalDueValue}>₹{subtotal}</Text>
//         </View>

//         {/* ✅ Instant Print Button */}
//         {cart.length > 0 && (
//           <TouchableOpacity onPress={handlePrintAndSave} style={styles.processBtn}>
//             <Text style={styles.processText}>🧾 PRINT BILL</Text>
//           </TouchableOpacity>
//         )}

//         <TouchableOpacity onPress={clearCart}>
//           <Text style={styles.clearCart}>Clear Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// // --- Styles ---
// const styles = StyleSheet.create({
//   header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", elevation: 3 },
//   headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111" },
//   closeButton: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
//   closeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
//   pickerContainer: { margin: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 2 },
//   label: { fontSize: 16, fontWeight: "bold", color: "#111" },
//   expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   companyBox: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 10, paddingTop: 10 },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
//   button: { backgroundColor: "#4f46e5", padding: 15, borderRadius: 10, alignItems: "center" },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12 },
//   itemName: { flex: 2, fontSize: 16, color: "#111" },
//   qtyContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
//   qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginHorizontal: 6 },
//   qtyText: { fontSize: 16, fontWeight: "bold" },
//   itemTotal: { flex: 1, textAlign: "right", fontSize: 16, fontWeight: "bold", color: "#ef4444" },
//   footer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
//   summaryText: { fontSize: 16 },
//   summaryValue: { fontSize: 16, fontWeight: "bold" },
//   totalDueText: { fontSize: 18, fontWeight: "bold", color: "#111" },
//   totalDueValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
//   processBtn: { backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 16, marginTop: 15, alignItems: "center" },
//   processText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
//   clearCart: { color: "#888", textAlign: "center", marginTop: 12, fontSize: 14 },
//   selectBox: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
//   dropdown: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, maxHeight: 200 },
//   dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
// });














"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SimpleBill } from "../../utils/SimpleBill";
import CompanyInfoScreen from "./info";

type CartItem = {
  id: string;
  name: string;
  price?: number;
  quantity: number;
};

type Party = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  dob?: string;
};

export default function BillPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  const [parties, setParties] = useState<Party[]>([]);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  useEffect(() => {
    if (params.cart) {
      try {
        const parsed = JSON.parse(params.cart as string);
        setCart(Object.values(parsed));
      } catch (err) {
        console.error("Failed to parse cart params:", err);
      }
    }
  }, [params.cart]);

  const fetchParties = async () => {
    try {
      const token = isLoaded && isSignedIn ? await getToken() : null;
      const res = await fetch("https://billing-backend-sable.vercel.app/api/parties", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) setParties(data);
    } catch (err) {
      console.error("Fetch parties error:", err);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [isLoaded, isSignedIn]);

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const increaseQty = (id: string) =>
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );

  const decreaseQty = (id: string) =>
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

  const clearCart = () => setCart([]);

  const handlePrintAndSave = async () => {
    if (!cart.length) return ToastAndroid.show("🛒 Cart empty!", ToastAndroid.SHORT);
    if (!selectedParty && (!customerName || !phone)) {
      Alert.alert("Missing Info", "Please select or add a customer first.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated!");
      const userClerkId = user?.id || "";

      const result = await SimpleBill(cart, token, userClerkId, {
        customerName: selectedParty?.name || customerName,
        phone: selectedParty?.phone || phone,
        paymentMode: "CASH",
        notes: "Printed via Bluetooth",
      });

      if (result?.status === "success") {
        ToastAndroid.show("✅ Bill Printed & Saved!", ToastAndroid.SHORT);
        clearCart();
        setSelectedParty(null);
      } else {
        ToastAndroid.show("⚠️ Failed to print or save bill", ToastAndroid.SHORT);
      }
    } catch (err: any) {
      console.error("Print error:", err);
      ToastAndroid.show("❌ Printing failed", ToastAndroid.SHORT);
    }
  };

  const handleAddCustomer = async () => {
    if (!customerName || !phone) {
      Alert.alert("Missing Fields", "Please enter name and phone number.");
      return;
    }

    try {
      const token = isLoaded && isSignedIn ? await getToken() : null;
      const response = await fetch(
        "https://billing-backend-sable.vercel.app/api/parties",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: customerName,
            phone,
            address: billingAddress,
            dob: dob ? dob.toISOString() : null,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert("✅ Success", "Customer added successfully!");
        setSelectedParty(data);
        fetchParties();
        setCustomerName("");
        setPhone("");
        setBillingAddress("");
        setDob(null);
      } else {
        Alert.alert("Error", data.error || "Failed to add customer.");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f9fafb" }}>
      {/* Header Gradient */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>🧾 Billing Dashboard</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Company Info */}
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => setShowCompanyInfo((prev) => !prev)}
          style={styles.expandHeader}
        >
          <Text style={styles.label}>🏢 Company Information</Text>
          <Feather
            name={showCompanyInfo ? "chevron-up" : "chevron-down"}
            size={20}
            color="#4f46e5"
          />
        </TouchableOpacity>
        {showCompanyInfo && <CompanyInfoScreen />}
      </View>

      {/* Customer Section */}
      <View style={styles.card}>
        <Text style={styles.label}>👤 Customer Details</Text>
        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => setShowPartyDropdown((prev) => !prev)}
        >
          <Text>{selectedParty ? selectedParty.name : "Select Existing Customer"}</Text>
          <Feather
            name={showPartyDropdown ? "chevron-up" : "chevron-down"}
            size={18}
            color="#4f46e5"
          />
        </TouchableOpacity>

        {showPartyDropdown && (
          <View style={styles.dropdown}>
            {parties.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedParty(p);
                  setShowPartyDropdown(false);
                  setCustomerName(p.name);
                  setPhone(p.phone);
                  setBillingAddress(p.address || "");
                  if (p.dob) setDob(new Date(p.dob));
                }}
              >
                <Text>{p.name} ({p.phone})</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer Name"
            style={styles.input}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            value={billingAddress}
            onChangeText={setBillingAddress}
            placeholder="Billing Address"
            multiline
            numberOfLines={3}
            style={[styles.input, { height: 80 }]}
          />
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[styles.input, { justifyContent: "center" }]}
          >
            <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === "ios");
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}
          <TouchableOpacity onPress={handleAddCustomer} style={styles.addBtn}>
            <Text style={styles.addBtnText}>➕ Add Customer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart Items */}
      <Text style={styles.sectionTitle}>🛍️ Cart Summary</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => decreaseQty(item.id)}>
                <Feather name="minus-circle" size={22} color="#4ade80" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => increaseQty(item.id)}>
                <Feather name="plus-circle" size={22} color="#4ade80" />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>₹{(item.price || 0) * item.quantity}</Text>
          </View>
        )}
      />

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalValue}>₹{subtotal}</Text>
        </View>

        {cart.length > 0 && (
          <TouchableOpacity onPress={handlePrintAndSave} style={styles.printBtn}>
            <Text style={styles.printBtnText}>🧾 PRINT & SAVE BILL</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearCart}>🗑️ Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: 8,
  },
  card: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 16, fontWeight: "600", color: "#111" },
  expandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#fafafa",
  },
  addBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  dropdown: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, maxHeight: 200 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionTitle: {
    marginLeft: 20,
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  itemName: { fontSize: 15, fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qtyText: { fontSize: 16, fontWeight: "bold" },
  itemTotal: { fontSize: 16, fontWeight: "bold", color: "#ef4444" },
  footer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  summaryText: { fontSize: 16, color: "#374151" },
  summaryValue: { fontSize: 16, fontWeight: "600" },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: "#111" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#ef4444" },
  printBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  printBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  clearCart: { textAlign: "center", color: "#9ca3af", marginTop: 10 },
});
