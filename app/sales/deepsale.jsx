// import { useEffect, useState } from "react";
// import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // --- Helper function to format date & time ---
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };
//   const optionsDate = { day: "numeric", month: "short", year: "numeric" };
//   const time = date.toLocaleTimeString("en-IN", optionsTime);
//   const onlyDate = date.toLocaleDateString("en-IN", optionsDate);
//   return `${time} • ${onlyDate}`;
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn, user } = useUser();
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     try {
//       const token = await getToken();

//       // Pass token to backend for authentication
//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`, 
//           },
//         }
//       );

//       const text = await res.text();
//       try {
//         const data = JSON.parse(text);

//         // Filter bills to only those created by current user
//         const myBills = (data.bills || []).filter(
//           (bill) => bill.userId === user.id
//         );

//         setBills(myBills);
//       } catch (err) {
//         console.log("JSON Parse Error → Backend Response:", text);
//       }
//     } catch (err) {
//       console.log("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   if (loading) {
//     return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1, justifyContent: "center" }} />;
//   }

//   if (!bills.length) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>No bills found for your account.</Text>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={bills}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <View style={styles.card}>
//           <Text style={styles.billId}>Bill ID: {item.id}</Text>
//           <Text style={styles.customer}>
//             Customer: {item.customer?.name || "N/A"}
//           </Text>
//           <Text style={styles.total}>Total: ₹{item.total}</Text>
//           <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>
//         </View>
//       )}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     padding: 12,
//     margin: 8,
//     borderRadius: 8,
//     elevation: 2,
//   },
//   billId: {
//     fontWeight: "700",
//     fontSize: 16,
//     marginBottom: 4,
//   },
//   customer: {
//     fontSize: 14,
//     marginBottom: 2,
//   },
//   total: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   date: {
//     fontSize: 12,
//     color: "#666",
//   },
// });






// import { useEffect, useState } from "react";
// import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // --- Helper function to format date & time ---
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };
//   const optionsDate = { day: "numeric", month: "short", year: "numeric" };
//   const time = date.toLocaleTimeString("en-IN", optionsTime);
//   const onlyDate = date.toLocaleDateString("en-IN", optionsDate);
//   return `${time} • ${onlyDate}`;
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const text = await res.text();
//       try {
//         const data = JSON.parse(text);

//         // ⭐ FIXED — DO NOT FILTER HERE
//         setBills(data.bills || []);

//       } catch (err) {
//         console.log("JSON Parse Error → Backend Response:", text);
//       }
//     } catch (err) {
//       console.log("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   if (loading) {
//     return (
//       <ActivityIndicator
//         size="large"
//         color="#007AFF"
//         style={{ flex: 1, justifyContent: "center" }}
//       />
//     );
//   }

//   if (!bills.length) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>No bills found for your account.</Text>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={bills}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <View style={styles.card}>
//           <Text style={styles.billId}>Bill ID: {item.id}</Text>
//           <Text style={styles.customer}>
//             Customer: {item.customer?.name || "N/A"}
//           </Text>
//           <Text style={styles.total}>Total: ₹{item.total}</Text>
//           <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>
//         </View>
//       )}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     padding: 12,
//     margin: 8,
//     borderRadius: 8,
//     elevation: 2,
//   },
//   billId: {
//     fontWeight: "700",
//     fontSize: 16,
//     marginBottom: 4,
//   },
//   customer: {
//     fontSize: 14,
//     marginBottom: 2,
//   },
//   total: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   date: {
//     fontSize: 12,
//     color: "#666",
//   },
// });







// import { useEffect, useState } from "react";
// import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // --- Helper function to format date & time ---
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };
//   const optionsDate = { day: "numeric", month: "short", year: "numeric" };
//   const time = date.toLocaleTimeString("en-IN", optionsTime);
//   const onlyDate = date.toLocaleDateString("en-IN", optionsDate);
//   return `${time} • ${onlyDate}`;
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const text = await res.text();
//       try {
//         const data = JSON.parse(text);
//         setBills(data.bills || []);
//       } catch (err) {
//         console.log("JSON Parse Error → Backend Response:", text);
//       }
//     } catch (err) {
//       console.log("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   if (loading) {
//     return (
//       <ActivityIndicator
//         size="large"
//         color="#007AFF"
//         style={{ flex: 1, justifyContent: "center" }}
//       />
//     );
//   }

//   if (!bills.length) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>No bills found for your account.</Text>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={bills}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <View style={styles.card}>
//           <Text style={styles.billId}>Bill ID: {item.id}</Text>

//           <Text style={styles.customer}>
//             Customer: {item.customer?.name || "N/A"}
//           </Text>

//           <Text style={styles.total}>Total: ₹{item.total}</Text>

//           <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//           {/* --- Bill Items Section --- */}
//           <View style={styles.itemsContainer}>
//             {item.products?.map((p, index) => (
//               <View key={index} style={styles.itemRow}>
//                 <Text style={styles.itemName}>{p.product?.name || "Item"}</Text>
//                 <Text style={styles.itemQty}>x{p.quantity}</Text>
//                 <Text style={styles.itemRate}>₹{p.rate}</Text>
//                 <Text style={styles.itemTotal}>₹{p.total}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//       )}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     padding: 12,
//     margin: 8,
//     borderRadius: 8,
//     elevation: 2,
//   },
//   billId: {
//     fontWeight: "700",
//     fontSize: 16,
//     marginBottom: 4,
//   },
//   customer: {
//     fontSize: 14,
//     marginBottom: 2,
//   },
//   total: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   date: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 6,
//   },

//   // Item section
//   itemsContainer: {
//     marginTop: 10,
//     backgroundColor: "#f8f8f8",
//     padding: 10,
//     borderRadius: 6,
//   },
//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 6,
//   },
//   itemName: {
//     flex: 2,
//     fontWeight: "600",
//   },
//   itemQty: {
//     flex: 1,
//     textAlign: "center",
//     color: "#444",
//   },
//   itemRate: {
//     flex: 1,
//     textAlign: "right",
//     color: "#444",
//   },
//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontWeight: "700",
//   },
// });









// import { useEffect, useState } from "react";
// import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // --- Helper function to format date & time ---
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };
//   const optionsDate = { day: "numeric", month: "short", year: "numeric" };
//   const time = date.toLocaleTimeString("en-IN", optionsTime);
//   const onlyDate = date.toLocaleDateString("en-IN", optionsDate);
//   return `${time} • ${onlyDate}`;
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const text = await res.text();
//       try {
//         const data = JSON.parse(text);
//         setBills(data.bills || []);
//       } catch (err) {
//         console.log("JSON Parse Error → Backend Response:", text);
//       }
//     } catch (err) {
//       console.log("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   if (loading) {
//     return (
//       <ActivityIndicator
//         size="large"
//         color="#007AFF"
//         style={{ flex: 1, justifyContent: "center" }}
//       />
//     );
//   }

//   if (!bills.length) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>No bills found for your account.</Text>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={bills}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <View style={styles.card}>
//           <Text style={styles.billId}>Bill ID: {item.id}</Text>

//           <Text style={styles.customer}>
//             Customer: {item.customer?.name || "N/A"}
//           </Text>

//           <Text style={styles.total}>Total: ₹{item.total}</Text>

//           <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//           {/* --- Bill Items Section --- */}
//           <View style={styles.itemsContainer}>
//             {item.products?.map((p, index) => (
//               <View key={index} style={styles.itemRow}>
//                 <Text style={styles.itemName}>
//                   {p.product?.name || p.productName || "Unnamed Item"}
//                 </Text>
//                 <Text style={styles.itemQty}>x{p.quantity}</Text>
//                 <Text style={styles.itemRate}>₹{p.rate}</Text>
//                 <Text style={styles.itemTotal}>₹{p.total}</Text>
//               </View>
//             ))}
//           </View>

//         </View>
//       )}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     padding: 12,
//     margin: 8,
//     borderRadius: 8,
//     elevation: 2,
//   },
//   billId: {
//     fontWeight: "700",
//     fontSize: 16,
//     marginBottom: 4,
//   },
//   customer: {
//     fontSize: 14,
//     marginBottom: 2,
//   },
//   total: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   date: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 6,
//   },

//   // Item section
//   itemsContainer: {
//     marginTop: 10,
//     backgroundColor: "#f8f8f8",
//     padding: 10,
//     borderRadius: 6,
//   },
//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 6,
//   },
//   itemName: {
//     flex: 2,
//     fontWeight: "600",
//   },
//   itemQty: {
//     flex: 1,
//     textAlign: "center",
//     color: "#444",
//   },
//   itemRate: {
//     flex: 1,
//     textAlign: "right",
//     color: "#444",
//   },
//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontWeight: "700",
//   },
// });
















// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   RefreshControl,
//   Animated,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // --- Helper function to format date & time ---
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };
//   const optionsDate = { day: "numeric", month: "short", year: "numeric" };
//   const time = date.toLocaleTimeString("en-IN", optionsTime);
//   const onlyDate = date.toLocaleDateString("en-IN", optionsDate);
//   return `${time} • ${onlyDate}`;
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // Animation
//   const fadeAnim = new Animated.Value(0);

//   const startFadeIn = () => {
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 500,
//       useNativeDriver: true,
//     }).start();
//   };

//   const fetchBills = async (isRefresh = false) => {
//     if (!isLoaded || !isSignedIn) return;

//     if (!isRefresh) setLoading(true);

//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const text = await res.text();

//       try {
//         const data = JSON.parse(text);
//         setBills(data.bills || []);
//       } catch (err) {
//         console.log("JSON Parse Error → Backend Response:", text);
//       }
//     } catch (err) {
//       console.log("Error:", err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//       startFadeIn();
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // Pull to refresh
//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchBills(true);
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0066FF" />
//         <Text style={styles.loadingText}>Fetching bills...</Text>
//       </View>
//     );
//   }

//   if (!bills.length) {
//     return (
//       <View style={styles.noBillContainer}>
//         <Text style={styles.noBillText}>No bills found 😕</Text>
//         <Text style={{ color: "#666" }}>Create your first bill!</Text>
//       </View>
//     );
//   }

//   return (
//     <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
//       <FlatList
//         data={bills}
//         keyExtractor={(item) => item.id}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0066FF"]} />
//         }
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>#{item.id}</Text>

//             <Text style={styles.customer}>
//               👤 {item.customer?.name || "Unknown Customer"}
//             </Text>

//             <Text style={styles.total}>₹ {item.total}</Text>

//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             {/* Bill Items */}
//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, index) => (
//                 <View key={index} style={styles.itemRow}>
//                   <Text style={styles.itemName}>
//                     {p.product?.name || p.productName || "Unnamed Item"}
//                   </Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />
//     </Animated.View>
//   );
// }

// // ------------------ STYLES -----------------------

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f2f6ff",
//   },
//   loadingText: {
//     marginTop: 10,
//     color: "#0066FF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   noBillContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   noBillText: {
//     fontSize: 18,
//     fontWeight: "700",
//     marginBottom: 5,
//   },

//   card: {
//     backgroundColor: "white",
//     padding: 15,
//     margin: 10,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.15,
//     shadowRadius: 6,
//     elevation: 5,
//   },

//   billId: {
//     fontWeight: "700",
//     fontSize: 18,
//     color: "#333",
//   },

//   customer: {
//     fontSize: 15,
//     marginVertical: 3,
//     color: "#555",
//   },

//   total: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#0066FF",
//   },

//   date: {
//     fontSize: 13,
//     color: "#777",
//     marginTop: 4,
//   },

//   itemsContainer: {
//     marginTop: 12,
//     backgroundColor: "#f7f9fc",
//     padding: 10,
//     borderRadius: 8,
//   },

//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 6,
//   },

//   itemName: {
//     flex: 2,
//     fontWeight: "600",
//     color: "#333",
//   },

//   itemQty: {
//     flex: 1,
//     textAlign: "center",
//     color: "#666",
//   },

//   itemRate: {
//     flex: 1,
//     textAlign: "right",
//     color: "#666",
//   },

//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontWeight: "700",
//     color: "#000",
//   },
// });












// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();
//       if (!token) {
//         setError("Login token missing. Please re-login.");
//         return;
//       }

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       console.log("STATUS CODE →", res.status);

//       const raw = await res.text();
//       console.log("BACKEND RAW →", raw);

//       let data;
//       try {
//         data = JSON.parse(raw);
//       } catch (err) {
//         setError("Backend returned invalid JSON.");
//         console.log("JSON ERROR →", err);
//         return;
//       }

//       if (!data || !data.bills) {
//         setError("No bills found in backend response.");
//         setBills([]);
//         return;
//       }

//       setBills(data.bills);
//     } catch (err) {
//       console.log("FETCH ERROR →", err);
//       setError("Something went wrong while fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // ---- Loading Screen ----
//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10, fontSize: 15 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   // ---- Error Screen ----
//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: "red", fontSize: 16, marginBottom: 10 }}>
//           ⚠️ {error}
//         </Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={fetchBills}>
//           <Text style={styles.retryText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // ---- Empty List ----
//   if (!bills.length) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ fontSize: 16 }}>No bills found.</Text>
//       </View>
//     );
//   }

//   // ---- BILL LIST ----
//   return (
//     <FlatList
//       data={bills}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <View style={styles.card}>
//           <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//           <Text style={styles.customer}>
//             👤 Customer: {item.customer?.name || "N/A"}
//           </Text>

//           <Text style={styles.total}>💰 Total: ₹{item.total}</Text>

//           <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//           {/* Bill items */}
//           <View style={styles.itemsContainer}>
//             {item.products?.map((p, i) => (
//               <View key={i} style={styles.itemRow}>
//                 <Text style={styles.itemName}>
//                   {p.product?.name || p.productName || "Unnamed Item"}
//                 </Text>
//                 <Text style={styles.itemQty}>x{p.quantity}</Text>
//                 <Text style={styles.itemRate}>₹{p.rate}</Text>
//                 <Text style={styles.itemTotal}>₹{p.total}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//       )}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   retryBtn: {
//     backgroundColor: "#007AFF",
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   retryText: {
//     color: "white",
//     fontSize: 16,
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: {
//     fontSize: 16,
//     fontWeight: "700",
//     marginBottom: 4,
//   },

//   customer: {
//     fontSize: 14,
//     marginBottom: 4,
//   },

//   total: {
//     fontSize: 15,
//     fontWeight: "600",
//     marginBottom: 2,
//   },

//   date: {
//     color: "#555",
//     fontSize: 12,
//     marginBottom: 10,
//   },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 6,
//   },

//   itemName: {
//     flex: 2,
//     fontWeight: "600",
//   },

//   itemQty: {
//     flex: 1,
//     textAlign: "center",
//     color: "#444",
//   },

//   itemRate: {
//     flex: 1,
//     textAlign: "right",
//   },

//   itemTotal: {
//     flex: 1,
//     textAlign: "right",
//     fontWeight: "700",
//   },
// });





// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// // Date Compare (for filters)
// const isToday = (d) => {
//   const today = new Date();
//   return (
//     d.getDate() === today.getDate() &&
//     d.getMonth() === today.getMonth() &&
//     d.getFullYear() === today.getFullYear()
//   );
// };

// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return (
//     d.getDate() === y.getDate() &&
//     d.getMonth() === y.getMonth() &&
//     d.getFullYear() === y.getFullYear()
//   );
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");
//   const [sortFilter, setSortFilter] = useState("none");

//   // Fetch Bills
//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();
//       if (!token) {
//         setError("Login token missing. Please re-login.");
//         return;
//       }

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const raw = await res.text();
//       let data = JSON.parse(raw);

//       setBills(data.bills);
//       setFilteredBills(data.bills);
//     } catch (err) {
//       setError("Error fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // FILTER LOGIC
//   useEffect(() => {
//     let temp = [...bills];

//     // 🔍 SEARCH FILTER
//     if (search.trim() !== "") {
//       temp = temp.filter((b) => {
//         const itemMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           itemMatch
//         );
//       });
//     }

//     // 📅 DATE FILTER
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);
//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }
//       return true;
//     });

//     // 💰 SORT FILTER
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//   }, [search, dateFilter, sortFilter, bills]);

//   // Screens
//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: "red" }}>{error}</Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={fetchBills}>
//           <Text style={styles.retryText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* 🔍 SEARCH BOX */}
//       <TextInput
//         placeholder="Search Bill ID / Customer / Item"
//         value={search}
//         onChangeText={setSearch}
//         style={styles.searchBox}
//       />

//       {/* FILTER BUTTONS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[
//             styles.filterBtn,
//             dateFilter === "today" && styles.filterActive,
//           ]}
//           onPress={() => setDateFilter("today")}
//         >
//           <Text style={styles.filterText}>Today</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.filterBtn,
//             dateFilter === "yesterday" && styles.filterActive,
//           ]}
//           onPress={() => setDateFilter("yesterday")}
//         >
//           <Text style={styles.filterText}>Yesterday</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "7days" && styles.filterActive]}
//           onPress={() => setDateFilter("7days")}
//         >
//           <Text style={styles.filterText}>Last 7 Days</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "all" && styles.filterActive]}
//           onPress={() => setDateFilter("all")}
//         >
//           <Text style={styles.filterText}>All</Text>
//         </TouchableOpacity>
//       </View>

//       {/* SORT FILTER */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "low" && styles.filterActive]}
//           onPress={() => setSortFilter("low")}
//         >
//           <Text style={styles.filterText}>₹ Low → High</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "high" && styles.filterActive]}
//           onPress={() => setSortFilter("high")}
//         >
//           <Text style={styles.filterText}>₹ High → Low</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "none" && styles.filterActive]}
//           onPress={() => setSortFilter("none")}
//         >
//           <Text style={styles.filterText}>Reset</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.refreshBtn} onPress={fetchBills}>
//           <Text style={{ color: "white", fontWeight: "bold" }}>Reload</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BILL LIST */}
//       <FlatList
//         data={filteredBills}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 Customer: {item.customer?.name || "N/A"}
//             </Text>

//             <Text style={styles.total}>💰 Total: ₹{item.total}</Text>

//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>
//                     {p.product?.name || "Unnamed Item"}
//                   </Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// /* STYLES */
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   searchBox: {
//     padding: 10,
//     margin: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f1f1",
//     fontSize: 16,
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 10,
//     marginBottom: 8,
//   },

//   filterBtn: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#e9e9e9",
//     borderRadius: 6,
//   },

//   filterActive: {
//     backgroundColor: "#007AFF",
//   },

//   filterText: {
//     color: "black",
//     fontSize: 13,
//   },

//   refreshBtn: {
//     backgroundColor: "#28a745",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },

//   retryBtn: {
//     backgroundColor: "#007AFF",
//     padding: 10,
//     borderRadius: 6,
//   },
//   retryText: { color: "white" },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: { fontSize: 16, fontWeight: "700" },
//   customer: { fontSize: 14 },
//   total: { fontSize: 15, fontWeight: "600" },
//   date: { fontSize: 12, color: "#444", marginBottom: 10 },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: { flexDirection: "row", justifyContent: "space-between" },
//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },
// });






// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// // Compare
// const isSameDay = (d1, d2) =>
//   d1.getDate() === d2.getDate() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getFullYear() === d2.getFullYear();

// const isToday = (d) => isSameDay(d, new Date());

// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return isSameDay(d, y);
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");

//   // ⭐ NEW – Specific Day Picker
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const [sortFilter, setSortFilter] = useState("none");

//   // Fetch bills
//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();
//       if (!token) {
//         setError("Login token missing. Please re-login.");
//         return;
//       }

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const raw = await res.text();
//       let data = JSON.parse(raw);

//       setBills(data.bills);
//       setFilteredBills(data.bills);
//     } catch (err) {
//       setError("Error fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // APPLY FILTERS
//   useEffect(() => {
//     let temp = [...bills];

//     // Search
//     if (search.trim() !== "") {
//       temp = temp.filter((b) => {
//         const itemMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           itemMatch
//         );
//       });
//     }

//     // ⭐ DATE FILTERS
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);

//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }

//       // ⭐ NEW — Filter by Selected Day
//       if (dateFilter === "specific" && selectedDay) {
//         return isSameDay(d, selectedDay);
//       }

//       return true;
//     });

//     // Sort
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//   }, [search, dateFilter, sortFilter, bills, selectedDay]);

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: "red" }}>{error}</Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={fetchBills}>
//           <Text style={styles.retryText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Search */}
//       <TextInput
//         placeholder="Search Bill ID / Customer / Item"
//         value={search}
//         onChangeText={setSearch}
//         style={styles.searchBox}
//       />

