// import React, { useState } from "react";
// import { View, Button, Text, TextInput, Alert, ActivityIndicator } from "react-native";
// import { useSignIn } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";

// export default function SignInScreen() {
//   const { signIn, setActive, isLoaded } = useSignIn();
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSignIn = async () => {
//     if (!isLoaded) {
//       Alert.alert("Please wait", "Authentication service is still loading.");
//       return;
//     }

//     if (!email || !password) {
//       Alert.alert("Missing fields", "Please enter both email and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await signIn.create({
//         identifier: email.trim(),
//         password: password,
//       });

//       // ✅ Create a session and activate it
//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         router.replace("/menu"); // Redirect after successful login
//       } else {
//         console.warn("Unexpected sign-in status:", result.status);
//         Alert.alert("Error", "Sign-in did not complete. Try again.");
//       }
//     } catch (err: any) {
//       console.error("Sign in error:", err.errors || err);
//       const message = err?.errors?.[0]?.message || "Something went wrong. Please try again.";
//       Alert.alert("Sign in failed", message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         padding: 20,
//         backgroundColor: "#fff",
//       }}
//     >
//       <Text style={{ fontSize: 22, marginBottom: 20, fontWeight: "bold" }}>Sign In</Text>

//       <TextInput
//         value={email}
//         onChangeText={setEmail}
//         placeholder="Enter email"
//         autoCapitalize="none"
//         keyboardType="email-address"
//         style={{
//           borderWidth: 1,
//           borderColor: "#ccc",
//           padding: 10,
//           width: "100%",
//           borderRadius: 10,
//           marginBottom: 15,
//         }}
//       />

//       <TextInput
//         value={password}
//         onChangeText={setPassword}
//         placeholder="Enter password"
//         secureTextEntry
//         style={{
//           borderWidth: 1,
//           borderColor: "#ccc",
//           padding: 10,
//           width: "100%",
//           borderRadius: 10,
//           marginBottom: 20,
//         }}
//       />

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <Button title="Sign In" onPress={handleSignIn} />
//       )}

//       <Text
//         style={{
//           marginTop: 20,
//           color: "#007bff",
//           textDecorationLine: "underline",
//         }}
//         onPress={() => router.push("/sign-up")}
//       >
//         Don’t have an account? Sign Up
//       </Text>
//     </View>
//   );
// }







// import React, { useState } from "react";
// import { View, Button, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from "react-native";
// import { useSignIn } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession(); // Required for OAuth in Expo

// export default function SignInScreen() {
//   const { signIn, setActive, isLoaded } = useSignIn();
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Email/Password SignIn
//   const handleSignIn = async () => {
//     if (!isLoaded) return;
//     if (!email || !password) {
//       Alert.alert("Missing fields", "Please enter both email and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await signIn.create({ identifier: email.trim(), password });

//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         router.replace("/menu");
//       } else {
//         console.warn("Unexpected sign-in status:", result.status);
//         Alert.alert("Error", "Sign-in did not complete. Try again.");
//       }
//     } catch (err: any) {
//       console.error("Sign in error:", err.errors || err);
//       Alert.alert("Sign in failed", err?.errors?.[0]?.message || "Something went wrong. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Google SignIn
//   const handleGoogleSignIn = async () => {
//     if (!isLoaded) return;
//     setLoading(true);
//     try {
//       const result = await signIn.startOAuthFlow({ strategy: "oauth_google" });
//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         router.replace("/menu");
//       }
//     } catch (err: any) {
//       console.error("Google Sign In failed:", err);
//       Alert.alert("Google Sign In failed", err?.message || "Try again");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Sign In</Text>

//       <TextInput
//         value={email}
//         onChangeText={setEmail}
//         placeholder="Enter email"
//         autoCapitalize="none"
//         keyboardType="email-address"
//         style={styles.input}
//       />
//       <TextInput
//         value={password}
//         onChangeText={setPassword}
//         placeholder="Enter password"
//         secureTextEntry
//         style={styles.input}
//       />

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <>
//           <Button title="Sign In" onPress={handleSignIn} />
//           <View style={{ marginTop: 10 }}>
//             <Button title="Sign In with Google" onPress={handleGoogleSignIn} color="#de4b39" />
//           </View>
//         </>
//       )}

//       <Text
//         style={styles.signUpText}
//         onPress={() => router.push("/sign-up")}
//       >
//         Don’t have an account? Sign Up
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     width: "100%",
//     borderRadius: 10,
//     marginBottom: 15,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   signUpText: {
//     marginTop: 20,
//     color: "#007bff",
//     textDecorationLine: "underline",
//   },
// });















// import React, { useState } from "react";
// import {
//   View,
//   Button,
//   Text,
//   TextInput,
//   Alert,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import { useSignIn, useOAuth } from "@clerk/clerk-expo"; // ✅ useOAuth is correct
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession(); // ✅ Required for OAuth in Expo

// export default function SignInScreen() {
//   const { signIn, setActive, isLoaded } = useSignIn();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" }); // ✅ correct Clerk OAuth hook
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // ✅ Email + Password Sign In
//   const handleSignIn = async () => {
//     if (!isLoaded) return;

//     if (!email || !password) {
//       Alert.alert("Missing fields", "Please enter both email and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await signIn.create({
//         identifier: email.trim(),
//         password,
//       });

//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         router.replace("/menu");
//       } else {
//         Alert.alert("Error", "Sign-in did not complete. Try again.");
//       }
//     } catch (err: any) {
//       console.error("Sign in error:", err.errors || err);
//       Alert.alert(
//         "Sign in failed",
//         err?.errors?.[0]?.message || "Something went wrong. Try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Google OAuth Sign In
//   const handleGoogleSignIn = async () => {
//     try {
//       setLoading(true);
//       const { createdSessionId, setActive: setActiveOAuth, signIn } =
//         await startOAuthFlow();

//       if (createdSessionId) {
//         await setActiveOAuth({ session: createdSessionId });
//         router.replace("/menu");
//       } else if (signIn) {
//         console.log("Additional verification required:", signIn);
//       }
//     } catch (err: any) {
//       console.error("Google Sign In failed:", err);
//       Alert.alert(
//         "Google Sign In failed",
//         err?.message || "Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Sign In</Text>

//       <TextInput
//         value={email}
//         onChangeText={setEmail}
//         placeholder="Enter email"
//         autoCapitalize="none"
//         keyboardType="email-address"
//         style={styles.input}
//       />
//       <TextInput
//         value={password}
//         onChangeText={setPassword}
//         placeholder="Enter password"
//         secureTextEntry
//         style={styles.input}
//       />

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <>
//           <Button title="Sign In" onPress={handleSignIn} />

//           <View style={{ marginTop: 10 }}>
//             <Button
//               title="Sign In with Google"
//               onPress={handleGoogleSignIn}
//               color="#de4b39"
//             />
//           </View>
//         </>
//       )}

//       <Text
//         style={styles.signUpText}
//         onPress={() => router.push("/sign-up")}
//       >
//         Don’t have an account? Sign Up
//       </Text>
//     </View>
//   );
// }

// // ✅ Styling
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     width: "100%",
//     borderRadius: 10,
//     marginBottom: 15,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   signUpText: {
//     marginTop: 20,
//     color: "#007bff",
//     textDecorationLine: "underline",
//   },
// });












// import React, { useState } from "react";
// import {
//   View,
//   Button,
//   Text,
//   TextInput,
//   Alert,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import { useSignIn, useOAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession(); // Required for OAuth in Expo

// export default function SignInScreen() {
//   const router = useRouter();
//   const { signIn, setActive, isLoaded } = useSignIn();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Email/Password sign-in
//   const handleSignIn = async () => {
//     if (!isLoaded) return;

//     if (!email || !password) {
//       Alert.alert("Missing fields", "Please enter both email and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await signIn.create({
//         identifier: email.trim(),
//         password,
//       });

//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         router.replace("/menu");
//       } else {
//         Alert.alert("Error", "Sign-in did not complete. Try again.");
//       }
//     } catch (err: any) {
//       console.error("Sign in error:", err.errors || err);
//       Alert.alert(
//         "Sign in failed",
//         err?.errors?.[0]?.message || "Something went wrong. Try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Google OAuth sign-in (auto-creates user if not existing)
//   const handleGoogleSignIn = async () => {
//     setLoading(true);
//     try {
//       const { createdSessionId, signUp, signIn } = await startOAuthFlow();

//       if (createdSessionId) {
//         // Successfully signed in (new or existing user)
//         await setActive({ session: createdSessionId });
//         router.replace("/menu");
//       } else if (signUp) {
//         // New user just created
//         await setActive({ session: signUp.createdSessionId });
//         router.replace("/menu");
//       } else if (signIn) {
//         // Existing user signed in
//         await setActive({ session: signIn.createdSessionId });
//         router.replace("/menu");
//       } else {
//         Alert.alert("Google Sign-in failed", "Try again.");
//       }
//     } catch (err: any) {
//       console.error("Google OAuth error:", err);
//       Alert.alert(
//         "Google Sign In failed",
//         err?.message || "Something went wrong. Try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Sign In</Text>

//       <TextInput
//         value={email}
//         onChangeText={setEmail}
//         placeholder="Enter email"
//         autoCapitalize="none"
//         keyboardType="email-address"
//         style={styles.input}
//       />
//       <TextInput
//         value={password}
//         onChangeText={setPassword}
//         placeholder="Enter password"
//         secureTextEntry
//         style={styles.input}
//       />

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <>
//           <Button title="Sign In" onPress={handleSignIn} />

//           <View style={{ marginTop: 10 }}>
//             <Button
//               title="Sign In with Google"
//               onPress={handleGoogleSignIn}
//               color="#de4b39"
//             />
//           </View>
//         </>
//       )}

//       <Text
//         style={styles.signUpText}
//         onPress={() => router.push("/sign-up")}
//       >
//         Don’t have an account? Sign Up
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     width: "100%",
//     borderRadius: 10,
//     marginBottom: 15,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   signUpText: {
//     marginTop: 20,
//     color: "#007bff",
//     textDecorationLine: "underline",
//   },
// });













// import React, { useState } from "react";
// import {
//   View,
//   Button,
//   Text,
//   TextInput,
//   Alert,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import { useSignIn, useOAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// // Required for OAuth in Expo
// WebBrowser.maybeCompleteAuthSession();

// export default function SignInScreen() {
//   const router = useRouter();
//   const { signIn, setActive, isLoaded } = useSignIn();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Email/Password sign-in
//   const handleSignIn = async () => {
//     if (!isLoaded) return;

//     if (!email || !password) {
//       Alert.alert("Missing fields", "Please enter both email and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await signIn.create({
//         identifier: email.trim(),
//         password,
//       });

//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         router.replace("/menu");
//       } else {
//         Alert.alert("Error", "Sign-in did not complete. Try again.");
//       }
//     } catch (err: any) {
//       console.error("Sign in error:", err.errors || err);
//       Alert.alert(
//         "Sign in failed",
//         err?.errors?.[0]?.message || "Something went wrong. Try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Google OAuth sign-in (auto-creates user if not existing)
//   const handleGoogleSignIn = async () => {
//     setLoading(true);
//     try {
//       const { createdSessionId, signUp, signIn: oauthSignIn } = await startOAuthFlow();

//       if (createdSessionId) {
//         // Successfully signed in (new or existing user)
//         await setActive({ session: createdSessionId });
//         router.replace("/menu");
//       } else if (signUp) {
//         // New user just created
//         await setActive({ session: signUp.createdSessionId });
//         router.replace("/menu");
//       } else if (oauthSignIn) {
//         // Existing user signed in
//         await setActive({ session: oauthSignIn.createdSessionId });
//         router.replace("/menu");
//       } else {
//         Alert.alert("Google Sign-in failed", "Try again.");
//       }
//     } catch (err: any) {
//       console.error("Google OAuth error:", err);
//       Alert.alert(
//         "Google Sign In failed",
//         err?.message || "Something went wrong. Try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Sign In</Text>

//       <TextInput
//         value={email}
//         onChangeText={setEmail}
//         placeholder="Enter email"
//         autoCapitalize="none"
//         keyboardType="email-address"
//         style={styles.input}
//       />
//       <TextInput
//         value={password}
//         onChangeText={setPassword}
//         placeholder="Enter password"
//         secureTextEntry
//         style={styles.input}
//       />

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <>
//           <Button title="Sign In" onPress={handleSignIn} />

//           <View style={{ marginTop: 10 }}>
//             <Button
//               title="Sign In with Google"
//               onPress={handleGoogleSignIn}
//               color="#de4b39"
//             />
//           </View>
//         </>
//       )}

//       <Text
//         style={styles.signUpText}
//         onPress={() => router.push("/sign-up")}
//       >
//         Don’t have an account? Sign Up
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     width: "100%",
//     borderRadius: 10,
//     marginBottom: 15,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   signUpText: {
//     marginTop: 20,
//     color: "#007bff",
//     textDecorationLine: "underline",
//   },
// });





















// import React from "react";
// import { ClerkProvider } from "@clerk/clerk-expo";
// import { Stack } from "expo-router";
// import Constants from "expo-constants";
// import * as SecureStore from "expo-secure-store";
// import * as WebBrowser from "expo-web-browser";

// // Complete OAuth login if needed
// WebBrowser.maybeCompleteAuthSession();

// const tokenCache = {
//   async getToken(key: string) {
//     return await SecureStore.getItemAsync(key);
//   },
//   async saveToken(key: string, value: string) {
//     await SecureStore.setItemAsync(key, value);
//   },
// };

// export default function RootLayout() {
//   const publishableKey =
//     Constants.expoConfig?.extra?.clerkPublishableKey ||
//     process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

//   if (!publishableKey) {
//     throw new Error("Missing Clerk Publishable Key in app config.");
//   }

//   return (
//     <ClerkProvider
//       publishableKey={publishableKey}
//       tokenCache={tokenCache}
//     >
//       <Stack screenOptions={{ headerShown: false }} />
//     </ClerkProvider>
//   );
// }


// import { useSignIn } from '@clerk/clerk-expo'
// import { Link, useRouter } from 'expo-router'
// import { Text, TextInput, Button, View, TouchableOpacity } from 'react-native'
// import React, {useCallback, useState} from 'react'

// export default function Page() {
//   const { signIn, setActive, isLoaded } = useSignIn()
//   const router = useRouter()

//   const [emailAddress, setEmailAddress] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState(null)

//   const onSignInPress = useCallback(async () => {
//     if (!isLoaded) {
//       return
//     }

//     try {
//       const signInAttempt = await signIn.create({
//         identifier: emailAddress,
//         password,
//       })

//       if (signInAttempt.status === 'complete') {
//         await setActive({ session: signInAttempt.createdSessionId })
//         router.replace('/')
//       } else {
//         setError('Sign in failed. Please check your credentials')
//         console.error(JSON.stringify(signInAttempt, null, 2))
//       }
//     } catch (err) {
//         if(err.errors){
//             const identifierError = err.errors.find(error => error.code === 'form_identifier_invalid');
//             const passwordError = err.errors.find(error => error.code === 'form_password_incorrect');
//             setError(null);
//             if(identifierError){
//                 setError('User does not exist')
//             }
//             else if(lengthError){
//                 setError('Your password is incorrect')
//             }
//             else {
//                 setError('Sign in failed')
//             }
//           }
//           else{
//             setError('Unknown Error occurred')
//       console.error(JSON.stringify(err, null, 2))
//     }
//     }
//   }, [isLoaded, emailAddress, password])

//   return (
//     <View className="flex-1 justify-center items-center bg-gray-50 px-6">
//         <Text className="text-4xl font-extrabold text-teal-600 mb-6">Sign in</Text>
//         {
//             error && (
//                 <Text className="text-red-500 mb-4 text-center">{error}</Text>
//             )
//         }
//           <TextInput
//             className="bg-white border border-gray-300 rounded-lg w-full p-4 mb-4 shadow-sm"
//             autoCapitalize="none"
//             value={emailAddress}
//             placeholder="Email..."
//             onChangeText={setEmailAddress}
//             keyboardType='email-address'
//           />
//           <TextInput
//             className="bg-white border border-gray-300 rounded-lg w-full p-4 mb-4 shadow-sm"
//             value={password}
//             placeholder="Password..."
//             secureTextEntry={true}
//             onChangeText={setPassword}
//           />
//           <TouchableOpacity className="bg-teal-600 py-4 rounded-full shadow-lg w-full" onPress={onSignInPress}>
//             <Text className="text-white text-center text-lg font-bold">Sign in</Text>
//           </TouchableOpacity>
//           <View className="flex-row justify-center mt-6">
//             <Text className="text-gray-700">Don't have an Account?</Text>
//             <TouchableOpacity onPress={() => router.push('/sign-up')}>
//                 <Text className="text-teal-600 font-semibold ml-1">login</Text>
//             </TouchableOpacity>
//           </View>
//           <View className="flex-row justify-center mt-6">
//           <TouchableOpacity onPress={() => router.push('/')}>
//                 <Text className="text-teal-600 font-semibold ml-1">Go to Home</Text>
//             </TouchableOpacity>
//           </View>
//     </View>
//   )
// }







// import React, { useEffect, useState } from "react";
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
// import * as WebBrowser from "expo-web-browser";
// import { useOAuth, useUser, useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";

// WebBrowser.maybeCompleteAuthSession();

// export default function SignIn() {
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isSignedIn, isLoaded } = useUser();
//   const { signOut } = useAuth();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);

