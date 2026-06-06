import { Ionicons } from "@expo/vector-icons";
import { DrawerItem } from "@react-navigation/drawer";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";

interface SidebarItemsProps {
  t: (key: string) => string;
  navigation: any;
  isSignedIn: boolean;
  onAction: (type: string) => void;
  onLogout: () => void;
}

const SidebarItems = ({
  t,
  navigation,
  isSignedIn,
  onAction,
  onLogout,
}: SidebarItemsProps) => {
  const { canAccessSync, isOwner } = useStaffPermissions();
  const [accessDeniedInfo, setAccessDeniedInfo] = useState({ visible: false, permission: "" });

  const COLORS = {
    primary: "#6D28D9",
    primaryLight: "#F5F3FF",
    textDark: "#334155",
    textMuted: "#64748B",
    danger: "#EF4444",
    lock: "#94A3B8",
  };

  const checkAndNavigate = (
    permission: string,
    screen: string,
    params?: any,
  ) => {
    if (!isSignedIn) {
      onAction(screen);
      return;
    }

    if (canAccessSync(permission)) {
      if (screen.startsWith("(")) {
        navigation.navigate(screen, params);
      } else {
        onAction(screen);
      }
    } else {
      setAccessDeniedInfo({ visible: true, permission });
    }
  };

  const renderNavIcon = (name: any, focused: boolean, permission: string, badge?: number) => {
    const hasAccess = canAccessSync(permission);
    const color = focused ? COLORS.primary : COLORS.textMuted;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", width: s(24) }}>
        <Ionicons name={name} size={rf(20)} color={hasAccess ? color : COLORS.lock} />
        {!hasAccess && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={rf(10)} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderNavLabel = (label: string, focused: boolean, permission: string, badge?: number) => {
    const hasAccess = canAccessSync(permission);
    return (
      <View style={styles.navLabelContainer}>
        <Text style={[styles.navLabelText, focused && styles.navLabelActive, !hasAccess && styles.lockedText]}>
          {label}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        )}
        {!hasAccess && <Ionicons name="lock-closed-outline" size={rf(14)} color={COLORS.lock} />}
      </View>
    );
  };

  const commonDrawerItemProps = {
    activeBackgroundColor: COLORS.primaryLight,
    activeTintColor: COLORS.primary,
    inactiveTintColor: COLORS.textDark,
    style: styles.drawerItemStyle,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>NAVIGATION</Text>

      <DrawerItem
        {...commonDrawerItemProps}
        focused={true} // Hardcoded for demo/screenshot, ideally driven by state, but user wants design
        label={({ focused }) => renderNavLabel(t("dashboard"), focused, "Dashboard")}
        icon={({ focused }) => renderNavIcon("home-outline", focused, "Dashboard")}
        onPress={() => checkAndNavigate("Dashboard", "(tabs)", { screen: "Dashboard" })}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel(t("home_menu"), focused, "Menu")}
        icon={({ focused }) => renderNavIcon("grid-outline", focused, "Menu")}
        onPress={() => checkAndNavigate("Menu", "(tabs)", { screen: "menu" })}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel(t("orders"), focused, "Order")}
        icon={({ focused }) => renderNavIcon("list-outline", focused, "Order")}
        onPress={() => checkAndNavigate("Order", "orders")}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel("KOT", focused, "Menu")}
        icon={({ focused }) => renderNavIcon("receipt-outline", focused, "Menu")}
        onPress={() => navigation.navigate("(tabs)", { screen: "kot" })}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel(t("table_qr_codes"), focused, "Order")}
        icon={({ focused }) => renderNavIcon("qr-code-outline", focused, "Order")}
        onPress={() => checkAndNavigate("Order", "qr")}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel(t("edit_menu_item"), focused, "Menu")}
        icon={({ focused }) => renderNavIcon("create-outline", focused, "Menu")}
        onPress={() => checkAndNavigate("Menu", "editMenu")}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel("Item Sales Report", focused, "Reports")}
        icon={({ focused }) => renderNavIcon("bar-chart-outline", focused, "Reports")}
        onPress={() => checkAndNavigate("Reports", "inventory")}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel("Bill History", focused, "Dashboard")}
        icon={({ focused }) => renderNavIcon("document-text-outline", focused, "Dashboard")}
        onPress={() => checkAndNavigate("Dashboard", "billHistory")}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel("Inventory", focused, "Inventory")}
        icon={({ focused }) => renderNavIcon("archive-outline", focused, "Inventory")}
        onPress={() => checkAndNavigate("Inventory", "inventoryMain")}
      />

      <DrawerItem
        {...commonDrawerItemProps}
        label={({ focused }) => renderNavLabel(t("settings"), focused, "Settings")}
        icon={({ focused }) => renderNavIcon("settings-outline", focused, "Settings")}
        onPress={() => checkAndNavigate("Settings", "settings")}
      />

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>SMART INTELLIGENCE</Text>

      <TouchableOpacity
        style={styles.aiCardGreen}
        onPress={() => checkAndNavigate("AI Intelligence Tools", "profit")}
      >
        <View style={styles.aiIconGreen}>
          <Ionicons name="trending-up-outline" size={rf(18)} color="#059669" />
          {!canAccessSync("AI Intelligence Tools") && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={rf(10)} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.aiInfo}>
          <Text style={styles.aiTitleGreen}>Profit Engine</Text>
          <Text style={styles.aiSubGreen}>AI powered insights</Text>
        </View>
        <View style={styles.aiBadgeGreen}>
          <Text style={styles.aiBadgeTextGreen}>AI</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.aiCardPurple}
        onPress={() => checkAndNavigate("AI Intelligence Tools", "voice")}
      >
        <View style={styles.aiIconPurple}>
          <Ionicons name="mic-outline" size={rf(18)} color="#6D28D9" />
          {!canAccessSync("AI Intelligence Tools") && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={rf(10)} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.aiInfo}>
          <Text style={styles.aiTitlePurple}>Voice Command</Text>
          <Text style={styles.aiSubPurple}>Speak to control</Text>
        </View>
        <View style={styles.aiBadgePurple}>
          <Text style={styles.aiBadgeTextPurple}>AI</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.aiCardOrange}
        onPress={() => checkAndNavigate("AI Intelligence Tools", "history")}
      >
        <View style={styles.aiIconOrange}>
          <Ionicons name="search-outline" size={rf(18)} color="#D97706" />
          {!canAccessSync("AI Intelligence Tools") && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={rf(10)} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.aiInfo}>
          <Text style={styles.aiTitleOrange}>Customer Search</Text>
          <Text style={styles.aiSubOrange}>Find history instantly</Text>
        </View>
        <View style={styles.aiBadgeOrange}>
          <Text style={styles.aiBadgeTextOrange}>AI</Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: vs(20) }} />
      {!isSignedIn ? (
        <DrawerItem
          label={t("sign_in")}
          icon={({ size }) => <Ionicons name="log-in-outline" size={size} color={COLORS.primary} />}
          onPress={() => onAction("signIn")}
          labelStyle={{ color: COLORS.primary, fontWeight: "bold" }}
        />
      ) : (
        <DrawerItem
          label={t("sign_out")}
          icon={({ size }) => <Ionicons name="log-out-outline" size={size} color={COLORS.danger} />}
          onPress={onLogout}
          labelStyle={{ color: COLORS.danger }}
        />
      )}

      <Modal transparent visible={accessDeniedInfo.visible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(18, 18, 20, 0.9)", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <View style={{ backgroundColor: "#1E1E24", width: s(310), borderRadius: s(24), padding: s(24), alignItems: "center", borderWidth: 1, borderColor: "#2C2C2E", elevation: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20 }}>
            <View style={{ width: s(72), height: s(72), borderRadius: s(36), backgroundColor: "rgba(239, 68, 68, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: vs(16), borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)" }}>
              <Ionicons name="lock-closed" size={rf(32)} color="#EF4444" />
            </View>
            <Text style={{ fontSize: rf(20), fontWeight: "800", color: "#FFFFFF", textAlign: "center" }}>Access Denied</Text>
            <Text style={{ fontSize: rf(14), color: "#A1A1AA", textAlign: "center", marginTop: vs(8), lineHeight: vs(20), paddingHorizontal: s(10) }}>
              You don't have permission to access {accessDeniedInfo.permission}. Please contact your administrator.
            </Text>
            <View style={{ flexDirection: "row", marginTop: vs(24), width: "100%" }}>
              <TouchableOpacity
                style={{ flex: 1, height: vs(48), borderRadius: s(12), justifyContent: "center", alignItems: "center", backgroundColor: "#EF4444" }}
                onPress={() => setAccessDeniedInfo({ visible: false, permission: "" })}
              >
                <Text style={{ fontSize: rf(14), fontWeight: "700", color: "#FFFFFF" }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: s(5),
  },
  sectionTitle: {
    fontSize: rf(10),
    fontWeight: "700",
    color: "#94A3B8",
    marginLeft: s(15),
    marginBottom: vs(10),
    marginTop: vs(10),
    letterSpacing: 1.5,
  },
  drawerItemStyle: {
    borderRadius: s(12),
    marginVertical: vs(2),
  },
  navLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  navLabelText: {
    fontSize: rf(14),
    color: "#475569",
    fontWeight: "500"
  },
  navLabelActive: {
    color: "#6D28D9",
    fontWeight: "700",
  },
  lockedText: {
    color: "#94A3B8"
  },
  lockBadge: {
    position: "absolute",
    right: -s(4),
    bottom: -vs(2),
    backgroundColor: "#EF4444",
    borderRadius: s(10),
    padding: s(1),
    borderWidth: 1,
    borderColor: "#fff",
  },
  navBadge: {
    backgroundColor: "#6D28D9",
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(10),
  },
  navBadgeText: {
    color: "#fff",
    fontSize: rf(10),
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: vs(15),
    marginHorizontal: s(15),
  },

  // AI Cards
  aiCardGreen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: s(12),
    padding: s(12),
    marginHorizontal: s(10),
    marginBottom: vs(12),
  },
  aiIconGreen: {
    width: s(36),
    height: s(36),
    borderRadius: s(8),
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
  },
  aiInfo: {
    flex: 1,
  },
  aiTitleGreen: {
    fontSize: rf(13),
    fontWeight: "700",
    color: "#059669",
    marginBottom: vs(2),
  },
  aiSubGreen: {
    fontSize: rf(11),
    color: "#34D399",
    fontWeight: "500",
  },
  aiBadgeGreen: {
    borderWidth: 1,
    borderColor: "#059669",
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: s(12),
  },
  aiBadgeTextGreen: {
    color: "#059669",
    fontSize: rf(10),
    fontWeight: "bold",
  },

  aiCardPurple: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: s(12),
    padding: s(12),
    marginHorizontal: s(10),
    marginBottom: vs(12),
  },
  aiIconPurple: {
    width: s(36),
    height: s(36),
    borderRadius: s(8),
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
  },
  aiTitlePurple: {
    fontSize: rf(13),
    fontWeight: "700",
    color: "#6D28D9",
    marginBottom: vs(2),
  },
  aiSubPurple: {
    fontSize: rf(11),
    color: "#A78BFA",
    fontWeight: "500",
  },
  aiBadgePurple: {
    borderWidth: 1,
    borderColor: "#6D28D9",
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: s(12),
  },
  aiBadgeTextPurple: {
    color: "#6D28D9",
    fontSize: rf(10),
    fontWeight: "bold",
  },

  aiCardOrange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: s(12),
    padding: s(12),
    marginHorizontal: s(10),
    marginBottom: vs(12),
  },
  aiIconOrange: {
    width: s(36),
    height: s(36),
    borderRadius: s(8),
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
  },
  aiTitleOrange: {
    fontSize: rf(13),
    fontWeight: "700",
    color: "#D97706",
    marginBottom: vs(2),
  },
  aiSubOrange: {
    fontSize: rf(11),
    color: "#FBBF24",
    fontWeight: "500",
  },
  aiBadgeOrange: {
    borderWidth: 1,
    borderColor: "#D97706",
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: s(12),
  },
  aiBadgeTextOrange: {
    color: "#D97706",
    fontSize: rf(10),
    fontWeight: "bold",
  },
});

export default SidebarItems;
