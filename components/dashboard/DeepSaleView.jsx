import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill } from "../../utils/SimpleBill";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

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

export default function DeepSaleView({ onBack, isSidebar = false, allBills }) {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  const { refreshSignal, triggerRefresh } = useRefresh();

  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [refreshing, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    const loadData = async () => {
      // 1. TRY LOADING FROM CACHE FIRST (FOR INSTANT UI)
      try {
        const cached = await AsyncStorage.getItem("@cached_dash_stats");
        if (cached) {
          const parsed = JSON.parse(cached);
          const cachedBills = parsed.bills || [];
          if (cachedBills.length > 0) {
            const onlySales = cachedBills.filter((b) => b.isHeld !== true);
            setBills(onlySales);
            setFilteredBills(onlySales);
            setLoading(false); // Stop loading early if we have cache
          }
        }
      } catch (e) {
        console.log("DeepSale cache error:", e);
      }

      // 2. ALWAYS FETCH FRESH DATA IN BACKGROUND
      if (allBills && allBills.length > 0) {
        const onlySales = allBills.filter((b) => b.isHeld !== true);
        setBills(onlySales);
        setFilteredBills(onlySales);
        setLoading(false);
      } else {
        fetchBills(true); // Fetch silently in background
      }
    };

    loadData();
  }, [allBills, isLoaded, isSignedIn, user]);

  const fetchBills = async (silent = false) => {
    if (!isLoaded) return;

    // If not silent and we have no bills yet, show loader
    if (!silent && bills.length === 0) setLoading(true);
    else if (silent) setRefreshing(true);

    try {
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;

      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      if (!finalToken) {
        // If still no token, we can't fetch fresh but we can still show cached
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = bId
        ? `https://billing.kravy.in/api/bill-manager?businessId=${bId}&limit=1000&t=${Date.now()}`
        : `https://billing.kravy.in/api/bill-manager?limit=1000&t=${Date.now()}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${finalToken}`,
          Cookie: `staff_token=${finalToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const billsArray = Array.isArray(data) ? data : data.bills || [];
        const onlySales = billsArray.filter((b) => b.isHeld !== true);

        setBills(onlySales);
        setFilteredBills(onlySales);

        // Update cache for next time
        AsyncStorage.setItem(
          "@cached_dash_stats",
          JSON.stringify({ bills: onlySales }),
        );
      }
    } catch (e) {
      console.log("DeepSale fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchBills(true);
    }
  }, [refreshSignal]);

  useEffect(() => {
    let temp = [...bills];

    if (search.trim()) {
      temp = temp.filter((b) => {
        const productMatch = b.items?.some((p) =>
          (p.name || "").toLowerCase().includes(search.toLowerCase()),
        );
        return (
          (b.billNumber || "").toLowerCase().includes(search.toLowerCase()) ||
          (b.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
          productMatch
        );
      });
    }

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

    if (fromDate && toDate) {
      temp = temp.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= fromDate && d <= toDate;
      });
    }

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
    page * pageSize,
  );

  const handleRePrint = async (item) => {
    try {
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
      const finalToken = token || staffSession?.token;

      if (!finalToken) {
        ToastAndroid.show(
          "Session expired. Please login again.",
          ToastAndroid.SHORT,
        );
        return;
      }

      ToastAndroid.show("🖨️ Printing Bill...", ToastAndroid.SHORT);

      // Map bill items to CartItem format
      const cartItems = (item.items || []).map((it) => ({
        id: it.productId || it.itemId || it._id || Math.random().toString(),
        name: it.name,
        price: it.price || it.rate || 0,
        quantity: it.quantity || it.qty || 1,
        gst: it.gst,
        taxType: it.taxStatus || it.taxType || "Without Tax",
      }));

      await SimpleBill(cartItems, finalToken, bId, {
        billId: item._id || item.id,
        customerName: item.customerName,
        phone: item.customerPhone,
        tableName: item.tableName,
        paymentMode: item.paymentMode,
        silent: false,
      });
    } catch (e) {
      console.error("Print error:", e);
      ToastAndroid.show("❌ Print Failed", ToastAndroid.SHORT);
    }
  };

  const handleEditBill = async (item) => {
    try {
      // Map bill items to CartItem format for Menu cart
      const cartToResume = (item.items || []).map((it) => ({
        id: it.productId || it.itemId || it._id || Math.random().toString(),
        name: it.name,
        imageUrl: it.imageUrl || it.image || it.image_url,
        price: it.price || it.rate || 0,
        quantity: it.quantity || it.qty || 1,
        gst: it.gst,
        taxType: it.taxStatus || it.taxType || "Without Tax",
      }));

      await AsyncStorage.setItem("@resume_cart", JSON.stringify(cartToResume));
      if (item._id || item.id) {
        await AsyncStorage.setItem("@resume_cart_id", item._id || item.id);
        // Set a special flag to indicate this is a bill edit from Dashboard
        await AsyncStorage.setItem("@is_bill_edit", "true");
      }

      ToastAndroid.show("🔄 Loading bill to Menu...", ToastAndroid.SHORT);

      // Navigate to Menu tab first
      router.push("/(tabs)/menu");

      // Delay closing the current view slightly to ensure navigation starts
      setTimeout(() => {
        if (onBack) onBack();
      }, 500);
    } catch (e) {
      console.error("Edit bill error:", e);
      ToastAndroid.show("❌ Error loading bill", ToastAndroid.SHORT);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: vs(10), fontSize: rf(16) }}>
          Loading Bills...
        </Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <LinearGradient
        colors={isSidebar ? ["#6C63FF", "#4E43E3"] : ["transparent", "transparent"]}
        style={[styles.header, { paddingTop: isSidebar ? vs(45) : Platform.OS === "android" ? vs(50) : vs(15) }, !isSidebar && { elevation: 0 }]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rf(26)} color={isSidebar ? "white" : "#1F2937"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, !isSidebar && { color: "#1F2937" }]}>Bills & Transactions</Text>
          {isSidebar && (
            <TouchableOpacity
              onPress={triggerRefresh}
              style={styles.headerReloadBtn}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={rf(26)} color={isSidebar ? "white" : "#1F2937"} />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.searchWrapper, !isSidebar && { backgroundColor: "rgba(0,0,0,0.05)" }]}>
          <TextInput
            placeholder="Search Bill ID / Customer / Item"
            placeholderTextColor={isSidebar ? "#eee" : "#6B7280"}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, !isSidebar && { color: "#1F2937" }]}
          />
        </View>
      </LinearGradient>

      <View style={styles.chipRow}>
        {["today", "yesterday", "7days"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setDateFilter(type)}
            style={[styles.chip, dateFilter === type && styles.chipActive]}
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

      <View style={styles.chipRow}>
        <TouchableOpacity
          onPress={() => setShowFromPicker(true)}
          style={styles.dateRangeBtn}
        >
          <Text style={styles.dateRangeText}>
            From: {fromDate ? fromDate.toDateString() : "Select"}
          </Text>
        </TouchableOpacity>

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

      <FlatList
        data={paginatedData}
        keyExtractor={(i) => i.id || i._id || Math.random().toString()}
        contentContainerStyle={{ paddingBottom: vs(120) }}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
        removeClippedSubviews={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBills(true)}
            colors={["#6C63FF"]}
          />
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

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => handleRePrint(item)}
                style={[styles.actionBtn, { backgroundColor: "#10B98115" }]}
              >
                <Ionicons name="print" size={rf(18)} color="#10B981" />
                <Text style={[styles.actionBtnText, { color: "#10B981" }]}>
                  Print
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleEditBill(item)}
                style={[styles.actionBtn, { backgroundColor: "#6C63FF15" }]}
              >
                <Ionicons name="create" size={rf(18)} color="#6C63FF" />
                <Text style={[styles.actionBtnText, { color: "#6C63FF" }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View
        style={[
          styles.paginationRow,
          { paddingBottom: isSidebar ? vs(50) : vs(10) },
        ]}
      >
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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: vs(45),
    paddingBottom: vs(2),
    paddingHorizontal: s(18),
    borderBottomLeftRadius: s(25),
    borderBottomRightRadius: s(25),
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(5),
  },
  backButton: { padding: s(5) },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  headerReloadBtn: { padding: s(5) },
  searchWrapper: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: s(15),
    paddingVertical: vs(5),
    borderRadius: s(10),
  },
  searchInput: { color: "#fff", fontSize: rf(15), fontWeight: "500" },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: vs(8),
    paddingHorizontal: s(10),
  },
  chip: {
    backgroundColor: "#EDEDED",
    paddingVertical: vs(6),
    paddingHorizontal: s(12),
    borderRadius: s(25),
    marginRight: s(8),
    marginBottom: vs(8),
  },
  chipActive: { backgroundColor: "#6C63FF" },
  chipText: { color: "#333", fontSize: rf(13), fontWeight: "600" },
  chipTextActive: { color: "white" },
  dateRangeBtn: {
    backgroundColor: "#EEE",
    paddingVertical: vs(7),
    paddingHorizontal: s(14),
    borderRadius: s(20),
    marginRight: s(10),
  },
  dateRangeText: { fontSize: rf(13), fontWeight: "600", color: "#444" },
  clearBtn: {
    backgroundColor: "red",
    paddingVertical: vs(6),
    paddingHorizontal: s(12),
    borderRadius: s(25),
  },
  card: {
    margin: s(12),
    padding: s(15),
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: s(14),
    elevation: 4,
  },
  billId: { fontSize: rf(15), fontWeight: "700" },
  customer: { fontSize: rf(14), marginTop: vs(5) },
  total: {
    fontSize: rf(18),
    fontWeight: "700",
    marginTop: vs(5),
    color: "#6C63FF",
  },
  date: { fontSize: rf(12), color: "#666", marginBottom: vs(10) },
  itemsBox: { backgroundColor: "#F1F1F1", padding: s(10), borderRadius: s(10) },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(4),
  },
  itemName: { flex: 2, fontWeight: "600", fontSize: rf(14) },
  itemQty: { flex: 1, textAlign: "center", fontSize: rf(14) },
  itemRate: { flex: 1, textAlign: "right", fontSize: rf(14) },
  itemTotal: {
    flex: 1,
    textAlign: "right",
    fontWeight: "700",
    fontSize: rf(14),
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: s(15),
    paddingTop: vs(8),
    paddingBottom: vs(50),
    backgroundColor: "#fff",
    elevation: 20,
  },
  pageBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: s(18),
    paddingVertical: vs(8),
    borderRadius: s(25),
  },
  pageText: { color: "white", fontWeight: "700", fontSize: rf(14) },
  pageNumber: { fontSize: rf(16), fontWeight: "700" },
  actionRow: {
    flexDirection: "row",
    gap: s(10),
    marginTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: vs(10),
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(8),
    borderRadius: s(10),
    gap: s(6),
  },
  actionBtnText: {
    fontSize: rf(13),
    fontWeight: "700",
  },
});
