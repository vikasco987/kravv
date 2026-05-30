import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

const screenWidth = Dimensions.get('window').width;

const WebWeeklyChart = ({ data = [] }) => {
  // data should be an array of { day: 'Mon', revenue: 1200, orders: 12 }
  const chartData = data.length > 0 ? data : Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, revenue: 0, orders: 0 }));

  const maxRev = Math.max(...chartData.map(d => d.revenue)) || 1;
  const maxOrd = Math.max(...chartData.map(d => d.orders)) || 1;
  const BAR_MAX_HEIGHT = vs(160);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly revenue (last 7 days)</Text>

      {/* Custom Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Orders</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
        {chartData.map((d, index) => {
          const revHeight = (d.revenue / maxRev) * BAR_MAX_HEIGHT;
          const ordHeight = (d.orders / maxOrd) * BAR_MAX_HEIGHT;

          return (
            <View key={index} style={styles.columnWrapper}>
              <View style={styles.barsContainer}>
                {/* Revenue Bar */}
                <View style={styles.barWrapper}>
                  {d.revenue > 0 && (
                    <Text style={[styles.valueText, { color: '#3B82F6' }]} numberOfLines={1}>
                      ₹{d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : Math.round(d.revenue)}
                    </Text>
                  )}
                  <View style={[styles.bar, styles.revBar, { height: revHeight || 4 }]} />
                </View>

                {/* Orders Bar */}
                <View style={styles.barWrapper}>
                  {d.orders > 0 && (
                    <Text style={[styles.valueText, { color: '#10B981' }]}>
                      {Math.round(d.orders)}
                    </Text>
                  )}
                  <View style={[styles.bar, styles.ordBar, { height: ordHeight || 4 }]} />
                </View>
              </View>

              <Text style={styles.dayText}>{d.day}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: s(24),
    paddingHorizontal: s(16),
    paddingVertical: s(20),
    marginBottom: vs(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  title: {
    fontSize: rf(14),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: vs(20),
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(16),
    marginBottom: vs(20),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  legendDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
  },
  legendText: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#475569',
  },
  chartScroll: {
    alignItems: 'flex-end',
    paddingBottom: vs(10),
    gap: s(15),
    paddingRight: s(20),
  },
  columnWrapper: {
    alignItems: 'center',
    width: s(60),
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: vs(190),
    gap: s(6),
    marginBottom: vs(12),
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: s(22),
  },
  bar: {
    width: s(14),
    borderTopLeftRadius: s(4),
    borderTopRightRadius: s(4),
  },
  revBar: {
    backgroundColor: '#3B82F6',
  },
  ordBar: {
    backgroundColor: '#10B981',
  },
  valueText: {
    fontSize: rf(8),
    fontWeight: '800',
    marginBottom: vs(6),
    textAlign: 'center',
  },
  dayText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: '#64748B',
  }
});

export default WebWeeklyChart;
