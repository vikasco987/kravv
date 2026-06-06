import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import MainPrinterView from "./MainPrinterView";

const PrinterAccessWrapper = () => {
  const { isOwner, session } = useStaffPermissions();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Artificial slight delay to match previous loading UX if desired, or just load immediately
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  // CASE 1: Completely Logged Out
  if (!isOwner && !session) {
    return <MainPrinterView isLockedUser={true} />;
  }

  // CASE 2: Owner or Staff (Always Allowed per user request)
  return <MainPrinterView isLockedUser={false} />;
};

export default PrinterAccessWrapper;
