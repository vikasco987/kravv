import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, LayoutAnimation, UIManager, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const COLORS = {
  bg: '#F9FAFB',
  rowBg: '#FFFFFF',
  headerText: '#6B7280',
  text: '#111827',
  textDim: '#4B5563',
  border: '#E5E7EB',
  typeDineIn: '#D1FAE5', // light green bg
  typeDineInText: '#065F46', // dark green text
  typeTakeaway: '#FFEDD5', // light orange bg
  typeTakeawayText: '#9A3412', // dark orange text
  typeDelivery: '#DBEAFE', // light blue bg
  typeDeliveryText: '#1E40AF', // dark blue text
  payCash: '#DCFCE7', // light green
  payCashText: '#166534',
  payUpi: '#F3E8FF', // light purple
  payUpiText: '#6B21A8',
  statusPaid: '#D1FAE5',
  statusPaidText: '#065F46',
  statusCancelled: '#FEE2E2',
  statusCancelledText: '#991B1B',
  brand: '#4F46E5', // For header back button
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getTypeStyle = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('dine')) return { bg: COLORS.typeDineIn, text: COLORS.typeDineInText };
  if (t.includes('takeaway') || t.includes('take away')) return { bg: COLORS.typeTakeaway, text: COLORS.typeTakeawayText };
  if (t.includes('delivery')) return { bg: COLORS.typeDelivery, text: COLORS.typeDeliveryText };
  return { bg: '#E5E7EB', text: '#374151' };
};

const getPayStyle = (pay) => {
  const p = (pay || '').toLowerCase();
  if (p.includes('cash')) return { bg: COLORS.payCash, text: COLORS.payCashText };
  if (p.includes('upi') || p.includes('online')) return { bg: COLORS.payUpi, text: COLORS.payUpiText };
  return { bg: '#E5E7EB', text: '#374151' };
};

const getStatusStyle = (status) => {
  const sStr = (status || 'paid').toLowerCase();
  if (sStr.includes('cancel')) return { bg: COLORS.statusCancelled, text: COLORS.statusCancelledText };
  return { bg: COLORS.statusPaid, text: COLORS.statusPaidText };
};

