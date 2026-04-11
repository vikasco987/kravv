import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';

interface NetworkErrorModalProps {
    visible: boolean;
    onClose: () => void;
}

const NetworkErrorModal = ({ visible, onClose }: NetworkErrorModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="cloud-offline-outline" size={rf(45)} color="#EF4444" />
                    </View>
                    
                    <Text style={styles.title}>Connectivity Lost</Text>
                    <Text style={styles.message}>
                        Oops! It seems your internet connection is unstable or turned off. Please check your data or Wi-Fi settings to continue.
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>GOT IT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: s(20),
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: s(24),
        padding: s(25),
        width: '100%',
        maxWidth: s(320),
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    iconCircle: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
    },
    title: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111827',
        marginBottom: vs(10),
    },
    message: {
        fontSize: rf(14),
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: rf(20),
        marginBottom: vs(25),
    },
    button: {
        backgroundColor: '#111827',
        paddingHorizontal: s(40),
        paddingVertical: vs(12),
        borderRadius: s(12),
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: rf(14),
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});

export default NetworkErrorModal;
