import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import ClientAccessWrapper from "../../components/client/ClientAccessWrapper";

export default function CustomersScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ClientAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
});
