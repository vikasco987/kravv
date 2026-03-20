import { useAuth } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";

export default function ViewCompanyProfileScreen() {
  const [loading, setLoading] = useState(true);
  
  // Custom Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "warning">("success");
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showStatus = (type: "success" | "error" | "warning", title: string, message: string) => {
    setModalType(type);
    setModalContent({ title, message });
    setModalVisible(true);
  };
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { t } = useLanguage();

  // 👇 replace this with your deployed backend URL
  const BACKEND_URL = "https://billing.kravy.in";

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.warn(`ℹ️ [Profile] Received non-JSON profile response. Status: ${res.status}. Body: ${text.slice(0, 50)}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (res.ok && data) {
        setProfile(data);
      } else {
        console.log("No profile found or error:", data);
      }
    } catch (err) {
      console.error("fetchProfile Error:", err);
      showStatus("error", "Sync Error", "Could not fetch your profile details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isLoaded && isSignedIn) {
        fetchProfile();
      }
    }, [isLoaded, isSignedIn])
  );

  const renderStatusModal = () => {
    let iconName: keyof typeof Ionicons.glyphMap;
    let iconColor: string;
    let backgroundColor: string;

    switch (modalType) {
      case "success":
        iconName = "checkmark-circle";
        iconColor = "#22C55E";
        backgroundColor = "#F0FDF4";
        break;
      case "error":
        iconName = "close-circle";
        iconColor = "#EF4444";
        backgroundColor = "#FEF2F2";
        break;
      case "warning":
        iconName = "warning";
        iconColor = "#F59E0B";
        backgroundColor = "#FFFBEB";
        break;
      default:
        iconName = "information-circle";
        iconColor = "#3B82F6";
        backgroundColor = "#EFF6FF";
    }

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <View style={[styles.iconCircleBig, { backgroundColor }]}>
              <Ionicons name={iconName} size={rf(40)} color={iconColor} />
            </View>
            <Text style={styles.emptyTitle}>{modalContent.title}</Text>
            <Text style={styles.emptyText}>{modalContent.message}</Text>
            <TouchableOpacity
              style={[styles.createBtn, { width: '100%', justifyContent: 'center' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.createBtnText}>{t('done') || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!profile || !profile.businessName) {
    return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: vs(50), left: s(20) }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={rf(22)} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.emptyCard}>
          <View style={styles.iconCircleBig}>
            <Ionicons name="business" size={rf(50)} color="#4f46e5" />
          </View>
          <Text style={styles.emptyTitle}>{t('boost_sales') || 'Boost Your Sales!'}</Text>
          <Text style={styles.emptyText}>{t('setup_profile_desc') || 'Set up your professional business profile to add branding to your bills and QR codes.'}</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/party/info" as any)}
          >
            <Text style={styles.createBtnText}>{t('create_profile')}</Text>
            <Feather name="arrow-right" size={rf(18)} color="#fff" />
          </TouchableOpacity>
        </View>
        {renderStatusModal()}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={rf(22)} color="#1E293B" />
       </TouchableOpacity>
 
      <View style={styles.profileHeader}>
        <Text style={styles.title}>{t('business_profile') || 'Business Profile'}</Text>
        <Text style={styles.subtitle}>{t('professional_identity') || 'Your professional identity on Kravy'}</Text>
      </View>

      <View style={styles.logoSection}>
        {profile.profileImageUrl || profile.logoUrl ? (
          <Image source={{ uri: profile.profileImageUrl || profile.logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={rf(40)} color="#4f46e5" />
          </View>
        )}
        <Text style={styles.profileName}>{profile.businessName}</Text>
        {profile.businessTagLine ? <Text style={styles.profileTagline}>{profile.businessTagLine}</Text> : null}
      </View>
      {/* Identity Card */}
      <View style={styles.detailCard}>
        <View style={styles.cardHeader}>
          <Feather name="briefcase" size={rf(18)} color="#4f46e5" />
          <Text style={styles.cardTitle}>{t('business_identity') || 'Business Identity'}</Text>
        </View>
        <View style={styles.divider} />
        {renderDetailRow(t('type') || "Type", profile.businessType)}
        {renderDetailRow(t('gstin') || "GSTIN", profile.gstNumber || (t('not_provided') || "Not Provided"))}
      </View>
 
      {/* Contact Card */}
      <View style={styles.detailCard}>
        <View style={styles.cardHeader}>
          <Feather name="user" size={rf(18)} color="#4f46e5" />
          <Text style={styles.cardTitle}>{t('contact_info') || 'Contact Information'}</Text>
        </View>
        <View style={styles.divider} />
        {renderDetailRow(t('person') || "Person", profile.contactPersonName)}
        {renderDetailRow(t('phone') || "Phone", profile.contactPersonPhone)}
        {renderDetailRow(t('email') || "Email", profile.contactPersonEmail)}
      </View>
 
      {/* Address Card */}
      <View style={styles.detailCard}>
        <View style={styles.cardHeader}>
          <Feather name="map-pin" size={rf(18)} color="#4f46e5" />
          <Text style={styles.cardTitle}>{t('location_pay') || 'Location & Pay'}</Text>
        </View>
        <View style={styles.divider} />
        {renderDetailRow(t('address') || "Address", profile.businessAddress || (t('not_provided') || "Not Provided"))}
        {renderDetailRow(t('state') || "State", profile.state || (t('not_provided') || "Not Provided"))}
        {renderDetailRow(t('upi_id') || "UPI ID", profile.upi || (t('not_provided') || "Not Provided"))}
      </View>
 
      {profile.googleReviewUrl ? (
        <View style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <Feather name="star" size={rf(18)} color="#f59e0b" />
            <Text style={styles.cardTitle}>{t('public_link') || 'Public Link'}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.value, { color: "#2563eb", marginTop: vs(5) }]}>
            {profile.googleReviewUrl}
          </Text>
        </View>
      ) : null}

       {profile.signatureUrl ? (
        <View style={{ alignItems: "flex-end", marginTop: 30 }}>
          <Image source={{ uri: profile.signatureUrl }} style={styles.signature} />
          <Text style={{ fontSize: 12, color: "gray" }}>{t('authorized_signature') || 'Authorized Signature'}</Text>
        </View>
      ) : null}

      <TouchableOpacity
         style={styles.editBtn}
        onPress={() => router.push("/party/info" as any)}
      >
        <Feather name="edit-3" size={rf(20)} color="#fff" />
        <Text style={styles.editBtnText}>{t('edit_profile')}</Text>
      </TouchableOpacity>
      {renderStatusModal()}
    </ScrollView>
  );
}

function renderDetailRow(label: string, value: string) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: s(20),
    backgroundColor: "#F8FAFC",
  },
  profileHeader: {
    marginTop: vs(20),
    marginBottom: vs(30),
    alignItems: 'center',
  },
  title: {
    fontSize: rf(28),
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: rf(14),
    color: "#64748B",
    marginTop: vs(4),
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: vs(30),
  },
  logo: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoPlaceholder: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileName: {
    fontSize: rf(22),
    fontWeight: '700',
    color: '#1e293b',
    marginTop: vs(15),
  },
  profileTagline: {
    fontSize: rf(14),
    color: '#64748B',
    marginTop: vs(4),
    fontStyle: 'italic',
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(20),
    marginBottom: vs(20),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(12),
  },
  cardTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: vs(15),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  label: {
    fontWeight: "600",
    color: "#94A3B8",
    fontSize: rf(13),
  },
  value: {
    fontSize: rf(15),
    color: "#1e293b",
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: s(20),
  },
  signature: {
    width: s(100),
    height: s(60),
    resizeMode: "contain",
  },
  editBtn: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(16),
    borderRadius: s(16),
    marginTop: vs(10),
    gap: s(10),
    marginBottom: vs(40),
    shadowColor: '#4f46e5',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  editBtnText: {
    color: "#fff",
    fontSize: rf(16),
    fontWeight: "bold",
  },
  backButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(10),
    marginBottom: vs(10),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  // New Enhanced Styles
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: s(30),
    padding: s(30),
    alignItems: 'center',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  iconCircleBig: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  emptyTitle: {
    fontSize: rf(24),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: vs(10),
  },
  emptyText: {
    fontSize: rf(15),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: vs(22),
    marginBottom: vs(30),
  },
  createBtn: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(16),
    paddingHorizontal: s(24),
    borderRadius: s(16),
    gap: s(10),
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: rf(16),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center' as const,
  },
  modalContentSmall: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: s(24),
    padding: s(24),
    alignItems: 'center' as const,
  },
  iconCircleModal: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: vs(15),
  },
  modalTitle: {
    fontSize: rf(20),
    fontWeight: '800' as const,
    color: '#1E293B',
    marginBottom: vs(8),
  },
  modalMessage: {
    fontSize: rf(14),
    color: '#64748B',
    textAlign: 'center' as const,
    lineHeight: vs(20),
    marginBottom: vs(20),
  },
  modalBtn: {
    width: '100%',
    paddingVertical: vs(12),
    borderRadius: s(12),
    alignItems: 'center' as const,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: rf(16),
  },
});