//       {/* DATE FILTERS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "today" && styles.filterActive]}
//           onPress={() => setDateFilter("today")}
//         >
//           <Text style={styles.filterText}>Today</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "yesterday" && styles.filterActive]}
//           onPress={() => setDateFilter("yesterday")}
//         >
//           <Text style={styles.filterText}>Yesterday</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "7days" && styles.filterActive]}
//           onPress={() => setDateFilter("7days")}
//         >
//           <Text style={styles.filterText}>7 Days</Text>
//         </TouchableOpacity>

//         {/* ⭐ NEW — PICK DAY */}
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "specific" && styles.filterActive]}
//           onPress={() => {
//             setShowDatePicker(true);
//             setDateFilter("specific");
//           }}
//         >
//           <Text style={styles.filterText}>Select Day</Text>
//         </TouchableOpacity>
//       </View>

//       {/* SHOW DATE PICKER */}
//       {showDatePicker && (
//         <DateTimePicker
//           mode="date"
//           value={selectedDay || new Date()}
//           onChange={(event, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDay(date);
//           }}
//         />
//       )}

//       {/* SORT */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "low" && styles.filterActive]}
//           onPress={() => setSortFilter("low")}
//         >
//           <Text style={styles.filterText}>₹ Low → High</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "high" && styles.filterActive]}
//           onPress={() => setSortFilter("high")}
//         >
//           <Text style={styles.filterText}>₹ High → Low</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "none" && styles.filterActive]}
//           onPress={() => setSortFilter("none")}
//         >
//           <Text style={styles.filterText}>Reset</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.refreshBtn} onPress={fetchBills}>
//           <Text style={{ color: "white", fontWeight: "bold" }}>Reload</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BILL LIST */}
//       <FlatList
//         data={filteredBills}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 Customer: {item.customer?.name || "N/A"}
//             </Text>

//             <Text style={styles.total}>💰 Total: ₹{item.total}</Text>

//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>
//                     {p.product?.name || "Unnamed Item"}
//                   </Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// /* STYLES */
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   searchBox: {
//     padding: 10,
//     margin: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f1f1",
//     fontSize: 16,
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 10,
//     marginBottom: 8,
//   },

//   filterBtn: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#e9e9e9",
//     borderRadius: 6,
//   },

//   filterActive: {
//     backgroundColor: "#007AFF",
//   },

//   filterText: {
//     color: "black",
//     fontSize: 13,
//   },

//   refreshBtn: {
//     backgroundColor: "#28a745",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },

//   retryBtn: {
//     backgroundColor: "#007AFF",
//     padding: 10,
//     borderRadius: 6,
//   },

//   retryText: {
//     color: "white",
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: { fontSize: 16, fontWeight: "700" },
//   customer: { fontSize: 14 },
//   total: { fontSize: 15, fontWeight: "600" },
//   date: { fontSize: 12, color: "#444", marginBottom: 10 },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: { flexDirection: "row", justifyContent: "space-between" },
//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },
// });







// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// // Compare
// const isSameDay = (d1, d2) =>
//   d1.getDate() === d2.getDate() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getFullYear() === d2.getFullYear();

// const isToday = (d) => isSameDay(d, new Date());

// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return isSameDay(d, y);
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");

//   // ⭐ NEW – Specific Day Picker
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const [sortFilter, setSortFilter] = useState("none");

//   // Fetch bills
//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();
//       if (!token) {
//         setError("Login token missing. Please re-login.");
//         return;
//       }

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const raw = await res.text();
//       let data = JSON.parse(raw);

//       setBills(data.bills);
//       setFilteredBills(data.bills);
//     } catch (err) {
//       setError("Error fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // APPLY FILTERS
//   useEffect(() => {
//     let temp = [...bills];

//     // Search
//     if (search.trim() !== "") {
//       temp = temp.filter((b) => {
//         const itemMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           itemMatch
//         );
//       });
//     }

//     // ⭐ DATE FILTERS
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);

//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }

//       // ⭐ NEW — Filter by Selected Day
//       if (dateFilter === "specific" && selectedDay) {
//         return isSameDay(d, selectedDay);
//       }

//       return true;
//     });

//     // Sort
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//   }, [search, dateFilter, sortFilter, bills, selectedDay]);

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: "red" }}>{error}</Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={fetchBills}>
//           <Text style={styles.retryText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Search */}
//       <TextInput
//         placeholder="Search Bill ID / Customer / Item"
//         value={search}
//         onChangeText={setSearch}
//         style={styles.searchBox}
//       />

//       {/* DATE FILTERS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "today" && styles.filterActive]}
//           onPress={() => setDateFilter("today")}
//         >
//           <Text style={styles.filterText}>Today</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "yesterday" && styles.filterActive]}
//           onPress={() => setDateFilter("yesterday")}
//         >
//           <Text style={styles.filterText}>Yesterday</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "7days" && styles.filterActive]}
//           onPress={() => setDateFilter("7days")}
//         >
//           <Text style={styles.filterText}>7 Days</Text>
//         </TouchableOpacity>

//         {/* ⭐ NEW — PICK DAY */}
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "specific" && styles.filterActive]}
//           onPress={() => {
//             setShowDatePicker(true);
//             setDateFilter("specific");
//           }}
//         >
//           <Text style={styles.filterText}>Select Day</Text>
//         </TouchableOpacity>
//       </View>

