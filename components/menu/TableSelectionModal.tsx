import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";
import { useAuth } from "@clerk/clerk-expo";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEME_PRIMARY = "#4F46E5";

interface Table {
    id: string;
    name: string;
}

interface TableSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    selectedTable: string | null;
    onSelect: (tableName: string | null) => void;
}

export const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
    visible,
    onClose,
    selectedTable,
    onSelect,
}) => {
    const { getToken } = useAuth();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchTables();
        }
    }, [visible]);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const response = await fetch("https://billing.kravy.in/api/tables", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setTables(data || []);
            }
        } catch (error) {
            console.error("Fetch tables error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.bottomSheetOverlay}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                <View style={styles.bottomSheetContent}>
                    <View style={styles.bottomSheetHandle} />
                    <View style={styles.bottomSheetHeader}>
                        <View>
                            <Text style={styles.bottomSheetTitle}>Select Table</Text>
                            <Text style={styles.bottomSheetSubtitle}>Choose a table for this order</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={THEME_PRIMARY} />
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(30) }}>
                            <View style={styles.tableGrid}>
                                {tables.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[
                                            styles.tableItem,
                                            selectedTable === t.name && styles.tableItemSelected
                                        ]}
                                        onPress={() => onSelect(t.name === selectedTable ? null : t.name)}
                                    >
                                        <Text style={[
                                            styles.tableText,
                                            selectedTable === t.name && styles.tableTextSelected
                                        ]}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {tables.length === 0 && (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="grid-outline" size={rf(40)} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>No tables found. Create one in Table Management.</Text>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={styles.clearTableBtn}
                                onPress={() => onSelect(null)}
                            >
                                <Text style={styles.clearTableText}>Clear Selection</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetContent: {
        height: '75%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: s(32),
        borderTopRightRadius: s(32),
        paddingTop: vs(15),
        paddingHorizontal: s(20),
    },
    bottomSheetHandle: {
        width: s(40),
        height: vs(5),
        backgroundColor: '#E5E7EB',
        borderRadius: s(3),
        alignSelf: 'center',
        marginBottom: vs(15),
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: vs(20),
    },
    bottomSheetTitle: {
        fontSize: rf(20),
        fontWeight: '800',
        color: '#111827',
    },
    bottomSheetSubtitle: {
        fontSize: rf(12),
        color: '#6B7280',
        marginTop: vs(2),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: s(12),
    },
    tableItem: {
        width: (SCREEN_WIDTH - s(40) - s(40)) / 3.2,
        height: s(55),
        backgroundColor: '#F9FAFB',
        borderRadius: s(15),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: s(5),
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    tableItemSelected: {
        backgroundColor: THEME_PRIMARY,
        borderColor: THEME_PRIMARY,
        elevation: 4,
    },
    tableText: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#374151',
    },
    tableTextSelected: {
        color: '#FFFFFF',
    },
    clearTableBtn: {
        marginTop: vs(30),
        paddingVertical: vs(14),
        backgroundColor: '#F9FAFB',
        borderRadius: s(15),
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    clearTableText: {
        fontSize: rf(14),
        color: '#6B7280',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: vs(50),
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: rf(14),
        textAlign: 'center',
        marginTop: vs(10),
        paddingHorizontal: s(20),
    }
});
