import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import MainDashboardView from "./MainDashboardView";
import { NoAccessView } from "../staff creat/NoAccessView";

const DashboardAccessWrapper = () => {
  const { isOwner, session } = useStaffPermissions();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const checkAccess = async () => {
    // Checking for broad "Dashboard" access
    const allowed = await StaffPermissionEngine.hasPermission("Dashboard", isOwner);
    setHasAccess(allowed);
    setLoading(false);
  };

  useEffect(() => {
    checkAccess();
  }, [isOwner, session]);


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  // CASE 1: Completely Logged Out (Not Owner, No Staff Session)
  // Show dashboard but with data 0 (Logic to be handled inside MainDashboardView)
  if (!isOwner && !session) {
      return <MainDashboardView isLockedUser={true} />;
  }

  // CASE 2: Staff Logged In but No Dashboard Permission
  if (!hasAccess) {
    return <NoAccessView />;
  }

  // CASE 3: Owner or Staff with Permission
  return <MainDashboardView isLockedUser={false} />;
};

export default DashboardAccessWrapper;

