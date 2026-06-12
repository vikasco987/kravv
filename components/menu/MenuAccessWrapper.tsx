import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NoAccessView } from "../staff creat/NoAccessView";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import MainMenuView from "./MainMenuView";

const MenuAccessWrapper = () => {
  const { isOwner, session } = useStaffPermissions();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const checkAccess = async () => {
        // Checking for broad "Menu" access (includes categories)
        let allowed = await StaffPermissionEngine.hasPermission("Menu", isOwner);

        // Temporarily allow access if they are coming from an order to checkout
        if (!allowed) {
          const tempCheckout = await AsyncStorage.getItem("@temp_cart_for_checkout");
          if (tempCheckout) {
            allowed = true;
          }
        }

        setHasAccess(allowed);
        setLoading(false);
      };

      checkAccess();
    }, [isOwner, session])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  // CASE 1: Completely Logged Out
  if (!isOwner && !session) {
    return <MainMenuView isLockedUser={true} />;
  }

  // CASE 2: Staff Logged In but No Menu Permission
  if (!hasAccess) {
    return <NoAccessView />;
  }

  // CASE 3: Owner or Staff with Permission
  return <MainMenuView isLockedUser={false} />;
};

export default MenuAccessWrapper;