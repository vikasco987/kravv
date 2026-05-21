"use client";
import { useClerk, useOAuth, useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import StatusModal from "../../components/common/StatusModal";
import { StaffLogin } from "../../components/staff creat/StaffLogin";
import { useRefresh } from "../../context/RefreshContext";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { setActive } = useClerk();
  const { isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { triggerRefresh } = useRefresh();
  const [isNoNetworkModalVisible, setIsNoNetworkModalVisible] =
    React.useState(false);
  const [isStaffModalVisible, setIsStaffModalVisible] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalConfig, setModalConfig] = React.useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    type: "info",
    title: "",
    message: "",
  });

  const showStatus = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const { isSignedIn } = useClerk();

  React.useEffect(() => {
    // 🛡️ Safety: If we land on Sign-In, ensure staff session is cleared to prevent stale data leaks
    const clearStaleStaff = async () => {
      try {
        const session = await AsyncStorage.getItem("staff_session");
        if (session) {
          console.log("🧹 Clearing stale staff session on Sign-In screen");
          await AsyncStorage.removeItem("staff_session");
          triggerRefresh();
        }
      } catch (e) {
        console.log("Error clearing stale staff session:", e);
      }
    };
    clearStaleStaff();
  }, []);

  const handleGoogleSignIn = React.useCallback(async () => {
    if (!isLoaded || isLoggingIn) return;

    // If already signed in, just go to menu
    if (isSignedIn) {
      console.log("Already signed in, redirecting...");
      router.replace("/(tabs)/menu?login=true");
      return;
    }

    setIsLoggingIn(true);

    try {
      // Basic connectivity check before starting OAuth with a 4s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        await fetch("https://www.google.com", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (e) {
        setIsNoNetworkModalVisible(true);
        setIsLoggingIn(false);
        return;
      }

      await WebBrowser.warmUpAsync();

      const redirectUrl = AuthSession.makeRedirectUri({
        path: "oauth-native-callback",
      });

      console.log("🚀 Starting Google OAuth with useOAuth...");

      const { createdSessionId, setActive: setSessionActive } =
        await startOAuthFlow({
          redirectUrl,
        });

      if (createdSessionId) {
        console.log("✅ OAuth Success, setting session...");

        // 🛡️ DATA ISOLATION: Wipe previous cached data before setting active session
        const currentLang = await AsyncStorage.getItem("app_language");
        const savedPrinter = await AsyncStorage.getItem("saved_printer");

        await AsyncStorage.clear();

        if (currentLang)
          await AsyncStorage.setItem("app_language", currentLang);
        if (savedPrinter)
          await AsyncStorage.setItem("saved_printer", savedPrinter);

        await setSessionActive?.({ session: createdSessionId });
        router.replace("/(tabs)/menu?login=true");
      } else {
        console.warn(
          "⚠️ OAuth flow did not result in a session immediately. Check Clerk dashboard for required steps.",
        );
        setIsLoggingIn(false);
      }
    } catch (err) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : String(err);
      console.log("❌ Google Sign-in Debug Info:", errorMsg);

      if (errorMsg.toLowerCase().includes("already signed in")) {
        console.log("Gracefully handling 'already signed in' error...");
        router.replace("/(tabs)/menu?login=true");
        return;
      }

      if (
        errorMsg.toLowerCase().includes("network") ||
        errorMsg.toLowerCase().includes("failed to fetch")
      ) {
        setIsNoNetworkModalVisible(true);
      } else {
        showStatus(
          "error",
          "Sign-in Failed",
          "Could not complete Google sign-in. Please try again.",
        );
      }
    } finally {
      setIsLoggingIn(false);
      await WebBrowser.coolDownAsync();
    }
  }, [isLoaded, isSignedIn, startOAuthFlow, router, isLoggingIn]);

  return (
    <LinearGradient colors={["#FF5F6D", "#FFC371"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.bottomWave} />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/menu");
          }
        }}
      >
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={24} color="#FF5F6D" />
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require("../../assets/images/kravlogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Brand */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>KRAVY</Text>
          <LinearGradient
            colors={["#FFFFFF", "#FFD700", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.brandUnderline}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to MyBillingApp</Text>
        <Text style={styles.subtitle}>
          Smart billing. Simplified workflow. Sign in to continue 🚀
        </Text>

        {/* Phone/Email Button */}
        <TouchableOpacity
          style={[
            styles.googleBtn,
            {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.3)",
              marginBottom: 15,
            },
          ]}
          onPress={() => router.push("/(auth)/custom-login")}
        >
          <Ionicons
            name="mail-outline"
            size={24}
            color="#fff"
            style={{ marginRight: 15 }}
          />
          <Text style={[styles.googleText, { color: "#fff" }]}>
            Login with Phone / Email
          </Text>
        </TouchableOpacity>

        {/* Google Button */}
        <TouchableOpacity
          style={[
            styles.googleBtn,
            (!isLoaded || isLoggingIn) && { opacity: 0.7 },
          ]}
          onPress={handleGoogleSignIn}
          disabled={!isLoaded || isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator
              color="#FF5F6D"
              size="small"
              style={{ marginRight: 15 }}
            />
          ) : (
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Google_%22G%22_Logo.svg",
              }}
              style={styles.googleIcon}
            />
          )}
          <Text style={styles.googleText}>
            {isLoggingIn ? "Signing in..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.googleBtn,
            {
              backgroundColor: "#4F46E5",
              elevation: 10,
              shadowColor: "#4F46E5",
              shadowOpacity: 0.4,
              shadowRadius: 10,
            },
          ]}
          onPress={() => setIsStaffModalVisible(true)}
        >
          <Ionicons
            name="shield-checkmark"
            size={24}
            color="#fff"
            style={{ marginRight: 15 }}
          />
          <Text
            style={[styles.googleText, { color: "#fff", letterSpacing: 1 }]}
          >
            STAFF PORTAL ACCESS
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          By signing in, you agree to our{" "}
          <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Terms</Text> &{" "}
          <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      {/* Custom No Network Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isNoNetworkModalVisible}
        onRequestClose={() => setIsNoNetworkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="cloud-offline-outline"
                size={50}
                color="#FF5F6D"
              />
            </View>
            <Text style={styles.modalTitle}>No Network 📶</Text>
            <Text style={styles.modalText}>
              It looks like your phone is not connected to the internet. Please
              check your network and try again.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setIsNoNetworkModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StaffLogin
        visible={isStaffModalVisible}
        onClose={() => setIsStaffModalVisible(false)}
      />

      <StatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 2,
  },
  bottomWave: {
    position: "absolute",
    bottom: -150,
    left: -50,
    right: -50,
    height: 400,
    backgroundColor: "#fff",
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    opacity: 0.9,
    transform: [{ scaleX: 1.5 }],
    zIndex: 1,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  brandName: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 8,
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  brandUnderline: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    marginBottom: 15,
    width: "100%",
    justifyContent: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  googleText: {
    color: "#333",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    marginTop: 40,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    width: "100%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  modalBtn: {
    backgroundColor: "#FF5F6D",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 50,
    elevation: 5,
    shadowColor: "#FF5F6D",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1.5,
  },
});
