import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface ClientHeaderProps {
    title: string;
    onRefresh: () => void;
}

const THEME_PRIMARY = "#4F46E5";

const ClientHeader = ({ title, onRefresh }: ClientHeaderProps) => {
    const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <View style={styles.headerBar}>
            <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.infoDate}>{today}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        padding: s(15),
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
        paddingTop: vs(20), // Reduced from 50 since it's inside MainClientView which is inside SafeAreaView
    },
    headerTitle: { fontSize: rf(20), fontWeight: "bold", color: "#1F2937" },
    infoDate: { fontSize: rf(13), color: "#6B7280" },
});

export default ClientHeader;
