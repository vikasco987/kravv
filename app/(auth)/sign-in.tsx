// "use client";
// import { useClerk, useOAuth } from "@clerk/clerk-expo";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import * as AuthSession from "expo-auth-session";
// import * as Linking from "expo-linking";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";
// import React from "react";
// import {
//   Image,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// WebBrowser.maybeCompleteAuthSession(); // ✅ important

// export default function SignInScreen() {
//   const router = useRouter();
//   const { setActive } = useClerk();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

//   const handleGoogleSignIn = React.useCallback(async () => {
//     try {
//       if (!startOAuthFlow) return;

//       await WebBrowser.warmUpAsync();

//       const redirectUrl = AuthSession.makeRedirectUri({
//         scheme: "kravy",
//         path: "oauth-native-callback",
//       });

//       console.log("🔗 Redirect URL:", redirectUrl);

//       // We call startOAuthFlow. If it fails, we catch it here.
//       const result = await startOAuthFlow({ redirectUrl });

//       if (result.createdSessionId) {
//         const setSession = result.setActive || setActive;
//         await setSession({ session: result.createdSessionId });
//       }
//     } catch (err: any) {
//       console.error("❌ Sign-in error:", err);
//       // If Custom Redirect fails, try without it (Clerk Default)
//       try {
//         console.log("🔄 Retrying with Clerk default settings...");
//         const result = await startOAuthFlow();
//         if (result?.createdSessionId) {
//           const setSession = result.setActive || setActive;
//           await setSession({ session: result.createdSessionId });
//         }
//       } catch (retryErr) {
//         console.error("❌ Retry also failed:", retryErr);
//       }
//     } finally {
//       await WebBrowser.coolDownAsync();
//     }
//   }, [startOAuthFlow, setActive]);

//   return (
//     <LinearGradient colors={["#FF5F6D", "#FFC371"]} style={styles.container}>
//       <StatusBar barStyle="light-content" />

//       {/* Decorative Bottom Wave/Curve */}
//       <View style={styles.bottomWave} />

//       {/* Back Button */}
//       <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
//         <View style={styles.backButtonCircle}>
//           <Ionicons name="arrow-back" size={24} color="#FF5F6D" />
//         </View>
//       </TouchableOpacity>

//       {/* Content Container */}
//       <View style={styles.content}>
//         {/* Logo */}
//         <Image
//           source={require("../../assets/images/kravlogo.png")}
//           style={styles.logo}
//           resizeMode="contain"
//         />
//         {/* Brand Name with Stylized Effect */}
//         <View style={styles.brandContainer}>
//           <Text style={styles.brandName}>KRAVY</Text>
//           <LinearGradient
//             colors={["#FFFFFF", "#FFD700", "#FFFFFF"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.brandUnderline}
//           />
//         </View>

//         {/* Title */}
//         <Text style={styles.title}>Welcome to MyBillingApp</Text>
//         <Text style={styles.subtitle}>
//           Smart billing. Simplified workflow. Sign in to continue 🚀
//         </Text>

//         {/* Google Sign-In Button */}
//         <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
//           <Image
//             source={{
//               uri: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Google_%22G%22_Logo.svg",
//             }}
//             style={styles.googleIcon}
//           />
//           <Text style={styles.googleText}>Continue with Google</Text>
//         </TouchableOpacity>

//         {/* Footer */}
//         <Text style={styles.footer}>
//           By signing in, you agree to our{" "}
//           <Text style={{ fontWeight: "700", color: "#c94c4cff" }}>Terms</Text> &{" "}
//           <Text style={{ fontWeight: "700", color: "#c94c4cff" }}>
//             Privacy Policy
//           </Text>
//           .
//         </Text>
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 30,
//     zIndex: 2,
//   },
//   bottomWave: {
//     position: "absolute",
//     bottom: -150,
//     left: -50,
//     right: -50,
//     height: 400,
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 300,
//     borderTopRightRadius: 300,
//     opacity: 0.9,
//     transform: [{ scaleX: 1.5 }],
//     zIndex: 1,
//   },
//   backButton: {
//     position: "absolute",
//     top: 50,
//     left: 20,
//     zIndex: 10,
//   },
//   backButtonCircle: {
//     width: 45,
//     height: 45,
//     borderRadius: 25,
//     backgroundColor: "rgba(255,255,255,0.9)",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//   },
//   logo: {
//     width: 120,
//     height: 120,
//     borderRadius: 25,
//     overflow: "hidden",
//     marginBottom: 20,
//     elevation: 10,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 15,
//   },
//   brandContainer: {
//     alignItems: "center",
//     marginBottom: 30,
//   },
//   brandName: {
//     fontSize: 40,
//     fontWeight: "900",
//     color: "#FFFFFF",
//     letterSpacing: 8,
//     textShadowColor: "rgba(255, 215, 0, 0.4)",
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 15,
//   },
//   brandUnderline: {
//     width: 60,
//     height: 4,
//     borderRadius: 2,
//     marginTop: 8,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "800",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 10,
//     textShadowColor: "rgba(0, 0, 0, 0.1)",
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "rgba(255, 255, 255, 0.9)",
//     textAlign: "center",
//     marginBottom: 40,
//     paddingHorizontal: 10,
//   },
//   googleBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 50,
//     paddingVertical: 16,
//     paddingHorizontal: 30,
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOpacity: 0.15,
//     shadowRadius: 15,
//     marginBottom: 20,
//   },
//   googleIcon: {
//     width: 24,
//     height: 24,
//     marginRight: 15,
//   },
//   googleText: {
//     color: "#333",
//     fontWeight: "700",
//     fontSize: 16,
//   },
//   footer: {
//     fontSize: 13,
//     color: "#c94c4c",
//     textAlign: "center",
//     marginTop: 40,
//     fontWeight: "600",
//   },
// });

