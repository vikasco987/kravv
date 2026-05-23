import { Feather } from "@expo/vector-icons";
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";
import { SoundManager } from "../../utils/SoundManager";

const THEME_SECONDARY = "#10B981";
const THEME_DANGER = "#DC2626";
const COLOR_BG_DARK = "#FFFFFF";

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
                onPressIn={() => { SoundManager.suppressNextPlay(); SoundManager.playAdd(); }}
                activeOpacity={0.7}
                style={{ width: "100%", alignItems: "flex-start" }}
            >
                <View style={{ marginBottom: vs(6) }}>
                    <View style={[styles.dietaryMarkDot, {
                        backgroundColor: item.isEgg ? '#EAB308' : item.isVeg === false ? '#EF4444' : '#10B981',
                    }]} />
                </View>

                <View style={{ width: "100%", alignItems: "center", marginBottom: vs(8) }}>
                    {item.imageUrl && item.imageUrl.startsWith("http") ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={[styles.itemImage, { width: "100%", height: vs(60) }]}
                            resizeMode="cover"
                            fadeDuration={0}
                        />
                    ) : (
                        <View style={[styles.imagePlaceholder, { width: "100%", height: vs(60) }]}>
                            <Feather name="image" size={rf(20)} color="#D1D5DB" />
                        </View>
                    )}

                    {quantity > 0 && (
                        <TouchableOpacity
                            style={styles.minusIcon}
                            onPress={(e) => {
                                e.stopPropagation();
                                onRemove(item);
                            }}
                            onPressIn={(e) => { e.stopPropagation(); SoundManager.suppressNextPlay(); SoundManager.playRemove(); }}
                            activeOpacity={0.6}
                        >
                            <Feather name="minus" size={12} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.bottomRow}>
                    <Text style={styles.itemPrice}>₹{item.price ?? "0"}</Text>
                    {quantity > 0 ? (
                        <View style={styles.quantityPill}>
                            <Text style={styles.quantityText}>{quantity}</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyPill}></View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
});
MenuItemCard.displayName = "MenuItemCard";

const styles = StyleSheet.create({
    gridItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: s(12),
        padding: s(8),
        margin: s(4),
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    itemImage: {
        borderRadius: s(8),
    },
    imagePlaceholder: {
        backgroundColor: '#F3F4F6',
        borderRadius: s(8),
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: rf(12),
        fontWeight: "600",
        textAlign: "left",
        color: "#374151",
        lineHeight: rf(16),
        height: rf(32), // roughly 2 lines
    },
    bottomRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: vs(6)
    },
    itemPrice: {
        fontSize: rf(12),
        color: "#EA580C",
        fontWeight: "700"
    },
    emptyPill: {
        width: s(36),
        height: vs(18),
        borderRadius: s(10),
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    quantityPill: {
        width: s(36),
        height: vs(18),
        borderRadius: s(10),
        backgroundColor: "#4F46E5",
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: rf(10)
    },
    dietaryMarkDot: {
        width: s(8),
        height: s(8),
        borderRadius: s(4),
    },
});
