import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertCircle, Check, MapPin, Phone, Save, User, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getRecentCompanyProfile, updateBusinessSettings } from '../../services/companyService';
import { rf, s, vs } from '../../utils/responsive';
import { SoundManager } from '../../utils/SoundManager';

interface CustomerSetupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CustomerSetupModal: React.FC<CustomerSetupModalProps> = ({ visible, onClose }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    collectCustomerName: true,
    requireCustomerName: false,
    collectCustomerPhone: true,
    requireCustomerPhone: false,
    collectCustomerAddress: false,
    requireCustomerAddress: false,
    isOnline: true,
    openingTime: '00:00',
    closingTime: '23:59',
    offlineMessage: 'Restaurant is currently closed or not accepting orders.',
  });

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const clerkToken = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = clerkToken || staffSession?.token;

      if (!finalToken) {
        setLoading(false);
        return;
      }

      const profile = await getRecentCompanyProfile(finalToken);
      if (profile) {
        setSettings({
          collectCustomerName: profile.collectCustomerName ?? true,
          requireCustomerName: profile.requireCustomerName ?? false,
          collectCustomerPhone: profile.collectCustomerPhone ?? true,
          requireCustomerPhone: profile.requireCustomerPhone ?? false,
          collectCustomerAddress: profile.collectCustomerAddress ?? false,
          requireCustomerAddress: profile.requireCustomerAddress ?? false,
          isOnline: profile.isOnline ?? true,
          openingTime: profile.openingTime ?? '00:00',
          closingTime: profile.closingTime ?? '23:59',
          offlineMessage: profile.offlineMessage ?? 'Restaurant is currently closed or not accepting orders.',
        });
      }
    } catch (error) {
      console.log('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    SoundManager.play();
    setSaving(true);
    try {
      const clerkToken = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = clerkToken || staffSession?.token;

      if (!finalToken) {
        Alert.alert('Error', 'Authentication token missing.');
        return;
      }

      const res = await updateBusinessSettings(finalToken, settings);
      if (res) {
        // Refresh local state to ensure it synced
        await getRecentCompanyProfile(finalToken);
        Alert.alert('Success', 'Customer settings updated successfully.');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to save settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof typeof settings) => {
    SoundManager.play();
    setSettings(prev => ({ ...prev, [key]: !prev[key as any] }));
  };

  const FieldOption = ({
    icon: Icon,
    label,
    collectKey,
    requireKey,
  }: {
    icon: any;
    label: string;
    collectKey: keyof typeof settings;
    requireKey: keyof typeof settings;
  }) => {
    const isCollected = settings[collectKey] as boolean;
    const isRequired = settings[requireKey] as boolean;

    return (
      <View style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <View style={styles.iconContainer}>
            <Icon size={24} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.fieldTitle}>{label}</Text>
            <Text style={styles.fieldDesc}>Configure how you collect {label} from QR Menu</Text>
          </View>
        </View>

        <View style={styles.togglesContainer}>
          {/* Collect Toggle */}
          <TouchableOpacity
            style={[styles.toggleBtn, isCollected ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => toggle(collectKey)}
          >
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, isCollected ? styles.textActive : styles.textInactive]}>
                VISIBILITY
              </Text>
              {isCollected && <Check size={14} color="#2563EB" />}
            </View>
            <Text style={[styles.toggleMainText, isCollected ? styles.textActive : styles.textInactive]}>
              {isCollected ? 'Visible (Enabled)' : 'Hidden (Disabled)'}
            </Text>
          </TouchableOpacity>

          {/* Mandatory Toggle */}
          <TouchableOpacity
            disabled={!isCollected}
            style={[
              styles.toggleBtn,
              !isCollected
                ? styles.toggleDisabled
                : isRequired
                  ? styles.toggleRequired
                  : styles.toggleInactive,
            ]}
            onPress={() => toggle(requireKey)}
          >
            <View style={styles.toggleRow}>
              <Text
                style={[
                  styles.toggleLabel,
                  !isCollected ? styles.textDisabled : isRequired ? styles.textRequired : styles.textInactive,
                ]}
              >
                REQUIREMENT
              </Text>
              {isRequired && isCollected && <Check size={14} color="#059669" />}
            </View>
            <Text
              style={[
                styles.toggleMainText,
                !isCollected ? styles.textDisabled : isRequired ? styles.textRequired : styles.textInactive,
              ]}
            >
              {isRequired ? 'Mandatory (Required)' : 'Optional'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#475569" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Customer Setup</Text>
            <Text style={styles.headerSubtitle}>QR MENU DATA COLLECTION RULES</Text>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={saving || loading} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Save size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading Configuration...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <AlertCircle size={24} color="#2563EB" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Why configure this?</Text>
                <Text style={styles.infoDesc}>
                  Configure whether you want to collect Address or Phone numbers before customers place an order. Making them mandatory will prevent orders without details.
                </Text>
              </View>
            </View>

            {/* Field Options */}
            <FieldOption icon={User} label="Customer Name" collectKey="collectCustomerName" requireKey="requireCustomerName" />
            <FieldOption icon={Phone} label="Customer Phone" collectKey="collectCustomerPhone" requireKey="requireCustomerPhone" />
            <FieldOption icon={MapPin} label="Customer Address" collectKey="collectCustomerAddress" requireKey="requireCustomerAddress" />

            {/* Ordering Status & Timing */}
            <View style={styles.timingCard}>
              <View style={styles.timingHeader}>
                <View style={styles.timingHeaderLeft}>
                  <View style={styles.timingIconWrapper}>
                    <Zap size={24} color="#EA580C" />
                  </View>
                  <View>
                    <Text style={styles.timingTitle}>Ordering Status & Timing</Text>
                    <Text style={styles.timingDesc}>Set when customers can place orders</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.onlineToggle, settings.isOnline ? styles.onlineActive : styles.onlineInactive]}
                  onPress={() => toggle('isOnline')}
                >
                  <View style={[styles.onlineDot, settings.isOnline ? styles.dotActive : styles.dotInactive]} />
                  <Text style={[styles.onlineText, settings.isOnline ? styles.textRequired : styles.textError]}>
                    {settings.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timingInputsWrapper}>
                <Text style={styles.timingSectionTitle}>OPERATIONAL HOURS (24H FORMAT)</Text>
                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputBox}>
                    <Text style={styles.timeInputLabel}>OPEN AT</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={settings.openingTime as string}
                      onChangeText={(val) => setSettings(p => ({ ...p, openingTime: val }))}
                      keyboardType="numbers-and-punctuation"
                      placeholder="00:00"
                    />
                  </View>
                  <View style={styles.timeInputBox}>
                    <Text style={styles.timeInputLabel}>CLOSE AT</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={settings.closingTime as string}
                      onChangeText={(val) => setSettings(p => ({ ...p, closingTime: val }))}
                      keyboardType="numbers-and-punctuation"
                      placeholder="23:59"
                    />
                  </View>
                </View>

                <Text style={[styles.timingSectionTitle, { marginTop: vs(16) }]}>OFFLINE NOTICE MESSAGE</Text>
                <TextInput
                  style={styles.textArea}
                  value={settings.offlineMessage as string}
                  onChangeText={(val) => setSettings(p => ({ ...p, offlineMessage: val }))}
                  multiline
                  numberOfLines={4}
                  placeholder="Restaurant is closed..."
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>KRAVY POS · CUSTOMER EXPERIENCE CONFIGURATION</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingTop: vs(50), // Increased from 16 to 50 to push header down
    paddingBottom: vs(12),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, paddingHorizontal: s(12) },
  headerTitle: { fontSize: rf(20), fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: rf(10), fontWeight: '700', color: '#64748B', letterSpacing: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderRadius: s(100),
    gap: s(6),
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: rf(14) },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: vs(12), color: '#64748B', fontWeight: '600' },
  scrollContent: { padding: s(16), paddingBottom: vs(100) }, // Increased to push footer up
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: s(16),
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: vs(16),
  },
  infoIcon: { marginTop: vs(2) },
  infoTextContainer: { flex: 1, marginLeft: s(12) },
  infoTitle: { fontSize: rf(14), fontWeight: 'bold', color: '#0F172A', marginBottom: vs(4) },
  infoDesc: { fontSize: rf(12), color: '#475569', lineHeight: rf(18) },
  fieldCard: {
    backgroundColor: '#FFF',
    borderRadius: s(24),
    padding: s(16),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(16) },
  iconContainer: {
    width: s(48),
    height: s(48),
    borderRadius: s(16),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(12),
  },
  fieldTitle: { fontSize: rf(16), fontWeight: 'bold', color: '#0F172A' },
  fieldDesc: { fontSize: rf(11), color: '#64748B', marginTop: vs(2) },
  togglesContainer: { flexDirection: 'row', gap: s(12) },
  toggleBtn: {
    flex: 1,
    padding: s(12),
    borderRadius: s(16),
    borderWidth: 1,
  },
  toggleActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  toggleInactive: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  toggleRequired: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  toggleDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', opacity: 0.5 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(6) },
  toggleLabel: { fontSize: rf(9), fontWeight: '900', letterSpacing: 1 },
  toggleMainText: { fontSize: rf(12), fontWeight: 'bold' },
  textActive: { color: '#2563EB' },
  textInactive: { color: '#94A3B8' },
  textRequired: { color: '#059669' },
  textDisabled: { color: '#94A3B8' },
  textError: { color: '#E11D48' },
  timingCard: {
    backgroundColor: '#FFF',
    borderRadius: s(32),
    padding: s(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: vs(8),
  },
  timingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: vs(16),
    marginBottom: vs(16),
  },
  timingHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  timingIconWrapper: {
    width: s(48),
    height: s(48),
    borderRadius: s(16),
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(12),
  },
  timingTitle: { fontSize: rf(16), fontWeight: 'bold', color: '#0F172A' },
  timingDesc: { fontSize: rf(11), color: '#64748B', marginTop: vs(2) },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(12),
    borderWidth: 1,
  },
  onlineActive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  onlineInactive: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  onlineDot: { width: s(6), height: s(6), borderRadius: s(3), marginRight: s(6) },
  dotActive: { backgroundColor: '#34D399' },
  dotInactive: { backgroundColor: '#FB7185' },
  onlineText: { fontSize: rf(10), fontWeight: 'bold' },
  timingInputsWrapper: {},
  timingSectionTitle: { fontSize: rf(9), fontWeight: '900', color: '#64748B', letterSpacing: 1, marginBottom: vs(8) },
  timeInputsRow: { flexDirection: 'row', gap: s(12) },
  timeInputBox: { flex: 1 },
  timeInputLabel: { fontSize: rf(9), fontWeight: '900', color: '#94A3B8', marginBottom: vs(4) },
  timeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(12),
    padding: s(12),
    fontSize: rf(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(12),
    padding: s(12),
    fontSize: rf(13),
    color: '#334155',
    minHeight: vs(80),
    textAlignVertical: 'top',
  },
  footer: { marginTop: vs(24), alignItems: 'center' },
  footerText: { fontSize: rf(9), fontWeight: '900', color: '#94A3B8', letterSpacing: 2 },
});
