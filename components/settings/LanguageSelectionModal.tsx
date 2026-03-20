import React from 'react';
import { Modal, View, Pressable, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";

const COLORS = {
    primary: '#4F46E5',
    secondary: '#10B981',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface Language {
    id: string;
    name: string;
    nativeName: string;
    icon: string;
}

const LANGUAGES: Language[] = [
    { id: 'en', name: 'English', nativeName: 'English', icon: '🇺🇸' },
    { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳' },
    { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', icon: '🌾' },
    { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '💎' },
    { id: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: '🚩' },
    { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🕉️' },
    { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🐘' },
];

interface LanguageSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    currentLanguage: string;
    onSelectLanguage: (langId: string) => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
    visible,
    onClose,
    currentLanguage,
    onSelectLanguage,
}) => {
    const { t } = useLanguage();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.bottomSheetOverlay}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                <View style={styles.bottomSheetContent}>
                    <View style={styles.bottomSheetHandle} />

                    <View style={styles.bottomSheetHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
                            <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.primary + "15", marginRight: 0 }]}>
                                <Ionicons name="language-outline" size={rf(24)} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.bottomSheetTitle}>{t('select_language')}</Text>
                                <Text style={styles.settingSubLabel}>Choose your preferred language</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.id}
                                style={[
                                    styles.languageCard,
                                    currentLanguage === lang.id && styles.languageCardActive
                                ]}
                                onPress={() => {
                                    onSelectLanguage(lang.id);
                                    onClose();
                                }}
                            >
                                <View style={styles.languageIconContainer}>
                                    <Text style={{ fontSize: rf(22) }}>{lang.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.languageName}>{lang.name}</Text>
                                    <Text style={styles.nativeLanguageName}>{lang.nativeName}</Text>
                                </View>
                                {currentLanguage === lang.id && (
                                    <Ionicons name="checkmark-circle" size={rf(24)} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity 
                            style={styles.closeBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.closeBtnText}>{t('done')}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetContent: {
        height: '70%',
        backgroundColor: COLORS.card,
        borderTopLeftRadius: s(40),
        borderTopRightRadius: s(40),
        paddingTop: vs(15),
        paddingHorizontal: s(25),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    bottomSheetHandle: {
        width: s(50),
        height: vs(5),
        backgroundColor: '#E5E7EB',
        borderRadius: s(10),
        alignSelf: 'center',
        marginBottom: vs(15),
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: vs(25),
    },
    bottomSheetTitle: {
        fontSize: rf(22),
        fontWeight: '800',
        color: COLORS.text,
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: s(8),
        borderRadius: s(12),
        marginRight: s(15),
    },
    settingSubLabel: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
    },
    languageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(14),
        backgroundColor: COLORS.background,
        borderRadius: s(18),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: vs(12),
        gap: s(12),
    },
    languageCardActive: {
        borderColor: COLORS.primary + '40',
        backgroundColor: COLORS.primary + '05',
    },
    languageIconContainer: {
        width: s(44),
        height: s(44),
        borderRadius: s(12),
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    languageName: {
        fontSize: rf(16),
        fontWeight: '700',
        color: COLORS.text,
    },
    nativeLanguageName: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
    },
    closeBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: vs(14),
        borderRadius: s(15),
        alignItems: 'center',
        marginTop: vs(15),
    },
    closeBtnText: {
        color: COLORS.white,
        fontSize: rf(16),
        fontWeight: '700',
    },
});
