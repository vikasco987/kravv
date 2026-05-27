import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface DeleteConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
}

const DeleteConfirmModal = ({
    visible,
    onClose,
    onConfirm,
    title = "Delete Table",
    message = "Are you sure you want to delete this table? This action cannot be undone."
}: DeleteConfirmModalProps) => {
    const [fadeAnim] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View style={[
                    styles.modalContent,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
                    }
                ]}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Trash2 size={s(24)} color="#EF4444" strokeWidth={2.5} />
                        </View>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm} activeOpacity={0.8}>
                            <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '75%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: s(24),
        padding: s(24),
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 10 }
        })
    },
    iconContainer: {
        marginBottom: vs(16),
    },
    iconBackground: {
        width: s(56),
        height: s(56),
        borderRadius: s(28),
        backgroundColor: '#FEE2E2', // Light red background
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: rf(18),
        fontWeight: '700',
        color: '#111827',
        marginBottom: vs(8),
        textAlign: 'center',
    },
    message: {
        fontSize: rf(13),
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: vs(20),
        marginBottom: vs(24),
        paddingHorizontal: s(8),
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: s(12),
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: vs(12),
        borderRadius: s(12),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#4B5563',
        fontSize: rf(14),
        fontWeight: '600',
    },
    deleteBtn: {
        flex: 1,
        paddingVertical: vs(12),
        borderRadius: s(12),
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 4 }
        })
    },
    deleteBtnText: {
        color: '#FFFFFF',
        fontSize: rf(14),
        fontWeight: '700',
    }
});

export default DeleteConfirmModal;
