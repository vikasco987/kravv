import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";

const COLORS = {
    primary: '#4F46E5',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface LanguageCardProps {
    user: any;
    onLanguagePress: () => void;
    onLoginRequired: () => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
    user,
    onLanguagePress,
    onLoginRequired,
}) => {
    const { t } = useLanguage();

    const handleLanguagePress = () => {
        if (user) {
            onLanguagePress();
        } else {
            onLoginRequired();
        }
    };

    return (
        <View style={{ marginTop: vs(12) }}>
            <View style={{ marginTop: 0 }}>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={handleLanguagePress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.primary + "15" }]}>
                            <Ionicons name={"language-outline" as any} size={rf(20)} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoTitle, { marginBottom: 0 }]}>{t('select_language')}</Text>
                            <Text style={styles.infoText} numberOfLines={1}>{t('change_language_desc')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={rf(18)} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
