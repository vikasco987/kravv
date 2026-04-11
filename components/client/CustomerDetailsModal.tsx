import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, Alert, Share } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

interface Party {
    id: string;
    name: string;
    phone: string;
    address?: string;
    dob?: string;
}

interface CustomerDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    party: Party | null;
    stats: { lifetimeSpend: number; pending: number };
    t: (key: string) => string;
    onViewHistory: () => void;
}

const THEME_PRIMARY = "#4F46E5";

const CustomerDetailsModal = ({ 
    visible, 
    onClose, 
    party, 
    stats, 
    t, 
    onViewHistory 
}: CustomerDetailsModalProps) => {
    
    const handleCall = () => {
        if (party?.phone) {
            Linking.openURL(`tel:${party.phone}`);
        }
    };

    const handleWhatsApp = () => {
        if (party?.phone) {
            const message = t('whatsapp_greeting') || "Hello!";
            Linking.openURL(`whatsapp://send?phone=91${party.phone}&text=${encodeURIComponent(message)}`);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Customer Details:\nName: ${party?.name}\nPhone: ${party?.phone}\nLifetime Sales: ₹${stats.lifetimeSpend}`,
            });
        } catch (error) {
            Alert.alert("Error", "Failed to share details");
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.detailsModalContent}>
                    <View style={styles.detailsHeader}>
                        <View style={styles.avatarLarge}>
                            <Ionicons name="person" size={rf(40)} color={THEME_PRIMARY} />
                        </View>
                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={rf(26)} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailsBody}>
                        <Text style={styles.detailsName}>{party?.name || t('no_items')}</Text>
                        <Text style={styles.detailsPhone}>{party?.phone}</Text>

                        <View style={styles.detailsDivider} />

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconWrapper}>
                                <Ionicons name="bar-chart-outline" size={rf(20)} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Lifetime Business (Total Sales)</Text>
                                <Text style={[styles.detailValue, { color: "#10B981" }]}>₹{(stats?.lifetimeSpend || 0).toFixed(2)}</Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconWrapper}>
                                <Ionicons name="alert-circle-outline" size={rf(20)} color={(stats?.pending || 0) > 0 ? "#EF4444" : "#64748B"} />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Pending Balance</Text>
                                <Text style={[styles.detailValue, { color: (stats?.pending || 0) > 0 ? "#EF4444" : "#64748B" }]}>
                                    ₹{(stats?.pending || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconWrapper}>
                                <Ionicons name="location-outline" size={rf(20)} color={THEME_PRIMARY} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>{t('address')}</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>
                                    {party?.address || "No Address Added"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconWrapper}>
                                <Ionicons name="calendar-outline" size={rf(20)} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Birthday</Text>
                                <Text style={styles.detailValue}>{party?.dob || "Not Set"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.detailsActions}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFD70020' }]} onPress={handleCall}>
                            <Ionicons name="call" size={rf(20)} color="#FFD700" />
                            <Text style={[styles.actionBtnText, { color: '#B8860B' }]}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D36620' }]} onPress={handleWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={rf(20)} color="#25D366" />
                            <Text style={[styles.actionBtnText, { color: '#25D366' }]}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F8FAFC' }]} onPress={handleShare}>
                            <Ionicons name="share-outline" size={rf(20)} color="#64748B" />
                            <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.mainActionBtn}
                        onPress={onViewHistory}
                    >
                        <Text style={styles.mainActionBtnText}>View Full Purchase History</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsModalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: s(32),
        padding: s(24),
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
    },
    avatarLarge: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        backgroundColor: "#EEF2FF",
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        elevation: 4,
        shadowColor: THEME_PRIMARY,
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    closeModalBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: s(5),
    },
    detailsBody: {
        alignItems: 'center',
        marginBottom: vs(25),
    },
    detailsName: {
        fontSize: rf(24),
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: vs(4),
        textAlign: 'center'
    },
    detailsPhone: {
        fontSize: rf(16),
        color: '#64748B',
        fontWeight: '500',
    },
    detailsDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: vs(20),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: vs(18),
        paddingHorizontal: s(10),
    },
    detailIconWrapper: {
        width: s(42),
        height: s(42),
        borderRadius: s(12),
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(15),
    },
    detailLabel: {
        fontSize: rf(12),
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: rf(15),
        color: '#334155',
        fontWeight: '700',
        marginTop: vs(2),
    },
    detailsActions: {
        flexDirection: 'row',
        gap: s(12),
        marginBottom: vs(20),
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(14),
        borderRadius: s(16),
        gap: s(8),
    },
    actionBtnText: {
        fontSize: rf(14),
        fontWeight: '700',
    },
    mainActionBtn: {
        backgroundColor: THEME_PRIMARY,
        paddingVertical: vs(16),
        borderRadius: s(18),
        alignItems: 'center',
        shadowColor: THEME_PRIMARY,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    mainActionBtnText: {
        color: '#fff',
        fontSize: rf(16),
        fontWeight: '800',
    },
});

export default CustomerDetailsModal;
