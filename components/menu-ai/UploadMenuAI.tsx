import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Sparkles, Image as ImageIcon, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

const COLORS = {
  primary: "#4F46E5",
  secondary: "#1E293B",
  white: "#FFFFFF",
  gray: "#9CA3AF",
  lightGray: "#F3F4F6",
  danger: "#EF4444",
  success: "#10B981",
  orange: "#F97316",
};

export default function UploadMenuAI() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);

  const getAuthToken = async () => {
    let token = null;
    if (isSignedIn) {
      token = await getToken();
    }
    const staffSession = await AsyncStorage.getItem("staff_session");
    if (!token && staffSession) {
      token = JSON.parse(staffSession).token;
    }
    return token;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setCompleted(false);
        setExtractedItems([]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const startExtraction = async () => {
    if (!selectedImage) return;

    setProcessing(true);
    setCompleted(false);
    setProgressText("Preparing image...");

    try {
      const token = await getAuthToken();
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      if (!token) throw new Error("Authentication error. Please login again.");

      // 1. Parse Image via Kravy OCR endpoint
      setProgressText("Extracting text via OCR...");

      const formData = new FormData();
      const filename = selectedImage.split("/").pop() || "menu.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("menuFile", {
        uri: selectedImage,
        name: filename,
        type,
      } as any);

      const parseRes = await fetch("https://billing.kravy.in/api/menu/upload-ocr?parseOnly=true", {
        method: "POST",
        body: formData,
        headers: {
          // Let fetch set Content-Type automatically for FormData
        }
      });

      if (!parseRes.ok) throw new Error("Failed to parse image for AI");
      const parseData = await parseRes.json();

      if (!parseData.success || !parseData.partsArray) {
        throw new Error("Invalid response from parsing engine");
      }

      // 2. Get API Keys
      setProgressText("Connecting to AI Engine...");
      const keyRes = await fetch("https://billing.kravy.in/api/menu/get-keys");
      if (!keyRes.ok) throw new Error("Failed to fetch API config");
      const { apiKey } = await keyRes.json();
      if (!apiKey) throw new Error("AI Key is missing");

      // 3. Call Gemini
      setProgressText("Analyzing menu structure (Takes ~30s)...");
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
      ];

      let textResponse = "";
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: parseData.partsArray }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!geminiRes.ok) {
            const errorJson = await geminiRes.json();
            throw new Error(errorJson.error?.message || "Unknown Gemini Error");
          }

          const geminiData = await geminiRes.json();
          textResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!textResponse) throw new Error("AI extraction failed.");

      const parsedMenu = JSON.parse(textResponse);

      // 4. Post Process
      setProgressText("Formatting extracted data...");
      const processRes = await fetch("https://billing.kravy.in/api/menu/post-process", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedMenu)
      });

      if (!processRes.ok) throw new Error("Failed to post-process AI data");
      const processData = await processRes.json();
      const extracted = processData.menu || [];

      if (!extracted || extracted.length === 0) {
        throw new Error("No items were found in the menu.");
      }

      setExtractedItems(extracted);

      // 5. Group Variants & Upload to User's Menu
      setProgressText(`Formatting variants...`);

      const groupedItems = new Map();
      extracted.forEach((item: any) => {
        let rawName = item.item_name || item.name || "Unnamed Item";
        let baseName = rawName.replace(/\s*\([vV]\)\s*/g, '').replace(/\s*\([nN][vV]\)\s*/g, '').trim();
        let variantName = "";
        const suffixMatch = baseName.match(/\s*\(([^)]+)\)$/);

        if (suffixMatch) {
          variantName = suffixMatch[1].trim();
          baseName = baseName.substring(0, suffixMatch.index).trim();
        }

        const category = item.category_name || item.category || "AI Extracted";
        const key = `${category}_${baseName}`;

        if (!groupedItems.has(key)) {
          groupedItems.set(key, {
            name: baseName,
            price: Number(item.price || item.price_default || 0),
            category: category,
            businessId: bId,
            description: item.description || "",
            isVeg: item.food_type?.toLowerCase() === 'veg' ? true : false,
            variants: Array.isArray(item.variants) ? [...item.variants] : []
          });
        } else if (Array.isArray(item.variants)) {
          groupedItems.get(key).variants.push(...item.variants);
        }

        const existingItem = groupedItems.get(key);
        const itemPrice = Number(item.price || item.price_default || 0);

        if (variantName) {
          existingItem.variants.push({
            name: variantName,
            price: itemPrice
          });

          if (existingItem.price === 0 || (itemPrice > 0 && itemPrice < existingItem.price)) {
            existingItem.price = itemPrice;
          }
        }
      });

      const finalUploadItems = Array.from(groupedItems.values());

      setProgressText(`Preparing categories...`);
      let existingCategories: any[] = [];
      try {
        const catUrl = bId ? `https://billing.kravy.in/api/categories?businessId=${bId}&t=${Date.now()}` : `https://billing.kravy.in/api/categories?t=${Date.now()}`;
        const catRes = await fetch(catUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (catRes.ok) {
          existingCategories = await catRes.json();
        }
      } catch (e) {
        console.log("Failed to fetch categories", e);
      }

      const categoryMap = new Map();
      existingCategories.forEach(c => {
        if (c.name) categoryMap.set(c.name.toLowerCase().trim(), c.id || c._id);
      });

      setProgressText(`Uploading ${finalUploadItems.length} items to your menu...`);
      let uploadedCount = 0;

      for (const payload of finalUploadItems) {
        try {
          const catName = payload.category.trim();
          let catId = categoryMap.get(catName.toLowerCase());

          if (!catId) {
            const newCatRes = await fetch("https://billing.kravy.in/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: catName, businessId: bId })
            });
            if (newCatRes.ok) {
              const newCatData = await newCatRes.json();
              catId = newCatData.id || newCatData._id;
              categoryMap.set(catName.toLowerCase(), catId);
            }
          }

          payload.categoryId = catId;
          delete payload.category;

          await fetch("https://billing.kravy.in/api/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          uploadedCount++;
          setProgressText(`Uploading items... (${uploadedCount}/${finalUploadItems.length})`);
        } catch (e) {
          console.log("Failed to upload item", e);
        }
      }

      setProgressText("Upload Complete!");
      setCompleted(true);
      Alert.alert("Success", `Successfully extracted and added ${uploadedCount} items to your menu.`);

    } catch (error: any) {
      console.error(error);
      Alert.alert("Extraction Failed", error.message || "An unexpected error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={rf(24)} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Menu (AI)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <LinearGradient
          colors={['#10B981', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Turn Photos into Menus</Text>
            <Text style={styles.bannerSub}>Upload a photo of your physical menu and our AI will automatically extract and add the items to your system.</Text>
          </View>
          <Sparkles size={rf(32)} color="#fff" style={{ opacity: 0.8 }} />
        </LinearGradient>

        {/* Upload Area */}
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={pickImage}
          disabled={processing}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.iconCircle}>
                <ImageIcon size={rf(28)} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadText}>Tap to select menu image</Text>
              <Text style={styles.uploadSub}>Supports JPG, PNG</Text>
            </View>
          )}
        </TouchableOpacity>

        {selectedImage && !completed && !processing && (
          <TouchableOpacity style={styles.changeImgBtn} onPress={pickImage}>
            <Text style={styles.changeImgText}>Change Image</Text>
          </TouchableOpacity>
        )}

        {/* Action Button */}
        {selectedImage && !completed && (
          <TouchableOpacity
            style={[styles.actionBtn, processing && styles.actionBtnDisabled]}
            onPress={startExtraction}
            disabled={processing}
          >
            {processing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={styles.actionBtnText}>{progressText}</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                <UploadCloud size={rf(18)} color={COLORS.white} />
                <Text style={styles.actionBtnText}>Start AI Extraction</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Status Area */}
        {completed && (
          <View style={styles.successArea}>
            <CheckCircle2 size={rf(48)} color={COLORS.success} />
            <Text style={styles.successTitle}>Menu Extracted Successfully!</Text>
            <Text style={styles.successSub}>
              {extractedItems.length} items have been added to your menu. You can edit them in the Edit Menu section.
            </Text>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => { setSelectedImage(null); setCompleted(false); setExtractedItems([]); }}
            >
              <Text style={styles.resetBtnText}>Upload Another Menu</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(15),
    paddingTop: vs(45),
    paddingBottom: vs(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backBtn: {
    padding: s(5),
    marginRight: s(10),
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "700",
    color: COLORS.secondary,
  },
  scrollContent: {
    padding: s(20),
    paddingBottom: vs(50),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s(20),
    borderRadius: s(16),
    marginBottom: vs(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: s(15),
  },
  bannerTitle: {
    fontSize: rf(18),
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: vs(5),
  },
  bannerSub: {
    fontSize: rf(12),
    color: "rgba(255,255,255,0.9)",
    lineHeight: vs(18),
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: s(16),
    height: vs(250),
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  iconCircle: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(15),
  },
  uploadText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: vs(5),
  },
  uploadSub: {
    fontSize: rf(12),
    color: COLORS.gray,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImgBtn: {
    alignSelf: 'center',
    marginTop: vs(15),
    paddingVertical: vs(8),
    paddingHorizontal: s(16),
    backgroundColor: COLORS.lightGray,
    borderRadius: s(20),
  },
  changeImgText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: COLORS.secondary,
  },
  actionBtn: {
    backgroundColor: COLORS.orange,
    marginTop: vs(24),
    paddingVertical: vs(16),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnDisabled: {
    backgroundColor: '#FDBA74',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: rf(15),
    fontWeight: '700',
  },
  successArea: {
    marginTop: vs(30),
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: s(20),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: COLORS.success,
    marginTop: vs(10),
    marginBottom: vs(5),
    textAlign: 'center',
  },
  successSub: {
    fontSize: rf(13),
    color: '#065F46',
    textAlign: 'center',
    lineHeight: vs(20),
    marginBottom: vs(20),
  },
  resetBtn: {
    paddingVertical: vs(12),
    paddingHorizontal: s(24),
    backgroundColor: COLORS.white,
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  resetBtnText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: rf(13),
  }
});
