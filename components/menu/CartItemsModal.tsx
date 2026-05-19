import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";
const THEME_DANGER = "#DC2626";

interface CartItem {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
}

interface CartItemsModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalItems: number;
  totalAmount: number;
  onAdd: (item: any) => void;
  onRemove: (item: any) => void;
  onDelete: (item: any) => void;
  onClear: () => void;
  onEditPrice?: (itemId: string, newPrice: number) => void;
}

export const CartItemsModal: React.FC<CartItemsModalProps> = ({
  visible,
  onClose,
  cartItems,
  totalItems,
  totalAmount,
  onAdd,
  onRemove,
  onDelete,
  onClear,
  onEditPrice,
}) => {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [tempPrice, setTempPrice] = React.useState<string>("");

  const handleEditStart = (item: CartItem) => {
    setEditingItemId(item.id);
    setTempPrice((item.editedPrice ?? item.price ?? 0).toString());
  };

  const handleEditSave = (itemId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && onEditPrice) {
      onEditPrice(itemId, newPrice);
    }
    setEditingItemId(null);
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selected Items ({totalItems})</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cartItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 12 }}>₹</Text>
                    {editingItemId === item.id ? (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <TextInput
                          style={styles.priceInput}
                          value={tempPrice}
                          onChangeText={setTempPrice}
                          keyboardType="numeric"
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() => handleEditSave(item.id)}
                          style={{ marginLeft: s(5) }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#10B981"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleEditCancel}
                          style={{ marginLeft: s(5) }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={THEME_DANGER}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={styles.cartItemPrice}>
                          {item.editedPrice ?? item.price ?? 0}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleEditStart(item)}
                          style={{ marginLeft: s(8) }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color={THEME_PRIMARY}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cartItemActions}>
                  <Text style={styles.cartItemTotal}>
                    ₹
                    {(
                      (item.editedPrice ?? item.price ?? 0) * item.quantity
                    ).toFixed(0)}
                  </Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      onPress={() => onRemove(item)}
                      style={styles.qtyBtn}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color={THEME_DANGER}
                      />
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => onAdd(item)}
                      style={styles.qtyBtn}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#10B981"
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDelete(item)}
                    style={{ marginLeft: s(12) }}
                  >
                    <Ionicons name="trash" size={20} color={THEME_DANGER} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>Total Amount</Text>
              <Text style={styles.modalTotalValue}>
                ₹{totalAmount.toFixed(0)}
              </Text>
            </View>
            <TouchableOpacity style={styles.clearAllButton} onPress={onClear}>
              <Ionicons
                name="trash-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.clearAllText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Dim background
    justifyContent: "flex-end",
    paddingBottom: vs(45), // Increased to lift higher from bottom system bar
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(35),
    borderTopRightRadius: s(35),
    padding: s(20),
    maxHeight: "75%", // Increased from 75% to 82% to go a bit higher
    width: "100%",
    elevation: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  modalHandle: {
    width: s(40),
    height: vs(5),
    backgroundColor: "#E5E7EB",
    borderRadius: s(3),
    marginBottom: vs(15),
    alignSelf: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
  },
  modalTitle: {
    fontSize: rf(22),
    fontWeight: "900",
    color: "#1E293B",
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cartItemName: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#1E293B",
  },
  cartItemPrice: {
    fontSize: rf(12),
    color: "#6B7280",
  },
  priceInput: {
    fontSize: rf(12),
    color: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: THEME_PRIMARY,
    padding: 0,
    minWidth: s(40),
    fontWeight: "700",
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartItemTotal: {
    fontWeight: "bold",
    fontSize: rf(14),
    marginRight: s(15),
    width: s(60),
    textAlign: "right",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: s(8),
    padding: s(2),
  },
  qtyBtn: {
    padding: s(4),
  },
  qtyVal: {
    paddingHorizontal: s(8),
    fontWeight: "bold",
    fontSize: rf(14),
  },
  modalFooter: {
    marginTop: vs(20),
    paddingTop: vs(15),
    borderTopWidth: 2,
    borderTopColor: "#F3F4F6",
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(15),
  },
  modalTotalLabel: {
    fontSize: rf(18),
    fontWeight: "bold",
  },
  modalTotalValue: {
    fontSize: rf(20),
    fontWeight: "900",
    color: THEME_PRIMARY,
  },
  clearAllButton: {
    backgroundColor: THEME_DANGER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(12),
    borderRadius: s(10),
  },
  clearAllText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: rf(14),
  },
});
