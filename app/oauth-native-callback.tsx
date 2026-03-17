import { useClerk } from "@clerk/clerk-expo";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function OAuthNativeCallback() {
  const { setActive } = useClerk();
  const { createdSessionId } = useLocalSearchParams();

  useEffect(() => {
    if (createdSessionId && setActive) {
      setActive({ session: createdSessionId as string });
    }
  }, [createdSessionId, setActive]);

  // Even if there is no sessionId, we should redirect to home/menu if the app is opened here
  if (!createdSessionId) {
    return <Redirect href="/(tabs)/menu" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#FF5F6D" />
    </View>
  );
}