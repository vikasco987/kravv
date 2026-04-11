import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
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
}

const THEME_PRIMARY = "#4F46E5";

const CreateTableModal = ({
    visible,
    onClose,
    onSave,
    tableName,
    onTableNameChange,
    title,
    placeholder,
    cancelText,
    createText
}: CreateTableModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        value={tableName}
                        onChangeText={onTableNameChange}
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelBtnText}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={onSave}
                        >
                            <Text style={styles.saveBtnText}>{createText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', padding: s(25), borderRadius: s(30), elevation: 10 },
    modalTitle: { fontSize: rf(20), fontWeight: 'bold', marginBottom: vs(20), color: '#111827' },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(15),
        padding: s(15),
        marginBottom: vs(25),
        fontSize: rf(16),
        color: '#111827',
        backgroundColor: '#F9FAFB'
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: s(15) },
    cancelBtn: { padding: s(10) },
    cancelBtnText: { color: '#6B7280', fontSize: rf(15), fontWeight: '600' },
    saveBtn: { backgroundColor: THEME_PRIMARY, paddingVertical: vs(12), paddingHorizontal: s(25), borderRadius: s(15) },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(15) },
});

export default CreateTableModal;
