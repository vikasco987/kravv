// app/CustomDrawer.tsx
// @ts-ignore
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const COLORS = {
    primary: '#4F46E5',
    danger: '#EF4444',
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={70} color="#fff" />
        <Text style={styles.welcome}>{user ? `Hi, ${user.firstName || 'User'}` : "WELCOME GUEST"}</Text>
        {user && <Text style={styles.userId}>User ID: {user.id}</Text>}
      </View>

      <DrawerItem
        label="Dashboard"
        icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("(tabs)", { screen: "Dashboard" })}
      />

      <DrawerItem
        label="Home Menu"
        icon={({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("(tabs)", { screen: "menu" })}
      />
      <DrawerItem
        label="Sales Reports"
        icon={({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("sales/DailySalesScreen")}
      />
      <DrawerItem
        label="Inventory"
        icon={({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("(tabs)", { screen: "Inventory" })}
      />

      <DrawerItem
        label="Settings"
        icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("(tabs)", { screen: "setting" })}
      />

      {!user ? (
        <DrawerItem
          label="Sign In"
          icon={({ color, size }) => <Ionicons name="log-in-outline" size={size} color={COLORS.primary} />}
          onPress={() => props.navigation.navigate("(auth)/sign-in")}
          labelStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
        />
      ) : (
        <DrawerItem
          label="Sign Out"
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={COLORS.danger} />}
          onPress={async () => {
            await signOut();
            props.navigation.replace("(auth)/sign-in");
          }}
          labelStyle={{ color: COLORS.danger }}
        />
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#4F46E5",
    padding: 20,
    alignItems: "center",
  },
  welcome: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  userId: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
});
