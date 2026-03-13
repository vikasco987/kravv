import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    white: '#FFFFFF',
};

interface SuccessFeedbackProps {
    visible: boolean;
    message: string;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
    visible,
    message,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
        >
            <View style={styles.toastOverlay}>
                <LinearGradient
                    colors={["#10B981", "#059669"]}
                    style={styles.toastContent}
                >
                    <Ionicons name="checkmark-circle" size={rf(20)} color={COLORS.white} />
                    <Text style={styles.toastText}>{message}</Text>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    toastOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: vs(50),
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(20),
        paddingVertical: vs(12),
        borderRadius: s(30),
        gap: s(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    toastText: {
        color: COLORS.white,
        fontSize: rf(14),
        fontWeight: '700',
    },
});
