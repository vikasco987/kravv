import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MainOrdersView from "../../components/orders/MainOrdersView";

export default function OrderScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <MainOrdersView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
