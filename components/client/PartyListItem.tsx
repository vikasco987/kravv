import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface Party {
    id: string;
    name: string;
    phone: string;
    balance?: number;
    isFavorite?: boolean;
}

interface PartyListItemProps {
    item: Party;
    lifetimeSpend: number;
    onSelect: (party: Party) => void;
    t: (key: string) => string;
}

const THEME_PRIMARY = "#4F46E5";

const PartyListItem = ({ item, lifetimeSpend, onSelect, t }: PartyListItemProps) => {
    return (
        <TouchableOpacity style={styles.partyRow} onPress={() => onSelect(item)}>
            <View style={styles.partyInfo}>
                <Text style={styles.partyName} numberOfLines={1}>
                    {item.name || t('no_items')}
                </Text>
                <Text style={styles.partyPhone}>{item.phone}</Text>
                <Text style={styles.billingType}>Lifetime Sales: ₹{lifetimeSpend.toFixed(2)}</Text>
            </View>

            <View style={styles.iconGroup}>
                <View style={styles.balanceIndicator}>
                    <Text style={styles.balanceText}>₹{(item.balance || 0).toFixed(2)}</Text>
                </View>
                <Ionicons name="call-outline" size={rf(20)} color="#FFD700" style={styles.icon} />
                <Ionicons name="logo-whatsapp" size={rf(20)} color="#25D366" style={styles.icon} />
                <Ionicons
                    name={item.isFavorite ? "star" : "star-outline"}
                    size={rf(20)}
                    color="#FFC107"
                    style={styles.icon}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    partyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: s(15),
        borderRadius: s(12),
        marginVertical: vs(6),
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    partyInfo: { flex: 1 },
    partyName: { fontSize: rf(18), fontWeight: "bold", color: "#1F2937", marginBottom: vs(2) },
    partyPhone: { fontSize: rf(14), color: "#6B7280" },
    billingType: { fontSize: rf(12), color: "#9CA3AF", marginTop: vs(4) },
    iconGroup: { flexDirection: "row", alignItems: "center", paddingLeft: s(10) },
    icon: { marginLeft: s(8) },
    balanceIndicator: {
        paddingHorizontal: s(8),
        paddingVertical: vs(4),
        borderRadius: s(8),
        backgroundColor: "#EEF2FF",
        marginRight: s(10),
    },
    balanceText: { fontSize: rf(13), fontWeight: "bold", color: THEME_PRIMARY },
});

export default PartyListItem;
