import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

interface PartyProfileViewProps {
    onBack?: () => void;
    partyId?: string;
}

export default function PartyProfileView({ onBack, partyId }: PartyProfileViewProps) {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = partyId || params.id;
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn } = useUser();

    const [party, setParty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const handleBack = () => {
        if (onBack) onBack();
        else router.back();
    };

    const fetchPartyDetails = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const token = await getToken();
            const res = await fetch(`https://billing.kravy.in/api/parties/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setParty(data.party);
            }
        } catch (e) {
            console.error("Fetch party error", e);
        } finally {
            setLoading(false);
        }
    }, [id, getToken]);

    useEffect(() => {
        if (isLoaded && isSignedIn) fetchPartyDetails();
    }, [isLoaded, isSignedIn, fetchPartyDetails]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={rf(24)} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Profile</Text>
            </View>

            {party && (
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{party.name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.name}>{party.name}</Text>
                    <Text style={styles.phone}>{party.phone}</Text>
                    {party.address && <Text style={styles.address}>{party.address}</Text>}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F9FAFB" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", alignItems: "center", padding: s(20), paddingTop: vs(40), backgroundColor: "#fff" },
    backBtn: { marginRight: s(15) },
    headerTitle: { fontSize: rf(20), fontWeight: "bold" },
    profileCard: { margin: s(20), backgroundColor: "#fff", padding: s(30), borderRadius: s(20), alignItems: "center", elevation: 3 },
    avatar: { width: s(80), height: s(80), borderRadius: s(40), backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginBottom: vs(15) },
    avatarText: { fontSize: rf(30), fontWeight: "bold", color: "#4F46E5" },
    name: { fontSize: rf(22), fontWeight: "bold", color: "#111" },
    phone: { fontSize: rf(16), color: "#6B7280", marginTop: 5 },
    address: { fontSize: rf(14), color: "#9CA3AF", marginTop: 10, textAlign: "center" },
});
