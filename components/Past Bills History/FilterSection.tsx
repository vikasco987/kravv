import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, ChevronDown, Search } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { rf, s, vs } from "../../utils/responsive";

const CustomDropdown = ({ selectedValue, onValueChange, items, width }: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ width }}>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownText}>{selectedValue}</Text>
        <ChevronDown size={rf(14)} color="#64748B" />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <ScrollView>
              {items.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedValue === item.value && { color: "#6366F1", fontWeight: "900" }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

interface FilterSectionProps {
  colFilters: any;
  setColFilters: (filters: any) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  onApply: () => void;
}

export const FilterSection = ({
  colFilters,
  setColFilters,
  dateRange,
  setDateRange,
  onApply,
}: FilterSectionProps) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onStartChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      setDateRange({ ...dateRange, start: dateStr });
    }
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      setDateRange({ ...dateRange, end: dateStr });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={rf(14)} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Bill No, Phone or Name..."
            placeholderTextColor="#94A3B8"
            value={colFilters.billNumber}
            onChangeText={(text) => setColFilters({ ...colFilters, billNumber: text })}
          />
        </View>

        {/* Type Dropdown */}
        <CustomDropdown
          width="48%"
          selectedValue={colFilters.orderType}
          onValueChange={(val: string) => setColFilters({ ...colFilters, orderType: val })}
          items={[
            { label: "All Types", value: "All Types" },
            { label: "Counter", value: "Counter" },
            { label: "Takeaway", value: "Takeaway" },
            { label: "Dine-in", value: "Dine-in" },
          ]}
        />

        {/* Payment Dropdown */}
        <CustomDropdown
          width="48%"
          selectedValue={colFilters.paymentModeFilter}
          onValueChange={(val: string) => setColFilters({ ...colFilters, paymentModeFilter: val })}
          items={[
            { label: "All Payments", value: "All Payments" },
            { label: "Cash", value: "Cash" },
            { label: "UPI", value: "UPI" },
            { label: "Card", value: "Card" },
            { label: "Wallet", value: "Wallet" },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.dateContainer}>
          <Calendar size={rf(14)} color="#6366F1" />
          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateText}>{dateRange.start}</Text>
          </TouchableOpacity>
          <Text style={styles.dateTextLabel}>to</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateText}>{dateRange.end}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={new Date(dateRange.start)}
              mode="date"
              display="default"
              onChange={onStartChange}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={new Date(dateRange.end)}
              mode="date"
              display="default"
              onChange={onEndChange}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FAFC",
    padding: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: vs(16),
    gap: vs(12),
  },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(12),
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchContainer: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: s(12),
    zIndex: 1,
  },
  searchInput: {
    height: vs(40),
    backgroundColor: "white",
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingLeft: s(36),
    paddingRight: s(12),
    fontSize: rf(12),
    fontWeight: "700",
    color: "#1E293B",
  },
  dropdownBtn: {
    height: vs(40),
    backgroundColor: "white",
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(12),
  },
  dropdownText: {
    fontSize: rf(12),
    fontWeight: "700",
    color: "#1E293B",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dropdownMenu: {
    width: "70%",
    maxHeight: vs(200),
    backgroundColor: "white",
    borderRadius: s(16),
    padding: s(8),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  dropdownItem: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#E0E7FF",
    gap: s(8),
    flex: 1,
  },
  dateText: {
    fontSize: rf(12),
    fontWeight: "800",
    color: "#1E293B",
  },
  dateTextLabel: {
    fontSize: rf(12),
    fontWeight: "800",
    color: "#6366F1",
    marginHorizontal: s(4),
  },
  applyBtn: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: s(16),
    paddingVertical: vs(6),
    borderRadius: s(8),
    marginLeft: s(8),
  },
  applyBtnText: {
    color: "white",
    fontSize: rf(11),
    fontWeight: "800",
  },
});