//   // Redirect immediately if already signed in
//   useEffect(() => {
//     if (isLoaded && isSignedIn) {
//       router.replace("/menu");
//     }
//   }, [isLoaded, isSignedIn]);

//   const handleSignIn = async () => {
//     if (!isLoaded) return; // wait for Clerk to load
//     if (isSignedIn) {
//       router.replace("/menu");
//       return;
//     }

//     try {
//       setLoading(true);
//       const result = await startOAuthFlow();

//       if (result?.createdSessionId) {
//         console.log("✅ Google sign-in successful!");
//         router.replace("/menu");
//       } else {
//         Alert.alert("Sign-in cancelled", "Please try again.");
//       }
//     } catch (err: any) {
//       console.error("❌ Sign-in error:", err);
//       Alert.alert("Error", err?.message || "Something went wrong during sign-in.");
//       await signOut();
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isLoaded) {
//     // Show loading while Clerk is initializing
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" />
//         <Text style={{ marginTop: 10 }}>Loading...</Text>
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
//   container: { flex: 1, justifyContent: "center", alignItems: "center" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
//   subtitle: { fontSize: 16, marginBottom: 20 },
// });


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


































// import React, { useEffect, useState } from "react";
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
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

//   useEffect(() => {
//     console.log("🖥️ SignIn loaded. isSignedIn:", isSignedIn);
//     if (isLoaded && isSignedIn) {
//       console.log("🚀 Already signed in — navigating to menu");
//       router.replace("/(tabs)/menu");
//     }
//   }, [isLoaded, isSignedIn]);

//   const handleSignIn = async () => {
//     if (!isLoaded) return;
//     setLoading(true);
//     console.log("🔑 Starting Google OAuth flow...");

//     try {
//       const result = await startOAuthFlow();

//       if (result?.createdSessionId) {
//         console.log("✅ OAuth flow success — sessionId:", result.createdSessionId);
//         const token = await getToken();
//         console.log("🧩 Clerk session token:", token);

//         router.replace("/(tabs)/menu");
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

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to MyBillingAppPro</Text>
//       <Text style={styles.subtitle}>Please sign in to continue</Text>
//       <Button
//         title={loading ? "Signing in..." : "Sign In with Google"}
//         onPress={handleSignIn}
//         disabled={loading}
//       />
//       <View style={{ height: 20 }} />
//       <Button
//         title="Go to Menu (Test Navigation)"
//         onPress={() => router.replace("/(tabs)/menu")}
//       />
//       {Platform.OS === "web" && <Text style={{ marginTop: 10 }}>Web auto-refresh enabled if not signed in.</Text>}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
//   subtitle: { fontSize: 16, marginBottom: 20 },
// });







// import React, { useEffect, useState } from "react";
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
// import * as WebBrowser from "expo-web-browser";
// import { useOAuth, useUser, useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";

// WebBrowser.maybeCompleteAuthSession(); // MUST be here at the top

// export default function SignIn() {
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isLoaded, isSignedIn, user } = useUser();
//   const { getToken, signOut } = useAuth();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);

