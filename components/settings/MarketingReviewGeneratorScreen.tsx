import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { getRecentCompanyProfile } from '../../services/companyService';
import { rf, s, vs } from '../../utils/responsive';

// Preset styles for the Google Review Standee
const STYLES = [
    {
        id: "google-classic",
        name: "Google Classic (Cream)",
        bgColors: ["#FAF6EE", "#FAF6EE"],
        textPrimary: "#1F2937",
        textSecondary: "#4B5563",
        starColor: "#FBBC05",
        qrBg: "#FFFFFF",
        qrFg: "#111827",
        blockBg: "#4285F4",
        blockText: "#FFFFFF",
        ratingBadgeBg: "#FEF9C3",
        ratingBadgeBorder: "#EAB308",
        ratingBadgeText: "#854D0E",
        thankYouColor: "#F43F5E",
        showColorBar: true
    },
    {
        id: "obsidian-gold",
        name: "Premium Obsidian Gold",
        bgColors: ["#111111", "#252525"],
        textPrimary: "#D4AF37",
        textSecondary: "#FFFFFF",
        starColor: "#D4AF37",
        qrBg: "#FFFFFF",
        qrFg: "#111111",
        blockBg: "rgba(212,175,55,0.12)",
        blockText: "#D4AF37",
        ratingBadgeBg: "rgba(212,175,55,0.1)",
        ratingBadgeBorder: "#D4AF37",
        ratingBadgeText: "#D4AF37",
        thankYouColor: "#D4AF37",
        showColorBar: false
    },
    {
        id: "kravy-orange",
        name: "Kravy Brand Orange",
        bgColors: ["#FF6B35", "#C0481F"],
        textPrimary: "#FFFFFF",
        textSecondary: "rgba(255,255,255,0.85)",
        starColor: "#FFD700",
        qrBg: "#FFFFFF",
        qrFg: "#FF6B35",
        blockBg: "rgba(255,255,255,0.15)",
        blockText: "#FFFFFF",
        ratingBadgeBg: "rgba(255,255,255,0.15)",
        ratingBadgeBorder: "rgba(255,255,255,0.4)",
        ratingBadgeText: "#FFFFFF",
        thankYouColor: "#FFFFFF",
        showColorBar: false
    },
    {
        id: "royal-velvet",
        name: "Royal Purple",
        bgColors: ["#2C1654", "#4A235A"],
        textPrimary: "#FFD700",
        textSecondary: "#FFFFFF",
        starColor: "#FFD700",
        qrBg: "#FFFFFF",
        qrFg: "#2C1654",
        blockBg: "rgba(255,215,0,0.12)",
        blockText: "#FFD700",
        ratingBadgeBg: "rgba(255,215,0,0.08)",
        ratingBadgeBorder: "#FFD700",
        ratingBadgeText: "#FFD700",
        thankYouColor: "#FBBF24",
        showColorBar: false
    }
];

