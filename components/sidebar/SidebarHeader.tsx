import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface SidebarHeaderProps {
    user: any;
    t: (key: string) => string;
}

const SidebarHeader = ({ user, t }: SidebarHeaderProps) => {
    const displayName = user?.firstName || user?.name || 'User';
    const displayEmail = user?.primaryEmailAddress?.emailAddress || user?.email || "";

    return (
        <View style={styles.header}>
            <Ionicons name="person-circle-outline" size={rf(70)} color="#fff" />
            <Text style={styles.welcome}>
                {user ? `${t('hi')}, ${displayName}` : t('welcome_guest')}
            </Text>
            {user && <Text style={styles.userId}>{displayEmail}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: "#4F46E5",
        padding: s(20),
        alignItems: "center",
    },
    welcome: { color: "#fff", fontSize: rf(18), fontWeight: "bold" },
    userId: { color: "rgba(255,255,255,0.8)", fontSize: rf(12), marginTop: vs(4) },
});

export default SidebarHeader;