//   // Step 1: Watch for sign-in state change
//   useEffect(() => {
//     console.log("👀 Checking sign-in state. isLoaded:", isLoaded, "isSignedIn:", isSignedIn);
//     if (isLoaded && isSignedIn) {
//       console.log("✅ User is signed in, fetching token now...");

//       const fetchToken = async () => {
//         let token: string | null = null;
//         const retries = 10;
//         const delay = 700;

//         for (let i = 0; i < retries; i++) {
//           token = await getToken({ skipCache: true });
//           console.log(`🧩 getToken attempt ${i + 1}:`, token ? token.slice(0, 15) + "..." : null);
//           if (token) break;
//           await new Promise((res) => setTimeout(res, delay));
//         }

//         if (!token) {
//           console.warn("⚠️ Token still null after retries.");
//           return;
//         }

//         console.log("🎉 Token received! Navigating to menu...");
//         router.replace("/(tabs)/menu");
//       };

//       fetchToken();
//     }
//   }, [isLoaded, isSignedIn]);

//   const handleSignIn = async () => {
//     if (!isLoaded) return;
//     setLoading(true);

//     console.log("🔑 Starting Google OAuth flow...");
//     try {
//       const result = await startOAuthFlow();
//       console.log("🌐 Returned from Google OAuth:", result);

