import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useState } from "react";
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

import { AddItemCategory } from "../../components/menu/AddItemCategory";
import { LoginRequiredModal } from "../../components/settings/LoginRequiredModal";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { PermissionGuard } from "../../components/PermissionGuard";

const THEME_PRIMARY = "#4F46E5"; // Indigo
const COLOR_BG = "#F9FAFB";

export default function ItemsPage() {
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
    const [newCategoryName, setNewCategoryName] = useState("");

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


    const fetchCategories = useCallback(async () => {
        try {
            setIsLoadingCategories(true);
            const token = await getToken();
            if (!token) return;


            const res = await fetch("https://billing.kravy.in/api/menu/view", {
                headers: {
                    Authorization: `Bearer ${token}`,
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
                // We also need items for extraction if directCategories is somehow empty 
                // but usually data.menus is enough.
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
                console.log(`✅ Loaded ${directCategories.length} categories directly`);
            } else if (items.length > 0) {
                // Extract unique categories from items
                const categoryMap: Record<string, any> = {};
                items.forEach((item: any) => {
                    const rawCat = item.category || { id: "others", name: "Others" };
                    const catId = String(rawCat.id || rawCat._id || "others");
                    const catName = String(rawCat.name || "Others");

                    if (!categoryMap[catId]) {
                        categoryMap[catId] = {
                            id: catId,
                            name: catName,
                        };
                    }
                });

                const sortedCategories = Object.values(categoryMap).sort((a: any, b: any) =>
                    a.name.localeCompare(b.name)
                );

                console.log(`✅ Extracted ${sortedCategories.length} categories from ${items.length} items`);
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
            const token = await getToken();
            const response = await fetch("https://billing.kravy.in/api/categories", {
                headers: {
                    Authorization: `Bearer ${token}`,
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
            if (isLoaded && isSignedIn) {
                fetchCategories();
                fetchAllCategoriesRaw();
            }
        }, [isLoaded, isSignedIn])
    );

    const combinedCategories = React.useMemo(() => {
        const map: Record<string, { id: string, name: string }> = {};

        // 1. Add from 'allCategoriesList' (from api/categories)
        allCategoriesList.forEach(c => {
            if (c.id && c.name) map[c.id] = { id: c.id, name: c.name };
        });

        // 2. Add from 'categories' (from api/menu/view)
        categories.forEach(c => {
            if (c.id && c.name && !map[c.id]) {
                map[c.id] = { id: c.id, name: c.name };
            }
        });

        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    }, [allCategoriesList, categories]);

    const handleAddCategory = () => {
        if (!isSignedIn) {
            setLoginModalVisible(true);
            return;
        }
        setIsAddCatModalVisible(false);

        setShowCategorySuccess(true);
        setTimeout(() => {
            setShowCategorySuccess(false);
        }, 2000);
    };

    const pickImage = async () => {
        if (!isSignedIn) {
            setLoginModalVisible(true);
            return;
        }
        try {
            const ImagePicker = require('expo-image-picker');

            // Request permissions
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
                
                // 🔥 Eager Upload to Cloudinary immediately
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
            setErrorModalDetail("There was a problem opening the gallery. Please rebuild the app (npx expo run:android).");
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

    const handleSaveItem = async () => {
        if (!isSignedIn) {
            setLoginModalVisible(true);
            return;
        }
        // Validation
        if (!newItem.name) {
            setErrorModalTitle("Missing Name");
            setErrorModalDetail("Please enter the item name.");
            setShowError(true);
            return;
        }

        if (!newItem.price) {
            setErrorModalTitle("Missing Price");
            setErrorModalDetail("Please enter the item price.");
            setShowError(true);
            return;
        }

        if (!newItem.categoryId) {
            setErrorModalTitle("Missing Category");
            setErrorModalDetail("Please select a category.");
            setShowError(true);
            return;
        }

        try {
            setIsSaving(true);

            // 1. Resolve Category ID (Background/Fast)
            const token = await getToken();
            let finalCategoryId = newItem.categoryId;

            // If it is a new/temp category, resolve it
            if (!finalCategoryId || finalCategoryId.startsWith("temp-") || finalCategoryId.startsWith("new-") || finalCategoryId === "others") {
                const catName = newItem.category || "General";
                const createCatRes = await fetch("https://billing.kravy.in/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: catName }),
                });
                
                if (createCatRes.ok) {
                    const catData = await createCatRes.json().catch(() => ({}));
                    finalCategoryId = catData.id || catData._id || finalCategoryId;
                }
            }

            // Validation: Final check for ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(finalCategoryId)) {
                setIsSaving(false);
                setErrorModalTitle("Invalid Category");
                setErrorModalDetail("Category could not be resolved. Please try again.");
                setShowError(true);
                return;
            }

            // 2. Resolve Image URL (Wait for eager upload if still running)
            let finalImageUrl = uploadedImageUrl;
            if (isUploadingImage) {
                // If still uploading, wait a bit or re-upload as fallback
                let retryCount = 0;
                while (isUploadingImage && retryCount < 10) {
                    await new Promise(r => setTimeout(r, 500));
                    retryCount++;
                    finalImageUrl = uploadedImageUrl;
                    if (finalImageUrl) break;
                }
            }
            
            // Final fallback if eager upload failed
            if (!finalImageUrl && newItem.imageUrl && (newItem.imageUrl.startsWith("file://") || newItem.imageUrl.startsWith("content://"))) {
                try {
                    finalImageUrl = await uploadImageToCloudinary(newItem.imageUrl);
                } catch (e) {
                    console.error("Fallback upload failed", e);
                }
            }

            const itemPrice = parseFloat(newItem.price);
            const payload = {
                name: newItem.name.trim(),
                price: itemPrice,
                sellingPrice: itemPrice,
                selling_price: itemPrice, 
                categoryId: finalCategoryId,
                imageUrl: finalImageUrl || null,
                taxType: newItem.taxType || "Without Tax",
                gst: Number(newItem.gst) || 0,
                hsnCode: newItem.hsnCode || "",
            };

            const response = await fetch("https://billing.kravy.in/api/items", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const savedItem = await response.json().catch(() => ({}));
                
                // 🚀 Instant Cache Update: Update the @cached_menu in AsyncStorage
                (async () => {
                    try {
                        const cachedData = await AsyncStorage.getItem('@cached_menu');
                        if (cachedData) {
                            let menus = JSON.parse(cachedData);
                            // Find or create category
                            let categoryIndex = menus.findIndex((c: any) => c.id === finalCategoryId || c.name === newItem.category);
                            
                            const newMenuItem = {
                                id: String(savedItem.id || savedItem._id || Math.random()),
                                name: newItem.name.trim(),
                                price: itemPrice,
                                imageUrl: finalImageUrl || null,
                                taxType: newItem.taxType || "Without Tax",
                                gst: Number(newItem.gst) || 0,
                                hsnCode: newItem.hsnCode || "",
                            };

                            if (categoryIndex > -1) {
                                menus[categoryIndex].items = [...menus[categoryIndex].items, newMenuItem];
                            } else {
                                menus.push({
                                    id: finalCategoryId,
                                    name: newItem.category || "General",
                                    items: [newMenuItem]
                                });
                            }
                            await AsyncStorage.setItem('@cached_menu', JSON.stringify(menus));
                        }
                    } catch (e) {
                        console.error("BG Cache Update Error:", e);
                    }
                })();

                setShowSuccess(true);
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
                setTimeout(() => setShowSuccess(false), 2000);
            } else {
                const resText = await response.text();
                setErrorModalTitle("Save Failed");
                setErrorModalDetail(`Server returned error ${response.status}`);
                setShowError(true);
            }
        } catch (error: any) {
            console.error("Save error:", error);
            setErrorModalTitle("Error");
            setErrorModalDetail("Failed to save item. Please try again.");
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.horizontalHeader}>
                <TouchableOpacity style={styles.inlineBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={rf(22)} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.mainTitleInline}>{t('add_item')}</Text>
                    <Text style={styles.mainSubtitleInline}>{t('professional_menu_desc') || "Let's build your professional menu"}</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formDescription}>{t('fill_details_desc') || 'Fill in the details below to add a new item to your menu.'}</Text>
                    </View>

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
                            placeholder={t('item_name_placeholder') || "e.g. Burger, Pizza..."}
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
                                    <TouchableOpacity onPress={() => {
                                        if (!isSignedIn) {
                                            setLoginModalVisible(true);
                                        } else {
                                            setIsAddCatModalVisible(true);
                                        }
                                    }}>
                                        <View style={styles.addCategoryBtnSmall}>
                                            <Ionicons name="add" size={rf(16)} color={THEME_PRIMARY} />
                                        </View>
                                    </TouchableOpacity>
                                </PermissionGuard>
                            </View>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => {
                                    if (!isSignedIn) {
                                        setLoginModalVisible(true);
                                    } else {
                                        setCategoryModalVisible(true);
                                    }
                                }}
                            >
                                <Text style={[
                                    styles.dropdownButtonText,
                                    !newItem.category && { color: "#9CA3AF" }
                                ]}>
                                    {newItem.category || t('select_categories') || "Select category..."}
                                </Text>
                                <Ionicons name="chevron-down" size={rf(20)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>HSN Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter HSN Code (Optional)"
                            placeholderTextColor="#9CA3AF"
                            value={newItem.hsnCode}
                            onChangeText={(text) => setNewItem({ ...newItem, hsnCode: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tax Type</Text>
                        <View style={styles.taxSection}>
                            {taxTypeOptions.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.taxBtn,
                                        newItem.taxType === type && styles.taxBtnActive
                                    ]}
                                    onPress={() => setNewItem({ ...newItem, taxType: type })}
                                >
                                    <Text style={[
                                        styles.taxBtnText,
                                        newItem.taxType === type && styles.taxBtnTextActive
                                    ]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>GST Percentage</Text>
                        <View style={styles.gstSection}>
                            {gstOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.gstBtn,
                                        newItem.gst === opt && !isCustomGst && styles.gstBtnActive
                                    ]}
                                    onPress={() => {
                                        setNewItem({ ...newItem, gst: opt });
                                        setIsCustomGst(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.gstBtnText,
                                        newItem.gst === opt && !isCustomGst && styles.gstBtnTextActive
                                    ]}>{opt}%</Text>
                                </TouchableOpacity>
                            ))}
                            {/* Others Button */}
                            <TouchableOpacity
                                style={[
                                    styles.gstBtn,
                                    isCustomGst && styles.gstBtnActive
                                ]}
                                onPress={() => setIsCustomGst(true)}
                            >
                                <Text style={[
                                    styles.gstBtnText,
                                    isCustomGst && styles.gstBtnTextActive
                                ]}>{t('others') || 'Others'}</Text>
                            </TouchableOpacity>
                        </View>

                        {isCustomGst && (
                            <View style={styles.customGstWrapper}>
                                <TextInput
                                    style={styles.customGstInputBox}
                                    placeholder="Enter GST %"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={newItem.gst?.toString() || ""}
                                    onChangeText={(val) => setNewItem({ ...newItem, gst: parseFloat(val) || 0 })}
                                    autoFocus
                                />
                                <View style={styles.percentDecorator}>
                                    <Text style={styles.percentText}>%</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Add Category Modal (Intergrated with AddItemCategory) */}
                    <Modal
                        animationType="slide"
                        visible={isAddCatModalVisible}
                        onRequestClose={() => setIsAddCatModalVisible(false)}
                    >
                        <AddItemCategory
                            onBack={() => setIsAddCatModalVisible(false)}
                            categories={combinedCategories}
                            onOptimisticAdd={(newCat) => {
                                setAllCategoriesList(prev => [...prev, newCat]);
                                setNewItem(prev => ({ ...prev, category: newCat.name, categoryId: newCat.id }));
                            }}
                            onSuccess={(realCat) => {
                                // Important: Update state with the REAL database ID once saved on server
                                // but ONLY if it's currently the selected category
                                setAllCategoriesList(prev => prev.map(c => 
                                    c.name === realCat.name ? realCat : c
                                ));
                                setNewItem(prev => {
                                    if (prev.category === realCat.name) {
                                        return { ...prev, categoryId: realCat.id };
                                    }
                                    return prev;
                                });
                            }}
                            onRefresh={async () => {
                                await fetchCategories();
                                await fetchAllCategoriesRaw();
                            }}
                        />
                    </Modal>

                    {/* Category Selection Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={categoryModalVisible}
                        onRequestClose={() => setCategoryModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.sheetHandle} />
                                <View style={styles.modalHeader}>
                                    <View>
                                        <Text style={styles.modalTitle}>{t('choose_category') || 'Choose Category'}</Text>
                                        <Text style={{ fontSize: rf(12), color: '#6B7280' }}>{t('select_category_for_item') || 'Select a category for your item'}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                        <Ionicons name="close-circle" size={rf(30)} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                {isLoadingCategories ? (
                                    <ActivityIndicator size="large" color={THEME_PRIMARY} style={{ marginVertical: vs(30) }} />
                                ) : (
                                    <FlatList
                                        data={combinedCategories}
                                        keyExtractor={(item: any) => item.id || item.name}
                                        contentContainerStyle={{ paddingBottom: vs(160) }} // Increased to ensure last item is fully visible
                                        renderItem={({ item }: { item: any }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.categorySelectItem,
                                                    newItem.categoryId === item.id && styles.categorySelected
                                                ]}
                                                onPress={() => {
                                                    setNewItem({ ...newItem, category: item.name, categoryId: item.id });
                                                    setCategoryModalVisible(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.categorySelectText,
                                                    newItem.categoryId === item.id && styles.categorySelectedText
                                                ]}>
                                                    {item.name}
                                                </Text>
                                                {newItem.categoryId === item.id && (
                                                    <Ionicons name="checkmark-circle" size={rf(20)} color={THEME_PRIMARY} />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <View style={{ padding: s(20), alignItems: 'center' }}>
                                                <Text style={{ color: '#6B7280', fontSize: rf(14) }}>{t('no_categories_found') || "No categories found in menu."}</Text>
                                            </View>
                                        }
                                    />
                                )}
                            </View>
                        </View>
                    </Modal>

                    {newItem.imageUrl ? (
                        <View style={styles.imagePreviewContainer}>
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: newItem.imageUrl }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setNewItem({ ...newItem, imageUrl: "" })}
                                >
                                    <Ionicons name="close-circle" size={rf(26)} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.imageLabel}>{t('image_preview') || 'Image Preview'}</Text>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Feather name="image" size={rf(40)} color="#D1D5DB" />
                            <Text style={styles.imageLabel}>{t('no_image_selected') || 'No Image Selected'}</Text>
                        </View>
                    )}

                    <PermissionGuard requiredPermission="Menu & Items Permissions - Add Menu Items">
                        <TouchableOpacity
                            style={[
                                styles.saveBtn,
                                (isSaving || showSuccess) && { backgroundColor: "#10B981" },
                                isSaving && { opacity: 0.7 }
                            ]}
                            onPress={handleSaveItem}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : isUploadingImage ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={[styles.saveBtnText, { marginLeft: s(8) }]}>Uploading Image...</Text>
                                </View>
                            ) : (
                                <Text style={styles.saveBtnText}>{t('save_item')}</Text>
                            )}
                        </TouchableOpacity>
                    </PermissionGuard>

                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => setShowClearConfirm(true)}
                    >
                        <Text style={styles.clearBtnText}>{t('clear')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Clear Confirm Modal */}
            <Modal
                transparent={true}
                visible={showClearConfirm}
                animationType="fade"
            >
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <View style={{ alignItems: 'center', paddingVertical: vs(10) }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Ionicons name="trash-outline" size={rf(40)} color="#EF4444" />
                            </View>
                            <Text style={[styles.successTitleText, { color: '#EF4444' }]}>{t('reset_form') || 'Reset Form?'}</Text>
                            <Text style={styles.successDetailText}>{t('clear_confirm_desc') || 'Are you sure you want to clear all item details?'}</Text>

                            <View style={{ flexDirection: 'row', marginTop: vs(24), width: '100%', justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: s(14), backgroundColor: '#F3F4F6', borderRadius: s(12), marginRight: s(8), alignItems: 'center' }}
                                    onPress={() => setShowClearConfirm(false)}
                                >
                                    <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: rf(16) }}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: s(14), backgroundColor: '#EF4444', borderRadius: s(12), marginLeft: s(8), alignItems: 'center' }}
                                    onPress={() => {
                                        setShowClearConfirm(false);
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
                                        setShowClearSuccess(true);
                                        setTimeout(() => setShowClearSuccess(false), 2000);
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: rf(16) }}>{t('clear_all') || 'Clear All'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Clear Success Modal */}
            <Modal
                transparent={true}
                visible={showClearSuccess}
                animationType="fade"
            >
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <View style={{ alignItems: 'center', paddingVertical: vs(20) }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Ionicons name="checkmark-done" size={rf(40)} color="#EF4444" />
                            </View>
                            <Text style={[styles.successTitleText, { color: '#EF4444' }]}>{t('cleared') || 'Cleared!'}</Text>
                            <Text style={styles.successDetailText}>{t('form_reset_desc') || 'Form has been reset successfully.'}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                transparent={true}
                visible={showSuccess}
                animationType="fade"
            >
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <View style={{ alignItems: 'center', paddingVertical: vs(20) }}>
                            <View style={styles.successCircle}>
                                <Ionicons name="checkmark-sharp" size={rf(40)} color="#10B981" />
                            </View>
                            <Text style={styles.successTitleText}>{t('success') || 'Success!'}</Text>
                            <Text style={styles.successDetailText}>{t('item_added_desc') || 'Item has been added to the menu.'}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Category Local Success Modal */}
            <Modal
                transparent={true}
                visible={showCategorySuccess}
                animationType="fade"
            >
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <View style={{ alignItems: 'center', paddingVertical: vs(20) }}>
                            <View style={styles.successCircle}>
                                <Ionicons name="layers" size={rf(40)} color="#10B981" />
                            </View>
                            <Text style={styles.successTitleText}>{t('category_created') || 'Category Created!'}</Text>
                            <Text style={styles.successDetailText}>{t('category_added_to_list') || 'Category added to local list.'}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ERROR MODAL */}
            <Modal
                transparent={true}
                visible={showError}
                animationType="fade"
                onRequestClose={() => setShowError(false)}
            >
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <View style={{ alignItems: 'center', paddingVertical: vs(10) }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FFEEF2', borderColor: '#FFD1DC' }]}>
                                <Ionicons name="alert-circle" size={rf(45)} color="#F43F5E" />
                            </View>
                            <Text style={[styles.successTitleText, { color: '#F43F5E' }]}>{errorModalTitle}</Text>
                            <Text style={styles.successDetailText}>{errorModalDetail}</Text>

                            <TouchableOpacity
                                style={[styles.saveBtn, { width: '100%', marginTop: vs(24), backgroundColor: '#F43F5E', shadowColor: '#F43F5E' }]}
                                onPress={() => setShowError(false)}
                            >
                                <Text style={styles.saveBtnText}>{t('try_again') || 'Try Again'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <LoginRequiredModal
                visible={loginModalVisible}
                onClose={() => setLoginModalVisible(false)}
                onSignIn={() => {
                    setLoginModalVisible(false);
                    router.push("/(auth)/sign-in");
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_BG,
    },
    header: {
        display: 'none',
    },
    backButton: {
        display: 'none',
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: "bold",
        color: "#111827",
    },
    horizontalHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginTop: vs(45),
        marginBottom: vs(10),
        paddingHorizontal: s(20),
    },
    inlineBackButton: {
        width: s(40),
        height: s(40),
        borderRadius: s(20),
        backgroundColor: '#fff',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    titleContainer: {
        marginLeft: s(50),
        flex: 1,
    },
    mainTitleInline: {
        fontSize: rf(24),
        fontWeight: "800" as const,
        color: "#0F172A",
    },
    mainSubtitleInline: {
        fontSize: rf(13),
        color: "#64748B",
    },
    topBackButton: {
        display: 'none',
    },
    mainHeader: {
        display: 'none',
    },
    mainTitle: {
        fontSize: rf(28),
        fontWeight: "800" as const,
        color: "#0F172A",
    },
    mainSubtitle: {
        fontSize: rf(14),
        color: "#64748B",
        marginTop: vs(4),
    },
    formContainer: {
        padding: s(24),
        paddingTop: 0,
    },
    formHeader: {
        marginBottom: vs(24),
    },
    formDescription: {
        fontSize: rf(16),
        color: "#6B7280",
        lineHeight: rf(22),
    },
    inputGroup: {
        marginBottom: vs(20),
    },
    inputRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    label: {
        fontSize: rf(14),
        fontWeight: "600",
        color: "#374151",
        marginBottom: vs(8),
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: s(12),
        padding: s(14),
        fontSize: rf(16),
        color: "#111827",
    },
    uploadIconButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: s(12),
        width: s(60),
        height: s(60),
        justifyContent: "center",
        alignItems: "center",
    },
    saveBtn: {
        backgroundColor: THEME_PRIMARY,
        borderRadius: s(14),
        padding: s(14),
        alignItems: "center",
        marginTop: vs(10),
        shadowColor: THEME_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: "#fff",
        fontSize: rf(18),
        fontWeight: "bold",
    },
    imagePreviewContainer: {
        alignItems: "center",
        marginVertical: vs(20),
        padding: s(16),
        backgroundColor: "#fff",
        borderRadius: s(16),
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: THEME_PRIMARY,
    },
    imagePlaceholder: {
        alignItems: "center",
        marginVertical: vs(20),
        padding: s(30),
        backgroundColor: "#F3F4F6",
        borderRadius: s(16),
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    imagePreview: {
        width: s(120),
        height: s(120),
        borderRadius: s(16),
        marginBottom: vs(8),
    },
    imageLabel: {
        fontSize: rf(14),
        color: "#6B7280",
        marginTop: vs(4),
    },
    imageWrapper: {
        position: 'relative', // To position the close button
    },
    removeImageBtn: {
        position: 'absolute',
        top: vs(-8),
        right: s(-8),
        backgroundColor: '#fff',
        borderRadius: s(13),
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 10,
    },
    clearBtn: {
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#EF4444",
        borderRadius: s(14),
        padding: s(14),
        alignItems: "center",
        marginTop: vs(12),
        marginBottom: vs(20),
    },
    clearBtnText: {
        color: "#EF4444",
        fontSize: rf(18),
        fontWeight: "bold",
    },
    dropdownButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: s(12),
        padding: s(14),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownButtonText: {
        fontSize: rf(16),
        color: "#111827",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: s(24),
        borderTopRightRadius: s(24),
        padding: s(24),
        paddingBottom: vs(100), // Significant padding to ensure items clear the nav bar
        maxHeight: '80%',
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    sheetHandle: {
        width: s(40),
        height: vs(5),
        backgroundColor: '#E5E7EB',
        borderRadius: s(10),
        alignSelf: 'center',
        marginBottom: vs(15),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: vs(25),
    },
    modalTitle: {
        fontSize: rf(20),
        fontWeight: 'bold',
        color: '#111827',
    },
    categorySelectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vs(16),
        paddingHorizontal: s(8),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categorySelected: {
        backgroundColor: '#EEF2FF',
        borderRadius: s(12),
        borderColor: THEME_PRIMARY,
    },
    categorySelectText: {
        fontSize: rf(16),
        color: '#374151',
    },
    categorySelectedText: {
        color: THEME_PRIMARY,
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
        borderColor: THEME_PRIMARY,
    },
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: s(20),
    },
    modalContentCentered: {
        backgroundColor: '#fff',
        borderRadius: s(24),
        padding: s(24),
        width: '100%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    successCircle: {
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(20),
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    successTitleText: {
        fontSize: rf(24),
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: vs(8),
    },
    successDetailText: {
        fontSize: rf(16),
        color: '#6B7280',
        textAlign: 'center',
    },
    taxSection: {
        flexDirection: 'row',
        gap: s(10),
    },
    taxBtn: {
        flex: 1,
        padding: s(12),
        borderRadius: s(10),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    taxBtnActive: {
        borderColor: THEME_PRIMARY,
        backgroundColor: '#EEF2FF',
    },
    taxBtnText: {
        fontSize: rf(14),
        color: '#6B7280',
        fontWeight: '500',
    },
    taxBtnTextActive: {
        color: THEME_PRIMARY,
        fontWeight: '600',
    },
    gstSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: s(8),
    },
    gstBtn: {
        paddingHorizontal: s(12),
        paddingVertical: s(8),
        borderRadius: s(8),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    gstBtnActive: {
        borderColor: THEME_PRIMARY,
        backgroundColor: '#EEF2FF',
    },
    gstBtnText: {
        fontSize: rf(12),
        color: '#6B7280',
    },
    gstBtnTextActive: {
        color: THEME_PRIMARY,
        fontWeight: '600',
    },
    customGstWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: vs(12),
        backgroundColor: '#F9FAFB', // Match placeholder bg
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: THEME_PRIMARY,
        borderStyle: 'dashed', // 🔥 Added dashed style as requested
        paddingHorizontal: s(12),
        width: s(150),
        alignSelf: 'center', // Center it to make it look like a "column"
        height: vs(45),
    },
    customGstInputBox: {
        flex: 1,
        height: '100%',
        fontSize: rf(15),
        color: '#1E293B',
        textAlign: 'center',
        fontWeight: '600',
    },
    percentDecorator: {
        marginLeft: s(4),
    },
    percentText: {
        color: THEME_PRIMARY,
        fontWeight: 'bold',
        fontSize: rf(16),
    },
});
