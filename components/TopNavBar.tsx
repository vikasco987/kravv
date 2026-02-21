import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

const THEME_PRIMARY = "#4F46E5";

export default function TopNavBar({ title = "Home" }) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Left: Menu Button */}
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconButton}>
        <Feather name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Center: Title */}
      <View style={styles.titleGroup}>
        <Text style={styles.mainTitle}>{title}</Text>
        <Text style={styles.infoText}>FAST v38.23 | 9289507882 | 1630</Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.actionGroup}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="reload-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="headset-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: THEME_PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 100,
  },
  iconButton: { padding: 5 },
  titleGroup: { flex: 1, marginLeft: 10 },
  mainTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  infoText: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
    justifyContent: "space-between",
  },
});