//       if (result?.createdSessionId) {
//         console.log("✅ OAuth created sessionId:", result.createdSessionId);
//         // Do NOT fetch token here. Wait for useEffect to trigger on isSignedIn.
//       } else {
//         console.log("⚠️ OAuth flow cancelled or failed:", result);
//         Alert.alert("Sign-in cancelled", "Please try again.");
//       }
//     } catch (err: any) {
//       console.error("❌ Sign-in error:", err);
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
//         <Text>Loading Clerk...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to MyBillingAppPro</Text>
//       <Text style={styles.subtitle}>Please sign in to continue</Text>

//       <Button
//         title={loading ? "Signing in..." : "Sign In with Google"}
//         onPress={handleSignIn}
//         disabled={loading}
//       />

//       <View style={{ height: 20 }} />
//       <Button title="Go to Menu (Manual)" onPress={() => router.replace("/(tabs)/menu")} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
//   subtitle: { fontSize: 16, marginBottom: 20 },
// });



















































// import React, { useEffect, useState } from "react";
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
// import * as WebBrowser from "expo-web-browser";
// import { useOAuth, useUser, useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";

// WebBrowser.maybeCompleteAuthSession(); // MUST be here

// export default function SignIn() {
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isLoaded, isSignedIn } = useUser();
//   const { getToken, signOut } = useAuth();
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     console.log("🖥️ SignIn loaded. isSignedIn:", isSignedIn);
//     if (isLoaded && isSignedIn) router.replace("/(tabs)/menu");
//   }, [isLoaded, isSignedIn]);

