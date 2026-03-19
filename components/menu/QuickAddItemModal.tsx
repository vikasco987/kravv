import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from 'react';
import * as ImagePicker from "expo-image-picker";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ToastAndroid
} from 'react-native';
import { rf, s, vs } from "../../utils/responsive";

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
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [taxType, setTaxType] = useState<"Without Tax" | "With Tax">("Without Tax");
    const [gstPercent, setGstPercent] = useState<number | null>(null);
    const [hsnCode, setHsnCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const gstOptions = [5, 12, 18, 28];

    const resetForm = () => {
        setName("");
        setPrice("");
        setImage(null);
        setTaxType("Without Tax");
        setGstPercent(null);
        setHsnCode("");
    };

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
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            ToastAndroid.show("Error picking image", ToastAndroid.SHORT);
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
        const cloudName = "digpvlfup";
        const uploadPreset = "mybillingmenu";

        const formData = new FormData();
        const fileName = uri.split("/").pop() || "upload.jpg";
        const fileType = fileName.split(".").pop() || "jpg";

        // @ts-ignore
        formData.append("file", {
            uri: uri,
            type: `image/${fileType}`,
            name: fileName,
        });
        formData.append("upload_preset", uploadPreset);
        formData.append("cloud_name", cloudName);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json",
            },
        });

        const text = await response.text();
        let data: any;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Cloudinary error: ${text || "Empty response"}`);
        }

        if (!response.ok) {
            throw new Error(data.error?.message || `Cloudinary upload failed: ${text}`);
        }

        return data.secure_url;
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
            const token = await getToken();

            let finalImageUrl = "";
            if (image && (image.startsWith("file://") || image.startsWith("content://"))) {
                try {
                    finalImageUrl = await uploadImageToCloudinary(image);
                } catch (uploadError) {
                    console.error("Cloudinary Upload Error:", uploadError);
                }
            }
            
            const payload = {
                name: name.trim(),
                sellingPrice: parseFloat(price),
                price: parseFloat(price), 
                categoryId: categoryId,
                imageUrl: finalImageUrl,
                taxType: taxType,
                gst: gstPercent,
                hsnCode: hsnCode.trim(),
            };

            const response = await fetch("https://billing.kravy.in/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                ToastAndroid.show("Item added successfully!", ToastAndroid.SHORT);
                onSuccess();
                resetForm();
                onClose();
            } else {
                const errData = await response.json().catch(() => ({}));
                ToastAndroid.show(errData.message || "Failed to add item", ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error("Add item error:", error);
            ToastAndroid.show("Something went wrong", ToastAndroid.SHORT);
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

                    <View style={styles.form}>
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
                    </View>
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
});
