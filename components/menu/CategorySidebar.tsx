import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

const getCategoryIcon = (name: string): any => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pizza')) return 'pizza';
    if (lowerName.includes('burger') || lowerName.includes('sandwich')) return 'hamburger';
    if (lowerName.includes('drink') || lowerName.includes('beverage') || lowerName.includes('juice') || lowerName.includes('shake')) return 'cup-water';
    if (lowerName.includes('dessert') || lowerName.includes('sweet') || lowerName.includes('ice') || lowerName.includes('cake')) return 'ice-cream';
    if (lowerName.includes('combo') || lowerName.includes('meal') || lowerName.includes('thali')) return 'food-variant';
    if (lowerName.includes('biryani') || lowerName.includes('rice') || lowerName.includes('pulao')) return 'pot-steam';
    if (lowerName.includes('roti') || lowerName.includes('bread') || lowerName.includes('naan') || lowerName.includes('parota') || lowerName.includes('chapathi')) return 'bread-slice-outline';
    if (lowerName.includes('chicken') || lowerName.includes('non') || lowerName.includes('mutton') || lowerName.includes('fish') || lowerName.includes('meat')) return 'food-drumstick';
    if (lowerName.includes('veg') || lowerName.includes('salad') || lowerName.includes('paneer')) return 'leaf';
    if (lowerName.includes('snack') || lowerName.includes('starter') || lowerName.includes('fries') || lowerName.includes('roll')) return 'french-fries';
    if (lowerName.includes('soup')) return 'bowl-mix';
    if (lowerName.includes('coffee') || lowerName.includes('tea') || lowerName.includes('chai')) return 'coffee';

    return 'silverware-fork-knife'; // fallback
};

const CATEGORY_COLUMN_WIDTH = s(85);
const THEME_PRIMARY = "#7C3AED";

interface Category {
    id: string;
    name: string;
}

interface CategorySidebarProps {
    categories: Category[];
    onCategoryPress: (category: Category, index: number) => void;
    cartVisible?: boolean;
    isListView?: boolean;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
    categories,
    onCategoryPress,
    cartVisible,
    isListView = false,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handlePress = (cat: Category, index: number) => {
        setActiveIndex(index);
        onCategoryPress(cat, index);
    };

    if (isListView) {
        return (
            <ScrollView
                style={[styles.categoryColumnList, cartVisible && { marginBottom: vs(210) }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: vs(20) }}
            >
                <View style={styles.rearrangeHeader}>
                    <Text style={styles.rearrangeText}>Long press to</Text>
                    <Text style={styles.rearrangeText}>rearrange</Text>
                </View>
                {categories.map((cat, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryButtonList,
                                isActive ? styles.categoryButtonListActive : null
                            ]}
                            onPress={() => handlePress(cat, index)}
                        >
                            <Text style={[
                                styles.categoryTextList,
                                isActive ? styles.categoryTextListActive : null
                            ]} numberOfLines={2}>{cat.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={[styles.categoryColumn, cartVisible && { marginBottom: vs(210) }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: vs(20) }}
        >
            {categories.map((cat, index) => (
                <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryButton}
                    onPress={() => handlePress(cat, index)}
                >
                    <MaterialCommunityIcons name={getCategoryIcon(cat.name)} size={rf(20)} color="#9CA3AF" />
                    <Text style={styles.categoryText} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    categoryColumn: {
        width: CATEGORY_COLUMN_WIDTH,
        backgroundColor: "#F9FAFB",
        borderRightWidth: 1,
        borderColor: "#E5E7EB"
    },
    categoryColumnList: {
        width: CATEGORY_COLUMN_WIDTH,
        backgroundColor: "#FFFFFF",
        borderRightWidth: 1,
        borderColor: "#E5E7EB"
    },
    rearrangeHeader: {
        paddingVertical: vs(12),
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
    },
    rearrangeText: {
        fontSize: rf(10),
        color: "#6B7280",
        textAlign: "center",
    },
    categoryButtonList: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingVertical: vs(16),
        paddingHorizontal: s(12),
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
    },
    categoryButtonListActive: {
        backgroundColor: THEME_PRIMARY,
    },
    categoryTextList: {
        fontWeight: "700",
        color: "#1F2937",
        fontSize: rf(12),
    },
    categoryTextListActive: {
        color: "#FFFFFF",
    },
    categoryButton: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: vs(12),
        paddingHorizontal: s(4),
        marginVertical: vs(5),
        backgroundColor: "#FFFFFF",
        borderRadius: s(12),
        marginHorizontal: s(6),
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    categoryText: {
        fontWeight: "600",
        color: "#4B5563",
        marginTop: vs(6),
        fontSize: rf(11),
        textAlign: 'center'
    },
});
