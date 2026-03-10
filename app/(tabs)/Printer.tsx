import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import RNBluetoothClassic from "react-native-bluetooth-classic";


export default function PrinterScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [logs, setLogs] = useState<string[]>(["Application Started"]);
  const [isBtOffModalVisible, setIsBtOffModalVisible] = useState(false);
  const [isNoDevicesModalVisible, setIsNoDevicesModalVisible] = useState(false);

  const addLog = (msg: string) => {
    console.log("[BluetoothLog]", msg);
    setLogs((prev) => [new Date().toLocaleTimeString() + " - " + msg, ...prev]);
  };

  // ================= PERMISSIONS =================
  const requestPermissions = async () => {
    console.log("Requesting permissions...");
    if (Platform.OS !== "android") return true;

    try {
      const api31Plus = Platform.Version >= 31;
      let permissions = [];

      if (api31Plus) {
        permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
      } else {
        permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
      }

      console.log("Requesting:", permissions);
      const result = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(result).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      setGranted(allGranted);
      addLog(allGranted ? "✅ Permissions granted" : "❌ Permissions denied");
      console.log("Permission results:", result);

      return allGranted;
    } catch (e: any) {
      console.error("Permission error:", e);
      addLog("Permission error: " + e.message);
      return false;
    }
  };

  // ================= ENABLE BLUETOOTH =================
  const ensureBluetoothEnabled = async () => {
    try {
      console.log("Checking if Bluetooth is enabled...");
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      console.log("Bluetooth enabled status:", enabled);
      if (!enabled) {
        addLog("Requesting to enable Bluetooth...");
        // @ts-ignore
        const nowEnabled = await RNBluetoothClassic.requestBluetoothEnabled();
        if (!nowEnabled) {
          setIsBtOffModalVisible(true);
          return false;
        }
      }
      return true;
    } catch (e: any) {
      console.error("Bluetooth enable error:", e);
      addLog("Bluetooth enable error: " + e.message);
      setIsBtOffModalVisible(true);
      return false;
    }
  };

  // ================= SCAN =================
  const scanDevices = async () => {
    const ok = await requestPermissions();
    if (!ok) {
      addLog("⚠️ Permissions not granted, cannot scan.");
      return;
    }

    const isEnabled = await ensureBluetoothEnabled();
    if (!isEnabled) return;

    try {
      setIsLoading(true);
      addLog("Scanning for bonded devices...");

      const bonded = await RNBluetoothClassic.getBondedDevices();
      console.log("Bonded devices found:", bonded);
      setDevices(bonded);

      if (bonded.length === 0) {
        setIsNoDevicesModalVisible(true);
      }

      addLog("Found bonded devices: " + bonded.length);
    } catch (e: any) {
      console.error("Scan error:", e);
      addLog("Scan error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= CONNECT =================
  const connectDevice = async (device: any) => {
    try {
      setIsLoading(true);
      addLog("Connecting to " + (device.name || device.address) + "...");
      console.log("Connect attempt to:", device.address);

      // Sometimes a small delay helps before opening a new socket
      await new Promise(resolve => setTimeout(resolve, 500));

      const connection = await RNBluetoothClassic.connectToDevice(
        device.address,
        {
          connectorType: "rfcomm",
          secure: false, // Often fixes the "socket might closed or timeout" error
        }
      );

      if (connection) {
        setConnectedDevice(connection);
        addLog("Connected ✅ to " + device.name);

        // Save the printer address for future use (e.g., in SimpleBill)
        await AsyncStorage.setItem("saved_printer", device.address);
        addLog("Printer saved as default 💾");

        ToastAndroid.show("Connected ✅", ToastAndroid.SHORT);
      } else {
        addLog("❌ Connection failed (null result)");
      }
    } catch (e: any) {
      console.error("Connection error:", e);
      addLog("Connection failed: " + e.message);

      // If secure:false failed, maybe try default one more time? 
      // But usually security mismatch is the issue.
      if (e.message.includes("read failed")) {
        addLog("💡 Tip: Try unpairing and re-pairing the printer in Android Settings.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ================= DISCONNECT =================
  const disconnectDevice = async () => {
    if (!connectedDevice) return;
    try {
      addLog("Disconnecting...");
      await connectedDevice.disconnect();
      setConnectedDevice(null);
      addLog("Disconnected");
    } catch (e: any) {
      addLog("Disconnect error: " + e.message);
    }
  };

  // ================= PRINT =================
  const printSample = async () => {
    if (!connectedDevice) {
      addLog("⚠️ Not connected to a printer!");
      ToastAndroid.show("Connect printer first", ToastAndroid.SHORT);
      return;
    }

    try {
      setIsLoading(true);
      addLog("Sending print command...");

      const text = `
Kravy Billing App
--------------------------
Burger x2    100
Pizza x1     200
--------------------------
Total:       300

Thank You\n\n\n`;

      await connectedDevice.write(text);
      addLog("Printed successfully ✅");
    } catch (e: any) {
      console.error("Print error:", e);
      addLog("Print error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Printer Screen Mounted");
    requestPermissions();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#4F46E5", "#818CF8"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Printer Setup</Text>
          <Text style={styles.headerSubtitle}>Connect your Bluetooth Thermal Printer</Text>
        </View>
        <Ionicons name="print-outline" size={40} color="#fff" style={styles.headerIcon} />
      </LinearGradient>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#10B981' }]} onPress={scanDevices} disabled={isLoading}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.btnText}>Scan Devices</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#4F46E5' }]} onPress={printSample} disabled={!connectedDevice || isLoading}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Print Test</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Bonded Devices</Text>
      
      {isLoading && <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 20 }} />}

      <ScrollView style={styles.deviceList}>
        {devices.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="bluetooth-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No devices detected. Tap Scan.</Text>
          </View>
        )}
        {devices.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.deviceCard,
              connectedDevice?.address === d.address && styles.activeDevice
            ]}
            onPress={() => connectDevice(d)}
          >
            <View style={styles.deviceIconBox}>
              <Ionicons 
                name={connectedDevice?.address === d.address ? "checkmark-circle" : "bluetooth"} 
                size={24} 
                color={connectedDevice?.address === d.address ? "#10B981" : "#4F46E5"} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{d.name || "Unknown Printer"}</Text>
              <Text style={styles.deviceAddress}>{d.address}</Text>
            </View>
            {connectedDevice?.address === d.address && <Text style={styles.connectedStatus}>Connected</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {connectedDevice && (
        <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectDevice}>
          <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
          <Text style={styles.disconnectText}>Disconnect Printer</Text>
        </TouchableOpacity>
      )}

      {/* Logs (Expandable) */}
      <View style={styles.logSection}>
        <Text style={styles.logTitle}>System Logs</Text>
        <ScrollView style={styles.logBox} nestedScrollEnabled={true}>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logText}>• {log}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Bluetooth Off Modal */}
      <Modal transparent visible={isBtOffModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFBEB' }]}>
            <View style={styles.modalSubHeader}>
              <View style={[styles.line, { backgroundColor: '#FDE68A' }]} />
              <Text style={styles.lineLabel}>WARNING</Text>
              <View style={[styles.line, { backgroundColor: '#FDE68A' }]} />
            </View>
            <View style={styles.iconCircleWarning}>
              <Ionicons name="bluetooth" size={40} color="#D97706" />
            </View>
            <Text style={[styles.modalTitle, { color: '#D97706' }]}>Bluetooth is Off</Text>
            <Text style={styles.modalDetail}>Please turn on your phone&apos;s Bluetooth to scan and connect to a printer.</Text>
            
            <View style={styles.bottomLineBox}>
               <View style={[styles.line, { backgroundColor: '#FDE68A' }]} />
               <Text style={styles.bottomLineLabel}>KRAVY-PRINTER</Text>
               <View style={[styles.line, { backgroundColor: '#FDE68A' }]} />
            </View>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D97706' }]} onPress={() => setIsBtOffModalVisible(false)}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No Devices Found Modal */}
      <Modal transparent visible={isNoDevicesModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#F3F4F6' }]}>
             <View style={styles.modalSubHeader}>
              <View style={[styles.line, { backgroundColor: '#D1D5DB' }]} />
              <Text style={styles.lineLabel}>ATTENTION</Text>
              <View style={[styles.line, { backgroundColor: '#D1D5DB' }]} />
            </View>
            <View style={styles.iconCircleInfo}>
              <Ionicons name="search" size={40} color="#4F46E5" />
            </View>
            <Text style={[styles.modalTitle, { color: '#4F46E5' }]}>No Devices Found</Text>
            <Text style={styles.modalDetail}>Ensure your thermal printer is turned on and paired in your phone&apos;s Bluetooth settings.</Text>

            <View style={styles.bottomLineBox}>
               <View style={[styles.line, { backgroundColor: '#D1D5DB' }]} />
               <Text style={styles.bottomLineLabel}>KRAVY-PRINTER</Text>
               <View style={[styles.line, { backgroundColor: '#D1D5DB' }]} />
            </View>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4F46E5' }]} onPress={() => setIsNoDevicesModalVisible(false)}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  headerIcon: { opacity: 0.9 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -25,
    gap: 12,
  },
  mainBtn: {
    flex: 1,
    height: 55,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 30,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  deviceList: { flex: 1, paddingHorizontal: 20 },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeDevice: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  deviceIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  deviceAddress: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  connectedStatus: { fontSize: 12, color: "#10B981", fontWeight: "bold" },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    gap: 10,
  },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 15,
  },
  disconnectText: { color: '#EF4444', fontWeight: '600' },
  logSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 15,
    height: 140,
  },
  logTitle: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 5, textTransform: 'uppercase' },
  logBox: { flex: 1 },
  logText: { fontSize: 11, color: "#6B7280", marginBottom: 2 },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  modalContent: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    elevation: 20,
  },
  modalSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  line: { flex: 1, height: 1.5 },
  lineLabel: { marginHorizontal: 10, color: '#6B7280', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  iconCircleWarning: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  iconCircleInfo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalDetail: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  bottomLineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 25,
    marginBottom: 5,
  },
  bottomLineLabel: { marginHorizontal: 10, color: '#9CA3AF', fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },
  modalBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 15,
  },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
