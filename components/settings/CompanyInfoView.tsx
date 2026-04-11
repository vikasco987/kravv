import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface CompanyInfoViewProps {
  onBack?: () => void;
}

export default function CompanyInfoView({ onBack }: CompanyInfoViewProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning'>('success');
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    logo: "",
  });

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("https://billing.kravy.in/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalType('success');
        setModalContent({ title: 'Profile Updated', message: 'Your business profile has been saved successfully.' });
        setModalVisible(true);
      } else {
        setModalType('error');
        setModalContent({ title: 'Save Failed', message: 'There was an error saving your profile.' });
        setModalVisible(true);
      }
    } catch (e) {
      setModalType('error');
      setModalContent({ title: 'Error', message: 'Connection issue.' });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.topBackButton}>
        <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
      </TouchableOpacity>

      <View style={styles.mainHeader}>
        <Text style={styles.mainTitle}>Business Profile</Text>
        <Text style={styles.mainSubtitle}>Setup your company information for billing</Text>
      </View>

      <View style={styles.stepCard}>
        {step === 1 ? (
          <View>
            <Text style={styles.stepTitle}>Basic Information</Text>
            {renderInput("Business Name", form.businessName, (t) => setForm({ ...form, businessName: t }))}
            {renderInput("Email Address", form.email, (t) => setForm({ ...form, email: t }))}
            {renderInput("Phone Number", form.phone, (t) => setForm({ ...form, phone: t }))}
          </View>
        ) : (
          <View>
            <Text style={styles.stepTitle}>Address & Tax Info</Text>
            {renderInput("GSTIN (Optional)", form.gstin, (t) => setForm({ ...form, gstin: t }))}
            {renderInput("Address", form.address, (t) => setForm({ ...form, address: t }))}
          </View>
        )}
      </View>

      <View style={styles.navButtons}>
        {step === 1 ? (
          <TouchableOpacity onPress={() => setStep(2)} style={[styles.navBtn, styles.nextBtn, { flex: 1 }]}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <Feather name="arrow-right" size={rf(18)} color="#fff" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => setStep(1)} style={[styles.navBtn, styles.backBtn]}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.navBtn, styles.saveBtn, { flex: 2 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Save Profile</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Ionicons 
                name={modalType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                size={rf(60)} 
                color={modalType === 'success' ? '#10B981' : '#F43F5E'} 
              />
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalMessage}>{modalContent.message}</Text>
            <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: modalType === 'success' ? '#10B981' : '#F43F5E' }]}
              onPress={() => { setModalVisible(false); if (modalType === 'success') handleBack(); }}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function renderInput(label: string, value: string, setValue: (t: string) => void) {
  return (
    <View style={{ marginBottom: vs(15) }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={label}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: s(24), backgroundColor: "#F9FAFB", minHeight: '100%' },
  topBackButton: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginTop: vs(40), elevation: 2 },
  mainHeader: { marginTop: vs(20), marginBottom: vs(30) },
  mainTitle: { fontSize: rf(28), fontWeight: '800', color: '#0F172A' },
  mainSubtitle: { fontSize: rf(14), color: '#64748B', marginTop: vs(5) },
  stepCard: { backgroundColor: '#fff', padding: s(24), borderRadius: s(24), elevation: 3, marginBottom: vs(30) },
  stepTitle: { fontSize: rf(18), fontWeight: '700', color: '#1E293B', marginBottom: vs(20) },
  label: { fontWeight: "bold", marginBottom: vs(5), fontSize: rf(14), color: '#374151' },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: s(8), padding: s(12), backgroundColor: "#fff", fontSize: rf(14) },
  navButtons: { flexDirection: 'row', gap: s(15) },
  navBtn: { height: vs(56), borderRadius: s(16), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: s(10) },
  backBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  nextBtn: { backgroundColor: '#4f46e5' },
  saveBtn: { backgroundColor: '#10b981' },
  backBtnText: { color: '#64748B', fontWeight: '600', fontSize: rf(16) },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: rf(16) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: s(30), padding: s(30), alignItems: 'center' },
  modalTitle: { fontSize: rf(22), fontWeight: '800', color: '#1E293B', marginTop: 10 },
  modalMessage: { fontSize: rf(15), color: '#64748B', textAlign: 'center', marginVertical: vs(20) },
  modalBtn: { width: '100%', height: vs(54), borderRadius: s(18), justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: rf(16) },
});