//       {/* SHOW DATE PICKER */}
//       {showDatePicker && (
//         <DateTimePicker
//           mode="date"
//           value={selectedDay || new Date()}
//           onChange={(event, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDay(date);
//           }}
//         />
//       )}

//       {/* SORT */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "low" && styles.filterActive]}
//           onPress={() => setSortFilter("low")}
//         >
//           <Text style={styles.filterText}>₹ Low → High</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "high" && styles.filterActive]}
//           onPress={() => setSortFilter("high")}
//         >
//           <Text style={styles.filterText}>₹ High → Low</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "none" && styles.filterActive]}
//           onPress={() => setSortFilter("none")}
//         >
//           <Text style={styles.filterText}>Reset</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.refreshBtn} onPress={fetchBills}>
//           <Text style={{ color: "white", fontWeight: "bold" }}>Reload</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BILL LIST */}
//       <FlatList
//         data={filteredBills}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 Customer: {item.customer?.name || "N/A"}
//             </Text>

//             <Text style={styles.total}>💰 Total: ₹{item.total}</Text>

//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>
//                     {p.product?.name || "Unnamed Item"}
//                   </Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// /* STYLES */
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   searchBox: {
//     padding: 10,
//     margin: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f1f1",
//     fontSize: 16,
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 10,
//     marginBottom: 8,
//   },

//   filterBtn: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#e9e9e9",
//     borderRadius: 6,
//   },

//   filterActive: {
//     backgroundColor: "#007AFF",
//   },

//   filterText: {
//     color: "black",
//     fontSize: 13,
//   },

//   refreshBtn: {
//     backgroundColor: "#28a745",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },

//   retryBtn: {
//     backgroundColor: "#007AFF",
//     padding: 10,
//     borderRadius: 6,
//   },

//   retryText: {
//     color: "white",
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: { fontSize: 16, fontWeight: "700" },
//   customer: { fontSize: 14 },
//   total: { fontSize: 15, fontWeight: "600" },
//   date: { fontSize: 12, color: "#444", marginBottom: 10 },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: { flexDirection: "row", justifyContent: "space-between" },
//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },
// });













// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// // Compare (Same day)
// const isSameDay = (d1, d2) =>
//   d1.getDate() === d2.getDate() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getFullYear() === d2.getFullYear();

// const isToday = (d) => isSameDay(d, new Date());

// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return isSameDay(d, y);
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");

//   // Specific Day Filter
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const [sortFilter, setSortFilter] = useState("none");

//   // ⭐ NEW — DATE RANGE FILTER
//   const [fromDate, setFromDate] = useState(null);
//   const [toDate, setToDate] = useState(null);
//   const [showFromPicker, setShowFromPicker] = useState(false);
//   const [showToPicker, setShowToPicker] = useState(false);

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const raw = await res.text();
//       const data = JSON.parse(raw);

//       setBills(data.bills);
//       setFilteredBills(data.bills);
//     } catch (err) {
//       setError("Error fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // APPLY FILTERS
//   useEffect(() => {
//     let temp = [...bills];

//     // 🔍 Search Filter
//     if (search.trim() !== "") {
//       temp = temp.filter((b) => {
//         const itemMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           itemMatch
//         );
//       });
//     }

//     // 📅 DATE FILTERS
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);

//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }

//       // Specific one day
//       if (dateFilter === "specific" && selectedDay) {
//         return isSameDay(d, selectedDay);
//       }

//       return true;
//     });

//     // ⭐ NEW — DATE RANGE FILTER
//     if (fromDate && toDate) {
//       temp = temp.filter((b) => {
//         const d = new Date(b.createdAt);
//         return d >= fromDate && d <= toDate;
//       });
//     }

//     // Sorting
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//   }, [search, dateFilter, sortFilter, bills, selectedDay, fromDate, toDate]);

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: "red" }}>{error}</Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={fetchBills}>
//           <Text style={styles.retryText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Search */}
//       <TextInput
//         placeholder="Search Bill ID / Customer / Item"
//         value={search}
//         onChangeText={setSearch}
//         style={styles.searchBox}
//       />

//       {/* DATE FILTERS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "today" && styles.filterActive]}
//           onPress={() => setDateFilter("today")}
//         >
//           <Text style={styles.filterText}>Today</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "yesterday" && styles.filterActive]}
//           onPress={() => setDateFilter("yesterday")}
//         >
//           <Text style={styles.filterText}>Yesterday</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "7days" && styles.filterActive]}
//           onPress={() => setDateFilter("7days")}
//         >
//           <Text style={styles.filterText}>7 Days</Text>
//         </TouchableOpacity>

//         {/* Specific Day */}
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "specific" && styles.filterActive]}
//           onPress={() => {
//             setShowDatePicker(true);
//             setDateFilter("specific");
//           }}
//         >
//           <Text style={styles.filterText}>Select Day</Text>
//         </TouchableOpacity>
//       </View>

//       {/* SPECIFIC DAY PICKER */}
//       {showDatePicker && (
//         <DateTimePicker
//           mode="date"
//           value={selectedDay || new Date()}
//           onChange={(event, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDay(date);
//           }}
//         />
//       )}

//       {/* ⭐ NEW — DATE RANGE PICKERS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={styles.filterBtn}
//           onPress={() => setShowFromPicker(true)}
//         >
//           <Text style={styles.filterText}>
//             From: {fromDate ? fromDate.toDateString() : "Select"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.filterBtn}
//           onPress={() => setShowToPicker(true)}
//         >
//           <Text style={styles.filterText}>
//             To: {toDate ? toDate.toDateString() : "Select"}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {showFromPicker && (
//         <DateTimePicker
//           mode="date"
//           value={fromDate || new Date()}
//           onChange={(event, date) => {
//             setShowFromPicker(false);
//             if (date) setFromDate(date);
//           }}
//         />
//       )}

//       {showToPicker && (
//         <DateTimePicker
//           mode="date"
//           value={toDate || new Date()}
//           onChange={(event, date) => {
//             setShowToPicker(false);
//             if (date) setToDate(date);
//           }}
//         />
//       )}

//       {/* SORT */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "low" && styles.filterActive]}
//           onPress={() => setSortFilter("low")}
//         >
//           <Text style={styles.filterText}>₹ Low → High</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "high" && styles.filterActive]}
//           onPress={() => setSortFilter("high")}
//         >
//           <Text style={styles.filterText}>₹ High → Low</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "none" && styles.filterActive]}
//           onPress={() => setSortFilter("none")}
//         >
//           <Text style={styles.filterText}>Reset</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.refreshBtn} onPress={fetchBills}>
//           <Text style={{ color: "white", fontWeight: "bold" }}>Reload</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BILL LIST */}
//       <FlatList
//         data={filteredBills}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 Customer: {item.customer?.name || "N/A"}
//             </Text>

//             <Text style={styles.total}>💰 Total: ₹{item.total}</Text>

//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>{p.product?.name || "Item"}</Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// /* STYLES */
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   searchBox: {
//     padding: 10,
//     margin: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f1f1",
//     fontSize: 16,
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 10,
//     marginBottom: 8,
//   },

//   filterBtn: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#e9e9e9",
//     borderRadius: 6,
//   },

//   filterActive: {
//     backgroundColor: "#007AFF",
//   },

//   filterText: {
//     color: "black",
//     fontSize: 13,
//   },

//   refreshBtn: {
//     backgroundColor: "#28a745",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },

//   retryBtn: {
//     backgroundColor: "#007AFF",
//     padding: 10,
//     borderRadius: 6,
//   },

//   retryText: {
//     color: "white",
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: { fontSize: 16, fontWeight: "700" },
//   customer: { fontSize: 14 },
//   total: { fontSize: 15, fontWeight: "600" },
//   date: { fontSize: 12, color: "#444", marginBottom: 10 },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: { flexDirection: "row", justifyContent: "space-between" },
//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },
// });

















// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// const isSameDay = (d1, d2) =>
//   d1.getDate() === d2.getDate() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getFullYear() === d2.getFullYear();

// const isToday = (d) => isSameDay(d, new Date());

// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return isSameDay(d, y);
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const [sortFilter, setSortFilter] = useState("none");

//   // ⭐ DATE RANGE FILTER
//   const [fromDate, setFromDate] = useState(null);
//   const [toDate, setToDate] = useState(null);
//   const [showFromPicker, setShowFromPicker] = useState(false);
//   const [showToPicker, setShowToPicker] = useState(false);

//   // ⭐ PAGINATION
//   const [page, setPage] = useState(1);
//   const pageSize = 10;

//   // ⭐ NEW: RELOAD BUTTON
//   const reloadPage = () => {
//     fetchBills();
//   };

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const raw = await res.text();
//       const data = JSON.parse(raw);

//       setBills(data.bills);
//       setFilteredBills(data.bills);
//       setPage(1);
//     } catch (err) {
//       setError("Error fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // APPLY FILTERS
//   useEffect(() => {
//     let temp = [...bills];

//     // 🔍 Search
//     if (search.trim() !== "") {
//       temp = temp.filter((b) => {
//         const itemMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           itemMatch
//         );
//       });
//     }

//     // 📅 DATE FILTER
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);
//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }
//       if (dateFilter === "specific" && selectedDay) {
//         return isSameDay(d, selectedDay);
//       }
//       return true;
//     });

