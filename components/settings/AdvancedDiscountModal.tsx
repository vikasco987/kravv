import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rf, s, vs } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
    primary: '#4F46E5',
    bg: '#F3F4F6',
    white: '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
    purple: '#6D28D9',
    success: '#10B981',
    error: '#EF4444',
};

interface Offer {
    id: string;
    offerTo: 'REPEAT' | 'ALL';
    name: string;
    percent: string;
    maxAmount: string;
    minBill: string;
    repeatCycle: string;
    printTnc: boolean;
}

const DEFAULT_OFFER: Partial<Offer> = {
    offerTo: 'REPEAT',
    name: '',
    percent: '0.0',
    maxAmount: '0.0',
    minBill: '0.0',
    repeatCycle: '365',
    printTnc: false,
};

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const AdvancedDiscountModal: React.FC<Props> = ({ visible, onClose }) => {
    // Current form states
    const [currentOffer, setCurrentOffer] = useState<Partial<Offer>>(DEFAULT_OFFER);
    const [status1, setStatus1] = useState(false);
    const [status2, setStatus2] = useState(false);

    // Lists of active coupons
    const [offers1, setOffers1] = useState<Offer[]>([]);
    const [offers2, setOffers2] = useState<Offer[]>([]);

    useEffect(() => {
        if (visible) {
            loadDiscounts();
        }
    }, [visible]);

    const loadDiscounts = async () => {
        try {
            const data = await AsyncStorage.getItem('@advanced_discounts_v2');
            if (data) {
                const parsed = JSON.parse(data);
                setOffers1(parsed.o1 || []);
                setOffers2(parsed.o2 || []);
                setStatus1(parsed.s1 || false);
                setStatus2(parsed.s2 || false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddOffer = (section: 1 | 2) => {
        if (!currentOffer.name || !currentOffer.percent) {
            Alert.alert("Error", "Please fill Name and Percentage");
            return;
        }

        const newOffer: Offer = {
            ...currentOffer as Offer,
            id: Date.now().toString(),
        };

        if (section === 1) {
            setOffers1([...offers1, newOffer]);
        } else {
            setOffers2([...offers2, newOffer]);
        }
        
        // Reset form but keep last mode for convenience
        setCurrentOffer({ ...DEFAULT_OFFER, offerTo: currentOffer.offerTo });
    };

    const handleDeleteOffer = (section: 1 | 2, id: string) => {
        if (section === 1) {
            setOffers1(offers1.filter(o => o.id !== id));
        } else {
            setOffers2(offers2.filter(o => o.id !== id));
        }
    };

    const handleSaveMain = async () => {
        try {
            const payload = { o1: offers1, o2: offers2, s1: status1, s2: status2 };
            await AsyncStorage.setItem('@advanced_discounts_v2', JSON.stringify(payload));
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const renderCoupon = (offer: Offer, section: 1 | 2) => (
        <View style={styles.couponCard} key={offer.id}>
            <View style={styles.couponTop}>
                <View style={styles.couponHeading}>
                    <Ionicons name="pricetag" size={16} color={COLORS.purple} />
                    <Text style={styles.couponName}>{offer.name}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteOffer(section, offer.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.couponBody}>
                <View style={styles.couponLeft}>
                    <Text style={styles.couponPercent}>{offer.percent}%</Text>
                    <Text style={styles.couponOff}>OFF</Text>
                </View>
                <View style={styles.couponInfo}>
                    <Text style={styles.couponTarget}>Target: <Text style={{fontWeight: 'bold', color: COLORS.purple}}>{offer.offerTo}</Text></Text>
                    <Text style={styles.couponDetailText}>Min: ₹{offer.minBill} | Max: ₹{offer.maxAmount}</Text>
                    {offer.offerTo === 'REPEAT' && <Text style={styles.couponDetailText}>Cycle: {offer.repeatCycle} days</Text>}
                </View>
            </View>
            {offer.printTnc && (
                <View style={styles.couponTnc}>
                    <Text style={styles.tncSmall}>*T&C Applied shown in printed bill</Text>
                </View>
            )}
            {/* Deleted undefined style reference */}
        </View>
    );

    const renderDiscountSection = (
        number: number,
        status: boolean,
        setStatus: (v: boolean) => void,
        offers: Offer[]
    ) => (
        <View style={styles.section} key={number}>
            <Text style={styles.sectionMainTitle}>{number}. DISCOUNT-{number}</Text>
            
            {/* Status Card */}
            <View style={styles.card}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.cardLabel}>{number}.1 Discount-{number} Status</Text>
                        <Text style={styles.cardSubLabel}>{status ? 'Enabled' : 'Disabled'}</Text>
                    </View>
                    <Switch
                        value={status}
                        onValueChange={setStatus}
                        trackColor={{ false: '#E5E7EB', true: COLORS.purple }}
                        thumbColor="#fff"
                    />
                </View>
            </View>

            {status && (
                <>
                    {/* Offer Creation Form */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>{number}.2 Create New Offer</Text>
                        
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, currentOffer.offerTo === 'REPEAT' && styles.tabActive]}
                                onPress={() => setCurrentOffer({ ...currentOffer, offerTo: 'REPEAT' })}
                            >
                                <Text style={[styles.tabText, currentOffer.offerTo === 'REPEAT' && styles.tabTextActive]}>REPEAT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, currentOffer.offerTo === 'ALL' && styles.tabActive]}
                                onPress={() => setCurrentOffer({ ...currentOffer, offerTo: 'ALL' })}
                            >
                                <Text style={[styles.tabText, currentOffer.offerTo === 'ALL' && styles.tabTextActive]}>ALL</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Discount Name</Text>
                            <TextInput
                                style={styles.input}
                                value={currentOffer.name}
                                onChangeText={(val) => setCurrentOffer({ ...currentOffer, name: val })}
                                placeholder="e.g. Festival Offer"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.row}>
                             <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Percent % *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentOffer.percent}
                                    keyboardType="decimal-pad"
                                    onChangeText={(val) => setCurrentOffer({ ...currentOffer, percent: val })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Max Amt *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentOffer.maxAmount}
                                    keyboardType="decimal-pad"
                                    onChangeText={(val) => setCurrentOffer({ ...currentOffer, maxAmount: val })}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                             <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Min Bill *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentOffer.minBill}
                                    keyboardType="decimal-pad"
                                    onChangeText={(val) => setCurrentOffer({ ...currentOffer, minBill: val })}
                                />
                            </View>
                            {currentOffer.offerTo === 'REPEAT' && (
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Repeat Cycle *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={currentOffer.repeatCycle}
                                        keyboardType="numeric"
                                        onChangeText={(val) => setCurrentOffer({ ...currentOffer, repeatCycle: val })}
                                    />
                                </View>
                            )}
                        </View>

                        <View style={[styles.row, {marginTop: 15}]}>
                            <Text style={styles.inputLabel}>Print TNC on Bill</Text>
                            <Switch
                                value={currentOffer.printTnc}
                                onValueChange={(v) => setCurrentOffer({...currentOffer, printTnc: v})}
                                trackColor={{ false: '#E5E7EB', true: COLORS.purple }}
                                thumbColor="#fff"
                            />
                        </View>

                        <TouchableOpacity style={styles.addOfferBtn} onPress={() => handleAddOffer(number as any)}>
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.addOfferBtnText}>Add Discount Coupon</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Active Coupons List */}
                    {offers.length > 0 && (
                        <View style={{ marginTop: vs(10) }}>
                            <Text style={styles.miniLabel}>ACTIVE COUPONS IN DISCOUNT-{number}</Text>
                            {offers.map(o => renderCoupon(o, number as any))}
                        </View>
                    )}
                </>
            )}
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <View style={styles.container}>
                <SafeAreaView style={{ backgroundColor: COLORS.purple }}>
                  <View style={styles.header}>
                      <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                          <Ionicons name="arrow-back" size={24} color="#fff" />
                      </TouchableOpacity>
                      <View>
                          <Text style={styles.headerTitle}>Settings | Discount</Text>
                          <Text style={styles.headerSub}>Advanced Multi-Coupon System</Text>
                      </View>
                  </View>
                </SafeAreaView>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scroll} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                        {renderDiscountSection(1, status1, setStatus1, offers1)}
                        {renderDiscountSection(2, status2, setStatus2, offers2)}
                    </ScrollView>
                </KeyboardAvoidingView>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMain}>
                    <Text style={styles.saveBtnText}>SAVE ALL</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        backgroundColor: COLORS.purple,
        paddingHorizontal: s(15),
        paddingTop: vs(50),
        paddingBottom: vs(15),
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: { marginRight: s(15) },
    headerTitle: { color: '#fff', fontSize: rf(18), fontWeight: 'bold' },
    headerSub: { color: '#fff', fontSize: rf(10), opacity: 0.8 },
    scroll: { padding: s(15), paddingBottom: vs(120) },
    section: { marginBottom: vs(25) },
    sectionMainTitle: {
        fontSize: rf(14),
        fontWeight: 'bold',
        color: COLORS.purple,
        marginBottom: vs(12),
        marginLeft: s(5),
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: s(10),
        padding: s(15),
        marginBottom: vs(12),
        elevation: 2,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLabel: { fontSize: rf(14), fontWeight: 'bold', color: '#000' },
    cardSubLabel: { fontSize: rf(12), color: COLORS.textLight, marginTop: vs(2) },
    tabContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.purple,
        borderRadius: s(5),
        overflow: 'hidden',
        marginTop: vs(15),
    },
    tab: { flex: 1, paddingVertical: vs(10), alignItems: 'center', backgroundColor: '#fff' },
    tabActive: { backgroundColor: COLORS.purple },
    tabText: { color: COLORS.purple, fontWeight: 'bold', fontSize: rf(14) },
    tabTextActive: { color: '#fff' },
    inputGroup: { marginTop: vs(15) },
    inputLabel: { fontSize: rf(11), color: COLORS.textLight, marginBottom: vs(5), fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: s(6),
        padding: s(10),
        fontSize: rf(15),
        color: '#000',
    },
    addOfferBtn: {
        backgroundColor: COLORS.success,
        marginTop: vs(20),
        paddingVertical: vs(12),
        borderRadius: s(8),
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addOfferBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    miniLabel: { fontSize: rf(10), fontWeight: 'bold', color: COLORS.textLight, marginBottom: vs(8), marginLeft: s(5) },
    couponCard: {
        backgroundColor: '#fff',
        borderRadius: s(12),
        padding: s(15),
        marginBottom: vs(10),
        borderWidth: 1,
        borderColor: COLORS.purple + "40",
        borderStyle: 'dashed',
    },
    couponTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10) },
    couponHeading: { flexDirection: 'row', alignItems: 'center' },
    couponName: { fontWeight: 'bold', fontSize: rf(16), marginLeft: 5, color: '#000' },
    couponBody: { flexDirection: 'row', alignItems: 'center' },
    couponLeft: {
        backgroundColor: COLORS.purple + "10",
        padding: s(10),
        borderRadius: s(8),
        alignItems: 'center',
        minWidth: s(60),
    },
    couponPercent: { fontSize: rf(20), fontWeight: '900', color: COLORS.purple },
    couponOff: { fontSize: rf(10), fontWeight: 'bold', color: COLORS.purple },
    couponInfo: { marginLeft: s(15), flex: 1 },
    couponTarget: { fontSize: rf(14), color: '#444' },
    couponDetailText: { fontSize: rf(12), color: COLORS.textLight, marginTop: 2 },
    couponTnc: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 5 },
    tncSmall: { fontSize: rf(10), fontStyle: 'italic', color: COLORS.textLight },
    saveBtn: {
        position: 'absolute',
        bottom: vs(50),
        right: s(20),
        backgroundColor: COLORS.purple,
        paddingHorizontal: s(40),
        paddingVertical: vs(15),
        borderRadius: s(30),
        elevation: 5,
    },
    saveBtnText: { color: '#fff', fontSize: rf(16), fontWeight: 'bold' },
});
