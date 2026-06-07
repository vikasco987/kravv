import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { InventoryProduct, RawMaterial } from "../../services/inventoryService";
import { rf, s, vs } from "../../utils/responsive";

// --- Update Stock Modal ---
interface UpdateStockModalProps {
  visible: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
  onSave: (newStock: number, mode: "add" | "set") => void;
  loading?: boolean;
}

export const UpdateStockModal = ({
  visible,
  onClose,
  product,
  onSave,
  loading,
}: UpdateStockModalProps) => {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"add" | "set">("add");

  useEffect(() => {
    setValue("");
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Adjustment</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={rf(24)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.productName}>{product?.name}</Text>
              <Text style={styles.label}>
                Current: {product?.currentStock} {product?.unit || "pcs"}
              </Text>

              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "add" && styles.activeMode]}
                  onPress={() => setMode("add")}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      mode === "add" && styles.activeModeText,
                    ]}
                  >
                    Add Stock
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "set" && styles.activeMode]}
                  onPress={() => setMode("set")}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      mode === "set" && styles.activeModeText,
                    ]}
                  >
                    Set Total
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>
                {mode === "add" ? "Quantity to Add" : "New Total Quantity"}
              </Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholder={mode === "add" ? "e.g. 10" : "e.g. 50"}
                placeholderTextColor="#64748B"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.disabledBtn]}
              onPress={() => onSave(Number(value), mode)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// --- Add/Edit Product Modal (Advanced) ---
interface AddEditProductModalProps {
  visible: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
  onSave: (data: any) => void;
  loading?: boolean;
  categories: any[];
}

export const AddEditProductModal = ({
  visible,
  onClose,
  product,
  onSave,
  loading,
  categories,
}: AddEditProductModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "", // Purchase Price
    sellingPrice: "",
    unit: "pcs",
    categoryId: "",
    barcode: "",
    openingStock: "0",
    currentStock: "0",
    reorderLevel: "5",
    taxStatus: "Without Tax",
    gst: "0",
    hsnCode: "",
    zones: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: String(product.price || ""),
        sellingPrice: String(product.sellingPrice || ""),
        unit: product.unit || "pcs",
        categoryId:
          product.categoryId ||
          (typeof product.category === "object" ? product.category.id : ""),
        barcode: product.barcode || "",
        openingStock: String(product.openingStock || "0"),
        currentStock: String(product.currentStock || "0"),
        reorderLevel: String(product.reorderLevel || "5"),
        taxStatus: product.taxStatus || "Without Tax",
        gst: String(product.gst || "0"),
        hsnCode: product.hsnCode || "",
        zones: (product.zones || []).join(", "),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        sellingPrice: "",
        unit: "pcs",
        categoryId: categories[0]?.id || "",
        barcode: "",
        openingStock: "0",
        currentStock: "0",
        reorderLevel: "5",
        taxStatus: "Without Tax",
        gst: "0",
        hsnCode: "",
        zones: "",
      });
    }
  }, [product, visible, categories]);

  const handleSubmit = () => {
    const data = {
      ...formData,
      price: Number(formData.price),
      sellingPrice: Number(formData.sellingPrice),
      openingStock: Number(formData.openingStock),
      currentStock: Number(formData.currentStock),
      reorderLevel: Number(formData.reorderLevel),
      gst: Number(formData.gst),
      zones: formData.zones
        .split(",")
        .map((z) => z.trim())
        .filter((z) => z !== ""),
      id: product?.id,
    };
    onSave(data);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { maxHeight: vs(650) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {product ? "Edit Product" : "New Inventory Record"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={rf(24)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollBody}
             {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
              <SectionTitle icon="info" title="Primary Details" />
              <CustomInput
                label="Product Name *"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="e.g. Cappuccino"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.pickerContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                     {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() =>
                            setFormData({ ...formData, categoryId: cat.id })
                          }
                          style={[
                            styles.miniBadge,
                            formData.categoryId === cat.id &&
                            styles.miniBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.miniBadgeText,
                              formData.categoryId === cat.id &&
                              styles.miniBadgeTextActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="Unit"
                  value={formData.unit}
                  onChangeText={(t) => setFormData({ ...formData, unit: t })}
                  placeholder="pcs, kg"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="Barcode"
                  value={formData.barcode}
                  onChangeText={(t) => setFormData({ ...formData, barcode: t })}
                  placeholder="Optional"
                />
              </View>

              <SectionTitle icon="package" title="Stock Levels" />
              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="Opening Stock"
                  value={formData.openingStock}
                  onChangeText={(t) =>
                    setFormData({ ...formData, openingStock: t })
                  }
                  keyboardType="numeric"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="Current Stock"
                  value={formData.currentStock}
                  onChangeText={(t) =>
                    setFormData({ ...formData, currentStock: t })
                  }
                  keyboardType="numeric"
                />
              </View>
              <CustomInput
                label="Alert Floor (Low Stock Warning)"
                value={formData.reorderLevel}
                onChangeText={(t) =>
                  setFormData({ ...formData, reorderLevel: t })
                }
                keyboardType="numeric"
              />

              <SectionTitle icon="dollar-sign" title="Pricing & Cost" />
              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="Purchase Price"
                  value={formData.price}
                  onChangeText={(t) => setFormData({ ...formData, price: t })}
                  keyboardType="numeric"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="Selling Price"
                  value={formData.sellingPrice}
                  onChangeText={(t) =>
                    setFormData({ ...formData, sellingPrice: t })
                  }
                  keyboardType="numeric"
                />
              </View>

              <SectionTitle icon="percent" title="Taxation (GST)" />
              <View
                style={[
                  styles.row,
                  { alignItems: "center", marginBottom: vs(15) },
                ]}
              >
                <Text style={[styles.label, { marginBottom: 0, flex: 1 }]}>
                  Include Tax in Pricing?
                </Text>
                <Switch
                  value={formData.taxStatus === "With Tax"}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      taxStatus: val ? "With Tax" : "Without Tax",
                    })
                  }
                  trackColor={{ false: "#CBD5E1", true: "#4F46E5" }}
                />
              </View>

              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="GST %"
                  value={formData.gst}
                  onChangeText={(t) => setFormData({ ...formData, gst: t })}
                  keyboardType="numeric"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="HSN/SAC Code"
                  value={formData.hsnCode}
                  onChangeText={(t) => setFormData({ ...formData, hsnCode: t })}
                />
              </View>

              <SectionTitle icon="map-pin" title="Multi-Zone Visibility" />
              <CustomInput
                label="Zones (Comma separated)"
                value={formData.zones}
                onChangeText={(t) => setFormData({ ...formData, zones: t })}
                placeholder="Main, Rooftop, Takeaway"
              />
              <View style={{ height: vs(20) }} />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {product ? "Update Product" : "Save Record"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// --- Helper Components ---
const SectionTitle = ({ icon, title }: { icon: any; title: string }) => (
  <View style={styles.sectionHeader}>
    <Feather name={icon} size={rf(14)} color="#4F46E5" />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  containerStyle,
}: any) => (
  <View style={[styles.inputGroup, containerStyle]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor="#64748B"
    />
  </View>
);

// --- Add/Edit Material Modal ---
interface AddEditMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  material: RawMaterial | null;
  onSave: (data: any) => void;
  loading?: boolean;
}

export const AddEditMaterialModal = ({
  visible,
  onClose,
  material,
  onSave,
  loading,
}: AddEditMaterialModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    currentStock: "",
    alertThreshold: "",
    purchasePrice: "",
    unit: "kg",
    category: "General",
    gst: "0",
    hsnCode: "",
  });

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        currentStock: String(material.currentStock),
        alertThreshold: String(material.alertThreshold),
        purchasePrice: String(material.purchasePrice || ""),
        unit: material.unit,
        category:
          typeof material.category === "object"
            ? (material.category as any).name
            : material.category || "General",
        gst: String(material.gst || "0"),
        hsnCode: material.hsnCode || "",
      });
    } else {
      setFormData({
        name: "",
        currentStock: "",
        alertThreshold: "",
        purchasePrice: "",
        unit: "kg",
        category: "General",
        gst: "0",
        hsnCode: "",
      });
    }
  }, [material, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {material ? "Edit Material" : "Add New Material"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={rf(24)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollBody}
              showsVerticalScrollIndicator={false}
             {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
              <CustomInput
                label="Material Name"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="e.g. Tomato, Flour"
              />

              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="Current Stock"
                  value={formData.currentStock}
                  onChangeText={(t) =>
                    setFormData({ ...formData, currentStock: t })
                  }
                  keyboardType="numeric"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="Alert Floor"
                  value={formData.alertThreshold}
                  onChangeText={(t) =>
                    setFormData({ ...formData, alertThreshold: t })
                  }
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="Purchase Price"
                  value={formData.purchasePrice}
                  onChangeText={(t) =>
                    setFormData({ ...formData, purchasePrice: t })
                  }
                  keyboardType="numeric"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="Unit"
                  value={formData.unit}
                  onChangeText={(t) => setFormData({ ...formData, unit: t })}
                  placeholder="kg, ltr"
                />
              </View>

              <View style={styles.row}>
                <CustomInput
                  containerStyle={{ flex: 1 }}
                  label="GST %"
                  value={formData.gst}
                  onChangeText={(t) => setFormData({ ...formData, gst: t })}
                  keyboardType="numeric"
                />
                <CustomInput
                  containerStyle={{ flex: 1, marginLeft: s(10) }}
                  label="HSN Code"
                  value={formData.hsnCode}
                  onChangeText={(t) => setFormData({ ...formData, hsnCode: t })}
                />
              </View>

              <CustomInput
                label="Category"
                value={formData.category}
                onChangeText={(t) => setFormData({ ...formData, category: t })}
                placeholder="Dairy, Veg"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.disabledBtn]}
              onPress={() => onSave(formData)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {material ? "Update Material" : "Create Material"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: s(15),
  },
  modalContainer: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: s(28),
    padding: s(24),
    maxHeight: vs(600),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  modalBody: {
    marginBottom: vs(20),
  },
  scrollBody: {
    marginBottom: vs(15),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    marginTop: vs(10),
    marginBottom: vs(12),
    backgroundColor: "#F1F5F9",
    paddingVertical: vs(4),
    paddingHorizontal: s(10),
    borderRadius: s(8),
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: s(12),
    padding: s(4),
    marginBottom: vs(20),
  },
  modeBtn: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: "center",
    borderRadius: s(10),
  },
  activeMode: {
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeBtnText: {
    fontSize: rf(13),
    fontWeight: "600",
    color: "#64748B",
  },
  activeModeText: {
    color: "#4F46E5",
    fontWeight: "800",
  },
  productName: {
    fontSize: rf(16),
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: vs(5),
  },
  inputGroup: {
    marginBottom: vs(16),
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: rf(12),
    color: "#475569",
    marginBottom: vs(6),
    fontWeight: "700",
    marginLeft: s(2),
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: s(14),
    padding: s(12),
    fontSize: rf(15),
    color: "#1E293B",
    fontWeight: "500",
  },
  pickerContainer: {
    marginTop: vs(5),
    marginBottom: vs(10),
  },
  miniBadge: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(10),
    backgroundColor: "#F1F5F9",
    marginRight: s(8),
    borderWidth: 1,
    borderColor: "transparent",
  },
  miniBadgeActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  miniBadgeText: {
    fontSize: rf(11),
    color: "#64748B",
    fontWeight: "600",
  },
  miniBadgeTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: vs(16),
    borderRadius: s(16),
    alignItems: "center",
    elevation: 4,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: rf(16),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
