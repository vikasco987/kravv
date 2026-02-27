"use client";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession(); // ✅ important

export default function SignInScreen() {
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)/menu");
      }
    } catch (err) {
      console.error("❌ Google sign-in error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Logo */}
      <Image
        source={require("../../assets/images/image.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Welcome to MyBillingApp</Text>
      <Text style={styles.subtitle}>
        Smart billing. Simplified workflow. Sign in to continue 🚀
      </Text>

      {/* Google Sign-In Button */}
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Google_%22G%22_Logo.svg",
          }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        By signing in, you agree to our{" "}
        <Text style={{ fontWeight: "600", color: "#555" }}>Terms</Text> &{" "}
        <Text style={{ fontWeight: "600", color: "#555" }}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#e0f7ff", // very light blue
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#007acc", // darker blue for contrast
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#005f99", // slightly darker
    textAlign: "center",
    marginBottom: 40,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 50,
  },
});
