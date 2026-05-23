import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

const PrinterHeader = () => {
    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Printer Setup</Text>
                <Text style={styles.headerSubtitle}>Connect your Bluetooth Thermal Printer</Text>
            </View>
            <Ionicons name="print-outline" size={rf(40)} color="#4F46E5" style={styles.headerIcon} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: vs(20),
        paddingBottom: vs(20),
        paddingHorizontal: s(20),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: rf(24), fontWeight: "bold", color: "#1F2937" },
    headerSubtitle: { fontSize: rf(14), color: "#6B7280", marginTop: vs(4) },
    headerIcon: { opacity: 0.9 },
});

export default PrinterHeader;
