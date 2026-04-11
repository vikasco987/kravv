import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface DeviceCardProps {
    name: string;
    address: string;
    bonded: boolean;
    isConnected: boolean;
    onConnect: () => void;
    onForget: () => void;
}

const DeviceCard = ({ name, address, bonded, isConnected, onConnect, onForget }: DeviceCardProps) => {
    return (
        <View
            style={[
                styles.deviceCard,
                isConnected && styles.activeDevice
            ]}
        >
            <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(12) }}
                onPress={onConnect}
            >
                <View style={styles.deviceIconBox}>
                    <Ionicons
                        name={isConnected ? "checkmark-circle" : "bluetooth"}
                        size={rf(24)}
                        color={isConnected ? "#10B981" : "#4F46E5"}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                        <Text style={styles.deviceName}>{name || "Unknown Printer"}</Text>
                        {!bonded && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.deviceAddress}>{address}</Text>
                </View>
                {isConnected && <Text style={styles.connectedStatus}>Connected</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.forgetBtn}
                onPress={onForget}
            >
                <Ionicons name="trash-outline" size={rf(16)} color="#EF4444" />
                <Text style={styles.forgetBtnText}>Forget</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: s(16),
        padding: s(16),
        marginBottom: vs(12),
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeDevice: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    deviceIconBox: {
        width: s(45),
        height: s(45),
        borderRadius: s(12),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceName: { fontSize: rf(16), fontWeight: "600", color: "#111827" },
    deviceAddress: { fontSize: rf(12), color: "#6B7280", marginTop: vs(2) },
    connectedStatus: { fontSize: rf(12), color: "#10B981", fontWeight: "bold" },
    forgetBtn: {
        paddingHorizontal: s(8),
        paddingVertical: vs(5),
        backgroundColor: '#FEE2E2',
        borderRadius: s(8),
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(4),
    },
    forgetBtnText: {
        color: '#EF4444',
        fontSize: rf(10),
        fontWeight: 'bold',
    },
    newBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: s(6),
        paddingVertical: vs(2),
        borderRadius: s(4),
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    newBadgeText: {
        fontSize: rf(8),
        color: '#4F46E5',
        fontWeight: 'bold',
    },
});

export default DeviceCard;
