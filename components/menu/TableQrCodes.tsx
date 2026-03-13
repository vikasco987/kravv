import { useAuth, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { rf, s, vs } from "../../utils/responsive";
import { 
  QrCode, 
  Trash2, 
  Plus, 
  X, 
  Download, 
  Printer, 
  Trash, 
  Grid 
} from "lucide-react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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

export const TableQrCodes = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const viewShotRef = useRef<ViewShot>(null);

  const fetchTables = useCallback(async () => {
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

  const deleteTable = async (id: string, name: string) => {
    Alert.alert(
      "Delete Table",
      `Are you sure you want to delete ${name}? This will permanently remove its QR code.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const response = await fetch(`https://billing.kravy.in/api/tables?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                fetchTables();
              }
            } catch (error) {
              console.error("Delete table error:", error);
            }
          }
        }
      ]
    );
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
  }, [fetchTables]);

  const openQrModal = (table: Table) => {
    setSelectedTable(table);
    setIsQrModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Table Management</Text>
        </View>
        <Shimmer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Table Management</Text>
          <Text style={styles.subtitle}>Manage your dining tables and QR codes</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Plus size={rf(28)} color={COLORS.PRIMARY} />
        </TouchableOpacity>
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
                 <Text style={styles.badgeText}>Live QR</Text>
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
                <Text style={styles.emptyText}>No tables created yet.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsCreateModalVisible(true)}>
                    <Text style={styles.emptyAddBtnText}>Add Your First Table</Text>
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
                <Text style={styles.modalSubtitle}>Kravy Digital Menu</Text>
              </View>
              <TouchableOpacity onPress={() => setIsQrModalVisible(false)} style={styles.closeBtn}>
                <X size={rf(24)} color={COLORS.SECONDARY} />
              </TouchableOpacity>
            </View>

            {selectedTable && (
              <View style={styles.qrContainer}>
                <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }}>
                    <View style={styles.qrCaptureArea}>
                        <Text style={styles.qrBrandName}>KRAVY</Text>
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
                        <Text style={styles.qrScanPrompt}>Scan to View Menu</Text>
                    </View>
                </ViewShot>
                
                <Text style={styles.qrInstructions}>
                   Let customers scan this to see your live menu and place orders.
                </Text>
              </View>
            )}

            <View style={styles.qrModalButtons}>
                <TouchableOpacity 
                  style={styles.downloadBtn}
                  onPress={downloadQr}
                >
                  <Download size={rf(18)} color="#fff" />
                  <Text style={styles.btnText}>Download QR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.printBtn}
                  onPress={() => Alert.alert("Coming Soon", "Direct printing from app is launching soon.")}
                >
                  <Printer size={rf(18)} color={COLORS.SECONDARY} />
                  <Text style={[styles.btnText, { color: COLORS.SECONDARY }]}>Print</Text>
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
                <Text style={styles.createTitle}>Add New Table</Text>
                <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                    <X size={rf(20)} color={COLORS.GRAY} />
                </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>TABLE NAME</Text>
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
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Table</Text>}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: vs(25),
    paddingBottom: vs(15),
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
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
});
