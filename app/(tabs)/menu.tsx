import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MainMenuView from "../../components/menu/MainMenuView";

export default function MenuScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <MainMenuView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
