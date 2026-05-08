import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  Modal,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
// @ts-ignore
import { useAuth, useUser } from "@clerk/clerk-expo";
import Voice from "@react-native-voice/voice";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { PERMISSION_GROUPS, StaffMember } from "./StaffPermissionsData";

const COLORS = {
  primary: "#0066FF", // More vibrant blue to match screenshot
  background: "#F9FAFB",
  white: "#FFFFFF",
  text: "#111827",
  textLight: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  border: "#E5E7EB",
  card: "#FFFFFF",
  lightBlue: "#EEF2FF",
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessType, setAccessType] = useState("Sales Access");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();
  const { triggerRefresh } = useRefresh();

  const [successVisible, setSuccessVisible] = useState(false);
  const [missingVisible, setMissingVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (visible) {
      if (staff) {
        // Explicit Diagnostic
        const emailToSet = staff.email || "";
        const passwordToSet = staff.password || "";

        // This will prove to the user if data is reaching the modal
        if (visible && !emailToSet) {
        }

        setTimeout(() => {
          setName(staff.name || "");
          setEmail(emailToSet);
          setPassword(passwordToSet);
          setAccessType(staff.accessType || "Sales Access");
          setPermissions(staff.permissions || []);
        }, 100);
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setAccessType("Sales Access");
        setPermissions([]);
        setShowDropdown(false);
        setShowPassword(false);
      }
    }
  }, [visible, staff]);

  useEffect(() => {
    if (!visible) return;

    if (!visible) return;

    const subscriptions = [
      DeviceEventEmitter.addListener("onSpeechStart", () =>
        setIsListening(true),
      ),
      DeviceEventEmitter.addListener("onSpeechEnd", () =>
        setIsListening(false),
      ),
      DeviceEventEmitter.addListener("onSpeechResults", (e: any) => {
        if (e.value && e.value.length > 0) {
          setName(e.value[0]);
          setIsListening(false);
          Vibration.vibrate(100);
        }
      }),
      DeviceEventEmitter.addListener("onSpeechPartialResults", (e: any) => {
        if (e.value && e.value.length > 0) {
          setName(e.value[0]);
        }
      }),
      DeviceEventEmitter.addListener("onSpeechError", (e: any) => {
        // Silence terminal logs for non-fatal codes like 5, 7, 11
        const code = e.error?.code || "";
        if (
          !code.includes("5") &&
          !code.includes("7") &&
          !code.includes("11")
        ) {
          console.log("Staff Voice Note:", e.error?.message);
        }
        setIsListening(false);
      }),
    ];

    return () => {
      subscriptions.forEach((sub) => sub.remove());
      if (Voice && typeof Voice.destroy === "function") {
        Voice.destroy().catch(() => {});
      }
    };
  }, [visible]);

  const startListening = async () => {
    try {
      const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
      if (!nativeBridge) return;

      // Safety: Try to cancel any existing session before starting
      if (typeof nativeBridge.cancelSpeech === "function") {
        try {
          await nativeBridge.cancelSpeech(() => {});
        } catch (e) {}
      }

      if (typeof nativeBridge.startSpeech === "function") {
        const options = {
          EXTRA_LANGUAGE_MODEL: "LANGUAGE_MODEL_FREE_FORM",
          EXTRA_MAX_RESULTS: 1,
          EXTRA_PARTIAL_RESULTS: true,
          REQUEST_PERMISSIONS_AUTO: true,
        };
        await nativeBridge.startSpeech("en-IN", options, () => {});
      } else {
        await Voice.start("en-IN");
      }
      setIsListening(true);
      Vibration.vibrate(50);
    } catch (e) {
      console.error("Failed to start voice:", e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
      if (nativeBridge && typeof nativeBridge.stopSpeech === "function") {
        await nativeBridge.stopSpeech(() => {});
      } else {
        await Voice.stop();
      }
      setIsListening(false);
    } catch (e) {
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (voiceModalVisible) {
      startListening();
    } else {
      stopListening();
    }
  }, [voiceModalVisible]);

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const setAllPermissions = () => {
    const all: string[] = [];
    PERMISSION_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => {
        all.push(`${g.title} - ${p}`);
      });
    });
    setPermissions(all);
  };

  const isGroupEnabled = (group: any) => {
    if (!group.permissions || group.permissions.length === 0) return false;
    return group.permissions.every((p: string) =>
      permissions.includes(`${group.title} - ${p}`),
    );
  };

  const toggleGroupPermissions = (group: any) => {
    const groupPerms = group.permissions.map(
      (p: string) => `${group.title} - ${p}`,
    );
    const alreadyEnabled = isGroupEnabled(group);

    if (alreadyEnabled) {
      setPermissions(permissions.filter((p) => !groupPerms.includes(p)));
    } else {
      const newPerms = [...permissions];
      groupPerms.forEach((p: string) => {
        if (!newPerms.includes(p)) newPerms.push(p);
      });
      setPermissions(newPerms);
    }
  };

  const getGroupDisplayInfo = (title: string) => {
    const mappings: Record<
      string,
      { displayTitle: string; displaySubtitle: string }
    > = {
      "Dashboard Permissions": {
        displayTitle: "Dashboard",
        displaySubtitle: "Dashboard Permissions",
      },
      "Order & Billing Permissions": {
        displayTitle: "Order & Tables",
        displaySubtitle: "Order & Billing Permissions",
      },
      "Invoices & Receipts": {
        displayTitle: "Invoices & Records",
        displaySubtitle: "Invoices & Receipts",
      },
      "Customer Permissions": {
        displayTitle: "Clients",
        displaySubtitle: "Customer Permissions",
      },
      "Menu & Items Permissions": {
        displayTitle: "Menu",
        displaySubtitle: "Menu & Items Permissions",
      },
      "AI Intelligence Tools": {
        displayTitle: "AI Intelligence Tools",
        displaySubtitle: "AI Intelligence Tools",
      },
      "Report Permissions": {
        displayTitle: "Sales Reports",
        displaySubtitle: "Report Permissions",
      },
      "Settings Permissions": {
        displayTitle: "General App Settings",
        displaySubtitle: "Settings Permissions",
      },
    };
    return mappings[title] || { displayTitle: title, displaySubtitle: title };
  };

  const [businessSlug, setBusinessSlug] = useState("kravypos");

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const clerkToken = await getToken();
        const staffToken = await AsyncStorage.getItem("staff_token");
        const token = clerkToken || staffToken;
        if (!token) return;

        const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
        const url = bId
          ? `https://billing.kravy.in/api/profile?businessId=${bId}`
          : "https://billing.kravy.in/api/profile";

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const resData = await res.json();
          const data = resData?.data || resData;
          if (data && (data.businessName || data.companyName)) {
            const bizName = data.businessName || data.companyName;
            const slug = bizName.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (slug) setBusinessSlug(slug);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch business profile for slug:", err);
      }
    };
    if (visible) fetchBusinessProfile();
  }, [visible]);

  const handleAccessTypeSelect = (type: string) => {
    setAccessType(type);
    setShowDropdown(false);
    if (type === "Full Access") {
      setAllPermissions();
    } else if (type === "Sales Access") {
      setPermissions([
        "Order & Billing Permissions - Create New Bill",
        "Invoices & Receipts - View Bill Records",
        "Invoices & Receipts - Reprint Bill",
      ]);
    }
  };

  const handleAutoGenerate = (type: "email" | "password") => {
    if (!name.trim()) {
      Alert.alert(
        "Input Required",
        `Please enter the staff member's full name first to generate ${type}.`,
      );
      return;
    }

    if (type === "email") {
      const namePart = name.toLowerCase().trim().replace(/\s+/g, ".");
      // Use business slug for the domain
      const autoEmail = namePart ? `${namePart}@${businessSlug}.com` : "";
      console.log("Generating Email:", autoEmail);
      setEmail(autoEmail);
    } else {
      // Simpler password as requested: name@123
      const namePart = name.split(" ")[0].toLowerCase().trim();
      const autoPassword = `${namePart}@1123`;
      console.log("Generating Password:", autoPassword);
      setPassword(autoPassword);
      setShowPassword(true);
    }
  };

  const handleSave = () => {
    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim();

    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter correct name and valid email address.");
      setMissingVisible(true);
      return;
    }

    const payload: StaffMember = {
      id: staff?.id || Math.random().toString(36).substr(2, 9),
      name: trimmedName,
      email: trimmedEmail,
      password: password || undefined,
      accessType,
      permissions,
    };

    // 🛡️ REAL-TIME PERMISSION SYNC
    const syncPermissionsLocally = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem("staff_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          // If the email matches, update the local session permissions immediately
          if (session.email === trimmedEmail) {
            const updatedSession = {
              ...session,
              permissions: payload.permissions,
              accessType: payload.accessType,
              name: payload.name,
            };
            await AsyncStorage.setItem(
              "staff_session",
              JSON.stringify(updatedSession),
            );
            // Signal a global refresh
            triggerRefresh();
            DeviceEventEmitter.emit("PERMISSIONS_UPDATED");
          }
        }
      } catch (e) {
        console.error("Local sync error:", e);
      }
    };
    syncPermissionsLocally();

    onSave(payload);
    setSuccessVisible(true);
    setTimeout(() => {
      setSuccessVisible(false);
    }, 2000);
  };

  const confirmDelete = async () => {
    if (staff) {
      try {
        const sessionStr = await AsyncStorage.getItem("staff_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.email === staff.email) {
            await AsyncStorage.removeItem("staff_session");
            triggerRefresh();
            DeviceEventEmitter.emit("PERMISSIONS_UPDATED");
          }
        }
      } catch (e) {}

      onDelete(staff.id);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: vs(45) }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rf(24)} color={COLORS.white} />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              marginLeft: s(10),
              flexDirection: "row",
              alignItems: "center",
              gap: s(12),
            }}
          >
            <View style={styles.headerIconCircle}>
              <Ionicons name="person" size={rf(20)} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.title} numberOfLines={1}>
                {staff ? staff.name : "Add New Staff Member"}
              </Text>
              <Text style={styles.headerInfo}>
                Staff Details & Full Permissions Control
              </Text>
            </View>
          </View>
          {staff && (
            <TouchableOpacity
              onPress={confirmDelete}
              style={styles.deleteButton}
            >
              <Ionicons
                name="trash-outline"
                size={rf(24)}
                color={COLORS.white}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          key={staff?.id || "new"}
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <View style={{ marginBottom: vs(15) }}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="e.g. Rahul Singh"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    // Auto-format email for NEW staff members only
                    if (!staff) {
                      const namePart = text
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, ".");
                      if (namePart) {
                        setEmail(`${namePart}@${businessSlug}.com`);
                      } else {
                        setEmail("");
                      }
                    }
                  }}
                />
                <TouchableOpacity onPress={() => setVoiceModalVisible(true)}>
                  <Ionicons
                    name="mic-outline"
                    size={rf(22)}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: vs(15) }}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputContainer, { paddingRight: s(5) }]}>
                <TextInput
                  placeholder="rahul@kravypos.com"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.autoGenBtn}
                  onPress={() => handleAutoGenerate("email")}
                >
                  <Text style={styles.autoGenText}>Auto-Generate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: vs(15) }}>
              <Text style={styles.inputLabel}>GENERATE PASSWORD</Text>
              <View style={[styles.inputContainer, { paddingRight: s(5) }]}>
                <TextInput
                  placeholder="Set a secure password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ marginRight: s(10) }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={rf(20)}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.autoGenBtn}
                  onPress={() => handleAutoGenerate("password")}
                >
                  <Text style={styles.autoGenText}>Auto-Generate</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Dropdown */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Select Access Type</Text>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={styles.dropdownText}>{accessType}</Text>
                <Ionicons
                  name={showDropdown ? "caret-up" : "caret-down"}
                  size={rf(14)}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownMenu}>
                  {["Sales Access", "Full Access", "Custom Access"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => handleAccessTypeSelect(type)}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.managePermissionsHeader}>
            <Text style={styles.managePermissionsHeaderText}>
              <Ionicons
                name="shield-checkmark"
                size={rf(16)}
                color={COLORS.primary}
              />{" "}
              MANAGE STAFF ACCESS & PERMISSIONS
            </Text>
          </View>

          {/* Permissions Sections */}
          <View style={styles.permissionsList}>
            {PERMISSION_GROUPS.map((group, gIdx) => {
              const { displayTitle, displaySubtitle } = getGroupDisplayInfo(
                group.title,
              );
              const isEnabled = isGroupEnabled(group);

              return (
                <View key={gIdx} style={styles.permissionItem}>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionTitle}>{displayTitle}</Text>
                    <Text style={styles.permissionSubtitle}>
                      {displaySubtitle}
                    </Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => toggleGroupPermissions(group)}
                    trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                    thumbColor={isEnabled ? COLORS.primary : "#F3F4F6"}
                  />
                </View>
              );
            })}
          </View>
          <View style={{ height: vs(180) }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              {staff ? "UPDATE STAFF DETAILS" : "ADD STAFF TO RESTAURANT"}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={successVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.popupContent}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={rf(40)} color={COLORS.white} />
              </View>
              <Text style={styles.popupTitle}>Saved Successfully!</Text>
              <Text style={styles.popupText}>
                Staff details and permissions updated.
              </Text>
            </View>
          </View>
        </Modal>

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

        {/* Voice Input Modal */}
        <Modal visible={voiceModalVisible} transparent animationType="slide">
          <View style={styles.voiceOverlay}>
            <View style={styles.voiceContainer}>
              <View style={styles.voiceHeader}>
                <Text style={styles.voiceTitle}>Voice Full Name Input</Text>
                <TouchableOpacity
                  onPress={() => setVoiceModalVisible(false)}
                  style={{ padding: s(5) }}
                >
                  <Ionicons
                    name="close"
                    size={rf(24)}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.voiceContent}>
                <View style={styles.micCircleWrapper}>
                  <View
                    style={[
                      styles.micCircle,
                      isListening && styles.micCircleActive,
                    ]}
                  >
                    <Ionicons name="mic" size={rf(40)} color={COLORS.white} />
                  </View>
                  {isListening && <View style={styles.pulse} />}
                </View>

                <Text style={styles.voiceInstruction}>
                  {isListening
                    ? "Listening... Speak your name clearly"
                    : "Tap the Mic to Start"}
                </Text>

                <View style={styles.resultBox}>
                  <Text style={styles.resultText} numberOfLines={2}>
                    {name || "Search Result here..."}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.voiceDoneBtn}
                  onPress={() => setVoiceModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    DONE
                  </Text>
                </TouchableOpacity>
              </View>
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
    borderRadius: s(12),
    paddingHorizontal: s(15),
    paddingVertical: vs(8),
    marginBottom: vs(5),
    backgroundColor: "#F9FAFB",
  },
  input: { flex: 1, fontSize: rf(16), color: "#000", minHeight: vs(45) },
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
    color: COLORS.textLight,
  },
  inputLabel: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#9CA3AF",
    marginBottom: vs(5),
    marginLeft: s(5),
  },
  autoGenBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
  },
  autoGenText: { color: "#000", fontSize: rf(12), fontWeight: "600" },
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
  groupTitle: {
    fontSize: rf(15),
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: vs(10),
  },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: s(8) },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: s(15),
    paddingVertical: vs(6),
    borderRadius: s(20),
  },
  chipSelected: {
    backgroundColor: "rgba(79, 70, 229, 0.4)",
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: rf(13), color: COLORS.text },
  chipTextSelected: { fontWeight: "bold" },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: s(20),
    paddingTop: vs(20),
    paddingBottom: vs(50),
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: vs(16),
    borderRadius: s(30),
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: rf(17),
    letterSpacing: 0.5,
  },

  // New Redesigned Styles
  headerIconCircle: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  managePermissionsHeader: {
    paddingVertical: vs(18),
    paddingHorizontal: s(20),
    backgroundColor: "#F0F7FF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E7FF",
  },
  managePermissionsHeaderText: {
    fontSize: rf(14),
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  permissionsList: {
    backgroundColor: COLORS.white,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: vs(18),
    paddingHorizontal: s(22),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  permissionInfo: {
    flex: 1,
    paddingRight: s(10),
  },
  permissionTitle: {
    fontSize: rf(18),
    fontWeight: "700",
    color: COLORS.text,
  },
  permissionSubtitle: {
    fontSize: rf(14),
    color: "#9CA3AF",
    marginTop: vs(2),
    fontWeight: "500",
  },

  // Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "#fff",
    padding: s(30),
    borderRadius: s(20),
    alignItems: "center",
    width: "80%",
  },
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
  popupText: {
    fontSize: rf(14),
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: vs(10),
  },
  closePopupBtn: { marginTop: vs(30) },
  closePopupText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: rf(16),
  },

  // Voice Modal Styles
  voiceOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  voiceContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(30),
    borderTopRightRadius: s(30),
    paddingBottom: vs(40),
  },
  voiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: s(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  voiceTitle: { fontSize: rf(18), fontWeight: "bold", color: COLORS.text },
  voiceContent: { alignItems: "center", padding: s(30) },
  micCircleWrapper: {
    width: s(100),
    height: s(100),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  micCircle: {
    width: s(70),
    height: s(70),
    borderRadius: s(35),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  micCircleActive: { backgroundColor: COLORS.danger },
  pulse: {
    position: "absolute",
    width: s(90),
    height: s(90),
    borderRadius: s(45),
    borderWidth: 2,
    borderColor: COLORS.danger,
    opacity: 0.5,
  },
  voiceInstruction: {
    fontSize: rf(14),
    color: COLORS.textLight,
    marginBottom: vs(20),
  },
  resultBox: {
    minHeight: vs(60),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: s(12),
    padding: s(10),
    marginBottom: vs(20),
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  resultText: {
    fontSize: rf(18),
    color: COLORS.text,
    fontStyle: "italic",
    textAlign: "center",
  },
  voiceDoneBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: s(60),
    paddingVertical: vs(15),
    borderRadius: s(30),
    elevation: 3,
    marginBottom: vs(20),
  },
});

export default StaffAddEditModal;
