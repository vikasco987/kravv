import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface SettingsHeaderProps {
    title: string;
    subtitle: string;
}

const LOCAL_COLORS = {
    text: '#111827',
    textLight: '#6B7280',
};

const SettingsHeader = ({ title, subtitle }: SettingsHeaderProps) => {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: vs(15),
        paddingHorizontal: s(10),
    },
    title: {
        fontSize: rf(28),
        fontWeight: '800',
        color: LOCAL_COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: rf(14),
        color: LOCAL_COLORS.textLight,
        marginTop: vs(4),
        fontWeight: '500',
    },
});

export default SettingsHeader;
