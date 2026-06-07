import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { getCompanyProfiles, updateBusinessSettings } from "../../services/companyService";
import { rf, s, vs } from "../../utils/responsive";
import CompanyInfoView from "./CompanyInfoView";

interface MultiProfileViewProps {
  onBack: () => void;
}

const THEME_COLOR = "#4F46E5";

export default function MultiProfileView({ onBack }: MultiProfileViewProps) {
  const { getToken } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [enableMultipleProfiles, setEnableMultipleProfiles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const clerkToken = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const token = clerkToken || staffSession?.token;

      if (token) {
        const data = await getCompanyProfiles(token);
        if (data) {
          setProfiles(data.profiles || []);
          setEnableMultipleProfiles(data.enableMultipleProfiles || false);
        } else {
          setProfiles([]);
        }
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const toggleMultipleProfiles = async (newValue: boolean) => {
    setEnableMultipleProfiles(newValue);
    try {
      const clerkToken = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const token = clerkToken || staffSession?.token;
      if (token) {
        await updateBusinessSettings(token, { enableMultipleProfiles: newValue });
        await AsyncStorage.setItem("enable_multiple_profiles", String(newValue));
      }
    } catch (e) {
      console.error("Toggle error:", e);
    }
  };

  const handleProfileUpdated = () => {
    fetchProfiles();
    setIsCreatingNew(false);
    if (!enableMultipleProfiles) {
      // Keep selectedProfile as is in single mode to stay on form
    } else {
      setSelectedProfile(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  // Edit an existing profile or create a new one
  if (selectedProfile !== null || isCreatingNew) {
    return (
      <View style={{ flex: 1 }}>
        {enableMultipleProfiles && (
          <TouchableOpacity
            style={styles.backButtonInline}
            onPress={() => { setSelectedProfile(null); setIsCreatingNew(false); }}
          >
            <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
            <Text style={styles.backText}>Back to Profiles</Text>
          </TouchableOpacity>
        )}
        <CompanyInfoView
          onBack={() => {
            if (enableMultipleProfiles) {
              setSelectedProfile(null);
              setIsCreatingNew(false);
            } else {
              onBack();
            }
          }}
          profileData={isCreatingNew ? null : selectedProfile}
          isNew={isCreatingNew}
          onProfileUpdated={handleProfileUpdated}
        />
      </View>
    );
  }

  // Single Profile Mode
  if (!enableMultipleProfiles) {
    if (profiles.length === 0) {
      return (
        <ScrollView contentContainerStyle={styles.container} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.toggleCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Multi-Business Profiles</Text>
              <Text style={styles.cardSubtitle}>Manage multiple restaurants from a single account.</Text>
            </View>
            <Switch
              value={enableMultipleProfiles}
              onValueChange={toggleMultipleProfiles}
              trackColor={{ false: "#CBD5E1", true: THEME_COLOR }}
            />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Business Profile</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setIsCreatingNew(true)}>
              <Text style={styles.createButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.toggleCard, { marginHorizontal: s(20), marginTop: vs(20) }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Multi-Business Profiles</Text>
            <Text style={styles.cardSubtitle}>Manage multiple restaurants from a single account.</Text>
          </View>
          <Switch
            value={enableMultipleProfiles}
            onValueChange={toggleMultipleProfiles}
            trackColor={{ false: "#CBD5E1", true: THEME_COLOR }}
          />
        </View>
        <CompanyInfoView
          onBack={onBack}
          profileData={profiles[0]}
          onProfileUpdated={handleProfileUpdated}
        />
      </View>
    );
  }

  // Multi-Profile List Mode
  return (
    <ScrollView contentContainerStyle={styles.container} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={rf(20)} color="#1E293B" />
      </TouchableOpacity>

      <View style={styles.toggleCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Multi-Business Profiles</Text>
          <Text style={styles.cardSubtitle}>Manage multiple restaurants from a single account.</Text>
        </View>
        <Switch
          value={enableMultipleProfiles}
          onValueChange={toggleMultipleProfiles}
          trackColor={{ false: "#CBD5E1", true: THEME_COLOR }}
        />
      </View>

      <Text style={styles.sectionHeader}>Your Businesses</Text>

      <View style={styles.grid}>
        {profiles.map((p, idx) => (
          <TouchableOpacity
            key={p.id || idx}
            style={styles.profileCard}
            onPress={() => setSelectedProfile(p)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="store" size={rf(24)} color={THEME_COLOR} />
              </View>
              <View style={{ flex: 1, marginLeft: s(12) }}>
                <Text style={styles.businessName} numberOfLines={1}>{p.businessName || "Unnamed Business"}</Text>
                <Text style={styles.businessLocation}>{p.district || p.state || "No Location"}</Text>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>Phone: {p.contactPersonPhone || "N/A"}</Text>
              <Text style={styles.detailText}>GST: {p.gstNumber || "N/A"}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addCard}
          onPress={() => setIsCreatingNew(true)}
        >
          <View style={styles.addIconBox}>
            <Ionicons name="add" size={rf(24)} color={THEME_COLOR} />
          </View>
          <Text style={styles.addTitle}>Add New Business</Text>
          <Text style={styles.addSubtitle}>Create another profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: s(20),
    paddingTop: vs(20),
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    marginBottom: vs(20),
    alignSelf: "flex-start",
  },
  backButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingTop: vs(20),
    paddingBottom: vs(10),
    backgroundColor: "#F8FAFC",
  },
  backText: {
    marginLeft: s(10),
    fontSize: rf(16),
    color: "#1E293B",
    fontWeight: "600",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: s(16),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: vs(24),
  },
  cardTitle: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: vs(4),
  },
  cardSubtitle: {
    fontSize: rf(12),
    color: "#64748B",
  },
  sectionHeader: {
    fontSize: rf(22),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: vs(16),
  },
  grid: {
    gap: vs(16),
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: s(16),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(12),
  },
  iconBox: {
    width: s(48),
    height: s(48),
    borderRadius: s(12),
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  businessName: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#1E293B",
  },
  businessLocation: {
    fontSize: rf(12),
    color: "#64748B",
    marginTop: vs(2),
  },
  cardDetails: {
    marginTop: vs(8),
  },
  detailText: {
    fontSize: rf(13),
    color: "#475569",
    marginBottom: vs(4),
  },
  addCard: {
    backgroundColor: "#F8FAFC",
    padding: s(20),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: vs(140),
  },
  addIconBox: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(12),
  },
  addTitle: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#312E81",
  },
  addSubtitle: {
    fontSize: rf(12),
    color: "#64748B",
    marginTop: vs(4),
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: vs(40),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: vs(16),
  },
  createButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: s(8),
  },
  createButtonText: {
    color: "#FFF",
    fontSize: rf(16),
    fontWeight: "600",
  },
});
