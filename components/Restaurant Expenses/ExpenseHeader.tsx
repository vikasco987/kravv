import { ArrowUpRight, Banknote, BarChart3, IndianRupee, Plus, Scale, Search, Settings, ShoppingCart, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface ExpenseHeaderProps {
  onBack: () => void;
  onOpenAdd: () => void;
  onOpenCategory: () => void;
  totalExpense: number;
  entryCount: number;
  primaryMode: string;
  searchQuery: string;
  onSearch: (text: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  categories: any[];
  onOpenPnL: () => void;
  onOpenReports: () => void;
}

export default function ExpenseHeader({
  onOpenAdd,
  onOpenCategory,
  onBack,
  totalExpense,
  entryCount,
  primaryMode,
  searchQuery,
  onSearch,
  filterCategory,
  setFilterCategory,
  categories,
  onOpenPnL,
  onOpenReports
}: ExpenseHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <X size={rf(20)} color="#334155" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IndianRupee size={rf(20)} color="#E11D48" />
              <Text style={styles.headerTitle} numberOfLines={1}> Restaurant Expenses</Text>
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Track your daily operational costs</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtnLight} onPress={onOpenCategory}>
            <Settings size={rf(14)} color="#475569" />
            <Text style={styles.actionBtnTextLight}> Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtnLight, { backgroundColor: '#F1F5F9' }]} onPress={onOpenReports}>
            <BarChart3 size={rf(14)} color="#475569" />
            <Text style={styles.actionBtnTextLight}> Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtnRose, { backgroundColor: '#10B981' }]} onPress={onOpenPnL}>
            <Scale size={rf(14)} color="#FFF" />
            <Text style={styles.actionBtnTextRose}> P&L</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnRose} onPress={onOpenAdd}>
            <Plus size={rf(14)} color="#FFF" />
            <Text style={styles.actionBtnTextRose}> Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3 Stats Cards - Horizontally Scrollable on Mobile, fixed on Tablet */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          {/* Card 1: Total Spending */}
          <View style={[styles.statCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1 }]}>
            <Text style={styles.statLabel}>Total Spending</Text>
            <Text style={styles.statValue}>₹{totalExpense.toLocaleString()}</Text>
            <View style={styles.statIcon}><ArrowUpRight size={rf(32)} color="#E11D48" opacity={0.2} /></View>
          </View>

          {/* Card 2: Entries Count */}
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
            <Text style={[styles.statLabel, { color: '#4F46E5' }]}>Entries Count</Text>
            <Text style={[styles.statValue, { color: '#312E81' }]}>{entryCount} Records</Text>
            <View style={styles.statIcon}><ShoppingCart size={rf(32)} color="#4F46E5" opacity={0.2} /></View>
          </View>

          {/* Card 3: Primary Mode */}
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1 }]}>
            <Text style={[styles.statLabel, { color: '#D97706' }]}>Primary Mode</Text>
            <Text style={[styles.statValue, { color: '#92400E' }]}>{primaryMode}</Text>
            <View style={styles.statIcon}><Banknote size={rf(32)} color="#D97706" opacity={0.2} /></View>
          </View>
        </ScrollView>
      </View>

      {/* Search & Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Search size={rf(16)} color="#94A3B8" style={{ marginLeft: s(10) }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={onSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: s(20) }}>
          <TouchableOpacity onPress={() => setFilterCategory("All")} style={[styles.filterChip, filterCategory === "All" && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filterCategory === "All" && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id || cat.name} onPress={() => setFilterCategory(cat.name)} style={[styles.filterChip, filterCategory === cat.name && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filterCategory === cat.name && styles.filterChipTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: s(20),
    paddingBottom: s(20),
    paddingTop: vs(50), // Added extra top padding to move it down
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: isTablet ? 'space-between' : 'flex-start',
    alignItems: isTablet ? 'center' : 'stretch',
    gap: vs(15)
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: isTablet ? 1 : undefined,
  },
  titleContainer: {
    flex: 1,
  },
  backBtn: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: s(15) },
  headerTitle: { fontSize: rf(20), fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: rf(10), fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginTop: vs(2), marginLeft: s(25) },
  headerActions: { flexDirection: 'row', gap: s(10), alignItems: 'center', alignSelf: isTablet ? 'center' : 'flex-end' },
  actionBtnLight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: s(15), height: vs(42), borderRadius: s(12) },
  actionBtnTextLight: { color: '#475569', fontSize: rf(11), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: s(5) },
  actionBtnRose: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E11D48', paddingHorizontal: s(15), height: vs(42), borderRadius: s(12) },
  actionBtnTextRose: { color: '#FFF', fontSize: rf(11), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: s(5) },

  statsRow: { paddingHorizontal: s(20), gap: s(15), paddingBottom: vs(20) },
  statCard: { width: isTablet ? s(200) : s(180), padding: s(20), borderRadius: s(16), overflow: 'hidden' },
  statLabel: { fontSize: rf(10), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: vs(8) },
  statValue: { fontSize: rf(22), fontWeight: '800' },
  statIcon: { position: 'absolute', right: -s(10), top: -vs(10), padding: s(20) },

  filterSection: { paddingVertical: vs(10), backgroundColor: '#FFFFFF' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: s(20), borderRadius: s(12), height: vs(45), marginBottom: vs(15) },
  searchInput: { flex: 1, height: '100%', color: '#0F172A', paddingHorizontal: s(10), fontSize: rf(14) },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: s(16), height: vs(36), borderRadius: s(18), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: s(10) },
  filterChipActive: { backgroundColor: '#0F172A' },
  filterChipText: { fontSize: rf(10), fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  filterChipTextActive: { color: '#FFFFFF' },
});
