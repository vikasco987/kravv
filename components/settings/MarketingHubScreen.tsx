import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

export default function MarketingHubScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (screen: string) => void }) {


    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Marketing Hub</Text>
                    <Text style={styles.headerSubtitle}>Grow your business</Text>
                </View>
            </View>

            {/* Menu */}
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => onNavigate('marketingOffers')}
                >
                    <View style={styles.cardGradient}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="ticket-outline" size={rf(28)} color="#FFF" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Offers & Coupons</Text>
                            <Text style={styles.cardSubtitle}>
                                Manage discounts and seasonal promotions for your customers.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={rf(20)} color="#FFF" style={{ opacity: 0.8 }} />
                    </View>
                </TouchableOpacity>
            </View>
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
    headerTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: rf(13),
        fontWeight: '500',
        color: '#6B7280',
        marginTop: vs(2),
    },
    content: {
        padding: s(20),
    },
    card: {
        borderRadius: s(24),
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    cardGradient: {
        backgroundColor: '#F59E0B',
        padding: s(24),
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: s(56),
        height: s(56),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: s(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(16),
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#FFF',
        marginBottom: vs(4),
    },
    cardSubtitle: {
        fontSize: rf(12),
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: rf(18),
        paddingRight: s(10),
    },
});

