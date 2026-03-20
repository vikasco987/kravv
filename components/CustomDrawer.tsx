// app/CustomDrawer.tsx
// @ts-ignore
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { rf, s, vs } from "../utils/responsive";
import { EditMenuItem } from "./menu/EditMenuItem";
import { TableQrCodes } from "./menu/TableQrCodes";
import { LoginRequiredModal } from "./settings/LoginRequiredModal";
import { useLanguage } from "../context/LanguageContext";

export default function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { t } = useLanguage();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [editMenuModalVisible, setEditMenuModalVisible] = useState(false);

  const COLORS = {
    primary: '#4F46E5',
    danger: '#EF4444',
  };

  const handleAuthenticatedNavigation = (screen: string, params?: any) => {
    if (!user) {
      setLoginModalVisible(true);
    } else {
      if (params) {
        props.navigation.navigate(screen, params);
      } else {
        props.navigation.navigate(screen);
      }
    }
  };

  const handleSignIn = () => {
    setLoginModalVisible(false);
    router.push("/(auth)/sign-in");
  };

  return (
    <>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={rf(70)} color="#fff" />
          <Text style={styles.welcome}>{user ? `${t('hi')}, ${user.firstName || 'User'}` : t('welcome_guest')}</Text>
          {user && <Text style={styles.userId}>{user.primaryEmailAddress?.emailAddress}</Text>}
        </View>

        <DrawerItem
          label={t('dashboard')}
          icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("(tabs)", { screen: "Dashboard" })}
        />

        <DrawerItem
          label={t('home_menu')}
          icon={({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("(tabs)", { screen: "menu" })}
        />
        <DrawerItem
          label={t('orders')}
          icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
          onPress={() => handleAuthenticatedNavigation("(tabs)", { screen: "orders" })}
        />

        <DrawerItem
          label={t('table_qr_codes')}
          icon={({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              props.navigation.closeDrawer();
              setQrModalVisible(true);
            }
          }}
        />
        <DrawerItem
          label={t('edit_menu_item')}
          icon={({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />}
          onPress={() => {
            if (!user) {
              setLoginModalVisible(true);
            } else {
              props.navigation.closeDrawer();
              // Thoda aur zada delay (400ms) taaki Android par animation poori ho jaye
              setTimeout(() => {
                setEditMenuModalVisible(true);
              }, 400);
            }
          }}
        />


        <DrawerItem
          label={t('settings')}
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("(tabs)", { screen: "setting" })}
        />

        {!user ? (
          <DrawerItem
            label={t('sign_in')}
            icon={({ color, size }) => <Ionicons name="log-in-outline" size={size} color={COLORS.primary} />}
            onPress={() => router.push("/(auth)/sign-in")}
            labelStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
          />
        ) : (
          <DrawerItem
            label={t('sign_out')}
            icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={COLORS.danger} />}
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/sign-in");
            }}
            labelStyle={{ color: COLORS.danger }}
          />
        )}
      </DrawerContentScrollView>

      <LoginRequiredModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSignIn={handleSignIn}
      />

      <Modal visible={qrModalVisible} animationType="slide" onRequestClose={() => setQrModalVisible(false)}>
        <TableQrCodes onBack={() => setQrModalVisible(false)} />
      </Modal>

      <Modal visible={editMenuModalVisible} animationType="slide" onRequestClose={() => setEditMenuModalVisible(false)}>
        <EditMenuItem onBack={() => setEditMenuModalVisible(false)} />
      </Modal>
    </>
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
