
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";
import { StaffMember } from "./StaffPermissionsData";

const COLORS = {
  primary: "#4F46E5",
  text: "#111827",
  textLight: "#6B7280",
  white: "#FFFFFF",
  border: "#E5E7EB",
};

interface StaffTransferModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (currentId: string, name: string, phone: string) => void;
  staff: StaffMember | null;
}

const StaffTransferModal = ({
  visible,
  onClose,
  onUpdate,
  staff,
}: StaffTransferModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (visible && staff) {
      setName("");
      setPhone("");
    }
  }, [visible, staff]);

  const handleUpdate = () => {
    if (staff && name.trim() && phone.trim()) {
      onUpdate(staff.id, name, phone);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.inputSection}>
            <View style={styles.inputWrapper}>
              <Text style={styles.floatLabel}>Current Staff Name</Text>
              <TextInput
                value={staff?.name || "deepak"}
                editable={false}
                style={[styles.input, styles.readonly]}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.floatLabel}>Current Staff Phone</Text>
              <TextInput
                value={staff?.phone || "7976216846"}
                editable={false}
                style={[styles.input, styles.readonly]}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Transfer Staff Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Transfer Staff Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
            <Text style={styles.updateBtnText}>UPDATE STAFF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: s(4),
    padding: s(20),
    elevation: 10,
  },
  inputSection: {
    gap: vs(15),
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    position: "relative",
  },
  floatLabel: {
    position: "absolute",
    top: -vs(10),
    left: s(10),
    backgroundColor: "#fff",
    paddingHorizontal: s(5),
    fontSize: rf(11),
    color: COLORS.textLight,
    zIndex: 1,
  },
  input: {
    fontSize: rf(16),
    color: COLORS.text,
    padding: 0, 
  },
  readonly: {
    color: "#000",
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    marginTop: vs(25),
    paddingVertical: vs(12),
    borderRadius: s(30),
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: s(25),
  },
  updateBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: rf(14),
  },
});

export default StaffTransferModal;
