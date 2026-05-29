import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { rf, s, vs } from '../../utils/responsive';

const screenWidth = Dimensions.get('window').width;

const WebWeeklyChart = ({ data = [] }) => {
  // data should be an array of { day: 'Mon', revenue: 1200, orders: 12 }
  // Pad if empty
  const chartData = data.length > 0 ? data : Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, revenue: 0, orders: 0 }));

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Purple 500
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: { fontSize: rf(9) }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly Revenue Trend</Text>
      <Text style={styles.subTitle}>Performance over the last 7 days</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={{
            labels: chartData.map(d => d.day),
            datasets: [{ data: chartData.map(d => d.revenue) }]
          }}
          width={Math.max(screenWidth - s(30), chartData.length * 45)}
          height={vs(200)}
          yAxisLabel="₹"
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: s(16),
    padding: s(15),
    marginBottom: vs(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  title: {
    fontSize: rf(13),
    fontWeight: '900',
    color: '#1E293B',
  },
  subTitle: {
    fontSize: rf(10),
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: vs(15),
    marginTop: vs(2),
  },
  chart: {
    borderRadius: s(12),
  }
});

export default WebWeeklyChart;