//     // ⭐ DATE RANGE
//     if (fromDate && toDate) {
//       temp = temp.filter((b) => {
//         const d = new Date(b.createdAt);
//         return d >= fromDate && d <= toDate;
//       });
//     }

//     // Sorting
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//     setPage(1);
//   }, [search, dateFilter, sortFilter, bills, selectedDay, fromDate, toDate]);

//   // PAGINATED DATA
//   const paginatedData = filteredBills.slice(
//     (page - 1) * pageSize,
//     page * pageSize
//   );

//   const clearFilters = () => {
//     setSearch("");
//     setDateFilter("all");
//     setSelectedDay(null);
//     setFromDate(null);
//     setToDate(null);
//     setSortFilter("none");
//     setFilteredBills(bills);
//     setPage(1);
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* 🔄 RELOAD BUTTON */}
//       <TouchableOpacity style={styles.reloadBtn} onPress={reloadPage}>
//         <Text style={{ color: "white", fontWeight: "700" }}>⟳ Reload Bills</Text>
//       </TouchableOpacity>

//       {/* Search */}
//       <TextInput
//         placeholder="Search Bill ID / Customer / Item"
//         value={search}
//         onChangeText={setSearch}
//         style={styles.searchBox}
//       />

//       {/* DATE FILTERS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "today" && styles.filterActive]}
//           onPress={() => setDateFilter("today")}
//         >
//           <Text style={styles.filterText}>Today</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "yesterday" && styles.filterActive]}
//           onPress={() => setDateFilter("yesterday")}
//         >
//           <Text style={styles.filterText}>Yesterday</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "7days" && styles.filterActive]}
//           onPress={() => setDateFilter("7days")}
//         >
//           <Text style={styles.filterText}>7 Days</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "specific" && styles.filterActive]}
//           onPress={() => {
//             setShowDatePicker(true);
//             setDateFilter("specific");
//           }}
//         >
//           <Text style={styles.filterText}>Select Day</Text>
//         </TouchableOpacity>
//       </View>

//       {/* DATE PICKER */}
//       {showDatePicker && (
//         <DateTimePicker
//           mode="date"
//           value={selectedDay || new Date()}
//           onChange={(e, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDay(date);
//           }}
//         />
//       )}

//       {/* DATE RANGE */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFromPicker(true)}>
//           <Text style={styles.filterText}>
//             From: {fromDate ? fromDate.toDateString() : "Select"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.filterBtn} onPress={() => setShowToPicker(true)}>
//           <Text style={styles.filterText}>
//             To: {toDate ? toDate.toDateString() : "Select"}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {showFromPicker && (
//         <DateTimePicker
//           mode="date"
//           value={fromDate || new Date()}
//           onChange={(event, date) => {
//             setShowFromPicker(false);
//             if (date) setFromDate(date);
//           }}
//         />
//       )}

//       {showToPicker && (
//         <DateTimePicker
//           mode="date"
//           value={toDate || new Date()}
//           onChange={(event, date) => {
//             setShowToPicker(false);
//             if (date) setToDate(date);
//           }}
//         />
//       )}

//       {/* SORT + CLEAR */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "low" && styles.filterActive]}
//           onPress={() => setSortFilter("low")}
//         >
//           <Text style={styles.filterText}>₹ Low → High</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "high" && styles.filterActive]}
//           onPress={() => setSortFilter("high")}
//         >
//           <Text style={styles.filterText}>₹ High → Low</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
//           <Text style={{ color: "white" }}>Clear Filters</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BILL LIST */}
//       <FlatList
//         data={paginatedData}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 Customer: {item.customer?.name || "N/A"}
//             </Text>

//             <Text style={styles.total}>💰 Total: ₹{item.total}</Text>
//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>{p.product?.name || "Item"}</Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />

//       {/* PAGINATION */}
//       <View style={styles.paginationRow}>
//         <TouchableOpacity
//           disabled={page === 1}
//           style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
//           onPress={() => setPage(page - 1)}
//         >
//           <Text>Previous</Text>
//         </TouchableOpacity>

//         <Text style={{ fontSize: 16, fontWeight: "600" }}>
//           {page} / {Math.ceil(filteredBills.length / pageSize)}
//         </Text>

//         <TouchableOpacity
//           disabled={page >= Math.ceil(filteredBills.length / pageSize)}
//           style={[
//             styles.pageBtn,
//             page >= Math.ceil(filteredBills.length / pageSize) && { opacity: 0.4 },
//           ]}
//           onPress={() => setPage(page + 1)}
//         >
//           <Text>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// /* STYLES */
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   reloadBtn: {
//     backgroundColor: "#007AFF",
//     margin: 10,
//     padding: 10,
//     borderRadius: 6,
//     alignItems: "center",
//   },

//   searchBox: {
//     padding: 10,
//     margin: 10,
//     borderRadius: 8,
//     backgroundColor: "#f1f1f1",
//     fontSize: 16,
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 10,
//     marginBottom: 8,
//   },

//   filterBtn: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#e9e9e9",
//     borderRadius: 6,
//   },

//   clearBtn: {
//     backgroundColor: "red",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },

//   filterActive: {
//     backgroundColor: "#007AFF",
//   },

//   filterText: {
//     color: "black",
//     fontSize: 13,
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: { fontSize: 16, fontWeight: "700" },
//   customer: { fontSize: 14 },
//   total: { fontSize: 15, fontWeight: "600" },
//   date: { fontSize: 12, color: "#444", marginBottom: 10 },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: { flexDirection: "row", justifyContent: "space-between" },
//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },

//   paginationRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 15,
//   },

//   pageBtn: {
//     backgroundColor: "#ddd",
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 6,
//   },
// });












// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { LinearGradient } from "expo-linear-gradient";   // ⭐ ADDED

// // Format Date
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// const isSameDay = (d1, d2) =>
//   d1.getDate() === d2.getDate() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getFullYear() === d2.getFullYear();

// const isToday = (d) => isSameDay(d, new Date());

// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return isSameDay(d, y);
// };

// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const [sortFilter, setSortFilter] = useState("none");

//   // ⭐ DATE RANGE FILTER
//   const [fromDate, setFromDate] = useState(null);
//   const [toDate, setToDate] = useState(null);
//   const [showFromPicker, setShowFromPicker] = useState(false);
//   const [showToPicker, setShowToPicker] = useState(false);

//   // ⭐ PAGINATION
//   const [page, setPage] = useState(1);
//   const pageSize = 10;

//   // ⭐ NEW: RELOAD BUTTON
//   const reloadPage = () => {
//     fetchBills();
//   };

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     setError("");

//     try {
//       const token = await getToken();

//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const raw = await res.text();
//       const data = JSON.parse(raw);

//       setBills(data.bills);
//       setFilteredBills(data.bills);
//       setPage(1);
//     } catch (err) {
//       setError("Error fetching bills.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // APPLY FILTERS
//   useEffect(() => {
//     let temp = [...bills];

//     // 🔍 Search
//     if (search.trim() !== "") {
//       temp = temp.filter((b) => {
//         const itemMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           itemMatch
//         );
//       });
//     }

//     // 📅 DATE FILTER
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);
//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }
//       if (dateFilter === "specific" && selectedDay) {
//         return isSameDay(d, selectedDay);
//       }
//       return true;
//     });

//     // ⭐ DATE RANGE
//     if (fromDate && toDate) {
//       temp = temp.filter((b) => {
//         const d = new Date(b.createdAt);
//         return d >= fromDate && d <= toDate;
//       });
//     }

//     // Sorting
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//     setPage(1);
//   }, [search, dateFilter, sortFilter, bills, selectedDay, fromDate, toDate]);

//   // PAGINATED DATA
//   const paginatedData = filteredBills.slice(
//     (page - 1) * pageSize,
//     page * pageSize
//   );