//   const handleSignIn = async () => {
//     if (!isLoaded) return;
//     setLoading(true);
//     console.log("🔑 Starting Google OAuth flow...");

//     try {
//       const result = await startOAuthFlow();

//       if (result?.createdSessionId) {
//         console.log("✅ OAuth success — sessionId:", result.createdSessionId);

//         // Small delay ensures Clerk updates session internally
//         await new Promise((res) => setTimeout(res, 700));

//         const token = await getToken({ skipCache: true });
//         console.log("🧩 Clerk session token after OAuth:", token);

//         if (!token) {
//           console.warn("⚠️ Token still null. Retrying...");
//           await new Promise((res) => setTimeout(res, 700));
//         }

//         router.replace("/(tabs)/menu");
//       } else {
//         console.log("⚠️ OAuth flow returned null — possibly cancelled");
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

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to MyBillingAppPro</Text>
//       <Text style={styles.subtitle}>Please sign in to continue</Text>
//       <Button
//         title={loading ? "Signing in..." : "Sign In with Google"}
//         onPress={handleSignIn}
//         disabled={loading}
//       />
//       <View style={{ height: 20 }} />
//       <Button
//         title="Go to Menu (Test Navigation)"
//         onPress={() => router.replace("/(tabs)/menu")}
//       />
//       {Platform.OS === "web" && <Text style={{ marginTop: 10 }}>Web auto-refresh enabled if not signed in.</Text>}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
//   subtitle: { fontSize: 16, marginBottom: 20 },
// });











