"use client";
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
    View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

export default function AddPartyScreen({
    onSuccess,
    onBack,
}: {
    onSuccess?: () => void;
    onBack?: () => void;
}) {
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

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (selectedDate) setDob(selectedDate);
    };

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
                setErrorMessage("Please log in again to add customers.");
                setShowError(true);
                return;
            }

            const payload = {
                name: customerName.trim(),
                phone: phone.trim(),
                address: billingAddress.trim() || null,
                dob: dob ? dob.toISOString() : null,
            };

            const response = await fetch(
                "https://billing.kravy.in/api/parties",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const text = await response.text();
            let data: any;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { error: text || "Server returned an error" };
            }

            if (response.ok) {
                setShowSuccess(true);
                setCustomerName("");
                setPhone("");
                setBillingAddress("");
                setDob(null);

                setTimeout(() => {
                    setShowSuccess(false);
                    onSuccess && onSuccess();
                    handleBack();
                }, 2000);
            } else {
                setErrorMessage(data.error || "Failed to add party.");
                setShowError(true);
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Something went wrong.");
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{
                paddingHorizontal: s(20),
                paddingTop: vs(55),
                paddingBottom: vs(30),
                backgroundColor: "#F0F4FF",
                minHeight: "100%",
            }}
        >
            {/* Back Button */}
            <TouchableOpacity
                onPress={handleBack}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: vs(25) }}
            >
                <Ionicons name="arrow-back" size={rf(26)} color="#4f46e5" />
                <Text style={{ fontSize: rf(17), color: "#4f46e5", marginLeft: s(6) }}>
                    Back
                </Text>
            </TouchableOpacity>

            {/* Card Container */}
            <View
                style={{
                    backgroundColor: "white",
                    padding: s(20),
                    borderRadius: s(15),
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                }}
            >
                <Text
                    style={{
                        fontSize: rf(26),
                        fontWeight: "bold",
                        textAlign: "center",
                        marginBottom: vs(20),
                        color: "#4f46e5",
                    }}
                >
                    ➕ Add New Customer
                </Text>

                {/* Inputs */}
                <View style={styles.inputContainer as any}>
                    <Ionicons name="person-circle" size={rf(22)} color="#4f46e5" />
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Customer Name"
                        placeholderTextColor="#777"
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputContainer as any}>
                    <Ionicons name="call" size={rf(22)} color="#4f46e5" />
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                        placeholderTextColor="#777"
                        style={styles.input}
                    />
                </View>

                {/* Billing Address */}
                {/* <View style={[styles.inputContainer, { height: 100 }] as any}>
                    <Ionicons name="home" size={22} color="#4f46e5" />
                    <TextInput
                        value={billingAddress}
                        onChangeText={setBillingAddress}
                        placeholder="Billing Address"
                        multiline
                        placeholderTextColor="#777"
                        style={[styles.input, { height: "100%" }]}
                    />
                </View> */}

                {/* DOB Picker */}
                {/* <TouchableOpacity
                    onPress={() => setShowPicker(true)}
                    style={[styles.inputContainer, { justifyContent: "center" }] as any}
                >
                    <Ionicons name="calendar" size={22} color="#4f46e5" />
                    <Text
                        style={{
                            marginLeft: 10,
                            color: dob ? "black" : "#777",
                        }}
                    >
                        {dob ? dob.toDateString() : "Select Date of Birth"}
                    </Text>
                </TouchableOpacity> */}

                {showPicker && (
                    <DateTimePicker
                        value={dob || new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                    />
                )}

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.button, loading && { opacity: 0.6 }] as any}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText as any}>Save Customer</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal transparent visible={showSuccess} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successCircle}>
                            <Ionicons name="checkmark-sharp" size={rf(40)} color="#10B981" />
                        </View>
                        <Text style={styles.modalTitle}>Perfect!</Text>
                        <Text style={styles.modalSubtitle}>Customer added to your party list.</Text>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal transparent visible={showError} animationType="fade" onRequestClose={() => setShowError(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.successCircle, { backgroundColor: '#FFEEF2', borderColor: '#FFD1DC' }]}>
                            <Ionicons name="alert-circle" size={rf(45)} color="#F43F5E" />
                        </View>
                        <Text style={[styles.modalTitle, { color: '#F43F5E' }]}>Oops!</Text>
                        <Text style={styles.modalSubtitle}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={[styles.button, { marginTop: vs(20), width: '100%', backgroundColor: '#F43F5E' }]}
                            onPress={() => setShowError(false)}
                        >
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eef2ff",
        padding: s(12),
        borderRadius: s(10),
        marginBottom: vs(15),
        borderWidth: 1,
        borderColor: "#d0d7ff",
    },
    input: {
        flex: 1,
        marginLeft: s(10),
        fontSize: rf(16),
        color: "black",
    },
    button: {
        backgroundColor: "#4f46e5",
        padding: s(15),
        borderRadius: s(12),
        alignItems: "center",
        marginTop: vs(20),
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: rf(18),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: s(24),
        padding: s(30),
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    successCircle: {
        width: s(70),
        height: s(70),
        borderRadius: s(35),
        backgroundColor: '#D1FAE5',
        borderWidth: 2,
        borderColor: '#A7F3D0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(15),
    },
    modalTitle: {
        fontSize: rf(22),
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: vs(8),
    },
    modalSubtitle: {
        fontSize: rf(14),
        color: '#6B7280',
        textAlign: 'center',
    },
});
