import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";
const COLOR_BG_DARK = "#FFFFFF";
const CATEGORY_COLUMN_WIDTH = s(80);

interface Category {
    id: string;
    name: string;
}

interface CategorySidebarProps {
    categories: Category[];
    onCategoryPress: (category: Category, index: number) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
    categories,
    onCategoryPress,
}) => {
    return (
        <ScrollView style={styles.categoryColumn} showsVerticalScrollIndicator={false}>
            {categories.map((cat, index) => (
                <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryButton}
                    onPress={() => onCategoryPress(cat, index)}
                >
                    <Ionicons name="fast-food-outline" size={12} color="#fff" />
                    <Text style={styles.categoryText}>{cat.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    categoryColumn: {
        width: CATEGORY_COLUMN_WIDTH,
        backgroundColor: COLOR_BG_DARK,
        borderRightWidth: 1,
        borderColor: "#E5E7EB"
    },
    categoryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: vs(6),
        marginVertical: vs(3),
        backgroundColor: THEME_PRIMARY,
        borderRadius: s(8),
        marginHorizontal: s(4)
    },
    categoryText: {
        fontWeight: "600",
        color: "#fff",
        marginLeft: s(3),
        fontSize: rf(10),
        textAlign: 'center'
    },
});
