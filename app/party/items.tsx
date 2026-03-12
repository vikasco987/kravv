import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5"; // Indigo
const COLOR_BG = "#F9FAFB";

export default function ItemsPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();

    const [categories, setCategories] = useState<any[]>([]); // Objects with id and name
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isAddCatModalVisible, setIsAddCatModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCategorySuccess, setShowCategorySuccess] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showClearSuccess, setShowClearSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState("");
    const [errorModalDetail, setErrorModalDetail] = useState("");

    const [newItem, setNewItem] = useState({
        name: "",
        price: "",
        category: "",
        categoryId: "", // Track DB ID
        imageUrl: "",
    });

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchCategories();
        }
    }, [isLoaded, isSignedIn]);

    const fetchCategories = async () => {
        try {
            setIsLoadingCategories(true);
            const token = await getToken();
            if (!token) return;

            console.log("Fetching categories from: https://billing.kravy.in/api/menu/view");
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
                setCategories(directCategories.sort((a, b) => a.name.localeCompare(b.name)));
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
    };

    const handleAddCategory = () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) {
            setErrorModalTitle("Missing Name");
            setErrorModalDetail("Please enter a category name.");
            setShowError(true);
            return;
        }

        // Case-insensitive check for existing categories
        if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
            setErrorModalTitle("Duplicate");
            setErrorModalDetail("This category already exists.");
            setShowError(true);
            return;
        }

        // Locally adding a category won't have an ID, so the backend might reject it later.
        // We use "new-" prefix to identify that it needs to be created on backend.
        const tempCategory = { id: "new-" + Date.now(), name: trimmedName };
        setCategories(prev => [...prev, tempCategory].sort((a, b) => a.name.localeCompare(b.name)));
        setNewItem(prev => ({ ...prev, category: trimmedName, categoryId: tempCategory.id }));
        setNewCategoryName("");
        setIsAddCatModalVisible(false);

        setShowCategorySuccess(true);
        setTimeout(() => {
            setShowCategorySuccess(false);
        }, 2000);
    };

    const pickImage = async () => {
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
                setNewItem(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
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

        if (!newItem.imageUrl) {
            setErrorModalTitle("Missing Image");
            setErrorModalDetail("Please select an image.");
            setShowError(true);
            return;
        }

        try {
            setIsSaving(true);
            let finalImageUrl = newItem.imageUrl;

            // 1. Upload to Cloudinary
            if (newItem.imageUrl.startsWith("file://") || newItem.imageUrl.startsWith("content://")) {
                try {
                    finalImageUrl = await uploadImageToCloudinary(newItem.imageUrl);
                } catch (uploadError: any) {
                    console.error("Cloudinary Upload Error:", uploadError);
                    setErrorModalTitle("Upload Failed");
                    setErrorModalDetail("Could not upload image to Cloudinary.");
                    setShowError(true);
                    setIsSaving(false);
                    return;
                }
            }

            // 2. Save Item details to MongoDB (Backend API)
            const token = await getToken();

            let finalCategoryId = newItem.categoryId;

            // If it is a new category (starts with 'new-'), we must create it on the backend first!
            if (finalCategoryId.startsWith("new-")) {
                console.log(`Creating new category on backend: ${newItem.category}`);
                const createCatRes = await fetch("https://billing.kravy.in/api/categories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: newItem.category }),
                });

                const catText = await createCatRes.text();
                let catData: any = {};
                try {
                    catData = JSON.parse(catText);
                } catch (e) {
                    console.log("Category response is not JSON:", catText);
                }

                // If success or specifically "Already exists"
                if (createCatRes.ok || catData.message === "Category already exists") {
                    finalCategoryId = catData.id || catData._id || catData.category?.id || catData.category?._id || catData.data?._id || catData.data?.id;

                    if (!finalCategoryId) {
                        setErrorModalTitle("Category Error");
                        setErrorModalDetail(`Could not find category ID in response: ${catText}`);
                        setShowError(true);
                        setIsSaving(false);
                        return;
                    }
                } else {
                    setErrorModalTitle("Category Failed");
                    setErrorModalDetail(catData.message || catData.error || `Category API Error (${createCatRes.status})`);
                    setShowError(true);
                    setIsSaving(false);
                    return;
                }
            }

            console.log("Saving Item with final categoryId: ", finalCategoryId);

            let payload: any = {
                name: newItem.name,
                price: parseFloat(newItem.price),
                sellingPrice: parseFloat(newItem.price),
                imageUrl: finalImageUrl,
                categoryId: finalCategoryId,
            };

            const response = await fetch("https://billing.kravy.in/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            let data: any;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                data = { error: text || "Server returned an invalid response" };
            }

            if (response.ok) {
                setShowSuccess(true);
                // Clear form
                setNewItem({ name: "", price: "", category: "", categoryId: "", imageUrl: "" });

                setTimeout(() => {
                    setShowSuccess(false);
                }, 2000);
            } else {
                setErrorModalTitle("Save Failed");
                setErrorModalDetail(data.error || data.message || "Failed to save item to database");
                setShowError(true);
            }
        } catch (error: any) {
            console.error("Save Error:", error);
            setErrorModalTitle("Process Error");
            setErrorModalDetail(error.message || "Something went wrong while saving.");
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
                    <Text style={styles.mainTitleInline}>Add New Item</Text>
                    <Text style={styles.mainSubtitleInline}>Let's build your professional menu</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formDescription}>Fill in the details below to add a new item to your menu.</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Item Image</Text>
                        <TouchableOpacity style={styles.uploadIconButton} onPress={pickImage}>
                            <Ionicons name="camera" size={rf(28)} color={THEME_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Item Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Burger, Pizza..."
                            placeholderTextColor="#9CA3AF"
                            value={newItem.name}
                            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: s(8) }]}>
                            <Text style={styles.label}>Price (₹)</Text>
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
                                <Text style={[styles.label, { marginBottom: 0 }]}>Category</Text>
                                <TouchableOpacity onPress={() => setIsAddCatModalVisible(true)}>
                                    <View style={styles.addCategoryBtnSmall}>
                                        <Ionicons name="add" size={rf(16)} color={THEME_PRIMARY} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setCategoryModalVisible(true)}
                            >
                                <Text style={[
                                    styles.dropdownButtonText,
                                    !newItem.category && { color: "#9CA3AF" }
                                ]}>
                                    {newItem.category || "Select category..."}
                                </Text>
                                <Ionicons name="chevron-down" size={rf(20)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Add Category Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={isAddCatModalVisible}
                        onRequestClose={() => setIsAddCatModalVisible(false)}
                    >
                        <View style={styles.modalOverlayCentered}>
                            <View style={styles.modalContentCentered}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>New Category</Text>
                                    <TouchableOpacity onPress={() => setIsAddCatModalVisible(false)}>
                                        <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ paddingVertical: vs(10) }}>
                                    <Text style={styles.label}>Category Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new category..."
                                        placeholderTextColor="#9CA3AF"
                                        value={newCategoryName}
                                        onChangeText={setNewCategoryName}
                                        autoFocus={true}
                                    />

                                    <TouchableOpacity
                                        style={[styles.saveBtn, { marginTop: vs(24) }]}
                                        onPress={handleAddCategory}
                                    >
                                        <Text style={styles.saveBtnText}>Add to Menu</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
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
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Choose Category</Text>
                                    <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                        <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                {isLoadingCategories ? (
                                    <ActivityIndicator size="large" color={THEME_PRIMARY} style={{ marginVertical: vs(30) }} />
                                ) : (
                                    <FlatList
                                        data={categories}
                                        keyExtractor={(item: any) => item.id || item.name}
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
                                                <Text style={{ color: '#6B7280', fontSize: rf(14) }}>No categories found in menu.</Text>
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
                            <Text style={styles.imageLabel}>Image Preview</Text>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Feather name="image" size={rf(40)} color="#D1D5DB" />
                            <Text style={styles.imageLabel}>No Image Selected</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                        onPress={handleSaveItem}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Item</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => setShowClearConfirm(true)}
                    >
                        <Text style={styles.clearBtnText}>Clear</Text>
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
                            <Text style={[styles.successTitleText, { color: '#EF4444' }]}>Reset Form?</Text>
                            <Text style={styles.successDetailText}>Are you sure you want to clear all item details?</Text>

                            <View style={{ flexDirection: 'row', marginTop: vs(24), width: '100%', justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: s(14), backgroundColor: '#F3F4F6', borderRadius: s(12), marginRight: s(8), alignItems: 'center' }}
                                    onPress={() => setShowClearConfirm(false)}
                                >
                                    <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: rf(16) }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: s(14), backgroundColor: '#EF4444', borderRadius: s(12), marginLeft: s(8), alignItems: 'center' }}
                                    onPress={() => {
                                        setShowClearConfirm(false);
                                        setNewItem({ name: "", price: "", category: "", categoryId: "", imageUrl: "" });
                                        setShowClearSuccess(true);
                                        setTimeout(() => setShowClearSuccess(false), 2000);
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: rf(16) }}>Clear All</Text>
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
                            <Text style={[styles.successTitleText, { color: '#EF4444' }]}>Cleared!</Text>
                            <Text style={styles.successDetailText}>Form has been reset successfully.</Text>
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
                            <Text style={styles.successTitleText}>Success!</Text>
                            <Text style={styles.successDetailText}>Item has been added to the menu.</Text>
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
                            <Text style={styles.successTitleText}>Category Created!</Text>
                            <Text style={styles.successDetailText}>Category added to local list.</Text>
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
                                <Text style={styles.saveBtnText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(20),
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
});
