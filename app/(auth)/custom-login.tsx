import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRefresh } from "../../context/RefreshContext";
import { authService } from "../../services/authService";

export default function CustomLoginScreen() {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleAction = async () => {
    if (!email || !password || (!isLogin && (!name || !phone))) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const cleanEmail = email.trim();
        const res = await authService.login(cleanEmail, password);
        if (res.notVerified) {
          // No need to call resendOTP here, login API already sends it if not verified
          router.push({
            pathname: "/(auth)/otp-verify",
            params: { email: cleanEmail },
          });
        } else if (res.token) {
          // Success login
          console.log(
            "DEBUG: Login successful, user object:",
            JSON.stringify(res.user),
          );
          await AsyncStorage.setItem("staff_session", JSON.stringify(res.user));
          await AsyncStorage.setItem("staff_token", res.token);
          DeviceEventEmitter.emit("PERMISSIONS_UPDATED");
          triggerRefresh();
          router.replace("/(tabs)/menu?login=true");
        }
      } else {
        const cleanEmail = email.trim();
        const res = await authService.register({
          name,
          email: cleanEmail,
          phone,
          password,
        });
        // No need to call resendOTP here, register API already sends it
        router.push({
          pathname: "/(auth)/otp-verify",
          params: { email: cleanEmail },
        });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color="#FF5F6D" />
            </View>
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>
                {isLogin ? "Welcome Back" : "Create Account"}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? "Sign in to your account with email"
                  : "Join us and start your journey"}
              </Text>
            </View>

            <View style={styles.formCard}>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              )}

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
                  />
                </View>
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {isLogin && (
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password")}
                  style={styles.forgotContainer}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleAction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {isLogin ? "Sign In" : "Sign Up"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsLogin(!isLogin)}
                style={styles.toggleContainer}
              >
                <Text style={styles.toggleText}>
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <Text style={styles.toggleTextHighlight}>
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    paddingTop: 50,
    paddingLeft: 20,
    marginBottom: 20,
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
  content: {
    paddingHorizontal: 25,
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
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
  },
  formCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    marginBottom: 50,
  },
  inputContainer: {
    marginBottom: 20,
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
  forgotContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: -10,
  },
  forgotText: {
    color: "#FF5F6D",
    fontSize: 14,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: "#FF5F6D",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
    shadowColor: "#FF5F6D",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  toggleContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: "#666",
    fontSize: 14,
  },
  toggleTextHighlight: {
    color: "#FF5F6D",
    fontWeight: "700",
  },
});