"use client";
import { useClerk, useSignIn, useOAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { staffService } from "../../services/staffService";
import { useRefresh } from "../../context/RefreshContext";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { setActive } = useClerk();
  const { signIn, isLoaded, setActive: setSignInActive } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { triggerRefresh } = useRefresh();

  // --- Staff Login States ---
  const [staffModalVisible, setStaffModalVisible] = React.useState(false);
  const [staffEmail, setStaffEmail] = React.useState("");
  const [staffPassword, setStaffPassword] = React.useState("");
  const [showStaffPassword, setShowStaffPassword] = React.useState(false);
  const [isStaffLoading, setIsStaffLoading] = React.useState(false);

  React.useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const session = await AsyncStorage.getItem("staff_session");
      if (session) {
        // router.replace("/(tabs)/menu");
      }
    } catch (e) { }
  };

  const handleStaffLogin = async () => {
    if (!staffEmail || !staffPassword) {
      Alert.alert("Error", "Please enter both Email and Password.");
      return;
    }
    setIsStaffLoading(true);
    try {
      const res: any = await staffService.login(staffEmail, staffPassword);
      if (res.success && res.data) {
        // Save session locally
        await AsyncStorage.setItem("staff_session", JSON.stringify(res.data));
        // Also save businessId for other modules (Bills & Transactions, Party, etc.)
        await AsyncStorage.setItem("staff_business_id", res.data.businessId);

        triggerRefresh(); // Update root layout & drawer auth status
        setStaffModalVisible(false);
        Alert.alert("Success", `Welcome back, ${res.data.name}!`);
        router.replace("/(tabs)/menu");
      } else {
        Alert.alert("Login Failed", res.message || "Invalid credentials");
      }
    } catch (err) {
      Alert.alert("Error", "Login failed. Please check your internet connection.");
    } finally {
      setIsStaffLoading(false);
    }
  };

  const handleGoogleSignIn = React.useCallback(async () => {
    if (!isLoaded) return;

    try {
      await WebBrowser.warmUpAsync();

      const redirectUrl = AuthSession.makeRedirectUri({
        path: "oauth-native-callback",
      });

      console.log("🚀 Starting Google OAuth with useOAuth...");
      
      const { createdSessionId, setActive: setSessionActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        console.log("✅ OAuth Success, setting session...");
        await setSessionActive?.({ session: createdSessionId });
        router.replace("/(tabs)/menu");
      } else {
        console.warn("⚠️ OAuth flow did not result in a session immediately. Check Clerk dashboard for required steps.");
      }
    } catch (err: any) {
      console.error("❌ Google Sign-in error:", err.message || err);
      Alert.alert("Sign-in Failed", "Could not complete Google sign-in. Please try again.");
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }, [isLoaded, startOAuthFlow, router]);

  return (
    <LinearGradient colors={["#FF5F6D", "#FFC371"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.bottomWave} />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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

        {/* Google Button */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Google_%22G%22_Logo.svg",
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Staff Login Button */}
        <TouchableOpacity
          style={[styles.staffLoginBtn, { backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "#fff" }]}
          onPress={() => setStaffModalVisible(true)}
        >
          <Ionicons name="people" size={24} color="#fff" style={{ marginRight: 15 }} />
          <Text style={[styles.googleText, { color: "#fff" }]}>Staff Login</Text>
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

        {/* Staff Login Modal */}
        <Modal
          visible={staffModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setStaffModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Staff Login</Text>
                <TouchableOpacity onPress={() => setStaffModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Staff Email ID"
                  placeholderTextColor="#9CA3AF"
                  style={styles.modalInput}
                  value={staffEmail}
                  onChangeText={setStaffEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.modalInput}
                  value={staffPassword}
                  onChangeText={setStaffPassword}
                  secureTextEntry={!showStaffPassword}
                />
                <TouchableOpacity onPress={() => setShowStaffPassword(!showStaffPassword)} style={{ padding: 5 }}>
                  <Ionicons name={showStaffPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleStaffLogin}
                disabled={isStaffLoading}
              >
                {isStaffLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Login Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
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
  staffLoginBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  modalSubmitBtn: {
    backgroundColor: "#FF5F6D",
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
    shadowColor: "#FF5F6D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalSubmitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
