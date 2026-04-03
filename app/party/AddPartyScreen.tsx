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
    View,
    NativeModules,
    Vibration,
} from "react-native";
// @ts-ignore
import Voice from '@react-native-voice/voice';
import { rf, s, vs } from "../../utils/responsive";

// Global voice controllers to prevent double-speaking in Add Party
let addPartyHasSpoken = false;
let addPartyLastSpokenTime = 0;
let addPartyLastSpokenValue = ""; // Strictly track EXACT text to avoid double-results

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
    const [isListening, setIsListening] = useState(false);
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);

    const handleBack = () => onBack && onBack();

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (selectedDate) setDob(selectedDate);
    };

    React.useEffect(() => {
        // Use DeviceEventEmitter for direct bridge communication
        const { DeviceEventEmitter } = require('react-native');
        
        const subscriptions = [
          DeviceEventEmitter.addListener('onSpeechStart', () => {
            setIsListening(true);
            addPartyHasSpoken = false;
            addPartyLastSpokenTime = 0;
            addPartyLastSpokenValue = "";
          }),
          DeviceEventEmitter.addListener('onSpeechEnd', () => setIsListening(false)),
          DeviceEventEmitter.addListener('onSpeechResults', (e: any) => {
            if (e.value && e.value.length > 0) {
              const name = e.value[0];
              setCustomerName(name);
              setIsListening(false);
              Vibration.vibrate(100);

              // --- AI INTELLIGENCE: CONDITIONAL ADD CUSTOMER CONFIRMATION ---
              const now = Date.now();
              // Ultimate Lock: Never speak same value twice OR less than 3 seconds apart
              if ((!addPartyHasSpoken || name !== addPartyLastSpokenValue) && (now - addPartyLastSpokenTime) > 3000) {
                 addPartyHasSpoken = true;
                 addPartyLastSpokenTime = now;
                 addPartyLastSpokenValue = name;
                 
                 try {
                     const ExpoSpeech = require('expo-speech');
                     if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
                         ExpoSpeech.speak(`Successfully added new client, ${name}`, {
                             language: 'hi-IN',
                             pitch: 1.0,
                             rate: 0.9,
                         });
                     }
                 } catch (err) {}
              }
            }
          }),
          DeviceEventEmitter.addListener('onSpeechPartialResults', (e: any) => {
            if (e.value && e.value.length > 0) {
              setCustomerName(e.value[0]);
            }
          }),
          DeviceEventEmitter.addListener('onSpeechError', (e: any) => {
            // Silence terminal logs for non-fatal codes like 5, 7, 11
            const code = e.error?.code || "";
            if (!code.includes('5') && !code.includes('7') && !code.includes('11')) {
               console.log("Party Voice Note:", e.error?.message);
            }
            setIsListening(false);
          })
        ];
    
        return () => {
          subscriptions.forEach(sub => sub.remove());
          if (Voice && typeof Voice.destroy === 'function') {
            Voice.destroy().catch(() => {});
          }
        };
    }, []);

    const startListening = async () => {
        try {
          const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
          if (!nativeBridge) return;
    
          // Safety: Try to cancel any existing session before starting
          if (typeof nativeBridge.cancelSpeech === 'function') {
              try {
                  await nativeBridge.cancelSpeech(() => {});
              } catch (e) {}
          }
    
          if (typeof nativeBridge.startSpeech === 'function') {
            const options = {
              EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
              EXTRA_MAX_RESULTS: 1,
              EXTRA_PARTIAL_RESULTS: true,
              REQUEST_PERMISSIONS_AUTO: true
            };
            await nativeBridge.startSpeech('en-IN', options, () => {});
          } else {
            await Voice.start('en-IN');
          }
          setIsListening(true);
          Vibration.vibrate(50);
        } catch (e) {
          setIsListening(false);
        }
    };
    
    const stopListening = async () => {
        try {
          const nativeBridge = NativeModules.Voice || NativeModules.RCTVoice;
          if (nativeBridge && typeof nativeBridge.stopSpeech === 'function') {
            await nativeBridge.stopSpeech(() => {});
          } else {
            await Voice.stop();
          }
          setIsListening(false);
        } catch (e) {
          setIsListening(false);
        }
    };

    React.useEffect(() => {
        if (voiceModalVisible) {
          startListening();
        } else {
          stopListening();
        }
    }, [voiceModalVisible]);

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
                    <TouchableOpacity onPress={() => setVoiceModalVisible(true)}>
                        <Ionicons name="mic-outline" size={rf(22)} color="#4f46e5" />
                    </TouchableOpacity>
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

            {/* Voice Input Modal */}
            <Modal visible={voiceModalVisible} transparent animationType="slide">
                <View style={styles.voiceOverlay}>
                    <View style={styles.voiceContainer}>
                        <View style={styles.voiceHeader}>
                            <Text style={styles.voiceTitle}>Customer Name Voice Input</Text>
                            <TouchableOpacity onPress={() => setVoiceModalVisible(false)} style={{ padding: s(5) }}>
                                <Ionicons name="close" size={rf(24)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.voiceContent}>
                            <View style={styles.micCircleWrapper}>
                                <View style={[styles.micCircle, isListening && styles.micCircleActive]}>
                                    <Ionicons name="mic" size={rf(40)} color="#fff" />
                                </View>
                                {isListening && <View style={styles.pulse} />}
                            </View>
                            
                            <Text style={styles.voiceInstruction}>
                                {isListening ? "Listening... Speak name clearly" : "Tap the Mic to Start"}
                            </Text>
                            
                            <View style={styles.resultBox}>
                                <Text style={styles.resultText} numberOfLines={2}>
                                  {customerName || "Customer Name here..."}
                                </Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.voiceDoneBtn} 
                                onPress={() => setVoiceModalVisible(false)}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>DONE</Text>
                            </TouchableOpacity>
                        </View>
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
    // Voice Modal Styles
    voiceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    voiceContainer: { backgroundColor: '#fff', borderTopLeftRadius: s(30), borderTopRightRadius: s(30), paddingBottom: vs(40) },
    voiceHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: s(20), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    voiceTitle: { fontSize: rf(18), fontWeight: 'bold', color: '#1F2937' },
    voiceContent: { alignItems: 'center', padding: s(30) },
    micCircleWrapper: { width: s(100), height: s(100), justifyContent: 'center', alignItems: 'center', marginBottom: vs(20) },
    micCircle: { width: s(70), height: s(70), borderRadius: s(35), backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    micCircleActive: { backgroundColor: '#EF4444' },
    pulse: { position: 'absolute', width: s(90), height: s(90), borderRadius: s(45), borderWidth: 2, borderColor: '#EF4444', opacity: 0.5 },
    voiceInstruction: { fontSize: rf(14), color: '#6B7280', marginBottom: vs(20) },
    resultBox: { minHeight: vs(60), alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#f9f9f9', borderRadius: s(12), padding: s(10), marginBottom: vs(20), borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' },
    resultText: { fontSize: rf(18), color: '#1F2937', fontStyle: 'italic', textAlign: 'center' },
    voiceDoneBtn: { backgroundColor: '#1F2937', paddingHorizontal: s(60), paddingVertical: vs(15), borderRadius: s(30), elevation: 3, marginBottom: vs(20) }
});
