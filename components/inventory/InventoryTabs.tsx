import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface InventoryTabsProps {
  activeTab: "products" | "materials" | "reports";
  onTabChange: (tab: "products" | "materials" | "reports") => void;
}

const InventoryTabs = ({ activeTab, onTabChange }: InventoryTabsProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "products" && styles.activeTab]}
        onPress={() => onTabChange("products")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "products" && styles.activeTabText,
          ]}
        >
          Products
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "materials" && styles.activeTab]}
        onPress={() => onTabChange("materials")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "materials" && styles.activeTabText,
          ]}
        >
          Materials
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "reports" && styles.activeTab]}
        onPress={() => onTabChange("reports")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "reports" && styles.activeTabText,
          ]}
        >
          Reports
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    marginHorizontal: s(15),
    borderRadius: s(12),
    padding: s(4),
    marginBottom: vs(10),
  },
  tab: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: "center",
    borderRadius: s(10),
  },
  activeTab: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: rf(14),
    fontWeight: "500",
    color: "#64748B",
  },
  activeTabText: {
    color: "#4F46E5",
    fontWeight: "bold",
  },
});

export default InventoryTabs;
