import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://billing.kravy.in/api/expenses";

export const getAuthToken = async () => {
  try {
    const clerkToken = await AsyncStorage.getItem("__clerk_client_jwt");
    if (clerkToken) return clerkToken;
    const session = await AsyncStorage.getItem("staff_session");
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token;
    }
  } catch (e) {
    console.error("Auth token fetch error:", e);
  }
  return null;
};

export const fetchExpenses = async () => {
  const token = await getAuthToken();
  const res = await fetch(API_BASE, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return await res.json();
};

export const fetchBills = async () => {
  const token = await getAuthToken();
  const res = await fetch("https://billing.kravy.in/api/bill-manager", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch bills");
  return await res.json();
};

export const createExpense = async (data: any) => {
  const token = await getAuthToken();
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return await res.json();
};

export const updateExpense = async (id: string, data: any) => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update expense");
  return await res.json();
};

export const deleteExpense = async (id: string) => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete expense");
  return true;
};

// CATEGORIES
export const fetchCategories = async () => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return await res.json();
};

export const createCategory = async (data: any) => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create category");
  return await res.json();
};

export const updateCategory = async (id: string, data: any) => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update category");
  return await res.json();
};

export const deleteCategory = async (id: string) => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return true;
};
