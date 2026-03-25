
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import Voice from '@react-native-voice/voice';
import { rf, s, vs } from "../../utils/responsive";
import { PERMISSION_GROUPS, StaffMember, TOTAL_PERMISSIONS_COUNT } from "./StaffPermissionsData";

const COLORS = {
  primary: "#4F46E5",
  background: "#F9FAFB",
  white: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  border: "#E5E7EB",
  inputBorder: "#D1D5DB",
};

// --- Sub-Component: StaffAddEditModal ---
interface StaffAddEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (staff: StaffMember) => void;
  onDelete: (id: string) => void;
  staff: StaffMember | null;
}

const StaffAddEditModal = ({
  visible,
  onClose,
  onSave,
  onDelete,
  staff,
}: StaffAddEditModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accessType, setAccessType] = useState("Sales Access");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);
  const [missingVisible, setMissingVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (visible) {
      if (staff) {
        setName(staff.name);
        setPhone(staff.phone);
        setAccessType(staff.accessType);
        setPermissions(staff.permissions);
      } else {
        setName("");
        setPhone("");
        setAccessType("Sales Access");
        setPermissions(["Sale Permissions - View", "Sale Permissions - Create"]);
      }
    }
  }, [visible, staff]);

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const setAllPermissions = () => {
    const all: string[] = [];
    PERMISSION_GROUPS.forEach(g => {
      g.permissions.forEach(p => {
        all.push(`${g.title} - ${p}`);
      });
    });
    setPermissions(all);
  };

  const handleAccessTypeSelect = (type: string) => {
    setAccessType(type);
    setShowDropdown(false);
    if (type === "Full Access") {
      setAllPermissions();
    } else if (type === "Sales Access") {
      setPermissions(["Sale Permissions - View", "Sale Permissions - Create", "Sale Permissions - Reprint"]);
    }
  };

  useEffect(() => {
    if (Voice) {
      Voice.onSpeechResults = (e: any) => {
        if (e.value && e.value.length > 0) {
          setName(e.value[0]);
        }
        setIsListening(false);
      };
      Voice.onSpeechError = (e: any) => {
        console.log("Voice Error:", e);
        setIsListening(false);
      };
    }
    return () => {
      if (Voice && typeof Voice.destroy === 'function') {
        Voice.destroy().then(Voice.removeAllListeners).catch((err: any) => console.log("Voice Cleanup Error:", err));
      }
    };
  }, []);

  const handleVoicePress = async () => {
    try {
      // Multiple possible native module names for better detection
      const nativeModule = NativeModules.RCTVoice || NativeModules.VoiceModule || NativeModules.VoiceTest || NativeModules.Voice;
      const isVoiceNativeLoaded = !!nativeModule;

      if (!isVoiceNativeLoaded || typeof Voice?.start !== 'function') {
        Alert.alert("Voice Error", "Native voice module not found. Please rebuild the app (npx expo run:android) to enable this feature.");
        return;
      }

      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      } else {
        setName("");
        // Double check if start throws immediately
        await Voice.start('en-US');
        setIsListening(true);
      }
    } catch (e) {
      console.log("Voice Press Caught Error:", e);
      Alert.alert("Voice Error", "Voice service is not linked correctly. Please re-run the android build.");
      setIsListening(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || phone.trim().length < 10) {
      setErrorMessage("Please enter correct name and 10-digit phone number.");
      setMissingVisible(true);
      return;
    }
    const payload: StaffMember = {
      id: staff?.id || Math.random().toString(36).substr(2, 9),
      name,
      phone,
      accessType,
      permissions
    };
    onSave(payload);
    setSuccessVisible(true);
    setTimeout(() => { setSuccessVisible(false); }, 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={[subStyles.header, { paddingTop: vs(50) }]}>
          <TouchableOpacity onPress={onClose} style={{ padding: s(5) }}>
            <Ionicons name="arrow-back" size={rf(24)} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: s(10) }}>
            <Text style={subStyles.title}>Staff</Text>
            <Text style={subStyles.headerInfo}>FAST v39.08 | 7838491780 | 3307</Text>
          </View>
          {staff && (
            <TouchableOpacity onPress={() => onDelete(staff.id)} style={{ padding: s(5) }}>
              <Ionicons name="trash-outline" size={rf(24)} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: s(20), backgroundColor: COLORS.white }}>
            <View style={subStyles.inputContainer}>
              <TextInput placeholder="Staff Name" placeholderTextColor="#9CA3AF" style={subStyles.input} value={name} onChangeText={setName} />
              <TouchableOpacity onPress={handleVoicePress}>
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={rf(22)}
                  color={isListening ? COLORS.primary : COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
            <View style={subStyles.inputContainer}>
              <TextInput placeholder="Staff Phone No" placeholderTextColor="#9CA3AF" style={subStyles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <View style={{ marginTop: vs(5) }}>
              <Text style={subStyles.floatLabel}>Select Access Type</Text>
              <TouchableOpacity style={subStyles.dropdownHeader} onPress={() => setShowDropdown(!showDropdown)}>
                <Text style={{ fontSize: rf(16), color: COLORS.text }}>{accessType}</Text>
                <Ionicons name={showDropdown ? "caret-up" : "caret-down"} size={rf(14)} color={COLORS.textLight} />
              </TouchableOpacity>
              {showDropdown && (
                <View style={subStyles.dropdownMenu}>
                  {["Sales Access", "Full Access", "Custom Access"].map((type) => (
                    <TouchableOpacity key={type} style={subStyles.dropdownItem} onPress={() => handleAccessTypeSelect(type)}>
                      <Text style={{ fontSize: rf(16), color: COLORS.text }}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          {PERMISSION_GROUPS.map((group, gIdx) => (
            <View key={gIdx} style={{ marginTop: vs(20), paddingHorizontal: s(20) }}>
              <Text style={{ fontSize: rf(15), fontWeight: "bold", color: COLORS.primary, marginBottom: vs(10) }}>{group.title}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: s(8) }}>
                {group.permissions.map((p, pIdx) => {
                  const permKey = `${group.title} - ${p}`;
                  const isSelected = permissions.includes(permKey);
                  return (
                    <TouchableOpacity key={pIdx} style={[subStyles.chip, isSelected && subStyles.chipSelected]} onPress={() => togglePermission(permKey)}>
                      <Text style={[subStyles.chipText, isSelected && { fontWeight: "bold" }]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: vs(160) }} />
        </ScrollView>
        <View style={[subStyles.saveBar, { paddingBottom: vs(53) }]}>
          <TouchableOpacity style={subStyles.saveBtn} onPress={handleSave}>
            <Text style={{ color: COLORS.white, fontWeight: "bold", fontSize: rf(16) }}>SAVE</Text>
          </TouchableOpacity>
        </View>
        <Modal visible={successVisible} transparent animationType="fade">
          <View style={subStyles.modalOverlay}>
            <View style={subStyles.popupContent}>
              <View style={[subStyles.circle, { backgroundColor: COLORS.success }]}><Ionicons name="checkmark" size={rf(40)} color={COLORS.white} /></View>
              <Text style={subStyles.popupTitle}>Saved Successfully!</Text>
            </View>
          </View>
        </Modal>
        <Modal visible={missingVisible} transparent animationType="fade">
          <View style={subStyles.modalOverlay}>
            <View style={subStyles.popupContent}>
              <View style={[subStyles.circle, { backgroundColor: COLORS.danger }]}><Ionicons name="alert" size={rf(40)} color={COLORS.white} /></View>
              <Text style={subStyles.popupTitle}>Missing Info</Text>
              <Text style={subStyles.popupText}>{errorMessage}</Text>
              <TouchableOpacity style={{ marginTop: vs(30) }} onPress={() => setMissingVisible(false)}><Text style={{ color: COLORS.primary, fontWeight: "bold", fontSize: rf(16) }}>DISMISS</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

// --- Sub-Component: StaffTransferModal ---
interface StaffTransferModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (currentId: string, name: string, phone: string) => void;
  staff: StaffMember | null;
}

const StaffTransferModal = ({ visible, onClose, onUpdate, staff }: StaffTransferModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => { if (visible && staff) { setName(""); setPhone(""); } }, [visible, staff]);
  const handleUpdate = () => { if (staff && name.trim() && phone.trim()) { onUpdate(staff.id, name, phone); } };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={subStyles.modalOverlay}>
        <View style={subStyles.transferContainer}>
          <View style={{ gap: vs(15) }}>
            <View style={subStyles.transferInputBox}>
              <Text style={subStyles.transferLabel}>Current Staff Name</Text>
              <TextInput value={staff?.name || ""} editable={false} style={{ fontSize: rf(16), color: "#000" }} />
            </View>
            <View style={subStyles.transferInputBox}>
              <Text style={subStyles.transferLabel}>Current Staff Phone</Text>
              <TextInput value={staff?.phone || ""} editable={false} style={{ fontSize: rf(16), color: "#000" }} />
            </View>
            <View style={subStyles.transferInputBox}>
              <TextInput placeholder="Transfer Staff Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} style={{ fontSize: rf(16), color: COLORS.text }} />
            </View>
            <View style={subStyles.transferInputBox}>
              <TextInput placeholder="Transfer Staff Phone" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ fontSize: rf(16), color: COLORS.text }} />
            </View>
          </View>
          <TouchableOpacity style={subStyles.transferBtn} onPress={handleUpdate}>
            <Text style={{ color: COLORS.white, fontWeight: "bold", fontSize: rf(14) }}>UPDATE STAFF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- Main Component: StaffModal ---
interface StaffModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StaffModal = ({ visible, onClose }: StaffModalProps) => {
  const [assignEnabled, setAssignEnabled] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [transferVisible, setTransferVisible] = useState(false);
  const [transferringStaff, setTransferringStaff] = useState<StaffMember | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => { if (visible) { loadStaffData(); } }, [visible]);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const enabled = await AsyncStorage.getItem("assign_staff_enabled");
      setAssignEnabled(enabled === "true");
      const listStr = await AsyncStorage.getItem("staff_list");
      if (listStr) setStaffList(JSON.parse(listStr));
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  const toggleAssign = (val: boolean) => {
    setAssignEnabled(val);
    AsyncStorage.setItem("assign_staff_enabled", String(val));
  };

  const handleCreateNew = () => { setEditingStaff(null); setAddEditVisible(true); };
  const handleEditStaff = (staff: StaffMember) => { setEditingStaff(staff); setAddEditVisible(true); };
  const handleTransferPress = (staff: StaffMember) => { setTransferringStaff(staff); setTransferVisible(true); };

  const handleSaveStaff = async (staff: StaffMember) => {
    let newList = [...staffList];
    const index = newList.findIndex((s) => s.id === staff.id);
    if (index !== -1) newList[index] = staff; else newList.push(staff);
    setStaffList(newList);
    await AsyncStorage.setItem("staff_list", JSON.stringify(newList));
    setAddEditVisible(false);
  };

  const handleDeleteStaff = async (id: string) => {
    const newList = staffList.filter((s) => s.id !== id);
    setStaffList(newList);
    await AsyncStorage.setItem("staff_list", JSON.stringify(newList));
    setAddEditVisible(false);
  };

  const handleUpdateStaffTransfer = async (id: string, name: string, phone: string) => {
    const newList = staffList.map((s) => (s.id === id ? { ...s, name, phone } : s));
    setStaffList(newList);
    await AsyncStorage.setItem("staff_list", JSON.stringify(newList));
    setTransferVisible(false);
  };

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: vs(50) }]}>
          {searchMode ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => { setSearchMode(false); setSearchQuery(""); }} style={{ padding: s(5) }}>
                <Ionicons name="arrow-back" size={rf(24)} color={COLORS.white} />
              </TouchableOpacity>
              <TextInput
                placeholder="Search staff Name or phone..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={{ flex: 1, color: COLORS.white, fontSize: rf(16), marginLeft: s(10) }}
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={onClose} style={{ padding: s(5) }}><Ionicons name="arrow-back" size={rf(24)} color={COLORS.white} /></TouchableOpacity>
              <View style={{ flex: 1, marginLeft: s(10) }}>
                <Text style={styles.title}>Staff List</Text>
                <Text style={{ fontSize: rf(11), color: "rgba(255,255,255,0.7)" }}>FAST v39.08 | 7838491780 | 3307</Text>
              </View>
              <TouchableOpacity onPress={() => setSearchMode(true)} style={{ padding: s(5) }}>
                <Ionicons name="search" size={rf(24)} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
        </View>
        <ScrollView style={{ flex: 1, padding: s(15) }} showsVerticalScrollIndicator={false}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: rf(15), fontWeight: "500", color: COLORS.text }}>Assign Staff to the Invoice</Text>
              <Text style={{ fontSize: rf(12), color: COLORS.textLight, marginVertical: vs(2) }}>{assignEnabled ? "Enabled" : "Disabled"}</Text>
              <Text style={{ fontSize: rf(12), color: COLORS.success }}>This will enable admin users to assign staff to the invoice for sales tracking</Text>
            </View>
            <Switch value={assignEnabled} onValueChange={toggleAssign} trackColor={{ false: "#D1D5DB", true: COLORS.primary }} thumbColor={COLORS.white} />
          </View>
          <View style={styles.statsCard}><Text style={styles.statsLabel}>Total Staff:- <Text style={{ color: COLORS.success, fontWeight: "bold" }}>{staffList.length}</Text></Text></View>
          <View style={styles.statsCard}><Text style={styles.statsLabel}>Staff Can be Added:- <Text style={{ color: COLORS.success, fontWeight: "bold" }}>{Math.max(0, 10 - staffList.length)}</Text></Text></View>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(20) }} />
          ) : (
            filteredStaff.map((item) => {
              return (
                <TouchableOpacity key={item.id} style={styles.staffItem} onPress={() => handleEditStaff(item)}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: s(5) }}>
                    <View style={styles.badge}><Text style={{ fontSize: rf(14) }}>{item.name}</Text></View>
                    <View style={[styles.badge, { flex: 1 }]}><Text style={{ fontSize: rf(14) }}>{item.phone}</Text></View>
                    <TouchableOpacity style={styles.transferBtn} onPress={() => handleTransferPress(item)}><Text style={{ color: COLORS.primary, fontWeight: "bold", fontSize: rf(12) }}>TRANSFER</Text></TouchableOpacity>
                  </View>
                  <View style={styles.permRow}><Text style={{ fontSize: rf(11), color: "silver", fontWeight: "bold" }}>{item.permissions.length} OUT OF {TOTAL_PERMISSIONS_COUNT} PERMISSIONS GRANTED</Text><Ionicons name="checkmark-done" size={rf(16)} color={COLORS.success} /></View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
        <View style={{ padding: s(20), alignItems: "flex-end", marginBottom: vs(40) }}>
          <TouchableOpacity style={styles.newBtn} onPress={handleCreateNew}><Text style={{ color: COLORS.white, fontWeight: "bold", fontSize: rf(14) }}>NEW STAFF</Text></TouchableOpacity>
        </View>
        <StaffAddEditModal visible={addEditVisible} onClose={() => setAddEditVisible(false)} onSave={handleSaveStaff} onDelete={handleDeleteStaff} staff={editingStaff} />
        <StaffTransferModal visible={transferVisible} onClose={() => setTransferVisible(false)} onUpdate={handleUpdateStaffTransfer} staff={transferringStaff} />
      </SafeAreaView>
    </Modal>
  );
};

