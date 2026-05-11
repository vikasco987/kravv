import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import {
  InventoryMetrics,
  InventoryProduct,
  inventoryService,
  RawMaterial,
} from "../../services/inventoryService";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import FinishedProductList from "./FinishedProductList";
import {
  AddEditMaterialModal,
  AddEditProductModal,
  UpdateStockModal,
} from "./InventoryModals";
import InventoryReports from "./InventoryReports";
import InventoryTabs from "./InventoryTabs";
import RawMaterialList from "./RawMaterialList";
import StockAlertBanner from "./StockAlertBanner";
import StockMetricCards from "./StockMetricCards";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: s(15),
    gap: s(10),
    marginBottom: vs(10),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: s(12),
    paddingHorizontal: s(12),
    height: vs(45),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: s(8),
    fontSize: rf(14),
    color: "#1E293B",
  },
  addBtn: {
    width: vs(45),
    height: vs(45),
    backgroundColor: "#4F46E5",
    borderRadius: s(12),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  filterContainer: {
    paddingHorizontal: s(15),
    marginBottom: vs(15),
  },
  filterScroll: {
    flexDirection: "row",
    gap: s(8),
  },
  filterBadge: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(20),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
  },
  filterBadgeActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  filterText: {
    fontSize: rf(11),
    color: "#64748B",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const InventoryDashboard = () => {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "products" | "materials" | "reports"
  >("products");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalAssets: 0,
    criticalStockCount: 0,
    inventoryValue: 0,
    totalCategories: 0,
  });
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters & Sorting
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "in-stock" | "low-stock" | "out-of-stock"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");

  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(
    async (isRefreshing = false) => {
      if (!isRefreshing && products.length === 0 && materials.length === 0) {
        setLoading(true);
      }
      if (isRefreshing) setRefreshing(true);

      try {
        const token = await getToken();
        const session = await StaffPermissionEngine.getSession();
        const finalToken = token || session?.token;
        const bId = session?.businessId;

        if (!finalToken) {
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const [
          metricsData,
          productsData,
          materialsData,
          categoriesData,
          billsData,
        ] = await Promise.all([
          inventoryService.getInventoryMetrics(finalToken, bId).catch(() => ({
            totalAssets: 0,
            criticalStockCount: 0,
            inventoryValue: 0,
          })),
          inventoryService
            .getInventoryProducts(finalToken, bId)
            .catch(() => []),
          inventoryService.getRawMaterials(finalToken, bId).catch(() => []),
          inventoryService
            .getInventoryCategories(finalToken, bId)
            .catch(() => []),
          fetch(
            `https://billing.kravy.in/api/bill-manager?businessId=${bId || ""}&limit=1000`,
            { headers: { Authorization: `Bearer ${finalToken}` } },
          )
            .then((res) => res.json())
            .catch(() => ({ bills: [] })),
        ]);

        setMetrics({
          ...metricsData,
          totalCategories: categoriesData.length,
        });
        setProducts(productsData);
        setMaterials(materialsData);
        setCategories(categoriesData);
        setBills(Array.isArray(billsData) ? billsData : billsData.bills || []);
      } catch (error) {
        console.error("Inventory Fetch Error:", error);
        ToastAndroid.show("Failed to fetch inventory data", ToastAndroid.SHORT);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProductStock = (value: number, mode: "add" | "set") => {
    if (!selectedProduct) return;
    const performUpdate = async () => {
      setActionLoading(true);
      try {
        const token = await getToken();
        const session = await StaffPermissionEngine.getSession();
        const newStock =
          mode === "add" ? selectedProduct.stockLevel + value : value;
        await inventoryService.updateProductStock(
          token || session?.token || "",
          selectedProduct.id,
          newStock,
          session?.businessId,
        );
        ToastAndroid.show("Stock updated successfully", ToastAndroid.SHORT);
        setStockModalVisible(false);
        fetchData();
      } catch {
        Alert.alert("Error", "Failed to update stock");
      } finally {
        setActionLoading(false);
      }
    };
    performUpdate();
  };

  const handleSaveProduct = (data: any) => {
    const performSave = async () => {
      setActionLoading(true);
      try {
        const token = await getToken();
        const session = await StaffPermissionEngine.getSession();
        const finalToken = token || session?.token || "";
        const bId = session?.businessId;

        if (selectedProduct) {
          await inventoryService.updateProduct(finalToken, data, bId);
          ToastAndroid.show("Product updated", ToastAndroid.SHORT);
        } else {
          await inventoryService.createProduct(finalToken, data, bId);
          ToastAndroid.show("Product created", ToastAndroid.SHORT);
        }
        setModalVisible(false);
        fetchData();
      } catch {
        Alert.alert("Error", "Failed to save product");
      } finally {
        setActionLoading(false);
      }
    };
    performSave();
  };

  const handleDeleteProduct = (product: InventoryProduct) => {
    Alert.alert(
      "Delete Record",
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const session = await StaffPermissionEngine.getSession();
              await inventoryService.deleteProduct(
                token || session?.token || "",
                product.id,
                session?.businessId,
              );
              ToastAndroid.show("Record deleted", ToastAndroid.SHORT);
              fetchData();
            } catch {
              Alert.alert("Error", "Failed to delete record");
            }
          },
        },
      ],
    );
  };

  const handleSaveMaterial = (data: any) => {
    const performSave = async () => {
      setActionLoading(true);
      try {
        const token = await getToken();
        const session = await StaffPermissionEngine.getSession();
        const finalToken = token || session?.token || "";
        const bId = session?.businessId;

        if (selectedMaterial) {
          await inventoryService.updateRawMaterial(
            finalToken,
            selectedMaterial.id,
            data,
            bId,
          );
          ToastAndroid.show("Material updated", ToastAndroid.SHORT);
        } else {
          await inventoryService.createRawMaterial(finalToken, data, bId);
          ToastAndroid.show("Material created", ToastAndroid.SHORT);
        }
        setMaterialModalVisible(false);
        fetchData();
      } catch {
        Alert.alert("Error", "Failed to save material");
      } finally {
        setActionLoading(false);
      }
    };
    performSave();
  };

  const handleDeleteMaterial = (material: RawMaterial) => {
    Alert.alert(
      "Delete Material",
      `Are you sure you want to delete ${material.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const session = await StaffPermissionEngine.getSession();
              await inventoryService.deleteRawMaterial(
                token || session?.token || "",
                material.id,
                session?.businessId,
              );
              ToastAndroid.show("Material deleted", ToastAndroid.SHORT);
              fetchData();
            } catch {
              Alert.alert("Error", "Failed to delete material");
            }
          },
        },
      ],
    );
  };

  const processList = (list: any[]) => {
    let filtered = list.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Category Filter
    if (filterCategory) {
      filtered = filtered.filter((item) => {
        const catId = item.categoryId || (item.category as any)?.id;
        return catId === filterCategory;
      });
    }

    // Status Filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => {
        const current =
          item.stockLevel !== undefined ? item.stockLevel : item.currentStock;
        const reorder =
          item.reorderLevel !== undefined
            ? item.reorderLevel
            : item.alertThreshold;
        if (filterStatus === "out-of-stock") return current <= 0;
        if (filterStatus === "low-stock")
          return current > 0 && current <= reorder;
        if (filterStatus === "in-stock") return current > reorder;
        return true;
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock") {
        const aStock =
          a.stockLevel !== undefined ? a.stockLevel : a.currentStock;
        const bStock =
          b.stockLevel !== undefined ? b.stockLevel : b.currentStock;
        return aStock - bStock;
      }
      if (sortBy === "price") {
        const aPrice =
          a.sellingPrice !== undefined ? a.sellingPrice : a.purchasePrice;
        const bPrice =
          b.sellingPrice !== undefined ? b.sellingPrice : b.purchasePrice;
        return aPrice - bPrice;
      }
      return 0;
    });
  };

  const filteredProducts = processList(products);
  const filteredMaterials = processList(materials);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StockMetricCards metrics={metrics} />

      <StockAlertBanner
        criticalCount={metrics.criticalStockCount}
        onPress={() => setFilterStatus("low-stock")}
      />

      <InventoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={rf(18)} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {(activeTab === "products" || activeTab === "materials") && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (activeTab === "products") {
                setSelectedProduct(null);
                setModalVisible(true);
              } else {
                setSelectedMaterial(null);
                setMaterialModalVisible(true);
              }
            }}
          >
            <Feather name="plus" size={rf(20)} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {activeTab !== "reports" && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {/* Status Filters */}
            <TouchableOpacity
              onPress={() => setFilterStatus("all")}
              style={[
                styles.filterBadge,
                filterStatus === "all" && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === "all" && styles.filterTextActive,
                ]}
              >
                All Status
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterStatus("low-stock")}
              style={[
                styles.filterBadge,
                filterStatus === "low-stock" && styles.filterBadgeActive,
              ]}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    filterStatus === "low-stock" ? "#fff" : "#EF4444",
                }}
              />
              <Text
                style={[
                  styles.filterText,
                  filterStatus === "low-stock" && styles.filterTextActive,
                ]}
              >
                Low Stock
              </Text>
            </TouchableOpacity>

            {/* Category Filter */}
            <TouchableOpacity
              onPress={() => {
                // Simplified category picker logic
                const nextIndex =
                  categories.findIndex((c) => c.id === filterCategory) + 1;
                if (nextIndex >= categories.length) setFilterCategory(null);
                else setFilterCategory(categories[nextIndex].id);
              }}
              style={[
                styles.filterBadge,
                filterCategory !== null && styles.filterBadgeActive,
              ]}
            >
              <Feather
                name="layers"
                size={rf(12)}
                color={filterCategory !== null ? "#fff" : "#64748B"}
              />
              <Text
                style={[
                  styles.filterText,
                  filterCategory !== null && styles.filterTextActive,
                ]}
              >
                {filterCategory
                  ? categories.find((c) => c.id === filterCategory)?.name
                  : "Categories"}
              </Text>
            </TouchableOpacity>

            {/* Sort Toggle */}
            <TouchableOpacity
              onPress={() => {
                if (sortBy === "name") setSortBy("stock");
                else if (sortBy === "stock") setSortBy("price");
                else setSortBy("name");
              }}
              style={styles.filterBadge}
            >
              <Feather name="arrow-up" size={rf(12)} color="#64748B" />
              <Text style={styles.filterText}>
                Sort: {sortBy.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <View style={styles.content}>
        {activeTab === "products" && (
          <FinishedProductList
            products={filteredProducts}
            onUpdateStock={(p) => {
              setSelectedProduct(p);
              setStockModalVisible(true);
            }}
            onEdit={(p) => {
              setSelectedProduct(p);
              setModalVisible(true);
            }}
            onDelete={handleDeleteProduct}
            onRefresh={() => fetchData(true)}
            refreshing={refreshing}
          />
        )}
        {activeTab === "materials" && (
          <RawMaterialList
            materials={filteredMaterials}
            onEdit={(m) => {
              setSelectedMaterial(m);
              setMaterialModalVisible(true);
            }}
            onDelete={handleDeleteMaterial}
            onRefresh={() => fetchData(true)}
            refreshing={refreshing}
          />
        )}
        {activeTab === "reports" && (
          <InventoryReports
            products={products}
            materials={materials}
            bills={bills}
          />
        )}
      </View>

      <UpdateStockModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        product={selectedProduct}
        onSave={handleUpdateProductStock}
        loading={actionLoading}
      />

      <AddEditProductModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
        loading={actionLoading}
        categories={categories}
      />

      <AddEditMaterialModal
        visible={materialModalVisible}
        onClose={() => setMaterialModalVisible(false)}
        material={selectedMaterial}
        onSave={handleSaveMaterial}
        loading={actionLoading}
      />
    </View>
  );
};

export default InventoryDashboard;
