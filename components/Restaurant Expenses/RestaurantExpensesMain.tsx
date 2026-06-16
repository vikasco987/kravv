import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Alert, SafeAreaView, StyleSheet } from "react-native";
import ExpenseHeader from "./ExpenseHeader";
import ExpenseList from "./ExpenseList";
import ExpenseModals from "./ExpenseModals";
import ExpensePnL from "./ExpensePnL";
import ExpenseReports from "./ExpenseReports";
import { createCategory, createExpense, deleteCategory, deleteExpense, fetchCategories, fetchExpenses, updateCategory, updateExpense } from "./ExpensesAPI";

const DEFAULT_CATEGORIES = [
  { name: "Ingredients", icon: "ShoppingCart", color: "#F59E0B" },
  { name: "Rent", icon: "Wallet", color: "#3B82F6" },
  { name: "Salaries", icon: "Users", color: "#6366F1" },
  { name: "Utilities", icon: "Lightbulb", color: "#10B981" },
  { name: "Marketing", icon: "Rocket", color: "#F43F5E" },
  { name: "Others", icon: "MoreHorizontal", color: "#64748B" },
];

const RestaurantExpensesMain = forwardRef(({ onBack }: { onBack: () => void }, ref) => {
  const [currentView, setCurrentView] = useState<'main' | 'pnl' | 'reports'>('main');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deleteData, setDeleteData] = useState<{ type: 'expense' | 'category', id: string, title: string, subtitle: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    paymentMode: "Cash",
  });

  const [catFormData, setCatFormData] = useState({
    id: "",
    name: "",
    color: "#64748B",
    icon: "MoreHorizontal"
  });

  useEffect(() => {
    loadData();
  }, []);

  const stateRef = useRef({ currentView, deleteData, showCategoryModal, showAddModal });
  const childRef = useRef<any>(null);

  useEffect(() => {
    stateRef.current = { currentView, deleteData, showCategoryModal, showAddModal };
  }, [currentView, deleteData, showCategoryModal, showAddModal]);

  useImperativeHandle(ref, () => ({
    handleBack: () => {
      if (childRef.current && childRef.current.handleBack()) {
        return true;
      }
      const state = stateRef.current;
      if (state.deleteData) {
        setDeleteData(null);
        return true;
      }
      if (state.showCategoryModal) {
        setShowCategoryModal(false);
        return true;
      }
      if (state.showAddModal) {
        setShowAddModal(false);
        return true;
      }
      if (state.currentView !== 'main') {
        setCurrentView('main');
        return true;
      }
      return false;
    }
  }));

  const loadData = async () => {
    setLoading(true);
    try {
      const expData = await fetchExpenses();
      const catData = await fetchCategories();
      setExpenses(expData);

      if (catData.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          try { await createCategory(cat); } catch (e) { }
        }
        const seeded = await fetchCategories();
        setCategories(seeded);
        setFormData(prev => ({ ...prev, category: seeded[0]?.name || "" }));
      } else {
        setCategories(catData);
        setFormData(prev => ({ ...prev, category: catData[0]?.name || "" }));
      }
    } catch (e) {
      console.log("Failed to load expenses data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async () => {
    if (!formData.amount || !formData.category) {
      Alert.alert("Required", "Amount and Category are required");
      return;
    }
    const payload = { ...formData, amount: parseFloat(formData.amount) };
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await createExpense(payload);
      }
      setShowAddModal(false);
      setEditingExpense(null);
      setFormData({
        amount: "",
        category: categories[0]?.name || "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        paymentMode: "Cash",
      });
      loadData();
      setSuccessMessage(editingExpense ? "Expense updated successfully!" : "Expense added successfully!");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (e) {
      Alert.alert("Error", "Failed to save expense");
    }
  };

  const handleDeleteExpense = (id: string, description?: string) => {
    setDeleteData({
      type: 'expense', id,
      title: "Delete Expense",
      subtitle: `Are you sure you want to delete "${description || 'this record'}"? This action cannot be undone.`
    });
  };

  const handleCategorySubmit = async () => {
    if (!catFormData.name) {
      Alert.alert("Required", "Category name is required");
      return;
    }
    try {
      if (catFormData.id) {
        await updateCategory(catFormData.id, { name: catFormData.name, color: catFormData.color, icon: catFormData.icon });
      } else {
        await createCategory({ name: catFormData.name, color: catFormData.color, icon: catFormData.icon });
      }
      setCatFormData({ id: "", name: "", color: "#64748B", icon: "MoreHorizontal" });
      loadData();
      setSuccessMessage(catFormData.id ? "Category updated successfully!" : "Category added successfully!");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (e) {
      Alert.alert("Error", "Failed to save category");
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteData({
      type: 'category', id,
      title: "Delete Category",
      subtitle: `Are you sure you want to delete "${name}"? Existing expenses will remain without category assignment.`
    });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      if (deleteData.type === 'expense') {
        await deleteExpense(deleteData.id);
      } else {
        await deleteCategory(deleteData.id);
      }
      setDeleteData(null);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to delete");
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpense = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const modeCounts = filteredExpenses.reduce((acc, curr) => {
    const mode = curr.paymentMode || 'Cash';
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const primaryMode = Object.keys(modeCounts).sort((a, b) => modeCounts[b] - modeCounts[a])[0] || 'N/A';

  if (currentView === 'pnl') {
    return <ExpensePnL ref={childRef} onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'reports') {
    return <ExpenseReports ref={childRef} onBack={() => setCurrentView('main')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpenseHeader
        onBack={onBack}
        onOpenAdd={() => {
          setEditingExpense(null);
          setFormData(prev => ({ ...prev, amount: "", description: "", date: new Date().toISOString().split('T')[0] }));
          setShowAddModal(true);
        }}
        onOpenCategory={() => setShowCategoryModal(true)}
        totalExpense={totalExpense}
        entryCount={filteredExpenses.length}
        primaryMode={primaryMode}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={categories}
        onOpenPnL={() => setCurrentView('pnl')}
        onOpenReports={() => setCurrentView('reports')}
      />

      <ExpenseList
        loading={loading}
        expenses={filteredExpenses}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setFormData({ amount: exp.amount.toString(), category: exp.category, description: exp.description || "", date: exp.date ? exp.date.substring(0, 10) : new Date().toISOString().split('T')[0], paymentMode: exp.paymentMode || "Cash" });
          setShowAddModal(true);
        }}
        onDelete={handleDeleteExpense}
      />

      <ExpenseModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingExpense={editingExpense}
        formData={formData}
        setFormData={setFormData}
        handleExpenseSubmit={handleExpenseSubmit}
        showCategoryModal={showCategoryModal}
        setShowCategoryModal={setShowCategoryModal}
        categories={categories}
        catFormData={catFormData}
        setCatFormData={setCatFormData}
        handleCategorySubmit={handleCategorySubmit}
        handleDeleteCategory={handleDeleteCategory}
        deleteData={deleteData}
        setDeleteData={setDeleteData}
        confirmDelete={confirmDelete}
        successMessage={successMessage}
      />
    </SafeAreaView>
  );
});

export default RestaurantExpensesMain;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});
