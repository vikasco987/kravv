import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface StockAlertBannerProps {
  criticalCount: number;
  onPress: () => void;
}

const StockAlertBanner = ({
  criticalCount,
  onPress,
}: StockAlertBannerProps) => {
  if (criticalCount === 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Feather name="alert-circle" size={rf(18)} color="#EF4444" />
        </View>
        <Text style={styles.text}>
          <Text style={styles.bold}>{criticalCount} items</Text> are running low
          on stock.
        </Text>
      </View>
      <Feather name="chevron-right" size={rf(18)} color="#EF4444" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: s(15),
    padding: s(12),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: vs(10),
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(10),
  },
  text: {
    fontSize: rf(14),
    color: "#B91C1C",
    flex: 1,
  },
  bold: {
    fontWeight: "bold",
  },
});

export default StockAlertBanner;