// import React, { useEffect, useState } from "react";
// import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
// import * as WebBrowser from "expo-web-browser";
// import { useOAuth, useUser, useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";

// WebBrowser.maybeCompleteAuthSession();

// export default function SignIn() {
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
//   const { isLoaded: isAuthLoaded, getToken, signOut } = useAuth();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [sessionReady, setSessionReady] = useState(false);

//   // 🧭 Track Clerk initialization
//   useEffect(() => {
//     console.log("🧭 Clerk Status — isAuthLoaded:", isAuthLoaded, "isUserLoaded:", isUserLoaded);
//   }, [isAuthLoaded, isUserLoaded]);

//   // 🚀 Watch for real sign-in completion
//   useEffect(() => {
//     console.log("👀 useEffect triggered: isUserLoaded=", isUserLoaded, "isSignedIn=", isSignedIn);

//     if (isUserLoaded && isSignedIn) {
//       console.log("✅ User signed in! User ID:", user?.id);
//       setSessionReady(true);
//     } else if (isUserLoaded && !isSignedIn) {
//       console.log("🚪 No active session. Waiting for sign-in...");
//       setSessionReady(false);
//     }
//   }, [isUserLoaded, isSignedIn]);

//   // 🔄 Once sessionReady = true, fetch token & navigate
//   useEffect(() => {
//     if (!sessionReady || !isAuthLoaded) return;

//     const fetchToken = async () => {
//       console.log("🎯 Session ready. Fetching Clerk token...");
//       let token = null;
//       const maxAttempts = 8;
//       const delay = 700;

//       for (let i = 0; i < maxAttempts; i++) {
//         token = await getToken({ skipCache: true });
//         console.log(`🧩 getToken attempt ${i + 1}:`, token ? token.slice(0, 25) + "..." : null);
//         if (token) break;
//         await new Promise((res) => setTimeout(res, delay));
//       }

//       if (token) {
//         console.log("🎉 Token retrieved successfully!");
//         router.replace("/(tabs)/menu");
//       } else {
//         console.warn("⚠️ Failed to get token after multiple attempts.");
//         Alert.alert("Token Error", "Could not fetch token. Try reloading app.");
//       }
//     };

//     fetchToken();
//   }, [sessionReady, isAuthLoaded]);

//   // 🔑 Google sign-in handler
//   const handleSignIn = async () => {
//     if (!isAuthLoaded || !isUserLoaded) {
//       console.log("⏳ Clerk not fully initialized yet.");
//       return;
//     }

//     setLoading(true);
//     console.log("🔑 Starting Google OAuth flow...");

//     try {
//       const result = await startOAuthFlow();

//       console.log("🌐 Returned from Google OAuth:", result);

//       if (result?.createdSessionId) {
//         console.log("✅ OAuth session created:", result.createdSessionId);
//         console.log("⏱ Waiting for Clerk to update isSignedIn...");
//         // No token fetching here — we wait for useEffect trigger.
//       } else if (result?.error) {
//         console.log("⚠️ OAuth error:", result.error);
//         Alert.alert("Sign-in failed", result.error.message || "OAuth error occurred");
//       } else {
//         console.log("⚠️ OAuth flow cancelled by user.");
//         Alert.alert("Cancelled", "Google sign-in cancelled.");
//       }
//     } catch (err) {
//       console.error("❌ Sign-in error:", err);
//       Alert.alert("Error", err?.message || "Something went wrong.");
//       await signOut();
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isAuthLoaded || !isUserLoaded) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" />
//         <Text>Loading Clerk authentication...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to MyBillingAppPro</Text>
//       <Text style={styles.subtitle}>Please sign in to continue</Text>

