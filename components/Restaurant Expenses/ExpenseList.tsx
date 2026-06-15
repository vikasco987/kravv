import { Edit3, Trash2 } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

interface ExpenseListProps {
  loading: boolean;
  expenses: any[];
  onEdit: (exp: any) => void;
  onDelete: (id: string, description: string) => void;
}

export default function ExpenseList({ loading, expenses, onEdit, onDelete }: ExpenseListProps) {
  if (loading) {
    return <ActivityIndicator size="large" color="#E11D48" style={{ marginTop: vs(50) }} />;
  }

  return (
    <View style={styles.tableContainerWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: s(80) }]}>Date</Text>
            <Text style={[styles.headerCell, { width: s(120) }]}>Category</Text>
            <Text style={[styles.headerCell, { width: s(160) }]}>Description</Text>
            <Text style={[styles.headerCell, { width: s(80) }]}>Mode</Text>
            <Text style={[styles.headerCell, { width: s(100), textAlign: 'right' }]}>Amount</Text>
            <Text style={[styles.headerCell, { width: s(80), textAlign: 'center' }]}>Actions</Text>
          </View>

          {/* Table Body */}
          <ScrollView style={styles.tableBody} contentContainerStyle={{ paddingBottom: vs(100) }}>
            {expenses.map((exp, index) => (
              <View key={exp.id} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.cell, { width: s(80), color: '#64748B' }]}>{exp.date ? exp.date.substring(0, 10) : ''}</Text>
                <View style={{ width: s(120), flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText} numberOfLines={1}>{exp.category}</Text>
                  </View>
                </View>
                <Text style={[styles.cell, { width: s(160) }]} numberOfLines={1}>{exp.description || "-"}</Text>
                <Text style={[styles.cell, { width: s(80), color: '#475569' }]}>{exp.paymentMode}</Text>
                <Text style={[styles.cell, { width: s(100), textAlign: 'right', fontWeight: '800', color: '#0F172A' }]}>₹{exp.amount.toLocaleString()}</Text>
                <View style={{ width: s(80), flexDirection: 'row', justifyContent: 'center', gap: s(10) }}>
                  <TouchableOpacity onPress={() => onEdit(exp)} style={styles.actionIconBtn}>
                    <Edit3 size={rf(16)} color="#4F46E5" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(exp.id, exp.description || '')} style={styles.actionIconBtn}>
                    <Trash2 size={rf(16)} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {expenses.length === 0 && (
              <View style={{ padding: s(40), alignItems: 'center', width: s(620) }}>
                <Text style={{ color: '#94A3B8', fontSize: rf(14) }}>No expenses found.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainerWrapper: {
    marginHorizontal: s(20),
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flex: 1
  },
  tableContainer: {
    minWidth: s(620), // Ensures it scrolls horizontally on small screens instead of squishing
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: vs(12),
    paddingHorizontal: s(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerCell: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableBody: {
    maxHeight: vs(500),
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(15),
    paddingHorizontal: s(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  rowEven: { backgroundColor: '#FFFFFF' },
  rowOdd: { backgroundColor: '#F8FAFC' },
  cell: {
    fontSize: rf(13),
    color: '#334155',
    fontWeight: '500'
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignSelf: 'flex-start'
  },
  categoryBadgeText: {
    color: '#4F46E5',
    fontSize: rf(10),
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  actionIconBtn: {
    padding: s(5)
  }
});
