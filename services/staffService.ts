
import { useAuth } from "@clerk/clerk-expo";

const BASE_URL = "https://billing.kravy.in/api/staff";

export const staffService = {
  // Staff Login with Email & Password
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: "Server unreachable" };
    }
  },

  addStaff: async (staffData: any, token: string) => {
    try {
      // Satisfying backend's unique phone number requirement temporarily with a random unique 10-digit number
      const randomPhone = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const payload = { ...staffData, phone: staffData.phone || randomPhone };
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // 2. Fetch All Staff
  getStaffList: async (businessId: string, token: string) => {
    try {
      const response = await fetch(`${BASE_URL}?businessId=${businessId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // 3. Update Staff
  updateStaff: async (id: string, staffData: any, token: string) => {
    try {
      // Remove fields that Prisma update() doesn't want in data block
      const { id: _, businessId: __, createdAt: ___, updatedAt: ____, ...dataForUpdate } = staffData;
      // Satisfying backend's old phone number requirement temporarily
      const payload = { ...dataForUpdate, phone: dataForUpdate.phone || "0000000000" };
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // 4. Delete Staff
  deleteStaff: async (id: string, token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};
