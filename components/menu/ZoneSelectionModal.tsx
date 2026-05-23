import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

interface ZoneSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    availableZones: string[];
    selectedZone: string;
    onSelectZone: (zone: string) => void;
}

export const ZoneSelectionModal: React.FC<ZoneSelectionModalProps> = ({
    visible,
    onClose,
    availableZones,
    selectedZone,
    onSelectZone,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalOverlayClose} onPress={onClose} activeOpacity={1} />
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Menu Zone</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={rf(20)} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={availableZones}
                        keyExtractor={(item) => item}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        renderItem={({ item }) => {
                            const isSelected = item === selectedZone;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.zoneItem,
                                        isSelected && styles.zoneItemSelected
                                    ]}
                                    onPress={() => onSelectZone(item)}
                                >
                                    <View style={styles.zoneInfo}>
                                        <Ionicons
                                            name={item === "Global" ? "earth-outline" : "location-outline"}
                                            size={rf(18)}
                                            color={isSelected ? "#10B981" : "#6B7280"}
                                        />
                                        <Text style={[
                                            styles.zoneName,
                                            isSelected && styles.zoneNameSelected
                                        ]}>
                                            {item}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={rf(20)} color="#10B981" />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalOverlayClose: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: s(24),
        borderTopRightRadius: s(24),
        maxHeight: '70%',
        paddingBottom: vs(45),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: s(20),
        paddingVertical: vs(20),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: rf(16),
        fontWeight: '700',
        color: '#111827',
    },
    closeBtn: {
        padding: s(4),
        backgroundColor: '#F3F4F6',
        borderRadius: s(20),
    },
    listContainer: {
        paddingHorizontal: s(20),
        paddingTop: vs(10),
    },
    zoneItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vs(14),
        paddingHorizontal: s(16),
        backgroundColor: '#F9FAFB',
        borderRadius: s(12),
        marginBottom: vs(10),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    zoneItemSelected: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    zoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(10),
    },
    zoneName: {
        fontSize: rf(15),
        color: '#374151',
        fontWeight: '500',
    },
    zoneNameSelected: {
        color: '#065F46',
        fontWeight: '700',
    },
});
