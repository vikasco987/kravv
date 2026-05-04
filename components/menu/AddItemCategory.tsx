import { useAuth, useUser } from "@clerk/clerk-expo";
import { menuService } from "../../services/menuService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

const COLORS = {
    PRIMARY: "#2563EB",
    SECONDARY: "#111827",
    WHITE: "#FFFFFF",
    BG_LIGHT: "#F9FAFB",
    GRAY: "#6B7280",
    LIGHT_GRAY: "#E5E7EB",
    BORDER: "#D1D5DB",
    SUCCESS: "#10B981", // Green
};

interface AddItemCategoryProps {
    onBack: () => void;
    categories: { id: string; name: string }[];
    onRefresh: () => Promise<void>;
    onOptimisticAdd?: (category: { id: string; name: string }) => void;
    onSuccess?: (category: { id: string; name: string }) => void; // New: Callback for real DB ID
}

export const AddItemCategory = ({ onBack, categories, onRefresh, onOptimisticAdd, onSuccess }: AddItemCategoryProps) => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const { t } = useLanguage();
    const [categoryName, setCategoryName] = useState("");
    const [isSavingNew, setIsSavingNew] = useState(false);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMsg, setModalMsg] = useState({ title: "", detail: "" });

    const handleSave = (isSaveAndNew: boolean) => {
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            setModalMsg({ title: t('name_missing') || "Name Missing!", detail: t('enter_category_name') || "Please enter category name." });
            setShowValidationError(true);
            setTimeout(() => setShowValidationError(false), 2000);
            return;
        }

        // Immediate UI feedback: Change color to green
        if (isSaveAndNew) setIsSavingNew(true);
        else setIsSavingCategory(true);

        // Optimistic Update: Add to list instantly
        const tempId = `temp-${Date.now()}`;
        const newCategory = { id: tempId, name: trimmedName };

        if (onOptimisticAdd) {
            onOptimisticAdd(newCategory);
        }

        // Instant UI Response
        if (isSaveAndNew) {
            setCategoryName("");
            setModalMsg({ title: t('category_saved') || "Category Saved!", detail: t('added_success') || "New category has been added." });
            setShowSuccessModal(true);
            setTimeout(() => {
                setShowSuccessModal(false);
                setIsSavingNew(false);
            }, 1200); // Faster feedback loop
        } else {
            // Close almost immediately after color flash
            setTimeout(() => {
                setIsSavingCategory(false);
                onBack();
            }, 150);
        }

        // Background Task
        (async () => {
            try {
                const authToken = await getToken();
                const staffSession = await StaffPermissionEngine.getSession();
                const finalToken = authToken || staffSession?.token;
                const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

                if (finalToken) {
                    const realCategory = await menuService.createCategory(finalToken, trimmedName, bId);
                    if (onSuccess) onSuccess(realCategory);
                    if (onRefresh) onRefresh();
                } else {
                    Alert.alert("Error", "Authentication session expired. Please log in again.");
                }
            } catch (error: any) {
                console.error("Failed to save category to backend:", error);
                Alert.alert("Sync Error", "The category was added locally but couldn't sync with the server (Timeout). Please check your internet or refresh the menu.");
            }
        })();
    };

    const renderCategoryItem = ({ item }: { item: { id: string; name: string } }) => (
        <View style={styles.categoryItem}>
            <Text style={styles.categoryText}>{item.name}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={rf(24)} color={COLORS.SECONDARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('add_category') || 'Add Item Category'}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.inputSection}>
                    <Text style={styles.label}>{t('category_name')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('enter_category_name') || "Enter category name"}
                        value={categoryName}
                        onChangeText={setCategoryName}
                        autoFocus={true}
                    />
                    <View style={styles.hintRow}>
                        <Ionicons name="information-circle-outline" size={rf(14)} color={COLORS.GRAY} />
                        <Text style={styles.hintText}>{t('category_hint') || 'Items are shown by category while entering orders'}</Text>
                    </View>
                </View>

                <View style={styles.listSection}>
                    <Text style={styles.listTitle}>{t('all_categories_label') || 'ALL CATEGORIES'}</Text>
                    <FlatList
                        data={[{ id: "none", name: t('none') || "None" }, ...categories]}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCategoryItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            </View>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.footerBtn,
                        styles.saveNewBtn,
                        { backgroundColor: isSavingNew ? COLORS.SUCCESS : COLORS.PRIMARY }
                    ]}
                    onPress={() => handleSave(true)}
                    disabled={isSavingNew || isSavingCategory}
                >
                    {isSavingNew ? (
                        <ActivityIndicator color={COLORS.WHITE} />
                    ) : (
                        <Text style={styles.saveNewBtnText}>{t('save_and_new') || 'Save & New'}</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.footerBtn,
                        styles.saveCategoryBtn,
                        { backgroundColor: isSavingCategory ? COLORS.SUCCESS : COLORS.PRIMARY }
                    ]}
                    onPress={() => handleSave(false)}
                    disabled={isSavingNew || isSavingCategory}
                >
                    {isSavingCategory ? (
                        <ActivityIndicator color={COLORS.WHITE} />
                    ) : (
                        <Text style={styles.saveCategoryBtnText}>{t('save_category') || 'Save Category'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Validation Error Modal */}
            <Modal transparent={true} visible={showValidationError} animationType="fade" onRequestClose={() => setShowValidationError(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.feedbackModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={[styles.successCircle, { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' }]}>
                                <Ionicons name="warning" size={rf(32)} color="#F97316" />
                            </View>
                            <Text style={[styles.feedbackTitle, { color: '#F97316' }]}>{modalMsg.title}</Text>
                            <Text style={styles.feedbackDetail}>{modalMsg.detail}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal for Save & New */}
            <Modal transparent={true} visible={showSuccessModal} animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.feedbackModalContent}>
                        <View style={{ alignItems: 'center' }}>
                            <View style={[styles.successCircle, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                                <Ionicons name="checkmark-circle" size={rf(32)} color="#10B981" />
                            </View>
                            <Text style={[styles.feedbackTitle, { color: '#059669' }]}>{modalMsg.title}</Text>
                            <Text style={styles.feedbackDetail}>{modalMsg.detail}</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: s(16),
        paddingTop: vs(30), // Increased from 20 to 35
        height: vs(95),     // Increased from 80 to 95
        borderBottomWidth: 1,
        borderBottomColor: COLORS.LIGHT_GRAY,
    },
    backBtn: {
        marginRight: s(16),
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: "600",
        color: COLORS.SECONDARY,
    },
    content: {
        flex: 1,
        padding: s(16),
    },
    inputSection: {
        marginBottom: vs(24),
    },
    label: {
        fontSize: rf(14),
        color: COLORS.GRAY,
        marginBottom: vs(8),
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        borderRadius: s(8),
        paddingHorizontal: s(12),
        height: vs(45),
        fontSize: rf(16),
        color: COLORS.SECONDARY,
    },
    hintRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: vs(8),
    },
    hintText: {
        fontSize: rf(12),
        color: COLORS.GRAY,
        marginLeft: s(4),
    },
    listSection: {
        flex: 1,
    },
    listTitle: {
        fontSize: rf(14),
        fontWeight: "600",
        color: COLORS.GRAY,
        marginBottom: vs(16),
        letterSpacing: 0.5,
    },
    listContent: {
        paddingBottom: vs(20),
    },
    categoryItem: {
        paddingVertical: vs(12),
    },
    categoryText: {
        fontSize: rf(16),
        color: COLORS.SECONDARY,
    },
    footer: {
        flexDirection: "row",
        padding: s(16),
        paddingBottom: vs(55),
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GRAY,
        backgroundColor: COLORS.WHITE,
    },
    footerBtn: {
        flex: 1,
        height: vs(50),
        borderRadius: s(12),
        justifyContent: "center",
        alignItems: "center",
    },
    saveNewBtn: {
        marginRight: s(12),
    },
    saveNewBtnText: {
        fontSize: rf(16),
        fontWeight: "600",
        color: COLORS.WHITE,
    },
    saveCategoryBtn: {
        // backgroundColor handled dynamically
    },
    saveCategoryBtnText: {
        fontSize: rf(16),
        fontWeight: "600",
        color: COLORS.WHITE,
    },
    // Modal Styles
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    feedbackModalContent: {
        backgroundColor: COLORS.WHITE,
        padding: s(20),
        borderRadius: s(20),
        width: "80%",
        maxWidth: s(300),
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    successCircle: {
        width: rf(60),
        height: rf(60),
        borderRadius: rf(30),
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: vs(15),
    },
    feedbackTitle: {
        fontSize: rf(18),
        fontWeight: "bold",
        marginBottom: vs(8),
        textAlign: "center",
    },
    feedbackDetail: {
        fontSize: rf(14),
        color: COLORS.GRAY,
        textAlign: "center",
        lineHeight: rf(20),
    },
});