//   const clearFilters = () => {
//     setSearch("");
//     setDateFilter("all");
//     setSelectedDay(null);
//     setFromDate(null);
//     setToDate(null);
//     setSortFilter("none");
//     setFilteredBills(bills);
//     setPage(1);
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={{ marginTop: 10 }}>Loading bills…</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* 🔄 RELOAD BUTTON */}
//       <TouchableOpacity style={styles.reloadBtn} onPress={reloadPage}>
//         <Text style={{ color: "white", fontWeight: "700" }}>⟳ Reload Bills</Text>
//       </TouchableOpacity>

//       {/* ⭐ BEAUTIFUL GRADIENT SEARCH BAR */}
//       <LinearGradient
//         colors={["#4facfe", "#8E2DE2"]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//         style={styles.searchContainer}
//       >
//         <Text style={styles.searchIcon}>🔍</Text>
//         <TextInput
//           placeholder="Search Bill ID / Customer / Item"
//           placeholderTextColor="#fff"
//           value={search}
//           onChangeText={setSearch}
//           style={styles.searchInput}
//         />
//       </LinearGradient>

//       {/* DATE FILTERS */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "today" && styles.filterActive]}
//           onPress={() => setDateFilter("today")}
//         >
//           <Text style={styles.filterText}>Today</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "yesterday" && styles.filterActive]}
//           onPress={() => setDateFilter("yesterday")}
//         >
//           <Text style={styles.filterText}>Yesterday</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "7days" && styles.filterActive]}
//           onPress={() => setDateFilter("7days")}
//         >
//           <Text style={styles.filterText}>7 Days</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, dateFilter === "specific" && styles.filterActive]}
//           onPress={() => {
//             setShowDatePicker(true);
//             setDateFilter("specific");
//           }}
//         >
//           <Text style={styles.filterText}>Select Day</Text>
//         </TouchableOpacity>
//       </View>

//       {/* DATE PICKER */}
//       {showDatePicker && (
//         <DateTimePicker
//           mode="date"
//           value={selectedDay || new Date()}
//           onChange={(e, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDay(date);
//           }}
//         />
//       )}

//       {/* DATE RANGE */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFromPicker(true)}>
//           <Text style={styles.filterText}>
//             From: {fromDate ? fromDate.toDateString() : "Select"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.filterBtn} onPress={() => setShowToPicker(true)}>
//           <Text style={styles.filterText}>
//             To: {toDate ? toDate.toDateString() : "Select"}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {showFromPicker && (
//         <DateTimePicker
//           mode="date"
//           value={fromDate || new Date()}
//           onChange={(event, date) => {
//             setShowFromPicker(false);
//             if (date) setFromDate(date);
//           }}
//         />
//       )}

//       {showToPicker && (
//         <DateTimePicker
//           mode="date"
//           value={toDate || new Date()}
//           onChange={(event, date) => {
//             setShowToPicker(false);
//             if (date) setToDate(date);
//           }}
//         />
//       )}

//       {/* SORT + CLEAR */}
//       <View style={styles.filterRow}>
//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "low" && styles.filterActive]}
//           onPress={() => setSortFilter("low")}
//         >
//           <Text style={styles.filterText}>₹ Low → High</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, sortFilter === "high" && styles.filterActive]}
//           onPress={() => setSortFilter("high")}
//         >
//           <Text style={styles.filterText}>₹ High → Low</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
//           <Text style={{ color: "white" }}>Clear Filters</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BILL LIST */}
//       <FlatList
//         data={paginatedData}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 Bill ID: {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 Customer: {item.customer?.name || "N/A"}
//             </Text>

//             <Text style={styles.total}>💰 Total: ₹{item.total}</Text>
//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsContainer}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>{p.product?.name || "Item"}</Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />

//       {/* PAGINATION */}
//       <View style={styles.paginationRow}>
//         <TouchableOpacity
//           disabled={page === 1}
//           style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
//           onPress={() => setPage(page - 1)}
//         >
//           <Text>Previous</Text>
//         </TouchableOpacity>

//         <Text style={{ fontSize: 16, fontWeight: "600" }}>
//           {page} / {Math.ceil(filteredBills.length / pageSize)}
//         </Text>

