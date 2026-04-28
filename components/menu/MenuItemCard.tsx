import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const THEME_SECONDARY = "#10B981";
const THEME_DANGER = "#DC2626";
const COLOR_BG_DARK = "#FFFFFF";

interface MenuItem {
    id: string;
    name: string;
    price?: number;
    imageUrl?: string;
    unit?: string;
}

interface MenuItemCardProps {
    item: MenuItem;
    itemWidth: number;
    quantity: number;
    onAdd: (item: MenuItem) => void;
    onRemove: (item: MenuItem) => void;
}

export const MenuItemCard = React.memo(({
    item,
    itemWidth,
    quantity,
    onAdd,
    onRemove,
}: MenuItemCardProps) => {
    return (
        <View style={[styles.gridItem, { width: itemWidth }]}>
            <TouchableOpacity 
                onPress={() => onAdd(item)} 
                activeOpacity={0.7} 
                style={{ width: "100%", alignItems: "center" }}
            >
                <View>
                    <Image
                        source={{ uri: item.imageUrl?.startsWith("http") ? item.imageUrl : "https://via.placeholder.com/80?text=No+Image" }}
                        style={[styles.itemImage, { width: itemWidth - s(12), height: itemWidth - s(12) }]}
                        resizeMode="cover"
                        fadeDuration={0}
                    />
                    {quantity > 0 && (
                        <TouchableOpacity 
                            style={styles.minusIcon} 
                            onPress={(e) => {
                                e.stopPropagation();
                                onRemove(item);
                            }}
                            activeOpacity={0.6}
                        >
                            <Feather name="minus" size={12} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.bottomRow}>
                    <Text style={styles.itemPrice}>₹{item.price ?? "0"}</Text>
                    {quantity > 0 && (
                        <View style={styles.quantityBox}>
                            <Text style={styles.quantityText}>{quantity}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    gridItem: {
        backgroundColor: COLOR_BG_DARK,
        borderRadius: s(10),
        padding: s(6),
        margin: s(4),
        alignItems: "center",
        elevation: 2
    },
    itemImage: {
        borderRadius: s(8),
        marginBottom: vs(4)
    },
    minusIcon: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: THEME_DANGER,
        borderRadius: s(10),
        padding: s(2),
        zIndex: 10
    },
    itemName: {
        fontSize: rf(13),
        fontWeight: "600",
        textAlign: "center",
        color: "#111",
        marginBottom: vs(2)
    },
    bottomRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: vs(4)
    },
    itemPrice: {
        fontSize: rf(11),
        color: THEME_DANGER,
        fontWeight: "bold"
    },
    quantityBox: {
        backgroundColor: THEME_SECONDARY,
        paddingHorizontal: s(6),
        paddingVertical: vs(2),
        borderRadius: s(6)
    },
    quantityText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: rf(10)
    },
});
