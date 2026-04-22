import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import MainSettingsView from "./MainSettingsView";
import { NoAccessView } from "../staff creat/NoAccessView";

const SettingAccessWrapper = () => {
  const { isOwner, session } = useStaffPermissions();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Checking for broad "Settings" access
      const allowed = await StaffPermissionEngine.hasPermission("Settings", isOwner);
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
    return <MainSettingsView isLockedUser={true} />;
  }

  // CASE 2: Staff Logged In but No Settings Permission
  if (!hasAccess) {
    return <NoAccessView />;
  }

  // CASE 3: Owner or Staff with Permission
  return <MainSettingsView isLockedUser={false} />;
};

export default SettingAccessWrapper;
