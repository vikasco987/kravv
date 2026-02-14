// app/CustomDrawer.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useClerk } from "@clerk/clerk-expo";

export default function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={70} color="#fff" />
        <Text style={styles.welcome}>WELCOME</Text>
        <Text style={styles.userId}>User ID: {user?.id}</Text>
      </View>

      <DrawerItem
        label="Dashboard"
        icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate("(tabs)")}
      />

      <DrawerItem
        label="Sign Out"
        icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />}
        onPress={async () => {
          await signOut();
        }}
      />
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
