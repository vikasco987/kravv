import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    secondary: '#10B981',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface AppFeaturesCardProps {
    onPress: () => void;
}

export const AppFeaturesCard: React.FC<AppFeaturesCardProps> = ({
    onPress,
}) => {
    return (
        <View style={{ marginTop: vs(15), paddingHorizontal: s(10) }}>
            <Text style={styles.sectionTitle}>App Features</Text>
            <View style={[styles.card, { marginTop: vs(10) }]}>
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={onPress}
                    activeOpacity={0.7}
                >
                    <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.secondary + "15" }]}>
                        <Ionicons name={"restaurant-outline" as any} size={rf(20)} color={COLORS.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoTitle, { marginBottom: 0 }]}>KOT & Tables</Text>
                        <Text style={styles.infoText} numberOfLines={1}>Kitchen Order Tickets, Table booking</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={rf(18)} color={COLORS.textLight} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        color: COLORS.text,
        opacity: 0.9,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: s(20),
        padding: s(16),
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.05)',
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
