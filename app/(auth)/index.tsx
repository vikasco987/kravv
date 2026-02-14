// app/oauth/index.tsx
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter, useLocalSearchParams } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectHandler() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log("✅ OAuth redirect params:", params);
    // After redirect, you can navigate where needed
    setTimeout(() => {
      router.replace("/menu");
    }, 1500);
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










// import React, { useEffect, useState } from "react";
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
// import * as WebBrowser from "expo-web-browser";
// import { useOAuth, useUser, useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";

// WebBrowser.maybeCompleteAuthSession();

// export default function SignIn() {
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isLoaded, isSignedIn } = useUser();
//   const { getToken, signOut } = useAuth();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);

//   // Redirect if already signed in
//   useEffect(() => {
//     if (isLoaded && isSignedIn) {
//       router.replace("/menu");
//     }
//   }, [isLoaded, isSignedIn]);

//   const handleSignIn = async () => {
//     if (!isLoaded) return;

//     setLoading(true);

//     try {
//       const result = await startOAuthFlow();

//       if (result?.createdSessionId) {
//         // ✅ Get the Clerk session token
//         const token = await getToken();
//         console.log("Clerk session token:", token);  // <-- Print the token here

//         router.replace("/menu");
//       } else {
//         Alert.alert("Sign-in cancelled", "Please try again.");
//       }
//     } catch (err: any) {
//       console.error("Sign-in error:", err);
//       Alert.alert("Error", err?.message || "Something went wrong");
//       await signOut();
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isLoaded) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" />
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to MyBillingAppPro</Text>
//       <Text style={styles.subtitle}>Please sign in to continue</Text>
//       <Button title={loading ? "Signing in..." : "Sign In with Google"} onPress={handleSignIn} disabled={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
//   subtitle: { fontSize: 16, marginBottom: 20 },
// });
