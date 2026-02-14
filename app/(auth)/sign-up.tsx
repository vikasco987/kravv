// import { View, Button, Text, TextInput, Alert } from "react-native";
// import { useSignUp } from "@clerk/clerk-expo";
// import { useState } from "react";
// import { useRouter } from "expo-router";

// export default function SignUpScreen() {
//   const { signUp, setActive, isLoaded } = useSignUp();
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [code, setCode] = useState(""); // for OTP if enabled
//   const [pendingVerification, setPendingVerification] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleSignUp = async () => {
//     if (!isLoaded) return;
//     setLoading(true);
//     try {
//       await signUp.create({
//         emailAddress: email,
//         password,
//       });

//       // If your Clerk instance requires email verification
//       await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
//       setPendingVerification(true);
//       Alert.alert("Check your email", "Enter the verification code below");
//     } catch (err: any) {
//       console.error("Sign up error:", err.errors);
//       Alert.alert("Sign up failed", err.errors?.[0]?.message || "Unknown error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerify = async () => {
//     if (!isLoaded) return;
//     setLoading(true);
//     try {
//       const completeSignUp = await signUp.attemptEmailAddressVerification({
//         code,
//       });
//       await setActive({ session: completeSignUp.createdSessionId });
//       router.replace("/menu");
//     } catch (err: any) {
//       console.error("Verification error:", err.errors);
//       Alert.alert("Verification failed", err.errors?.[0]?.message || "Try again");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       {!pendingVerification ? (
//         <>
//           <Text>Email</Text>
//           <TextInput
//             value={email}
//             onChangeText={setEmail}
//             placeholder="Enter email"
//             autoCapitalize="none"
//             style={{
//               borderWidth: 1,
//               padding: 8,
//               width: 200,
//               marginBottom: 10,
//             }}
//           />
//           <Text>Password</Text>
//           <TextInput
//             value={password}
//             onChangeText={setPassword}
//             placeholder="Enter password"
//             secureTextEntry
//             style={{
//               borderWidth: 1,
//               padding: 8,
//               width: 200,
//               marginBottom: 20,
//             }}
//           />
//           <Button
//             title={loading ? "Signing up..." : "Sign Up"}
//             onPress={handleSignUp}
//           />
//         </>
//       ) : (
//         <>
//           <Text>Enter the verification code sent to your email</Text>
//           <TextInput
//             value={code}
//             onChangeText={setCode}
//             placeholder="Enter code"
//             style={{
//               borderWidth: 1,
//               padding: 8,
//               width: 200,
//               marginBottom: 20,
//             }}
//           />
//           <Button
//             title={loading ? "Verifying..." : "Verify Email"}
//             onPress={handleVerify}
//           />
//         </>
//       )}
//     </View>
//   );
// }








// // app/SignOut.tsx
// import React from "react";
// import { View, Text, Button, StyleSheet, Alert } from "react-native";
// import { useAuth } from "@clerk/clerk-expo";

// export default function SignOut({ navigation }: any) {
//   const { isSignedIn, signOut } = useAuth();

//   const handleSignOut = async () => {
//     try {
//       if (!isSignedIn) {
//         Alert.alert("Not signed in", "You are not currently signed in.");
//         return;
//       }

//       await signOut();
//       Alert.alert("Signed out successfully!");
//       console.log("✅ User signed out");

//       // Optionally navigate to SignIn page
//       navigation.replace("signin"); // 👈 Make sure your route name matches SignIn
//     } catch (err) {
//       console.error("❌ Sign-out error:", err);
//       Alert.alert("Error", "Failed to sign out. Please try again.");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Are you sure you want to sign out?</Text>
//       <Button title="Sign Out" color="red" onPress={handleSignOut} />
//       <View style={{ height: 10 }} />
//       <Button title="Cancel" onPress={() => navigation.goBack()} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
// });




// app/_layout.tsx
import { ClerkProvider } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

const prefix = Linking.createURL("/");

export default function RootLayout() {
  const publishableKey =
    Constants.expoConfig?.extra?.clerkPublishableKey ||
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      fallbackRedirectUrl={`${prefix}oauth-native-callback`}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/sign-in" />
        <Stack.Screen name="(auth)/sign-up" />
        <Stack.Screen name="SignOut" />
      </Stack>
    </ClerkProvider>
  );
}