//       <Button
//         title={loading ? "Signing in..." : "Sign In with Google"}
//         onPress={handleSignIn}
//         disabled={loading}
//       />

//       <View style={{ height: 20 }} />
//       <Button title="Go to Menu (Manual)" onPress={() => router.replace("/(tabs)/menu")} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
//   subtitle: { fontSize: 16, marginBottom: 20 },
// });





























// import React, { useEffect } from "react";
// import { View, Text, Button, ActivityIndicator } from "react-native";
// import * as WebBrowser from "expo-web-browser";
// import * as SecureStore from "expo-secure-store";
// import { useOAuth, useAuth } from "@clerk/clerk-expo";

// WebBrowser.maybeCompleteAuthSession();

// // ✅ Safe import — works even if expo-updates is not installed
// let Updates: any;
// try {
//   Updates = require("expo-updates");
//   console.log("✅ expo-updates module loaded");
// } catch (e) {
//   Updates = null;
//   console.log("⚠️ expo-updates not found, using fallback reload");
// }

// export default function AuthScreen({ navigation }) {
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isLoaded, isSignedIn, getToken } = useAuth();

//   useEffect(() => {
//     console.log(`📡 Auth Status → isLoaded: ${isLoaded}, isSignedIn: ${isSignedIn}`);
//   }, [isLoaded, isSignedIn]);

//   useEffect(() => {
//     if (isLoaded && isSignedIn) {
//       console.log("✅ Auth loaded and signed in. Fetching token...");
//       fetchAndSaveToken();
//     }
//   }, [isLoaded, isSignedIn]);

//   const fetchAndSaveToken = async () => {
//     try {
//       const token = await getToken();
//       console.log("🧾 Retrieved token from Clerk:", token ? token.substring(0, 20) + "..." : "null");

//       if (token) {
//         await SecureStore.setItemAsync("__clerk_client_jwt", token);
//         console.log("💾 Saved token to SecureStore (__clerk_client_jwt)");
//         navigation.replace("Menu");
//       } else {
//         console.log("⚠️ No token found yet, skipping save...");
//       }
//     } catch (error) {
//       console.error("❌ Error fetching token:", error);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     try {
//       console.log("🚀 Starting Google OAuth flow...");
//       const result = await startOAuthFlow();

//       if (result?.createdSessionId) {
//         console.log("🎉 Google sign-in completed successfully!");
//         await fetchAndSaveToken();
//       } else {
//         console.log("⚠️ Google sign-in did not create a session.");
//       }
//     } catch (error) {
//       console.error("❌ Google sign-in error:", error);
//     }
//   };

//   const handleReloadApp = async () => {
//     try {
//       console.log("🔁 Reloading app...");
//       if (Updates?.reloadAsync) {
//         await Updates.reloadAsync();
//       } else {
//         console.log("🔄 Using JS navigation reset fallback");
//         navigation.reset({
//           index: 0,
//           routes: [{ name: "(auth)/sign-in" }],
//         });
//       }
//     } catch (error) {
//       console.error("❌ Error reloading app:", error);
//     }
//   };

//   if (!isLoaded) {
//     return <ActivityIndicator size="large" color="#000" />;
//   }

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
//         Welcome to Billing App 👋
//       </Text>

//       <Button title="Sign in with Google" onPress={handleGoogleSignIn} />

//       <View style={{ marginTop: 20 }}>
//         <Button title="🔄 Reload App" onPress={handleReloadApp} color="#4a90e2" />
//       </View>
//     </View>
//   );
// }












//######################################################


// "use client";

// import React from "react";
// import { View, Button, Text } from "react-native";
// import { useOAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession(); // ✅ important

// export default function SignInScreen() {
//   const router = useRouter();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

//   const handleGoogleSignIn = async () => {
//     console.log("🚀 Starting Google OAuth flow...");

//     try {
//       const { createdSessionId, setActive } = await startOAuthFlow();

//       if (createdSessionId) {
//         console.log("✅ Google OAuth success!");
//         await setActive({ session: createdSessionId });
//         router.replace("/"); // or your home screen
//       } else {
//         console.warn("⚠️ No session created.");
//       }
//     } catch (err) {
//       console.error("❌ Google sign-in error:", err);
//     }
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text style={{ fontSize: 18, marginBottom: 20 }}>Sign in to MyBillingApp</Text>
//       <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
//     </View>
//   );
// }