//         <TouchableOpacity
//           disabled={page >= Math.ceil(filteredBills.length / pageSize)}
//           style={[
//             styles.pageBtn,
//             page >= Math.ceil(filteredBills.length / pageSize) && { opacity: 0.4 },
//           ]}
//           onPress={() => setPage(page + 1)}
//         >
//           <Text>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// /* STYLES */
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   reloadBtn: {
//     backgroundColor: "#007AFF",
//     margin: 10,
//     padding: 10,
//     borderRadius: 6,
//     alignItems: "center",
//   },

//   /* ⭐ NEW SEARCH BAR */
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     margin: 10,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     borderRadius: 50,
//     elevation: 5,
//   },

//   searchIcon: {
//     fontSize: 18,
//     marginRight: 10,
//     color: "white",
//   },

//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: "white",
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 10,
//     marginBottom: 8,
//   },

//   filterBtn: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#e9e9e9",
//     borderRadius: 6,
//   },

//   clearBtn: {
//     backgroundColor: "red",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },

//   filterActive: {
//     backgroundColor: "#007AFF",
//   },

//   filterText: {
//     color: "black",
//     fontSize: 13,
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 14,
//     margin: 10,
//     borderRadius: 10,
//     elevation: 3,
//   },

//   billId: { fontSize: 16, fontWeight: "700" },
//   customer: { fontSize: 14 },
//   total: { fontSize: 15, fontWeight: "600" },
//   date: { fontSize: 12, color: "#444", marginBottom: 10 },

//   itemsContainer: {
//     backgroundColor: "#F3F3F3",
//     padding: 8,
//     borderRadius: 8,
//   },

//   itemRow: { flexDirection: "row", justifyContent: "space-between" },
//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },

//   paginationRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 15,
//   },

//   pageBtn: {
//     backgroundColor: "#ddd",
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 6,
//   },
// });

















// // ⭐ MODERN & STYLISH BILL LIST SCREEN (FULL UPDATED UI)

// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
//   Animated,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { LinearGradient } from "expo-linear-gradient";

// // -------------------------------------------------------------
// // DATE FORMATTER
// // -------------------------------------------------------------
// const formatBillDate = (dateString) => {
//   const date = new Date(dateString);
//   return `${date.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   })} • ${date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   })}`;
// };

// // Same day helpers
// const isSameDay = (d1, d2) =>
//   d1.getDate() === d2.getDate() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getFullYear() === d2.getFullYear();

// const isToday = (d) => isSameDay(d, new Date());
// const isYesterday = (d) => {
//   const y = new Date();
//   y.setDate(y.getDate() - 1);
//   return isSameDay(d, y);
// };

// // -------------------------------------------------------------
// //  MAIN SCREEN
// // -------------------------------------------------------------
// export default function BillListScreen() {
//   const { getToken } = useAuth();
//   const { isLoaded, isSignedIn } = useUser();

//   const [bills, setBills] = useState([]);
//   const [filteredBills, setFilteredBills] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [dateFilter, setDateFilter] = useState("all");

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const [sortFilter, setSortFilter] = useState("none");

//   const [fromDate, setFromDate] = useState(null);
//   const [toDate, setToDate] = useState(null);
//   const [showFromPicker, setShowFromPicker] = useState(false);
//   const [showToPicker, setShowToPicker] = useState(false);

//   const [page, setPage] = useState(1);
//   const pageSize = 10;

//   const fetchBills = async () => {
//     if (!isLoaded || !isSignedIn) return;

//     setLoading(true);
//     try {
//       const token = await getToken();
//       const res = await fetch(
//         "https://billing.kravy.in/api/billing/list",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const data = await res.json();
//       setBills(data.bills);
//       setFilteredBills(data.bills);
//       setPage(1);
//     } catch {
//       setError("Error fetching bills.");
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchBills();
//   }, [isLoaded, isSignedIn]);

//   // -------------------------------------------------------------
//   // FILTERING LOGIC
//   // -------------------------------------------------------------
//   useEffect(() => {
//     let temp = [...bills];

//     // Search
//     if (search.trim()) {
//       temp = temp.filter((b) => {
//         const productMatch = b.products?.some((p) =>
//           (p.product?.name || "").toLowerCase().includes(search.toLowerCase())
//         );

//         return (
//           b.id.toLowerCase().includes(search.toLowerCase()) ||
//           (b.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
//           productMatch
//         );
//       });
//     }

//     // Date Filter
//     temp = temp.filter((b) => {
//       const d = new Date(b.createdAt);

//       if (dateFilter === "today") return isToday(d);
//       if (dateFilter === "yesterday") return isYesterday(d);
//       if (dateFilter === "7days") {
//         const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
//         return diff <= 7;
//       }
//       if (dateFilter === "specific" && selectedDay)
//         return isSameDay(d, selectedDay);

//       return true;
//     });

//     // Range filter
//     if (fromDate && toDate) {
//       temp = temp.filter((b) => {
//         const d = new Date(b.createdAt);
//         return d >= fromDate && d <= toDate;
//       });
//     }

//     // Sorting
//     if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
//     if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

//     setFilteredBills(temp);
//     setPage(1);
//   }, [search, dateFilter, bills, selectedDay, sortFilter, fromDate, toDate]);

//   const clearFilters = () => {
//     setSearch("");
//     setDateFilter("all");
//     setSortFilter("none");
//     setSelectedDay(null);
//     setFromDate(null);
//     setToDate(null);
//     setFilteredBills(bills);
//   };

//   const paginatedData = filteredBills.slice(
//     (page - 1) * pageSize,
//     page * pageSize
//   );

//   // -------------------------------------------------------------
//   //  UI
//   // -------------------------------------------------------------
//   if (loading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#6C63FF" />
//         <Text style={{ marginTop: 10, fontSize: 16 }}>Loading Bills...</Text>
//       </View>
//     );

//   return (
//     <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      
//       {/* -------------------------------------------------------------
//          HEADER WITH GRADIENT
//       ------------------------------------------------------------- */}
//       <LinearGradient
//         colors={["#6C63FF", "#4E43E3"]}
//         style={styles.header}
//       >
//         <Text style={styles.headerTitle}>Bills & Transactions</Text>

//         {/* Search Bar */}
//         <View style={styles.searchWrapper}>
//           <TextInput
//             placeholder="Search Bill ID / Customer / Item"
//             placeholderTextColor="#ccc"
//             value={search}
//             onChangeText={setSearch}
//             style={styles.searchInput}
//           />
//         </View>
//       </LinearGradient>

//       {/* -------------------------------------------------------------
//          FILTER CHIPS
//       ------------------------------------------------------------- */}
//       <View style={styles.chipRow}>
//         {["today", "yesterday", "7days"].map((type) => (
//           <TouchableOpacity
//             key={type}
//             onPress={() => setDateFilter(type)}
//             style={[
//               styles.chip,
//               dateFilter === type && styles.chipActive,
//             ]}
//           >
//             <Text
//               style={[
//                 styles.chipText,
//                 dateFilter === type && styles.chipTextActive,
//               ]}
//             >
//               {type === "today"
//                 ? "Today"
//                 : type === "yesterday"
//                 ? "Yesterday"
//                 : "Last 7 Days"}
//             </Text>
//           </TouchableOpacity>
//         ))}

//         {/* Select Day */}
//         <TouchableOpacity
//           onPress={() => {
//             setShowDatePicker(true);
//             setDateFilter("specific");
//           }}
//           style={[
//             styles.chip,
//             dateFilter === "specific" && styles.chipActive,
//           ]}
//         >
//           <Text
//             style={[
//               styles.chipText,
//               dateFilter === "specific" && styles.chipTextActive,
//             ]}
//           >
//             Pick Date
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {showDatePicker && (
//         <DateTimePicker
//           mode="date"
//           value={selectedDay || new Date()}
//           onChange={(e, date) => {
//             setShowDatePicker(false);
//             if (date) setSelectedDay(date);
//           }}
//         />
//       )}

//       {/* -------------------------------------------------------------
//          SORT / CLEAR
//       ------------------------------------------------------------- */}
//       <View style={styles.chipRow}>
//         <TouchableOpacity
//           onPress={() => setSortFilter("low")}
//           style={[styles.chip, sortFilter === "low" && styles.chipActive]}
//         >
//           <Text
//             style={[
//               styles.chipText,
//               sortFilter === "low" && styles.chipTextActive,
//             ]}
//           >
//             ₹ Low → High
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => setSortFilter("high")}
//           style={[styles.chip, sortFilter === "high" && styles.chipActive]}
//         >
//           <Text
//             style={[
//               styles.chipText,
//               sortFilter === "high" && styles.chipTextActive,
//             ]}
//           >
//             ₹ High → Low
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
//           <Text style={{ color: "white", fontWeight: "600" }}>
//             Clear Filters
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* -------------------------------------------------------------
//          BILL LIST (Glassmorphism Cards)
//       ------------------------------------------------------------- */}
//       <FlatList
//         data={paginatedData}
//         keyExtractor={(i) => i.id}
//         contentContainerStyle={{ paddingBottom: 80 }}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.billId}>🧾 {item.id}</Text>
//             <Text style={styles.customer}>
//               👤 {item.customer?.name || "No Customer"}
//             </Text>
//             <Text style={styles.total}>₹ {item.total}</Text>
//             <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

//             <View style={styles.itemsBox}>
//               {item.products?.map((p, i) => (
//                 <View key={i} style={styles.itemRow}>
//                   <Text style={styles.itemName}>{p.product?.name}</Text>
//                   <Text style={styles.itemQty}>x{p.quantity}</Text>
//                   <Text style={styles.itemRate}>₹{p.rate}</Text>
//                   <Text style={styles.itemTotal}>₹{p.total}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}
//       />

//       {/* -------------------------------------------------------------
//          PAGINATION
//       ------------------------------------------------------------- */}
//       <View style={styles.paginationRow}>
//         <TouchableOpacity
//           disabled={page === 1}
//           onPress={() => setPage(page - 1)}
//           style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
//         >
//           <Text style={styles.pageText}>Previous</Text>
//         </TouchableOpacity>

//         <Text style={styles.pageNumber}>
//           {page} / {Math.ceil(filteredBills.length / pageSize)}
//         </Text>

//         <TouchableOpacity
//           disabled={page >= Math.ceil(filteredBills.length / pageSize)}
//           onPress={() => setPage(page + 1)}
//           style={[
//             styles.pageBtn,
//             page >= Math.ceil(filteredBills.length / pageSize) && {
//               opacity: 0.4,
//             },
//           ]}
//         >
//           <Text style={styles.pageText}>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// // -------------------------------------------------------------
// // MODERN STYLISH UI STYLES
// // -------------------------------------------------------------
// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },

//   header: {
//     paddingTop: 55,
//     paddingBottom: 20,
//     paddingHorizontal: 18,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//     elevation: 10,
//   },

//   headerTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "white",
//     marginBottom: 12,
//   },

//   searchWrapper: {
//     backgroundColor: "rgba(255,255,255,0.25)",
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     borderRadius: 10,
//     backdropFilter: "blur(10px)",
//   },

//   searchInput: {
//     color: "#fff",
//     fontSize: 17,
//     fontWeight: "500",
//   },

//   chipRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginTop: 8,
//     paddingHorizontal: 10,
//   },

//   chip: {
//     backgroundColor: "#EDEDED",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 25,
//     marginRight: 8,
//     marginBottom: 8,
//   },

//   chipActive: {
//     backgroundColor: "#6C63FF",
//   },

//   chipText: {
//     color: "#333",
//     fontSize: 13,
//     fontWeight: "600",
//   },

//   chipTextActive: {
//     color: "white",
//   },

//   clearBtn: {
//     backgroundColor: "red",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 25,
//   },

//   card: {
//     margin: 12,
//     padding: 15,
//     backgroundColor: "rgba(255,255,255,0.8)",
//     borderRadius: 14,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOpacity: 0.15,
//     shadowRadius: 6,
//   },

//   billId: { fontSize: 15, fontWeight: "700" },
//   customer: { fontSize: 14, marginTop: 5 },
//   total: { fontSize: 18, fontWeight: "700", marginTop: 5, color: "#6C63FF" },
//   date: { fontSize: 12, color: "#666", marginBottom: 10 },

//   itemsBox: {
//     backgroundColor: "#F1F1F1",
//     padding: 10,
//     borderRadius: 10,
//   },

//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 4,
//   },

//   itemName: { flex: 2, fontWeight: "600" },
//   itemQty: { flex: 1, textAlign: "center" },
//   itemRate: { flex: 1, textAlign: "right" },
//   itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },

//   paginationRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 15,
//     backgroundColor: "#fff",
//     elevation: 4,
//   },

//   pageBtn: {
//     backgroundColor: "#6C63FF",
//     paddingHorizontal: 18,
//     paddingVertical: 8,
//     borderRadius: 25,
//   },

//   pageText: { color: "white", fontWeight: "700" },

//   pageNumber: {
//     fontSize: 16,
//     fontWeight: "700",
//   },
// });



















// ⭐ MODERN & STYLISH BILL LIST SCREEN (FULL UPDATED UI)

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRefresh } from "../../context/RefreshContext";

// -------------------------------------------------------------
// DATE FORMATTER
// -------------------------------------------------------------
const formatBillDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })} • ${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const isToday = (d) => isSameDay(d, new Date());
const isYesterday = (d) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(d, y);
};

