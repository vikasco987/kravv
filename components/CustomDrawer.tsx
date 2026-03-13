// app/CustomDrawer.tsx
// @ts-ignore
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { rf, s, vs } from "../utils/responsive";

export default function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const COLORS = {
    primary: '#4F46E5',
    danger: '#EF4444',
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={rf(70)} color="#fff" />
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
        label="Orders"
        icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("(tabs)", { screen: "orders" })}
      />
      <DrawerItem
        label="Table QR Codes"
        icon={({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("TableQrCodes")}
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
          onPress={() => router.push("/(auth)/sign-in")}
          labelStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
        />
      ) : (
        <DrawerItem
          label="Sign Out"
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={COLORS.danger} />}
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
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
    padding: s(20),
    alignItems: "center",
  },
  welcome: { color: "#fff", fontSize: rf(18), fontWeight: "bold" },
  userId: { color: "rgba(255,255,255,0.8)", fontSize: rf(12), marginTop: vs(4) },
});
