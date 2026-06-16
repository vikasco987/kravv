import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageCircle,
  XCircle
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

export function formatWhatsAppNumber(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

interface BillTableProps {
  bills: any[];
  business: any;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const formatAmount = (num: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(num));

const StatusIndicator = ({ status, isHeld }: { status: string; isHeld?: boolean }) => {
  const s = status?.toLowerCase();
  if (isHeld || s === "pending") {
    return (
      <View style={styles.statusIndicator}>
        <Clock size={rf(10)} color="#F59E0B" />
        <Text style={[styles.statusText, { color: "#F59E0B" }]}>PENDING</Text>
      </View>
    );
  }
  if (s === "cancelled") {
    return (
      <View style={styles.statusIndicator}>
        <XCircle size={rf(10)} color="#EF4444" />
        <Text style={[styles.statusText, { color: "#EF4444" }]}>CANCELLED</Text>
      </View>
    );
  }
  return (
    <View style={styles.statusIndicator}>
      <CheckCircle2 size={rf(10)} color="#10B981" />
      <Text style={[styles.statusText, { color: "#10B981" }]}>SETTLED</Text>
    </View>
  );
};

export const BillTable = ({
  bills,
  business,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
}: BillTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const handleWhatsApp = (bill: any) => {
    const phone = formatWhatsAppNumber(bill.customerPhone);
    const origin = "https://billing.kravy.in"; // using live origin
    const pdfUrl = `${origin}/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""
      }`;
    const restaurantName = business?.businessName || "Kravy POS";
    const message = encodeURIComponent(
      "🙏 *Thank you for shopping with us!*\n\n" +
      `Hello *${bill.customerName || "Customer"}*,\n\n` +
      `Here is your invoice from *${restaurantName}*:\n\n` +
      "🧾 *Bill No:* " +
      bill.billNumber +
      "\n" +
      "💰 *Amount Paid:* Rs. " +
      bill.total +
      "\n\n" +
      "📄 *Download Invoice:*\n" +
      pdfUrl +
      "\n\n" +
      "We look forward to serving you again! 😊"
    );
    const url = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    Linking.openURL(url).catch((err) => console.error("An error occurred", err));
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.th, { width: s(40) }]}></Text>
      <Text style={[styles.th, { width: s(40) }]}>#</Text>
      <Text style={[styles.th, { width: s(120) }]}>Date & Time</Text>
      <Text style={[styles.th, { width: s(120) }]}>Bill Info</Text>
      <Text style={[styles.th, { width: s(80) }]}>Token</Text>
      <Text style={[styles.th, { width: s(90) }]}>Type</Text>
      <Text style={[styles.th, { width: s(100) }]}>Items</Text>
      <Text style={[styles.th, { width: s(120) }]}>Customer</Text>
      <Text style={[styles.th, { width: s(100) }]}>Phone</Text>
      <Text style={[styles.th, { width: s(90), textAlign: "right" }]}>Subtotal</Text>
      <Text style={[styles.th, { width: s(80), textAlign: "right", color: "#EF4444" }]}>Disc.</Text>
      <Text style={[styles.th, { width: s(80), textAlign: "right", color: "#F59E0B" }]}>GST</Text>
      <Text style={[styles.th, { width: s(100), textAlign: "right" }]}>Net Total</Text>
      <Text style={[styles.th, { width: s(100) }]}>Payment</Text>
      <Text style={[styles.th, { width: s(80), textAlign: "right" }]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item: bill, index }: any) => {
    const isExpanded = expandedRows.has(bill.id);
    const dt = new Date(bill.createdAt);
    const itemsCount = bill.items?.length || 0;
    const typeLabel = (bill.tableName || "POS") === "POS" ? "Counter" : bill.tableName;
    const isCounter = typeLabel === "Counter";

    return (
      <View style={styles.rowWrapper}>
        <View style={styles.row}>
          {/* Arrow */}
          <TouchableOpacity
            style={[styles.td, { width: s(40), alignItems: "center" }]}
            onPress={() => toggleRow(bill.id)}
          >
            {isExpanded ? (
              <ChevronDown size={rf(16)} color="#9CA3AF" />
            ) : (
              <ChevronRight size={rf(16)} color="#9CA3AF" />
            )}
          </TouchableOpacity>

          {/* S.No */}
          <Text style={[styles.td, { width: s(40), color: "#D1D5DB" }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>

          {/* Date & Time */}
          <View style={[styles.td, { width: s(120) }]}>
            <Text style={styles.dateText}>
              {dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </Text>
            <Text style={styles.timeText}>
              {dt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>

          {/* Bill Info */}
          <View style={[styles.td, { width: s(120), gap: vs(4) }]}>
            <Text style={styles.billNoText}>#{bill.billNumber}</Text>
            <StatusIndicator
              status={bill.isOrder ? bill.orderStatus : bill.paymentStatus || "Paid"}
              isHeld={bill.isHeld}
            />
          </View>

          {/* Token */}
          <View style={[styles.td, { width: s(80) }]}>
            <Text style={{ fontSize: rf(11), fontWeight: "900", color: "#6366F1" }}>
              {bill.tokenNumber ? `#${bill.tokenNumber}` : (bill.kotNumbers && bill.kotNumbers.length > 0 ? `KOT-${bill.kotNumbers[0]}` : "—")}
            </Text>
          </View>

          {/* Type */}
          <View style={[styles.td, { width: s(90) }]}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isCounter ? "rgba(99, 102, 241, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  borderColor: isCounter ? "#6366F1" : "#D97706",
                },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: isCounter ? "#6366F1" : "#D97706" },
                ]}
              >
                {typeLabel}
              </Text>
            </View>
          </View>

          {/* Items */}
          <View style={[styles.td, { width: s(100) }]}>
            <View style={styles.itemsBadge}>
              <Text style={styles.itemsText}>
                {itemsCount} {itemsCount === 1 ? "ITEM" : "ITEMS"}
              </Text>
            </View>
          </View>

          {/* Customer */}
          <Text style={[styles.td, { width: s(120), fontWeight: "800", color: "#1E293B" }]}>
            {bill.customerName || "Walk-in"}
          </Text>

          {/* Phone */}
          <Text style={[styles.td, { width: s(100), color: "#9CA3AF" }]}>
            {bill.customerPhone || "—"}
          </Text>

          {/* Subtotal */}
          <Text style={[styles.td, { width: s(90), textAlign: "right", fontWeight: "600" }]}>
            ₹{formatAmount(bill.subtotal || bill.total)}
          </Text>

          {/* Disc. */}
          <Text style={[styles.td, { width: s(80), textAlign: "right", color: "#EF4444" }]}>
            ₹{formatAmount(bill.discountAmount || 0)}
          </Text>

          {/* GST */}
          <Text style={[styles.td, { width: s(80), textAlign: "right", color: "#F59E0B" }]}>
            ₹{formatAmount(bill.tax || 0)}
          </Text>

          {/* Net Total */}
          <Text style={[styles.td, { width: s(100), textAlign: "right", fontSize: rf(14), fontWeight: "900", color: "#1E293B" }]}>
            ₹{formatAmount(bill.total)}
          </Text>

          {/* Payment */}
          <View style={[styles.td, { width: s(100) }]}>
            <Text style={{ fontSize: rf(10), fontWeight: "800", color: "#64748B" }}>
              {bill.paymentMode || "Cash"}
            </Text>
          </View>

          {/* Actions */}
          <View style={[styles.td, { width: s(80), alignItems: "flex-end" }]}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleWhatsApp(bill)}
            >
              <MessageCircle size={rf(14)} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedHeader}>
              <Text style={styles.expandedTitle}>Detailed Items Breakdown</Text>
              <Text style={styles.expandedSubtitle}>
                Invoice ID: {bill.id.slice(-8).toUpperCase()}
              </Text>
            </View>

            <View style={styles.itemsGrid}>
              {bill.items?.map((it: any, i: number) => {
                const q = Number(it.qty || it.quantity || 0);
                const r = Number(it.rate || it.price || 0);
                return (
                  <View key={i} style={styles.expandedItemRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
                      <View style={styles.qtyBox}>
                        <Text style={styles.qtyText}>{q}x</Text>
                      </View>
                      <View>
                        <Text style={styles.itemNameText}>{it.name}</Text>
                        <Text style={styles.itemPriceText}>
                          Unit Price: ₹{formatAmount(r)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemTotalText}>₹{formatAmount(q * r)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {renderHeader()}
          {bills.map((item, index) => (
            <React.Fragment key={item.id}>
              {renderItem({ item, index })}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Pagination Controls */}
      <View style={styles.paginationRow}>
        <Text style={styles.pageText}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </Text>
        <View style={styles.pageControls}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => onPageChange(currentPage - 1)}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={[styles.pageBtnText, currentPage === 1 && { color: "#9CA3AF" }]}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage * itemsPerPage >= totalItems && styles.pageBtnDisabled]}
            disabled={currentPage * itemsPerPage >= totalItems}
            onPress={() => onPageChange(currentPage + 1)}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={[styles.pageBtnText, currentPage * itemsPerPage >= totalItems && { color: "#9CA3AF" }]}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: vs(12),
  },
  th: {
    paddingHorizontal: s(10),
    fontSize: rf(10),
    fontWeight: "900",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  rowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(12),
  },
  td: {
    paddingHorizontal: s(10),
    fontSize: rf(11),
    fontWeight: "700",
    justifyContent: "center",
  },
  dateText: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#1E293B",
  },
  timeText: {
    fontSize: rf(9),
    fontWeight: "700",
    color: "#9CA3AF",
  },
  billNoText: {
    fontSize: rf(12),
    fontWeight: "900",
    color: "#6366F1",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
  },
  statusText: {
    fontSize: rf(9),
    fontWeight: "800",
  },
  typeBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: rf(9),
    fontWeight: "900",
    textTransform: "uppercase",
  },
  itemsBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: "#E0E7FF",
    alignSelf: "flex-start",
  },
  itemsText: {
    color: "#6366F1",
    fontSize: rf(9),
    fontWeight: "900",
  },
  actionBtn: {
    padding: s(8),
    backgroundColor: "#ECFDF5",
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  expandedContent: {
    backgroundColor: "white",
    marginHorizontal: s(12),
    marginVertical: vs(10),
    padding: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  expandedHeader: {
    marginBottom: vs(12),
  },
  expandedTitle: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#1E293B",
  },
  expandedSubtitle: {
    fontSize: rf(10),
    fontWeight: "700",
    color: "#94A3B8",
  },
  itemsGrid: {
    gap: vs(8),
  },
  expandedItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: s(12),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  qtyBox: {
    width: s(30),
    height: s(30),
    backgroundColor: "white",
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#6366F1",
  },
  itemNameText: {
    fontSize: rf(12),
    fontWeight: "800",
    color: "#1E293B",
  },
  itemPriceText: {
    fontSize: rf(9),
    fontWeight: "700",
    color: "#94A3B8",
  },
  itemTotalText: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#1E293B",
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(16),
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  pageText: {
    fontSize: rf(10),
    fontWeight: "700",
    color: "#64748B",
  },
  pageControls: {
    flexDirection: "row",
    gap: s(8),
  },
  pageBtn: {
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    backgroundColor: "#EEF2FF",
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  pageBtnDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F1F5F9",
  },
  pageBtnText: {
    fontSize: rf(10),
    fontWeight: "800",
    color: "#6366F1",
  },
});
