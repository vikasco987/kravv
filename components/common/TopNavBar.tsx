import { Feather, Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";

interface TopNavBarProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
}

export default function TopNavBar({ title = "Home", showBack = false, showSearch = false }: TopNavBarProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const { triggerRefresh, searchQuery, setSearchQuery } = useRefresh();

  // Animation Value for Refresh Icon
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleReload = () => {
    // 1. Start Rotation Animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();

    // 2. Original Logic
    triggerRefresh();
  };

  // Rotation Interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery("");
    }
  };

  return (
    <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.container}>
      {isSearching ? (
        <View style={styles.searchBarWrapper}>
          <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={rf(26)} color="#fff" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search Menu..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.iconButton}>
              <Ionicons name="close" size={rf(26)} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* Left: Menu / Back Button */}
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={rf(26)} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={styles.menuIconButton}>
              <Feather name="menu" size={rf(20)} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Center: Title */}
          <View style={styles.titleGroup}>
            <Text style={styles.mainTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.infoText} numberOfLines={1}>FAST v38.23 | 9289507882 | 1630</Text>
          </View>

          {/* Right: Actions */}
          <View style={styles.actionGroup}>
            {showSearch && (
              <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
                <Ionicons name="search" size={rf(26)} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleReload} style={styles.iconButton}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={rf(28)} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="headset-outline" size={rf(26)} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: vs(40),
    paddingHorizontal: s(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: vs(100),
    borderBottomLeftRadius: s(15),
    borderBottomRightRadius: s(15),
  },
  iconButton: { padding: s(5) },
  menuIconButton: {
    width: s(40),
    height: s(40),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: s(10),
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleGroup: { flex: 1, marginLeft: s(15) },
  mainTitle: { fontSize: rf(22), fontWeight: "900", color: "#fff" },
  infoText: { fontSize: rf(12), color: "rgba(255,255,255,0.8)" },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: s(120),
    justifyContent: "space-between",
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: s(10),
    paddingHorizontal: s(5),
    height: vs(50),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: rf(18),
    fontWeight: '600',
    marginLeft: s(10),
  },
});
