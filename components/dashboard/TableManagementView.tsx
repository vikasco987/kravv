import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { rf, s, vs } from "../../utils/responsive";
import QRMenuTemplateView from "./QRMenuTemplateView";

export default function TableManagementView({ onClose }: any) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Table State
  const [newName, setNewName] = useState("");
  const [newZone, setNewZone] = useState("Default");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Table State
  const [editingTable, setEditingTable] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editZone, setEditZone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [availableZones, setAvailableZones] = useState(["Default"]);
  const [multiZoneEnabled, setMultiZoneEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isCustomNewZone, setIsCustomNewZone] = useState(false);
  const [isCustomEditZone, setIsCustomEditZone] = useState(false);

  // Success Modal State
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  const { user } = useUser();

  // QR Template View
  const [selectedQRTable, setSelectedQRTable] = useState<any>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const { getToken } = useAuth();

  const getAuthToken = async () => {
    try {
      const clerkToken = await getToken();
      let staffToken = await AsyncStorage.getItem("staff_token");

      if (!staffToken) {
        const sessionStr = await AsyncStorage.getItem("staff_session");
        if (sessionStr) {
          try {
            const sessionData = JSON.parse(sessionStr);
            staffToken = sessionData.token;
          } catch (e) { }
        }
      }

      const storedKeys = await AsyncStorage.multiGet(["authToken", "activeChildToken"]);
      const storedMap = Object.fromEntries(storedKeys);
      const legacyToken = storedMap["activeChildToken"] || storedMap["authToken"];

      return clerkToken || staffToken || legacyToken;
    } catch (e) {
      console.log("Error getting token", e);
      return null;
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const profRes = await fetch("https://billing.kravy.in/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `staff_token=${token}`
        }
      });
      let bId = null;
      if (profRes.ok) {
        const profData = await profRes.json();
        setUserProfile(profData);
        if (profData?.multiZoneMenuEnabled) {
          setMultiZoneEnabled(true);
        }
        bId = profData?._id || profData?.id || profData?.businessId;
      }

      const tableUrl = bId
        ? `https://billing.kravy.in/api/tables?businessId=${bId}`
        : `https://billing.kravy.in/api/tables`;

      const res = await fetch(tableUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `staff_token=${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTables(data || []);

        const tableZones = (data || []).map((t: any) => t.zone).filter(Boolean);
        const allUniqueZones = Array.from(new Set([...tableZones, "Default", "AC", "Non AC"]));
        setAvailableZones(allUniqueZones.sort() as string[]);
      }
    } catch (e) {
      console.log("Error fetching tables", e);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  const handleCreateTable = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const token = await getAuthToken();
      const payload: any = { name: newName.trim(), zone: newZone };
      if (userProfile?._id || userProfile?.id || userProfile?.businessId) {
        payload.businessId = userProfile._id || userProfile.id || userProfile.businessId;
      }

      const res = await fetch("https://billing.kravy.in/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Cookie: `staff_token=${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const t = await res.json();
        setTables(prev => {
          if (prev.some(table => table.id === t.id)) return prev;
          return [...prev, t];
        });
        setNewName("");
        showSuccess(`Table "${t.name}" added successfully!`);
      }
    } catch (e) {
      console.log("Error creating table", e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTable || !editName.trim()) return;
    setIsUpdating(true);
    try {
      const token = await getAuthToken();
      const payload = { id: editingTable.id || editingTable._id, name: editName.trim(), zone: editZone };

      const res = await fetch("https://billing.kravy.in/api/tables", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Cookie: `staff_token=${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setTables(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t));
        setEditingTable(null);
        showSuccess("Table updated successfully!");
      }
    } catch (e) {
      console.log("Error updating table", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`https://billing.kravy.in/api/tables?id=${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `staff_token=${token}`
        }
      });

      if (res.ok) {
        setTables(prev => prev.filter(t => (t.id !== deleteConfirmId && t._id !== deleteConfirmId)));
        setDeleteConfirmId(null);
        showSuccess("Table deleted successfully!");
      }
    } catch (e) {
      console.log("Error deleting table", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateTableUrl = (id: string, name: string) => {
    // 1. If profile explicitly provides a businessId (some custom staff profiles might)
    let bid = userProfile?.businessId || userProfile?.business_id;

    // 2. The most reliable Owner ID from the fetched BusinessProfile
    if (!bid && userProfile?.userId) {
      bid = userProfile.userId;
    }

    // 3. Fallback to Clerk's authenticated user ID
    if (!bid && user?.id) {
      bid = user.id;
    }

    // 4. Last resort fallback to MongoDB profile ID
    if (!bid) {
      bid = userProfile?.id || userProfile?._id || "";
    }

    return `https://billing.kravy.in/menu/${bid}?tableId=${encodeURIComponent(id)}&tableName=${encodeURIComponent(name)}`;
  };

  const copyTableUrl = async (id: string, name: string) => {
    const url = generateTableUrl(id, name);
    try {
      await Share.share({ message: url });
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.log("Error copying", e);
    }
  };

  const openQRTemplate = (table: any) => {
    setSelectedQRTable(table);
  };

  const filteredTables = tables.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* HEADER WIDGET (Matches Website EXACTLY) */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Feather name="arrow-left" size={rf(16)} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerIconContainer}>
            <Feather name="grid" size={rf(16)} color="#fff" />
          </View>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Table Management</Text>
            <Text style={styles.subtitle}>Create tables & generate QR codes</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.activePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.activePillText}>{tables.length}</Text>
              <Text style={styles.activePillSub}>Tables Active</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchTables}>
              <Feather name="refresh-cw" size={rf(12)} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" {...{ delaysContentTouches: false } as any}>
        {/* ADD TABLE FORM */}
        <View style={styles.addCard}>
          <View style={styles.addCardHeader}>
            <View style={styles.addIconBox}>
              <Feather name="plus" size={rf(10)} color="#4F46E5" />
            </View>
            <Text style={styles.addCardTitle}>Add New Table</Text>
          </View>
          <View style={styles.addCardBody}>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <Feather name="grid" size={rf(12)} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Table name — e.g. T-01, VIP-1..."
                  placeholderTextColor="#94A3B8"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>
            </View>

            {multiZoneEnabled && (
              <View style={{ marginTop: vs(12) }}>
                <Text style={{ fontSize: rf(10), fontWeight: "800", color: "#64748B", marginBottom: vs(8), textTransform: "uppercase" }}>SELECT ZONE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(4) }} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                  {[...availableZones.filter(z => z !== "Default"), "Default", "+ Custom"].map((zone) => {
                    const isSelected = zone === "+ Custom" ? isCustomNewZone : (!isCustomNewZone && newZone === zone);
                    return (
                      <TouchableOpacity
                        key={zone}
                        style={{
                          paddingHorizontal: s(12),
                          paddingVertical: vs(6),
                          backgroundColor: isSelected ? "#4F46E5" : "#F8FAFC",
                          borderRadius: s(8),
                          marginRight: s(8),
                          borderWidth: 1,
                          borderColor: isSelected ? "#4F46E5" : "#E2E8F0"
                        }}
                        onPress={() => {
                          if (zone === "+ Custom") {
                            setIsCustomNewZone(true);
                            setNewZone("");
                          } else {
                            setIsCustomNewZone(false);
                            setNewZone(zone);
                          }
                        }}
                      >
                        <Text style={{ fontSize: rf(10), fontWeight: "bold", color: isSelected ? "#fff" : "#64748B" }}>
                          {zone === "Default" ? "None" : zone}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {isCustomNewZone && (
                  <View style={[styles.inputWrapper, { marginTop: vs(8) }]}>
                    <Feather name="edit-2" size={rf(12)} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter custom zone name"
                      value={newZone}
                      onChangeText={setNewZone}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                )}
              </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: vs(12) }}>
              <View style={styles.quickTipsRow}>
                {["T-01", "VIP-1", "Rooftop"].map(tip => (
                  <TouchableOpacity key={tip} style={styles.tipBadge} onPress={() => setNewName(tip)}>
                    <Text style={styles.tipText}>{tip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.addBtn, (!newName.trim() || isCreating) && { opacity: 0.5 }]}
                onPress={handleCreateTable}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="plus" size={rf(12)} color="#fff" />
                    <Text style={styles.addBtnText}>Add Table</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SEARCH BAR */}
        {tables.length > 0 && (
          <View style={styles.searchContainer}>
            <Feather name="search" size={rf(12)} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tables..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={rf(12)} color="#64748B" />
              </TouchableOpacity>
            )}
            <Text style={styles.searchMeta}>
              Showing {filteredTables.length} of {tables.length}
            </Text>
          </View>
        )}

        {/* TABLES GRID */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading tables...</Text>
          </View>
        ) : tables.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="table-off" size={rf(32)} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No tables yet</Text>
            <Text style={styles.emptySubtitle}>Add your first table above to generate a QR code for ordering</Text>
          </View>
        ) : filteredTables.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="search" size={rf(24)} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No matches</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredTables.map((t, i) => (
              <View key={i} style={styles.tableCard}>
                <View style={styles.cardGradientStrip} />
                <View style={styles.tableCardHeader}>
                  <View>
                    <Text style={styles.tableLabel}>TABLE</Text>
                    <Text style={styles.tableName}>{t.name}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={styles.qrIconBadge}>
                      <MaterialCommunityIcons name="qrcode-scan" size={rf(10)} color="#4F46E5" />
                    </View>
                    {multiZoneEnabled && t.zone && (
                      <View style={styles.zoneBadge}>
                        <Text style={styles.zoneBadgeText}>{t.zone}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.qrContainer}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={generateTableUrl(t.id || t._id, t.name)}
                      size={s(120)}
                    />
                  </View>
                </View>

                <View style={styles.urlPreviewBox}>
                  <Text style={styles.urlPreviewText} numberOfLines={1}>
                    {generateTableUrl(t.id || t._id, t.name).replace("https://", "")}
                  </Text>
                </View>

                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={[styles.actionButton, copiedId === (t.id || t._id) && { backgroundColor: "#10B981", borderColor: "#10B981" }]}
                    onPress={() => copyTableUrl(t.id || t._id, t.name)}
                  >
                    <Feather name="copy" size={rf(9)} color={copiedId === (t.id || t._id) ? "#fff" : "#64748B"} />
                    <Text style={[styles.actionBtnText, copiedId === (t.id || t._id) && { color: "#fff" }]}>
                      {copiedId === (t.id || t._id) ? "Copied!" : "Copy Link"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openQRTemplate(t)}
                  >
                    <Feather name="download" size={rf(9)} color="#64748B" />
                    <Text style={styles.actionBtnText}>Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "rgba(79, 70, 229, 0.08)", borderColor: "rgba(79, 70, 229, 0.2)" }]}
                    onPress={() => {
                      setEditingTable(t);
                      setEditName(t.name);
                      const z = t.zone || "Default";
                      setEditZone(z);
                      if (!availableZones.includes(z) && z !== "Default") {
                        setIsCustomEditZone(true);
                      } else {
                        setIsCustomEditZone(false);
                      }
                    }}
                  >
                    <Feather name="edit-2" size={rf(9)} color="#4F46E5" />
                    <Text style={[styles.actionBtnText, { color: "#4F46E5" }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(generateTableUrl(t.id || t._id, t.name))}
                  >
                    <Feather name="eye" size={rf(9)} color="#64748B" />
                    <Text style={styles.actionBtnText}>Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "rgba(244, 63, 94, 0.08)", borderColor: "rgba(244, 63, 94, 0.2)" }]}
                    onPress={() => setDeleteConfirmId(t.id || t._id)}
                  >
                    <Feather name="trash-2" size={rf(9)} color="#F43F5E" />
                    <Text style={[styles.actionBtnText, { color: "#F43F5E" }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={!!editingTable} transparent animationType="fade" onRequestClose={() => setEditingTable(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
                <Feather name="edit" size={rf(14)} color="#4F46E5" />
                <Text style={styles.editModalTitle}>Edit Table</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingTable(null)}>
                <Feather name="x" size={rf(16)} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.editModalBody}>
              <Text style={styles.inputLabel}>TABLE NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
              />
              {multiZoneEnabled && (
                <View style={{ marginTop: vs(12) }}>
                  <Text style={styles.inputLabel}>ZONE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(8) }} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                    {[...availableZones.filter(z => z !== "Default"), "Default", "+ Custom"].map((zone) => {
                      const isSelected = zone === "+ Custom" ? isCustomEditZone : (!isCustomEditZone && editZone === zone);
                      return (
                        <TouchableOpacity
                          key={zone}
                          style={{
                            paddingHorizontal: s(12),
                            paddingVertical: vs(8),
                            backgroundColor: isSelected ? "#4F46E5" : "#F8FAFC",
                            borderRadius: s(8),
                            marginRight: s(8),
                            borderWidth: 1,
                            borderColor: isSelected ? "#4F46E5" : "#E2E8F0"
                          }}
                          onPress={() => {
                            if (zone === "+ Custom") {
                              setIsCustomEditZone(true);
                              setEditZone("");
                            } else {
                              setIsCustomEditZone(false);
                              setEditZone(zone);
                            }
                          }}
                        >
                          <Text style={{ fontSize: rf(11), fontWeight: "bold", color: isSelected ? "#fff" : "#64748B" }}>
                            {zone === "Default" ? "None" : zone}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {isCustomEditZone && (
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter custom zone name"
                      value={editZone}
                      onChangeText={setEditZone}
                      placeholderTextColor="#9CA3AF"
                    />
                  )}
                </View>
              )}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingTable(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, isUpdating && { opacity: 0.6 }]}
                  onPress={handleUpdateTable}
                  disabled={isUpdating}
                >
                  {isUpdating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal visible={!!deleteConfirmId} transparent animationType="slide" onRequestClose={() => setDeleteConfirmId(null)}>
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <View style={styles.trashIconBox}>
              <Feather name="trash-2" size={rf(20)} color="#F43F5E" />
            </View>
            <Text style={styles.deleteTitle}>Delete Table?</Text>
            <Text style={styles.deleteSubtitle}>This table and its QR code will be permanently deleted. This action cannot be undone.</Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDeleteTable}
                disabled={isDeleting}
              >
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmDeleteText}>Yes, Delete</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelDeleteBtn} onPress={() => setDeleteConfirmId(null)}>
                <Text style={styles.cancelDeleteText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={successModalVisible} transparent animationType="fade" onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Feather name="check" size={rf(32)} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successBtnText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR TEMPLATE MODAL */}
      <Modal visible={!!selectedQRTable} transparent animationType="slide" onRequestClose={() => setSelectedQRTable(null)}>
        {selectedQRTable && (
          <QRMenuTemplateView
            onClose={() => setSelectedQRTable(null)}
            businessName={userProfile?.name || userProfile?.businessName || "My Restaurant"}
            tableId={selectedQRTable.id || selectedQRTable._id}
            tableName={selectedQRTable.name}
            qrUrl={generateTableUrl(selectedQRTable.id || selectedQRTable._id, selectedQRTable.name)}
          />
        )}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: s(16),
    paddingTop: Platform.OS === "android" ? vs(50) : vs(16),
    paddingBottom: vs(16),
    marginBottom: vs(12),
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: s(8),
    marginRight: s(4),
  },
  headerIconContainer: {
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: rf(9),
    color: "#64748B",
    fontWeight: "600",
    marginTop: vs(2),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.15)",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(8),
    gap: s(4),
  },
  pulseDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: "#10B981",
  },
  activePillText: {
    fontSize: rf(10),
    fontWeight: "900",
    color: "#0F172A",
  },
  activePillSub: {
    fontSize: rf(8),
    fontWeight: "700",
    color: "#64748B",
  },
  refreshButton: {
    width: s(28),
    height: s(28),
    backgroundColor: "#F8FAFC",
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: s(16),
    paddingBottom: vs(100),
  },
  addCard: {
    backgroundColor: "#fff",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: vs(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: "rgba(248, 250, 252, 0.4)",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  addIconBox: {
    width: s(24),
    height: s(24),
    borderRadius: s(6),
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  addCardTitle: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#0F172A",
  },
  addCardBody: {
    padding: s(16),
  },
  inputRow: {
    flexDirection: "row",
    gap: s(12),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    paddingHorizontal: s(12),
  },
  inputIcon: {
    marginRight: s(8),
  },
  input: {
    flex: 1,
    paddingVertical: vs(10),
    fontSize: rf(11),
    fontWeight: "600",
    color: "#1E293B",
  },
  quickTipsRow: {
    flexDirection: "row",
    gap: s(6),
  },
  tipBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tipText: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#64748B",
    textTransform: "uppercase",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    backgroundColor: "#4F46E5",
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderRadius: s(10),
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    fontSize: rf(10),
    fontWeight: "900",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    marginBottom: vs(16),
  },
  searchIcon: {
    marginRight: s(8),
  },
  searchInput: {
    flex: 1,
    fontSize: rf(11),
    fontWeight: "600",
    color: "#1E293B",
    paddingVertical: vs(4),
  },
  searchMeta: {
    fontSize: rf(9),
    fontWeight: "700",
    color: "#64748B",
    marginLeft: s(8),
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(40),
  },
  loadingText: {
    marginTop: vs(12),
    fontSize: rf(11),
    color: "#64748B",
    fontWeight: "600",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(40),
    backgroundColor: "#fff",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyIconBox: {
    width: s(64),
    height: s(64),
    borderRadius: s(20),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  emptyTitle: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(4),
  },
  emptySubtitle: {
    fontSize: rf(10),
    color: "#64748B",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tableCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: vs(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardGradientStrip: {
    height: vs(4),
    backgroundColor: "#4F46E5",
    opacity: 0.8,
  },
  tableCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: s(12),
    paddingBottom: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  tableLabel: {
    fontSize: rf(8),
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: vs(2),
  },
  tableName: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  qrIconBadge: {
    width: s(24),
    height: s(24),
    borderRadius: s(8),
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(4),
  },
  zoneBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
  },
  zoneBadgeText: {
    fontSize: rf(7),
    fontWeight: "900",
    color: "#10B981",
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: vs(16),
  },
  qrWrapper: {
    padding: s(12),
    backgroundColor: "#fff",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  urlPreviewBox: {
    paddingHorizontal: s(12),
    paddingBottom: vs(12),
  },
  urlPreviewText: {
    fontSize: rf(8),
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#64748B",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(4),
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: s(10),
    gap: s(6),
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(4),
    paddingVertical: vs(8),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(8),
  },
  actionBtnText: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#64748B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: s(24),
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(20),
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  editModalTitle: {
    fontSize: rf(14),
    fontWeight: "900",
    color: "#0F172A",
  },
  editModalBody: {
    padding: s(20),
    gap: vs(12),
  },
  inputLabel: {
    fontSize: rf(9),
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: vs(-8),
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    fontSize: rf(12),
    fontWeight: "700",
    color: "#1E293B",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: s(12),
    marginTop: vs(8),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: vs(14),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#64748B",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: vs(14),
    backgroundColor: "#4F46E5",
    borderRadius: s(12),
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#fff",
  },
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    padding: s(24),
    alignItems: "center",
  },
  trashIconBox: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(244, 63, 94, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  deleteTitle: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(8),
  },
  deleteSubtitle: {
    fontSize: rf(11),
    color: "#64748B",
    textAlign: "center",
    marginBottom: vs(24),
    lineHeight: vs(18),
  },
  deleteBtnRow: {
    width: "100%",
    gap: vs(12),
  },
  confirmDeleteBtn: {
    width: "100%",
    paddingVertical: vs(14),
    backgroundColor: "#F43F5E",
    borderRadius: s(12),
    alignItems: "center",
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmDeleteText: {
    fontSize: rf(11),
    fontWeight: "900",
    color: "#fff",
  },
  cancelDeleteBtn: {
    width: "100%",
    paddingVertical: vs(14),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: s(12),
    alignItems: "center",
  },
  cancelDeleteText: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#64748B",
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    backgroundColor: "#fff",
    width: "80%",
    maxWidth: 400,
    borderRadius: s(24),
    padding: s(24),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(16),
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: rf(16),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: vs(8),
  },
  successMessage: {
    fontSize: rf(11),
    color: "#64748B",
    textAlign: "center",
    marginBottom: vs(24),
    lineHeight: vs(18),
  },
  successBtn: {
    backgroundColor: "#10B981",
    paddingVertical: vs(12),
    paddingHorizontal: s(32),
    borderRadius: s(12),
    width: "100%",
    alignItems: "center",
  },
  successBtnText: {
    color: "#fff",
    fontSize: rf(11),
    fontWeight: "900",
    letterSpacing: 1,
  },
});
