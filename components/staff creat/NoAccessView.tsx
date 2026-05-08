import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

export const NoAccessView = () => {
    const router = useRouter();

    const handleLogout = async () => {
        await AsyncStorage.removeItem('staff_session');
        router.replace('/(auth)/sign-in');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <View style={styles.illustrationContainer}>
                    <View style={styles.outerCircle}>
                        <View style={styles.innerCircle}>
                            <Ionicons name="lock-closed" size={rf(60)} color="#FF4B2B" />
                        </View>
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Access Restricted</Text>
                    <Text style={styles.description}>
                        Your staff account currently has no active permissions. You won&apos;t be able to access any restaurant modules until they are granted.
                    </Text>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={rf(18)} color="#64748b" />
                        <Text style={styles.infoText}>
                            Please contact your Restaurant Manager or Owner to update your access settings.
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={rf(20)} color="#fff" style={{ marginRight: s(10) }} />
                    <Text style={styles.logoutText}>Back to Login</Text>
                </TouchableOpacity>

                <Text style={styles.footerVersion}>Kravy Intelligence - Security Module v1.0</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: vs(10), marginHorizontal: s(15) },
    sectionTitle: { fontSize: rf(12), fontWeight: 'bold', color: '#64748B', marginLeft: s(18), marginBottom: vs(5), textTransform: 'uppercase' },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: s(30),
    },
    illustrationContainer: {
        marginBottom: vs(40),
    },
    outerCircle: {
        width: s(160),
        height: s(160),
        borderRadius: s(80),
        backgroundColor: 'rgba(255, 75, 43, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCircle: {
        width: s(120),
        height: s(120),
        borderRadius: s(60),
        backgroundColor: 'rgba(255, 75, 43, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 75, 43, 0.2)',
        borderStyle: 'dashed',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: vs(40),
    },
    title: {
        fontSize: rf(26),
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: vs(15),
    },
    description: {
        fontSize: rf(15),
        color: '#64748b',
        textAlign: 'center',
        lineHeight: vs(22),
        paddingHorizontal: s(10),
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: s(15),
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: vs(30),
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: rf(13),
        color: '#475569',
        marginLeft: s(10),
        lineHeight: vs(18),
    },
    logoutBtn: {
        backgroundColor: '#1e293b',
        flexDirection: 'row',
        paddingVertical: vs(16),
        paddingHorizontal: s(40),
        borderRadius: s(50),
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    logoutText: {
        color: '#fff',
        fontSize: rf(16),
        fontWeight: 'bold',
    },
    footerVersion: {
        position: 'absolute',
        bottom: vs(30),
        fontSize: rf(11),
        color: '#94a3b8',
        fontWeight: '500',
    }
});
