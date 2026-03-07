import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// @ts-ignore
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
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

    const handleBack = () => {
        if (onBack) onBack();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(Platform.OS === "ios");
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
            console.warn("Party Add Error:", err.message);
            Alert.alert("Error", err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <TouchableOpacity
                onPress={handleBack}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
            >
                <Ionicons name="arrow-back" size={24} color="#4f46e5" />
                <Text style={{ fontSize: 16, color: "#4f46e5", marginLeft: 5 }}>Back</Text>
            </TouchableOpacity>

            <Text
                style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 20,
                }}
            >
                ➕ Add New Customer
            </Text>

            <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Customer Name"
                style={styles.input}
            />

            <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                style={styles.input}
            />

            <TextInput
                value={billingAddress}
                onChangeText={setBillingAddress}
                placeholder="Billing Address"
                multiline
                numberOfLines={3}
                style={[styles.input, { height: 90 }]}
            />

            <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={[styles.input, { justifyContent: "center" }]}
            >
                <Text>{dob ? dob.toDateString() : "Select DOB"}</Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={dob || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                />
            )}

            <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.button, loading && { opacity: 0.6 }]}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? "Saving..." : "Save Party"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: "white",
    },
    button: {
        backgroundColor: "#4f46e5",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
