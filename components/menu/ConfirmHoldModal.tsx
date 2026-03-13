import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";

interface ConfirmHoldModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    totalAmount: number;
    totalItems: number;
    showSuccess: boolean;
}

export const ConfirmHoldModal: React.FC<ConfirmHoldModalProps> = ({
    visible,
    onClose,
    onConfirm,
    totalAmount,
    totalItems,
    showSuccess,
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.bottomModalOverlay}>
                <View style={styles.bottomModalContent}>
                    <View style={styles.modalHandle} />
                    {!showSuccess ? (
                        <>
                            <View style={styles.holdCircle}>
                                <Ionicons name="pause" size={40} color={THEME_PRIMARY} />
                            </View>
                            <Text style={styles.bottomModalTitle}>Hold Order?</Text>
                            <Text style={styles.bottomModalSubtext}>
                                This will save the current items and let you create a new bill. You can resume this order later from the Hold list.
                            </Text>

                            <View style={styles.holdInfoBox}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.holdOrderText}>Current Order</Text>
                                    <Text style={styles.holdSummaryText}>{totalItems} items selected</Text>
                                </View>
                                <Text style={styles.holdTotalText}>₹{totalAmount.toFixed(0)}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.confirmHoldBtn}
                                onPress={onConfirm}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmHoldText}>Confirm Hold</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalCancelText}>Go Back</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <View style={styles.successCircle}>
                                <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" />
                            </View>
                            <Text style={styles.bottomModalTitle}>Order Held!</Text>
                            <Text style={styles.bottomModalSubtext}>Order has been safely moved to hold list.</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    bottomModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        marginLeft: s(65),
    },
    bottomModalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: s(32),
        borderTopRightRadius: s(32),
        padding: s(24),
        alignItems: 'center',
        paddingBottom: vs(40),
    },
    modalHandle: {
        width: s(40),
        height: vs(5),
        backgroundColor: '#E5E7EB',
        borderRadius: s(3),
        marginBottom: vs(20),
        alignSelf: 'center',
    },
    holdCircle: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    successCircle: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    bottomModalTitle: {
        fontSize: rf(24),
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: vs(12),
    },
    bottomModalSubtext: {
        fontSize: rf(16),
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: vs(24),
        lineHeight: rf(22),
        paddingHorizontal: s(10),
    },
    holdInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(20),
        padding: s(16),
        width: '100%',
        marginBottom: vs(24),
    },
    holdOrderText: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#111827',
    },
    holdSummaryText: {
        fontSize: rf(14),
        color: '#6B7280',
        marginTop: vs(4),
    },
    holdTotalText: {
        fontSize: rf(22),
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    confirmHoldBtn: {
        width: '100%',
        backgroundColor: '#4F46E5',
        paddingVertical: vs(18),
        borderRadius: s(20),
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(12),
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    confirmHoldText: {
        color: '#FFF',
        fontSize: rf(18),
        fontWeight: 'bold',
    },
    modalCancelBtn: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        paddingVertical: vs(18),
        borderRadius: s(20),
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#4B5563',
        fontSize: rf(18),
        fontWeight: '600',
    },
});
