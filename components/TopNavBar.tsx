import { Feather, Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRefresh } from "../context/RefreshContext";
import { rf, s, vs } from "../utils/responsive";

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
  
  const handleReload = () => {
    triggerRefresh();
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery("");
    }
  };

  return (
    <View style={styles.container}>
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
            {showSearch && (
              <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
                <Ionicons name="search" size={rf(26)} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleReload} style={styles.iconButton}>
              <Ionicons name="refresh" size={rf(28)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="headset-outline" size={rf(26)} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