const BillRow = ({ bill, index, expanded, toggleExpand }) => {
  const typeStyle = getTypeStyle(bill.orderType);
  const payStyle = getPayStyle(bill.paymentMethod);
  const statusStyle = getStatusStyle(bill.status);

  return (
    <View style={styles.rowContainer}>
      <TouchableOpacity 
        style={[styles.mainRow, expanded && styles.mainRowExpanded]} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.cellText, styles.colToken]}>#{bill.tokenNo || index + 1}</Text>
        <Text style={[styles.cellText, styles.colBillNo]} numberOfLines={1}>{bill.billNumber || bill.billNo || bill.invoiceNo || bill._id || 'N/A'}</Text>
        <Text style={[styles.cellText, styles.colTime]}>{formatTime(bill.createdAt)}</Text>
        
        <View style={styles.colType}>
          <View style={[styles.chip, { backgroundColor: typeStyle.bg }]}>
            <Text style={[styles.chipText, { color: typeStyle.text }]}>{bill.orderType || 'Dine-in'}</Text>
          </View>
        </View>

        <View style={styles.colPayment}>
          <View style={[styles.chip, { backgroundColor: payStyle.bg }]}>
            <Text style={[styles.chipText, { color: payStyle.text }]}>{bill.paymentMethod || 'Cash'}</Text>
          </View>
        </View>

        <Text style={[styles.cellText, styles.colAmount]}>₹{Number(bill.total || 0).toFixed(2).replace(/\.00$/, '')}</Text>

        <View style={styles.colStatus}>
          <View style={[styles.chip, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.chipText, { color: statusStyle.text }]}>{bill.status || 'Paid'}</Text>
          </View>
          <Ionicons 
            name={expanded ? "caret-down" : "caret-forward"} 
            size={rf(14)} 
            color={COLORS.textDim} 
            style={{ marginLeft: s(8) }} 
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Items */}
          {(bill.items || []).map((item, idx) => (
            <View key={idx} style={styles.expandedRow}>
              <Text style={styles.expandedItemName}>{item.name} x{item.qty || item.quantity || 1}</Text>
              <Text style={styles.expandedItemValue}>₹{Number((item.qty || item.quantity || 1) * (item.rate || item.price || 0)).toFixed(2).replace(/\.00$/, '')}</Text>
            </View>
          ))}
          
          {/* Extra Charges */}
          {Number(bill.deliveryCharge || 0) > 0 && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedItemName}>Delivery</Text>
              <Text style={styles.expandedItemValue}>₹{Number(bill.deliveryCharge).toFixed(2).replace(/\.00$/, '')}</Text>
            </View>
          )}
          {Number(bill.packagingCharge || 0) > 0 && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedItemName}>Packaging</Text>
              <Text style={styles.expandedItemValue}>₹{Number(bill.packagingCharge).toFixed(2).replace(/\.00$/, '')}</Text>
            </View>
          )}
          {Number(bill.serviceCharge || 0) > 0 && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedItemName}>Service Charge</Text>
              <Text style={styles.expandedItemValue}>₹{Number(bill.serviceCharge).toFixed(2).replace(/\.00$/, '')}</Text>
            </View>
          )}
          {Number(bill.gstAmount || 0) > 0 && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedItemName}>GST</Text>
              <Text style={styles.expandedItemValue}>₹{Number(bill.gstAmount).toFixed(2).replace(/\.00$/, '')}</Text>
            </View>
          )}
          {Number(bill.discount || 0) > 0 && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedItemName}>Discount</Text>
              <Text style={styles.expandedItemValue}>-₹{Number(bill.discount).toFixed(2).replace(/\.00$/, '')}</Text>
            </View>
          )}
          
          {/* Divider */}
          <View style={styles.expandedDivider} />

          {/* Grand Total */}
          <View style={styles.expandedRow}>
            <Text style={styles.grandTotalLabel}>Grand total</Text>
            <Text style={styles.grandTotalValue}>₹{Number(bill.total || 0).toFixed(2).replace(/\.00$/, '')}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const DetailedBillListView = ({ onBack, allBills, filterType, filterKey, title }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((Number(d) - Number(yearStart)) / 86400000) + 1) / 7);
  };

  const filteredBills = useMemo(() => {
    if (!allBills || !filterKey) return [];
    
    // Sort bills initially so newest is top, or token based
    const sorted = [...allBills].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return sorted.filter((bill) => {
      // Filter out held bills
      if (bill.isHeld === true) return false;

      const d = new Date(bill.createdAt);
      if (filterType === 'daily') {
        const dateKey = d.toISOString().split('T')[0];
        return dateKey === filterKey;
      } else if (filterType === 'weekly') {
        const week = getWeekNumber(d);
        const key = `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        return key === filterKey;
      } else if (filterType === 'monthly') {
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        return key === filterKey;
      }
      return true;
    });
  }, [allBills, filterType, filterKey]);

  const toggleRow = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: s(5) }}>
          <Ionicons name="arrow-back" size={rf(26)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Sales Details'}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
        <View style={{ minWidth: 750 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerColText, styles.colToken]}>Token</Text>
            <Text style={[styles.headerColText, styles.colBillNo]}>Bill no</Text>
            <Text style={[styles.headerColText, styles.colTime]}>Time</Text>
            <Text style={[styles.headerColText, styles.colType]}>Type</Text>
            <Text style={[styles.headerColText, styles.colPayment]}>Payment</Text>
            <Text style={[styles.headerColText, styles.colAmount]}>Amount</Text>
            <Text style={[styles.headerColText, styles.colStatus]}>Status</Text>
          </View>

          <FlatList
            data={filteredBills}
            keyExtractor={(item, index) => item._id || item.id || String(index)}
            contentContainerStyle={{ paddingBottom: vs(50) }}
            renderItem={({ item, index }) => (
              <BillRow 
                bill={item} 
                index={index}
                expanded={expandedRow === (item._id || item.id || String(index))}
                toggleExpand={() => toggleRow(item._id || item.id || String(index))}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No bills found for this selection.</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    paddingTop: vs(30),
    paddingBottom: vs(15),
    paddingHorizontal: s(15),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: rf(20),
    fontWeight: 'bold',
    marginLeft: s(15),
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: vs(12),
    paddingHorizontal: s(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerColText: {
    color: COLORS.headerText,
    fontSize: rf(13),
    fontWeight: '600',
  },
  rowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.rowBg,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: s(15),
  },
  mainRowExpanded: {
    backgroundColor: COLORS.bg,
  },
  cellText: {
    color: COLORS.text,
    fontSize: rf(14),
    fontWeight: '500',
  },
  // Column widths
  colToken: { width: 70 },
  colBillNo: { width: 160 },
  colTime: { width: 80 },
  colType: { width: 120, alignItems: 'flex-start' },
  colPayment: { width: 110, alignItems: 'flex-start' },
  colAmount: { width: 90, fontWeight: 'bold' },
  colStatus: { width: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  
  chip: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: rf(11),
    fontWeight: '700',
  },
  expandedContent: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: s(15),
    paddingBottom: vs(15),
    paddingTop: vs(5),
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(6),
  },
  expandedItemName: {
    color: COLORS.textDim,
    fontSize: rf(14),
  },
  expandedItemValue: {
    color: COLORS.text,
    fontSize: rf(14),
    fontWeight: '600',
  },
  expandedDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: vs(10),
  },
  grandTotalLabel: {
    color: COLORS.text,
    fontSize: rf(16),
    fontWeight: 'bold',
  },
  grandTotalValue: {
    color: COLORS.text,
    fontSize: rf(16),
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: s(40),
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: rf(16),
  }
});

export default DetailedBillListView;
