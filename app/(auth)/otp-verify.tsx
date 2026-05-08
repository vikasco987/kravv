import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRefresh } from "../../context/RefreshContext";
import { authService } from "../../services/authService";

export default function OTPVerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { triggerRefresh } = useRefresh();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    console.log("🔍 Attempting to verify OTP for:", email);

    if (!email) {
      Alert.alert(
        "Error",
        "Identifier (Email/Phone) is missing. Please try logging in again.",
      );
      router.replace("/(auth)/custom-login");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOTP(email, otp);
      console.log("✅ OTP Verified successfully:", res);
      Alert.alert(
        "Success",
        "Account verified successfully! Please login now.",
      );
      router.replace("/(auth)/custom-login");
    } catch (error: any) {
      console.error("❌ OTP Verification failed:", error);
      Alert.alert("Error", error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOTP(email);
      Alert.alert("Success", "OTP has been resent to your email");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <LinearGradient colors={["#FF5F6D", "#FFC371"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color="#FF5F6D" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={50}
                color="#fff"
              />
            </View>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.otpContainer}>
              <TextInput
                style={[styles.otpInput, { letterSpacing: 15 }]}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                textAlign="center"
                placeholderTextColor="#DDD"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>VERIFY OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResend}
              disabled={resending}
              style={styles.resendContainer}
            >
              {resending ? (
                <ActivityIndicator color="#FF5F6D" size="small" />
              ) : (
                <Text style={styles.resendText}>
                  Didn't receive code?{" "}
                  <Text style={styles.resendTextHighlight}>Resend</Text>
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  emailText: {
    fontWeight: "700",
    color: "#fff",
  },
  formCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  otpContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  otpInput: {
    width: "100%",
    height: 70,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 32,
    fontWeight: "800",
    color: "#333",
  },
  actionBtn: {
    backgroundColor: "#FF5F6D",
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#FF5F6D",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  resendContainer: {
    marginTop: 25,
    alignItems: "center",
  },
  resendText: {
    color: "#666",
    fontSize: 14,
  },
  resendTextHighlight: {
    color: "#FF5F6D",
    fontWeight: "700",
  },
});