//############################################################################################




























// "use client";

// import React, { useEffect, useState } from "react";
// import { View, Button, Text, ActivityIndicator, Alert } from "react-native";
// import { useOAuth, useAuth, useUser } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession(); // Important

// const BACKEND_URL = "https://billing-backend-sable.vercel.app";

// export default function SignInScreen() {
//   const router = useRouter();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
//   const { isLoaded, isSignedIn, getToken } = useAuth();
//   const { isLoaded: userLoaded, user } = useUser();
//   const [loading, setLoading] = useState(false);

//   // ✅ Trigger post sign-in actions when Clerk session and user are ready
//   useEffect(() => {
//     if (isLoaded && isSignedIn && userLoaded && user?.id) {
//       console.log(
//         "✅ Clerk session ready:",
//         user.emailAddresses?.[0]?.emailAddress || user.id
//       );
//       handlePostSignIn();
//     }
//   }, [isLoaded, isSignedIn, userLoaded, user]);

//   // 🔹 Handle backend user creation & navigation
//   const handlePostSignIn = async () => {
//     setLoading(true);
//     try {
//       // --- Fetch Clerk token with retry ---
//       let token: string | null = null;
//       for (let i = 0; i < 5; i++) {
//         try {
//           token = await getToken({ skipCache: true });
//           console.log(`🔑 getToken attempt ${i + 1}:`, token?.slice(0, 20) + "...");
//           if (token) break;
//         } catch (tokenErr) {
//           console.warn(`⚠️ Token fetch attempt ${i + 1} failed:`, tokenErr);
//         }
//         await new Promise((res) => setTimeout(res, 1000));
//       }
//       if (!token) throw new Error("Clerk token unavailable after retries");

//       // --- Call backend to create user if not exists ---
//       try {
//         const res = await fetch(`${BACKEND_URL}/api/users`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             clerkUserId: user.id,
//             email: user.emailAddresses?.[0]?.emailAddress,
//             firstName: user.firstName,
//             lastName: user.lastName,
//           }),
//         });

//         const data = await res.json();
//         if (!res.ok) {
//           console.error("⚠️ Backend user creation failed:", data);
//           Alert.alert("Backend Error", data.error || "Failed to create user");
//         } else {
//           console.log("🎉 Backend user exists or created successfully:", data);
//         }
//       } catch (backendErr) {
//         console.error("❌ Backend request failed:", backendErr);
//         Alert.alert("Backend Error", backendErr.message || "Failed to reach backend");
//       }

//       // ✅ Navigate to home/dashboard
//       router.replace("/");
//     } catch (err: any) {
//       console.error("❌ Post sign-in error:", err);
//       Alert.alert("Authentication Error", err.message || "Something went wrong after sign-in");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔹 Trigger Google OAuth
//   const handleGoogleSignIn = async () => {
//     if (!isLoaded) return;
//     setLoading(true);

//     try {
//       console.log("🚀 Starting Google OAuth...");
//       const result = await startOAuthFlow();
//       console.log("🌐 OAuth result:", result);

//       if (!result?.createdSessionId) {
//         Alert.alert("Sign-in cancelled", "Please try again.");
//       }
//       // ✅ No need to call handlePostSignIn here; useEffect will trigger when session ready
//     } catch (err: any) {
//       console.error("❌ Google OAuth error:", err);
//       Alert.alert("Sign-in Error", err?.message || "Google sign-in failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔹 Loading state UI
//   if (!isLoaded || !userLoaded || loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//         <Text>{loading ? "Signing in..." : "Loading Clerk..."}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
//       <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
//         Welcome to MyBillingAppPro
//       </Text>
//       <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
//     </View>
//   );
// }











// "use client";

// import React from "react";
// import { View, Button, Text } from "react-native";
// import { useOAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession(); // ✅ important

// export default function SignInScreen() {
//   const router = useRouter();
//   const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

//   const handleGoogleSignIn = async () => {
//     console.log("🚀 Starting Google OAuth flow...");

//     try {
//       const { createdSessionId, setActive } = await startOAuthFlow();

//       if (createdSessionId) {
//         console.log("✅ Google OAuth success!");
//         await setActive({ session: createdSessionId });
//         router.replace("/"); // or your home screen
//       } else {
//         console.warn("⚠️ No session created.");
//       }
//     } catch (err) {
//       console.error("❌ Google sign-in error:", err);
//     }
//   };

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text style={{ fontSize: 18, marginBottom: 20 }}>Sign in to MyBillingApp</Text>
//       <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
//     </View>
//   );
// }

































"use client";

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession(); // ✅ important

export default function SignInScreen() {
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace("/");
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
