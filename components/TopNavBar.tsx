import { Feather, Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { useNavigation, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRefresh } from "../context/RefreshContext";
import { rf, s, vs } from "../utils/responsive";

const THEME_PRIMARY = "#4F46E5";

interface TopNavBarProps {
  title?: string;
  showBack?: boolean;
}

export default function TopNavBar({ title = "Home", showBack = false }: TopNavBarProps) {
  const navigation = useNavigation();
  const router = useRouter();

  const { triggerRefresh } = useRefresh();
  const handleReload = () => {
    // This will increment the global refresh signal
    triggerRefresh();
  };

  return (
    <View style={styles.container}>
      {/* Left: Menu / Back Button */}
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={rf(26)} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={styles.iconButton}>
          <Feather name="menu" size={rf(24)} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Center: Title */}
      <View style={styles.titleGroup}>
        <Text style={styles.mainTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.infoText} numberOfLines={1}>FAST v38.23 | 9289507882 | 1630</Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.actionGroup}>
        <TouchableOpacity onPress={handleReload} style={styles.iconButton}>
          <Ionicons name="refresh" size={rf(28)} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="headset-outline" size={rf(26)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: vs(40),
    paddingHorizontal: s(10),
    backgroundColor: THEME_PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: vs(100),
  },
  iconButton: { padding: s(5) },
  titleGroup: { flex: 1, marginLeft: s(10) },
  mainTitle: { fontSize: rf(22), fontWeight: "900", color: "#fff" },
  infoText: { fontSize: rf(12), color: "rgba(255,255,255,0.8)" },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: s(80),
    justifyContent: "space-between",
  },
});
