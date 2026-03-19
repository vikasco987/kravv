import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface QuickAddItemCardProps {
    itemWidth: number;
    onPress: () => void;
}

export const QuickAddItemCard: React.FC<QuickAddItemCardProps> = ({
    itemWidth,
    onPress,
}) => {
    return (
        <View style={[styles.gridItem, { width: itemWidth }]}>
            <TouchableOpacity 
                onPress={onPress} 
                activeOpacity={0.7} 
                style={styles.cardContent}
            >
                <View style={styles.plusContainer}>
                    <Feather name="plus" size={rf(20)} color="#4F46E5" />
                </View>
                <Text style={styles.addText}>Add Item</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    gridItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: s(10),
        margin: s(4),
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderStyle: "dashed",
        height: vs(120), // Height matching MenuItemCard
        justifyContent: "center",
        alignItems: "center",
    },
    cardContent: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    plusContainer: {
        marginBottom: vs(8),
    },
    addText: {
        fontSize: rf(12),
        fontWeight: "500",
        color: "#6B7280",
    },
});
