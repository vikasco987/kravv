import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { rf, s, vs } from "../../utils/responsive";

const PrinterHeader = () => {
    return (
        <LinearGradient colors={["#4F46E5", "#818CF8"]} style={styles.header}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Printer Setup</Text>
                <Text style={styles.headerSubtitle}>Connect your Bluetooth Thermal Printer</Text>
            </View>
            <Ionicons name="print-outline" size={rf(40)} color="#fff" style={styles.headerIcon} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: vs(20),
        paddingBottom: vs(55),
        paddingHorizontal: s(25),
        borderBottomLeftRadius: s(30),
        borderBottomRightRadius: s(30),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 8,
    },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: rf(28), fontWeight: "bold", color: "#fff" },
    headerSubtitle: { fontSize: rf(14), color: "rgba(255,255,255,0.8)", marginTop: vs(4) },
    headerIcon: { opacity: 0.9 },
});

export default PrinterHeader;
