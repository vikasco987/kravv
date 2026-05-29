import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MenuAccessWrapper from "../../components/menu/MenuAccessWrapper";

export default function MenuScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <MenuAccessWrapper />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#6D28D9',
    }
});
