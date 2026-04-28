import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    ChevronRight,
    Image as ImageIcon,
    Plus,
    Search,
    Sparkles
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { menuService, uploadToCloudinary } from "../../services/menuService";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { AddItemCategory } from "./AddItemCategory";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
    PRIMARY: "#2563EB", // Blue from screenshot
    SECONDARY: "#111827",
    WHITE: "#FFFFFF",
    BG_LIGHT: "#FFFFFF", // Screenshot has white background
    GRAY: "#6B7280",
    LIGHT_GRAY: "#E5E7EB",
    DANGER: "#EF4444",
    SUCCESS: "#10B981",
    BORDER: "#D1D5DB",
};

type MenuItem = {
    id: string;
    name: string;
    price?: number;
    sellingPrice?: number;
    imageUrl?: string;
    unit?: string;
    categoryId?: string;
    isVeg?: boolean;
    description?: string;
};

type MenuCategory = {
    id: string;
    name: string;
    items: MenuItem[];
};

export const EditMenuItem = ({ onBack }: { onBack: () => void }) => {
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const { t } = useLanguage();

    // States
    const [menus, setMenus] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // Edit Form States
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [allCategories, setAllCategories] = useState<{ id: string, name: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFetchingItemDetails, setIsFetchingItemDetails] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Form fields
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editCategoryId, setEditCategoryId] = useState("");
    const [editCategoryName, setEditCategoryName] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [editUnit, setEditUnit] = useState("");
    const [editIsVeg, setEditIsVeg] = useState(true);
    const [editDescription, setEditDescription] = useState("");

    // New Category States
    const [isCreateCategoryModalVisible, setIsCreateCategoryModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [showCategorySuccess, setShowCategorySuccess] = useState(false);
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [showAddItemCategoryScreen, setShowAddItemCategoryScreen] = useState(false);
    const [validationMsg, setValidationMsg] = useState({ title: "", detail: "" });

    // Edit Category States
    const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] = useState(false);
    const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<MenuCategory | null>(null);
    const [editCategoryNewName, setEditCategoryNewName] = useState("");
    const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);
    const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
    const [showUpdateCategorySuccess, setShowUpdateCategorySuccess] = useState(false);
    const [showDeleteCategorySuccess, setShowDeleteCategorySuccess] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    const fetchAllCategories = async () => {
        try {
            // 1. Try Cache First
            const cachedCats = await AsyncStorage.getItem('@cached_categories');
            if (cachedCats) {
                setAllCategories(JSON.parse(cachedCats));
            }

            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (!finalToken) return;

            const data = await menuService.getCategories(finalToken, bId);
            const normalized = Array.isArray(data) ? data.map(c => ({
                id: String(c.id || c._id || ""),
                name: String(c.name || "")
            })).filter(c => c.id !== "") : [];

            setAllCategories(normalized);
            await AsyncStorage.setItem('@cached_categories', JSON.stringify(normalized));
        } catch (err) {
            console.error("Fetch categories error:", err);
        }
    };

    // Hardware back button handler
    useEffect(() => {
        const backAction = () => {
            if (showAddItemCategoryScreen) {
                setShowAddItemCategoryScreen(false);
                return true;
            }
            if (isEditCategoryModalVisible) {
                if (showDeleteCategoryConfirm) {
                    setShowDeleteCategoryConfirm(false);
                } else {
                    setIsEditCategoryModalVisible(false);
                }
                return true;
            }
            if (isEditModalVisible) {
                setIsEditModalVisible(false);
                return true;
            }
            if (isCreateCategoryModalVisible) {
                setIsCreateCategoryModalVisible(false);
                return true;
            }
            if (showCategoryModal) {
                setShowCategoryModal(false);
                return true;
            }
            onBack();
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [isEditModalVisible, isCreateCategoryModalVisible, showCategoryModal, onBack, showAddItemCategoryScreen]);

    const fetchMenus = useCallback(async (isManual = false) => {
        if (!isLoaded) return;
        let cacheFound = false;
        try {
            // 🚀 STEP 1: Load from Cache FIRST for instant UI
            const cachedData = await AsyncStorage.getItem('@cached_menu');
            if (cachedData && !isManual) {
                const parsed = JSON.parse(cachedData);
                if (parsed && parsed.length > 0) {
                    setMenus(parsed);
                    setLoading(false);
                    cacheFound = true;
                }
            }

            if (!cacheFound || isManual) {
                setLoading(true);
            }

            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (!finalToken) {
                setLoading(false);
                return;
            }

            const data = await menuService.getMenu(finalToken, bId);
            let processedItems: any[] = [];
            if (Array.isArray(data)) {
                processedItems = data;
            } else if (data && Array.isArray(data.menus)) {
                data.menus.forEach((cat: any) => {
                    const categoryRaw = { id: cat.id || cat._id || "others", name: cat.name || "Others" };
                    if (Array.isArray(cat.items)) {
                        cat.items.forEach((item: any) => {
                            processedItems.push({ ...item, category: categoryRaw });
                        });
                    }
                });
            }

            const categoryMap: Record<string, MenuCategory> = {};
            processedItems.forEach((item: any) => {
                const rawCat = item.category || { id: "others", name: "Others" };
                const catId = String(rawCat.id || rawCat._id || "others");
                const catName = String(rawCat.name || "Others");

                if (!categoryMap[catId]) {
                    categoryMap[catId] = { id: catId, name: catName, items: [] };
                }

                categoryMap[catId].items.push({
                    id: String(item.id || item._id),
                    name: String(item.name || "Unnamed Item"),
                    price: Number(item.sellingPrice || item.price || 0),
                    imageUrl: item.imageUrl,
                    unit: item.unit,
                    categoryId: catId,
                });
            });

            const finalMenus = Object.values(categoryMap).sort((a, b) => a.name.localeCompare(b.name));
            setMenus(finalMenus);
            await AsyncStorage.setItem('@cached_menu', JSON.stringify(finalMenus));
        } catch (err) {
            console.error("Fetch menu error:", err);
        } finally {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, user, getToken]);

    useEffect(() => {
        if (isLoaded) {
            // Load both in parallel for speed
            Promise.all([
                fetchMenus(),
                fetchAllCategories()
            ]);
        }
    }, [isLoaded, isSignedIn, user]);

    const handleItemClick = async (item: MenuItem, catId: string, catName: string) => {
        try {
            // 🚀 STEP 1: Show Modal Instantly with existing basic data
            setSelectedItem(item);
            setEditName(item.name);
            setEditPrice(String(item.price || "0"));
            setEditCategoryId(catId);
            setEditCategoryName(catName);
            setEditImageUrl(item.imageUrl || "");
            setEditUnit(item.unit || "");
            setEditIsVeg(item.isVeg !== undefined ? item.isVeg : true);
            setEditDescription(item.description || "");

            setIsEditModalVisible(true);
            setIsFetchingItemDetails(true);

            // 🚀 STEP 2: Fetch background details for full form
            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (!finalToken) {
                setIsFetchingItemDetails(false);
                return;
            }

            const url = bId ? `https://billing.kravy.in/api/items?id=${item.id}&businessId=${bId}` : `https://billing.kravy.in/api/items?id=${item.id}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${finalToken}` },
            });
            if (response.ok) {
                const details = await response.json();
                setEditName(details.name || item.name);
                setEditPrice(String(details.sellingPrice || details.price || "0"));
                setEditCategoryId(details.categoryId || catId);
                setEditCategoryName(details.category?.name || catName);
                setEditImageUrl(details.imageUrl || item.imageUrl || "");
                setEditUnit(details.unit || item.unit || "");
                setEditIsVeg(details.isVeg !== undefined ? details.isVeg : true);
                setEditDescription(details.description || "");
            }
        } catch (err) {
            console.log("Background details fetch info:", err);
            // We already show the modal with basic data, so no need for loud alert
        } finally {
            setIsFetchingItemDetails(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setEditImageUrl(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", "Could not open gallery.");
        }
    };


    const handleDelete = async () => {
        if (!selectedItem) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;
        const itemId = selectedItem.id;

        // Optimistic UI for Delete
        setMenus(prev => prev.map(cat => ({
            ...cat,
            items: cat.items.filter(i => i.id !== itemId)
        })).filter(cat => cat.items.length > 0 || allCategories.some(ac => ac.id === cat.id)));

        setIsEditModalVisible(false);
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 2000);

        try {
            setIsDeleting(true);
            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (finalToken) {
                await menuService.deleteItem(finalToken, itemId, bId);
                fetchMenus();
            }
        } catch (err) {
            console.error("Background delete failed:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategoryToEdit) {
            Alert.alert("Error", "No category selected.");
            return;
        }
        if (!editCategoryNewName.trim()) {
            setValidationMsg({ title: "Name Missing!", detail: "Please enter category name." });
            setShowValidationError(true);
            setTimeout(() => setShowValidationError(false), 2000);
            return;
        }

        try {
            setIsUpdatingCategory(true);
            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (!finalToken) return;

            // Optimistic UI Update
            setMenus(prev => prev.map(cat =>
                cat.id === selectedCategoryToEdit.id ? { ...cat, name: editCategoryNewName } : cat
            ));
            setAllCategories(prev => prev.map(cat =>
                cat.id === selectedCategoryToEdit.id ? { ...cat, name: editCategoryNewName } : cat
            ));

            await menuService.updateCategory(finalToken, selectedCategoryToEdit.id, editCategoryNewName, bId);

            setShowUpdateCategorySuccess(true);
            fetchMenus();
            fetchAllCategories();
            setTimeout(() => {
                setShowUpdateCategorySuccess(false);
                setIsEditCategoryModalVisible(false);
            }, 1500);
        } catch (err) {
            console.error("Update category error:", err);
            Alert.alert("Error", "Network error while updating.");
            fetchMenus(); // Revert optimistic UI
        } finally {
            setIsUpdatingCategory(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategoryToEdit) {
            Alert.alert("Error", "No category selected.");
            return;
        }

        try {
            setIsDeletingCategory(true);
            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (!finalToken) return;

            await menuService.deleteCategory(finalToken, selectedCategoryToEdit.id, bId);

            // Optimistic UI Removal
            setMenus(prev => prev.filter(cat => cat.id !== selectedCategoryToEdit.id));
            setAllCategories(prev => prev.filter(cat => cat.id !== selectedCategoryToEdit.id));

            setShowDeleteCategoryConfirm(false);
            setShowDeleteCategorySuccess(true);
            fetchMenus();
            fetchAllCategories();
            setTimeout(() => {
                setShowDeleteCategorySuccess(false);
                setIsEditCategoryModalVisible(false);
            }, 1500);
        } catch (err) {
            console.error("Delete category error:", err);
            Alert.alert("Error", "Network error while deleting.");
        } finally {
            setIsDeletingCategory(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim() || !editPrice.trim()) {
            setValidationMsg({ title: "Details Missing!", detail: "Name and Price are required." });
            setShowValidationError(true);
            setTimeout(() => setShowValidationError(false), 2000);
            return;
        }

        // Optimistic UI for Update
        const updatedItem = {
            ...selectedItem!,
            name: editName,
            price: parseFloat(editPrice),
            imageUrl: editImageUrl,
            categoryId: editCategoryId
        };

        setMenus(prev => prev.map(cat => {
            // Remove from old category if changed
            const filteredItems = cat.items.filter(i => i.id !== selectedItem?.id);
            // Add to new category if this is the one
            if (cat.id === editCategoryId) {
                const alreadyExists = filteredItems.some(i => i.id === selectedItem?.id);
                return { ...cat, items: alreadyExists ? filteredItems : [...filteredItems, updatedItem] };
            }
            return { ...cat, items: filteredItems };
        }).filter(cat => cat.items.length > 0 || allCategories.some(ac => ac.id === cat.id)));

        setIsEditModalVisible(false);
        setShowUpdateSuccess(true);
        setTimeout(() => setShowUpdateSuccess(false), 2000);

        try {
            setIsSaving(true);
            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
            const finalToken = authToken || session?.token;

            if (!finalToken) return;

            let finalImageUrl = editImageUrl;
            if (editImageUrl.startsWith("file://") || editImageUrl.startsWith("content://")) {
                finalImageUrl = await uploadToCloudinary(editImageUrl).catch(() => editImageUrl);
            }

            await menuService.updateItem(finalToken, {
                id: selectedItem?.id,
                name: editName,
                sellingPrice: parseFloat(editPrice),
                categoryId: editCategoryId,
                imageUrl: finalImageUrl,
                unit: editUnit,
                isVeg: editIsVeg,
                description: editDescription,
                businessId: bId
            });

            fetchMenus(); // Silently sync
        } catch (err) {
            console.error("Background update failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const displayCategories = React.useMemo(() => {
        const map: Record<string, { id: string, name: string }> = {};

        // 1. Add all from database list
        allCategories.forEach(c => {
            map[c.id] = { id: c.id, name: c.name };
        });

        // 2. Add any that might be in the current menu structure
        menus.forEach(c => {
            if (!map[c.id]) {
                map[c.id] = { id: c.id, name: c.name };
            }
        });

        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    }, [allCategories, menus]);

    const filteredMenus = React.useMemo(() => {
        const query = searchQuery.toLowerCase();

        // Use displayCategories as the base so even empty ones show up
        let result = displayCategories.map((catBase) => {
            // Find items for this category from the menus state
            const itemsSource = menus.find(m => m.id === catBase.id)?.items || [];
            const filteredItems = itemsSource.filter(i => i.name.toLowerCase().includes(query));

            // If searching, only show if category name matches OR items match
            if (searchQuery && !(catBase.name.toLowerCase().includes(query) || filteredItems.length > 0)) {
                return null;
            }

            return {
                id: catBase.id,
                name: catBase.name,
                items: searchQuery && !catBase.name.toLowerCase().includes(query) ? filteredItems : itemsSource
            };
        }).filter(Boolean) as MenuCategory[];

        // Filter by selected category chip
        if (selectedCategory !== "ALL") {
            result = result.filter(cat => cat.id === selectedCategory);
        }
        return result;
    }, [searchQuery, menus, displayCategories, selectedCategory]);

    const renderItem = ({ item: cat }: { item: MenuCategory }) => (
        <View style={styles.section}>
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => {
                    setSelectedCategoryToEdit(cat);
                    setEditCategoryNewName(cat.name);
                    setIsEditCategoryModalVisible(true);
                }}
            >
                <Text style={styles.sectionTitle}>{cat.name.toUpperCase()}</Text>
                <ChevronRight size={rf(18)} color={COLORS.GRAY} />
            </TouchableOpacity>
            {cat.items.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() => handleItemClick(item, cat.id, cat.name)}
                >
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                    </View>
                    <View style={styles.itemImageContainer}>
                        {item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <ImageIcon size={rf(20)} color={COLORS.GRAY} />
                                <Plus size={rf(10)} color={COLORS.GRAY} style={styles.plusOverlay} />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={rf(24)} color={COLORS.SECONDARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('edit_menu_item')}</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={rf(20)} color={COLORS.GRAY} />
                    <TextInput
                        placeholder={t('search')}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.GRAY}
                    />
                </View>
            </View>

            {/* Horizontal Categories */}
            <View style={styles.chipSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                    <TouchableOpacity
                        style={[styles.chip, selectedCategory === "ALL" && styles.chipActive]}
                        onPress={() => setSelectedCategory("ALL")}
                    >
                        <Text style={[styles.chipText, selectedCategory === "ALL" && styles.chipTextActive]}>{t('all') || 'ALL'}</Text>
                    </TouchableOpacity>
                    {displayCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                                {cat.name.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {/* Plus Icon for New Category */}
                    <TouchableOpacity
                        style={[styles.chip, { borderStyle: "dashed", borderColor: COLORS.PRIMARY }]}
                        onPress={() => setShowAddItemCategoryScreen(true)}
                    >
                        <Plus size={rf(18)} color={COLORS.PRIMARY} />
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={filteredMenus}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listPadding}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={rf(50)} color={COLORS.LIGHT_GRAY} />
                            <Text style={styles.emptyText}>
                                {searchQuery ? t('no_search_results') || "No items match your search" : t('no_items_category') || "No items in this category"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Bottom Buttons */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        onBack();
                        router.push("/(tabs)/menu");

                    }}
                >
                    <Text style={styles.addButtonText}>{t('add_item')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sparkleButton}>
                    <Sparkles size={rf(22)} color={COLORS.PRIMARY} />
                </TouchableOpacity>
            </View>

            {/* Loading Overlay (Only show if modal is not open) */}
            {isFetchingItemDetails && !isEditModalVisible && (
                <View style={styles.overlay}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
            )}

            {/* Create Category Modal (Matched with items.tsx) */}
            <Modal
                transparent={true}
                visible={isCreateCategoryModalVisible}
                animationType="fade"
                onRequestClose={() => setIsCreateCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalContentCentered}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('add_category')}</Text>
                            <TouchableOpacity onPress={() => setIsCreateCategoryModalVisible(false)}>
                                <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingVertical: vs(10) }}>
                            <Text style={styles.label}>{t('categories')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('enter_category') || "Enter new category..."}
                                placeholderTextColor="#9CA3AF"
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                autoFocus={true}
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, { marginTop: vs(24) }, isCreatingCategory && { opacity: 0.7 }]}
                                onPress={async () => {
                                    if (!newCategoryName.trim()) {
                                        Alert.alert("Missing Name", "Please enter a category name.");
                                        return;
                                    }
                                    try {
                                        setIsCreatingCategory(true);
                                        const authToken = await getToken();
                                        const sessionStr = await AsyncStorage.getItem('staff_session');
                                        const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
                                        const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
                                        const finalToken = authToken || staffSession?.token;

                                        const response = await fetch("https://billing.kravy.in/api/categories", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${finalToken}`,
                                            },
                                            body: JSON.stringify({ name: newCategoryName, businessId: bId }),
                                        });

                                        if (response.ok) {
                                            setNewCategoryName("");
                                            setIsCreateCategoryModalVisible(false);
                                            fetchAllCategories();
                                            fetchMenus();

                                            // Show Success Modal
                                            setShowCategorySuccess(true);
                                            setTimeout(() => setShowCategorySuccess(false), 2000);
                                        } else {
                                            const errData = await response.json();
                                            Alert.alert("Error", errData.message || "Failed to create category.");
                                        }
                                    } catch (err) {
                                        Alert.alert("Error", "Something went wrong.");
                                    } finally {
                                        setIsCreatingCategory(false);
                                    }
                                }}
                                disabled={isCreatingCategory}
                            >
                                <Text style={styles.saveBtnText}>
                                    {isCreatingCategory ? <ActivityIndicator color="white" /> : t('add_to_menu') || "Add to Menu"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Category Success Modal */}
            <Modal transparent={true} visible={showCategorySuccess} animationType="fade" onRequestClose={() => setShowCategorySuccess(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.feedbackModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={styles.successCircle}>
                                <Ionicons name="layers" size={rf(36)} color="#10B981" />
                            </View>
                            <Text style={styles.feedbackTitle}>{t('category_created')}</Text>
                            <Text style={styles.feedbackDetail}>{t('added_success')}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Update Success Modal */}
            <Modal transparent={true} visible={showUpdateSuccess} animationType="fade" onRequestClose={() => setShowUpdateSuccess(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.feedbackModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={styles.successCircle}>
                                <Ionicons name="checkmark-circle" size={rf(36)} color="#10B981" />
                            </View>
                            <Text style={styles.feedbackTitle}>{t('item_updated')}</Text>
                            <Text style={styles.feedbackDetail}>{t('changes_saved')}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Success Modal */}
            <Modal transparent={true} visible={showDeleteSuccess} animationType="fade" onRequestClose={() => setShowDeleteSuccess(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.feedbackModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Ionicons name="trash" size={rf(36)} color="#EF4444" />
                            </View>
                            <Text style={[styles.feedbackTitle, { color: '#EF4444' }]}>{t('item_deleted')}</Text>
                            <Text style={styles.feedbackDetail}>{t('item_removed')}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal transparent={true} visible={showDeleteConfirm} animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.confirmModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                <Ionicons name="alert-circle" size={rf(36)} color="#EF4444" />
                            </View>
                            <Text style={styles.modalTitle}>{t('delete_item_confirm')}</Text>
                            <Text style={[styles.feedbackDetail, { marginVertical: vs(10) }]}>{t('delete_confirm_desc')}</Text>

                            <View style={{ flexDirection: 'row', marginTop: vs(15), width: '100%' }}>
                                <TouchableOpacity
                                    style={[styles.modalActionBtn, { backgroundColor: '#F3F4F6' }]}
                                    onPress={() => setShowDeleteConfirm(false)}
                                >
                                    <Text style={{ color: '#374151', fontWeight: '600' }}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalActionBtn, { backgroundColor: '#EF4444', marginLeft: s(10) }]}
                                    onPress={confirmDelete}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>{t('delete')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Validation Error Modal */}
            <Modal transparent={true} visible={showValidationError} animationType="fade" onRequestClose={() => setShowValidationError(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.feedbackModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' }]}>
                                <Ionicons name="warning" size={rf(36)} color="#F97316" />
                            </View>
                            <Text style={[styles.feedbackTitle, { color: '#F97316' }]}>{validationMsg.title}</Text>
                            <Text style={styles.feedbackDetail}>{validationMsg.detail}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Item Category Screen */}
            <Modal
                visible={showAddItemCategoryScreen}
                animationType="slide"
                onRequestClose={() => setShowAddItemCategoryScreen(false)}
            >
                <AddItemCategory
                    onBack={() => setShowAddItemCategoryScreen(false)}
                    categories={displayCategories}
                    onRefresh={async () => {
                        await fetchAllCategories();
                        await fetchMenus();
                    }}
                />
            </Modal>

            {/* Edit Modal (Keep existing logic but match styling) */}
            <Modal visible={isEditModalVisible} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.WHITE }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsEditModalVisible(false)}><ArrowLeft size={rf(26)} color={COLORS.SECONDARY} /></TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>{t('edit_item')}</Text>
                        <View style={{ width: s(30), alignItems: 'center' }}>
                            {isFetchingItemDetails && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
                        </View>
                    </View>
                    <ScrollView style={{ padding: 20 }}>
                        {/* Image Section */}
                        <View style={{ alignItems: 'center', marginBottom: vs(20) }}>
                            <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                                {editImageUrl ? (
                                    <View style={styles.imageWrapper}>
                                        <Image source={{ uri: editImageUrl }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImageBtn}
                                            onPress={() => setEditImageUrl("")}
                                        >
                                            <Ionicons name="close-circle" size={rf(26)} color={COLORS.DANGER} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.pickerImagePlaceholder}>
                                        <ImageIcon size={rf(40)} color={COLORS.GRAY} />
                                        <Text style={{ marginTop: 10, color: COLORS.GRAY }}>{t('add_image')}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>{t('item_name')}</Text>
                            <TextInput style={styles.formInput} value={editName} onChangeText={setEditName} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>{t('price')}</Text>
                            <TextInput style={styles.formInput} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(8) }}>
                                <Text style={styles.formLabel}>{t('categories')}</Text>
                                <TouchableOpacity
                                    onPress={() => setShowAddItemCategoryScreen(true)}
                                    style={styles.addCategoryBtnSmall}
                                >
                                    <Plus size={rf(14)} color={COLORS.PRIMARY} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setShowCategoryModal(true)}
                            >
                                <Text style={styles.dropdownButtonText}>{editCategoryName || t('select_categories') || "Select Category"}</Text>
                                <ChevronRight size={rf(18)} color={COLORS.GRAY} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: vs(30), marginBottom: vs(40) }}>
                            <TouchableOpacity
                                style={[styles.deleteBtn, (isSaving || isDeleting) && { opacity: 0.7 }]}
                                onPress={handleDelete}
                                disabled={isSaving || isDeleting}
                            >
                                <Text style={styles.saveBtnText}>{isDeleting ? <ActivityIndicator color="white" /> : t('delete')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, { flex: 2, marginLeft: s(12) }, (isSaving || isDeleting) && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={isSaving || isDeleting}
                            >
                                <Text style={styles.saveBtnText}>
                                    {isSaving ? <ActivityIndicator color="white" /> : t('update_item')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Category Selection Modal (Inside Edit Modal) */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showCategoryModal}
                        onRequestClose={() => setShowCategoryModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeaderNoMargin}>
                                    <Text style={styles.modalTitle}>{t('select_categories') || 'Choose Category'}</Text>
                                    <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                        <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                <FlatList
                                    data={displayCategories}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={{ paddingBottom: vs(80) }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.categorySelectItem,
                                                editCategoryId === item.id && styles.categorySelected
                                            ]}
                                            onPress={() => {
                                                setEditCategoryId(item.id);
                                                setEditCategoryName(item.name);
                                                setShowCategoryModal(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.categorySelectText,
                                                editCategoryId === item.id && styles.categorySelectedText
                                            ]}>
                                                {item.name}
                                            </Text>
                                            {editCategoryId === item.id && (
                                                <Ionicons name="checkmark-circle" size={rf(20)} color={COLORS.PRIMARY} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={{ padding: s(20), alignItems: 'center' }}>
                                            <Text style={{ color: COLORS.GRAY, fontSize: rf(14) }}>{t('no_items_category') || "No categories found."}</Text>
                                        </View>
                                    }
                                />
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
            </Modal>

            {/* Comprehensive Add Item Category Modal */}
            <Modal
                visible={showAddItemCategoryScreen}
                animationType="slide"
                onRequestClose={() => setShowAddItemCategoryScreen(false)}
            >
                <AddItemCategory
                    onBack={() => setShowAddItemCategoryScreen(false)}
                    categories={displayCategories}
                    onOptimisticAdd={(newCat) => {
                        setAllCategories(prev => [...prev, newCat]);
                    }}
                    onRefresh={async () => {
                        await fetchAllCategories();
                        await fetchMenus();
                    }}
                />
            </Modal>

            {/* Edit Item Category Modal */}
            <Modal
                visible={isEditCategoryModalVisible}
                animationType="slide"
                onRequestClose={() => setIsEditCategoryModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.WHITE }}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsEditCategoryModalVisible(false)}>
                            <ArrowLeft size={rf(26)} color={COLORS.SECONDARY} />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>{t('edit_category')}</Text>
                        <View style={{ width: 30 }} />
                    </View>

                    <ScrollView style={{ padding: s(20) }}>
                        {/* Category Name Input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Category Name</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editCategoryNewName}
                                onChangeText={setEditCategoryNewName}
                                placeholder="e.g. pizzas"
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: vs(8) }}>
                                <Ionicons name="information-circle-outline" size={rf(14)} color={COLORS.GRAY} />
                                <Text style={{ fontSize: rf(12), color: COLORS.GRAY, marginLeft: s(4) }}>
                                    Items are shown by category while entering orders
                                </Text>
                            </View>
                        </View>

                        {/* Items List Header */}
                        <View style={{ marginTop: vs(20), marginBottom: vs(15) }}>
                            <Text style={{ fontSize: rf(14), fontWeight: '700', color: COLORS.GRAY, letterSpacing: 0.5 }}>
                                ITEMS PRESENT IN THE CATEGORY
                            </Text>
                        </View>

                        {/* Contained Items */}
                        <View style={{ backgroundColor: COLORS.WHITE }}>
                            {selectedCategoryToEdit?.items.map((item, index) => (
                                <View key={item.id} style={{ paddingVertical: vs(12), borderBottomWidth: index === selectedCategoryToEdit.items.length - 1 ? 0 : 1, borderBottomColor: '#F3F4F6' }}>
                                    <Text style={{ fontSize: rf(16), color: COLORS.SECONDARY }}>{item.name}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Bottom Action Buttons */}
                    <View style={styles.modalFixedFooter}>
                        <TouchableOpacity
                            style={[styles.modalActionBtn, { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: COLORS.WHITE }]}
                            onPress={() => {
                                console.log("Category Delete Tapped");
                                setShowDeleteCategoryConfirm(true);
                            }}
                        >
                            <Text style={{ color: COLORS.SECONDARY, fontSize: rf(16), fontWeight: '600' }}>{t('delete')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalActionBtn, { backgroundColor: COLORS.PRIMARY, marginLeft: s(15) }]}
                            onPress={() => {
                                console.log("Category Update Tapped");
                                handleUpdateCategory();
                            }}
                            disabled={isUpdatingCategory}
                        >
                            <Text style={{ color: COLORS.WHITE, fontSize: rf(16), fontWeight: '600' }}>
                                {isUpdatingCategory ? <ActivityIndicator color="white" /> : t('update_details')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Delete Category Confirmation Modal */}
                    <Modal
                        transparent={true}
                        visible={showDeleteCategoryConfirm}
                        animationType="fade"
                        onRequestClose={() => setShowDeleteCategoryConfirm(false)}
                    >
                        <View style={styles.modalOverlayCentered}>
                            <View style={styles.confirmModalContent}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={[styles.successCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                        <Ionicons name="alert-circle" size={rf(36)} color="#EF4444" />
                                    </View>
                                    <Text style={styles.modalTitle}>Delete Item Category</Text>
                                    <Text style={[styles.feedbackDetail, { marginVertical: vs(10), lineHeight: rf(20) }]}>
                                        Are you sure you want to delete the item category? This action is irreversible. All items within this category will be moved to Uncategorised
                                    </Text>

                                    <View style={{ flexDirection: 'row', marginTop: vs(15), width: '100%' }}>
                                        <TouchableOpacity
                                            style={[styles.modalActionBtn, { backgroundColor: '#F3F4F6' }]}
                                            onPress={() => setShowDeleteCategoryConfirm(false)}
                                        >
                                            <Text style={{ color: '#374151', fontWeight: '600' }}>{t('cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalActionBtn, { backgroundColor: '#EF4444', marginLeft: s(10) }]}
                                            onPress={handleDeleteCategory}
                                            disabled={isDeletingCategory}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                {isDeletingCategory ? <ActivityIndicator color="white" /> : t('delete')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Update Category Success */}
                    <Modal transparent={true} visible={showUpdateCategorySuccess} animationType="fade">
                        <View style={styles.modalOverlayCentered}>
                            <View style={styles.feedbackModalContent}>
                                <View style={styles.successCircle}>
                                    <Ionicons name="checkmark-circle" size={rf(36)} color="#10B981" />
                                </View>
                                <Text style={styles.feedbackTitle}>{t('category_updated')}</Text>
                            </View>
                        </View>
                    </Modal>

                    {/* Delete Category Success */}
                    <Modal transparent={true} visible={showDeleteCategorySuccess} animationType="fade">
                        <View style={styles.modalOverlayCentered}>
                            <View style={[styles.feedbackModalContent, { borderColor: '#FECACA', borderWidth: 1 }]}>
                                <View style={[styles.successCircle, { backgroundColor: '#FEE2E2' }]}>
                                    <Ionicons name="trash" size={rf(36)} color="#EF4444" />
                                </View>
                                <Text style={[styles.feedbackTitle, { color: '#EF4444' }]}>{t('category_deleted')}</Text>
                            </View>
                        </View>
                    </Modal>

                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.WHITE },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        height: vs(50),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: s(15),
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        marginTop: vs(50),
    },
    backBtn: { padding: s(5) },
    headerTitle: { fontSize: rf(18), fontWeight: "600", color: COLORS.SECONDARY, marginLeft: s(10) },

    searchSection: { padding: s(15) },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.WHITE,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        borderRadius: s(10),
        paddingHorizontal: s(12),
        height: vs(45),
    },
    searchInput: { flex: 1, marginLeft: s(10), fontSize: rf(16) },

    chipSection: { paddingBottom: vs(10) },
    chipContainer: { paddingHorizontal: s(15) },
    chip: {
        paddingHorizontal: s(20),
        paddingVertical: vs(8),
        borderRadius: s(8),
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        marginRight: s(10),
        backgroundColor: COLORS.WHITE,
    },
    chipActive: {
        borderColor: COLORS.PRIMARY,
        backgroundColor: "#EFF6FF", // Light blue
    },
    chipText: { fontSize: rf(12), fontWeight: "600", color: COLORS.SECONDARY },
    chipTextActive: { color: COLORS.PRIMARY },

    listPadding: { paddingBottom: vs(160) },
    section: { marginTop: vs(20) },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: s(15),
        paddingVertical: vs(14),
        backgroundColor: "#F9FAFB", // Very light gray background for categories
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#F3F4F6",
    },
    sectionTitle: { fontSize: rf(15), fontWeight: "700", color: "#374151", marginRight: s(5), letterSpacing: 0.5 },

    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: s(15),
        paddingVertical: vs(20), // Increased height/padding for items
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        backgroundColor: COLORS.WHITE,
    },
    itemInfo: { flex: 1, justifyContent: 'center' },
    itemName: { fontSize: rf(17), fontWeight: "600", color: COLORS.SECONDARY },
    itemPrice: { fontSize: rf(15), color: COLORS.PRIMARY, fontWeight: "700", marginTop: vs(6) },
    itemImageContainer: {
        marginLeft: s(15),
    },
    itemImage: { width: s(75), height: vs(55), borderRadius: s(10) },
    imagePlaceholder: {
        width: s(75),
        height: vs(55),
        backgroundColor: "#F3F4F6",
        borderRadius: s(10),
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    plusOverlay: { position: "absolute", bottom: s(8), right: s(8) },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: s(20),
        paddingBottom: vs(50),
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.WHITE,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    addButton: {
        flex: 1,
        backgroundColor: COLORS.PRIMARY,
        height: vs(50),
        borderRadius: s(12),
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonText: { color: COLORS.WHITE, fontSize: rf(16), fontWeight: "bold" },
    sparkleButton: {
        width: s(50),
        height: s(50),
        borderRadius: s(12),
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: s(15),
    },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.6)", justifyContent: "center", alignItems: "center", zIndex: 100 },

    // Matched with items.tsx
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(20),
        marginTop: vs(50),
        paddingLeft: 20,
    },
    modalHeaderNoMargin: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(20),
    },
    modalHeaderTitle: {
        fontSize: rf(18),
        fontWeight: 'bold',
        color: '#111827',
    },
    modalTitle: {
        fontSize: rf(20),
        fontWeight: 'bold',
        color: '#111827',
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
    saveBtn: {
        backgroundColor: "#2563EB",
        borderRadius: s(14),
        padding: s(14),
        alignItems: "center",
        shadowColor: "#2563EB",
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
    deleteBtn: {
        backgroundColor: COLORS.DANGER,
        borderRadius: s(14),
        padding: s(14),
        alignItems: "center",
        flex: 1,
        shadowColor: COLORS.DANGER,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    successCircle: {
        width: s(70),
        height: s(70),
        borderRadius: s(35),
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(15),
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    feedbackModalContent: {
        backgroundColor: '#fff',
        borderRadius: s(24),
        paddingHorizontal: s(24),
        paddingVertical: vs(20),
        width: s(260),
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    feedbackTitle: {
        fontSize: rf(20),
        fontWeight: 'bold',
        color: '#10B981',
        textAlign: 'center',
    },
    feedbackDetail: {
        fontSize: rf(14),
        color: '#6B7280',
        textAlign: 'center',
        marginTop: vs(5),
    },
    confirmModalContent: {
        backgroundColor: '#fff',
        borderRadius: s(24),
        padding: s(24),
        width: '85%',
        elevation: 10,
        shadowColor: '#000',
    },
    modalActionBtn: {
        flex: 1,
        height: vs(45),
        borderRadius: s(12),
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Image Picker Styles
    imagePickerContainer: {
        width: s(120),
        height: s(120),
        borderRadius: s(20),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        borderStyle: 'dashed',
        overflow: 'visible',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: s(20),
    },
    pickerImagePlaceholder: {
        alignItems: 'center',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: COLORS.WHITE,
        borderRadius: 100,
        elevation: 2,
    },

    emptyContainer: {
        paddingTop: vs(100),
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        marginTop: vs(15),
        fontSize: rf(16),
        color: COLORS.GRAY,
        fontWeight: "500",
    },

    formGroup: { marginBottom: vs(20) },
    formLabel: { fontSize: rf(14), color: COLORS.GRAY, marginBottom: vs(8) },
    formInput: { borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, paddingVertical: vs(10), fontSize: rf(16) },

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
        borderColor: COLORS.PRIMARY,
    },
    categorySelectText: {
        fontSize: rf(16),
        color: '#374151',
    },
    categorySelectedText: {
        color: COLORS.PRIMARY,
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
        borderColor: COLORS.PRIMARY,
    },
    modalFixedFooter: {
        padding: s(20),
        paddingBottom: vs(55),
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.WHITE,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
});
