import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { staffService } from '../../services/staffService';
import { useRouter } from 'expo-router';
import { useRefresh } from '../../context/RefreshContext';

interface StaffLoginProps {
    visible: boolean;
    onClose: () => void;
}

export const StaffLogin = ({ visible, onClose }: StaffLoginProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { triggerRefresh } = useRefresh();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        setLoading(true);
        try {
            const res = await staffService.login(email.trim(), password);
            if (res.success && res.data) {
                // Save staff session with token
                const sessionData = { 
                    ...res.data, 
                    token: res.token || res.data.token 
                };
                await AsyncStorage.setItem("staff_session", JSON.stringify(sessionData));
                
                // Trigger refresh so sidebar sees the change
                triggerRefresh();
                
                Alert.alert("Success", `Welcome back, ${res.data.name}!`);
                onClose();
                
                // Redirect to menu
                router.replace("/(tabs)/menu?staff=true");
            } else {
                Alert.alert("Login Failed", res.message || "Invalid credentials. Please try again.");
            }
        } catch (err) {
            Alert.alert("Error", "Something went wrong. Please check your connection.");
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
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={rf(26)} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Staff Intelligence Portal</Text>
                        <View style={{ width: s(40) }} />
                    </View>

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
        paddingVertical: vs(15),
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
        height: vs(30),
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
    }
});
