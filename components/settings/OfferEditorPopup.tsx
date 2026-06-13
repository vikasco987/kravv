import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Offer } from '../../services/offerService';
import { rf, s, vs } from '../../utils/responsive';
import { CustomDatePicker } from './CustomDatePicker';

interface OfferEditorPopupProps {
    visible: boolean;
    offer: Offer | null;
    onClose: () => void;
    onSave: (offerData: Partial<Offer>) => void;
    isSaving: boolean;
}

export const OfferEditorPopup: React.FC<OfferEditorPopupProps> = ({
    visible,
    offer,
    onClose,
    onSave,
    isSaving,
}) => {
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '',
        maxDiscount: '',
        startDate: '',
        endDate: '',
        usageLimit: '',
        isActive: true,
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [keyboardPadding, setKeyboardPadding] = useState(0);

    React.useEffect(() => {
        if (Platform.OS === 'android') {
            const showSub = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardPadding(e.endCoordinates.height));
            const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardPadding(0));
            return () => {
                showSub.remove();
                hideSub.remove();
            };
        }
    }, []);

    const onStartDateChange = (selectedDate: string) => {
        setFormData(p => ({ ...p, startDate: selectedDate }));
        setShowStartDatePicker(false);
    };

    const onEndDateChange = (selectedDate: string) => {
        setFormData(p => ({ ...p, endDate: selectedDate }));
        setShowEndDatePicker(false);
    };

    React.useEffect(() => {
        if (visible) {
            if (offer) {
                setFormData({
                    title: offer.title,
                    code: offer.code || '',
                    discountType: offer.discountType,
                    discountValue: offer.discountValue?.toString() || '',
                    minOrderValue: offer.minOrderValue?.toString() || '',
                    maxDiscount: offer.maxDiscount?.toString() || '',
                    startDate: offer.startDate?.split('T')[0] || '',
                    endDate: offer.endDate?.split('T')[0] || '',
                    usageLimit: offer.usageLimit?.toString() || '',
                    isActive: offer.isActive,
                });
            } else {
                setFormData({
                    title: '',
                    code: '',
                    discountType: 'PERCENTAGE',
                    discountValue: '',
                    minOrderValue: '',
                    maxDiscount: '',
                    startDate: '',
                    endDate: '',
                    usageLimit: '',
                    isActive: true,
                });
            }
        }
    }, [visible, offer]);

    const handleSubmit = () => {
        if (!formData.title.trim()) {
            setValidationError("Please enter an Offer Title to continue.");
            return;
        }
        if (!formData.code.trim()) {
            setValidationError("Please enter a Coupon Code to continue.");
            return;
        }
        if (!formData.discountValue.trim() || isNaN(parseFloat(formData.discountValue))) {
            setValidationError("Please enter a valid Discount Value.");
            return;
        }

        setValidationError(null);
        onSave({
            title: formData.title,
            code: formData.code.toUpperCase() || null,
            discountType: formData.discountType,
            discountValue: parseFloat(formData.discountValue) || 0,
            minOrderValue: parseFloat(formData.minOrderValue) || null,
            maxDiscount: parseFloat(formData.maxDiscount) || null,
            startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            usageLimit: parseInt(formData.usageLimit) || null,
            isActive: formData.isActive,
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={[styles.overlay, { paddingBottom: Platform.OS === 'android' ? keyboardPadding : 0 }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, justifyContent: 'flex-end' }}
                >
                    <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>{offer ? "Edit Offer" : "New Promotion"}</Text>
                            <Text style={styles.headerSubtitle}>Define discount rules and codes</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>OFFER TITLE</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Offer Name (e.g. Diwali Sale)"
                                placeholderTextColor="#9CA3AF"
                                value={formData.title}
                                onChangeText={(t) => setFormData(p => ({ ...p, title: t }))}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                <Text style={styles.label}>COUPON CODE</Text>
                                <TextInput
                                    style={[styles.input, { textTransform: 'uppercase' }]}
                                    placeholder="Enter Code (e.g. SAVE25)"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.code}
                                    onChangeText={(t) => setFormData(p => ({ ...p, code: t }))}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>TYPE</Text>
                                <View style={styles.typeSelector}>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, formData.discountType === 'PERCENTAGE' && styles.typeBtnActive]}
                                        onPress={() => setFormData(p => ({ ...p, discountType: 'PERCENTAGE' }))}
                                    >
                                        <Text style={[styles.typeText, formData.discountType === 'PERCENTAGE' && styles.typeTextActive]}>%</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, formData.discountType === 'FLAT' && styles.typeBtnActive]}
                                        onPress={() => setFormData(p => ({ ...p, discountType: 'FLAT' }))}
                                    >
                                        <Text style={[styles.typeText, formData.discountType === 'FLAT' && styles.typeTextActive]}>₹</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                <Text style={styles.label}>VALUE</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Value (e.g. 25)"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={formData.discountValue}
                                    onChangeText={(t) => setFormData(p => ({ ...p, discountValue: t }))}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>MIN BILLING (₹)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Min Bill (e.g. 500)"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={formData.minOrderValue}
                                    onChangeText={(t) => setFormData(p => ({ ...p, minOrderValue: t }))}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                <Text style={styles.label}>VALID FROM</Text>
                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center' }]}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Text style={{ color: formData.startDate ? '#111827' : '#9CA3AF', fontSize: rf(14), fontWeight: '700' }}>
                                        {formData.startDate || "Select Date"}
                                    </Text>
                                </TouchableOpacity>
                                {showStartDatePicker && (
                                    <CustomDatePicker
                                        visible={showStartDatePicker}
                                        onClose={() => setShowStartDatePicker(false)}
                                        initialDate={formData.startDate}
                                        onSelect={onStartDateChange}
                                    />
                                )}
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>VALID UNTIL</Text>
                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center' }]}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Text style={{ color: formData.endDate ? '#111827' : '#9CA3AF', fontSize: rf(14), fontWeight: '700' }}>
                                        {formData.endDate || "Select Date"}
                                    </Text>
                                </TouchableOpacity>
                                {showEndDatePicker && (
                                    <CustomDatePicker
                                        visible={showEndDatePicker}
                                        onClose={() => setShowEndDatePicker(false)}
                                        initialDate={formData.endDate}
                                        minimumDate={formData.startDate}
                                        onSelect={onEndDateChange}
                                    />
                                )}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: s(10) }]}>
                                <Text style={styles.label}>MAX USES</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Uses (e.g. 100)"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={formData.usageLimit}
                                    onChangeText={(t) => setFormData(p => ({ ...p, usageLimit: t }))}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>MAX DISCOUNT (₹)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Max Disc (e.g. 150)"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={formData.maxDiscount}
                                    onChangeText={(t) => setFormData(p => ({ ...p, maxDiscount: t }))}
                                />
                            </View>
                        </View>

                        <View style={styles.activeToggleRow}>
                            <View>
                                <Text style={styles.activeToggleLabel}>Offer Status</Text>
                                <Text style={styles.activeToggleSub}>{formData.isActive ? 'Active on Store' : 'Draft / Paused'}</Text>
                            </View>
                            <Switch
                                value={formData.isActive}
                                onValueChange={(v) => setFormData(p => ({ ...p, isActive: v }))}
                                trackColor={{ false: "#D1D5DB", true: "#FCD34D" }}
                                thumbColor={formData.isActive ? "#F59E0B" : "#F3F4F6"}
                            />
                        </View>

                        <View style={{ height: vs(40) }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveBtnText}>{offer ? "Update Offer" : "Launch Promotion 🚀"}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Custom Beautiful Popup */}
                    {validationError && (
                        <View style={styles.customPopupOverlay}>
                            <View style={styles.customPopup}>
                                <View style={styles.popupIconBox}>
                                    <Ionicons name="warning" size={24} color="#EF4444" />
                                </View>
                                <Text style={styles.popupTitle}>Missing Details</Text>
                                <Text style={styles.popupMessage}>{validationError}</Text>
                                <TouchableOpacity style={styles.popupBtn} onPress={() => setValidationError(null)}>
                                    <Text style={styles.popupBtnText}>Okay</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: s(32),
        borderTopRightRadius: s(32),
        height: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: s(24),
        paddingTop: vs(24),
        paddingBottom: vs(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: rf(12),
        fontWeight: '500',
        color: '#6B7280',
        marginTop: vs(2),
    },
    closeBtn: {
        padding: s(8),
        backgroundColor: '#F3F4F6',
        borderRadius: s(12),
    },
    formContainer: {
        padding: s(24),
    },
    inputGroup: {
        marginBottom: vs(20),
    },
    label: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#9CA3AF',
        marginBottom: vs(8),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(12),
        height: vs(50),
        paddingHorizontal: s(16),
        fontSize: rf(14),
        fontWeight: '700',
        color: '#111827',
    },
    row: {
        flexDirection: 'row',
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: s(12),
        height: vs(50),
        padding: s(4),
    },
    typeBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: s(10),
    },
    typeBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    typeText: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#6B7280',
    },
    typeTextActive: {
        color: '#F59E0B',
    },
    activeToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: s(16),
        borderRadius: s(16),
        borderWidth: 1,
        borderColor: '#FEF3C7',
        marginTop: vs(8),
    },
    activeToggleLabel: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#B45309',
    },
    activeToggleSub: {
        fontSize: rf(11),
        fontWeight: '600',
        color: '#D97706',
        marginTop: vs(2),
    },
    footer: {
        padding: s(24),
        paddingBottom: Platform.OS === 'ios' ? s(32) : s(48), // Push button above phone patti
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveBtn: {
        backgroundColor: '#F59E0B',
        height: vs(56),
        borderRadius: s(16),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    saveBtnText: {
        fontSize: rf(16),
        fontWeight: '900',
        color: '#FFF',
    },
    customPopupOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        borderRadius: s(32),
    },
    customPopup: {
        width: s(260),
        backgroundColor: '#FFF',
        borderRadius: s(24),
        padding: s(24),
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    popupIconBox: {
        width: s(50),
        height: s(50),
        borderRadius: s(25),
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(12),
    },
    popupTitle: {
        fontSize: rf(16),
        fontWeight: '900',
        color: '#111827',
        marginBottom: vs(6),
    },
    popupMessage: {
        fontSize: rf(12),
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: vs(20),
        lineHeight: rf(18),
    },
    popupBtn: {
        width: '100%',
        height: vs(44),
        backgroundColor: '#EF4444',
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupBtnText: {
        color: '#FFF',
        fontSize: rf(14),
        fontWeight: '900',
    },
});

