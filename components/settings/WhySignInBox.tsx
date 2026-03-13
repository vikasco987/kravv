import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    primary: '#4F46E5',
    text: '#111827',
    textLight: '#6B7280',
};

export const WhySignInBox: React.FC = () => {
    return (
        <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
                <Ionicons name={"information-circle" as any} size={rf(24)} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Why sign in?</Text>
                <Text style={styles.infoText}>
                    Signing in allows you to sync your sales data, manage inventory across devices, and keep your business records safe.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    infoBox: {
        flexDirection: 'row',
        marginTop: vs(15),
        padding: s(16),
        backgroundColor: '#fff',
        borderRadius: s(20),
        alignItems: 'flex-start',
        gap: s(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoIconContainer: {
        backgroundColor: COLORS.primary + '10',
        padding: s(10),
        borderRadius: s(14),
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: vs(3),
    },
    infoText: {
        fontSize: rf(12),
        color: COLORS.textLight,
        lineHeight: rf(18),
        fontWeight: '400',
    },
});
