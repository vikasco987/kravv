import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface ProfileSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  profiles: any[];
  activeProfileId: string | null;
  onSelectProfile: (profile: any) => void;
}

const THEME_PRIMARY = "#4F46E5";

export const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  visible,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Business Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={rf(24)} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
            {profiles.length === 0 ? (
              <Text style={styles.emptyText}>No business profiles found.</Text>
            ) : (
              profiles.map((profile, idx) => {
                const profileId = profile.id || profile._id || profile.businessId;
                const isActive = activeProfileId === profileId;

                return (
                  <TouchableOpacity
                    key={profileId || idx}
                    style={[styles.profileCard, isActive && styles.profileCardActive]}
                    onPress={() => {
                      onSelectProfile(profile);
                      onClose();
                    }}
                  >
                    <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                      <MaterialCommunityIcons
                        name="store"
                        size={rf(20)}
                        color={isActive ? THEME_PRIMARY : "#64748B"}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.businessName, isActive && styles.businessNameActive]}>
                        {profile.businessName || "Unnamed Business"}
                      </Text>
                      <Text style={styles.businessLocation}>
                        {profile.district || profile.state || "No Location"}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={rf(22)} color={THEME_PRIMARY} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end", // Bottom sheet style
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    maxHeight: "60%",
    paddingBottom: vs(20),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(20),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: rf(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  list: {
    paddingHorizontal: s(20),
  },
  listContent: {
    paddingTop: vs(10),
    paddingBottom: vs(20),
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(16),
    backgroundColor: "#F8FAFC",
    borderRadius: s(12),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  iconBox: {
    width: s(40),
    height: s(40),
    borderRadius: s(10),
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
  },
  iconBoxActive: {
    backgroundColor: "#E0E7FF",
  },
  cardContent: {
    flex: 1,
  },
  businessName: {
    fontSize: rf(15),
    fontWeight: "600",
    color: "#334155",
  },
  businessNameActive: {
    color: THEME_PRIMARY,
  },
  businessLocation: {
    fontSize: rf(12),
    color: "#64748B",
    marginTop: vs(2),
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: rf(14),
    marginTop: vs(20),
  },
});
