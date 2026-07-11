import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  ArrowLeft,
  Download,
  Grid,
  Plus,
  Printer,
  QrCode,
  Trash2,
  X
} from "lucide-react-native";
import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// KRAVY THEME COLORS (Orange / White / Black)
const COLORS = {
  PRIMARY: "#FC5C04", // Brand Orange
  SECONDARY: "#000000", // Black
  WHITE: "#FFFFFF",
  BG_LIGHT: "#F9FAFB",
  GRAY: "#6B7280",
  LIGHT_GRAY: "#E5E7EB",
  DANGER: "#EF4444",
};

interface Table {
  id: string;
  name: string;
  zone?: string;
}

const Shimmer = () => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.shimmerContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Animated.View key={i} style={[styles.shimmerBox, { opacity: anim }]} />
      ))}
    </View>
  );
};

export const TableQrCodes = ({ onBack }: { onBack?: () => void }) => {
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { t } = useLanguage();
  const { canAccessSync } = useStaffPermissions();
  const canEditTables = canAccessSync("edit tables and delete");

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newType, setNewType] = useState<"table" | "room">("table");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComingSoonVisible, setIsComingSoonVisible] = useState(false);
  const [isProfileFetching, setIsProfileFetching] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("KRAVY");
  const [tableBookingEnabled, setTableBookingEnabled] = useState(true);
  const [roomBookingEnabled, setRoomBookingEnabled] = useState(false);
  const [multiZoneMenuEnabled, setMultiZoneMenuEnabled] = useState(false);
  const [newTableZone, setNewTableZone] = useState("Default");
  const [isCustomZoneMode, setIsCustomZoneMode] = useState(false);

  const ZONE_OPTIONS = useMemo(() => {
    const defaultZones = ["Default", "AC", "Non-AC", "Garden", "Rooftop", "Patio", "Bar"];
    const zoneSet = new Set(defaultZones);
    tables.forEach((t) => {
      if (t.zone && t.zone.trim() !== "") {
        zoneSet.add(t.zone);
      }
    });
    return Array.from(zoneSet);
  }, [tables]);

  const viewShotRef = useRef<ViewShot>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const fetchTables = useCallback(async () => {
    // 🚀 CLERK GUARD: Wait for Clerk to initialize before doing anything.
    // This prevents the "Masala House" fallback from triggering while Clerk is loading.
    if (!isLoaded) return;

    try {
      const hasTables = tables.length > 0;
      if (!hasTables) setLoading(true);

      const authToken = await getToken();
      const session = await StaffPermissionEngine.getSession();
      const staffToken = session?.token;

      // 🔥 IDENTITY PRIORITY:
      // 1. Clerk Owner (authToken)
      // 2. Staff/OTP (staffToken)
      const finalToken = isSignedIn ? authToken : authToken || staffToken;

      // If no token at all, stop.
      if (!finalToken) {
        setLoading(false);
        return;
      }

      // Get verified Business ID
      const bId = await StaffPermissionEngine.getActiveBusinessId(
        isSignedIn ? user?.id : undefined,
      );

      // Profile URL Logic
      // For Owners, we never pass businessId in the URL to avoid overriding the server's identity detection.
      const profileUrl =
        isSignedIn && user?.id
          ? `https://billing.kravy.in/api/profile?t=${Date.now()}`
          : bId
            ? `https://billing.kravy.in/api/profile?businessId=${bId}&t=${Date.now()}`
            : `https://billing.kravy.in/api/profile?t=${Date.now()}`;

      const pRes = await fetch(profileUrl, {
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Cookie: `staff_token=${finalToken}`,
        },
      });

      let clerkIdForQr = bId;

      if (pRes.ok) {
        const pData = await pRes.json();
        const actualData = pData.data || pData;

        // 🔥 IDENTITY LOCK: Always prioritize Clerk User ID for the QR menu URL.
        // This ensures the URL matches the website's clerkId-based routing.
        let verifiedId =
          actualData.clerkUserId ||
          actualData.userId ||
          actualData.ownerId ||
          actualData.clerkId ||
          actualData.businessId ||
          actualData._id ||
          actualData.id;

        if (isSignedIn && user?.id) {
          verifiedId = user.id; // Priority 1: Current signed-in Clerk Owner
        } else if (!verifiedId && session?.businessId) {
          verifiedId = session.businessId;
        } else if (!verifiedId && session?.clerkId) {
          verifiedId = session.clerkId;
        }

        if (verifiedId) {
          clerkIdForQr = verifiedId;
        }

        const bName =
          actualData.businessName ||
          actualData.companyName ||
          actualData.restaurantName ||
          (isSignedIn ? "KRAVY" : "KRAVY"); // Never fallback to staff name
        setBusinessName(bName);
        await AsyncStorage.setItem("@cached_business_name", bName);
      }

      if (clerkIdForQr) {
        setBusinessId(clerkIdForQr);
        await AsyncStorage.setItem("@cached_business_id", clerkIdForQr);
      }

      // 4. Standard API URL for tables
      const tablesUrl = clerkIdForQr
        ? `https://billing.kravy.in/api/tables?businessId=${clerkIdForQr}`
        : "https://billing.kravy.in/api/tables";

      const response = await fetch(tablesUrl, {
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Cookie: `staff_token=${finalToken}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          const tablesArray = Array.isArray(data) ? data : data.tables || [];
          const normalizedTables = tablesArray.map((t: any) => ({
            ...t,
            id: t.id || t._id || Math.random().toString(),
          }));
          setTables(normalizedTables);
          await AsyncStorage.setItem(
            "@cached_tables",
            JSON.stringify(normalizedTables),
          );
        }
      }
    } catch (error) {
      console.log("Fetch tables silent error:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, user, isLoaded, isSignedIn]);

  const createTable = async () => {
    if (!newTableName.trim()) return;

    let savedName = newTableName.trim();
    // Ensure "Room " prefix for rooms if not already present
    if (newType === "room" && !savedName.toLowerCase().startsWith("room")) {
      savedName = `Room ${savedName}`;
    }

    // OPTIMISTIC UPDATE: Add table to list immediately
    const tempId = `temp-${Date.now()}`;
    const finalZone = newTableZone.trim() || "Default";
    const optimisticTable = { id: tempId, name: savedName, zone: finalZone };
    const updatedTables = [...tables, optimisticTable];

    // Update UI and Cache instantly
    setTables(updatedTables);
    AsyncStorage.setItem("@cached_tables", JSON.stringify(updatedTables));

    // Close modal and clear input immediately for "instant" feel
    setNewTableName("");
    setNewTableZone("Default");
    setIsCustomZoneMode(false);
    setIsCreateModalVisible(false);

    try {
      // background API call
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      const response = await fetch("https://billing.kravy.in/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${finalToken}`,
        },
        body: JSON.stringify({ name: savedName, businessId: bId, zone: finalZone }),
      });

      if (response.ok) {
        // Sync with backend to get the real database ID
        await fetchTables();
        // Signal other views AFTER server confirmation and local sync
        setTimeout(() => DeviceEventEmitter.emit("REFRESH_TABLES"), 500);
      } else {
        // If save failed, fetchTables will sync the UI back to reality
        fetchTables();
        Alert.alert("Error", "FAILED: Could not create new table on server.");
      }
    } catch (error) {
      console.error("Create table error:", error);
      fetchTables(); // Sync back
    }
  };

  const deleteTable = (id: string, name: string) => {
    setTableToDelete({ id, name });
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;

    const tableId = tableToDelete.id;
    // OPTIMISTIC DELETE: Remove from list immediately
    const updatedTables = tables.filter((t) => t.id !== tableId);
    setTables(updatedTables);
    AsyncStorage.setItem("@cached_tables", JSON.stringify(updatedTables));

    // Close modal immediately for instant feel
    setIsDeleteModalVisible(false);
    setTableToDelete(null);

    try {
      const authToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const finalToken = authToken || staffToken;
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      // Use simplified URL if possible, or keep query for DELETE if required by backend
      const url = bId
        ? `https://billing.kravy.in/api/tables?id=${tableId}&businessId=${bId}`
        : `https://billing.kravy.in/api/tables?id=${tableId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${finalToken}` },
      });

      if (response.ok) {
        // Background refresh to sync state
        await fetchTables();
        // Signal other views AFTER server confirmation and local sync
        setTimeout(() => DeviceEventEmitter.emit("REFRESH_TABLES"), 500);
      } else {
        // If delete failed, fetchTables will restore the table to UI
        await fetchTables();
        Alert.alert("Error", "FAILED_TO_DELETE_TABLE");
      }
    } catch (error) {
      console.error("Delete table error:", error);
      fetchTables(); // Revert/Sync
    }
  };

  const downloadQr = async () => {
    try {
      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "Sharing not available",
          "Could not share or save the QR code.",
        );
      }
    } catch (err) {
      console.error("Capture error:", err);
      Alert.alert("Error", "Failed to capture QR code image.");
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      // 🚀 WARM-UP: Pre-fetch Clerk token so it's ready for the QR modal
      if (isSignedIn) getToken();

      try {
        // 🚀 SMART SYNC: Don't clear cache aggressively, let the API refresh it.
        const [cachedId, cachedTables, cachedBusinessName] = await Promise.all([
          AsyncStorage.getItem("@cached_business_id"),
          AsyncStorage.getItem("@cached_tables"),
          AsyncStorage.getItem("@cached_business_name"),
        ]);

        if (cachedId) setBusinessId(cachedId);
        if (cachedTables) setTables(JSON.parse(cachedTables));
        if (cachedBusinessName) setBusinessName(cachedBusinessName);

        // 🚀 IMMEDIATE SYNC: If signed in via Clerk, use the Real ID immediately.
        // 🚀 IDENTITY SYNC
        if (isSignedIn && user?.id) {
          // If no cached ID, fallback to Clerk ID for now
          if (!cachedId) setBusinessId(user.id);
        } else {
          const session = await StaffPermissionEngine.getSession();
          if (session && !cachedId) {
            const sId = session.businessId || session.clerkId || session.id;
            if (sId) setBusinessId(sId);
            if (session.name) setBusinessName(session.name);
          }
        }

        const [tEnabled, rEnabled, multiZone] = await Promise.all([
          AsyncStorage.getItem("table_booking_enabled"),
          AsyncStorage.getItem("room_booking_enabled"),
          AsyncStorage.getItem("multi_zone_menu_enabled"),
        ]);
        setTableBookingEnabled(tEnabled === "true");
        setRoomBookingEnabled(rEnabled === "true");
        setMultiZoneMenuEnabled(multiZone === "true");

        if (cachedTables) {
          setLoading(false);
        }
      } catch (e) {
        console.error("Error loading cached table data:", e);
      }
      fetchTables();
    };

    loadInitialData();
  }, [isLoaded, isSignedIn, user?.id]);

  // 🚀 ACTIVE TOKEN WARM-UP
  // This watches for sign-in status and pre-fetches the token instantly.
  // It also refreshes the token every 50 seconds to keep it "Hot".
  useEffect(() => {
    if (isSignedIn) {
      getToken(); // Initial warm-up
      const interval = setInterval(() => {
        getToken(); // Keep it hot
      }, 50000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn, getToken]);

  // 🔥 NEW: Reactive Business ID Sync
  // This ensures that as soon as Clerk loads the user, the businessId is updated.
  // This fixes the "first scan wrong" issue by overriding any stale staff data.
  // 🔥 ZERO TOLERANCE: We removed the reactive sync to prevent using user.id as a fallback.
  // businessId is now EXCLUSIVELY set by fresh API calls to ensure correctness.

  const tableItems = useMemo(() => {
    return tables.filter((t) => !t.name.toLowerCase().startsWith("room"));
  }, [tables]);

  const roomItems = useMemo(() => {
    return tables.filter((t) => t.name.toLowerCase().startsWith("room"));
  }, [tables]);

  const openQrModal = async (table: Table) => {
    // 🚀 CLERK GUARD: Wait for Clerk to initialize
    if (!isLoaded) {
      Alert.alert("Please Wait", "Authentication is still loading...");
      return;
    }

    setSelectedTable(table);

    // 🔥 INSTANT IDENTITY: Try to get the ID locally first
    // This removes the "loading" hang for OTP users.
    const currentBId = await StaffPermissionEngine.getActiveBusinessId(
      isSignedIn ? user?.id : undefined,
    );

    if (currentBId) {
      setBusinessId(currentBId);
    }

    setIsProfileFetching(true);
    setIsQrModalVisible(true);

    try {
      const authToken = await getToken();
      const session = await StaffPermissionEngine.getSession();
      const staffToken = session?.token;

      // 🔥 STRICT IDENTITY PRIORITY
      const finalToken = isSignedIn ? authToken : authToken || staffToken;

      if (!finalToken) {
        setIsProfileFetching(false);
        return;
      }

      // 🔥 FIXED URL: Pass businessId for Staff/OTP sessions
      const url =
        isSignedIn && user?.id
          ? `https://billing.kravy.in/api/profile?t=${Date.now()}`
          : currentBId
            ? `https://billing.kravy.in/api/profile?businessId=${currentBId}&t=${Date.now()}`
            : `https://billing.kravy.in/api/profile?t=${Date.now()}`;

      const pRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Cookie: `staff_token=${finalToken}`,
        },
      });

      if (pRes.ok) {
        const pData = await pRes.json();
        const actualData = pData.data || pData;

        // 🔥 IDENTITY LOCK: Always prioritize Clerk User ID for the QR menu URL.
        let verifiedId =
          actualData.clerkUserId ||
          actualData.userId ||
          actualData.ownerId ||
          actualData.clerkId ||
          actualData.businessId ||
          actualData._id ||
          actualData.id;

        if (isSignedIn && user?.id) {
          verifiedId = user.id; // Priority 1: Current signed-in Clerk Owner
        } else if (!verifiedId && session?.businessId) {
          verifiedId = session.businessId;
        } else if (!verifiedId && session?.clerkId) {
          verifiedId = session.clerkId;
        }

        // 🚀 FINAL BLACKLIST GUARD
        if (
          verifiedId === "677e408d6d66e76ba202577c" &&
          (isSignedIn ||
            (session?.email && session.email !== "owner@example.com"))
        ) {
          if (isSignedIn) verifiedId = user?.id;
          else if (session?.businessId) verifiedId = session.businessId;
          else if (session?.clerkId) verifiedId = session.clerkId;
        }

        if (verifiedId) {
          setBusinessId(verifiedId);
          const bName =
            actualData.businessName ||
            actualData.companyName ||
            actualData.restaurantName ||
            "KRAVY"; // Never fallback to staff name
          setBusinessName(bName);
          await AsyncStorage.setItem("@cached_business_id", verifiedId);
          await AsyncStorage.setItem("@cached_business_name", bName);
        }
      } else {
        // Fallback to local ID if API fails but we have a session
        const localId = await StaffPermissionEngine.getActiveBusinessId(
          isSignedIn ? user?.id : undefined,
        );
        if (localId) setBusinessId(localId);
      }
    } catch (e) {
      console.log("[QR] Business ID fetch error:", e);
      // Final Fallback
      const localId = await StaffPermissionEngine.getActiveBusinessId(
        isSignedIn ? user?.id : undefined,
      );
      if (localId) setBusinessId(localId);
    } finally {
      setIsProfileFetching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={rf(26)} color={COLORS.SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Plus size={rf(28)} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottomRow}>
          <Text style={styles.title}>
            {tableBookingEnabled && roomBookingEnabled
              ? "Table & Room QR Codes"
              : roomBookingEnabled
                ? "Room QR Codes"
                : t("table_qr_codes")}
          </Text>
          <Text style={styles.subtitle}>
            {tableBookingEnabled && roomBookingEnabled
              ? "Manage your tables, rooms and QR codes"
              : roomBookingEnabled
                ? "Manage your rooms and QR codes"
                : t("manage_tables_desc") ||
                "Manage your dining tables and QR codes"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
        {/* Tables Section */}
        {tableBookingEnabled && (
          <View style={styles.sectionContainer}>
            {roomBookingEnabled && (
              <View style={styles.sectionHeader}>
                <Grid size={rf(18)} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitle}>Dining Tables</Text>
              </View>
            )}

            <View style={styles.gridContainer}>
              {tableItems.map((item) => (
                <View key={item.id} style={styles.tableCardContainer}>
                  <TouchableOpacity
                    style={styles.tableCard}
                    onPress={() => openQrModal(item)}
                  >
                    <View style={styles.qrPreviewIcon}>
                      <QrCode
                        size={rf(32)}
                        color={COLORS.PRIMARY}
                        strokeWidth={1.5}
                      />
                    </View>
                    <Text style={styles.tableName}>{item.name}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {t("live_qr") || "Live QR"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {canEditTables && (
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => deleteTable(item.id, item.name)}
                    >
                      <Trash2 size={rf(18)} color={COLORS.DANGER} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {tableItems.length === 0 && tableBookingEnabled && (
                <View style={styles.miniEmptyState}>
                  <Text style={styles.miniEmptyText}>
                    No tables created yet.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Rooms Section */}
        {roomBookingEnabled && (
          <View
            style={[
              styles.sectionContainer,
              tableBookingEnabled && { marginTop: vs(30) },
            ]}
          >
            {tableBookingEnabled && (
              <View style={styles.sectionHeader}>
                <QrCode size={rf(18)} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitle}>Rooms</Text>
              </View>
            )}

            <View style={styles.gridContainer}>
              {roomItems.map((item) => (
                <View key={item.id} style={styles.tableCardContainer}>
                  <TouchableOpacity
                    style={styles.tableCard}
                    onPress={() => openQrModal(item)}
                  >
                    <View style={styles.qrPreviewIcon}>
                      <QrCode
                        size={rf(32)}
                        color={COLORS.PRIMARY}
                        strokeWidth={1.5}
                      />
                    </View>
                    <Text style={styles.tableName}>{item.name}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {t("live_qr") || "Live QR"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {canEditTables && (
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => deleteTable(item.id, item.name)}
                    >
                      <Trash2 size={rf(18)} color={COLORS.DANGER} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {roomItems.length === 0 && roomBookingEnabled && (
                <View style={styles.miniEmptyState}>
                  <Text style={styles.miniEmptyText}>
                    No rooms created yet.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {tables.length === 0 && (
          <View style={styles.emptyContainer}>
            <Grid size={rf(60)} color={COLORS.LIGHT_GRAY} />
            <Text style={styles.emptyText}>
              {tableBookingEnabled && roomBookingEnabled
                ? "No tables or rooms created yet."
                : roomBookingEnabled
                  ? "No rooms created yet."
                  : t("no_tables") || "No tables created yet."}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>
                {tableBookingEnabled && roomBookingEnabled
                  ? "Add New Table/Room"
                  : roomBookingEnabled
                    ? "Add New Room"
                    : t("add_new_table")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={isQrModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsQrModalVisible(false);
          setBusinessId(null);
          setIsProfileFetching(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedTable?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {businessName} Digital Menu
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsQrModalVisible(false);
                  // 🔥 RESET ON CLOSE: Clear everything so the next QR starts fresh
                  setBusinessId(null);
                  setIsProfileFetching(false);
                }}
                style={styles.closeBtn}
              >
                <X size={rf(24)} color={COLORS.SECONDARY} />
              </TouchableOpacity>
            </View>

            {selectedTable && (
              <View style={styles.qrContainer}>
                {!isLoaded || !businessId || isProfileFetching ? (
                  // 🔥 ZERO TOLERANCE: Don't show QR until we have the verified businessId from the API.
                  // Using user.id directly causes "Masala House" on the website.
                  <View
                    style={[
                      styles.qrCaptureArea,
                      { justifyContent: "center", minHeight: s(250) },
                    ]}
                  >
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    <Text
                      style={{
                        marginTop: 15,
                        color: COLORS.GRAY,
                        fontSize: rf(14),
                        textAlign: "center",
                        fontFamily: "Inter-Medium",
                      }}
                    >
                      Loading QR Code...
                    </Text>
                  </View>
                ) : (
                  <ViewShot
                    ref={viewShotRef}
                    options={{ format: "png", quality: 1.0 }}
                  >
                    <View style={styles.qrCaptureArea}>
                      <Text style={styles.qrBrandName}>
                        {businessName.toUpperCase()}
                      </Text>
                      <View style={styles.qrWrapper}>
                        <QRCode
                          key={businessId || "none"}
                          // 🔥 FINAL SYNC FIX: ONLY use Clerk ID (businessId) that matches the website's expectation.
                          value={`https://billing.kravy.in/menu/${businessId}?tableId=${selectedTable.id}&tableName=${encodeURIComponent(selectedTable.name)}${multiZoneMenuEnabled && selectedTable.zone && selectedTable.zone !== "Default" ? `&zone=${encodeURIComponent(selectedTable.zone)}` : ""}`}
                          size={s(180)}
                          color="#000"
                          backgroundColor="#fff"
                          enableLinearGradient={true}
                          linearGradient={["#000", "#333"]}
                        />
                      </View>
                      <Text style={styles.qrTableName}>
                        {selectedTable.name}
                      </Text>
                      {multiZoneMenuEnabled && selectedTable.zone && selectedTable.zone !== "Default" && (
                        <Text style={{ fontSize: rf(14), fontWeight: "bold", color: COLORS.PRIMARY, marginTop: vs(2) }}>
                          {selectedTable.zone} Zone
                        </Text>
                      )}
                      <Text style={styles.qrScanPrompt}>
                        {roomBookingEnabled && !tableBookingEnabled
                          ? "Scan to view Room Menu"
                          : "Scan to view Menu"}
                      </Text>
                    </View>
                  </ViewShot>
                )}

                <Text style={styles.qrInstructions}>
                  {t("qr_instructions") ||
                    "Let customers scan this to see your live menu and place orders."}
                </Text>
              </View>
            )}

            <View style={styles.qrModalButtons}>
              <TouchableOpacity style={styles.downloadBtn} onPress={downloadQr}>
                <Download size={rf(18)} color="#fff" />
                <Text style={styles.btnText}>
                  {t("download_qr") || "Download QR"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={() => setIsComingSoonVisible(true)}
              >
                <Printer size={rf(18)} color={COLORS.SECONDARY} />
                <Text style={[styles.btnText, { color: COLORS.SECONDARY }]}>
                  {t("print")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Table Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalContent}>
            <View style={styles.createHeader}>
              <Text style={styles.createTitle}>
                {tableBookingEnabled && roomBookingEnabled
                  ? "Add New Table/Room"
                  : roomBookingEnabled
                    ? "Add New Room"
                    : t("add_new_table")}
              </Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <X size={rf(20)} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>

            {tableBookingEnabled && roomBookingEnabled && (
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newType === "table" && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewType("table")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      newType === "table" && styles.typeTextActive,
                    ]}
                  >
                    Table
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newType === "room" && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewType("room")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      newType === "room" && styles.typeTextActive,
                    ]}
                  >
                    Room
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.inputLabel}>
              {newType === "room"
                ? "ROOM NAME / NUMBER"
                : "TABLE NAME / NUMBER"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                tableBookingEnabled && roomBookingEnabled
                  ? "e.g. Table 5 or Room 101"
                  : roomBookingEnabled
                    ? "e.g. Room 101, Suite A"
                    : "e.g. Table 5, Booth A"
              }
              value={newTableName}
              onChangeText={setNewTableName}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            {multiZoneMenuEnabled && (
              <View style={{ marginBottom: vs(25) }}>
                <Text style={styles.inputLabel}>SELECT ZONE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: vs(5) }} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                  {[...ZONE_OPTIONS, "+ Custom"].map((zone) => {
                    const isSelected = zone === "+ Custom" ? isCustomZoneMode : (!isCustomZoneMode && newTableZone === zone);
                    return (
                      <TouchableOpacity
                        key={zone}
                        style={{
                          paddingHorizontal: s(16),
                          paddingVertical: vs(10),
                          backgroundColor: isSelected ? COLORS.SECONDARY : COLORS.BG_LIGHT,
                          borderRadius: s(12),
                          marginRight: s(10),
                          borderWidth: 1,
                          borderColor: isSelected ? COLORS.SECONDARY : COLORS.LIGHT_GRAY
                        }}
                        onPress={() => {
                          if (zone === "+ Custom") {
                            setIsCustomZoneMode(true);
                            setNewTableZone("");
                          } else {
                            setIsCustomZoneMode(false);
                            setNewTableZone(zone);
                          }
                        }}
                      >
                        <Text style={{ fontSize: rf(13), fontWeight: "bold", color: isSelected ? COLORS.WHITE : COLORS.GRAY }}>
                          {zone === "Default" ? "None" : zone}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {isCustomZoneMode && (
                  <TextInput
                    style={[styles.input, { marginTop: vs(10), marginBottom: 0 }]}
                    placeholder="Enter custom zone name"
                    value={newTableZone}
                    onChangeText={setNewTableZone}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={createTable}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {t("save_table") || "Save Table"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconWrapper}>
              <Trash2 size={rf(32)} color={COLORS.DANGER} />
            </View>
            <Text style={styles.deleteTitle}>
              {tableBookingEnabled && roomBookingEnabled
                ? "Delete Item?"
                : roomBookingEnabled
                  ? "Delete Room?"
                  : "Delete Table?"}
            </Text>
            <Text style={styles.deleteDescription}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "bold", color: COLORS.SECONDARY }}>
                {tableToDelete?.name}
              </Text>
              ? This action cannot be undone.
            </Text>
            <View style={styles.deleteButtonGroup}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmDeleteBtn,
                  isDeleting && { opacity: 0.7 },
                ]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>{t("delete")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal
        visible={isComingSoonVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.comingSoonContent}>
            <View style={styles.rocketIconWrapper}>
              <Printer size={rf(32)} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
            <Text style={styles.comingSoonDescription}>
              Direct printing support for thermal printers is currently under
              development and will be available in the next update.
            </Text>
            <TouchableOpacity
              style={styles.comingSoonCloseBtn}
              onPress={() => setIsComingSoonVisible(false)}
            >
              <Text style={styles.comingSoonCloseBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_LIGHT },
  header: {
    paddingHorizontal: s(20),
    paddingTop: vs(25), // Basic top padding
    paddingBottom: vs(15),
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(15), // Push title/subtitle down
    marginTop: vs(10), // Extra space from top
  },
  headerBottomRow: {
    marginTop: vs(5),
  },
  backBtn: {
    padding: s(5),
    marginLeft: s(-5),
  },
  title: {
    fontSize: rf(24),
    fontWeight: "900",
    color: COLORS.SECONDARY,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: rf(13), color: COLORS.GRAY, marginTop: vs(2) },
  addBtn: {
    backgroundColor: COLORS.WHITE,
    padding: s(8),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    elevation: 2,
  },
  listPadding: { padding: s(12), paddingBottom: vs(100) },
  tableCardContainer: {
    width: (SCREEN_WIDTH - s(50)) / 3,
    marginHorizontal: s(4),
    marginVertical: s(8),
  },
  tableCard: {
    backgroundColor: COLORS.WHITE,
    padding: s(12),
    borderRadius: s(20),
    alignItems: "center",
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  qrPreviewIcon: {
    width: s(45),
    height: s(45),
    backgroundColor: COLORS.PRIMARY + "08",
    borderRadius: s(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(8),
  },
  deleteIcon: {
    position: "absolute",
    top: s(5),
    right: s(5),
    padding: s(4),
    backgroundColor: "#FEF2F2",
    borderRadius: s(8),
  },
  tableName: {
    fontSize: rf(14),
    fontWeight: "800",
    marginTop: vs(4),
    color: COLORS.SECONDARY,
    textAlign: "center",
  },
  badge: {
    marginTop: vs(8),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    backgroundColor: COLORS.SECONDARY,
    borderRadius: s(8),
  },
  badgeText: {
    fontSize: rf(10),
    color: COLORS.WHITE,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  // New Section Styles
  sectionContainer: {
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(15),
    paddingHorizontal: s(8),
    gap: s(10),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "800",
    color: COLORS.SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  miniEmptyState: {
    width: "100%",
    padding: s(20),
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: s(16),
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  miniEmptyText: {
    color: COLORS.GRAY,
    fontSize: rf(13),
  },

  // Type Selector Styles
  typeSelector: {
    flexDirection: "row",
    backgroundColor: COLORS.BG_LIGHT,
    borderRadius: s(12),
    padding: s(4),
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  typeOption: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: "center",
    borderRadius: s(8),
  },
  typeOptionActive: {
    backgroundColor: COLORS.WHITE,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeText: {
    fontSize: rf(14),
    fontWeight: "600",
    color: COLORS.GRAY,
  },
  typeTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(32),
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(25),
  },
  modalTitle: { fontSize: rf(22), fontWeight: "900", color: COLORS.SECONDARY },
  modalSubtitle: {
    fontSize: rf(12),
    color: COLORS.PRIMARY,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  closeBtn: { padding: s(5) },

  qrContainer: { alignItems: "center", marginBottom: vs(30) },
  qrCaptureArea: {
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(20),
    alignItems: "center",
  },
  qrBrandName: {
    fontSize: rf(26),
    fontWeight: "900",
    color: COLORS.SECONDARY,
    marginBottom: vs(15),
    letterSpacing: 2,
  },
  qrWrapper: {
    padding: s(15),
    backgroundColor: COLORS.WHITE,
    borderRadius: s(15),
    elevation: 8,
    borderWidth: 5,
    borderColor: COLORS.SECONDARY,
  },
  qrTableName: {
    fontSize: rf(20),
    fontWeight: "bold",
    marginTop: vs(15),
    color: COLORS.SECONDARY,
  },
  qrScanPrompt: {
    fontSize: rf(12),
    color: COLORS.GRAY,
    marginTop: vs(5),
  },
  qrInstructions: {
    fontSize: rf(14),
    color: COLORS.GRAY,
    textAlign: "center",
    lineHeight: rf(20),
    marginTop: vs(10),
  },
  qrModalButtons: {
    flexDirection: "row",
    gap: s(12),
  },
  downloadBtn: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: vs(16),
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
    gap: s(10),
    elevation: 5,
  },
  printBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    paddingVertical: vs(16),
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
    gap: s(6),
    borderWidth: 1.5,
    borderColor: COLORS.SECONDARY,
  },
  btnText: { color: "#fff", fontSize: rf(15), fontWeight: "900" },

  createModalContent: {
    width: "85%",
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(24),
    elevation: 20,
  },
  createHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
  },
  createTitle: { fontSize: rf(20), fontWeight: "900", color: COLORS.SECONDARY },
  inputLabel: {
    fontSize: rf(11),
    fontWeight: "bold",
    color: COLORS.GRAY,
    marginBottom: vs(8),
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.LIGHT_GRAY,
    borderRadius: s(16),
    padding: s(16),
    marginBottom: vs(25),
    fontSize: rf(16),
    color: COLORS.SECONDARY,
    backgroundColor: COLORS.BG_LIGHT,
  },
  saveBtn: {
    backgroundColor: COLORS.SECONDARY,
    paddingVertical: vs(16),
    borderRadius: s(16),
    alignItems: "center",
    elevation: 5,
  },
  saveBtnText: { color: "#fff", fontSize: rf(16), fontWeight: "bold" },

  // Empty state & Shimmer
  emptyContainer: {
    alignItems: "center",
    marginTop: vs(100),
    paddingHorizontal: s(40),
  },
  emptyText: {
    color: COLORS.GRAY,
    marginTop: vs(15),
    fontSize: rf(15),
    textAlign: "center",
  },
  emptyAddBtn: {
    marginTop: vs(20),
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: s(25),
    paddingVertical: vs(12),
    borderRadius: s(12),
  },
  emptyAddBtnText: { color: COLORS.WHITE, fontWeight: "800" },

  shimmerContainer: {
    padding: s(15),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  shimmerBox: {
    width: (SCREEN_WIDTH - s(45)) / 2,
    height: vs(150),
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: s(24),
    marginBottom: vs(15),
  },

  // Delete Modal Styles
  deleteModalContent: {
    width: "85%",
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(32),
    alignItems: "center",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,
  },
  deleteIconWrapper: {
    width: s(70),
    height: s(70),
    backgroundColor: "#FEF2F2",
    borderRadius: s(35),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  deleteTitle: {
    fontSize: rf(22),
    fontWeight: "900",
    color: COLORS.SECONDARY,
    marginBottom: vs(10),
  },
  deleteDescription: {
    fontSize: rf(15),
    color: COLORS.GRAY,
    textAlign: "center",
    lineHeight: rf(22),
    marginBottom: vs(30),
    paddingHorizontal: s(10),
  },
  deleteButtonGroup: {
    flexDirection: "row",
    gap: s(12),
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: vs(15),
    borderRadius: s(16),
    backgroundColor: COLORS.BG_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  cancelBtnText: {
    fontSize: rf(16),
    fontWeight: "700",
    color: COLORS.GRAY,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: vs(15),
    borderRadius: s(16),
    backgroundColor: COLORS.DANGER,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  confirmDeleteBtnText: {
    fontSize: rf(16),
    fontWeight: "800",
    color: COLORS.WHITE,
  },

  // Coming Soon Modal Styles
  comingSoonContent: {
    width: "80%",
    backgroundColor: COLORS.WHITE,
    padding: s(30),
    borderRadius: s(32),
    alignItems: "center",
    elevation: 25,
  },
  rocketIconWrapper: {
    width: s(70),
    height: s(70),
    backgroundColor: COLORS.PRIMARY + "15",
    borderRadius: s(35),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  comingSoonTitle: {
    fontSize: rf(24),
    fontWeight: "900",
    color: COLORS.SECONDARY,
    marginBottom: vs(12),
  },
  comingSoonDescription: {
    fontSize: rf(15),
    color: COLORS.GRAY,
    textAlign: "center",
    lineHeight: rf(22),
    marginBottom: vs(25),
  },
  comingSoonCloseBtn: {
    width: "100%",
    paddingVertical: vs(15),
    backgroundColor: COLORS.SECONDARY,
    borderRadius: s(16),
    alignItems: "center",
    elevation: 4,
  },
  comingSoonCloseBtnText: {
    fontSize: rf(16),
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
});
