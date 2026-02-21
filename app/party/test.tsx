"use client";
import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function TokenTestScreen() {
  const { getToken, isLoaded, userId } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const fetchToken = async () => {
    if (!isLoaded || !userId) return; // wait until Clerk is ready and user is signed in
    try {
      const t = await getToken();
      setToken(t || null);
      console.log("Bearer token:", t); // ✅ token printed here
    } catch (err) {
      console.error("Failed to get token:", err);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [isLoaded, userId]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Clerk Token Test</Text>
      {token ? <Text selectable>{token}</Text> : <Text>Fetching token...</Text>}
      <Button title="Refresh Token" onPress={fetchToken} />
    </View>
  );
}
