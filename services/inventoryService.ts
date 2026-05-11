import { BACKEND_URL } from "./menuService";

export interface InventoryProduct {
  id: string;
  name: string;
  description?: string;
  stockLevel: number;
  reorderLevel: number;
  openingStock: number;
  sellingPrice: number;
  price?: number; // Purchase price
  category: string | { id: string; name: string };
  categoryId?: string;
  unit: string;
  barcode?: string;
  taxStatus?: string; // "With Tax" or "Without Tax"
  gst?: number;
  hsnCode?: string;
  imageUrl?: string;
  zones?: string[];
  isActive?: boolean;
}

export interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  alertThreshold: number;
  purchasePrice: number;
  unit: string;
  category?: string | { id: string; name: string };
  categoryId?: string;
  gst?: number;
  hsnCode?: string;
  lastUpdated?: string;
  zones?: string[];
}

export interface InventoryMetrics {
  totalAssets: number;
  criticalStockCount: number;
  inventoryValue: number;
  totalCategories?: number;
}

export const inventoryService = {
  // --- Finished Products ---
  getInventoryProducts: async (
    token: string,
    businessId?: string | null,
  ): Promise<InventoryProduct[]> => {
    const url = businessId
      ? `${BACKEND_URL}/api/inventory?businessId=${businessId}`
      : `${BACKEND_URL}/api/inventory`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch inventory products");
    return await response.json();
  },

  createProduct: async (
    token: string,
    productData: any,
    businessId?: string | null,
  ) => {
    const response = await fetch(`${BACKEND_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...productData, businessId }),
    });

    if (!response.ok) throw new Error("Failed to create product");
    return await response.json();
  },

  updateProduct: async (
    token: string,
    productData: any,
    businessId?: string | null,
  ) => {
    const response = await fetch(`${BACKEND_URL}/api/items`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...productData, businessId }),
    });

    if (!response.ok) throw new Error("Failed to update product");
    return await response.json();
  },

  deleteProduct: async (
    token: string,
    productId: string,
    businessId?: string | null,
  ) => {
    const url = businessId
      ? `${BACKEND_URL}/api/items?id=${productId}&businessId=${businessId}`
      : `${BACKEND_URL}/api/items?id=${productId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to delete product");
    return await response.json();
  },

  updateProductStock: async (
    token: string,
    productId: string,
    newStock: number,
    businessId?: string | null,
  ) => {
    const response = await fetch(`${BACKEND_URL}/api/inventory/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, stock: newStock, businessId }),
    });

    if (!response.ok) throw new Error("Failed to update product stock");
    return await response.json();
  },

  // --- Raw Materials ---
  getRawMaterials: async (
    token: string,
    businessId?: string | null,
  ): Promise<RawMaterial[]> => {
    const url = businessId
      ? `${BACKEND_URL}/api/inventory/materials?businessId=${businessId}`
      : `${BACKEND_URL}/api/inventory/materials`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch raw materials");
    const data = await response.json();
    return data.materials || data;
  },

  createRawMaterial: async (
    token: string,
    materialData: any,
    businessId?: string | null,
  ) => {
    const response = await fetch(`${BACKEND_URL}/api/inventory/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...materialData, businessId }),
    });

    if (!response.ok) throw new Error("Failed to create raw material");
    return await response.json();
  },

  updateRawMaterial: async (
    token: string,
    materialId: string,
    materialData: any,
    businessId?: string | null,
  ) => {
    const response = await fetch(
      `${BACKEND_URL}/api/inventory/materials/${materialId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...materialData, businessId }),
      },
    );

    if (!response.ok) throw new Error("Failed to update raw material");
    return await response.json();
  },

  deleteRawMaterial: async (
    token: string,
    materialId: string,
    businessId?: string | null,
  ) => {
    const url = businessId
      ? `${BACKEND_URL}/api/inventory/materials/${materialId}?businessId=${businessId}`
      : `${BACKEND_URL}/api/inventory/materials/${materialId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to delete raw material");
    return await response.json();
  },

  // --- Categories ---
  getInventoryCategories: async (token: string, businessId?: string | null) => {
    const url = businessId
      ? `${BACKEND_URL}/api/categories?businessId=${businessId}`
      : `${BACKEND_URL}/api/categories`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  },

  // --- Metrics ---
  getInventoryMetrics: async (
    token: string,
    businessId?: string | null,
  ): Promise<InventoryMetrics> => {
    const url = businessId
      ? `${BACKEND_URL}/api/inventory/metrics?businessId=${businessId}`
      : `${BACKEND_URL}/api/inventory/metrics`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch inventory metrics");
    return await response.json();
  },
};
