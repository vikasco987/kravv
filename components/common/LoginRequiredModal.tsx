import React from 'react';
import { Modal, View, Pressable, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    primary: '#4F46E5',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
};

interface LoginRequiredModalProps {
    visible: boolean;
    onClose: () => void;
    onSignIn: () => void;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
    visible,
    onClose,
    onSignIn,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.modalOverlay} onPress={onClose} />
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <LinearGradient
                            colors={[COLORS.primary, "#6366F1"]}
                            style={styles.modalIconGradient}
                        >
                            <Ionicons name="lock-closed-outline" size={rf(32)} color={COLORS.white} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.modalTitle}>Authentication Required</Text>
                    <Text style={styles.modalMessage}>
                        Please sign in to access your business profile and manage your records securely.
                    </Text>
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalPrimaryButton]}
                            onPress={onSignIn}
                        >
                            <Text style={styles.modalPrimaryButtonText}>Sign In Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalSecondaryButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.card,
        borderRadius: s(32),
        padding: s(30),
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    modalIconContainer: {
        marginBottom: vs(20),
    },
    modalIconGradient: {
        width: s(70),
        height: s(70),
        borderRadius: s(35),
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: rf(22),
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: vs(12),
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: rf(16),
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: rf(24),
        marginBottom: vs(25),
        paddingHorizontal: s(10),
    },
    modalButtonContainer: {
        width: '100%',
        gap: vs(12),
    },
    modalButton: {
        width: '100%',
        paddingVertical: vs(16),
        borderRadius: s(18),
        alignItems: 'center',
    },
    modalPrimaryButton: {
        backgroundColor: COLORS.primary,
    },
    modalPrimaryButtonText: {
        color: COLORS.white,
        fontSize: rf(16),
        fontWeight: '700',
    },
    modalSecondaryButton: {
        backgroundColor: 'transparent',
    },
    modalSecondaryButtonText: {
        color: COLORS.textLight,
        fontSize: rf(15),
        fontWeight: '600',
    },
});
