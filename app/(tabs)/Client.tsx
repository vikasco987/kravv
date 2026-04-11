import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MainClientView from "../../components/client/MainClientView";

export default function CustomersScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <MainClientView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
});
