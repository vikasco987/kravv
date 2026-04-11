import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MainDashboardView from "../../components/dashboard/MainDashboardView";

export default function SalesDashboard() {
    return (
        <SafeAreaView style={styles.container}>
            <MainDashboardView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
