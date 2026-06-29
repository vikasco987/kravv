import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import { menuService, uploadToCloudinary } from "../../services/menuService";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

interface QuickAddItemModalProps {
    visible: boolean;
    onClose: () => void;
    categoryId: string;
    onSuccess: () => void;
}

export const QuickAddItemModal: React.FC<QuickAddItemModalProps> = ({
    visible,
    onClose,
    categoryId,
    onSuccess,
}) => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [taxType, setTaxType] = useState<"Without Tax" | "With Tax">("Without Tax");
    const [gstPercent, setGstPercent] = useState<number | null>(null);
    const [hsnCode, setHsnCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [variants, setVariants] = useState<{ name: string, price: string }[]>([]);

    const gstOptions = [5, 12, 18, 28];

    const resetForm = () => {
        setName("");
        setPrice("");
        setImage(null);
        setTaxType("Without Tax");
        setGstPercent(null);
        setHsnCode("");
        setUploadedImageUrl("");
        setIsUploadingImage(false);
        setVariants([]);
    };

    useEffect(() => {
        if (!visible) {
            resetForm();
        }
    }, [visible]);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                ToastAndroid.show("Permission required to access gallery", ToastAndroid.SHORT);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const localUri = result.assets[0].uri;
                setImage(localUri);
                setIsUploadingImage(true);
                // Eager upload in background
                (async () => {
                    try {
                        const url = await uploadImageToCloudinary(localUri);
                        setUploadedImageUrl(url);
                    } catch (err) {
                        console.error("Quick Add Eager Upload Error:", err);
                    } finally {
                        setIsUploadingImage(false);
                    }
                })();
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            ToastAndroid.show("Error picking image", ToastAndroid.SHORT);
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
        try {
            return await uploadToCloudinary(uri);
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            throw error;
        }
    };

    const handleAddItem = async () => {
        if (!name.trim()) {
            ToastAndroid.show("Please enter item name", ToastAndroid.SHORT);
            return;
        }
        if (!price.trim()) {
            ToastAndroid.show("Please enter sale price", ToastAndroid.SHORT);
            return;
        }

        try {
            setIsSaving(true);

            let finalImageUrl = uploadedImageUrl || "";
            if (!finalImageUrl && image && !image.startsWith('http')) {
                finalImageUrl = await uploadImageToCloudinary(image);
            }

            const itemPrice = parseFloat(price);

            // 🚀 UI OPTIMISTIC (Local Sync Only)
            const tempId = `temp-${Date.now()}`;
            try {
                const cachedData = await AsyncStorage.getItem('@cached_menu');
                if (cachedData) {
                    let menus = JSON.parse(cachedData);
                    const catIndex = menus.findIndex((c: any) => String(c.id) === String(categoryId));
                    if (catIndex !== -1) {
                        const optimisticItem = {
                            id: tempId,
                            name: name.trim(),
                            price: itemPrice,
                            sellingPrice: itemPrice,
                            imageUrl: finalImageUrl || null,
                            unit: "pcs",
                            taxType: taxType,
                            gst: gstPercent,
                            hsnCode: hsnCode.trim(),
                            variants: variants.filter(v => v.price !== "")
                        };
                        if (!menus[catIndex].items) menus[catIndex].items = [];
                        menus[catIndex].items = [optimisticItem, ...menus[catIndex].items];
                        await AsyncStorage.setItem('@cached_menu', JSON.stringify(menus));
                        DeviceEventEmitter.emit('refresh_menu_data');
                    }
                }
            } catch (e) { console.error("Quick Add Optimistic Error:", e); }

            // Instant Feedback
            onSuccess();
            onClose();
            ToastAndroid.show("Item added successfully", ToastAndroid.SHORT);

            // Network Save
            const authToken = await getToken();
            const staffSession = await StaffPermissionEngine.getSession();
            const finalToken = authToken || staffSession?.token;
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

            if (finalToken) {
                await menuService.createItem(finalToken, {
                    name: name.trim(),
                    price: itemPrice,
                    sellingPrice: itemPrice,
                    categoryId: categoryId,
                    imageUrl: finalImageUrl || null,
                    unit: "pcs",
                    taxStatus: taxType,
                    gst: Number(gstPercent || 0),
                    hsnCode: hsnCode.trim(),
                    isVeg: true,
                    currentStock: 0,
                    businessId: bId,
                    variants: variants.filter(v => v.price !== "")
                });
                DeviceEventEmitter.emit('refresh_menu_data');
            }
        } catch (error: any) {
            console.error("Add item error:", error);
            ToastAndroid.show(error.message || "Something went wrong", ToastAndroid.SHORT);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.pressableOverlay} onPress={onClose} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Quick Add Item</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={rf(24)} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(20), gap: vs(16) }}>
                        <View style={styles.imageGroup}>
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera" size={rf(28)} color="#4F46E5" />
                                        <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {image && (
                                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                                    <Ionicons name="close-circle" size={rf(20)} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Item Name <Text style={{ color: '#EF4444' }}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tap to Enter"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Sale Price</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="Tap to Enter"
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vs(8) }}>
                                <Text style={[styles.label, { marginBottom: 0, marginRight: s(10) }]}>Variants Category</Text>
                                <TouchableOpacity onPress={() => setVariants([...variants, { name: "", price: "" }])}>
                                    <View style={styles.addCategoryBtnSmall}><Ionicons name="add" size={rf(16)} color="#4F46E5" /></View>
                                </TouchableOpacity>
                            </View>

                            {variants.map((v, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vs(10) }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, padding: s(10), marginRight: s(4) }]}
                                        placeholder="Variant Name (e.g. Half)"
                                        placeholderTextColor="#9CA3AF"
                                        value={v.name}
                                        onChangeText={(txt) => {
                                            const newV = [...variants];
                                            newV[index].name = txt;
                                            setVariants(newV);
                                        }}
                                    />
                                    <TextInput
                                        style={[styles.input, { flex: 1, padding: s(10), marginLeft: s(4), marginRight: s(4) }]}
                                        placeholder="Price"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={v.price}
                                        onChangeText={(txt) => {
                                            const newV = [...variants];
                                            newV[index].price = txt;
                                            setVariants(newV);
                                        }}
                                    />
                                    <TouchableOpacity onPress={() => {
                                        const newV = [...variants];
                                        newV.splice(index, 1);
                                        setVariants(newV);
                                    }}>
                                        <Ionicons name="trash-outline" size={rf(20)} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>HSN Code</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter HSN (Optional)"
                                value={hsnCode}
                                onChangeText={setHsnCode}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.taxSection}>
                            <TouchableOpacity
                                style={[styles.taxBtn, taxType === "Without Tax" && styles.taxBtnActive]}
                                onPress={() => setTaxType("Without Tax")}
                            >
                                <Text style={[styles.taxBtnText, taxType === "Without Tax" && styles.taxBtnTextActive]}>Without Tax</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.taxBtn, taxType === "With Tax" && styles.taxBtnActive]}
                                onPress={() => setTaxType("With Tax")}
                            >
                                <Text style={[styles.taxBtnText, taxType === "With Tax" && styles.taxBtnTextActive]}>With Tax</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.gstSection}>
                            {gstOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.gstBtn, gstPercent === opt && styles.gstBtnActive]}
                                    onPress={() => setGstPercent(opt)}
                                >
                                    <Text style={[styles.gstBtnText, gstPercent === opt && styles.gstBtnTextActive]}>GST @ {opt}%</Text>
                                </TouchableOpacity>
                            ))}
                            <View style={styles.customGstContainer}>
                                <TextInput
                                    style={styles.customGstInput}
                                    placeholder="Other %"
                                    keyboardType="numeric"
                                    onChangeText={(val) => setGstPercent(val ? parseFloat(val) : null)}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleAddItem}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Add Item</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pressableOverlay: {
        flex: 1,
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: s(24),
        borderTopRightRadius: s(24),
        padding: s(20),
        paddingBottom: vs(60),
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(20),
    },
    title: {
        fontSize: rf(18),
        fontWeight: '700',
        color: '#111827',
    },
    form: {
        gap: vs(16),
    },
    imageGroup: {
        alignItems: 'center',
        marginBottom: vs(10),
    },
    imagePicker: {
        width: s(80),
        height: s(80),
        borderRadius: s(12),
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#FCFDFF',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: rf(10),
        color: '#4F46E5',
        marginTop: vs(2),
        fontWeight: '500',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -s(5),
        right: '35%',
        backgroundColor: '#FFFFFF',
        borderRadius: s(10),
    },
    inputGroup: {
        gap: vs(6),
    },
    label: {
        fontSize: rf(14),
        color: '#6B7280',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(8),
        padding: s(12),
        fontSize: rf(16),
        color: '#111827',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(8),
        paddingHorizontal: s(12),
    },
    currency: {
        fontSize: rf(16),
        color: '#6B7280',
        marginRight: s(4),
    },
    priceInput: {
        flex: 1,
        paddingVertical: vs(12),
        fontSize: rf(16),
        color: '#111827',
    },
    taxSection: {
        flexDirection: 'row',
        gap: s(12),
    },
    taxBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(8),
        paddingVertical: vs(10),
        alignItems: 'center',
        backgroundColor: '#FCFDFF',
    },
    taxBtnActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#F5F3FF',
    },
    taxBtnText: {
        fontSize: rf(14),
        color: '#374151',
        fontWeight: '500',
    },
    taxBtnTextActive: {
        color: '#4F46E5',
    },
    gstSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: s(8),
    },
    gstBtn: {
        paddingHorizontal: s(10),
        paddingVertical: vs(6),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: s(6),
        backgroundColor: '#FCFDFF',
    },
    gstBtnActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#F5F3FF',
    },
    gstBtnText: {
        fontSize: rf(12),
        color: '#374151',
        fontWeight: '400',
    },
    gstBtnTextActive: {
        color: '#4F46E5',
    },
    customGstContainer: {
        width: s(70),
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
        marginLeft: s(8),
    },
    customGstInput: {
        fontSize: rf(12),
        paddingVertical: 0,
        color: '#111827',
    },
    submitBtn: {
        backgroundColor: '#2563EB',
        borderRadius: s(10),
        paddingVertical: vs(14),
        alignItems: 'center',
        marginTop: vs(8),
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: rf(16),
        fontWeight: '600',
    },
    addCategoryBtnSmall: {
        backgroundColor: '#EEF2FF',
        borderRadius: s(8),
        width: s(24),
        height: s(24),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4F46E5'
    },
});
