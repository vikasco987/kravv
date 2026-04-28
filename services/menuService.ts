import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BACKEND_URL = "https://billing.kravy.in";

export const uploadToCloudinary = async (uri: string) => {
    try {
        const cloudName = "digpvlfup";
        const uploadPreset = "mybillingmenu";
        
        const data = new FormData();
        data.append("file", {
            uri: uri,
            type: "image/jpeg",
            name: "upload.jpg",
        } as any);
        data.append("upload_preset", uploadPreset);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: data,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        if (!response.ok) {
            const errData = await response.json();
            console.error("Cloudinary Error Data:", errData);
            throw new Error("Failed to upload image to Cloudinary");
        }

        const result = await response.json();
        return result.secure_url;
    } catch (error) {
        console.error("uploadToCloudinary error:", error);
        throw error;
    }
};

export const menuService = {
    // Categories
    getCategories: async (token: string, businessId?: string | null) => {
        const baseUrl = `${BACKEND_URL}/api/categories`;
        const url = businessId ? `${baseUrl}?businessId=${businessId}` : baseUrl;
        
        console.log("Fetching categories from:", url);
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Cache-Control": "no-cache"
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch categories: ${response.status}`, errorText.substring(0, 100));
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        return await response.json();
    },

    createCategory: async (token: string, name: string, businessId?: string | null) => {
        // Use /api/categories for creation as per test_api.js and EditMenuItem logic
        const url = `${BACKEND_URL}/api/categories`;
        console.log("Creating category at:", url, "Name:", name);
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ name, businessId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to create category: ${response.status} ${response.statusText}`, errorText.substring(0, 100));
            throw new Error(`Failed to create category: ${response.status}`);
        }

        const data = await response.json();
        return {
            id: data.id || data._id,
            name: data.name
        };
    },

    updateCategory: async (token: string, id: string, name: string, businessId?: string | null) => {
        const url = `${BACKEND_URL}/api/categories`;
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, name, businessId }),
        });

        if (!response.ok) throw new Error(`Failed to update category: ${response.status}`);
        return await response.json();
    },

    deleteCategory: async (token: string, id: string, businessId?: string | null) => {
        const url = `${BACKEND_URL}/api/categories`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, businessId }),
        });

        if (!response.ok) throw new Error(`Failed to delete category: ${response.status}`);
        return await response.json();
    },

    // Items
    createItem: async (token: string, itemData: any) => {
        // Use /api/items for consistency with EditMenuItem logic
        const url = `${BACKEND_URL}/api/items`;
        
        console.log("Creating item at:", url);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(itemData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to save item: ${response.status} ${response.statusText}`, errorText.substring(0, 100));
            throw new Error(`Failed to save item: ${response.status}`);
        }

        return await response.json();
    },

    updateItem: async (token: string, itemData: any) => {
        const url = `${BACKEND_URL}/api/items`;
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
        });

        if (!response.ok) throw new Error(`Failed to update item: ${response.status}`);
        return await response.json();
    },

    deleteItem: async (token: string, id: string, businessId?: string | null) => {
        const url = businessId ? `${BACKEND_URL}/api/items?id=${id}&businessId=${businessId}` : `${BACKEND_URL}/api/items?id=${id}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error(`Failed to delete item: ${response.status}`);
        return await response.json();
    },

    getMenu: async (token: string, businessId?: string | null) => {
        const baseUrl = `${BACKEND_URL}/api/menu/view`;
        const url = businessId ? `${baseUrl}?businessId=${businessId}` : baseUrl;
        
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Cache-Control": "no-cache"
            },
        });
        
        if (!response.ok) throw new Error(`Failed to fetch menu: ${response.status}`);
        return await response.json();
    }
};
