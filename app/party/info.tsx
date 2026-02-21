// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";

// export default function CompanyInfoScreen() {
//   const [loading, setLoading] = useState(false);
//   const [company, setCompany] = useState<any>(null);

//   const [businessType, setBusinessType] = useState("");
//   const [businessName, setBusinessName] = useState("");
//   const [businessTagline, setBusinessTagline] = useState("");
//   const [contactName, setContactName] = useState("");
//   const [contactPhone, setContactPhone] = useState("");
//   const [contactEmail, setContactEmail] = useState("");
//   const [upi, setUpi] = useState("");
//   const [reviewLink, setReviewLink] = useState("");

//   // 👇 change this to your backend URL
//   const BACKEND_URL = "https://billing-backend-sable.vercel.app";

//   useEffect(() => {
//     fetchCompany();
//   }, []);

//   const fetchCompany = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`${BACKEND_URL}/api/profile/recent`);
//       const data = await res.json();

//       if (res.ok) {
//         setCompany(data);
//         setBusinessType(data.businessType || "");
//         setBusinessName(data.businessName || "");
//         setBusinessTagline(data.businessTagLine || "");
//         setContactName(data.contactPersonName || "");
//         setContactPhone(data.contactPersonPhone || "");
//         setContactEmail(data.contactPersonEmail || "");
//         setUpi(data.upi || "");
//         setReviewLink(data.googleReviewUrl || "");
//       } else {
//         console.log("No profile found");
//       }
//     } catch (err) {
//       console.error("Error fetching company:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!businessType || !businessName || !contactName || !contactPhone || !contactEmail) {
//       Alert.alert("Missing Fields", "Please fill all required fields.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const res = await fetch(`${BACKEND_URL}/api/profile`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           businessType,
//           businessName,
//           businessTagline,
//           contactName,
//           contactPhone,
//           contactEmail,
//           upi,
//           reviewLink,
//         }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         Alert.alert("✅ Success", "Company info saved!");
//         setCompany(data);
//       } else {
//         Alert.alert("Error", data.error || "Failed to save profile");
//       }
//     } catch (err) {
//       console.error("Save error:", err);
//       Alert.alert("Error", "Something went wrong. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading)
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#4f46e5" />
//       </View>
//     );

//   return (
//     <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f9f9f9" }}>
//       <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
//         🏢 Company Info
//       </Text>

//       <Text style={styles.label}>Business Type*</Text>
//       <TextInput
//         style={styles.input}
//         value={businessType}
//         onChangeText={setBusinessType}
//         placeholder="e.g. Retail / Service"
//       />

//       <Text style={styles.label}>Business Name*</Text>
//       <TextInput
//         style={styles.input}
//         value={businessName}
//         onChangeText={setBusinessName}
//         placeholder="Enter your business name"
//       />

//       <Text style={styles.label}>Tagline</Text>
//       <TextInput
//         style={styles.input}
//         value={businessTagline}
//         onChangeText={setBusinessTagline}
//         placeholder="Your business tagline"
//       />

//       <Text style={styles.label}>Contact Person*</Text>
//       <TextInput
//         style={styles.input}
//         value={contactName}
//         onChangeText={setContactName}
//         placeholder="Contact person name"
//       />

//       <Text style={styles.label}>Phone*</Text>
//       <TextInput
//         style={styles.input}
//         value={contactPhone}
//         onChangeText={setContactPhone}
//         keyboardType="phone-pad"
//         placeholder="Phone number"
//       />

//       <Text style={styles.label}>Email*</Text>
//       <TextInput
//         style={styles.input}
//         value={contactEmail}
//         onChangeText={setContactEmail}
//         keyboardType="email-address"
//         placeholder="Email address"
//       />

//       <Text style={styles.label}>UPI</Text>
//       <TextInput
//         style={styles.input}
//         value={upi}
//         onChangeText={setUpi}
//         placeholder="UPI ID (optional)"
//       />

