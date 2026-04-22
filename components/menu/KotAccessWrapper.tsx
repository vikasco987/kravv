import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import KotView from "./KotView";
import { NoAccessView } from "../staff creat/NoAccessView";

const KotAccessWrapper = () => {
  const { isOwner } = useStaffPermissions();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Checking for broad "KOT" access
      const allowed = await StaffPermissionEngine.hasPermission("Order", isOwner);
      setHasAccess(allowed);
      setLoading(false);
    };

    checkAccess();
  }, [isOwner]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!hasAccess) {
    return <NoAccessView />;
  }

  return <KotView />;
};

export default KotAccessWrapper;
