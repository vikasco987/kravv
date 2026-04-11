import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface OrderHeaderProps {
    title: string;
    subtitle: string;
    addButtonText: string;
    onAddPress: () => void;
}

const THEME_PRIMARY = "#4F46E5";

const OrderHeader = ({ title, subtitle, addButtonText, onAddPress }: OrderHeaderProps) => {
    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity
                style={styles.addButton}
                onPress={onAddPress}
            >
                <Ionicons name="add" size={rf(22)} color="#fff" />
                <Text style={styles.addButtonText}>{addButtonText}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: s(20),
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingTop: vs(20)
    },
    headerTitle: { fontSize: rf(22), fontWeight: 'bold', color: '#111827' },
    headerSubtitle: { fontSize: rf(13), color: '#6B7280' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME_PRIMARY,
        paddingVertical: vs(10),
        paddingHorizontal: s(15),
        borderRadius: s(12),
        elevation: 3
    },
    addButtonText: { color: '#fff', marginLeft: s(5), fontWeight: '700', fontSize: rf(14) },
});

export default OrderHeader;
