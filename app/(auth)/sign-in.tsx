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
import { useClerk, useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
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

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { setActive } = useClerk();
  const { signIn, isLoaded, setActive: setSignInActive } = useSignIn();

  const handleGoogleSignIn = React.useCallback(async () => {
    if (!isLoaded) return;

    try {
      await WebBrowser.warmUpAsync();

      // Generating the redirect URI
      const redirectUrl = AuthSession.makeRedirectUri({
        path: "oauth-native-callback",
      });

      console.log("🚀 Starting Google OAuth...");
      console.log("🔗 Redirect URL:", redirectUrl);

      // Start the flow manually to see where it fails
      const response = await signIn.create({
        strategy: "oauth_google",
        redirectUrl,
      });

      console.log("📥 SignIn Response Status:", response.status);

      const { externalVerificationRedirectURL } = response.firstFactorVerification;

      if (!externalVerificationRedirectURL) {
        throw new Error("Clerk failed to generate a Google Login URL. Please check your Clerk Dashboard settings.");
      }

      console.log("🌐 Opening Browser...");
      const result = await WebBrowser.openAuthSessionAsync(
        externalVerificationRedirectURL.toString(),
        redirectUrl
      );

      if (result.type === "success") {
        const url = new URL(result.url);
        const rotatingTokenNonce = url.searchParams.get("rotating_token_nonce") || "";

        await signIn.reload({ rotatingTokenNonce });

        if (signIn.status === "complete") {
          await setSignInActive({ session: signIn.createdSessionId });
          console.log("✅ Sign-in Complete!");
        } else {
          console.warn("⚠️ Sign-in status not complete:", signIn.status);
        }
      }
    } catch (err: any) {
      console.error("❌ Manual Google Sign-in error:", err.message || err);
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }, [isLoaded, signIn, setSignInActive]);

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

        {/* Footer */}
        <Text style={styles.footer}>
          By signing in, you agree to our{" "}
          <Text style={{ fontWeight: "700", color: "#c94c4cff" }}>Terms</Text> &{" "}
          <Text style={{ fontWeight: "700", color: "#c94c4cff" }}>
            Privacy Policy
          </Text>
          .
        </Text>
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
    marginBottom: 20,
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
    color: "#c94c4c",
    textAlign: "center",
    marginTop: 40,
    fontWeight: "600",
  },
});