// -------------------------------------------------------------
//  MAIN SCREEN
// -------------------------------------------------------------
export default function BillListScreen() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { refreshSignal, triggerRefresh } = useRefresh();

  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const [sortFilter, setSortFilter] = useState("none");

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [refreshing, setRefreshing] = useState(false);

  // -------------------------------------------------------------
  // FETCH BILLS + RELOAD
  // -------------------------------------------------------------
  const fetchBills = async (silent = false) => {
    if (!isLoaded || !isSignedIn) {
      setBills([]);
      setFilteredBills([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const res = await fetch(
        "https://billing.kravy.in/api/bill-manager",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const onlySales = (data.bills || []).filter(b => b.isHeld !== true);
        setBills(onlySales);
        setFilteredBills(onlySales);
      } else {
        console.warn(`Deepsale fetch failed: ${res.status}`);
      }
    } catch {
      setError("Error fetching bills.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reloadPage = () => {
    fetchBills(true); // Call silently to avoid full-screen loader
  };

  useEffect(() => {
    fetchBills();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchBills(true);
    }
  }, [refreshSignal]);

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  useEffect(() => {
    let temp = [...bills];

    // Search
    if (search.trim()) {
      temp = temp.filter((b) => {
        const productMatch = b.items?.some((p) =>
          (p.name || "").toLowerCase().includes(search.toLowerCase())
        );

        return (
          (b.billNumber || "").toLowerCase().includes(search.toLowerCase()) ||
          (b.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
          productMatch
        );
      });
    }

    // Date Filter
    temp = temp.filter((b) => {
      const d = new Date(b.createdAt);

      if (dateFilter === "today") return isToday(d);
      if (dateFilter === "yesterday") return isYesterday(d);
      if (dateFilter === "7days") {
        const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (dateFilter === "specific" && selectedDay)
        return isSameDay(d, selectedDay);

      return true;
    });

    // Range filter (Initial date → End date)
    if (fromDate && toDate) {
      temp = temp.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= fromDate && d <= toDate;
      });
    }

    // Sorting
    if (sortFilter === "low") temp.sort((a, b) => a.total - b.total);
    if (sortFilter === "high") temp.sort((a, b) => b.total - a.total);

    setFilteredBills(temp);
    setPage(1);
  }, [search, dateFilter, bills, selectedDay, sortFilter, fromDate, toDate]);

  const clearFilters = () => {
    setSearch("");
    setDateFilter("all");
    setSortFilter("none");
    setSelectedDay(null);
    setFromDate(null);
    setToDate(null);
    setFilteredBills(bills);
  };

  const paginatedData = filteredBills.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // -------------------------------------------------------------
  //  UI STARTS HERE
  // -------------------------------------------------------------
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading Bills...</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      {/* -------------------------------------------------------------
         HEADER WITH GRADIENT
      ------------------------------------------------------------- */}
      <LinearGradient colors={["#6C63FF", "#4E43E3"]} style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bills & Transactions</Text>
          <TouchableOpacity onPress={triggerRefresh} style={styles.headerReloadBtn}>
            <Ionicons name="refresh" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <TextInput
            placeholder="Search Bill ID / Customer / Item"
            placeholderTextColor="#eee"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </LinearGradient>

      {/* -------------------------------------------------------------
         FILTER CHIPS
      ------------------------------------------------------------- */}
      <View style={styles.chipRow}>
        {["today", "yesterday", "7days"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setDateFilter(type)}
            style={[
              styles.chip,
              dateFilter === type && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                dateFilter === type && styles.chipTextActive,
              ]}
            >
              {type === "today"
                ? "Today"
                : type === "yesterday"
                ? "Yesterday"
                : "Last 7 Days"}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Select Day */}
        <TouchableOpacity
          onPress={() => {
            setShowDatePicker(true);
            setDateFilter("specific");
          }}
          style={[styles.chip, dateFilter === "specific" && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              dateFilter === "specific" && styles.chipTextActive,
            ]}
          >
            Pick Date
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={selectedDay || new Date()}
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDay(date);
          }}
        />
      )}

      {/* -------------------------------------------------------------
         INITIAL DATE → END DATE FILTER
      ------------------------------------------------------------- */}
      <View style={styles.chipRow}>
        {/* FROM DATE */}
        <TouchableOpacity
          onPress={() => setShowFromPicker(true)}
          style={styles.dateRangeBtn}
        >
          <Text style={styles.dateRangeText}>
            From: {fromDate ? fromDate.toDateString() : "Select"}
          </Text>
        </TouchableOpacity>

        {/* TO DATE */}
        <TouchableOpacity
          onPress={() => setShowToPicker(true)}
          style={styles.dateRangeBtn}
        >
          <Text style={styles.dateRangeText}>
            To: {toDate ? toDate.toDateString() : "Select"}
          </Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          mode="date"
          value={fromDate || new Date()}
          onChange={(e, d) => {
            setShowFromPicker(false);
            if (d) setFromDate(d);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          mode="date"
          value={toDate || new Date()}
          onChange={(e, d) => {
            setShowToPicker(false);
            if (d) setToDate(d);
          }}
        />
      )}

      {/* -------------------------------------------------------------
         SORT / CLEAR
      ------------------------------------------------------------- */}
      <View style={styles.chipRow}>
        <TouchableOpacity
          onPress={() => setSortFilter("low")}
          style={[styles.chip, sortFilter === "low" && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              sortFilter === "low" && styles.chipTextActive,
            ]}
          >
            ₹ Low → High
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortFilter("high")}
          style={[styles.chip, sortFilter === "high" && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              sortFilter === "high" && styles.chipTextActive,
            ]}
          >
            ₹ High → Low
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
          <Text style={{ color: "white", fontWeight: "600" }}>
            Clear Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* -------------------------------------------------------------
         BILL LIST (Glassmorphism Cards)
      ------------------------------------------------------------- */}
      <FlatList
        data={paginatedData}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reloadPage} colors={["#6C63FF"]} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.billId}>🧾 {item.billNumber}</Text>
            <Text style={styles.customer}>
              👤 {item.customerName || "No Customer"}
            </Text>
            <Text style={styles.total}>₹ {item.total}</Text>
            <Text style={styles.date}>{formatBillDate(item.createdAt)}</Text>

            <View style={styles.itemsBox}>
              {item.items?.map((p, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>{p.name}</Text>
                  <Text style={styles.itemQty}>x{p.quantity}</Text>
                  <Text style={styles.itemRate}>₹{p.price}</Text>
                  <Text style={styles.itemTotal}>₹{p.total}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />

      {/* -------------------------------------------------------------
         PAGINATION
      ------------------------------------------------------------- */}
      <View style={styles.paginationRow}>
        <TouchableOpacity
          disabled={page === 1}
          onPress={() => setPage(page - 1)}
          style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
        >
          <Text style={styles.pageText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageNumber}>
          {page} / {Math.ceil(filteredBills.length / pageSize)}
        </Text>

        <TouchableOpacity
          disabled={page >= Math.ceil(filteredBills.length / pageSize)}
          onPress={() => setPage(page + 1)}
          style={[
            styles.pageBtn,
            page >= Math.ceil(filteredBills.length / pageSize) && {
              opacity: 0.4,
            },
          ]}
        >
          <Text style={styles.pageText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// MODERN STYLISH UI STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  headerReloadBtn: {
    padding: 5,
  },

  searchWrapper: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },

  searchInput: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    paddingHorizontal: 10,
  },

  chip: {
    backgroundColor: "#EDEDED",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },

  chipActive: {
    backgroundColor: "#6C63FF",
  },

  chipText: {
    color: "#333",
    fontSize: 13,
    fontWeight: "600",
  },

  chipTextActive: {
    color: "white",
  },

  dateRangeBtn: {
    backgroundColor: "#EEE",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
  },

  dateRangeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },

  clearBtn: {
    backgroundColor: "red",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 25,
  },

  card: {
    margin: 12,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    elevation: 4,
  },

  billId: { fontSize: 15, fontWeight: "700" },
  customer: { fontSize: 14, marginTop: 5 },
  total: { fontSize: 18, fontWeight: "700", marginTop: 5, color: "#6C63FF" },
  date: { fontSize: 12, color: "#666", marginBottom: 10 },

  itemsBox: {
    backgroundColor: "#F1F1F1",
    padding: 10,
    borderRadius: 10,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  itemName: { flex: 2, fontWeight: "600" },
  itemQty: { flex: 1, textAlign: "center" },
  itemRate: { flex: 1, textAlign: "right" },
  itemTotal: { flex: 1, textAlign: "right", fontWeight: "700" },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    elevation: 4,
  },

  pageBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
  },

  pageText: { color: "white", fontWeight: "700" },

  pageNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
});
