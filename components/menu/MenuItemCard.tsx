import { Feather } from "@expo/vector-icons";
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";
import { SoundManager } from "../../utils/SoundManager";

const THEME_PRIMARY = "#7C3AED";
const THEME_PRIMARY_LIGHT = "#EDE9FE";

interface MenuItem {
    id: string;
    name: string;
    price?: number;
    imageUrl?: string;
    unit?: string;
    isVeg?: boolean;
    isEgg?: boolean;
}

interface MenuItemCardProps {
    item: MenuItem;
    itemWidth: number;
    quantity: number;
    onAdd: (item: MenuItem) => void;
    onRemove: (item: MenuItem) => void;
    isListView?: boolean;
}

export const MenuItemCard = React.memo(({
    item,
    itemWidth,
    quantity,
    onAdd,
    onRemove,
    isListView = false,
}: MenuItemCardProps) => {
    const isSelected = quantity > 0;

    // Determine dietary color
    const dietaryColor = item.isEgg ? '#EAB308' : item.isVeg === false ? '#EF4444' : '#10B981';

    if (isListView) {
        return (
            <View style={[
                styles.listItem,
                { width: itemWidth },
                isSelected ? styles.gridItemSelected : styles.gridItemUnselected
            ]}>
                <TouchableOpacity
                    onPress={() => onAdd(item)}
                    onPressIn={() => { SoundManager.suppressNextPlay(); SoundManager.playWebItem(); }}
                    activeOpacity={0.8}
                    style={styles.listCardContent}
                >
                    <View style={styles.listLeftContainer}>
                        <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.listUnitRow}>
                            <View style={[styles.dietarySquare, { borderColor: dietaryColor, width: s(10), height: s(10), marginRight: s(4) }]}>
                                <View style={[styles.dietaryDot, { backgroundColor: dietaryColor, width: s(4), height: s(4), borderRadius: s(2) }]} />
                            </View>
                            <Text style={styles.listItemUnit} numberOfLines={1}>{item.unit || "Plate"}</Text>
                        </View>
                    </View>

                    <View style={styles.listRightContainer}>
                        <Text style={styles.listItemPrice}>₹{item.price ?? "0"}</Text>
                    </View>

                    {isSelected && (
                        <TouchableOpacity
                            style={styles.listQuantityTag}
                            onPress={(e) => {
                                e.stopPropagation();
                                onRemove(item);
                            }}
                            onPressIn={(e) => { e.stopPropagation(); SoundManager.suppressNextPlay(); SoundManager.playRemove(); }}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.quantityTagText}>x{quantity}</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[
            styles.gridItem,
            { width: itemWidth },
            isSelected ? styles.gridItemSelected : styles.gridItemUnselected
        ]}>
            <TouchableOpacity
                onPress={() => onAdd(item)}
                onPressIn={() => { SoundManager.suppressNextPlay(); SoundManager.playWebItem(); }}
                activeOpacity={0.8}
                style={styles.cardContent}
            >
                <View style={styles.imageContainer}>
                    {item.imageUrl && item.imageUrl.startsWith("http") ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.itemImage}
                            resizeMode="cover"
                            fadeDuration={0}
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Feather name="image" size={rf(20)} color="#D1D5DB" />
                        </View>
                    )}

                    {/* Veg/Non-Veg/Egg Indicator */}
                    <View style={styles.dietaryContainer}>
                        <View style={[styles.dietarySquare, { borderColor: dietaryColor }]}>
                            <View style={[styles.dietaryDot, { backgroundColor: dietaryColor }]} />
                        </View>
                    </View>

                    {/* Quantity Tag / Remove Button */}
                    {isSelected && (
                        <TouchableOpacity
                            style={styles.quantityTag}
                            onPress={(e) => {
                                e.stopPropagation();
                                onRemove(item);
                            }}
                            onPressIn={(e) => { e.stopPropagation(); SoundManager.suppressNextPlay(); SoundManager.playRemove(); }}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.quantityTagText}>x{quantity}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.bottomRow}>
                        <Text style={styles.itemUnit} numberOfLines={1}>{item.unit || "Plate"}</Text>
                        <Text style={styles.itemPrice}>₹{item.price ?? "0"}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
});
MenuItemCard.displayName = "MenuItemCard";

const styles = StyleSheet.create({
    gridItem: {
        borderRadius: s(8),
        margin: s(4),
        borderWidth: 1,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
    },
    listItem: {
        borderRadius: s(8),
        marginHorizontal: s(4),
        marginVertical: vs(3),
        borderWidth: 1,
        backgroundColor: "#FFFFFF",
    },
    gridItemUnselected: {
        borderColor: "#E5E7EB",
    },
    gridItemSelected: {
        borderColor: THEME_PRIMARY,
        backgroundColor: THEME_PRIMARY_LIGHT,
    },
    cardContent: {
        flex: 1,
        width: "100%",
    },
    listCardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: s(12),
        minHeight: vs(60),
    },
    listLeftContainer: {
        flex: 1,
        justifyContent: "center",
    },
    listRightContainer: {
        justifyContent: "center",
        alignItems: "flex-end",
        paddingLeft: s(10),
    },
    listItemName: {
        fontSize: rf(13),
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: vs(4),
    },
    listUnitRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    listItemUnit: {
        fontSize: rf(10),
        color: "#6B7280",
    },
    listItemPrice: {
        fontSize: rf(14),
        color: "#111827",
        fontWeight: "800",
        marginTop: vs(12),
    },
    listQuantityTag: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: THEME_PRIMARY,
        borderBottomLeftRadius: s(8),
        borderTopRightRadius: s(8),
        paddingHorizontal: s(6),
        paddingVertical: vs(2),
        minWidth: s(24),
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    imageContainer: {
        width: "100%",
        height: vs(80), // Taller image to match screenshot proportions
        position: "relative",
    },
    itemImage: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dietaryContainer: {
        position: "absolute",
        top: s(4),
        right: s(4),
        backgroundColor: "#FFFFFF",
        borderRadius: s(4),
        padding: s(2),
    },
    dietarySquare: {
        width: s(12),
        height: s(12),
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: s(2),
    },
    dietaryDot: {
        width: s(6),
        height: s(6),
        borderRadius: s(3),
    },
    quantityTag: {
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: THEME_PRIMARY,
        borderBottomRightRadius: s(8),
        paddingHorizontal: s(6),
        paddingVertical: vs(2),
        minWidth: s(24),
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    quantityTagText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: rf(11),
    },
    textContainer: {
        padding: s(8),
        flex: 1,
        justifyContent: "space-between",
        minHeight: vs(60),
    },
    itemName: {
        fontSize: rf(12),
        fontWeight: "700",
        textAlign: "left",
        color: "#1F2937",
        lineHeight: rf(16),
        marginBottom: vs(12),
    },
    bottomRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    itemUnit: {
        fontSize: rf(10),
        color: "#6B7280",
        flex: 1,
        marginRight: s(4),
    },
    itemPrice: {
        fontSize: rf(13),
        color: "#111827",
        fontWeight: "800",
    },
});