const subStyles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", paddingHorizontal: s(15), paddingVertical: vs(12) },
  title: { fontSize: rf(20), fontWeight: "bold", color: COLORS.white },
  headerInfo: { fontSize: rf(11), color: "rgba(255,255,255,0.7)" },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: s(4), paddingHorizontal: s(15), paddingVertical: vs(10), marginBottom: vs(15) },
  input: { flex: 1, fontSize: rf(16), color: COLORS.text },
  floatLabel: { position: "absolute", top: -vs(10), left: s(10), backgroundColor: "#fff", paddingHorizontal: s(5), zIndex: 1, fontSize: rf(12), color: COLORS.textLight },
  dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: s(4), paddingHorizontal: s(15), paddingVertical: vs(12) },
  dropdownMenu: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.inputBorder, marginTop: 1, borderRadius: s(4), elevation: 4 },
  dropdownItem: { padding: s(15), borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  chip: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: s(15), paddingVertical: vs(6), borderRadius: s(20) },
  chipSelected: { backgroundColor: "rgba(79, 70, 229, 0.4)", borderColor: COLORS.primary },
  chipText: { fontSize: rf(13), color: COLORS.text },
  saveBar: { position: "absolute", bottom: 0, width: "100%", padding: s(20), backgroundColor: "rgba(255,255,255,0.8)" },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: vs(15), borderRadius: s(30), alignItems: "center", elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  popupContent: { backgroundColor: "#fff", padding: s(30), borderRadius: s(20), alignItems: "center", width: "80%" },
  circle: { width: s(80), height: s(80), borderRadius: s(40), justifyContent: "center", alignItems: "center", marginBottom: vs(20) },
  popupTitle: { fontSize: rf(22), fontWeight: "bold", color: COLORS.text },
  popupText: { fontSize: rf(14), color: COLORS.textLight, textAlign: "center", marginTop: vs(10) },
  transferContainer: { backgroundColor: "#fff", width: "85%", borderRadius: s(4), padding: s(20), elevation: 10 },
  transferInputBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: s(4), paddingHorizontal: s(10), paddingVertical: vs(8), position: "relative" },
  transferLabel: { position: "absolute", top: -vs(10), left: s(10), backgroundColor: "#fff", paddingHorizontal: s(5), fontSize: rf(11), color: COLORS.textLight, zIndex: 1 },
  transferBtn: { backgroundColor: COLORS.primary, marginTop: vs(25), paddingVertical: vs(12), borderRadius: s(30), alignItems: "center", alignSelf: "flex-end", paddingHorizontal: s(25) },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", paddingHorizontal: s(15), paddingVertical: vs(12) },
  title: { fontSize: rf(20), fontWeight: "bold", color: COLORS.white },
  settingRow: { backgroundColor: "#fff", padding: s(12), borderRadius: s(4), flexDirection: "row", alignItems: "center", marginBottom: vs(15), borderWidth: 1, borderColor: COLORS.border },
  statsCard: { backgroundColor: "#fff", padding: s(12), borderRadius: s(4), marginBottom: vs(10), borderWidth: 1, borderColor: COLORS.border },
  statsLabel: { fontSize: rf(15), color: COLORS.text, fontWeight: "500" },
  staffItem: { backgroundColor: "#fff", borderRadius: s(4), borderWidth: 1, borderColor: COLORS.text, padding: s(8), marginTop: vs(10) },
  badge: { borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.text, paddingHorizontal: s(10), paddingVertical: vs(4), borderRadius: s(4), minWidth: s(80) },
  transferBtn: { borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: s(10), paddingVertical: vs(4), borderRadius: s(4) },
  permRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: vs(5), borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: vs(5) },
  newBtn: { backgroundColor: COLORS.primary, paddingHorizontal: s(30), paddingVertical: vs(15), borderRadius: s(30), elevation: 5 },
});
