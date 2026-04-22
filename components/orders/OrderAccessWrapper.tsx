import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import MainOrdersView from "./MainOrdersView";
import { NoAccessView } from "../staff creat/NoAccessView";

const OrderAccessWrapper = () => {
  const { isOwner, session } = useStaffPermissions();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Checking for broad "Order" access
      const allowed = await StaffPermissionEngine.hasPermission("Order", isOwner);
      setHasAccess(allowed);
      setLoading(false);
    };

    checkAccess();
  }, [isOwner, session]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  // CASE 1: Completely Logged Out
  if (!isOwner && !session) {
    return <MainOrdersView isLockedUser={true} />;
  }

  // CASE 2: Staff Logged In but No Order Permission
  if (!hasAccess) {
    return <NoAccessView />;
  }

  // CASE 3: Owner or Staff with Permission
  return <MainOrdersView isLockedUser={false} />;
};

export default OrderAccessWrapper;
