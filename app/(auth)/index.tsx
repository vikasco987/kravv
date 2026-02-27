// app/oauth/index.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectHandler() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log("✅ OAuth redirect params:", params);
    // Directly replace to menu without delay
    router.replace("/(tabs)/menu");
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 18, textAlign: "center" }}>
        🎯 Redirecting back to app...
      </Text>
    </View>
  );
}










