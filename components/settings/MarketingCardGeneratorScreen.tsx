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
import ViewShot from 'react-native-view-shot';
import { getRecentCompanyProfile } from '../../services/companyService';
import { Offer, offerService } from '../../services/offerService';
import { rf, s, vs } from '../../utils/responsive';

const THEMES = [
    {
        id: "red", name: "Sunset Crimson", colors: ['#C0392B', '#7B241C'],
        divider: "#F0B429", ctaBg: "#F0B429", ctaText: "#7B241C", ctaBorder: "#F0B429",
        badgeBg: "rgba(240, 180, 41, 0.15)", badgeBorder: "#F0B429", accentText: "#FFF",
        validityColor: "rgba(255,255,255,0.45)", phoneColor: "rgba(255,255,255,0.75)"
    },
    {
        id: "purple", name: "Royal Velvet", colors: ['#2C1654', '#4A235A'],
        divider: "#FFD700", ctaBg: "#FFD700", ctaText: "#2C1654", ctaBorder: "#FFD700",
        badgeBg: "rgba(255, 215, 0, 0.12)", badgeBorder: "#FFD700", accentText: "#FFD700",
        validityColor: "rgba(255,215,0,0.45)", phoneColor: "rgba(255,215,0,0.8)"
    },
    {
        id: "green", name: "Emerald Forest", colors: ['#1A5C2A', '#0D3B18'],
        divider: "#F0B429", ctaBg: "rgba(255,255,255,0.1)", ctaText: "#FFF", ctaBorder: "rgba(255,255,255,0.45)",
        badgeBg: "rgba(255, 255, 255, 0.08)", badgeBorder: "rgba(255, 255, 255, 0.35)", accentText: "#FFF",
        validityColor: "rgba(255,255,255,0.45)", phoneColor: "rgba(255,255,255,0.75)"
    },
    {
        id: "blue", name: "Midnight Ocean", colors: ['#1A237E', '#283593'],
        divider: "#64B5F6", ctaBg: "rgba(255,255,255,0.1)", ctaText: "#FFF", ctaBorder: "rgba(255,255,255,0.45)",
        badgeBg: "rgba(100, 181, 246, 0.12)", badgeBorder: "#64B5F6", accentText: "#FFF",
        validityColor: "rgba(255,255,255,0.45)", phoneColor: "rgba(100,181,246,0.85)"
    },
    {
        id: "kravy", name: "Kravy Brand Orange", colors: ['#FF6B35', '#C0481F'],
        divider: "#FFF", ctaBg: "#FFF", ctaText: "#FF6B35", ctaBorder: "#FFF",
        badgeBg: "rgba(255,255,255,0.15)", badgeBorder: "rgba(255,255,255,0.4)", accentText: "#FFF",
        validityColor: "rgba(255,255,255,0.5)", phoneColor: "rgba(255,255,255,0.85)"
    },
    {
        id: "lux", name: "Premium Gold & Black", colors: ['#111111', '#2D2D2D'],
        divider: "#D4AF37", ctaBg: "#D4AF37", ctaText: "#111", ctaBorder: "#D4AF37",
        badgeBg: "rgba(212, 175, 55, 0.1)", badgeBorder: "#D4AF37", accentText: "#D4AF37",
        validityColor: "rgba(212,175,55,0.5)", phoneColor: "rgba(212,175,55,0.8)"
    }
];

