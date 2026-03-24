import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";
import DailyItemSalesReport from './DailyItemSalesReport';
import WeeklyItemSalesReport from './WeeklyItemSalesReport';
import MonthlyItemSalesReport from './MonthlyItemSalesReport';

const ItemSalesReport = ({ onBack }: { onBack: () => void }) => {
  const [activeReport, setActiveReport] = React.useState<string | null>(null);

  if (activeReport === 'daily') return <DailyItemSalesReport onBack={() => setActiveReport(null)} />;
  if (activeReport === 'weekly') return <WeeklyItemSalesReport onBack={() => setActiveReport(null)} />;
  if (activeReport === 'monthly') return <MonthlyItemSalesReport onBack={() => setActiveReport(null)} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Basic Header */}
      <View style={{
        height: vs(100),
        paddingTop: vs(30),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(20),
        backgroundColor: '#4F46E5'
      }}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={rf(28)} color="#fff" />
        </TouchableOpacity>
        <Text style={{
          marginLeft: s(20),
          color: '#fff',
          fontSize: rf(20),
          fontWeight: 'bold'
        }}>Item Sales Report</Text>
      </View>

      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => setActiveReport('daily')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="stats-chart" size={rf(24)} color="#4F46E5" />
          </View>
          <Text style={styles.menuText}>Daily Item Sales Report</Text>
          <Ionicons name="chevron-forward" size={rf(20)} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: vs(15) }]} 
          onPress={() => setActiveReport('weekly')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="calendar" size={rf(24)} color="#0284C7" />
          </View>
          <Text style={styles.menuText}>Weekly Item Sales Report</Text>
          <Ionicons name="chevron-forward" size={rf(20)} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: vs(15) }]} 
          onPress={() => setActiveReport('monthly')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="pie-chart" size={rf(24)} color="#16A34A" />
          </View>
          <Text style={styles.menuText}>Monthly Item Sales Report</Text>
          <Ionicons name="chevron-forward" size={rf(20)} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: s(20),
  },
  menuItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(15),
    borderRadius: s(12),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: s(45),
    height: s(45),
    borderRadius: s(10),
    backgroundColor: '#F3F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(15),
  },
  menuText: {
    flex: 1,
    fontSize: rf(16),
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default ItemSalesReport;
