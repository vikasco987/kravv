import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

interface CompanyInfoViewProps {
  onBack?: () => void;
  profileData?: any;
  isNew?: boolean;
  onProfileUpdated?: () => void;
}

const THEME_COLOR = "#4F46E5";
const SUCCESS_COLOR = "#10B981";
const ERROR_COLOR = "#F43F5E";
const WARNING_COLOR = "#F59E0B";

export default function CompanyInfoView({ onBack, profileData, isNew, onProfileUpdated }: CompanyInfoViewProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();

  const [step, setStep] = useState(0); // 0 is Landing, 1-4 are steps
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);

  useEffect(() => {
    const checkStaff = async () => {
      const session = await AsyncStorage.getItem("staff_session");
      if (session) {
        setIsStaffSignedIn(true);
      }
    };
    checkStaff();
  }, []);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "warning">(
    "success",
  );
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    tagline: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    businessAddress: "",
    state: "",
    pinCode: "",
    upiId: "",
    googleReviewLink: "",
    profileImage: "",
    signatureUrl: "",
    businessEmail: "", // Added businessEmail state
  });

  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (isLoaded && (isSignedIn || isStaffSignedIn)) {
      if (profileData) {
        updateFormWithData(profileData);
        setHasProfile(true);
        setStep(-1);
        setIsInitialLoading(false);
      } else if (isNew) {
        setHasProfile(false);
        setStep(1); // skip landing page
        setIsInitialLoading(false);
      } else {
        loadProfile();
      }
    }
  }, [isLoaded, isSignedIn, isStaffSignedIn, profileData, isNew]);

  const loadProfile = async () => {
    try {
      setIsInitialLoading(true);

      // 🚀 STEP 1: Quick Load from Cache for immediate UI
      const cached = await AsyncStorage.getItem("@cached_business_profile");
      let foundCache = false;
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (
            data &&
            (data.businessName || data.companyName || data.business_name)
          ) {
            updateFormWithData(data);
            setHasProfile(true);
            setStep(-1);
            foundCache = true;
            // If we found cache, we can show the UI immediately while network refreshes in background
            setIsInitialLoading(false);
          }
        } catch (e) {
          console.error("Cache Parse Error:", e);
        }
      }

      // 🚀 STEP 2: Network Refresh from Network
      const clerkToken = await getToken();
      const staffToken = await AsyncStorage.getItem("staff_token");
      const token = clerkToken || staffToken;

      const bId = await StaffPermissionEngine.getActiveBusinessId(
        isSignedIn ? user?.id : undefined,
      );

      if (!token && !bId) {
        if (!foundCache) setIsInitialLoading(false);
        return;
      }

      const url = bId
        ? `https://billing.kravy.in/api/profile?businessId=${bId}`
        : "https://billing.kravy.in/api/profile";

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const resData = await response.json();
        const data = resData?.data || resData;

        if (
          data &&
          (data.businessName || data.companyName || data.business_name)
        ) {
          updateFormWithData(data);
          await AsyncStorage.setItem(
            "@cached_business_profile",
            JSON.stringify(data),
          );
          setHasProfile(true);
          setStep(-1);
        } else if (!foundCache) {
          // No profile on server and no cache — show landing page
          setHasProfile(false);
          setStep(0);
        }
      } else if (!foundCache) {
        // API failed and no cache — show landing page as fallback
        setStep(0);
      }
    } catch (e) {
      console.error("Load Profile Error:", e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const updateFormWithData = (data: any) => {
    // Handle potential nesting
    const d = data?.data || data;
    if (!d) return;

    setForm({
      businessType: d.businessType || d.business_type || "",
      businessName:
        d.businessName ||
        d.companyName ||
        d.business_name ||
        d.company_name ||
        "",
      tagline: d.businessTagLine || d.tagline || d.business_tagline || "",
      contactPerson:
        d.contactPersonName ||
        d.contactPerson ||
        d.contact_person ||
        d.name ||
        "",
      phone:
        d.contactPersonPhone || d.companyPhone || d.phone || d.mobile || "",
      email: d.email || d.contactPersonEmail || d.contact_person_email || "",
      gstNumber: d.gstNumber || d.gst_number || d.gstin || "",
      businessAddress:
        d.businessAddress ||
        d.companyAddress ||
        d.address ||
        d.business_address ||
        "",
      state: d.state || "",
      pinCode: d.pinCode || d.pincode || d.zip || d.zip_code || "",
      upiId: d.upiId || d.upi || d.upi_id || "",
      googleReviewLink:
        d.googleReviewLink || d.google_review_link || d.review_link || "",
      profileImage:
        d.profileImageUrl ||
        d.logoUrl ||
        d.logo_url ||
        d.image ||
        d.profile_image ||
        "",
      signatureUrl: d.signatureUrl || d.signature_url || d.signature || "",
      businessEmail: d.businessEmail || d.business_email || "",
    });
  };

  const handleBack = () => {
    if (step === -1) {
      if (onBack) onBack();
      else router.back();
    } else if (step === 1 && hasProfile) {
      setStep(-1);
    } else if (step > 0) {
      setStep(step - 1);
    } else {
      if (onBack) onBack();
      else router.back();
    }
  };

  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.businessType.trim()) return "Business Type is required";
      if (!form.businessName.trim()) return "Business Name is required";
    } else if (step === 2) {
      if (!form.contactPerson.trim()) return "Contact Person is required";
      if (!form.phone.trim()) return "Phone Number is required";
      if (!form.email.trim()) return "Email is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim()))
        return "Please enter a valid email";
    } else if (step === 3) {
      if (!form.businessAddress.trim()) return "Business Address is required";
      if (!form.state.trim()) return "State is required";
      if (!form.pinCode.trim()) return "PIN Code is required";
    }
    return null;
  };

  const handleContinue = () => {
    const error = validateStep();
    if (error) {
      showAlert("warning", "Missing Details", error);
      return;
    }
    setStep(step + 1);
  };

  const pickImage = async (field: "profileImage" | "signatureUrl") => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "error",
          "Permission Denied",
          "We need permission to access your gallery.",
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: field === "profileImage" ? [1, 1] : [2, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        uploadToCloudinary(result.assets[0].uri, field);
      }
    } catch (e) {
      showAlert("error", "Error", "Failed to pick image.");
    }
  };

  const uploadToCloudinary = async (
    uri: string,
    field: "profileImage" | "signatureUrl",
  ) => {
    setUploadingImage(true);
    try {
      const cloudName = "digpvlfup";
      const uploadPreset = "mybillingmenu";
      const formData = new FormData();
      const fileName = uri.split("/").pop() || "upload.jpg";
      const fileExt = fileName.split(".").pop() || "jpg";
      const fileType = `image/${fileExt}`;

      // Create blob or use simpler approach for RN
      // @ts-ignore
      formData.append("file", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        type: fileType,
        name: fileName,
      });
      formData.append("upload_preset", uploadPreset);
      formData.append("cloud_name", cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Upload failed");

      setForm((prev) => ({ ...prev, [field]: data.secure_url }));
    } catch (e) {
      console.error("Cloudinary Upload Error:", e);
      showAlert(
        "error",
        "Upload Failed",
        "Could not upload image to Cloudinary.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    // Final validation
    const error = validateStep();
    if (error) {
      showAlert("warning", "Missing Details", error);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const payload = {
        id: profileData?.id || undefined,
        isNewProfile: !profileData?.id,
        businessName: form.businessName,
        businessType: form.businessType,
        businessTagLine: form.tagline,
        contactPersonName: form.contactPerson,
        contactPersonPhone: form.phone,
        contactPersonEmail: form.email,
        gstNumber: form.gstNumber,
        businessAddress: form.businessAddress,
        state: form.state,
        pinCode: form.pinCode,
        upi: form.upiId,
        businessEmail: form.businessEmail,
        googleReviewLink: form.googleReviewLink,
        logoUrl: form.profileImage,
        profileImageUrl: form.profileImage,
        signatureUrl: form.signatureUrl,
      };

      const res = await fetch("https://billing.kravy.in/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setHasProfile(true);
        // Update cache immediately with the latest form data
        await AsyncStorage.setItem(
          "@cached_business_profile",
          JSON.stringify(payload),
        );
        showAlert("success", "Success!", "Profile saved successfully!");
        onProfileUpdated?.();
      } else {
        const errorData = await res.json();
        showAlert(
          "error",
          "Save Failed",
          errorData.message || "Something went wrong.",
        );
      }
    } catch (e) {
      showAlert("error", "Connection Error", "Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    if (step <= 0) return null;
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <View
              style={[styles.stepCircle, step >= i && styles.stepCircleActive]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  step >= i && styles.stepCircleTextActive,
                ]}
              >
                {i}
              </Text>
            </View>
            {i < 4 && (
              <View
                style={[styles.stepLine, step > i && styles.stepLineActive]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  // --- Step -1: Summary/View Mode ---
  if (step === -1) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Business Profile</Text>
          <Text style={styles.subtitle}>Your saved professional identity</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            {form.profileImage ? (
              <Image
                source={{ uri: form.profileImage }}
                style={styles.summaryLogo}
              />
            ) : (
              <View style={styles.summaryLogoPlaceholder}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={rf(30)}
                  color={THEME_COLOR}
                />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: s(15) }}>
              <Text style={styles.summaryBizName}>{form.businessName}</Text>
              <Text style={styles.summaryTagline}>
                {form.tagline || "Smart Billing Solutions"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {renderSummarySection(
            "Identity",
            [
              { label: "Type", value: form.businessType },
              { label: "GSTIN", value: form.gstNumber || "N/A" },
            ],
            "office-building",
          )}

          {renderSummarySection(
            "Contact",
            [
              { label: "Person", value: form.contactPerson },
              { label: "Phone", value: form.phone },
              { label: "Contact Email", value: form.email },
              { label: "Business Email", value: form.businessEmail },
            ],
            "person",
          )}

          {renderSummarySection(
            "Address",
            [
              { label: "Address", value: form.businessAddress },
              { label: "State", value: form.state },
              { label: "PIN", value: form.pinCode },
            ],
            "location",
          )}

          {renderSummarySection(
            "Payments",
            [
              { label: "UPI", value: form.upiId || "N/A" },
              { label: "Review Link", value: form.googleReviewLink || "N/A" },
            ],
            "credit-card-outline",
          )}

          {form.signatureUrl ? (
            <View style={styles.summarySection}>
              <View style={styles.summarySectionHeader}>
                <Ionicons name="pencil" size={rf(18)} color={THEME_COLOR} />
                <Text style={styles.summarySectionTitle}>Signature</Text>
              </View>
              <Image
                source={{ uri: form.signatureUrl }}
                style={{
                  width: s(150),
                  height: vs(70),
                  borderRadius: s(8),
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                }}
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => setStep(1)}>
          <Feather name="edit-3" size={rf(20)} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- Step 0: Landing ---
  if (step === 0) {
    return (
      <View style={styles.landingContainer}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButtonAbsolute}
        >
          <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.landingCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="office-building"
              size={rf(48)}
              color="#6366F1"
            />
          </View>
          <Text style={styles.landingTitle}>Boost Your Sales!</Text>
          <Text style={styles.landingSubtitle}>
            Set up your professional business profile to add branding to your
            bills and QR codes.
          </Text>
          <TouchableOpacity
            style={styles.landingButton}
            onPress={() => setStep(1)}
          >
            <Text style={styles.primaryButtonText}>
              Create Business Profile
            </Text>
            <Feather name="arrow-right" size={rf(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {hasProfile ? "Edit Profile" : "Setup Profile"}
          </Text>
          <Text style={styles.subtitle}>
            Let&apos;s build your professional presence
          </Text>
        </View>

        {renderStepIndicator()}

        <View style={styles.card}>
          {step === 1 && (
            <View>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={rf(22)}
                  color="#111827"
                />
                <Text style={styles.sectionTitle}>Business Identity</Text>
              </View>
              {renderInput(
                "Business Type*",
                form.businessType,
                (t) => setForm({ ...form, businessType: t }),
                "Business Type*",
              )}
              {renderInput(
                "Business Name*",
                form.businessName,
                (t) => setForm({ ...form, businessName: t }),
                "Business Name*",
              )}
              {renderInput(
                "Tagline",
                form.tagline,
                (t) => setForm({ ...form, tagline: t }),
                "Tagline",
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={rf(22)} color={THEME_COLOR} />
                <Text style={styles.sectionTitle}>Contact Details</Text>
              </View>
              {renderInput(
                "Contact Person*",
                form.contactPerson,
                (t) => setForm({ ...form, contactPerson: t }),
                "Contact Person*",
              )}
              {renderInput(
                "Phone*",
                form.phone,
                (t) => setForm({ ...form, phone: t }),
                "Phone*",
                "phone-pad",
              )}
              {renderInput(
                "Contact Email*",
                form.email,
                (t) => setForm({ ...form, email: t }),
                "Contact Email*",
                "email-address",
              )}
              {renderInput(
                "Business Email",
                form.businessEmail,
                (t) => setForm({ ...form, businessEmail: t }),
                "Business Email",
                "email-address",
              )}
            </View>
          )}

          {step === 3 && (
            <View>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={rf(22)} color={ERROR_COLOR} />
                <Text style={styles.sectionTitle}>Address & Tax</Text>
              </View>
              {renderInput(
                "GST Number",
                form.gstNumber,
                (t) => setForm({ ...form, gstNumber: t }),
                "GST Number",
              )}
              {renderInput(
                "Business Address*",
                form.businessAddress,
                (t) => setForm({ ...form, businessAddress: t }),
                "Business Address*",
              )}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: s(10) }}>
                  {renderInput(
                    "State*",
                    form.state,
                    (t) => setForm({ ...form, state: t }),
                    "State*",
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput(
                    "PIN Code*",
                    form.pinCode,
                    (t) => setForm({ ...form, pinCode: t }),
                    "PIN Code*",
                    "number-pad",
                  )}
                </View>
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="image-area"
                  size={rf(22)}
                  color={WARNING_COLOR}
                />
                <Text style={styles.sectionTitle}>Branding & Payments</Text>
              </View>
              {renderInput(
                "UPI ID",
                form.upiId,
                (t) => setForm({ ...form, upiId: t }),
                "UPI ID",
              )}
              {renderInput(
                "Google Review Link",
                form.googleReviewLink,
                (t) => setForm({ ...form, googleReviewLink: t }),
                "Google Review Link",
              )}

              <Text style={styles.label}>Profile Image / Logo</Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => pickImage("profileImage")}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={THEME_COLOR} />
                ) : form.profileImage ? (
                  <Image
                    source={{ uri: form.profileImage }}
                    style={styles.logoPreview}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="camera-outline"
                      size={rf(30)}
                      color="#94A3B8"
                    />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Business Signature</Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => pickImage("signatureUrl")}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={THEME_COLOR} />
                ) : form.signatureUrl ? (
                  <Image
                    source={{ uri: form.signatureUrl }}
                    style={styles.logoPreview}
                    resizeMode="contain"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="pencil-outline"
                      size={rf(30)}
                      color="#94A3B8"
                    />
                    <Text style={styles.uploadText}>Upload Signature</Text>
                  </>
                )}
              </TouchableOpacity>
              {renderInput(
                "Signature URL (Manual)",
                form.signatureUrl,
                (t) => setForm({ ...form, signatureUrl: t }),
                "Paste Link or Upload above",
              )}
            </View>
          )}
        </View>

        <View style={styles.footerButtons}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { flex: step === 4 ? 1.5 : 1 },
              step === 4 && { backgroundColor: SUCCESS_COLOR },
            ]}
            onPress={step === 4 ? handleSave : handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {step === 4 ? "Save Profile" : "Continue"}
                </Text>
                {step < 4 && (
                  <Feather name="arrow-right" size={rf(18)} color="#fff" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Beautiful Custom Modal matching screenshot */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalIconCircle,
                {
                  backgroundColor:
                    modalType === "success"
                      ? "#E6F6F1"
                      : modalType === "error"
                        ? ERROR_COLOR + "20"
                        : WARNING_COLOR + "20",
                },
              ]}
            >
              <Ionicons
                name={
                  modalType === "success"
                    ? "checkmark-circle"
                    : modalType === "error"
                      ? "close-circle"
                      : "alert-circle"
                }
                size={rf(52)}
                color={
                  modalType === "success"
                    ? SUCCESS_COLOR
                    : modalType === "error"
                      ? ERROR_COLOR
                      : WARNING_COLOR
                }
              />
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                {
                  backgroundColor:
                    modalType === "success"
                      ? SUCCESS_COLOR
                      : modalType === "error"
                        ? ERROR_COLOR
                        : WARNING_COLOR,
                },
              ]}
              onPress={() => {
                setModalVisible(false);
                if (modalType === "success" && step === 4) setStep(-1); // Go back to summary on success
              }}
            >
              <Text style={styles.modalBtnText}>
                {modalType === "success" ? "Okay, Got it" : "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function renderInput(
  label: string,
  value: string,
  onChange: (t: string) => void,
  placeholder: string,
  keyboard: any = "default",
) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboard}
      />
    </View>
  );
}

function renderSummarySection(
  title: string,
  items: { label: string; value: string }[],
  icon: any,
) {
  return (
    <View style={styles.summarySection}>
      <View style={styles.summarySectionHeader}>
        <MaterialCommunityIcons name={icon} size={rf(18)} color={THEME_COLOR} />
        <Text style={styles.summarySectionTitle}>{title}</Text>
      </View>
      <View style={styles.summaryItemsGrid}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>{item.label}</Text>
            <Text style={styles.summaryItemValue} numberOfLines={2}>
              {item.value || "Not Set"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  landingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: s(30),
  },
  landingCard: {
    width: "100%",
    backgroundColor: "#fff",
    padding: s(30),
    borderRadius: s(30),
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  landingTitle: {
    fontSize: rf(24),
    fontWeight: "800",
    color: "#1E293B",
    marginTop: vs(20),
  },
  landingSubtitle: {
    fontSize: rf(14),
    color: "#64748B",
    textAlign: "center",
    marginVertical: vs(20),
    lineHeight: rf(22),
  },
  iconCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonAbsolute: {
    position: "absolute",
    top: vs(60),
    left: s(20),
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  scrollContainer: { padding: s(20), paddingBottom: vs(50) },
  backButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(35),
    elevation: 2,
  },
  header: { marginTop: vs(25), marginBottom: vs(25) },
  title: { fontSize: rf(28), fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: rf(14), color: "#64748B", marginTop: vs(5) },

  stepIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(30),
  },
  stepCircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
  stepCircleText: { fontSize: rf(12), color: "#64748B", fontWeight: "700" },
  stepCircleTextActive: { color: "#fff" },
  stepLine: {
    height: 2,
    width: s(40),
    backgroundColor: "#E2E8F0",
    marginHorizontal: s(5),
  },
  stepLineActive: { backgroundColor: THEME_COLOR },

  card: {
    backgroundColor: "#fff",
    borderRadius: s(24),
    padding: s(24),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: vs(25),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(20),
    gap: s(10),
  },
  sectionTitle: { fontSize: rf(18), fontWeight: "700", color: "#1E293B" },

  inputContainer: { marginBottom: vs(18) },
  label: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: vs(8),
  },
  input: {
    height: vs(52),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    paddingHorizontal: s(15),
    fontSize: rf(15),
    color: "#1E293B",
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row" },

  uploadBox: {
    height: vs(120),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginBottom: vs(18),
  },
  uploadText: {
    fontSize: rf(14),
    color: "#64748B",
    marginTop: vs(5),
    fontWeight: "600",
  },
  logoPreview: { width: "100%", height: "100%", borderRadius: s(16) },

  footerButtons: { flexDirection: "row", gap: s(15) },
  primaryButton: {
    height: vs(56),
    borderRadius: s(16),
    backgroundColor: THEME_COLOR,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: s(10),
  },
  landingButton: {
    height: vs(56),
    borderRadius: s(28),
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: s(10),
    width: "100%",
  },
  primaryButtonText: { color: "#fff", fontSize: rf(16), fontWeight: "700" },
  secondaryButton: {
    height: vs(56),
    borderRadius: s(16),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    flex: 0.6,
  },
  secondaryButtonText: {
    color: "#64748B",
    fontSize: rf(16),
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: s(20),
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: s(32),
    padding: s(30),
    alignItems: "center",
  },
  modalIconCircle: {
    width: s(90),
    height: s(90),
    borderRadius: s(45),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  modalTitle: { fontSize: rf(22), fontWeight: "800", color: "#1E293B" },
  modalMessage: {
    fontSize: rf(15),
    color: "#64748B",
    textAlign: "center",
    marginVertical: vs(20),
    lineHeight: rf(22),
  },
  modalBtn: {
    width: "100%",
    height: vs(54),
    borderRadius: s(18),
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: rf(16) },

  // Summary Styles
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: s(24),
    padding: s(24),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(20),
  },
  summaryLogo: {
    width: s(60),
    height: s(60),
    borderRadius: s(12),
    backgroundColor: "#F1F5F9",
  },
  summaryLogoPlaceholder: {
    width: s(60),
    height: s(60),
    borderRadius: s(12),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryBizName: { fontSize: rf(20), fontWeight: "800", color: "#1E293B" },
  summaryTagline: { fontSize: rf(13), color: "#64748B", marginTop: vs(2) },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: vs(20) },
  summarySection: { marginBottom: vs(20) },
  summarySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(12),
    gap: s(8),
  },
  summarySectionTitle: {
    fontSize: rf(15),
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryItemsGrid: { flexDirection: "row", flexWrap: "wrap", gap: s(15) },
  summaryItem: { width: "45%", marginBottom: vs(5) },
  summaryItemLabel: { fontSize: rf(12), color: "#94A3B8", fontWeight: "600" },
  summaryItemValue: {
    fontSize: rf(14),
    color: "#1E293B",
    fontWeight: "600",
    marginTop: vs(2),
  },
  editButton: {
    height: vs(56),
    borderRadius: s(18),
    backgroundColor: THEME_COLOR,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: s(10),
    marginTop: vs(30),
  },
  editButtonText: { color: "#fff", fontSize: rf(16), fontWeight: "700" },
});