export default function MarketingCardGenerator({ onBack }: { onBack: () => void }) {

    const { getToken } = useAuth();
    const viewShotRef = useRef<ViewShot>(null);

    const [loadingOffers, setLoadingOffers] = useState(true);
    const [systemOffers, setSystemOffers] = useState<Offer[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // Form States
    const [restaurantName, setRestaurantName] = useState("Spice Garden");
    const [tagline, setTagline] = useState("✦ Special Offer ✦");
    const [offerPercent, setOfferPercent] = useState("50%");
    const [offerOffText, setOfferOffText] = useState("OFF");
    const [offerTitle, setOfferTitle] = useState("Grand Discount Offer");
    const [offerSubtitle, setOfferSubtitle] = useState("Dine-in & Takeaway • All Items");
    const [validity, setValidity] = useState("Valid till 31st May 2026");
    const [ctaText, setCtaText] = useState("Order Now");
    const [phoneNumber, setPhoneNumber] = useState("98765 43210");

    // Styling states
    const [selectedThemeId, setSelectedThemeId] = useState("red");
    const [middleDecoType, setMiddleDecoType] = useState<"badge" | "stars" | "emoji" | "none">("badge");
    const [emojiDeco, setEmojiDeco] = useState("🍽️");
    const [showCircles, setShowCircles] = useState(true);
    const [showDots, setShowDots] = useState(true);

    // Custom gradient options
    const [useCustomGradient, setUseCustomGradient] = useState(false);
    const [customGradColor1, setCustomGradColor1] = useState("#8B5CF6");
    const [customGradColor2, setCustomGradColor2] = useState("#4C1D95");
    const [customDividerColor, setCustomDividerColor] = useState("#FFD700");
    const [customCtaBgColor, setCustomCtaBgColor] = useState("#FFD700");
    const [customCtaTextColor, setCustomCtaTextColor] = useState("#4C1D95");

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const token = await getToken();
                const sessionStr = await AsyncStorage.getItem("staff_session");
                const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
                const finalToken = token || staffSession?.token;

                if (finalToken) {
                    const profile = await getRecentCompanyProfile(finalToken);
                    if (profile?.companyName) setRestaurantName(profile.companyName);
                    if (profile?.companyPhone) setPhoneNumber(profile.companyPhone);

                    const offers = await offerService.getOffers(finalToken);
                    setSystemOffers(offers.filter(o => o.isActive));
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setLoadingOffers(false);
            }
        };
        loadInitialData();
    }, []);

    const getActiveTheme = () => {
        if (useCustomGradient) {
            return {
                colors: [customGradColor1, customGradColor2],
                divider: customDividerColor,
                ctaBg: customCtaBgColor,
                ctaText: customCtaTextColor,
                ctaBorder: customCtaBgColor,
                badgeBg: "rgba(255,255,255,0.12)",
                badgeBorder: customDividerColor,
                accentText: "#FFF",
                validityColor: "rgba(255,255,255,0.5)",
                phoneColor: "rgba(255,255,255,0.8)"
            };
        }
        return THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
    };

    const activeStyle = getActiveTheme();

    const handleShare = async () => {
        if (viewShotRef.current && viewShotRef.current.capture) {
            try {
                setIsExporting(true);
                const uri = await viewShotRef.current.capture();
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'image/png',
                        dialogTitle: 'Share Marketing Card'
                    });
                } else {
                    Alert.alert('Error', 'Sharing is not available on this device');
                }
            } catch (error) {
                console.error("Failed to capture screen", error);
                Alert.alert('Error', 'Failed to generate card');
            } finally {
                setIsExporting(false);
            }
        }
    };

    const handleShareWhatsApp = () => {
        const text = `🍽️ *${restaurantName}* - Special Marketing Offer! \n\n🔥 *${offerTitle}*\n💥 *${offerPercent} ${offerOffText}*\n✨ ${offerSubtitle}\n📅 ${validity}\n\n📞 Call us at ${phoneNumber} to order now!\n\n_Generated via Kravy POS Marketing Hub_`;
        const encodedText = encodeURIComponent(text);
        Linking.openURL(`whatsapp://send?text=${encodedText}`).catch(() => {
            Alert.alert("Error", "Make sure WhatsApp is installed on your device.");
        });
    };

    const handleLoadOffer = (offer: Offer) => {
        setOfferTitle(offer.title);

        if (offer.discountType === "PERCENTAGE") {
            setOfferPercent(`${offer.discountValue}%`);
            setOfferOffText("OFF");
        } else if (offer.discountType === "FLAT") {
            setOfferPercent(`₹${offer.discountValue}`);
            setOfferOffText("OFF");
        } else if (offer.discountType === "BOGO") {
            setOfferPercent("BUY 1");
            setOfferOffText("GET 1 FREE");
        } else {
            setOfferPercent(`${offer.discountValue}`);
            setOfferOffText("OFF");
        }

        let subtitle = "";
        if (offer.minOrderValue) subtitle += `Min. Order ₹${offer.minOrderValue} `;
        if (offer.code) subtitle += `• Code: ${offer.code}`;
        setOfferSubtitle(subtitle || "Special Limited Promotion");

        if (offer.endDate) {
            const dateObj = new Date(offer.endDate);
            setValidity(`Valid till ${dateObj.toLocaleDateString()}`);
        } else {
            setValidity("Valid for a limited time");
        }
    };

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < 12; i++) {
            dots.push(<View key={i} style={styles.dot} />);
        }
        return <View style={styles.dotGridContainer}>{dots}</View>;
    };

    return (
        <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
                            <Ionicons name="sparkles" size={18} color="#FBBF24" />
                            <Text style={styles.headerTitle}>
                                <Text style={{ color: '#FBBF24' }}>Marketing </Text>
                                <Text style={{ color: '#F97316' }}>Card </Text>
                                <Text style={{ color: '#F43F5E' }}>Generator</Text>
                            </Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Design & download beautiful promo cards</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Visualizer - Sticky Top in Web, here we put it at top of ScrollView */}
                        <View style={styles.previewContainer}>
                            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={styles.viewShot}>
                                <LinearGradient
                                    colors={activeStyle.colors as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.cardFrame}
                                >
                                    {showCircles && (
                                        <>
                                            <View style={styles.bgCircleTop} />
                                            <View style={styles.bgCircleBottom} />
                                        </>
                                    )}
                                    {showDots && renderDots()}

                                    <View style={styles.cardTop}>
                                        <Text style={styles.tagline}>{tagline}</Text>
                                        <Text style={styles.restaurantName}>{restaurantName}</Text>
                                        <View style={[styles.divider, { backgroundColor: activeStyle.divider }]} />
                                    </View>

                                    <View style={styles.cardMiddle}>
                                        {middleDecoType === "stars" && (
                                            <Text style={{ color: "#FFD700", fontSize: rf(12), marginBottom: vs(4), letterSpacing: 2 }}>★ ★ ★ ★ ★</Text>
                                        )}
                                        {middleDecoType === "emoji" && (
                                            <Text style={{ fontSize: rf(24), marginBottom: vs(4) }}>{emojiDeco}</Text>
                                        )}
                                        {(middleDecoType === "badge" || middleDecoType === "emoji" || middleDecoType === "stars") && (
                                            <View style={[styles.badge, { backgroundColor: activeStyle.badgeBg, borderColor: activeStyle.badgeBorder }]}>
                                                <Text style={[styles.badgePercent, { color: useCustomGradient ? "#FFF" : activeStyle.accentText }]}>{offerPercent}</Text>
                                                <Text style={[styles.badgeOff, { color: useCustomGradient ? "rgba(255,255,255,0.8)" : activeStyle.accentText }]}>{offerOffText}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.cardOfferTitle} numberOfLines={2}>{offerTitle}</Text>
                                        <Text style={styles.cardOfferSub}>{offerSubtitle}</Text>
                                    </View>

                                    <View style={styles.cardBottom}>
                                        <Text style={[styles.validityText, { color: activeStyle.validityColor }]}>{validity}</Text>
                                        <View style={[styles.ctaBtn, { backgroundColor: activeStyle.ctaBg, borderColor: activeStyle.ctaBorder }]}>
                                            <Text style={[styles.ctaBtnText, { color: activeStyle.ctaText }]}>{ctaText}</Text>
                                        </View>
                                        <View style={styles.phoneContainer}>
                                            <Ionicons name="call" size={rf(10)} color={activeStyle.phoneColor} />
                                            <Text style={[styles.phoneText, { color: activeStyle.phoneColor }]}>{phoneNumber}</Text>
                                        </View>
                                    </View>
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

                        {/* Editor Form - The 4 Cards matching Web */}
                        <View style={styles.editorBox}>



                            {/* 1. Header Branding */}
                            <View style={styles.cardForm}>
                                <View style={styles.cardFormHeader}>
                                    <View style={[styles.indicatorDot, { backgroundColor: '#F97316' }]} />
                                    <Text style={styles.cardFormTitle}>1. Header Branding</Text>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Restaurant Name</Text>
                                    <TextInput style={styles.input} value={restaurantName} onChangeText={setRestaurantName} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Tagline / Header Accent</Text>
                                    <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                            </View>

                            {/* 2. Offer Values & Text */}
                            <View style={styles.cardForm}>
                                <View style={styles.cardFormHeader}>
                                    <View style={[styles.indicatorDot, { backgroundColor: '#10B981' }]} />
                                    <Text style={styles.cardFormTitle}>2. Offer Values & Text</Text>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                        <Text style={styles.label}>Percent / Value</Text>
                                        <TextInput style={styles.input} value={offerPercent} onChangeText={setOfferPercent} placeholderTextColor="rgba(255,255,255,0.3)" />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Suffix (e.g. OFF)</Text>
                                        <TextInput style={styles.input} value={offerOffText} onChangeText={setOfferOffText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Decoration</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                        {[
                                            { label: 'Badge', value: 'badge' },
                                            { label: 'Stars', value: 'stars' },
                                            { label: 'Emoji', value: 'emoji' },
                                            { label: 'None', value: 'none' }
                                        ].map((type) => (
                                            <TouchableOpacity
                                                key={type.value}
                                                style={[styles.decoBtn, middleDecoType === type.value && styles.decoBtnActive]}
                                                onPress={() => setMiddleDecoType(type.value as any)}
                                            >
                                                <Text style={[styles.decoBtnText, middleDecoType === type.value && styles.decoBtnTextActive]}>
                                                    {type.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {middleDecoType === 'emoji' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Select Emoji Icon</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
                                            {["🍽️", "👨‍👩‍👧‍👦", "👑", "🍕", "🍔", "⚡", "🔥", "🍗"].map(emo => (
                                                <TouchableOpacity
                                                    key={emo}
                                                    onPress={() => setEmojiDeco(emo)}
                                                    style={[styles.emojiBtn, emojiDeco === emo && styles.emojiBtnActive]}
                                                >
                                                    <Text style={{ fontSize: rf(16) }}>{emo}</Text>
                                                </TouchableOpacity>
                                            ))}
                                            <TextInput
                                                style={styles.emojiInput}
                                                value={emojiDeco}
                                                onChangeText={setEmojiDeco}
                                                maxLength={3}
                                            />
                                        </View>
                                    </View>
                                )}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Promo Title</Text>
                                    <TextInput style={styles.input} value={offerTitle} onChangeText={setOfferTitle} placeholder="e.g. Grand Discount Offer" placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Promo Subtitle / Terms</Text>
                                    <TextInput style={styles.input} value={offerSubtitle} onChangeText={setOfferSubtitle} placeholder="e.g. Dine-in & Takeaway • All Items" placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                            </View>

                            {/* 3. Footer & Call to Action */}
                            <View style={styles.cardForm}>
                                <View style={styles.cardFormHeader}>
                                    <View style={[styles.indicatorDot, { backgroundColor: '#3B82F6' }]} />
                                    <Text style={styles.cardFormTitle}>3. Footer & Call to Action</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Validity Info Text</Text>
                                    <TextInput style={styles.input} value={validity} onChangeText={setValidity} placeholderTextColor="rgba(255,255,255,0.3)" />
                                </View>
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                        <Text style={styles.label}>Button Text</Text>
                                        <TextInput style={styles.input} value={ctaText} onChangeText={setCtaText} placeholderTextColor="rgba(255,255,255,0.3)" />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Phone Number / Contact</Text>
                                        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholderTextColor="rgba(255,255,255,0.3)" />
                                    </View>
                                </View>
                            </View>

                            {/* 4. Aesthetics & Palette */}
                            <View style={styles.cardForm}>
                                <View style={styles.cardFormHeaderFlex}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.indicatorDot, { backgroundColor: '#A855F7' }]} />
                                        <Text style={styles.cardFormTitle}>4. Aesthetics & Palette</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
                                        <Text style={styles.smallToggleText}>Use Custom</Text>
                                        <Switch
                                            value={useCustomGradient}
                                            onValueChange={setUseCustomGradient}
                                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(249, 115, 22, 0.3)' }}
                                            thumbColor={useCustomGradient ? '#F97316' : '#FFF'}
                                        />
                                    </View>
                                </View>

                                {!useCustomGradient ? (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Select Preset Theme</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(10) }}>
                                            {THEMES.map(theme => (
                                                <TouchableOpacity
                                                    key={theme.id}
                                                    style={[styles.themeBtnBox, selectedThemeId === theme.id && styles.themeBtnBoxActive]}
                                                    onPress={() => setSelectedThemeId(theme.id)}
                                                >
                                                    <LinearGradient
                                                        colors={theme.colors as any}
                                                        style={styles.themeSwatchBox}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                    />
                                                    <Text style={[styles.themeBtnTextBox, selectedThemeId === theme.id && styles.themeBtnTextActive]}>
                                                        {theme.name}
                                                    </Text>
                                                    {selectedThemeId === theme.id && (
                                                        <View style={styles.themeCheck}>
                                                            <Ionicons name="checkmark" size={10} color="#FFF" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.customColorsBox}>
                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                                <Text style={styles.label}>Grad Color 1</Text>
                                                <TextInput style={styles.inputSmall} value={customGradColor1} onChangeText={setCustomGradColor1} />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Grad Color 2</Text>
                                                <TextInput style={styles.inputSmall} value={customGradColor2} onChangeText={setCustomGradColor2} />
                                            </View>
                                        </View>
                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                                <Text style={styles.label}>Divider Color</Text>
                                                <TextInput style={styles.inputSmall} value={customDividerColor} onChangeText={setCustomDividerColor} />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>CTA Button Bg</Text>
                                                <TextInput
                                                    style={styles.inputSmall}
                                                    value={customCtaBgColor}
                                                    onChangeText={(val) => {
                                                        setCustomCtaBgColor(val);
                                                        setCustomCtaTextColor(val === "#ffffff" || val.toLowerCase() === "#fff" ? "#000000" : "#ffffff");
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.row}>
                                    <View style={[styles.toggleRowBox, { marginRight: s(10) }]}>
                                        <View>
                                            <Text style={styles.toggleRowTitle}>Backdrop Circles</Text>
                                            <Text style={styles.toggleRowSub}>Show visual circles</Text>
                                        </View>
                                        <Switch
                                            value={showCircles}
                                            onValueChange={setShowCircles}
                                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(249, 115, 22, 0.3)' }}
                                            thumbColor={showCircles ? '#F97316' : '#FFF'}
                                        />
                                    </View>
                                    <View style={styles.toggleRowBox}>
                                        <View>
                                            <Text style={styles.toggleRowTitle}>Dot Patterns</Text>
                                            <Text style={styles.toggleRowSub}>Show dot grid</Text>
                                        </View>
                                        <Switch
                                            value={showDots}
                                            onValueChange={setShowDots}
                                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(249, 115, 22, 0.3)' }}
                                            thumbColor={showDots ? '#F97316' : '#FFF'}
                                        />
                                    </View>
                                </View>
                            </View>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontSize: rf(20), // Reduced font size
        fontWeight: '900',
    },
    headerSubtitle: {
        fontSize: rf(11),
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginTop: vs(2),
    },
    scrollContent: {
        paddingBottom: vs(60),
    },
    previewContainer: {
        alignItems: 'center',
        paddingVertical: vs(24),
    },
    viewShot: {
        width: s(290),
        height: vs(360),
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
    bgCircleTop: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    bgCircleBottom: {
        position: 'absolute',
        bottom: -60,
        left: -50,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    dotGridContainer: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 44,
        opacity: 0.15,
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    cardTop: {
        alignItems: 'center',
        zIndex: 10,
    },
    tagline: {
        fontSize: rf(8),
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: vs(4),
    },
    restaurantName: {
        fontSize: rf(20),
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    divider: {
        width: s(40),
        height: vs(2),
        borderRadius: s(2),
        marginTop: vs(8),
    },
    cardMiddle: {
        alignItems: 'center',
        zIndex: 10,
        width: '100%',
    },
    badge: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(12),
    },
    badgePercent: {
        fontSize: rf(24),
        fontWeight: '900',
    },
    badgeOff: {
        fontSize: rf(9),
        fontWeight: 'bold',
        marginTop: vs(2),
    },
    cardOfferTitle: {
        fontSize: rf(14),
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: vs(4),
    },
    cardOfferSub: {
        fontSize: rf(9),
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    cardBottom: {
        alignItems: 'center',
        zIndex: 10,
    },
    validityText: {
        fontSize: rf(8),
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: vs(8),
    },
    ctaBtn: {
        paddingHorizontal: s(24),
        paddingVertical: vs(8),
        borderRadius: s(20),
        borderWidth: 1,
    },
    ctaBtnText: {
        fontSize: rf(10),
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(4),
        marginTop: vs(6),
    },
    phoneText: {
        fontSize: rf(9),
        fontWeight: 'bold',
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
    syncCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: s(20),
        padding: s(16),
    },
    syncHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(6),
    },
    syncTitle: {
        fontSize: rf(9),
        fontWeight: '900',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1,
    },
    systemOfferPill: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: s(16),
        paddingVertical: vs(8),
        borderRadius: s(12),
        marginRight: s(8),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    systemOfferPillText: {
        fontSize: rf(12),
        fontWeight: 'bold',
        color: '#FFF',
    },
    cardForm: {
        backgroundColor: '#151233',
        borderRadius: s(24),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: s(20),
    },
    cardFormHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: vs(12),
        marginBottom: vs(16),
        gap: s(8),
    },
    cardFormHeaderFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: vs(12),
        marginBottom: vs(16),
    },
    indicatorDot: {
        width: s(10),
        height: s(10),
        borderRadius: s(5),
    },
    cardFormTitle: {
        fontSize: rf(12),
        fontWeight: '900',
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    smallToggleText: {
        fontSize: rf(10),
        color: 'rgba(255,255,255,0.6)',
    },
    inputGroup: {
        marginBottom: vs(16),
    },
    label: {
        fontSize: rf(9),
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: vs(6),
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
    inputSmall: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: s(12),
        height: vs(44),
        paddingHorizontal: s(12),
        fontSize: rf(12),
        fontWeight: '600',
        color: '#FFF',
    },
    row: {
        flexDirection: 'row',
    },
    decoBtn: {
        paddingHorizontal: s(16),
        paddingVertical: vs(10),
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: s(8),
    },
    decoBtnActive: {
        backgroundColor: '#F97316',
        borderColor: '#F97316',
    },
    decoBtnText: {
        fontSize: rf(12),
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)',
    },
    decoBtnTextActive: {
        color: '#FFF',
    },
    emojiBtn: {
        width: s(44),
        height: s(44),
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    emojiBtnActive: {
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderWidth: 1,
        borderColor: '#F97316',
    },
    emojiInput: {
        width: s(54),
        height: s(44),
        borderRadius: s(12),
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        textAlign: 'center',
        fontSize: rf(16),
        color: '#FFF',
    },
    themeBtnBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: s(8),
        borderRadius: s(16),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '47%', // roughly 2 cols
        marginBottom: vs(10),
    },
    themeBtnBoxActive: {
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    themeSwatchBox: {
        width: s(24),
        height: s(24),
        borderRadius: s(6),
        marginRight: s(8),
    },
    themeBtnTextBox: {
        fontSize: rf(11),
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        flex: 1,
    },
    themeBtnTextActive: {
        color: '#FFF',
        fontWeight: '900',
    },
    themeCheck: {
        width: s(16),
        height: s(16),
        borderRadius: s(8),
        backgroundColor: '#F97316',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customColorsBox: {
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        padding: s(16),
        borderRadius: s(16),
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.2)',
        marginBottom: vs(16),
    },
    toggleRowBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: s(12),
        borderRadius: s(16),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    toggleRowTitle: {
        fontSize: rf(11),
        fontWeight: 'bold',
        color: '#FFF',
    },
    toggleRowSub: {
        fontSize: rf(9),
        color: 'rgba(255,255,255,0.5)',
        marginTop: vs(2),
    }
});

