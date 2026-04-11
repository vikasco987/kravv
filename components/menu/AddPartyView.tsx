import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    NativeModules,
    Vibration,
} from "react-native";
// @ts-ignore
import Voice from '@react-native-voice/voice';
import { rf, s, vs } from "../../utils/responsive";

interface AddPartyViewProps {
    onBack?: () => void;
    onSuccess?: () => void;
}

export default function AddPartyView({ onBack, onSuccess }: AddPartyViewProps) {
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();

    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [billingAddress, setBillingAddress] = useState("");
    const [dob, setDob] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleBack = () => onBack && onBack();

    const handleSubmit = async () => {
        if (!customerName || !phone) {
            setErrorMessage("Please enter name and phone number.");
            setShowError(true);
            return;
        }

        try {
            setLoading(true);
            const token = isLoaded && isSignedIn ? await getToken() : null;
            if (!token) {
                setErrorMessage("Please log in again.");
                setShowError(true);
                return;
            }

            const payload = {
                name: customerName.trim(),
                phone: phone.trim(),
                address: billingAddress.trim() || null,
                dob: dob ? dob.toISOString() : null,
            };

            const response = await fetch("https://billing.kravy.in/api/parties", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setShowSuccess(true);
                setCustomerName("");
                setPhone("");
                setTimeout(() => {
                    setShowSuccess(false);
                    onSuccess && onSuccess();
                    handleBack();
                }, 2000);
            } else {
                const data = await response.json().catch(() => ({}));
                setErrorMessage(data.error || "Failed to add party.");
                setShowError(true);
            }
        } catch (err: any) {
            setErrorMessage("Something went wrong.");
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={rf(26)} color="#4f46e5" />
                <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.title}>➕ Add New Customer</Text>

                <View style={styles.inputGroup}>
                    <Ionicons name="person-circle" size={rf(22)} color="#4f46e5" />
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Customer Name"
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Ionicons name="call" size={rf(22)} color="#4f46e5" />
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                        style={styles.input}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save Customer</Text>}
                </TouchableOpacity>
            </View>

            <Modal transparent visible={showSuccess} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="checkmark-circle" size={rf(60)} color="#10B981" />
                        <Text style={styles.modalTitle}>Success!</Text>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: s(20), paddingTop: vs(55), paddingBottom: vs(30), backgroundColor: "#F0F4FF", minHeight: "100%" },
    backBtn: { flexDirection: "row", alignItems: "center", marginBottom: vs(25) },
    backBtnText: { fontSize: rf(17), color: "#4f46e5", marginLeft: s(6) },
    card: { backgroundColor: "white", padding: s(20), borderRadius: s(15), elevation: 5 },
    title: { fontSize: rf(24), fontWeight: "bold", textAlign: "center", marginBottom: vs(20), color: "#4f46e5" },
    inputGroup: { flexDirection: "row", alignItems: "center", backgroundColor: "#eef2ff", padding: s(12), borderRadius: s(10), marginBottom: vs(15), borderWidth: 1, borderColor: "#d0d7ff" },
    input: { flex: 1, marginLeft: s(10), fontSize: rf(16) },
    button: { backgroundColor: "#4f46e5", padding: s(15), borderRadius: s(12), alignItems: "center", marginTop: vs(20) },
    buttonText: { color: "white", fontWeight: "bold", fontSize: rf(18) },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: s(24), padding: s(30), alignItems: 'center' },
    modalTitle: { fontSize: rf(22), fontWeight: 'bold', color: '#10B981', marginTop: 10 },
});
