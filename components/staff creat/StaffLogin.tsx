import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    DeviceEventEmitter
} from 'react-native';
import { useRefresh } from '../../context/RefreshContext';
import { staffService } from '../../services/staffService';
import { rf, s, vs } from '../../utils/responsive';

interface StaffLoginProps {
    visible: boolean;
    onClose: () => void;
}

export const StaffLogin = ({ visible, onClose }: StaffLoginProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusType, setStatusType] = useState<"success" | "error">("success");
    const [statusTitle, setStatusTitle] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [staffName, setStaffName] = useState("");
    const router = useRouter();
    const { triggerRefresh } = useRefresh();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setStatusType("error");
            setStatusTitle("Field Missing");
            setStatusMsg("Please enter both email and password to proceed.");
            setShowStatusModal(true);
            return;
        }

        setLoading(true);
        try {
            const res = await staffService.login(email.trim(), password);
            if (res.success && res.data) {
                // 1. 🛡️ DATA ISOLATION: Wipe previous cached data to ensure a fresh start for this staff member
                const currentLang = await AsyncStorage.getItem("app_language");
                const savedPrinter = await AsyncStorage.getItem("saved_printer");
                
                await AsyncStorage.clear();
                
                if (currentLang) await AsyncStorage.setItem("app_language", currentLang);
                if (savedPrinter) await AsyncStorage.setItem("saved_printer", savedPrinter);

                // 2. Save new staff session
                const sessionData = {
                    ...res.data,
                    token: res.token || res.data.token
                };
                await AsyncStorage.setItem("staff_session", JSON.stringify(sessionData));

                DeviceEventEmitter.emit('PERMISSIONS_UPDATED');

                // ✅ ENHANCED TERMINAL LOGIN TOKEN
                // Added a small delay to ensure it shows up in Metro terminal
                setTimeout(() => {
                    console.log("\n" + "=".repeat(50));
                    console.log("🚀 [TOKEN-STAFF-LOGIN] GENERATED SUCCESS");
                    console.log(`👤 STAFF NAME : ${res.data.name}`);
                    console.log(`📧 EMAIL      : ${email}`);
                    console.log(`⏰ TIMESTAMP  : ${new Date().toLocaleString()}`);
                    console.log("=".repeat(50) + "\n");
                }, 500);

                // Trigger refresh so sidebar sees the change
                triggerRefresh();

                setStaffName(res.data.name);
                setStatusType("success");
                setStatusTitle("Login Successful");
                setStatusMsg(`Welcome back, ${res.data.name}!`);
                setShowStatusModal(true);

                // Close success modal after 2 seconds and then finish login
                setTimeout(() => {
                    setShowStatusModal(false);
                    onClose();
                    router.replace("/(tabs)/menu?staff=true");
                }, 2000);
            } else {
                setStatusType("error");
                setStatusTitle("Login Failed");
                setStatusMsg(res.message || "Invalid credentials. Please try again.");
                setShowStatusModal(true);
            }
        } catch (err) {
            setStatusType("error");
            setStatusTitle("System Error");
            setStatusMsg("Something went wrong. Please check your connection.");
            setShowStatusModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={rf(26)} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Staff Intelligence Portal</Text>
                    <View style={{ width: s(40) }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >

                    <View style={styles.content}>
                        <View style={styles.logoContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="shield-checkmark" size={rf(50)} color="#4F46E5" />
                            </View>
                            <Text style={styles.welcomeText}>Staff Authentication</Text>
                            <Text style={styles.subText}>Secure access to restaurant management</Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.inputLabel}>OFFICIAL EMAIL</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={rf(20)} color="#64748b" style={{ marginRight: s(10) }} />
                                <TextInput
                                    placeholder="Enter your email"
                                    placeholderTextColor="#94a3b8"
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={rf(20)} color="#64748b" style={{ marginRight: s(10) }} />
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor="#94a3b8"
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={rf(20)}
                                        color="#64748b"
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.loginBtnText}>SIGN IN AS STAFF</Text>
                                        <Ionicons name="arrow-forward" size={rf(18)} color="#fff" style={{ marginLeft: s(10) }} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Unable to login?</Text>
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Contact Restaurant Owner</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* --- Premium Status Feedback Modal (Success/Error) --- */}
                <Modal visible={showStatusModal} transparent animationType="fade">
                    <View style={styles.statusOverlay}>
                        <View style={styles.statusCard}>
                            <View style={styles.statusIconCircle}>
                                <Ionicons
                                    name={statusType === "success" ? "checkmark-circle" : "alert-circle"}
                                    size={rf(60)}
                                    color={statusType === "success" ? "#10B981" : "#EF4444"}
                                />
                            </View>
                            <Text style={styles.statusTitle}>{statusTitle}</Text>
                            <Text style={styles.statusSubTitle}>{statusMsg}</Text>

                            {statusType === "error" && (
                                <TouchableOpacity
                                    style={styles.errorCloseBtn}
                                    onPress={() => setShowStatusModal(false)}
                                >
                                    <Text style={styles.errorCloseBtnText}>TRY AGAIN</Text>
                                </TouchableOpacity>
                            )}

                            <View style={[styles.statusBar, { backgroundColor: statusType === "success" ? "#4F46E5" : "#EF4444" }]} />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Deep navy/black
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: s(20),
        paddingTop: vs(50),
        paddingBottom: vs(15),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: s(5),
    },
    headerTitle: {
        color: '#fff',
        fontSize: rf(18),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: s(30),
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: vs(40),
    },
    iconCircle: {
        width: s(100),
        height: s(100),
        borderRadius: s(50),
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.3)',
    },
    welcomeText: {
        color: '#fff',
        fontSize: rf(24),
        fontWeight: '800',
    },
    subText: {
        color: '#94a3b8',
        fontSize: rf(14),
        marginTop: vs(5),
    },
    form: {
        width: '100%',
    },
    inputLabel: {
        color: '#6366f1',
        fontSize: rf(11),
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: vs(8),
        marginLeft: s(5),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: s(15),
        paddingHorizontal: s(20),
        paddingVertical: vs(12),
        marginBottom: vs(25),
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: rf(16),
        height: vs(45),
    },
    loginBtn: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(16),
        borderRadius: s(15),
        marginTop: vs(10),
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    loginBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: rf(16),
        letterSpacing: 1,
    },
    footer: {
        alignItems: 'center',
        marginTop: vs(40),
    },
    footerText: {
        color: '#64748b',
        fontSize: rf(13),
    },
    forgotText: {
        color: '#6366f1',
        fontWeight: '700',
        fontSize: rf(14),
        marginTop: vs(5),
    },
    // Status Modal Styles
    statusOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusCard: {
        backgroundColor: '#fff',
        width: s(300),
        borderRadius: s(25),
        padding: s(30),
        alignItems: 'center',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    statusIconCircle: {
        marginBottom: vs(15),
    },
    statusTitle: {
        fontSize: rf(22),
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
    },
    statusSubTitle: {
        fontSize: rf(14),
        color: '#64748b',
        textAlign: 'center',
        marginTop: vs(8),
        fontWeight: '500',
        lineHeight: vs(20),
    },
    errorCloseBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: s(25),
        paddingVertical: vs(10),
        borderRadius: s(20),
        marginTop: vs(20),
    },
    errorCloseBtnText: {
        color: '#EF4444',
        fontWeight: '800',
        fontSize: rf(12),
        letterSpacing: 1,
    },
    statusBar: {
        width: s(60),
        height: vs(4),
        borderRadius: s(2),
        marginTop: vs(20),
    }
});
