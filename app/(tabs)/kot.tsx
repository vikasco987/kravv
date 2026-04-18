import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import KotView from "../../components/menu/KotView";

export default function KotScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <KotView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
