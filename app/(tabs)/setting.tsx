import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MainSettingsView from "../../components/settings/MainSettingsView";

export default function SettingScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <MainSettingsView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
