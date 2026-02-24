"use client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

    const handleBack = () => onBack && onBack();

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (selectedDate) setDob(selectedDate);
    };

    const handleSubmit = async () => {
        if (!customerName || !phone) {
            Alert.alert("Missing Fields", "Please enter name and phone number.");
            return;
        }

        try {
            setLoading(true);
            const token = isLoaded && isSignedIn ? await getToken() : null;
            if (!token) {
                Alert.alert("Unauthorized", "Please log in again.");
                return;
            }

            const payload = {
                name: customerName.trim(),
                phone: phone.trim(),
                address: billingAddress.trim() || null,
                dob: dob ? dob.toISOString() : null,
            };

            console.log("Payload sent:", payload);

            const response = await fetch(
                "https://billing-backend-sable.vercel.app/api/parties",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            console.log("Server Status:", response.status);
            const text = await response.text();
            let data: any;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { error: text || "Server returned an error" };
            }

            if (response.ok) {
                Alert.alert("✅ Success", "Party added successfully!");
                setCustomerName("");
                setPhone("");
                setBillingAddress("");
                setDob(null);
                onSuccess && onSuccess();
                handleBack();
            } else {
                console.warn("Server Error Response:", text);
                Alert.alert("Error", data.error || "Failed to add party.");
            }
        } catch (err: any) {
            console.warn("Network/Request Error:", err.message);
            Alert.alert("Error", err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{
                padding: 20,
                backgroundColor: "#F0F4FF",
                minHeight: "100%",
            }}
        >
            {/* Back Button */}
            <TouchableOpacity
                onPress={handleBack}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
            >
                <Ionicons name="arrow-back" size={26} color="#4f46e5" />
                <Text style={{ fontSize: 17, color: "#4f46e5", marginLeft: 6 }}>
                    Back
                </Text>
            </TouchableOpacity>

            {/* Card Container */}
            <View
                style={{
                    backgroundColor: "white",
                    padding: 20,
                    borderRadius: 15,
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                }}
            >
                <Text
                    style={{
                        fontSize: 26,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginBottom: 20,
                        color: "#4f46e5",
                    }}
                >
                    ➕ Add New Customer
                </Text>

                {/* Inputs */}
                <View style={styles.inputContainer as any}>
                    <Ionicons name="person-circle" size={22} color="#4f46e5" />
                    <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Customer Name"
                        placeholderTextColor="#777"
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputContainer as any}>
                    <Ionicons name="call" size={22} color="#4f46e5" />
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
                    <Text style={styles.buttonText as any}>
                        {loading ? "Saving..." : "Save Customer"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = {
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eef2ff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#d0d7ff",
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: "black",
    },
    button: {
        backgroundColor: "#4f46e5",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },
};
