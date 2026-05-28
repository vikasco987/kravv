import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    primary: '#4F46E5',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface MenuGridModalProps {
    visible: boolean;
    onClose: () => void;
    menuGridEnabled: boolean;
    setMenuGridEnabled: (val: boolean) => void;
    onSave: (key: string, value: string | boolean, label: string) => void;
}

export const MenuGridModal: React.FC<MenuGridModalProps> = ({
    visible,
    onClose,
    menuGridEnabled,
    setMenuGridEnabled,
    onSave,
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
                            <View style={[styles.buttonIconBackground, { backgroundColor: "#10B98115", marginRight: 0 }]}>
                                <Ionicons name="grid-outline" size={rf(24)} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.bottomSheetTitle}>Menu Grid</Text>
                                <Text style={styles.settingSubLabel}>Manage your menu layout preferences</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
                        {/* Auto Accept Toggle */}
                        <View style={[styles.featureCard, menuGridEnabled && styles.featureCardActive]}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name="apps-outline" size={rf(22)} color={menuGridEnabled ? COLORS.primary : COLORS.textLight} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Menu Grid View</Text>
                                <Text style={styles.settingSubLabel}>When ON, your menu will be displayed in a grid layout</Text>
                            </View>
                            <Switch
                                value={menuGridEnabled}
                                onValueChange={(val) => {
                                    setMenuGridEnabled(val);
                                    onSave("menu_grid_enabled", val, "Menu Grid");
                                }}
                                trackColor={{ false: "#E5E7EB", true: COLORS.primary + "80" }}
                                thumbColor={menuGridEnabled ? COLORS.primary : "#F4F3F4"}
                            />
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={rf(18)} color={COLORS.primary} />
                            <Text style={styles.infoText}>
                                Turning on Menu Grid gives you an alternative way to view items and categories.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.closeBtnText}>{t('done') || 'Done'}</Text>
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
        height: '50%',
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
    settingLabel: {
        fontSize: rf(16),
        fontWeight: '700',
        color: COLORS.text,
    },
    settingSubLabel: {
        fontSize: rf(12),
        color: COLORS.textLight,
        marginTop: vs(2),
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(14),
        backgroundColor: COLORS.background,
        borderRadius: s(18),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: s(12),
    },
    featureCardActive: {
        borderColor: COLORS.primary + '40',
        backgroundColor: COLORS.primary + '05',
    },
    featureIconContainer: {
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
    infoBox: {
        flexDirection: 'row',
        marginTop: vs(20),
        padding: s(14),
        backgroundColor: COLORS.primary + '10',
        borderRadius: s(14),
        alignItems: 'center',
        gap: s(10),
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
    },
    infoText: {
        flex: 1,
        fontSize: rf(12),
        color: COLORS.primary,
        fontWeight: '500',
        lineHeight: rf(17),
    },
    closeBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: vs(14),
        borderRadius: s(15),
        alignItems: 'center',
        marginTop: vs(25),
    },
    closeBtnText: {
        color: COLORS.white,
        fontSize: rf(16),
        fontWeight: '700',
    },
});
