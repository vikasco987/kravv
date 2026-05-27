import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

interface CustomToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error';
    onHide: () => void;
}

export const CustomToast = ({ visible, message, type = 'success', onHide }: CustomToastProps) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]).start(() => {
                    onHide();
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible, message]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]} pointerEvents="none">
            <LinearGradient
                colors={type === 'success' ? ['#3B82F6', '#10B981'] : ['#EF4444', '#991B1B']} // Blue to Green gradient for success
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {type === 'success' ? (
                    <CheckCircle2 color="#FFF" size={s(20)} style={styles.icon} />
                ) : (
                    <AlertCircle color="#FFF" size={s(20)} style={styles.icon} />
                )}
                <Text style={styles.message}>{message}</Text>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: vs(70), // Safe distance from the top header
        alignSelf: 'center',
        zIndex: 9999,
        elevation: 100,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: s(20),
        borderRadius: s(100),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    icon: {
        marginRight: s(10),
    },
    message: {
        color: '#FFFFFF',
        fontSize: rf(14),
        fontWeight: '700',
    }
});
