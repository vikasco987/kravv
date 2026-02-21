import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from "react-native";

export default function ViewCompanyProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // 👇 replace this with your deployed backend URL
  const BACKEND_URL = "https://billing-backend-sable.vercel.app";

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/profile/recent`);
      const data = await res.json();

      if (res.ok) {
        setProfile(data);
      } else {
        Alert.alert("No Profile", data.message || "No business profile found.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      Alert.alert("Error", "Failed to fetch company profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "gray" }}>No company profile found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏢 Company Profile</Text>

      {profile.logoUrl ? (
        <Image source={{ uri: profile.logoUrl }} style={styles.logo} />
      ) : (
        <Text style={{ textAlign: "center", color: "#777" }}>No logo uploaded</Text>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Business Type</Text>
        <Text style={styles.value}>{profile.businessType}</Text>

        <Text style={styles.label}>Business Name</Text>
        <Text style={styles.value}>{profile.businessName}</Text>

        {profile.businessTagLine ? (
          <>
            <Text style={styles.label}>Tagline</Text>
            <Text style={styles.value}>{profile.businessTagLine}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Contact Person</Text>
        <Text style={styles.value}>{profile.contactPersonName}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{profile.contactPersonPhone}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.contactPersonEmail}</Text>

        {profile.upi ? (
          <>
            <Text style={styles.label}>UPI ID</Text>
            <Text style={styles.value}>{profile.upi}</Text>
          </>
        ) : null}

        {profile.googleReviewUrl ? (
          <>
            <Text style={styles.label}>Google Review Link</Text>
            <Text style={[styles.value, { color: "#2563eb" }]}>
              {profile.googleReviewUrl}
            </Text>
          </>
        ) : null}
      </View>

      {profile.signatureUrl ? (
        <View style={{ alignItems: "flex-end", marginTop: 30 }}>
          <Image source={{ uri: profile.signatureUrl }} style={styles.signature} />
          <Text style={{ fontSize: 12, color: "gray" }}>Authorized Signature</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    color: "#555",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: "#222",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  signature: {
    width: 100,
    height: 60,
    resizeMode: "contain",
  },
});
