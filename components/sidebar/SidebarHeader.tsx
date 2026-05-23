import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rf, s, vs } from "../../utils/responsive";

interface SidebarHeaderProps {
    user: any;
    t: (key: string) => string;
}

const SidebarHeader = ({ user, t }: SidebarHeaderProps) => {
    const displayName = user?.firstName || user?.name || 'User';
    const displayEmail = user?.primaryEmailAddress?.emailAddress || user?.email || "";
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={["#8B5CF6", "#6D28D9"]}
            style={[styles.header, { paddingTop: Math.max(insets.top, vs(30)) + vs(50) }]}
        >
            <View style={[styles.onlineBadge, { top: Math.max(insets.top, vs(30)) + vs(20) }]}>
                <View style={[styles.onlineDot, { backgroundColor: user ? "#10B981" : "#EF4444" }]} />
                <Text style={styles.onlineText}>{user ? "Online" : "Offline"}</Text>
            </View>

            <View style={styles.avatarContainer}>
                <Feather name="user" size={rf(28)} color="#fff" />
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.welcome} numberOfLines={1}>
                    {user ? `Hi, ${displayName} 👋` : t('welcome_guest')}
                </Text>
                {user && <Text style={styles.userId} numberOfLines={1}>{displayEmail}</Text>}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: s(20),
        paddingTop: vs(30),
        paddingBottom: vs(25),
        flexDirection: "row",
        alignItems: "center",
        borderBottomLeftRadius: s(20),
        borderBottomRightRadius: s(20),
        marginBottom: vs(10),
        position: "relative",
        width: "100%",
        alignSelf: "stretch",
    },
    avatarContainer: {
        width: s(54),
        height: s(54),
        borderRadius: s(27),
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        marginRight: s(15),
    },
    infoContainer: {
        flex: 1,
        justifyContent: "center",
    },
    welcome: {
        color: "#fff",
        fontSize: rf(16),
        fontWeight: "bold",
        marginBottom: vs(2),
    },
    userId: {
        color: "rgba(255,255,255,0.7)",
        fontSize: rf(12),
    },
    onlineBadge: {
        position: "absolute",
        top: vs(15),
        right: s(15),
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: s(8),
        paddingVertical: vs(4),
        borderRadius: s(12),
    },
    onlineDot: {
        width: s(6),
        height: s(6),
        borderRadius: s(3),
        backgroundColor: "#10B981",
        marginRight: s(4),
    },
    onlineText: {
        color: "#fff",
        fontSize: rf(10),
        fontWeight: "600",
    },
});

export default SidebarHeader;
