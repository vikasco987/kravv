import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Offer } from '../../services/offerService';
import { rf, s, vs } from '../../utils/responsive';

interface OfferCardProps {
    offer: Offer;
    onEdit: (offer: Offer) => void;
    onDelete: (id: string) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onEdit, onDelete }) => {
    return (
        <View style={[styles.card, !offer.isActive && { opacity: 0.8 }]}>
            {/* Top Accent */}
            <View style={[styles.accentLine, { backgroundColor: offer.isActive ? '#F59E0B' : '#D1D5DB' }]} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Ionicons 
                            name={offer.discountType === 'PERCENTAGE' ? 'pricetag-outline' : 'cash-outline'} 
                            size={rf(20)} 
                            color="#F59E0B" 
                        />
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => onEdit(offer)} style={styles.actionBtn}>
                            <Ionicons name="create-outline" size={rf(18)} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDelete(offer.id)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={rf(18)} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.title} numberOfLines={2}>{offer.title}</Text>

                <View style={styles.badges}>
                    {offer.code && (
                        <View style={styles.codeBadge}>
                            <Text style={styles.codeText}>CODE: {offer.code}</Text>
                        </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: offer.isActive ? '#ECFDF5' : '#F3F4F6' }]}>
                        <Text style={[styles.statusText, { color: offer.isActive ? '#059669' : '#6B7280' }]}>
                            {offer.isActive ? 'Active' : 'Paused'}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsDivider} />
                
                <View style={styles.detailsRow}>
                    <View>
                        <Text style={styles.label}>BENEFIT</Text>
                        <Text style={styles.valueText}>
                            {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.label}>CONDITIONS</Text>
                        <Text style={styles.conditionText}>
                            Min order ₹{offer.minOrderValue || 0}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={rf(12)} color="#6B7280" style={{ marginRight: s(4) }} />
                    <Text style={styles.dateText}>
                        {offer.startDate ? (
                            `${new Date(offer.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${offer.endDate ? new Date(offer.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'Never'}`
                        ) : 'No expiry set'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.viewDetailsBtn}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={rf(14)} color="#D97706" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: s(24),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: vs(16),
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    accentLine: {
        height: vs(4),
        width: '100%',
    },
    content: {
        padding: s(20),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(12),
    },
    iconBox: {
        width: s(40),
        height: s(40),
        backgroundColor: '#FFFBEB',
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: s(8),
    },
    actionBtn: {
        padding: s(8),
        backgroundColor: '#F9FAFB',
        borderRadius: s(10),
    },
    title: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#111827',
        lineHeight: rf(24),
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(8),
        marginTop: vs(10),
    },
    codeBadge: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
        borderWidth: 1,
        paddingHorizontal: s(8),
        paddingVertical: vs(4),
        borderRadius: s(6),
    },
    codeText: {
        fontSize: rf(9),
        fontWeight: '900',
        color: '#D97706',
    },
    statusBadge: {
        paddingHorizontal: s(8),
        paddingVertical: vs(4),
        borderRadius: s(6),
    },
    statusText: {
        fontSize: rf(9),
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    detailsDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: vs(16),
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    label: {
        fontSize: rf(9),
        fontWeight: '900',
        color: '#9CA3AF',
        marginBottom: vs(4),
    },
    valueText: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111827',
    },
    conditionText: {
        fontSize: rf(11),
        fontWeight: '700',
        color: '#374151',
        fontStyle: 'italic',
    },
    footer: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: s(20),
        paddingVertical: vs(12),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: rf(10),
        fontWeight: '800',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetailsText: {
        fontSize: rf(10),
        fontWeight: '800',
        color: '#D97706',
    },
});

