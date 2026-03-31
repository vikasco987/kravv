
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { PERMISSION_GROUPS, TOTAL_PERMISSIONS_COUNT, StaffMember } from "./StaffPermissionsData";

const COLORS = {
  primary: "#4F46E5",
  background: "#F9FAFB",
  white: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  border: "#D1D5DB",
  card: "#FFFFFF",
};

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
  
  // Custom Popups
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
        setPermissions(["Order & Billing Permissions - Create New Bill", "Invoices & Receipts - View Bill Records"]); 
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
        setPermissions(["Order & Billing Permissions - Create New Bill", "Invoices & Receipts - View Bill Records", "Invoices & Receipts - Reprint Bill"]);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || phone.trim().length < 10) {
      setErrorMessage("Please enter correct name and 10-digit phone number.");
      setMissingVisible(true);
      return;
    }

    const payload = {
      id: staff?.id || Math.random().toString(36).substr(2, 9),
      name,
      phone,
      accessType,
      permissions
    };
    
    onSave(payload);
    setSuccessVisible(true);
    setTimeout(() => {
        setSuccessVisible(false);
    }, 2000);
  };

  const confirmDelete = () => {
    if (staff) {
      onDelete(staff.id);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rf(24)} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: s(10) }}>
            <Text style={styles.title}>Staff</Text>
            <Text style={styles.headerInfo}>FAST v39.08 | 7838491780 | 3307</Text>
          </View>
          {staff && (
             <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton}>
               <Ionicons name="trash-outline" size={rf(24)} color={COLORS.white} />
             </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
             <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Staff Name"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
                <Ionicons name="mic-outline" size={rf(22)} color={COLORS.textLight} />
             </View>

             <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Staff Phone No"
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
             </View>

             {/* Custom Dropdown */}
             <View style={styles.dropdownContainer}>
               <Text style={styles.label}>Select Access Type</Text>
               <TouchableOpacity 
                 style={styles.dropdownHeader}
                 onPress={() => setShowDropdown(!showDropdown)}
               >
                 <Text style={styles.dropdownText}>{accessType}</Text>
                 <Ionicons name={showDropdown ? "caret-up" : "caret-down"} size={rf(14)} color={COLORS.textLight} />
               </TouchableOpacity>
               
               {showDropdown && (
                 <View style={styles.dropdownMenu}>
                   {["Sales Access", "Full Access", "Custom Access"].map((type) => (
                     <TouchableOpacity 
                       key={type} 
                       style={styles.dropdownItem}
                       onPress={() => handleAccessTypeSelect(type)}
                     >
                       <Text style={styles.dropdownItemText}>{type}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               )}
             </View>
          </View>

          {/* Permissions Sections */}
          {PERMISSION_GROUPS.map((group, gIdx) => (
            <View key={gIdx} style={styles.permissionGroup}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.chipsContainer}>
                {group.permissions.map((p, pIdx) => {
                  const permKey = `${group.title} - ${p}`;
                  const isSelected = permissions.includes(permKey);
                  return (
                    <TouchableOpacity
                      key={pIdx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => togglePermission(permKey)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: vs(100) }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>SAVE</Text>
          </TouchableOpacity>
        </View>

        {/* Success Popup */}
        <Modal visible={successVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.popupContent}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={rf(40)} color={COLORS.white} />
                    </View>
                    <Text style={styles.popupTitle}>Saved Successfully!</Text>
                    <Text style={styles.popupText}>Staff details and permissions updated.</Text>
                </View>
            </View>
        </Modal>

        {/* Missing Popup */}
        <Modal visible={missingVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.popupContent}>
                    <View style={styles.errorCircle}>
                        <Ionicons name="alert" size={rf(40)} color={COLORS.white} />
                    </View>
                    <Text style={styles.popupTitle}>Missing Info</Text>
                    <Text style={styles.popupText}>{errorMessage}</Text>
                    <TouchableOpacity 
                        style={styles.closePopupBtn}
                        onPress={() => setMissingVisible(false)}
                    >
                        <Text style={styles.closePopupText}>DISMISS</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(15),
    paddingVertical: vs(12),
  },
  backButton: { padding: s(5) },
  title: { fontSize: rf(20), fontWeight: "bold", color: COLORS.white },
  headerInfo: { fontSize: rf(11), color: "rgba(255,255,255,0.7)" },
  deleteButton: { padding: s(5) },
  content: { flex: 1, backgroundColor: COLORS.background },
  formSection: { padding: s(20), backgroundColor: COLORS.white },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: s(4),
    paddingHorizontal: s(15),
    paddingVertical: vs(10),
    marginBottom: vs(15),
  },
  input: { flex: 1, fontSize: rf(16), color: COLORS.text },
  dropdownContainer: {
    marginTop: vs(5),
  },
  label: { 
    position: "absolute", 
    top: -vs(10), 
    left: s(10), 
    backgroundColor: "#fff", 
    paddingHorizontal: s(5),
    zIndex: 1,
    fontSize: rf(12),
    color: COLORS.textLight
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: s(4),
    paddingHorizontal: s(15),
    paddingVertical: vs(12),
  },
  dropdownText: { fontSize: rf(16), color: COLORS.text },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 1,
    borderRadius: s(4),
    elevation: 4,
  },
  dropdownItem: {
    padding: s(15),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: { fontSize: rf(16), color: COLORS.text },
  
  permissionGroup: { marginTop: vs(20), paddingHorizontal: s(20) },
  groupTitle: { fontSize: rf(15), fontWeight: "bold", color: COLORS.primary, marginBottom: vs(10) },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: s(8) },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: s(15),
    paddingVertical: vs(6),
    borderRadius: s(20),
  },
  chipSelected: { backgroundColor: "rgba(79, 70, 229, 0.4)", borderColor: COLORS.primary },
  chipText: { fontSize: rf(13), color: COLORS.text },
  chipTextSelected: { fontWeight: "bold" },
  
  footer: { position: "absolute", bottom: 0, width: "100%", padding: s(20), backgroundColor: "rgba(255,255,255,0.8)" },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: vs(15),
    borderRadius: s(30),
    alignItems: "center",
    elevation: 5,
  },
  saveBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: rf(16) },

  // Popup Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  popupContent: { backgroundColor: "#fff", padding: s(30), borderRadius: s(20), alignItems: "center", width: "80%" },
  successCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  errorCircle: {
      width: s(80),
      height: s(80),
      borderRadius: s(40),
      backgroundColor: COLORS.danger,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: vs(20),
  },
  popupTitle: { fontSize: rf(22), fontWeight: "bold", color: COLORS.text },
  popupText: { fontSize: rf(14), color: COLORS.textLight, textAlign: "center", marginTop: vs(10) },
  closePopupBtn: { marginTop: vs(30) },
  closePopupText: { color: COLORS.primary, fontWeight: "bold", fontSize: rf(16) }
});

export default StaffAddEditModal;
