import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface ClearCartModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    showSuccess: boolean;
}

export const ClearCartModal: React.FC<ClearCartModalProps> = ({
    visible,
    onClose,
    onConfirm,
    showSuccess,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlayCentered}>
                <View style={styles.modalContentCentered}>
                    {!showSuccess ? (
                        <>
                            <View style={[styles.trashCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Ionicons name="trash-outline" size={40} color="#EF4444" />
                            </View>
                            <Text style={styles.successTitleText}>Clear Cart?</Text>
                            <Text style={styles.successDetailText}>Are you sure you want to remove all items from the cart? This cannot be undone.</Text>

                            <View style={{ flexDirection: 'row', marginTop: 25, width: '100%' }}>
                                <TouchableOpacity
                                    style={styles.confirmCancelBtn}
                                    onPress={onClose}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmDeleteBtn}
                                    onPress={onConfirm}
                                >
                                    <Text style={[styles.confirmHoldText, { fontSize: rf(16) }]}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Ionicons name="trash-bin-outline" size={40} color="#EF4444" />
                            </View>
                            <Text style={[styles.successTitleText, { color: '#EF4444' }]}>Cleared!</Text>
                            <Text style={styles.successDetailText}>Cart has been cleared successfully.</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: s(20),
        marginLeft: s(65),
    },
    modalContentCentered: {
        backgroundColor: '#fff',
        borderRadius: s(32),
        padding: s(24),
        width: '100%',
    },
    trashCircle: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
        borderWidth: 2,
        alignSelf: 'center',
    },
    successTitleText: {
        fontSize: rf(24),
        fontWeight: 'bold',
        marginBottom: vs(8),
        textAlign: 'center',
    },
    successDetailText: {
        fontSize: rf(16),
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: rf(22),
    },
    confirmCancelBtn: {
        flex: 1,
        padding: s(16),
        backgroundColor: '#F3F4F6',
        borderRadius: s(20),
        marginRight: s(8),
        alignItems: 'center',
    },
    confirmDeleteBtn: {
        flex: 1,
        padding: s(16),
        backgroundColor: '#EF4444',
        borderRadius: s(20),
        marginLeft: s(8),
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#4B5563',
        fontSize: rf(18),
        fontWeight: '600',
    },
    confirmHoldText: {
        color: '#FFF',
        fontSize: rf(18),
        fontWeight: 'bold',
    },
    successCircle: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
        borderWidth: 1,
        alignSelf: 'center',
    },
});
