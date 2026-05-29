import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

const BillCardContainer = ({ title, bills, icon, accentColor, deleted = false }) => {
  const formatNum = (num) => new Intl.NumberFormat("en-IN").format(Math.round(num || 0));
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
            <MaterialCommunityIcons name={icon} size={rf(18)} color={accentColor} />
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.recordText}>{bills.length} record{bills.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View style={styles.expandBtn}>
          <MaterialCommunityIcons name="arrow-expand-all" size={rf(14)} color="#64748B" />
        </View>
      </View>

      <ScrollView nestedScrollEnabled style={styles.listContainer}>
        {bills.length === 0 ? (
          <Text style={styles.emptyText}>📭 No records found</Text>
        ) : (
          bills.map((bill, i) => {
            let items = bill.items;
            if (typeof items === "string") {
              try { items = JSON.parse(items); } catch { items = []; }
            }
            if (items && !Array.isArray(items) && items.items) items = items.items;

            const isUPI = (bill.paymentMode || "").toLowerCase().includes('upi');

            return (
              <View key={i} style={styles.billBox}>
                <View style={styles.billTopRow}>
                  <View style={styles.billNumContainer}>
                    <Text style={styles.billNum}>#{bill.billNumber || 'N/A'}</Text>
                    {bill.tokenNumber && (
                      <View style={styles.tokenBadge}>
                        <Text style={styles.tokenText}>T-{String(bill.tokenNumber).padStart(2, '0')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.billTotal, deleted && { color: "#EF4444" }]}>₹{formatNum(bill.total)}</Text>
                </View>

                {/* Items */}
                <View style={styles.itemsWrapper}>
                  {Array.isArray(items) && items.map((it, idx) => (
                    <View key={idx} style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{it.name} x{it.quantity || it.qty || 1}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.billBottomRow}>
                  <View style={styles.customerRow}>
                    <Text style={styles.customerName}>{bill.customerName || "Walk-in"}</Text>
                    <View style={[styles.paymentBadge, isUPI ? styles.badgeUpi : styles.badgeCash]}>
                      <MaterialCommunityIcons name={isUPI ? "cellphone" : "cash"} size={rf(8)} color={isUPI ? "#6366F1" : "#10B981"} />
                      <Text style={[styles.paymentText, isUPI ? { color: "#6366F1" } : { color: "#10B981" }]}>
                        {bill.paymentMode || "CASH"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timeText}>{formatTime(bill.createdAt || bill.date || bill.deletedAt)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const WebRecentBills = ({ recentBills = [], deletedBills = [] }) => {
  return (
    <View style={styles.container}>
      <BillCardContainer
        title="Recent Sales"
        bills={recentBills}
        icon="receipt"
        accentColor="#6366F1"
      />
      <BillCardContainer
        title="Deleted History"
        bills={deletedBills}
        icon="history"
        accentColor="#EF4444"
        deleted={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: vs(15),
    marginBottom: vs(15),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: s(24),
    padding: s(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(15),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  iconBox: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: rf(14),
    fontWeight: '900',
    color: '#1E293B',
  },
  recordText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: '#64748B',
  },
  expandBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    maxHeight: vs(350),
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: vs(40),
    color: '#94A3B8',
    fontSize: rf(12),
  },
  billBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: s(16),
    padding: s(15),
    marginBottom: vs(10),
    gap: vs(10),
  },
  billTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  billNumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  billNum: {
    fontSize: rf(12),
    fontWeight: '900',
    color: '#6366F1',
    fontFamily: 'monospace',
  },
  tokenBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
  },
  tokenText: {
    fontSize: rf(9),
    fontWeight: '900',
    color: '#10B981',
  },
  billTotal: {
    fontSize: rf(14),
    fontWeight: '900',
    color: '#1E293B',
  },
  itemsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(4),
  },
  itemTag: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
  },
  itemTagText: {
    fontSize: rf(8),
    fontWeight: '700',
    color: '#475569',
  },
  billBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: vs(8),
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  customerName: {
    fontSize: rf(10),
    fontWeight: '800',
    color: '#475569',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(20),
    borderWidth: 1,
  },
  badgeUpi: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  badgeCash: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  paymentText: {
    fontSize: rf(8),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: rf(9),
    fontWeight: '600',
    color: '#94A3B8',
  }
});

export default WebRecentBills;
