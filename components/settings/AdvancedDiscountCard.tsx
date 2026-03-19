import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    purple: '#6D28D9',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface AdvancedDiscountCardProps {
    user: any;
    onPress: () => void;
    onLoginRequired: () => void;
}

export const AdvancedDiscountCard: React.FC<AdvancedDiscountCardProps> = ({
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
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.purple + "15" }]}>
                    <Ionicons name="gift-outline" size={rf(22)} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.infoTitle, { marginBottom: 0 }]}>Advanced Loyalty Discounts</Text>
                    <Text style={styles.infoText} numberOfLines={1}>Repeat customer rewards and custom rules.</Text>
                </View>
                <Ionicons name="chevron-forward" size={rf(20)} color={COLORS.textLight} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: s(20),
        padding: s(16),
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(109, 40, 217, 0.05)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: s(8),
        borderRadius: s(12),
        marginRight: s(15),
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
