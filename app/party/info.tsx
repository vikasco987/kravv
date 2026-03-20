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
//   const BACKEND_URL = "https://billing.kravy.in";

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

//   const BACKEND_URL = "https://billing.kravy.in";

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













import { useAuth } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { rf, s, vs } from "../../utils/responsive";
import { Feather, Ionicons } from "@expo/vector-icons";

export default function CompanyInfoScreen() {
  const { getToken } = useAuth(); // 👈 Clerk token fetcher
  const router = useRouter();
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
  const [currentStep, setCurrentStep] = useState(1);

  // Custom Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "warning">("success");
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showStatus = (type: "success" | "error" | "warning", title: string, message: string) => {
    setModalType(type);
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const BACKEND_URL = "https://billing.kravy.in";

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

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.warn(`ℹ️ [Info] Received non-JSON profile response. Status: ${res.status}. Body: ${text.slice(0, 50)}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("📡 Fetched company data:", data);

      if (res.ok && data) {
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

  const uploadImageToCloudinary = async (uri: string) => {
    const cloudName = "digpvlfup";
    const uploadPreset = "mybillingmenu";

    const formData = new FormData();
    const fileName = uri.split("/").pop() || "upload.jpg";
    const fileType = fileName.split(".").pop() || "jpg";

    // @ts-ignore
    formData.append("file", {
      uri: uri,
      type: `image/${fileType}`,
      name: fileName,
    });
    formData.append("upload_preset", uploadPreset);
    formData.append("cloud_name", cloudName);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json",
      },
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Cloudinary error: ${text || "Empty response"}`);
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `Cloudinary upload failed: ${text}`);
    }

    return data.secure_url;
  };

  // 🔹 Save company data
  const handleSave = async () => {
    if (!businessType || !businessName || !contactName || !contactPhone || !contactEmail) {
      showStatus("warning", "Fields Required", "Please fill all required business and contact fields.");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      console.log("🔑 Clerk Token (POST):", token);

      let finalImageUrl = profileImage;
      let finalLogoUrl = logo;
      let finalSignatureUrl = signature;

      // 1. Upload Profile Image to Cloudinary if it's a local file
      if (profileImage && (profileImage.startsWith("file://") || profileImage.startsWith("content://"))) {
        try {
          finalImageUrl = await uploadImageToCloudinary(profileImage);
          console.log("✅ Profile image uploaded to Cloudinary:", finalImageUrl);
        } catch (uploadError) {
          console.error("❌ Profile upload to Cloudinary failed:", uploadError);
        }
      }

      // 2. Upload Logo to Cloudinary if it's a local file
      if (logo && (logo.startsWith("file://") || logo.startsWith("content://"))) {
        try {
          finalLogoUrl = await uploadImageToCloudinary(logo);
          console.log("✅ Logo uploaded to Cloudinary:", finalLogoUrl);
        } catch (uploadError) {
          console.error("❌ Logo upload to Cloudinary failed:", uploadError);
        }
      }

      // 3. Upload Signature to Cloudinary if it's a local file
      if (signature && (signature.startsWith("file://") || signature.startsWith("content://"))) {
        try {
          finalSignatureUrl = await uploadImageToCloudinary(signature);
          console.log("✅ Signature uploaded to Cloudinary:", finalSignatureUrl);
        } catch (uploadError) {
          console.error("❌ Signature upload to Cloudinary failed:", uploadError);
        }
      }

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
          profileImage: finalImageUrl,
          logo: finalLogoUrl,
          signature: finalSignatureUrl,
          gstNumber,
          businessAddress,
          state,
          pinCode,
        }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error(`❌ [Info] Save failed with non-JSON response. Status: ${res.status}. Body: ${text.slice(0, 50)}`);
        data = { error: `Server error (${res.status})` };
      }
      
      console.log("📡 POST response:", data);

      if (res.ok) {
        showStatus("success", "Profile Saved!", "Your business profile has been updated successfully.");
        // We'll handle navigation inside the modal's close action or useEffect
      } else {
        showStatus("error", "Save Failed", data.error || "Something went wrong while saving.");
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

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={[
              styles.stepCircle,
              currentStep >= step ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              <Text style={[
                styles.stepText,
                currentStep >= step ? styles.stepTextActive : styles.stepTextInactive
              ]}>{step}</Text>
            </View>
            {step < 4 && <View style={[
              styles.stepLine,
              currentStep > step ? styles.stepLineActive : styles.stepLineInactive
            ]} />}
          </View>
        ))}
      </View>
    );
  };

  const nextStep = () => {
    if (currentStep === 1 && (!businessType || !businessName)) {
      return showStatus("warning", "Missing Info", "Business Name and Type are required to proceed.");
    }
    if (currentStep === 2 && (!contactName || !contactPhone || !contactEmail)) {
      return showStatus("warning", "Contact Missing", "Please provide contact details for your business.");
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>🏢 Business Identity</Text>
            {renderInput("Business Type*", businessType, setBusinessType)}
            {renderInput("Business Name*", businessName, setBusinessName)}
            {renderInput("Tagline", businessTagline, setBusinessTagline)}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>👤 Contact Details</Text>
            {renderInput("Contact Person*", contactName, setContactName)}
            {renderInput("Phone*", contactPhone, setContactPhone)}
            {renderInput("Email*", contactEmail, setContactEmail)}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>📍 Address & Tax</Text>
            {renderInput("GST Number", gstNumber, setGstNumber)}
            {renderInput("Business Address", businessAddress, setBusinessAddress)}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>{renderInput("State", state, setState)}</View>
              <View style={{ flex: 1 }}>{renderInput("PIN Code", pinCode, setPinCode)}</View>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>🖼️ Branding & Payments</Text>
            {renderInput("UPI ID", upi, setUpi)}
            {renderInput("Google Review Link", reviewLink, setReviewLink)}
            
            <View style={{ marginBottom: vs(15) }}>
              <Text style={styles.label as any}>Profile Image / Logo</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Feather name="camera" size={rf(30)} color="#ccc" />
                    <Text style={{ color: '#999', marginTop: vs(5) }}>Upload Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {renderInput("Signature URL (Image Link)", signature, setSignature)}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: vs(50), backgroundColor: '#F8FAFC' }}>
      <TouchableOpacity style={styles.topBackButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={rf(22)} color="#1E293B" />
      </TouchableOpacity>

      <View style={styles.mainHeader}>
        <Text style={styles.mainTitle}>Setup Profile</Text>
        <Text style={styles.mainSubtitle}>Let's build your professional presence</Text>
      </View>

      {renderStepIndicator()}

      {renderContent()}

      <View style={styles.navButtons}>
        {currentStep > 1 && (
          <TouchableOpacity onPress={prevStep} style={[styles.navBtn, styles.backBtn]}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 4 ? (
          <TouchableOpacity onPress={nextStep} style={[styles.navBtn, styles.nextBtn, { flex: currentStep === 1 ? 1 : 1.5 }]}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Feather name="arrow-right" size={rf(18)} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} style={[styles.navBtn, styles.saveBtn]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Save Profile</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* --- PREMIUM STATUS MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[
              styles.iconCircle,
              { backgroundColor: modalType === 'success' ? '#DEF7EC' : modalType === 'error' ? '#FDE8E8' : '#FEF3C7' }
            ]}>
              <Feather 
                name={modalType === 'success' ? 'check-circle' : modalType === 'error' ? 'x-circle' : 'alert-triangle'} 
                size={rf(40)} 
                color={modalType === 'success' ? '#0E9F6E' : modalType === 'error' ? '#F05252' : '#D97706'} 
              />
            </View>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalMessage}>{modalContent.message}</Text>
            <TouchableOpacity 
              style={[
                styles.modalBtn,
                { backgroundColor: modalType === 'success' ? '#0E9F6E' : modalType === 'error' ? '#F05252' : '#D97706' }
              ]}
              onPress={() => {
                setModalVisible(false);
                if (modalType === 'success') {
                  router.replace("/party/profile" as any);
                }
              }}
            >
              <Text style={styles.modalBtnText}>Okay, Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function renderInput(label, value, setValue) {
  return (
    <View style={{ marginBottom: vs(15) }}>
      <Text style={styles.label as any}>{label}</Text>
      <TextInput
        style={styles.input as any}
        value={value}
        onChangeText={setValue}
        placeholder={label}
        placeholderTextColor="#1f1e1e63"
      />
    </View>
  );
}

const styles = {
  label: { fontWeight: "bold" as const, marginBottom: vs(5), fontSize: rf(14) },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: s(8),
    padding: s(12),
    backgroundColor: "white",
    fontSize: rf(14),
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: s(15),
    borderRadius: s(10),
    alignItems: "center" as const,
    marginTop: vs(10),
  },
  buttonText: { color: "white", fontWeight: "bold" as const, fontSize: rf(16) },
  imagePicker: {
    width: '100%' as any,
    height: vs(150),
    backgroundColor: '#fff',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    marginTop: vs(5),
  },
  previewImage: {
    width: '100%' as any,
    height: '100%' as any,
    resizeMode: 'cover' as const,
  },
  imagePlaceholder: {
    alignItems: 'center' as const,
  },
  topBackButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#fff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: vs(40),
    marginBottom: vs(10),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  // New Professional Styles
  mainHeader: {
    marginTop: vs(20),
    marginBottom: vs(30),
  },
  mainTitle: {
    fontSize: rf(32),
    fontWeight: '800' as const,
    color: '#0F172A',
  },
  mainSubtitle: {
    fontSize: rf(14),
    color: '#64748B',
    marginTop: vs(5),
  },
  stepIndicatorContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: vs(30),
    paddingHorizontal: s(10),
  },
  stepWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  stepCircle: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
  },
  stepCircleActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  stepCircleInactive: {
    backgroundColor: '#fff',
    borderColor: '#E2E8F0',
  },
  stepText: {
    fontSize: rf(14),
    fontWeight: '700' as const,
  },
  stepTextActive: {
    color: '#fff',
  },
  stepTextInactive: {
    color: '#94A3B8',
  },
  stepLine: {
    height: 2,
    flex: 1,
    marginHorizontal: s(5),
  },
  stepLineActive: {
    backgroundColor: '#4f46e5',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepCard: {
    backgroundColor: '#fff',
    padding: s(24),
    borderRadius: s(24),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: vs(30),
  },
  stepTitle: {
    fontSize: rf(20),
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: vs(20),
  },
  navButtons: {
    flexDirection: 'row' as const,
    gap: s(15),
  },
  navBtn: {
    height: vs(56),
    borderRadius: s(16),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: s(10),
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nextBtn: {
    backgroundColor: '#4f46e5',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#10b981',
  },
  backBtnText: {
    color: '#64748B',
    fontWeight: '600' as const,
    fontSize: rf(16),
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: rf(16),
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: s(20),
  },
  modalContent: {
    width: '90%' as any,
    backgroundColor: '#fff',
    borderRadius: s(30),
    padding: s(30),
    alignItems: 'center' as const,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: vs(20),
  },
  modalTitle: {
    fontSize: rf(22),
    fontWeight: '800' as const,
    color: '#1E293B',
    marginBottom: vs(10),
    textAlign: 'center' as const,
  },
  modalMessage: {
    fontSize: rf(15),
    color: '#64748B',
    textAlign: 'center' as const,
    lineHeight: vs(22),
    marginBottom: vs(30),
  },
  modalBtn: {
    width: '100%' as any,
    height: vs(54),
    borderRadius: s(18),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 4,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: rf(16),
  },
};
