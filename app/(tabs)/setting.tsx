import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import SettingAccessWrapper from "../../components/settings/SettingAccessWrapper";

export default function SettingScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <SettingAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
