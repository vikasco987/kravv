import { LinearGradient } from 'expo-linear-gradient';
import { Plus, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Animated, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface CreateTableModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    tableName: string;
    onTableNameChange: (text: string) => void;
    title: string;
    placeholder: string;
    cancelText: string;
    createText: string;
    isSubmitting?: boolean;
}

const THEME_PRIMARY = "#2563EB"; // Blue accent

const CreateTableModal = ({
    visible,
    onClose,
    onSave,
    tableName,
    onTableNameChange,
    title,
    placeholder,
    cancelText,
    createText,
    isSubmitting = false
}: CreateTableModalProps) => {
    // Add a simple fade animation for the modal content
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
                <Animated.View style={[styles.modalContentWrapper, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>

                    <LinearGradient
                        colors={['#93C5FD', '#6EE7B7']} // Slightly darker Blue to slightly darker Green
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBackground}
                    >
                        {/* Header with Title and Close Button */}
                        <View style={styles.headerContainer}>
                            <View style={styles.titleWrapper}>
                                <View style={styles.iconContainer}>
                                    <Plus size={s(20)} color={THEME_PRIMARY} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.modalTitle}>{title}</Text>
                            </View>
                            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                                <X size={s(22)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Input Area */}
                        <Text style={styles.inputLabel}>Table Name</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder={placeholder}
                                placeholderTextColor="#9CA3AF"
                                value={tableName}
                                onChangeText={onTableNameChange}
                                autoFocus={true}
                            />
                        </View>

                        {/* Footer Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>{cancelText}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveBtn,
                                    (!tableName.trim() || isSubmitting) ? styles.saveBtnDisabled : null
                                ]}
                                onPress={onSave}
                                disabled={!tableName.trim() || isSubmitting}
                                activeOpacity={0.8}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>{createText}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
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
        alignItems: 'center'
    },
    modalContentWrapper: {
        width: '85%',
        borderRadius: s(24),
        backgroundColor: 'transparent',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 10 }
        })
    },
    gradientBackground: {
        padding: s(24),
        borderRadius: s(24),
        width: '100%',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(24),
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(12),
    },
    iconContainer: {
        width: s(36),
        height: s(36),
        borderRadius: s(12),
        backgroundColor: 'rgba(37, 99, 235, 0.1)', // Light blue tint
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: rf(19),
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    closeIconBtn: {
        padding: s(4),
        borderRadius: s(20),
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    inputLabel: {
        fontSize: rf(13),
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: vs(8),
        marginLeft: s(4),
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(16),
        backgroundColor: '#ffffff',
        marginBottom: vs(28),
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        paddingVertical: vs(14),
        paddingHorizontal: s(16),
        fontSize: rf(15),
        color: '#111827',
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: s(12)
    },
    cancelBtn: {
        paddingVertical: vs(12),
        paddingHorizontal: s(20),
        borderRadius: s(14),
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    cancelBtnText: {
        color: '#4B5563',
        fontSize: rf(14),
        fontWeight: '600'
    },
    saveBtn: {
        backgroundColor: THEME_PRIMARY,
        paddingVertical: vs(12),
        paddingHorizontal: s(24),
        borderRadius: s(14),
        ...Platform.select({
            ios: { shadowColor: THEME_PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 4 }
        })
    },
    saveBtnDisabled: {
        backgroundColor: '#93C5FD',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: rf(14),
        letterSpacing: 0.3,
    },
});

export default CreateTableModal;
