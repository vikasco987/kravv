import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { authService } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      Alert.alert("Success", "Reset code sent to your email!");
      router.push({
        pathname: "/(auth)/reset-password",
        params: { email },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
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
              <Ionicons name="lock-open-outline" size={50} color="#fff" />
            </View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you an OTP to reset your
              password.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>SENT OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/custom-login")}
              style={styles.backToLoginContainer}
            >
              <Text style={styles.backToLoginText}>
                Back to <Text style={styles.backToLoginHighlight}>Login</Text>
              </Text>
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
    paddingHorizontal: 20,
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
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
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
    letterSpacing: 1.5,
  },
  backToLoginContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLoginText: {
    color: "#666",
    fontSize: 14,
  },
  backToLoginHighlight: {
    color: "#FF5F6D",
    fontWeight: "700",
  },
});
