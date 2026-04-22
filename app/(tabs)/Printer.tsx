import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import PrinterAccessWrapper from "../../components/printer/PrinterAccessWrapper";

export default function PrinterScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <PrinterAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
