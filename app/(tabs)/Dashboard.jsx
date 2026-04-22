import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import DashboardAccessWrapper from "../../components/dashboard/DashboardAccessWrapper";

export default function SalesDashboard() {
    return (
        <SafeAreaView style={styles.container}>
            <DashboardAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
