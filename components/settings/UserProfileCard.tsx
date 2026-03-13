import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    primary: '#4F46E5',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface UserProfileCardProps {
    user: any;
    onSignIn: () => void;
    onSignOut: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
    user,
    onSignIn,
    onSignOut,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <Ionicons name={"person-circle" as any} size={rf(60)} color={COLORS.primary} />
                </View>
                <View style={styles.userText}>
                    <Text style={styles.userName}>{user ? `${user.firstName || "User"}` : "Guest Account"}</Text>
                    <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress || "Sign in to access all features"}</Text>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                {!user ? (
                    <TouchableOpacity
                        style={[styles.button, styles.signInButton]}
                        onPress={onSignIn}
                        activeOpacity={0.8}
                    >
                        <View style={styles.buttonIconBackground}>
                            <Ionicons name={"log-in-outline" as any} size={rf(22)} color={COLORS.primary} />
                        </View>
                        <Text style={styles.buttonText}>Sign In</Text>
                        <Ionicons name={"chevron-forward" as any} size={rf(20)} color={COLORS.white} style={{ marginLeft: "auto" }} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, styles.signOutButton]}
                        onPress={onSignOut}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.buttonIconBackground, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                            <Ionicons name={"log-out-outline" as any} size={rf(22)} color={COLORS.white} />
                        </View>
                        <Text style={styles.buttonText}>Sign Out</Text>
                        <Ionicons name={"chevron-forward" as any} size={rf(20)} color={COLORS.white} style={{ marginLeft: "auto" }} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: s(20),
        padding: s(16),
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
        marginBottom: vs(20),
    },
    avatarContainer: {
        marginBottom: vs(8),
        backgroundColor: COLORS.primary + '10',
        borderRadius: s(60),
        padding: s(8),
        borderWidth: 3,
        borderColor: '#fff',
    },
    userText: {
        alignItems: 'center',
    },
    userName: {
        fontSize: rf(21),
        fontWeight: '800',
        color: COLORS.text,
    },
    userEmail: {
        fontSize: rf(13),
        color: COLORS.textLight,
        marginTop: vs(4),
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: s(20),
        borderRadius: s(15),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: s(8),
        borderRadius: s(12),
        marginRight: s(15),
    },
    signInButton: {
        backgroundColor: COLORS.primary,
    },
    signOutButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        color: COLORS.white,
        fontSize: rf(16),
        fontWeight: '700',
    },
});