export default function GoogleReviewGenerator({ onBack }: { onBack: () => void }) {

    const { getToken } = useAuth();
    const viewShotRef = useRef<ViewShot>(null);

    const [isExporting, setIsExporting] = useState(false);

    // Form inputs state
    const [restaurantName, setRestaurantName] = useState("Spice Garden");
    const [googleUrl, setGoogleUrl] = useState("https://g.page/r/your-business/review");
    const [ctaText, setCtaText] = useState("Enjoyed your experience?");
    const [subText, setSubText] = useState("Tell the world about us!");
    const [ratingVal, setRatingVal] = useState("4.8 / 5");
    const [qrHelperText, setQrHelperText] = useState("Scan to leave a review");
    const [customSearchTerm, setCustomSearchTerm] = useState("");

    // Highlight Info Box
    const [highlightTitle, setHighlightTitle] = useState("Your review means the world");
    const [highlightSubtext, setHighlightSubtext] = useState("It takes only 30 seconds and helps us serve you better every day!");

    // Footer
    const [thankYouText, setThankYouText] = useState("Thank You!");
    const [teamText, setTeamText] = useState("— The Team");

    // Styling configurations
    const [selectedStyleId, setSelectedStyleId] = useState("google-classic");
    const [showCircles, setShowCircles] = useState(true);
    const [showDots, setShowDots] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const token = await getToken();
                const sessionStr = await AsyncStorage.getItem("staff_session");
                const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
                const finalToken = token || staffSession?.token;

                if (finalToken) {
                    const profile = await getRecentCompanyProfile(finalToken);
                    if (profile?.companyName) {
                        setRestaurantName(profile.companyName);
                        setCustomSearchTerm(`"${profile.companyName}" Review`);
                    }
                    if (profile?.googleReviewLink) {
                        setGoogleUrl(profile.googleReviewLink);
                    } else if (profile?.companyName) {
                        const encodedName = encodeURIComponent(`${profile.companyName} Restaurant`);
                        setGoogleUrl(`https://www.google.com/search?q=${encodedName}&hl=en`);
                    }
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, []);

    const handleRestaurantNameChange = (val: string) => {
        setRestaurantName(val);
        setCustomSearchTerm(`"${val}" Review`);
    };

    const activeStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[0];

    const handleShare = async () => {
        if (viewShotRef.current && viewShotRef.current.capture) {
            try {
                setIsExporting(true);
                const uri = await viewShotRef.current.capture();
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'image/png',
                        dialogTitle: 'Share Google Review Standee'
                    });
                } else {
                    Alert.alert('Error', 'Sharing is not available on this device');
                }
            } catch (error) {
                console.error("Failed to capture screen", error);
                Alert.alert('Error', 'Failed to generate standee');
            } finally {
                setIsExporting(false);
            }
        }
    };

    const handleShareWhatsApp = () => {
        const text = `🌟 Loved your experience at *${restaurantName}*? \n\n${ctaText}\n${subText}\n\n👉 Click here to review us: ${googleUrl}\n\n_Generated via Kravy POS Marketing Hub_`;
        const encodedText = encodeURIComponent(text);
        Linking.openURL(`whatsapp://send?text=${encodedText}`).catch(() => {
            Alert.alert("Error", "Make sure WhatsApp is installed on your device.");
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
                        <Ionicons name="star" size={18} color="#FBBF24" />
                        <Text style={styles.headerTitle}>
                            <Text style={{ color: '#FBBF24' }}>Informative </Text>
                            <Text style={{ color: '#FCD34D' }}>Google Review </Text>
                            <Text style={{ color: '#F97316' }}>Standee</Text>
                        </Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Design QR codes for Google Reviews</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Visualizer */}
                    <View style={styles.previewContainer}>
                        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={styles.viewShot}>
                            <LinearGradient
                                colors={activeStyle.bgColors as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardFrame}
                            >
                                {/* Background Circles */}
                                {showCircles && (
                                    <>
                                        <View style={{ position: 'absolute', top: -30, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', zIndex: 0 }} />
                                        <View style={{ position: 'absolute', bottom: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)', zIndex: 0 }} />
                                    </>
                                )}

                                {/* Dot Grid */}
                                {showDots && (
                                    <View style={{ position: 'absolute', top: 80, left: 20, flexDirection: 'row', flexWrap: 'wrap', width: 40, opacity: 0.1, zIndex: 0 }}>
                                        {[...Array(6)].map((_, i) => (
                                            <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFF', margin: 2 }} />
                                        ))}
                                    </View>
                                )}

                                <View style={styles.cardTop}>
                                    <View style={styles.googlePill}>
                                        <Text style={styles.googlePillText}>Google</Text>
                                    </View>
                                    <Text style={[styles.ctaTitle, { color: activeStyle.textPrimary }]}>{ctaText}</Text>
                                    <Text style={[styles.ctaSub, { color: activeStyle.textSecondary }]}>{subText}</Text>

                                    <View style={styles.starsRow}>
                                        {[...Array(5)].map((_, i) => (
                                            <Ionicons key={i} name="star" size={20} color={activeStyle.starColor} />
                                        ))}
                                    </View>

                                    <View style={[styles.ratingBadge, { backgroundColor: activeStyle.ratingBadgeBg, borderColor: activeStyle.ratingBadgeBorder }]}>
                                        <Text style={[styles.ratingBadgeText, { color: activeStyle.ratingBadgeText }]}>Rated {ratingVal} on Google</Text>
                                    </View>
                                </View>

                                <View style={styles.qrContainer}>
                                    <View style={styles.qrBox}>
                                        <QRCode
                                            value={googleUrl || "https://google.com"}
                                            size={100}
                                            backgroundColor={activeStyle.qrBg}
                                            color={activeStyle.qrFg}
                                        />
                                    </View>
                                    <Text style={styles.qrHelperText}>{qrHelperText}</Text>

                                    <View style={styles.orDivider}>
                                        <View style={styles.orLine} />
                                        <Text style={styles.orText}>OR</Text>
                                        <View style={styles.orLine} />
                                    </View>

                                    <View style={[styles.searchBox, { borderColor: activeStyle.textSecondary }]}>
                                        <Text style={[styles.searchLabel, { color: activeStyle.textSecondary }]}>Search on Google</Text>
                                        <View style={styles.searchRow}>
                                            <Ionicons name="search" size={12} color={activeStyle.textPrimary} />
                                            <Text style={[styles.searchText, { color: activeStyle.textPrimary }]}>{customSearchTerm}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.highlightBox, { backgroundColor: activeStyle.blockBg }]}>
                                    <Text style={[styles.highlightTitle, { color: activeStyle.blockText }]}>{highlightTitle}</Text>
                                    <Text style={[styles.highlightSubtext, { color: activeStyle.blockText }]}>{highlightSubtext}</Text>
                                </View>

                                <View style={styles.footerInfo}>
                                    <Text style={[styles.thankYou, { color: activeStyle.thankYouColor }]}>{thankYouText}</Text>
                                    <Text style={[styles.teamText, { color: activeStyle.textSecondary }]}>{teamText}</Text>
                                </View>

                                {activeStyle.showColorBar && (
                                    <View style={styles.googleColorBar}>
                                        <View style={[styles.colorStrip, { backgroundColor: '#EA4335' }]} />
                                        <View style={[styles.colorStrip, { backgroundColor: '#FBBC05' }]} />
                                        <View style={[styles.colorStrip, { backgroundColor: '#34A853' }]} />
                                        <View style={[styles.colorStrip, { backgroundColor: '#4285F4' }]} />
                                    </View>
                                )}
                            </LinearGradient>
                        </ViewShot>

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleShare} disabled={isExporting}>
                                {isExporting ? <ActivityIndicator color="#151233" /> : <Ionicons name="download" size={rf(18)} color="#151233" />}
                                <Text style={styles.saveBtnText}>{isExporting ? "Saving..." : "Save PNG"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.iconBtn} onPress={handleShare} disabled={isExporting}>
                                <Ionicons name="copy" size={rf(18)} color="#FFF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#25D366', borderColor: '#25D366' }]} onPress={handleShareWhatsApp} disabled={isExporting}>
                                <Ionicons name="logo-whatsapp" size={rf(18)} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Editor Form - The 3 Cards matching Web */}
                    <View style={styles.editorBox}>

                        {/* CARD 1: Setup & Google Link */}
                        <View style={styles.formCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.cardDot, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.sectionTitle}>1. Setup & Google Link</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Restaurant Name</Text>
                                <TextInput style={styles.input} value={restaurantName} onChangeText={handleRestaurantNameChange} placeholderTextColor="rgba(255,255,255,0.3)" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Google Review URL</Text>
                                <TextInput style={styles.input} value={googleUrl} onChangeText={setGoogleUrl} placeholderTextColor="rgba(255,255,255,0.3)" />
                            </View>
                        </View>

                        {/* CARD 2: Customize Text Content */}
                        <View style={styles.formCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.cardDot, { backgroundColor: '#FBBF24' }]} />
                                <Text style={styles.sectionTitle}>2. Customize Text Content</Text>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                    <Text style={styles.label}>Headline</Text>
                                    <TextInput style={styles.input} value={ctaText} onChangeText={setCtaText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Subheadline</Text>
                                    <TextInput style={styles.input} value={subText} onChangeText={setSubText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Rating Badge</Text>
                                <TextInput style={styles.input} value={ratingVal} onChangeText={setRatingVal} placeholderTextColor="rgba(255,255,255,0.3)" />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                    <Text style={styles.label}>QR Helper Text</Text>
                                    <TextInput style={styles.input} value={qrHelperText} onChangeText={setQrHelperText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Search Term (Fallback)</Text>
                                    <TextInput style={styles.input} value={customSearchTerm} onChangeText={setCustomSearchTerm} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                            </View>

                            <View style={styles.divider} />
                            <Text style={[styles.subCardTitle, { color: '#34D399' }]}>HIGHLIGHTED REVIEW BOX</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Box Header</Text>
                                <TextInput style={styles.input} value={highlightTitle} onChangeText={setHighlightTitle} placeholderTextColor="rgba(255,255,255,0.3)" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Box Subtext</Text>
                                <TextInput style={styles.input} value={highlightSubtext} onChangeText={setHighlightSubtext} placeholderTextColor="rgba(255,255,255,0.3)" />
                            </View>

                            <View style={styles.divider} />
                            <Text style={[styles.subCardTitle, { color: '#FB7185' }]}>FOOTER TEXT</Text>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                    <Text style={styles.label}>Thank You Text</Text>
                                    <TextInput style={styles.input} value={thankYouText} onChangeText={setThankYouText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Team Signature</Text>
                                    <TextInput style={styles.input} value={teamText} onChangeText={setTeamText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                            </View>
                        </View>

                        {/* CARD 3: Aesthetics & Colors */}
                        <View style={styles.formCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.cardDot, { backgroundColor: '#3B82F6' }]} />
                                <Text style={styles.sectionTitle}>3. Aesthetics & Colors</Text>
                            </View>

                            <View style={styles.themesGrid}>
                                {STYLES.map(style => (
                                    <TouchableOpacity
                                        key={style.id}
                                        style={[styles.themeBtn, selectedStyleId === style.id && styles.themeBtnActive]}
                                        onPress={() => setSelectedStyleId(style.id)}
                                    >
                                        <LinearGradient
                                            colors={style.bgColors as any}
                                            style={styles.themeSwatch}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                        <Text style={[styles.themeBtnText, selectedStyleId === style.id && styles.themeBtnTextActive]}>
                                            {style.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.switchGroup}>
                                <View>
                                    <Text style={styles.switchLabel}>Backdrop Circles</Text>
                                    <Text style={styles.switchSublabel}>Show decorative circles</Text>
                                </View>
                                <Switch value={showCircles} onValueChange={setShowCircles} trackColor={{ true: '#10B981', false: 'rgba(255,255,255,0.2)' }} thumbColor="#FFF" />
                            </View>

                            <View style={styles.switchGroup}>
                                <View>
                                    <Text style={styles.switchLabel}>Dotted Accents</Text>
                                    <Text style={styles.switchSublabel}>Show dotted grids</Text>
                                </View>
                                <Switch value={showDots} onValueChange={setShowDots} trackColor={{ true: '#10B981', false: 'rgba(255,255,255,0.2)' }} thumbColor="#FFF" />
                            </View>

                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0C2A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(20),
        paddingTop: vs(20),
        paddingBottom: vs(15),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: s(40),
        height: s(40),
        marginRight: s(12),
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: rf(20),
        fontWeight: '900',
    },
    headerSubtitle: {
        fontSize: rf(11),
        fontWeight: '500',
        color: 'rgba(255,255,255,0.6)',
        marginTop: vs(2),
    },
    scrollContent: {
        paddingBottom: vs(40),
    },
    previewContainer: {
        alignItems: 'center',
        paddingVertical: vs(24),
    },
    viewShot: {
        width: s(290),
        height: vs(450),
        borderRadius: s(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    cardFrame: {
        flex: 1,
        borderRadius: s(24),
        padding: s(20),
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    cardTop: {
        alignItems: 'center',
        width: '100%',
        zIndex: 10,
    },
    googlePill: {
        backgroundColor: '#FFF',
        paddingHorizontal: s(16),
        paddingVertical: vs(4),
        borderRadius: s(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: vs(8),
    },
    googlePillText: {
        fontSize: rf(12),
        fontWeight: '900',
        color: '#1F2937',
    },
    ctaTitle: {
        fontSize: rf(16),
        fontWeight: 'bold',
        textAlign: 'center',
    },
    ctaSub: {
        fontSize: rf(10),
        marginTop: vs(2),
        marginBottom: vs(8),
    },
    starsRow: {
        flexDirection: 'row',
        gap: s(4),
        marginBottom: vs(8),
    },
    ratingBadge: {
        borderWidth: 1,
        borderRadius: s(16),
        paddingHorizontal: s(12),
        paddingVertical: vs(4),
    },
    ratingBadgeText: {
        fontSize: rf(9),
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    qrContainer: {
        backgroundColor: '#FFF',
        borderRadius: s(20),
        padding: s(16),
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    qrBox: {
        backgroundColor: '#F9FAFB',
        padding: s(8),
        borderRadius: s(12),
        marginBottom: vs(8),
    },
    qrHelperText: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#1F2937',
        textTransform: 'uppercase',
    },
    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: vs(8),
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    orText: {
        fontSize: rf(8),
        fontWeight: '900',
        color: '#9CA3AF',
        paddingHorizontal: s(8),
    },
    searchBox: {
        borderWidth: 1,
        borderRadius: s(20),
        paddingVertical: vs(6),
        paddingHorizontal: s(16),
        alignItems: 'center',
        width: '100%',
    },
    searchLabel: {
        fontSize: rf(8),
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(4),
        marginTop: vs(2),
    },
    searchText: {
        fontSize: rf(10),
        fontWeight: '900',
    },
    highlightBox: {
        width: '100%',
        borderRadius: s(16),
        padding: s(12),
        alignItems: 'center',
        marginTop: vs(12),
        zIndex: 10,
    },
    highlightTitle: {
        fontSize: rf(11),
        fontWeight: '900',
        textAlign: 'center',
    },
    highlightSubtext: {
        fontSize: rf(9),
        textAlign: 'center',
        marginTop: vs(2),
        opacity: 0.9,
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: vs(8),
        marginBottom: vs(8),
        zIndex: 10,
    },
    thankYou: {
        fontSize: rf(14),
        fontWeight: '900',
    },
    teamText: {
        fontSize: rf(9),
        fontStyle: 'italic',
        marginTop: vs(2),
    },
    googleColorBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: vs(6),
        flexDirection: 'row',
        zIndex: 20,
    },
    colorStrip: {
        flex: 1,
        height: '100%',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(12),
        marginTop: vs(20),
        width: s(290),
    },
    saveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        height: vs(48),
        borderRadius: s(16),
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    saveBtnText: {
        color: '#151233',
        fontWeight: '900',
        fontSize: rf(14),
        marginLeft: s(8),
    },
    iconBtn: {
        width: vs(48),
        height: vs(48),
        borderRadius: s(16),
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editorBox: {
        paddingHorizontal: s(20),
        gap: vs(16),
    },
    formCard: {
        backgroundColor: '#151233',
        borderRadius: s(24),
        padding: s(20),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: vs(12),
        marginBottom: vs(16),
    },
    cardDot: {
        width: s(10),
        height: s(10),
        borderRadius: s(5),
        marginRight: s(8),
    },
    sectionTitle: {
        fontSize: rf(12),
        fontWeight: '900',
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subCardTitle: {
        fontSize: rf(10),
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: vs(12),
        marginTop: vs(6),
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: vs(12),
    },
    inputGroup: {
        marginBottom: vs(16),
    },
    label: {
        fontSize: rf(10),
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        marginBottom: vs(6),
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: s(12),
        height: vs(48),
        paddingHorizontal: s(16),
        fontSize: rf(14),
        fontWeight: '600',
        color: '#FFF',
    },
    row: {
        flexDirection: 'row',
    },
    themesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: s(10),
        marginBottom: vs(16),
    },
    themeBtn: {
        width: '47%',
        height: vs(50),
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(8),
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    themeBtnActive: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.1)',
    },
    themeSwatch: {
        width: s(24),
        height: s(24),
        borderRadius: s(6),
        marginRight: s(8),
    },
    themeBtnText: {
        fontSize: rf(10),
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        flex: 1,
    },
    themeBtnTextActive: {
        color: '#FFF',
        fontWeight: '800',
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: s(12),
        borderRadius: s(16),
        marginBottom: vs(8),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    switchLabel: {
        fontSize: rf(12),
        fontWeight: 'bold',
        color: '#FFF',
    },
    switchSublabel: {
        fontSize: rf(10),
        color: 'rgba(255,255,255,0.5)',
        marginTop: vs(2),
    },
});

