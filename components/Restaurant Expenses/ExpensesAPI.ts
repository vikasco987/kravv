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

let cachedExpenses: any = null;
let cachedBills: any = null;
let cachedCategories: any = null;

// Pre-fetch bills in the background so it's ready instantly when P&L opens
setTimeout(async () => {
  try {
    const token = await getAuthToken();
    if (token) {
      const res = await fetch("https://billing.kravy.in/api/bill-manager", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) cachedBills = await res.json();
    }
  } catch (e) { }
}, 1000);

export const fetchExpenses = async () => {
  const fetchPromise = (async () => {
    const token = await getAuthToken();
    const res = await fetch(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Failed to fetch expenses");
    const data = await res.json();
    cachedExpenses = data;
    return data;
  })();
  if (cachedExpenses) return cachedExpenses;
  return await fetchPromise;
};

export const fetchBills = async () => {
  const fetchPromise = (async () => {
    const token = await getAuthToken();
    const res = await fetch("https://billing.kravy.in/api/bill-manager", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Failed to fetch bills");
    const data = await res.json();
    cachedBills = data;
    return data;
  })();
  if (cachedBills) return cachedBills;
  return await fetchPromise;
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
  const fetchPromise = (async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();
    cachedCategories = data;
    return data;
  })();
  if (cachedCategories) return cachedCategories;
  return await fetchPromise;
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
