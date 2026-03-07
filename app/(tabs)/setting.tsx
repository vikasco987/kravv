import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const COLORS = {
    primary: '#4F46E5', // Indigo
    secondary: '#10B981', // Emerald
    accent: '#F59E0B', // Amber
    danger: '#EF4444',  // Red
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

export default function SettingScreen() {
    const { signOut } = useClerk();
    const { user, isLoaded } = useUser();
    const router = useRouter();

    if (!isLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace("/(auth)/sign-in");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleSignIn = () => {
        router.push("/(auth)/sign-in" as any);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Manage your account and preferences</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name={"person-circle" as any} size={80} color={COLORS.primary} />
                        </View>
                        <View style={styles.userText}>
                            <Text style={styles.userName}>{user ? `${user.firstName || 'User'}` : "Guest Account"}</Text>
                            <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress || "Sign in to access all features"}</Text>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        {!user ? (
                            <TouchableOpacity
                                style={[styles.button, styles.signInButton]}
                                onPress={handleSignIn}
                                activeOpacity={0.8}
                            >
                                <View style={styles.buttonIconBackground}>
                                    <Ionicons name={"log-in-outline" as any} size={22} color={COLORS.primary} />
                                </View>
                                <Text style={styles.buttonText}>Sign In</Text>
                                <Ionicons name={"chevron-forward" as any} size={20} color={COLORS.white} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, styles.signOutButton]}
                                onPress={handleSignOut}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.buttonIconBackground, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Ionicons name={"log-out-outline" as any} size={22} color={COLORS.white} />
                                </View>
                                <Text style={styles.buttonText}>Sign Out</Text>
                                <Ionicons name={"chevron-forward" as any} size={20} color={COLORS.white} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <View style={styles.infoIconContainer}>
                        <Ionicons name={"information-circle" as any} size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Why sign in?</Text>
                        <Text style={styles.infoText}>
                            Signing in allows you to sync your sales data, manage inventory across devices, and keep your business records safe.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Kravy - Smart Billing App</Text>
                    <Text style={styles.versionNumber}>Version 1.0.0 (Build 102)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 30,
    },
    header: {
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        marginTop: 6,
        fontWeight: '500',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 28,
        padding: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.05)',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 35,
    },
    avatarContainer: {
        marginBottom: 16,
        backgroundColor: COLORS.primary + '10',
        borderRadius: 60,
        padding: 10,
        borderWidth: 4,
        borderColor: '#fff',
    },
    userText: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
        marginRight: 15,
    },
    signInButton: {
        backgroundColor: COLORS.primary,
    },
    signOutButton: {
        backgroundColor: COLORS.danger,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
    infoBox: {
        flexDirection: 'row',
        marginTop: 40,
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 24,
        alignItems: 'flex-start',
        gap: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoIconContainer: {
        backgroundColor: COLORS.primary + '10',
        padding: 10,
        borderRadius: 14,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textLight,
        lineHeight: 22,
        fontWeight: '400',
    },
    footer: {
        marginTop: 50,
        alignItems: 'center',
        marginBottom: 30,
    },
    versionText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '700',
        opacity: 0.8,
    },
    versionNumber: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 4,
        fontWeight: '500',
    }
});