//       <Text style={styles.label}>Google Review Link</Text>
//       <TextInput
//         style={styles.input}
//         value={reviewLink}
//         onChangeText={setReviewLink}
//         placeholder="Paste your Google review link"
//       />

//       <TouchableOpacity onPress={handleSave} style={styles.button}>
//         <Text style={styles.buttonText}>{company ? "Update Info" : "Save Info"}</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = {
//   label: {
//     fontWeight: "bold",
//     marginBottom: 5,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     backgroundColor: "white",
//   },
//   button: {
//     backgroundColor: "#4f46e5",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
// };











// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import { useAuth } from "@clerk/clerk-expo";

// export default function CompanyInfoScreen() {
//   const { getToken } = useAuth(); // 👈 Clerk token fetcher
//   const [loading, setLoading] = useState(false);
//   const [company, setCompany] = useState<any>(null);

//   const [businessType, setBusinessType] = useState("");
//   const [businessName, setBusinessName] = useState("");
//   const [businessTagline, setBusinessTagline] = useState("");
//   const [contactName, setContactName] = useState("");
//   const [contactPhone, setContactPhone] = useState("");
//   const [contactEmail, setContactEmail] = useState("");
//   const [upi, setUpi] = useState("");
//   const [reviewLink, setReviewLink] = useState("");

//   const BACKEND_URL = "https://billing-backend-sable.vercel.app";

//   useEffect(() => {
//     fetchCompany();
//   }, []);

//   // 🔹 Fetch company data
//   const fetchCompany = async () => {
//     try {
//       setLoading(true);
//       const token = await getToken(); // 👈 get token
//       console.log("🔑 Clerk Token (GET):", token); // ✅ log token

//       const res = await fetch(`${BACKEND_URL}/api/profile`, {
//         headers: {
//           Authorization: `Bearer ${token}`, // 👈 send token to backend
//         },
//       });

//       const data = await res.json();
//       if (res.ok) {
//         setCompany(data);
//         setBusinessType(data.businessType || "");
//         setBusinessName(data.businessName || "");
//         setBusinessTagline(data.businessTagLine || "");
//         setContactName(data.contactPersonName || "");
//         setContactPhone(data.contactPersonPhone || "");
//         setContactEmail(data.contactPersonEmail || "");
//         setUpi(data.upi || "");
//         setReviewLink(data.googleReviewUrl || "");
//       } else {
//         console.log("No profile found:", data);
//       }
//     } catch (err) {
//       console.error("Error fetching company:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔹 Save company data
//   const handleSave = async () => {
//     if (!businessType || !businessName || !contactName || !contactPhone || !contactEmail) {
//       Alert.alert("Missing Fields", "Please fill all required fields.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = await getToken();
//       console.log("🔑 Clerk Token (POST):", token); // ✅ log token

//       const res = await fetch(`${BACKEND_URL}/api/profile`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`, // 👈 include token
//         },
//         body: JSON.stringify({
//           businessType,
//           businessName,
//           businessTagline,
//           contactName,
//           contactPhone,
//           contactEmail,
//           upi,
//           reviewLink,
//         }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         Alert.alert("✅ Success", "Company info saved!");
//         setCompany(data);
//       } else {
//         Alert.alert("Error", data.error || "Failed to save profile");
//       }
//     } catch (err) {
//       console.error("Save error:", err);
//       Alert.alert("Error", "Something went wrong. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading)
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#4f46e5" />
//       </View>
//     );

//   return (
//     <ScrollView contentContainerStyle={{ padding: 20 }}>
//       <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
//         🏢 Company Info
//       </Text>

//       {renderInput("Business Type*", businessType, setBusinessType)}
//       {renderInput("Business Name*", businessName, setBusinessName)}
//       {renderInput("Tagline", businessTagline, setBusinessTagline)}
//       {renderInput("Contact Person*", contactName, setContactName)}
//       {renderInput("Phone*", contactPhone, setContactPhone)}
//       {renderInput("Email*", contactEmail, setContactEmail)}
//       {renderInput("UPI", upi, setUpi)}
//       {renderInput("Google Review Link", reviewLink, setReviewLink)}

