import { AlertTriangle, Calendar, CheckCircle, Coffee, Edit3, IndianRupee, Lightbulb, MoreHorizontal, Pizza, Rocket, ShoppingCart, Trash2, Users, Utensils, Wallet, X } from 'lucide-react-native';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rf, s, vs } from '../../utils/responsive';

const AVAILABLE_ICONS = [
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Wallet', component: Wallet },
  { name: 'Users', component: Users },
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'Rocket', component: Rocket },
  { name: 'Coffee', component: Coffee },
  { name: 'Utensils', component: Utensils },
  { name: 'Pizza', component: Pizza },
  { name: 'MoreHorizontal', component: MoreHorizontal },
];

interface ExpenseModalsProps {
  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  editingExpense: any;
  formData: any;
  setFormData: (val: any) => void;
  handleExpenseSubmit: () => void;

  showCategoryModal: boolean;
  setShowCategoryModal: (val: boolean) => void;
  categories: any[];
  catFormData: any;
  setCatFormData: (val: any) => void;
  handleCategorySubmit: () => void;
  handleDeleteCategory: (id: string, name: string) => void;

  deleteData: { title: string, subtitle: string } | null;
  setDeleteData: (val: any) => void;
  confirmDelete: () => void;
  successMessage: string | null;
}

export default function ExpenseModals({
  showAddModal, setShowAddModal, editingExpense, formData, setFormData, handleExpenseSubmit,
  showCategoryModal, setShowCategoryModal, categories, catFormData, setCatFormData, handleCategorySubmit, handleDeleteCategory,
  deleteData, setDeleteData, confirmDelete, successMessage
}: ExpenseModalsProps) {
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push(`${year}-${mStr}-${dStr}`);
    }

    return (
      <View style={[styles.calendarContainer, { marginTop: 0, borderWidth: 0, padding: 0 }]}>
        <View style={styles.calendarHeaderRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.calendarDayText}>{d}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {days.map((dateStr, i) => {
            if (!dateStr) return <View key={i} style={styles.calendarCell} />;
            const isSelected = formData.date === dateStr;
            const dayNum = parseInt(dateStr.split('-')[2], 10);
            return (
              <TouchableOpacity
                key={i}
                style={[styles.calendarCell, isSelected && styles.calendarCellActive]}
                onPress={() => {
                  setFormData({ ...formData, date: dateStr });
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.calendarCellNum, isSelected && styles.calendarCellNumActive]}>{dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'android' ? -35 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingExpense ? "Edit Expense" : "New Expense"}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeBtn}><X size={rf(20)} color="#64748B" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: s(15) }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Amount (₹)</Text>
                  <View style={styles.amountInputContainer}>
                    <IndianRupee size={rf(20)} color="#E11D48" />
                    <TextInput style={styles.amountInput} value={formData.amount} onChangeText={t => setFormData({ ...formData, amount: t })} placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="numeric" />
                  </View>
                </View>
                <View style={{ flex: 0.8 }}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(!showDatePicker)}>
                    <Calendar size={rf(16)} color="#4F46E5" style={{ marginRight: s(8) }} />
                    <Text style={styles.dateBtnText}>{formData.date || "Select"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginTop: vs(15) }}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: vs(5) }}>
                  {categories.map(c => (
                    <TouchableOpacity key={c.id || c.name} onPress={() => setFormData({ ...formData, category: c.name })} style={[styles.catSelectBtn, formData.category === c.name && styles.catSelectBtnActive]}>
                      <Text style={[styles.catSelectText, formData.category === c.name && styles.catSelectTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={[styles.label, { marginTop: vs(15) }]}>Description</Text>
              <TextInput style={styles.textArea} value={formData.description} onChangeText={t => setFormData({ ...formData, description: t })} placeholder="What was this expense for?" placeholderTextColor="#94A3B8" multiline />

              <Text style={[styles.label, { marginTop: vs(15) }]}>Payment Mode</Text>
              <View style={{ flexDirection: 'row', gap: s(10), marginTop: vs(5) }}>
                {["Cash", "UPI", "Card"].map(mode => (
                  <TouchableOpacity key={mode} onPress={() => setFormData({ ...formData, paymentMode: mode })} style={[styles.modeBtn, formData.paymentMode === mode && styles.modeBtnActive]}>
                    <Text style={[styles.modeBtnText, formData.paymentMode === mode && styles.modeBtnTextActive]}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.submitBtn, { marginBottom: vs(40) }]} onPress={handleExpenseSubmit}>
                <Text style={styles.submitBtnText}>{editingExpense ? "Save Changes" : "Create Expense Entry"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Categories Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'android' ? -35 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Categories</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeBtn}><X size={rf(20)} color="#64748B" /></TouchableOpacity>
            </View>

            <View style={styles.catFormBox}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput style={styles.input} value={catFormData.name} onChangeText={t => setCatFormData({ ...catFormData, name: t })} placeholder="e.g. Ingredients" placeholderTextColor="#94A3B8" />

              <Text style={[styles.label, { marginTop: vs(15) }]}>Category Color</Text>
              <View style={{ flexDirection: 'row', gap: s(10), marginTop: vs(5) }}>
                {['#F59E0B', '#3B82F6', '#6366F1', '#10B981', '#F43F5E', '#8B5CF6'].map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setCatFormData({ ...catFormData, color })}
                    style={{ width: s(28), height: s(28), borderRadius: s(14), backgroundColor: color, borderWidth: catFormData.color === color ? 3 : 0, borderColor: '#0F172A' }}
                  />
                ))}
              </View>

              <Text style={[styles.label, { marginTop: vs(15) }]}>Category Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: vs(5), marginBottom: vs(15) }}>
                {AVAILABLE_ICONS.map(iconObj => {
                  const IconComp = iconObj.component;
                  const isSelected = catFormData.icon === iconObj.name;
                  return (
                    <TouchableOpacity
                      key={iconObj.name}
                      onPress={() => setCatFormData({ ...catFormData, icon: iconObj.name })}
                      style={{
                        width: s(36), height: s(36), borderRadius: s(18),
                        backgroundColor: isSelected ? '#E11D48' : '#F1F5F9',
                        justifyContent: 'center', alignItems: 'center',
                        marginRight: s(10)
                      }}
                    >
                      <IconComp size={rf(18)} color={isSelected ? '#FFF' : '#64748B'} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: s(12), marginTop: vs(15) }}>
                <TouchableOpacity style={[styles.submitBtnRow, { shadowColor: '#E11D48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]} onPress={handleCategorySubmit}>
                  <Text style={styles.submitBtnTextRow}>{catFormData.id ? "Update Category" : "Add Category"}</Text>
                </TouchableOpacity>
                {catFormData.id ? (
                  <TouchableOpacity style={[styles.submitBtnRow, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]} onPress={() => setCatFormData({ id: "", name: "", color: "#64748B", icon: "MoreHorizontal" })}>
                    <Text style={[styles.submitBtnTextRow, { color: '#64748B' }]}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <Text style={styles.label}>Existing Categories</Text>
            <ScrollView style={{ maxHeight: vs(300) }} contentContainerStyle={{ paddingBottom: vs(80) }}>
              {categories.map(cat => (
                <View key={cat.id || cat.name} style={styles.catItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: s(38), height: s(38), borderRadius: s(12), backgroundColor: cat.color || '#64748B', justifyContent: 'center', alignItems: 'center', marginRight: s(12), shadowColor: cat.color || '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
                      {(() => {
                        const iconMatch = AVAILABLE_ICONS.find(i => i.name === cat.icon);
                        const RenderIcon = iconMatch ? iconMatch.component : MoreHorizontal;
                        return <RenderIcon size={rf(18)} color="#FFF" />;
                      })()}
                    </View>
                    <Text style={styles.catItemName}>{cat.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: s(10) }}>
                    <TouchableOpacity onPress={() => setCatFormData({ id: cat.id, name: cat.name, color: cat.color, icon: cat.icon })} style={styles.actionIconButtonEdit}>
                      <Edit3 size={rf(16)} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)} style={styles.actionIconButtonDelete}>
                      <Trash2 size={rf(16)} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Beautiful Delete Confirmation Modal */}
      <Modal visible={!!deleteData} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconWrapper}>
              <AlertTriangle size={rf(32)} color="#E11D48" />
            </View>
            <Text style={styles.deleteTitle}>{deleteData?.title}</Text>
            <Text style={styles.deleteSubtitle}>{deleteData?.subtitle}</Text>

            <View style={styles.deleteActions}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setDeleteData(null)}>
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.deleteConfirmText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Beautiful Success Modal */}
      <Modal visible={!!successMessage} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.deleteModalContent}>
            <View style={[styles.deleteIconWrapper, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle size={rf(32)} color="#16A34A" />
            </View>
            <Text style={styles.deleteTitle}>Success!</Text>
            <Text style={styles.deleteSubtitle}>{successMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.deleteModalContent, { padding: s(20) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: vs(15) }}>
              <Text style={{ fontSize: rf(16), fontWeight: '800', color: '#0F172A' }}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ width: s(30), height: s(30), borderRadius: s(15), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                <X size={rf(16)} color="#64748B" />
              </TouchableOpacity>
            </View>
            {renderCalendar()}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: s(24), borderTopRightRadius: s(24), padding: s(25), maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(25) },
  modalTitle: { fontSize: rf(20), fontWeight: '800', color: '#0F172A' },
  closeBtn: { width: s(32), height: s(32), borderRadius: s(16), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: rf(11), fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: vs(8) },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: s(15), paddingHorizontal: s(15), height: vs(60), borderWidth: 1, borderColor: '#E2E8F0' },
  amountInput: { flex: 1, height: '100%', color: '#0F172A', fontSize: rf(24), fontWeight: '800', marginLeft: s(10) },
  catSelectBtn: { paddingHorizontal: s(15), height: vs(40), borderRadius: s(12), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: s(10), borderWidth: 1, borderColor: 'transparent' },
  catSelectBtnActive: { borderColor: '#E11D48', backgroundColor: '#FFF1F2' },
  catSelectText: { fontSize: rf(10), fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  catSelectTextActive: { color: '#E11D48' },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: s(15), padding: s(15), color: '#0F172A', fontSize: rf(14), minHeight: vs(80), textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
  modeBtn: { flex: 1, height: vs(45), borderRadius: s(12), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  modeBtnActive: { borderColor: '#0F172A', backgroundColor: '#0F172A' },
  modeBtnText: { fontSize: rf(11), fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  modeBtnTextActive: { color: '#FFFFFF' },
  submitBtn: { width: '100%', height: vs(55), borderRadius: s(16), backgroundColor: '#E11D48', justifyContent: 'center', alignItems: 'center', marginTop: vs(25), marginBottom: vs(40), shadowColor: '#E11D48', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  catFormBox: { backgroundColor: '#FFFFFF', padding: s(20), borderRadius: s(20), marginBottom: vs(25), borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  submitBtnRow: { flex: 1, height: vs(52), borderRadius: s(14), backgroundColor: '#E11D48', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: rf(14), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  submitBtnTextRow: { color: '#FFFFFF', fontSize: rf(11), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#F8FAFC', borderRadius: s(14), height: vs(50), color: '#0F172A', paddingHorizontal: s(15), fontSize: rf(14), borderWidth: 1, borderColor: '#E2E8F0' },
  catItem: { backgroundColor: '#FFFFFF', padding: s(16), borderRadius: s(16), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(12), borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  catItemName: { color: '#0F172A', fontSize: rf(15), fontWeight: '800' },
  actionIconButtonEdit: { width: s(36), height: s(36), borderRadius: s(12), backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  actionIconButtonDelete: { width: s(36), height: s(36), borderRadius: s(12), backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center' },

  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: s(24), padding: s(25), alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  deleteIconWrapper: { width: s(64), height: s(64), borderRadius: s(32), backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center', marginBottom: vs(20) },
  deleteTitle: { fontSize: rf(18), fontWeight: '800', color: '#0F172A', marginBottom: vs(10), textAlign: 'center' },
  deleteSubtitle: { fontSize: rf(13), color: '#64748B', textAlign: 'center', lineHeight: vs(20), marginBottom: vs(25) },
  deleteActions: { flexDirection: 'row', gap: s(12), width: '100%' },
  deleteCancelBtn: { flex: 1, height: vs(50), borderRadius: s(14), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  deleteCancelText: { color: '#475569', fontSize: rf(13), fontWeight: '700' },
  deleteConfirmBtn: { flex: 1, height: vs(50), borderRadius: s(14), backgroundColor: '#E11D48', justifyContent: 'center', alignItems: 'center', shadowColor: '#E11D48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  deleteConfirmText: { color: '#FFFFFF', fontSize: rf(13), fontWeight: '700' },

  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: s(14), paddingHorizontal: s(12), height: vs(60), borderWidth: 1, borderColor: '#C7D2FE' },
  dateBtnText: { color: '#312E81', fontSize: rf(12), fontWeight: '700' },
  calendarContainer: { backgroundColor: '#F8FAFC', borderRadius: s(16), padding: s(15), marginTop: vs(15), borderWidth: 1, borderColor: '#E2E8F0' },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: vs(10) },
  calendarDayText: { fontSize: rf(11), fontWeight: '800', color: '#94A3B8' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  calendarCell: { width: `${100 / 7}%`, height: vs(32), justifyContent: 'center', alignItems: 'center', marginBottom: vs(5) },
  calendarCellActive: { backgroundColor: '#E11D48', borderRadius: s(10) },
  calendarCellNum: { fontSize: rf(12), color: '#334155', fontWeight: '600' },
  calendarCellNumActive: { color: '#FFFFFF', fontWeight: '800' }
});
