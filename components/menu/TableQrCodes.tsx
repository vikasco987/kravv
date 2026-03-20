import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Download,
  Grid,
  Plus,
  Printer,
  QrCode,
  Trash2,
  X
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// KRAVY THEME COLORS (Orange / White / Black)
const COLORS = {
  PRIMARY: "#FC5C04", // Brand Orange
  SECONDARY: "#000000", // Black
  WHITE: "#FFFFFF",
  BG_LIGHT: "#F9FAFB",
  GRAY: "#6B7280",
  LIGHT_GRAY: "#E5E7EB",
  DANGER: "#EF4444",
};

interface Table {
  id: string;
  name: string;
}

const Shimmer = () => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.shimmerContainer}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Animated.View key={i} style={[styles.shimmerBox, { opacity: anim }]} />
      ))}
    </View>
  );
};

export const TableQrCodes = ({ onBack }: { onBack?: () => void }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { t } = useLanguage();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComingSoonVisible, setIsComingSoonVisible] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch("https://billing.kravy.in/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          const tablesArray = Array.isArray(data) ? data : (data.tables || []);
          const normalizedTables = tablesArray.map((t: any) => ({
            ...t,
            id: t.id || t._id || Math.random().toString()
          }));
          setTables(normalizedTables);
        } else {
          const text = await response.text();
          console.warn(`ℹ️ [TableQrCodes] Received non-JSON for tables. Status: ${response.status}. Body: ${text.slice(0, 50)}`);
        }
      } else {
        const text = await response.text();
        console.error(`❌ [TableQrCodes] Backend fetch failed: ${response.status}. Body: ${text.slice(0, 50)}`);
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const createTable = async () => {
    if (!newTableName.trim()) return;
    try {
      setIsSaving(true);
      const token = await getToken();
      const response = await fetch("https://billing.kravy.in/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTableName }),
      });
      if (response.ok) {
        setNewTableName("");
        setIsCreateModalVisible(false);
        fetchTables();
      }
    } catch (error) {
      console.error("Create table error:", error);
      Alert.alert("Error", "Could not create table.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTable = (id: string, name: string) => {
    setTableToDelete({ id, name });
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    try {
      setIsDeleting(true);
      const token = await getToken();
      const response = await fetch(`https://billing.kravy.in/api/tables?id=${tableToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setIsDeleteModalVisible(false);
        setTableToDelete(null);
        fetchTables();
      }
    } catch (error) {
      console.error("Delete table error:", error);
      Alert.alert("Error", "Could not delete table.");
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadQr = async () => {
    try {
      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sharing not available", "Could not share or save the QR code.");
      }
    } catch (err) {
      console.error("Capture error:", err);
      Alert.alert("Error", "Failed to capture QR code image.");
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openQrModal = (table: Table) => {
    setSelectedTable(table);
    setIsQrModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <ArrowLeft size={rf(26)} color={COLORS.SECONDARY} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t('table_qr_codes')}</Text>
        </View>
        <Shimmer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={rf(26)} color={COLORS.SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Plus size={rf(28)} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottomRow}>
          <Text style={styles.title}>{t('table_qr_codes')}</Text>
          <Text style={styles.subtitle}>{t('manage_tables_desc') || 'Manage your dining tables and QR codes'}</Text>
        </View>
      </View>

      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }) => (
          <View style={styles.tableCardContainer}>
            <TouchableOpacity
              style={styles.tableCard}
              onPress={() => openQrModal(item)}
            >
              <View style={styles.qrPreviewIcon}>
                <QrCode size={rf(32)} color={COLORS.PRIMARY} strokeWidth={1.5} />
              </View>
              <Text style={styles.tableName}>{item.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('live_qr') || 'Live QR'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => deleteTable(item.id, item.name)}
            >
              <Trash2 size={rf(18)} color={COLORS.DANGER} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Grid size={rf(60)} color={COLORS.LIGHT_GRAY} />
            <Text style={styles.emptyText}>{t('no_tables') || 'No tables created yet.'}</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsCreateModalVisible(true)}>
              <Text style={styles.emptyAddBtnText}>{t('add_new_table')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* QR Code Modal */}
      <Modal
        visible={isQrModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedTable?.name}</Text>
                <Text style={styles.modalSubtitle}>{user?.fullName || user?.username || "KRAVY"} Digital Menu</Text>
              </View>
              <TouchableOpacity onPress={() => setIsQrModalVisible(false)} style={styles.closeBtn}>
                <X size={rf(24)} color={COLORS.SECONDARY} />
              </TouchableOpacity>
            </View>

            {selectedTable && (
              <View style={styles.qrContainer}>
                <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }}>
                  <View style={styles.qrCaptureArea}>
                    <Text style={styles.qrBrandName}>{(user?.fullName || user?.username || "KRAVY").toUpperCase()}</Text>
                    <View style={styles.qrWrapper}>
                      <QRCode
                        value={`https://billing.kravy.in/menu/${user?.id}?tableId=${selectedTable.id}&tableName=${encodeURIComponent(selectedTable.name)}`}
                        size={s(180)}
                        color="#000"
                        backgroundColor="#fff"
                        enableLinearGradient={true}
                        linearGradient={["#000", "#333"]}
                      />
                    </View>
                    <Text style={styles.qrTableName}>{selectedTable.name}</Text>
                    <Text style={styles.qrScanPrompt}>{t('scan_to_view_menu') || 'Scan to View Menu'}</Text>
                  </View>
                </ViewShot>

                <Text style={styles.qrInstructions}>
                  {t('qr_instructions') || 'Let customers scan this to see your live menu and place orders.'}
                </Text>
              </View>
            )}

            <View style={styles.qrModalButtons}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={downloadQr}
              >
                <Download size={rf(18)} color="#fff" />
                <Text style={styles.btnText}>{t('download_qr') || 'Download QR'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={() => setIsComingSoonVisible(true)}
              >
                <Printer size={rf(18)} color={COLORS.SECONDARY} />
                <Text style={[styles.btnText, { color: COLORS.SECONDARY }]}>{t('print')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Table Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalContent}>
            <View style={styles.createHeader}>
              <Text style={styles.createTitle}>{t('add_new_table')}</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <X size={rf(20)} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>{t('table_name')?.toUpperCase() || 'TABLE NAME'}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Table 5, Booth A"
              value={newTableName}
              onChangeText={setNewTableName}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={createTable}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save_table') || 'Save Table'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconWrapper}>
              <Trash2 size={rf(32)} color={COLORS.DANGER} />
            </View>
            <Text style={styles.deleteTitle}>Delete Table?</Text>
            <Text style={styles.deleteDescription}>
              Are you sure you want to delete <Text style={{ fontWeight: 'bold', color: COLORS.SECONDARY }}>{tableToDelete?.name}</Text>? This action cannot be undone.
            </Text>
            <View style={styles.deleteButtonGroup}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.7 }]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>{t('delete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal
        visible={isComingSoonVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.comingSoonContent}>
            <View style={styles.rocketIconWrapper}>
              <Printer size={rf(32)} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
            <Text style={styles.comingSoonDescription}>
              Direct printing support for thermal printers is currently under development and will be available in the next update.
            </Text>
            <TouchableOpacity
              style={styles.comingSoonCloseBtn}
              onPress={() => setIsComingSoonVisible(false)}
            >
              <Text style={styles.comingSoonCloseBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_LIGHT },
  header: {
    paddingHorizontal: s(20),
    paddingTop: vs(25), // Basic top padding
    paddingBottom: vs(15),
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(15), // Push title/subtitle down
    marginTop: vs(10), // Extra space from top
  },
  headerBottomRow: {
    marginTop: vs(5),
  },
  backBtn: {
    padding: s(5),
    marginLeft: s(-5),
  },
  title: { fontSize: rf(24), fontWeight: '900', color: COLORS.SECONDARY, letterSpacing: -0.5 },
  subtitle: { fontSize: rf(13), color: COLORS.GRAY, marginTop: vs(2) },
  addBtn: {
    backgroundColor: COLORS.WHITE,
    padding: s(8),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    elevation: 2,
  },
  listPadding: { padding: s(12), paddingBottom: vs(100) },
  tableCardContainer: {
    flex: 1,
    margin: s(8),
  },
  tableCard: {
    backgroundColor: COLORS.WHITE,
    padding: s(20),
    borderRadius: s(24),
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  qrPreviewIcon: {
    width: s(60),
    height: s(60),
    backgroundColor: COLORS.PRIMARY + '08',
    borderRadius: s(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: s(6),
    backgroundColor: '#FEF2F2',
    borderRadius: s(10),
  },
  tableName: { fontSize: rf(17), fontWeight: '800', marginTop: vs(5), color: COLORS.SECONDARY },
  badge: {
    marginTop: vs(8),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    backgroundColor: COLORS.SECONDARY,
    borderRadius: s(8),
  },
  badgeText: {
    fontSize: rf(10),
    color: COLORS.WHITE,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: COLORS.WHITE, padding: s(25), borderRadius: s(32), elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(25) },
  modalTitle: { fontSize: rf(22), fontWeight: '900', color: COLORS.SECONDARY },
  modalSubtitle: { fontSize: rf(12), color: COLORS.PRIMARY, fontWeight: '700', textTransform: 'uppercase' },
  closeBtn: { padding: s(5) },

  qrContainer: { alignItems: 'center', marginBottom: vs(30) },
  qrCaptureArea: {
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(20),
    alignItems: 'center',
  },
  qrBrandName: {
    fontSize: rf(26),
    fontWeight: '900',
    color: COLORS.SECONDARY,
    marginBottom: vs(15),
    letterSpacing: 2,
  },
  qrWrapper: {
    padding: s(15),
    backgroundColor: COLORS.WHITE,
    borderRadius: s(15),
    elevation: 8,
    borderWidth: 5,
    borderColor: COLORS.SECONDARY,
  },
  qrTableName: {
    fontSize: rf(20),
    fontWeight: 'bold',
    marginTop: vs(15),
    color: COLORS.SECONDARY,
  },
  qrScanPrompt: {
    fontSize: rf(12),
    color: COLORS.GRAY,
    marginTop: vs(5),
  },
  qrInstructions: {
    fontSize: rf(14),
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: rf(20),
    marginTop: vs(10),
  },
  qrModalButtons: {
    flexDirection: 'row',
    gap: s(12),
  },
  downloadBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: vs(16),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(10),
    elevation: 5,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingVertical: vs(16),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(6),
    borderWidth: 1.5,
    borderColor: COLORS.SECONDARY,
  },
  btnText: { color: '#fff', fontSize: rf(15), fontWeight: '900' },

  createModalContent: {
    width: '85%',
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(24),
    elevation: 20
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  createTitle: { fontSize: rf(20), fontWeight: '900', color: COLORS.SECONDARY },
  inputLabel: { fontSize: rf(11), fontWeight: 'bold', color: COLORS.GRAY, marginBottom: vs(8), letterSpacing: 1 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.LIGHT_GRAY,
    borderRadius: s(16),
    padding: s(16),
    marginBottom: vs(25),
    fontSize: rf(16),
    color: COLORS.SECONDARY,
    backgroundColor: COLORS.BG_LIGHT,
  },
  saveBtn: {
    backgroundColor: COLORS.SECONDARY,
    paddingVertical: vs(16),
    borderRadius: s(16),
    alignItems: 'center',
    elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: rf(16), fontWeight: 'bold' },

  // Empty state & Shimmer
  emptyContainer: { alignItems: 'center', marginTop: vs(100), paddingHorizontal: s(40) },
  emptyText: { color: COLORS.GRAY, marginTop: vs(15), fontSize: rf(15), textAlign: 'center' },
  emptyAddBtn: { marginTop: vs(20), backgroundColor: COLORS.PRIMARY, paddingHorizontal: s(25), paddingVertical: vs(12), borderRadius: s(12) },
  emptyAddBtnText: { color: COLORS.WHITE, fontWeight: '800' },

  shimmerContainer: { padding: s(15), flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  shimmerBox: {
    width: (SCREEN_WIDTH - s(45)) / 2,
    height: vs(150),
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: s(24),
    marginBottom: vs(15)
  },

  // Delete Modal Styles
  deleteModalContent: {
    width: '85%',
    backgroundColor: COLORS.WHITE,
    padding: s(25),
    borderRadius: s(32),
    alignItems: 'center',
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16.00,
  },
  deleteIconWrapper: {
    width: s(70),
    height: s(70),
    backgroundColor: '#FEF2F2',
    borderRadius: s(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  deleteTitle: {
    fontSize: rf(22),
    fontWeight: '900',
    color: COLORS.SECONDARY,
    marginBottom: vs(10),
  },
  deleteDescription: {
    fontSize: rf(15),
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: rf(22),
    marginBottom: vs(30),
    paddingHorizontal: s(10),
  },
  deleteButtonGroup: {
    flexDirection: 'row',
    gap: s(12),
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: vs(15),
    borderRadius: s(16),
    backgroundColor: COLORS.BG_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  cancelBtnText: {
    fontSize: rf(16),
    fontWeight: '700',
    color: COLORS.GRAY,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: vs(15),
    borderRadius: s(16),
    backgroundColor: COLORS.DANGER,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  confirmDeleteBtnText: {
    fontSize: rf(16),
    fontWeight: '800',
    color: COLORS.WHITE,
  },

  // Coming Soon Modal Styles
  comingSoonContent: {
    width: '80%',
    backgroundColor: COLORS.WHITE,
    padding: s(30),
    borderRadius: s(32),
    alignItems: 'center',
    elevation: 25,
  },
  rocketIconWrapper: {
    width: s(70),
    height: s(70),
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: s(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  comingSoonTitle: {
    fontSize: rf(24),
    fontWeight: '900',
    color: COLORS.SECONDARY,
    marginBottom: vs(12),
  },
  comingSoonDescription: {
    fontSize: rf(15),
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: rf(22),
    marginBottom: vs(25),
  },
  comingSoonCloseBtn: {
    width: '100%',
    paddingVertical: vs(15),
    backgroundColor: COLORS.SECONDARY,
    borderRadius: s(16),
    alignItems: 'center',
    elevation: 4,
  },
  comingSoonCloseBtnText: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
});
