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

interface BusinessManagementCardProps {
    user: any;
    onPress: () => void;
    onLoginRequired: () => void;
}

export const BusinessManagementCard: React.FC<BusinessManagementCardProps> = ({
    user,
    onPress,
    onLoginRequired,
}) => {
    const handlePress = () => {
        if (user) {
            onPress();
        } else {
            onLoginRequired();
        }
    };

    return (
        <View style={[styles.card, { marginTop: vs(12) }]}>
            <Text style={[styles.infoTitle, { marginBottom: vs(10) }]}>Business Management</Text>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#E5E7EB", elevation: 0, shadowOpacity: 0 }]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.primary + "15" }]}>
                    <Ionicons name={"business-outline" as any} size={rf(22)} color={COLORS.primary} />
                </View>
                <Text style={[styles.buttonText, { color: COLORS.text, fontSize: rf(16) }]}>Business Profile</Text>
                <Ionicons name={"chevron-forward" as any} size={rf(20)} color={COLORS.textLight} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
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
    infoTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: vs(3),
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: s(20),
        borderRadius: s(15),
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: s(8),
        borderRadius: s(12),
        marginRight: s(15),
    },
    buttonText: {
        color: COLORS.text,
        fontSize: rf(16),
        fontWeight: '700',
    },
});
