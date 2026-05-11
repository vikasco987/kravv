import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import InventoryDashboard from "./InventoryDashboard";

interface MainInventoryViewProps {
  onBack: () => void;
}

const MainInventoryView = ({ onBack }: MainInventoryViewProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rf(24)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Management</Text>
      </View>
      <View style={styles.container}>
        <InventoryDashboard />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(15),
    paddingTop: vs(50),
    paddingBottom: vs(15),
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    marginRight: s(15),
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#333",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});

export default MainInventoryView;
