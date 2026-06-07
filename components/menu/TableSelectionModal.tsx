import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THEME_PRIMARY = "#4F46E5";

interface Table {
  id: string;
  name: string;
}

interface TableSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTable: string | null;
  selectedRoom: string | null;
  onSelect: (tableName: string | null, roomName: string | null) => void;
  tableBookingEnabled?: boolean;
  roomBookingEnabled?: boolean;
  activeTabOverride?: "Table" | "Room";
}

export const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
  visible,
  onClose,
  selectedTable,
  selectedRoom,
  onSelect,
  tableBookingEnabled,
  roomBookingEnabled,
  activeTabOverride,
}) => {
  const { getToken } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"Table" | "Room">(
    tableBookingEnabled ? "Table" : "Room",
  );
  const [tempTable, setTempTable] = useState<string | null>(selectedTable);
  const [tempRoom, setTempRoom] = useState<string | null>(selectedRoom);

  useEffect(() => {
    if (visible) {
      setTempTable(selectedTable);
      setTempRoom(selectedRoom);
      if (activeTabOverride) {
        setActiveTab(activeTabOverride);
      } else if (tableBookingEnabled && roomBookingEnabled) {
        // Keep current tab
      } else {
        setActiveTab(tableBookingEnabled ? "Table" : "Room");
      }
      fetchTables();
    }
  }, [visible]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch("https://billing.kravy.in/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTables(data || []);
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetHeader}>
            <View>
              <Text style={styles.bottomSheetTitle}>Selection</Text>
              <Text style={styles.bottomSheetSubtitle}>
                Choose table and/or room
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={rf(28)} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {tableBookingEnabled && roomBookingEnabled && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "Table" && styles.activeTab]}
                onPress={() => setActiveTab("Table")}
              >
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={activeTab === "Table" ? "#fff" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "Table" && styles.activeTabText,
                  ]}
                >
                  Tables
                </Text>
                {tempTable && <View style={styles.dot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "Room" && styles.activeTab]}
                onPress={() => setActiveTab("Room")}
              >
                <Ionicons
                  name="bed-outline"
                  size={16}
                  color={activeTab === "Room" ? "#fff" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "Room" && styles.activeTabText,
                  ]}
                >
                  Rooms
                </Text>
                {tempRoom && <View style={styles.dot} />}
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME_PRIMARY} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: vs(10) }}
               {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                <View style={styles.tableGrid}>
                  {tables
                    .filter((t) => {
                      if (activeTab === "Room") {
                        return t.name.toLowerCase().startsWith("room");
                      } else {
                        return !t.name.toLowerCase().startsWith("room");
                      }
                    })
                    .map((t) => {
                      const isSelected =
                        activeTab === "Table"
                          ? tempTable === t.name
                          : tempRoom === t.name;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.tableItem,
                            isSelected && styles.tableItemSelected,
                          ]}
                          onPress={() => {
                            if (activeTab === "Table")
                              setTempTable(
                                tempTable === t.name ? null : t.name,
                              );
                            else
                              setTempRoom(tempRoom === t.name ? null : t.name);
                          }}
                        >
                          <Text
                            style={[
                              styles.tableText,
                              isSelected && styles.tableTextSelected,
                            ]}
                          >
                            {t.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {tables.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name={
                        activeTab === "Room" ? "bed-outline" : "grid-outline"
                      }
                      size={rf(40)}
                      color="#D1D5DB"
                    />
                    <Text style={styles.emptyText}>
                      No items found. Create them in Management.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    if (activeTab === "Table") setTempTable(null);
                    else setTempRoom(null);
                  }}
                >
                  <Text style={styles.clearBtnText}>Clear {activeTab}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    onSelect(tempTable, tempRoom);
                    onClose();
                  }}
                >
                  <Text style={styles.confirmBtnText}>Confirm Selection</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    height: "75%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: s(32),
    borderTopRightRadius: s(32),
    paddingTop: vs(15),
    paddingHorizontal: s(20),
  },
  bottomSheetHandle: {
    width: s(40),
    height: vs(5),
    backgroundColor: "#E5E7EB",
    borderRadius: s(3),
    alignSelf: "center",
    marginBottom: vs(15),
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(20),
  },
  bottomSheetTitle: {
    fontSize: rf(20),
    fontWeight: "800",
    color: "#111827",
  },
  bottomSheetSubtitle: {
    fontSize: rf(12),
    color: "#6B7280",
    marginTop: vs(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: s(12),
  },
  tableItem: {
    width: (SCREEN_WIDTH - s(40) - s(40)) / 3.2,
    height: s(55),
    backgroundColor: "#F9FAFB",
    borderRadius: s(15),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: s(5),
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  tableItemSelected: {
    backgroundColor: THEME_PRIMARY,
    borderColor: THEME_PRIMARY,
    elevation: 4,
  },
  tableText: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#374151",
  },
  tableTextSelected: {
    color: "#FFFFFF",
  },
  clearTableBtn: {
    marginTop: vs(30),
    paddingVertical: vs(14),
    backgroundColor: "#F9FAFB",
    borderRadius: s(15),
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  clearTableText: {
    fontSize: rf(14),
    color: "#6B7280",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: vs(50),
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: rf(14),
    textAlign: "center",
    marginTop: vs(10),
    paddingHorizontal: s(20),
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: s(12),
    padding: s(4),
    marginBottom: vs(15),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(10),
    borderRadius: s(10),
    gap: s(6),
  },
  activeTab: {
    backgroundColor: THEME_PRIMARY,
    elevation: 2,
  },
  tabText: {
    fontSize: rf(13),
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#fff",
  },
  dot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: "#10B981",
    position: "absolute",
    top: vs(6),
    right: s(10),
  },
  footer: {
    flexDirection: "row",
    paddingTop: vs(15),
    paddingBottom: vs(45),
    gap: s(10),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  clearBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  clearBtnText: {
    fontSize: rf(14),
    color: "#6B7280",
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: THEME_PRIMARY,
    paddingVertical: vs(12),
    borderRadius: s(12),
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: rf(14),
    color: "#fff",
    fontWeight: "700",
  },
});