//       <TouchableOpacity onPress={handleSave} style={styles.button}>
//         <Text style={styles.buttonText}>{company ? "Update Info" : "Save Info"}</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// function renderInput(label, value, setValue) {
//   return (
//     <>
//       <Text style={styles.label}>{label}</Text>
//       <TextInput
//         style={styles.input}
//         value={value}
//         onChangeText={setValue}
//         placeholder={label}
//       />
//     </>
//   );
// }

// const styles = {
//   label: {
//     fontWeight: "bold",
//     marginBottom: 5,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//     backgroundColor: "white",
//   },
//   button: {
//     backgroundColor: "#4f46e5",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
// };













import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function CompanyInfoScreen() {
  const { getToken } = useAuth(); // 👈 Clerk token fetcher
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const [businessType, setBusinessType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessTagline, setBusinessTagline] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [upi, setUpi] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [logo, setLogo] = useState("");
  const [signature, setSignature] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");

  const BACKEND_URL = "https://billing-backend-sable.vercel.app";

  useEffect(() => {
    fetchCompany();
  }, []);

  // 🔹 Fetch company data
  const fetchCompany = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      console.log("🔑 Clerk Token (GET):", token);

      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("📡 Fetched company data:", data);

      if (res.ok) {
        setCompany(data);
        setBusinessType(data.businessType || "");
        setBusinessName(data.businessName || "");
        setBusinessTagline(data.businessTagLine || "");
        setContactName(data.contactPersonName || "");
        setContactPhone(data.contactPersonPhone || "");
        setContactEmail(data.contactPersonEmail || "");
        setUpi(data.upi || "");
        setReviewLink(data.googleReviewUrl || "");
        setProfileImage(data.profileImageUrl || "");
        setLogo(data.logoUrl || "");
        setSignature(data.signatureUrl || "");
        setGstNumber(data.gstNumber || "");
        setBusinessAddress(data.businessAddress || "");
        setState(data.state || "");
        setPinCode(data.pinCode || "");
      } else {
        console.warn("⚠️ No profile found:", data);
      }
    } catch (err) {
      console.error("❌ Error fetching company:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Save company data
  const handleSave = async () => {
    if (!businessType || !businessName || !contactName || !contactPhone || !contactEmail) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      console.log("🔑 Clerk Token (POST):", token);

      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessType,
          businessName,
          businessTagline,
          contactName,
          contactPhone,
          contactEmail,
          upi,
          reviewLink,
          profileImage,
          logo,
          signature,
          gstNumber,
          businessAddress,
          state,
          pinCode,
        }),
      });

      const data = await res.json();
      console.log("📡 POST response:", data);

      if (res.ok) {
        Alert.alert("✅ Success", "Company info saved!");
        setCompany(data);
      } else {
        Alert.alert("❌ Error", data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      Alert.alert("❌ Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        🏢 Company Info
      </Text>

      {renderInput("Business Type*", businessType, setBusinessType)}
      {renderInput("Business Name*", businessName, setBusinessName)}
      {renderInput("Tagline", businessTagline, setBusinessTagline)}
      {renderInput("Contact Person*", contactName, setContactName)}
      {renderInput("Phone*", contactPhone, setContactPhone)}
      {renderInput("Email*", contactEmail, setContactEmail)}
      {renderInput("UPI", upi, setUpi)}
      {renderInput("Google Review Link", reviewLink, setReviewLink)}
      {renderInput("Profile Image URL", profileImage, setProfileImage)}
      {renderInput("Logo URL", logo, setLogo)}
      {renderInput("Signature URL", signature, setSignature)}
      {renderInput("GST Number", gstNumber, setGstNumber)}
      {renderInput("Address", businessAddress, setBusinessAddress)}
      {renderInput("State", state, setState)}
      {renderInput("PIN Code", pinCode, setPinCode)}

      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>{company ? "Update Info" : "Save Info"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function renderInput(label, value, setValue) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={label}
      />
    </View>
  );
}

const styles = {
  label: { fontWeight: "bold", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
};
