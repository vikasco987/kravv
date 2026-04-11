import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MainPrinterView from "../../components/printer/MainPrinterView";

export default function PrinterScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <MainPrinterView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
