import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import OrderAccessWrapper from "../../components/orders/OrderAccessWrapper";

export default function OrderScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <OrderAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
