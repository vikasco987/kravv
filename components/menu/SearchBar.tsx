import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    onSearchChange,
    onClear,
}) => {
    return (
        <View style={styles.searchSection}>
            <View style={styles.searchBarContainer}>
                <Feather name="search" size={rf(20)} color="#4B5563" style={{ marginLeft: s(12) }} />
                <TextInput
                    placeholder="Search name, category, or price..."
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery !== "" && (
                    <TouchableOpacity onPress={onClear} style={{ padding: s(10) }}>
                        <Ionicons name="close-circle" size={rf(20)} color="#4B5563" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    searchSection: {
        paddingHorizontal: s(15),
        paddingVertical: vs(5)
    },
    searchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: s(25),
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        height: vs(50),
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: s(12),
        fontSize: rf(16),
        color: "#000000",
        fontWeight: "500",
        height: "100%",
    },
});
