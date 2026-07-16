import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
import { SimpleBill } from "../../utils/SimpleBill";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

type HeldOrder = {
  id: string;
  items: any[];
  total: number;
  timestamp: string;
  customerName?: string;
  customerPhone?: string;
  tokenNumber?: string | number;
  tableName?: string;
  roomName?: string;
};

interface HeldOrdersViewProps {
  onBack?: () => void;
  onRefreshCount?: () => void;
}

export default function HeldOrdersView({
  onBack,
  onRefreshCount,
}: HeldOrdersViewProps) {
  const router = useRouter();
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<HeldOrder | null>(null);
  const [isResumeModalVisible, setIsResumeModalVisible] = useState(false);
  const [orderToResume, setOrderToResume] = useState<HeldOrder | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"delete" | "resume">("delete");
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { refreshSignal, triggerRefresh } = useRefresh();
  const { t } = useLanguage();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] =
    useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<HeldOrder | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchHeldOrders();
    }
  }, [refreshSignal]);

  const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);

  useEffect(() => {
    const checkStaff = async () => {
      const session = await AsyncStorage.getItem("staff_session");
      setIsStaffSignedIn(!!session);
    };
    checkStaff();
  }, []);

  const fetchHeldOrders = async () => {
    if (!isLoaded) return;
    try {
      setLoading(true);
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const isStaff = !!sessionStr;
      if (!isSignedIn && !isStaff) {
        setLoading(false);
        return;
      }

      const authToken = await getToken();
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = authToken || staffSession?.token;
      const bId = await StaffPermissionEngine.getActiveBusinessId(
        isSignedIn ? user?.id : undefined,
      );

      if (finalToken || bId) {
        const timestamp = Date.now();
        const url = bId
          ? `https://billing.kravy.in/api/bill-manager?isHeld=true&businessId=${bId}&t=${timestamp}`
          : `https://billing.kravy.in/api/bill-manager?isHeld=true&t=${timestamp}`;
        const response = await fetch(url, {
          headers: finalToken ? { Authorization: `Bearer ${finalToken}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          const bills = data.bills || [];

          const backendHeld = bills
            .filter((b: any) => b.isHeld !== false)
            .map((b: any) => ({
              id: b._id || b.id || b.billNumber,
              items: (b.items || []).map((i: any) => {
                const extractedId = (i.productId && i.productId._id)
                  ? i.productId._id
                  : (i.productId || i.id || i._id || Math.random().toString());
                return {
                  ...i,
                  id: String(extractedId),
                  quantity: i.quantity || i.qty || 0,
                  price: i.price || i.rate || 0,
                };
              }),
              total: b.total || 0,
              timestamp: b.createdAt || new Date().toISOString(),
              customerName: b.customerName,
              customerPhone: b.customerPhone,
              tokenNumber: b.tokenNumber || b.tokenNo || undefined,
              orderId: b.orderId,
              tableName: b.tableName || b.table || undefined,
              roomName: b.roomName || b.room || undefined,
            }));

          setHeldOrders(
            backendHeld.sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleteModalVisible(true);
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = [...selectedOrders];
    setSelectedOrders([]);
    setIsBulkDeleteModalVisible(false);
    setLoading(true);

    const authToken = await getToken();
    const sessionStr = await AsyncStorage.getItem("staff_session");
    const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
    const finalToken = authToken || staffSession?.token;

    for (const id of idsToDelete) {
      if (finalToken) {
        try {
          await fetch(`https://billing.kravy.in/api/bill-manager/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${finalToken}` },
          });
        } catch (e) { }
      }
    }

    await fetchHeldOrders();
    if (onRefreshCount) onRefreshCount();

    ToastAndroid.show(
      `${idsToDelete.length} orders deleted`,
      ToastAndroid.SHORT,
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchHeldOrders();
    }, []),
  );



  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const id = orderToDelete.id;

    setIsDeleteModalVisible(false);
    setLoading(true);

    try {
      const authToken = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = authToken || staffSession?.token;

      if (finalToken) {
        await fetch(`https://billing.kravy.in/api/bill-manager/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${finalToken}` },
        });
      }
    } catch (e) { }

    await fetchHeldOrders();
    if (onRefreshCount) onRefreshCount();

    ToastAndroid.show("Order Deleted", ToastAndroid.SHORT);
    setOrderToDelete(null);
  };

  const confirmResumeOrder = async () => {
    if (!orderToResume) return;
    try {
      const cleanItems = orderToResume.items.map((i: any) => ({
        id: i.id, // fetchHeldOrders maps this to productId
        productId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      // 🚀 Prepare for MainMenuView (DO NOT set @resume_cart_id so it becomes a fresh cart)
      await AsyncStorage.setItem("@resume_cart", JSON.stringify(cleanItems));
      if (orderToResume.tokenNumber) {
        await AsyncStorage.setItem("@resume_token", String(orderToResume.tokenNumber));
      }
      if (orderToResume.tableName) {
        await AsyncStorage.setItem("@resume_table", String(orderToResume.tableName));
      }
      if (orderToResume.roomName) {
        await AsyncStorage.setItem("@resume_room", String(orderToResume.roomName));
      }

      setIsResumeModalVisible(false);
      const resumedId = orderToResume.id;

      ToastAndroid.show("Order Resumed", ToastAndroid.SHORT);
      setOrderToResume(null);
      handleBack(); // Instantly go back to menu, super fast!

      // 🚀 BACKGROUND TASK: DELETE from backend so it completely leaves the hold list immediately
      (async () => {
        try {
          const authToken = await getToken();
          const sessionStr = await AsyncStorage.getItem("staff_session");
          const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
          const finalToken = authToken || staffSession?.token;

          if (finalToken) {
            await fetch(`https://billing.kravy.in/api/bill-manager/${resumedId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${finalToken}` },
            });
          }

          await fetchHeldOrders();
          if (onRefreshCount) onRefreshCount();
        } catch (e) {
          console.log("Failed to delete resumed order from backend", e);
        }
      })();
    } catch (error) {
      ToastAndroid.show("Failed to resume order", ToastAndroid.SHORT);
    }
  };

  const handlePrintOrder = async (order: HeldOrder) => {
    if (isPrinting) return;
    try {
      setIsPrinting(true);
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      const cartItems = order.items.map((i) => ({
        id: i.id || i.productId || i._id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        gst: i.gst,
        taxType: i.taxType || "With Tax",
      }));

      const res = await SimpleBill(
        cartItems,
        finalToken,
        isSignedIn ? user?.id : null,
        {
          billId: order.id,
          customerName: order.customerName || "Table Guest",
          phone: order.customerPhone || "",
          paymentMode: "Cash",
          isHeld: false, // Ensure it is finalized
          source: "POS",
        },
      );

      if (res.status === "success") {
        ToastAndroid.show("Bill Printed & Finalized", ToastAndroid.SHORT);
        setSelectedOrderDetail(null);
        await fetchHeldOrders();
        if (onRefreshCount) onRefreshCount();
        triggerRefresh();
      } else {
        ToastAndroid.show("Print Error: " + res.error, ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show("Error printing bill", ToastAndroid.SHORT);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rf(24)} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("hold_orders")}</Text>
          <Text style={styles.headerSubtitle}>
            {heldOrders.length} {t("orders_saved")}
          </Text>
        </View>

        {heldOrders.length > 0 && (
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={() => {
              if (selectedOrders.length === heldOrders.length)
                setSelectedOrders([]);
              else setSelectedOrders(heldOrders.map((o) => o.id));
            }}
          >
            <Ionicons
              name={
                selectedOrders.length === heldOrders.length
                  ? "checkbox"
                  : "square-outline"
              }
              size={rf(22)}
              color="#4F46E5"
            />
            <Text style={styles.selectAllText}>All</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={triggerRefresh} style={styles.reloadButton}>
          <Ionicons name="refresh" size={rf(24)} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={heldOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedOrders.includes(item.id);
            return (
              <TouchableOpacity
                style={[
                  styles.orderCard,
                  isSelected && styles.orderCardSelected,
                ]}
                onPress={() => setSelectedOrderDetail(item)}
                activeOpacity={0.9}
              >
                <TouchableOpacity
                  style={styles.selectionCircle}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (selectedOrders.includes(item.id))
                      setSelectedOrders(
                        selectedOrders.filter((id) => id !== item.id),
                      );
                    else setSelectedOrders([...selectedOrders, item.id]);
                  }}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={rf(24)}
                    color={isSelected ? "#4F46E5" : "#D1D5DB"}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderId}>
                        Order #{item.id.toString().slice(-4)}
                      </Text>
                      {item.customerName && (
                        <View style={styles.customerRow}>
                          <Ionicons
                            name="person-outline"
                            size={rf(13)}
                            color="#6B7280"
                          />
                          <Text style={styles.customerNameText}>
                            {item.customerName}
                          </Text>
                        </View>
                      )}
                      {item.customerPhone && (
                        <View style={styles.customerRow}>
                          <Ionicons
                            name="call-outline"
                            size={rf(13)}
                            color="#6B7280"
                          />
                          <Text style={styles.customerPhoneText}>
                            {item.customerPhone}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.orderTime}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.totalBadge}>
                      <Text style={styles.totalText}>₹{item.total}</Text>
                    </View>
                  </View>

                  <View style={styles.itemsSummary}>
                    <Text style={styles.itemsList} numberOfLines={2}>
                      {item.items?.map((it, idx) => (
                        <Text key={idx} style={styles.itemNameText}>
                          {it.quantity}x {it.name}
                          {idx < item.items.length - 1 ? ", " : ""}
                        </Text>
                      )) || "No items"}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setOrderToDelete(item);
                        setIsDeleteModalVisible(true);
                      }}
                    >
                      <Feather name="trash-2" size={rf(16)} color="#DC2626" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.resumeBtn]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setOrderToResume(item);
                        setIsResumeModalVisible(true);
                      }}
                    >
                      <Feather name="play" size={rf(16)} color="#FFF" />
                      <Text style={styles.resumeBtnText}>{t("resume")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>{t("no_hold_orders")}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={triggerRefresh} />
          }
        />
      )}

      <Modal transparent visible={isDeleteModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("delete_order_confirm")}</Text>
            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={confirmDeleteOrder}
            >
              <Text style={styles.confirmButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsDeleteModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isResumeModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("resume_order_confirm")}</Text>
            <TouchableOpacity
              style={styles.confirmResumeBtn}
              onPress={confirmResumeOrder}
            >
              <Text style={styles.confirmButtonText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsResumeModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isBulkDeleteModalVisible}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.holdCircleRed}>
              <Ionicons name="trash-outline" size={rf(40)} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>
              Delete {selectedOrders.length} Orders?
            </Text>
            <Text style={styles.modalSubtext}>
              Are you sure you want to permanently delete these{" "}
              {selectedOrders.length} orders? This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={styles.confirmBulkDeleteBtn}
              onPress={confirmBulkDelete}
            >
              <Text style={styles.confirmButtonText}>Yes, Delete All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsBulkDeleteModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedOrders.length > 0 && (
        <TouchableOpacity
          style={styles.bulkDeleteFloatingBtn}
          onPress={handleBulkDelete}
        >
          <Ionicons name="trash" size={rf(24)} color="#FFF" />
          <Text style={styles.bulkDeleteText}>
            Delete Selected ({selectedOrders.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrderDetail} animationType="fade" transparent>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.detailTitle}>Order Details</Text>
                <Text style={styles.detailSubtitle}>
                  #{selectedOrderDetail?.id.toString().slice(-6)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrderDetail(null)}>
                <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailInfoBox}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={rf(16)} color="#6B7280" />
                <Text style={styles.infoText}>
                  {selectedOrderDetail
                    ? new Date(selectedOrderDetail.timestamp).toLocaleString()
                    : ""}
                </Text>
              </View>
              {selectedOrderDetail?.customerName && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={rf(16)}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>
                    {selectedOrderDetail.customerName}
                  </Text>
                </View>
              )}
              {selectedOrderDetail?.customerPhone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={rf(16)} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {selectedOrderDetail.customerPhone}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.itemsHeader}>
              <Text style={styles.itemsHeaderTitle}>Items</Text>
              <Text style={styles.itemsHeaderCount}>
                {selectedOrderDetail?.items.length} items
              </Text>
            </View>

            <FlatList
              data={selectedOrderDetail?.items || []}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.detailItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailItemName}>{item.name}</Text>
                    <Text style={styles.detailItemQty}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.detailItemPrice}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              )}
              style={{ maxHeight: vs(300) }}
            />

            <View style={styles.detailDivider} />

            <View style={styles.detailTotalRow}>
              <Text style={styles.detailTotalLabel}>Grand Total</Text>
              <Text style={styles.detailTotalValue}>
                ₹{selectedOrderDetail?.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.detailActionBtn, styles.printActionBtn]}
                onPress={() =>
                  selectedOrderDetail && handlePrintOrder(selectedOrderDetail)
                }
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons
                      name="print"
                      size={rf(18)}
                      color="#FFF"
                      style={{ marginRight: s(8) }}
                    />
                    <Text style={styles.detailActionText}>
                      Print Professional Bill
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(16),
    backgroundColor: "#FFF",
    elevation: 2,
    marginTop: vs(5),
  },
  backButton: { marginRight: s(15) },
  headerTitle: { fontSize: rf(20), fontWeight: "bold" },
  headerSubtitle: { fontSize: rf(12), color: "#6B7280" },
  reloadButton: { padding: s(8) },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: s(16) },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: s(12),
    padding: s(16),
    marginBottom: vs(16),
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: vs(10),
    marginBottom: vs(10),
  },
  orderId: {
    fontWeight: "bold",
    fontSize: rf(15),
    color: "#1F2937",
    marginBottom: vs(4),
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(5),
    marginBottom: vs(2),
  },
  customerNameText: { fontSize: rf(13), color: "#4B5563", fontWeight: "600" },
  customerPhoneText: { fontSize: rf(12), color: "#6B7280" },
  orderTime: { fontSize: rf(11), color: "#9CA3AF", marginTop: vs(4) },
  totalBadge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: vs(5),
    paddingHorizontal: s(10),
    borderRadius: s(8),
  },
  totalText: { color: "#4F46E5", fontWeight: "bold", fontSize: rf(16) },
  itemsSummary: {
    backgroundColor: "#F9FAFB",
    padding: s(10),
    borderRadius: s(8),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  itemsList: {
    fontSize: rf(13),
    color: "#4B5563",
    lineHeight: rf(18),
  },
  itemNameText: {
    fontWeight: "500",
    color: "#374151",
  },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: s(10) },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(8),
    borderRadius: s(6),
  },
  deleteBtn: { backgroundColor: "#FEF2F2" },
  resumeBtn: { backgroundColor: "#4F46E5" },
  resumeBtnText: { color: "#FFF", marginLeft: s(5), fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: vs(100) },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: s(32),
    borderTopRightRadius: s(32),
    padding: s(24),
    alignItems: "center",
    paddingBottom: vs(45),
  },
  modalTitle: { fontSize: rf(24), fontWeight: "bold", marginBottom: vs(12) },
  confirmDeleteBtn: {
    width: "100%",
    backgroundColor: "#EF4444",
    paddingVertical: vs(18),
    borderRadius: s(20),
    alignItems: "center",
  },
  confirmResumeBtn: {
    width: "100%",
    backgroundColor: "#047857",
    paddingVertical: vs(18),
    borderRadius: s(20),
    alignItems: "center",
  },
  confirmButtonText: { color: "#FFF", fontWeight: "bold" },
  cancelBtn: { paddingVertical: vs(15) },
  cancelBtnText: { color: "#9CA3AF" },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: s(20),
    marginRight: s(10),
  },
  selectAllText: {
    marginLeft: s(5),
    fontWeight: "bold",
    color: "#4F46E5",
    fontSize: rf(14),
  },
  orderCardSelected: {
    borderColor: "#4F46E5",
    borderWidth: 1,
    backgroundColor: "#F5F7FF",
  },
  selectionCircle: { marginRight: s(12), justifyContent: "center" },
  bulkDeleteFloatingBtn: {
    position: "absolute",
    bottom: vs(30),
    left: s(20),
    right: s(20),
    backgroundColor: "#EF4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: vs(15),
    borderRadius: s(30),
    elevation: 5,
  },
  bulkDeleteText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: s(10),
    fontSize: rf(16),
  },
  modalHandle: {
    width: s(40),
    height: vs(5),
    backgroundColor: "#E5E7EB",
    borderRadius: s(3),
    marginBottom: vs(20),
    alignSelf: "center",
  },
  holdCircleRed: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  modalSubtext: {
    fontSize: rf(16),
    color: "#6B7280",
    textAlign: "center",
    marginBottom: vs(24),
    lineHeight: rf(22),
    paddingHorizontal: s(10),
  },
  confirmBulkDeleteBtn: {
    width: "100%",
    backgroundColor: "#EF4444",
    paddingVertical: vs(18),
    borderRadius: s(20),
    alignItems: "center",
    marginBottom: vs(10),
    elevation: 4,
  },

  // Detail Modal Styles
  detailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: s(20),
  },
  detailModalContent: {
    backgroundColor: "#FFF",
    borderRadius: s(24),
    padding: s(24),
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(15),
  },
  detailTitle: { fontSize: rf(22), fontWeight: "bold", color: "#111827" },
  detailSubtitle: { fontSize: rf(14), color: "#6B7280", marginTop: vs(2) },
  detailInfoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: s(12),
    padding: s(15),
    marginTop: vs(20),
    gap: vs(8),
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: s(8) },
  infoText: { fontSize: rf(14), color: "#4B5563" },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(20),
    marginBottom: vs(10),
  },
  itemsHeaderTitle: { fontSize: rf(16), fontWeight: "bold", color: "#374151" },
  itemsHeaderCount: { fontSize: rf(14), color: "#6B7280" },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailItemName: { fontSize: rf(15), fontWeight: "500", color: "#1F2937" },
  detailItemQty: { fontSize: rf(13), color: "#6B7280", marginTop: vs(2) },
  detailItemPrice: { fontSize: rf(15), fontWeight: "bold", color: "#111827" },
  detailDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: vs(15),
  },
  detailTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(25),
  },
  detailTotalLabel: { fontSize: rf(18), fontWeight: "bold", color: "#111827" },
  detailTotalValue: { fontSize: rf(20), fontWeight: "bold", color: "#4F46E5" },
  detailActions: { gap: vs(12) },
  detailActionBtn: {
    height: vs(55),
    borderRadius: s(15),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  printActionBtn: { backgroundColor: "#4F46E5" },
  detailActionText: { color: "#FFF", fontSize: rf(16), fontWeight: "bold" },
});
