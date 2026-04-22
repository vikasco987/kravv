import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import KotAccessWrapper from "../../components/menu/KotAccessWrapper";

export default function KotScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <KotAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
