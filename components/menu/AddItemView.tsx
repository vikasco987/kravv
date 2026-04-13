import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
// @ts-ignore
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { PermissionGuard } from "../common/PermissionGuard";
import { LoginRequiredModal } from "../settings/LoginRequiredModal";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { AddItemCategory } from "./AddItemCategory";

const THEME_PRIMARY = "#4F46E5"; // Indigo
const COLOR_BG = "#F9FAFB";

interface AddItemViewProps {
    onBack?: () => void;
}

export default function AddItemView({ onBack }: AddItemViewProps) {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();
    const { t } = useLanguage();

    const [categories, setCategories] = useState<any[]>([]); // Objects with id and name
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isAddCatModalVisible, setIsAddCatModalVisible] = useState(false);
    const [allCategoriesList, setAllCategoriesList] = useState<{ id: string, name: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState("");
    const [isCustomGst, setIsCustomGst] = useState(false); // New: Tracking custom GST mode
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCategorySuccess, setShowCategorySuccess] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showClearSuccess, setShowClearSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState("");
    const [errorModalDetail, setErrorModalDetail] = useState("");
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [isStaffSignedIn, setIsStaffSignedIn] = useState(false);

    useEffect(() => {
        const checkStaff = async () => {
            const session = await AsyncStorage.getItem('staff_session');
            setIsStaffSignedIn(!!session);
        };
        checkStaff();
    }, []);

    const [newItem, setNewItem] = useState({
        name: "",
        price: "",
        category: "",
        categoryId: "", // Track DB ID
        imageUrl: "",
        taxType: "Without Tax" as "Without Tax" | "With Tax",
        gst: null as number | null,
        hsnCode: "",
    });

    const taxTypeOptions: ("Without Tax" | "With Tax")[] = ["Without Tax", "With Tax"];
    const gstOptions = [5, 12, 18, 28];

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const fetchCategories = useCallback(async () => {
        try {
            setIsLoadingCategories(true);
            const authToken = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || staffSession?.token;

            if (!finalToken && !bId) {
                setIsLoadingCategories(false);
                return;
            }

            const url = bId ? `https://billing.kravy.in/api/menu/view?businessId=${bId}` : "https://billing.kravy.in/api/menu/view";
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${finalToken}`,
                    "Cache-Control": "no-cache"
                },
            });

            if (!res.ok) {
                console.error(`❌ Categories fetch failed: ${res.status}`);
                return;
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.warn(`ℹ️ [Items] Received non-JSON response for categories. Body starts with: ${text.slice(0, 50)}`);
                return;
            }

            let data = await res.json();
            let items: any[] = [];
            let directCategories: any[] = [];

            if (Array.isArray(data)) {
                items = data;
            } else if (data && Array.isArray(data.menus)) {
                // Backend is returning nested categories
                directCategories = data.menus.map((cat: any) => ({
                    id: cat.id || cat._id || "others",
                    name: cat.name || "Others"
                }));
                data.menus.forEach((cat: any) => {
                    if (Array.isArray(cat.items)) {
                        cat.items.forEach((item: any) => {
                            items.push({
                                ...item,
                                category: { id: cat.id || cat._id, name: cat.name }
                            });
                        });
                    }
                });
            } else if (data && Array.isArray(data.items)) {
                items = data.items;
            }

            if (directCategories.length > 0) {
                const sorted = directCategories.sort((a, b) => a.name.localeCompare(b.name));
                setCategories(sorted);
                setAllCategoriesList(sorted); // Sync with local list for AddItemCategory
            } else if (items.length > 0) {
                const categoryMap: Record<string, any> = {};
                items.forEach((item: any) => {
                    const rawCat = item.category || { id: "others", name: "Others" };
                    const catId = String(rawCat.id || rawCat._id || "others");
                    const catName = String(rawCat.name || "Others");

                    if (!categoryMap[catId]) {
                        categoryMap[catId] = { id: catId, name: catName };
                    }
                });
                const sortedCategories = Object.values(categoryMap).sort((a: any, b: any) =>
                    a.name.localeCompare(b.name)
                );
                setCategories(sortedCategories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setIsLoadingCategories(false);
        }
    }, [getToken]);

    const fetchAllCategoriesRaw = useCallback(async () => {
        try {
            const authToken = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || staffSession?.token;

            if (!finalToken && !bId) return;

            const url = bId ? `https://billing.kravy.in/api/categories?businessId=${bId}` : "https://billing.kravy.in/api/categories";
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${finalToken}`,
                    "Cache-Control": "no-cache"
                },
            });
            if (response.ok) {
                const data = await response.json();
                const categoryList = Array.isArray(data) ? data : [];
                setAllCategoriesList(categoryList);
            }
        } catch (err) {
            console.error("Fetch all categories error:", err);
        }
    }, [getToken]);

    useFocusEffect(
        useCallback(() => {
            if (isLoaded && (isSignedIn || isStaffSignedIn)) {
                fetchCategories();
                fetchAllCategoriesRaw();
            }
        }, [isLoaded, isSignedIn, isStaffSignedIn])
    );

    const combinedCategories = React.useMemo(() => {
        const map: Record<string, { id: string, name: string }> = {};
        allCategoriesList.forEach(c => {
            if (c.id && c.name) map[c.id] = { id: c.id, name: c.name };
        });
        categories.forEach(c => {
            if (c.id && c.name && !map[c.id]) {
                map[c.id] = { id: c.id, name: c.name };
            }
        });
        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    }, [allCategoriesList, categories]);

    const pickImage = async () => {
        if (!isSignedIn && !isStaffSignedIn) {
            setLoginModalVisible(true);
            return;
        }
        try {
            const ImagePicker = require('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setErrorModalTitle("Permission Required");
                setErrorModalDetail("We need your permission to access the gallery to select an image.");
                setShowError(true);
                return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0]) {
                const localUri = result.assets[0].uri;
                setNewItem(prev => ({ ...prev, imageUrl: localUri }));
                setIsUploadingImage(true);
                (async () => {
                    try {
                        const cloudinaryUrl = await uploadImageToCloudinary(localUri);
                        setUploadedImageUrl(cloudinaryUrl);
                    } catch (err) {
                        console.error("Eager Upload Error:", err);
                    } finally {
                        setIsUploadingImage(false);
                    }
                })();
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            setErrorModalTitle("Gallery Error");
            setErrorModalDetail("Problem opening gallery.");
            setShowError(true);
        }
    };

    const uploadImageToCloudinary = async (uri: string) => {
        const cloudName = "digpvlfup";
        const uploadPreset = "mybillingmenu";
        const formData = new FormData();
        const fileName = uri.split("/").pop() || "upload.jpg";
        const fileType = fileName.split(".").pop() || "jpg";
        // @ts-ignore
        formData.append("file", { uri, type: `image/${fileType}`, name: fileName });
        formData.append("upload_preset", uploadPreset);
        formData.append("cloud_name", cloudName);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Upload failed");
        return data.secure_url;
    };

    const handleClear = () => {
        setNewItem({
            name: "",
            price: "",
            category: "",
            categoryId: "",
            imageUrl: "",
            taxType: "Without Tax",
            gst: null,
            hsnCode: ""
        });
        setUploadedImageUrl("");
        // Optional: show a small toast or visual feedback
    };

    const handleSaveItem = async () => {
        if (!isSignedIn && !isStaffSignedIn) { setLoginModalVisible(true); return; }
        if (!newItem.name || !newItem.price || !newItem.categoryId) {
            setErrorModalTitle("Incomplete Form");
            setErrorModalDetail("Please fill name, price, and category.");
            setShowError(true);
            return;
        }
        try {
            setIsSaving(true);
            const authToken = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || staffSession?.token;
            let finalCategoryId = newItem.categoryId;
            let finalImageUrl = uploadedImageUrl;

            if (isUploadingImage) {
                let retry = 0;
                while (isUploadingImage && retry < 10) {
                    await new Promise(r => setTimeout(r, 500)); retry++;
                    finalImageUrl = uploadedImageUrl;
                    if (finalImageUrl) break;
                }
            }

            const itemPrice = parseFloat(newItem.price);
            const payload = {
                name: newItem.name.trim(),
                price: itemPrice,
                sellingPrice: itemPrice,
                categoryId: finalCategoryId,
                imageUrl: finalImageUrl || null,
                taxType: newItem.taxType || "Without Tax",
                gst: Number(newItem.gst) || 0,
                hsnCode: newItem.hsnCode || "",
                businessId: bId // Important for staff
            };

            const response = await fetch("https://billing.kravy.in/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${finalToken}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setShowSuccess(true);
                setNewItem({ name: "", price: "", category: "", categoryId: "", imageUrl: "", taxType: "Without Tax", gst: null, hsnCode: "" });
                setUploadedImageUrl("");
                setTimeout(() => { setShowSuccess(false); handleBack(); }, 2000);
            } else {
                setErrorModalTitle("Save Failed");
                setErrorModalDetail(`Server error ${response.status}`);
                setShowError(true);
            }
        } catch (error) {
            setErrorModalTitle("Error");
            setErrorModalDetail("Failed to save item.");
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.horizontalHeader}>
                <TouchableOpacity style={styles.inlineBackButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={rf(22)} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.mainTitleInline}>{t('add_item')}</Text>
                    <Text style={styles.mainSubtitleInline}>{t('professional_menu_desc') || "Build your professional menu"}</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('item_image') || 'Item Image'}</Text>
                        <PermissionGuard requiredPermission="Menu & Items Permissions - Add Menu Items">
                            <TouchableOpacity style={styles.uploadIconButton} onPress={pickImage}>
                                <Ionicons name="camera" size={rf(28)} color={THEME_PRIMARY} />
                            </TouchableOpacity>
                        </PermissionGuard>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('item_name') || 'Item Name'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('item_name_placeholder') || "e.g. Burger..."}
                            placeholderTextColor="#9CA3AF"
                            value={newItem.name}
                            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: s(8) }]}>
                            <Text style={styles.label}>{t('price')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={newItem.price}
                                onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: s(8) }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(8) }}>
                                <Text style={[styles.label, { marginBottom: 0 }]}>{t('category') || 'Category'}</Text>
                                <PermissionGuard requiredPermission="Menu & Items Permissions - Add Menu Items">
                                    <TouchableOpacity onPress={() => setIsAddCatModalVisible(true)}>
                                        <View style={styles.addCategoryBtnSmall}><Ionicons name="add" size={rf(16)} color={THEME_PRIMARY} /></View>
                                    </TouchableOpacity>
                                </PermissionGuard>
                            </View>
                            <TouchableOpacity style={styles.dropdownButton} onPress={() => setCategoryModalVisible(true)}>
                                <Text style={[styles.dropdownButtonText, !newItem.category && { color: "#9CA3AF" }]}>
                                    {newItem.category || "Select category..."}
                                </Text>
                                <Ionicons name="chevron-down" size={rf(20)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tax Type</Text>
                        <View style={styles.taxSection}>
                            {taxTypeOptions.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.taxBtn, newItem.taxType === type && styles.taxBtnActive]}
                                    onPress={() => setNewItem({ ...newItem, taxType: type })}
                                >
                                    <Text style={[styles.taxBtnText, newItem.taxType === type && styles.taxBtnTextActive]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {newItem.taxType === "With Tax" && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>GST Percentage (%)</Text>
                                <View style={[styles.taxSection, { flexWrap: 'wrap' }]}>
                                    {gstOptions.map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            style={[styles.taxBtn, newItem.gst === val && !isCustomGst && styles.taxBtnActive, { minWidth: s(60), marginBottom: vs(8) }]}
                                            onPress={() => {
                                                setIsCustomGst(false);
                                                setNewItem({ ...newItem, gst: val });
                                            }}
                                        >
                                            <Text style={[styles.taxBtnText, newItem.gst === val && !isCustomGst && styles.taxBtnTextActive]}>{val}%</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.taxBtn, isCustomGst && styles.taxBtnActive, { minWidth: s(80), marginBottom: vs(8) }]}
                                        onPress={() => {
                                            setIsCustomGst(true);
                                            setNewItem({ ...newItem, gst: null });
                                        }}
                                    >
                                        <Text style={[styles.taxBtnText, isCustomGst && styles.taxBtnTextActive]}>Custom</Text>
                                    </TouchableOpacity>
                                </View>

                                {isCustomGst && (
                                    <TextInput
                                        style={[styles.input, { marginTop: vs(10) }]}
                                        placeholder="Enter Manual GST % (e.g. 3)"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={newItem.gst !== null ? String(newItem.gst) : ""}
                                        onChangeText={(text) => setNewItem({ ...newItem, gst: Number(text) || 0 })}
                                    />
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>HSN Code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 123456"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={newItem.hsnCode}
                                    onChangeText={(text) => setNewItem({ ...newItem, hsnCode: text })}
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.imagePreviewContainer}>
                        <Text style={styles.label}>Item Preview Image</Text>
                        {newItem.imageUrl ? (
                            <View style={styles.previewImageWrapper}>
                                <Image
                                    source={{ uri: newItem.imageUrl }}
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    style={styles.removeImageIcon}
                                    onPress={() => {
                                        setNewItem({ ...newItem, imageUrl: "" });
                                        setUploadedImageUrl("");
                                    }}
                                >
                                    <Ionicons name="close-circle" size={rf(24)} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                                <Ionicons name="image-outline" size={rf(32)} color="#94A3B8" />
                                <Text style={styles.placeholderText}>Tap to select photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <PermissionGuard requiredPermission="Menu & Items Permissions - Add Menu Items">
                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSaveItem}
                            disabled={isSaving}
                        >
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save_item')}</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={handleClear}
                        >
                            <Text style={styles.clearBtnText}>Clear Details</Text>
                        </TouchableOpacity>
                    </PermissionGuard>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={isAddCatModalVisible} animationType="slide">
                <AddItemCategory
                    onBack={() => setIsAddCatModalVisible(false)}
                    categories={combinedCategories}
                    onOptimisticAdd={(newCat) => {
                        setAllCategoriesList(prev => [...prev, newCat]);
                        setNewItem(prev => ({ ...prev, category: newCat.name, categoryId: newCat.id }));
                    }}
                    onSuccess={(realCat) => {
                        setAllCategoriesList(prev => prev.map(c => c.name === realCat.name ? realCat : c));
                        setNewItem(prev => prev.category === realCat.name ? { ...prev, categoryId: realCat.id } : prev);
                    }}
                    onRefresh={fetchCategories}
                />
            </Modal>

            <Modal animationType="slide" transparent visible={categoryModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.sheetHandle} />
                        <FlatList
                            data={combinedCategories}
                            keyExtractor={(item: any) => item.id || item.name}
                            renderItem={({ item }: { item: any }) => (
                                <TouchableOpacity
                                    style={[styles.categorySelectItem, newItem.categoryId === item.id && styles.categorySelected]}
                                    onPress={() => {
                                        setNewItem({ ...newItem, category: item.name, categoryId: item.id });
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.categorySelectText, newItem.categoryId === item.id && styles.categorySelectedText]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={showSuccess} animationType="fade">
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <Ionicons name="checkmark-sharp" size={rf(40)} color="#10B981" />
                        <Text style={styles.successTitleText}>Success!</Text>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={showError} animationType="fade">
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <Text style={{ color: '#F43F5E', fontSize: rf(20), fontWeight: 'bold' }}>{errorModalTitle}</Text>
                        <Text style={{ marginVertical: 10, textAlign: 'center' }}>{errorModalDetail}</Text>
                        <TouchableOpacity style={styles.saveBtn} onPress={() => setShowError(false)}>
                            <Text style={styles.saveBtnText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <LoginRequiredModal visible={loginModalVisible} onClose={() => setLoginModalVisible(false)} onSignIn={() => router.push("/(auth)/sign-in")} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLOR_BG },
    horizontalHeader: { flexDirection: 'row', alignItems: 'center', marginTop: vs(10), marginBottom: vs(10), paddingHorizontal: s(20) },
    inlineBackButton: { width: s(40), height: s(40), borderRadius: s(20), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    titleContainer: { marginLeft: s(20), flex: 1 },
    mainTitleInline: { fontSize: rf(22), fontWeight: "800", color: "#0F172A" },
    mainSubtitleInline: { fontSize: rf(12), color: "#64748B" },
    formContainer: { padding: s(24) },
    inputGroup: { marginBottom: vs(20) },
    inputRow: { flexDirection: "row" },
    label: { fontSize: rf(14), fontWeight: "600", color: "#374151", marginBottom: vs(8) },
    input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: s(12), padding: s(14) },
    uploadIconButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: s(12), width: s(60), height: s(60), justifyContent: "center", alignItems: "center" },
    saveBtn: { backgroundColor: THEME_PRIMARY, borderRadius: s(14), padding: s(14), alignItems: "center", marginTop: vs(10) },
    saveBtnText: { color: "#fff", fontSize: rf(18), fontWeight: "bold" },
    dropdownButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: s(12), padding: s(14), flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    dropdownButtonText: { fontSize: rf(16), color: "#111827" },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: s(24), borderTopRightRadius: s(24), padding: s(24), maxHeight: '80%' },
    sheetHandle: { width: s(40), height: vs(5), backgroundColor: '#E5E7EB', borderRadius: s(10), alignSelf: 'center', marginBottom: vs(15) },
    categorySelectItem: { paddingVertical: vs(16), borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    categorySelected: { backgroundColor: '#EEF2FF' },
    categorySelectText: { fontSize: rf(16) },
    categorySelectedText: { color: THEME_PRIMARY, fontWeight: '600' },
    addCategoryBtnSmall: { backgroundColor: '#EEF2FF', borderRadius: s(8), width: s(24), height: s(24), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME_PRIMARY },
    modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContentCentered: { backgroundColor: '#fff', borderRadius: s(24), padding: s(24), width: '80%', alignItems: 'center' },
    successTitleText: { fontSize: rf(24), fontWeight: 'bold', color: '#10B981', marginTop: 10 },
    taxSection: { flexDirection: 'row', gap: s(10) },
    taxBtn: { flex: 1, padding: s(12), borderRadius: s(10), borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    taxBtnActive: { borderColor: THEME_PRIMARY, backgroundColor: '#EEF2FF' },
    taxBtnText: { fontSize: rf(14), color: '#6B7280' },
    taxBtnTextActive: { color: THEME_PRIMARY, fontWeight: '600' },
    clearBtn: {
        marginTop: vs(15),
        padding: s(14),
        borderRadius: s(14),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    clearBtnText: {
        color: '#64748B',
        fontSize: rf(16),
        fontWeight: '600'
    },
    imagePreviewContainer: {
        marginBottom: vs(20),
        width: '100%',
    },
    previewImageWrapper: {
        width: '100%',
        height: vs(140),
        borderRadius: s(12),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: vs(140),
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#94A3B8',
        fontSize: rf(14),
        marginTop: vs(8),
        fontWeight: '500'
    },
    removeImageIcon: {
        position: 'absolute',
        top: s(8),
        right: s(8),
        backgroundColor: '#fff',
        borderRadius: s(12),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});
