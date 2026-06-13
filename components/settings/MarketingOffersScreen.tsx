import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View,
} from 'react-native';
import { Offer, offerService } from '../../services/offerService';
import { rf, s, vs } from '../../utils/responsive';
import { OfferCard } from './OfferCard';
import { OfferEditorPopup } from './OfferEditorPopup';

export default function OffersScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (screen: string) => void }) {

    const { getToken } = useAuth();

    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchOffers = async () => {
        try {
            const token = await getToken();
            const sessionStr = await AsyncStorage.getItem("staff_session");
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = token || staffSession?.token;

            if (finalToken) {
                const data = await offerService.getOffers(finalToken);
                setOffers(data);
            }
        } catch (error) {
            console.error("Failed to fetch offers", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOffers();
        }, [])
    );

    const handleSaveOffer = async (offerData: Partial<Offer>) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const token = await getToken();
            const sessionStr = await AsyncStorage.getItem("staff_session");
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = token || staffSession?.token;

            if (finalToken) {
                if (editingOffer) {
                    await offerService.updateOffer(finalToken, editingOffer.id, offerData);
                    ToastAndroid.show("Offer updated successfully", ToastAndroid.SHORT);
                } else {
                    await offerService.createOffer(finalToken, offerData);
                    ToastAndroid.show("Offer created successfully", ToastAndroid.SHORT);
                }
                setIsSheetOpen(false);
                setEditingOffer(null);
                fetchOffers();
            }
        } catch (error: any) {
            console.error("Save error:", error);
            ToastAndroid.show(error.message || "Failed to save offer", ToastAndroid.LONG);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteOffer = async (id: string) => {
        try {
            const token = await getToken();
            const sessionStr = await AsyncStorage.getItem("staff_session");
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = token || staffSession?.token;

            if (finalToken) {
                await offerService.deleteOffer(finalToken, id);
                ToastAndroid.show("Offer deleted", ToastAndroid.SHORT);
                fetchOffers();
            }
        } catch (error) {
            console.error("Delete error", error);
            ToastAndroid.show("Failed to delete offer", ToastAndroid.SHORT);
        }
    };

    const filteredOffers = offers.filter(o =>
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.code && o.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <View style={styles.headerIconBox}>
                        <Ionicons name="ticket" size={20} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Offers & Coupons</Text>
                        <Text style={styles.headerSubtitle}>Manage discounts and promotions</Text>
                    </View>
                </View>
            </View>

            {/* Actions Bar */}
            <View style={styles.actionsBar}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={rf(16)} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title or code..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => {
                        setEditingOffer(null);
                        setIsSheetOpen(true);
                    }}
                >
                    <Ionicons name="add" size={rf(20)} color="#FFF" />
                    <Text style={styles.createBtnText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Ionicons name="time-outline" size={rf(18)} color="#F59E0B" />
                    <View style={{ marginLeft: s(8) }}>
                        <Text style={styles.statLabel}>ACTIVE</Text>
                        <Text style={styles.statValue}>{offers.filter(o => o.isActive).length} Promotions</Text>
                    </View>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {/* Marketing Generators */}
                    <View style={styles.generatorsContainer}>
                        <TouchableOpacity
                            style={[styles.generatorCard, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}
                            onPress={() => onNavigate('marketingCardGen')}
                        >
                            <View style={[styles.generatorIconBox, { backgroundColor: '#F59E0B' }]}>
                                <Ionicons name="sparkles" size={rf(18)} color="#FFF" />
                            </View>
                            <View style={styles.generatorTextContainer}>
                                <Text style={[styles.generatorTitle, { color: '#D97706' }]}>Marketing Card Generator</Text>
                                <Text style={styles.generatorSubtitle}>Create beautiful offer cards for WhatsApp & Print</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={rf(20)} color="#F59E0B" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.generatorCard, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5', marginTop: vs(12) }]}
                            onPress={() => onNavigate('marketingReviewGen')}
                        >
                            <View style={[styles.generatorIconBox, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="star" size={rf(18)} color="#FFF" />
                            </View>
                            <View style={styles.generatorTextContainer}>
                                <Text style={[styles.generatorTitle, { color: '#059669' }]}>Google Review Generator</Text>
                                <Text style={styles.generatorSubtitle}>Design standees with QR codes for Google Reviews</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={rf(20)} color="#10B981" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Active Promotions</Text>

                    {filteredOffers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="gift-outline" size={rf(40)} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Promotions Found</Text>
                            <Text style={styles.emptyText}>Create your first coupon or offer to attract more customers and boost your sales!</Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => {
                                    setEditingOffer(null);
                                    setIsSheetOpen(true);
                                }}
                            >
                                <Text style={styles.emptyBtnText}>Launch First Offer 🚀</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filteredOffers.map((offer) => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                onEdit={(o) => {
                                    setEditingOffer(o);
                                    setIsSheetOpen(true);
                                }}
                                onDelete={(id) => handleDeleteOffer(id)}
                            />
                        ))
                    )}
                    <View style={{ height: vs(40) }} />
                </ScrollView>
            )}

            <OfferEditorPopup
                visible={isSheetOpen}
                offer={editingOffer}
                onClose={() => setIsSheetOpen(false)}
                onSave={handleSaveOffer}
                isSaving={submitting}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(20),
        paddingTop: vs(20),
        paddingBottom: vs(15),
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: s(8),
        marginRight: s(12),
        backgroundColor: '#F3F4F6',
        borderRadius: s(12),
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBox: {
        width: s(40),
        height: s(40),
        backgroundColor: '#F59E0B',
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTitle: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: rf(11),
        fontWeight: '500',
        color: '#6B7280',
    },
    actionsBar: {
        flexDirection: 'row',
        paddingHorizontal: s(20),
        paddingVertical: vs(16),
        gap: s(12),
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(16),
        paddingHorizontal: s(12),
        height: vs(48),
    },
    searchIcon: {
        marginRight: s(8),
    },
    searchInput: {
        flex: 1,
        fontSize: rf(13),
        fontWeight: '600',
        color: '#111827',
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: s(16),
        borderRadius: s(16),
        height: vs(48),
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createBtnText: {
        fontSize: rf(14),
        fontWeight: '900',
        color: '#FFF',
        marginLeft: s(4),
    },
    statsRow: {
        paddingHorizontal: s(20),
        marginBottom: vs(16),
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(16),
        padding: s(12),
    },
    statLabel: {
        fontSize: rf(9),
        fontWeight: '900',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: rf(15),
        fontWeight: '900',
        color: '#111827',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: s(20),
        paddingBottom: vs(40),
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: vs(60),
        paddingHorizontal: s(20),
        backgroundColor: '#FFF',
        borderRadius: s(32),
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        marginTop: vs(20),
    },
    emptyIconBox: {
        width: s(80),
        height: s(80),
        backgroundColor: '#F9FAFB',
        borderRadius: s(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
    },
    emptyTitle: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111827',
        marginBottom: vs(8),
    },
    emptyText: {
        fontSize: rf(13),
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: rf(20),
        marginBottom: vs(24),
    },
    emptyBtn: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: s(24),
        paddingVertical: vs(14),
        borderRadius: s(16),
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    emptyBtnText: {
        fontSize: rf(14),
        fontWeight: '900',
        color: '#FFF',
    },
    generatorsContainer: {
        marginBottom: vs(20),
    },
    generatorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(16),
        borderRadius: s(20),
        borderWidth: 1,
    },
    generatorIconBox: {
        width: s(40),
        height: s(40),
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    generatorTextContainer: {
        flex: 1,
    },
    generatorTitle: {
        fontSize: rf(14),
        fontWeight: '900',
        marginBottom: vs(2),
    },
    generatorSubtitle: {
        fontSize: rf(11),
        color: '#6B7280',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: rf(16),
        fontWeight: '900',
        color: '#111827',
        marginBottom: vs(12),
        marginLeft: s(4),
    },
});

