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
import { rf, s, vs } from "../../utils/responsive";
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
  const [isConnectionErrorModalVisible, setIsConnectionErrorModalVisible] = useState(false);

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
      addLog("Scanning for devices...");

      // 1. Pehle bonded (already paired) devices fetch karein
      const bonded = await RNBluetoothClassic.getBondedDevices();
      addLog("Found bonded devices: " + bonded.length);
      setDevices(bonded);

      // 2. Ab naye devices scan (Discovery) karein
      addLog("Searching for new printers (Discovery)...");
      try {
        await RNBluetoothClassic.cancelDiscovery(); // Puraana scan cancel karein
      } catch (e) {}

      const discovered = await RNBluetoothClassic.startDiscovery();
      addLog("Discovery finished. Found " + discovered.length + " new devices.");

      // Bonded aur Discovered ko merge karein bina duplicate address ke
      setDevices((prev) => {
        const consolidated = [...prev];
        discovered.forEach((newDev: any) => {
          if (!consolidated.some((d) => d.address === newDev.address)) {
            consolidated.push(newDev);
          }
        });
        return consolidated;
      });

      if (bonded.length === 0 && discovered.length === 0) {
        setIsNoDevicesModalVisible(true);
      }
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

      // Agar device pair (bonded) nahi hai, toh pairing request bhejein
      if (!device.bonded) {
        addLog("Device not paired. Requesting pairing...");
        try {
          // @ts-ignore
          const paired = await RNBluetoothClassic.pairDevice(device.address);
          if (!paired) {
            addLog("Pairing failed or cancelled by user.");
            setIsLoading(false);
            return;
          }
          addLog("Pairing successful! ✅ Now connecting...");
          // Pairing ke baad device properties update karein
          device.bonded = true;
        } catch (pairErr: any) {
          addLog("Pairing error: " + pairErr.message);
          setIsLoading(false);
          return;
        }
      }

      addLog("Connecting to " + (device.name || device.address) + "...");
      console.log("Connect attempt to:", device.address);

      // Increased delay to allow Bluetooth channel to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      console.log("Connection error:", e);
      addLog("Connection failed: " + e.message);

      // Trigger custom popup
      if (e.message.includes("read failed") || e.message.includes("socket")) {
        setIsConnectionErrorModalVisible(true);
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

  // ================= FORGET =================
  const forgetDevice = async (address: string) => {
    try {
      setDevices((prev) => prev.filter((d) => d.address !== address));
      
      if (connectedDevice?.address === address) {
        await disconnectDevice();
      }

      // If it's saved in AsyncStorage, remove it
      const savedPrinter = await AsyncStorage.getItem("saved_printer");
      if (savedPrinter === address) {
        await AsyncStorage.removeItem("saved_printer");
      }

      ToastAndroid.show("Device forgotten ✅", ToastAndroid.SHORT);
      addLog("Device forgotten: " + address);
    } catch (e: any) {
      console.log("Forget device error:", e);
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
        <Ionicons name="print-outline" size={rf(40)} color="#fff" style={styles.headerIcon} />
      </LinearGradient>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#10B981' }]} onPress={scanDevices} disabled={isLoading}>
          <Ionicons name="search" size={rf(20)} color="#fff" />
          <Text style={styles.btnText}>Scan Devices</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#4F46E5' }]} onPress={printSample} disabled={!connectedDevice || isLoading}>
          <Ionicons name="document-text-outline" size={rf(20)} color="#fff" />
          <Text style={styles.btnText}>Print Test</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Bonded Devices</Text>

      {isLoading && <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: vs(20) }} />}

      <ScrollView style={styles.deviceList}>
        {devices.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="bluetooth-outline" size={rf(48)} color="#D1D5DB" />
            <Text style={styles.emptyText}>No devices detected. Tap Scan.</Text>
          </View>
        )}
        {devices.map((d, i) => (
          <View
            key={i}
            style={[
              styles.deviceCard,
              connectedDevice?.address === d.address && styles.activeDevice
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(12) }}
              onPress={() => connectDevice(d)}
            >
              <View style={styles.deviceIconBox}>
                <Ionicons
                  name={connectedDevice?.address === d.address ? "checkmark-circle" : "bluetooth"}
                  size={rf(24)}
                  color={connectedDevice?.address === d.address ? "#10B981" : "#4F46E5"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                  <Text style={styles.deviceName}>{d.name || "Unknown Printer"}</Text>
                  {!d.bonded && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deviceAddress}>{d.address}</Text>
              </View>
              {connectedDevice?.address === d.address && <Text style={styles.connectedStatus}>Connected</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgetBtn}
              onPress={() => forgetDevice(d.address)}
            >
              <Ionicons name="trash-outline" size={rf(16)} color="#EF4444" />
              <Text style={styles.forgetBtnText}>Forget</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {connectedDevice && (
        <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectDevice}>
          <Ionicons name="close-circle-outline" size={rf(18)} color="#EF4444" />
          <Text style={styles.disconnectText}>Disconnect Printer</Text>
        </TouchableOpacity>
      )}

      {/* Logs removed for cleaner UI */}

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
              <Ionicons name="bluetooth" size={rf(40)} color="#D97706" />
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
              <Ionicons name="search" size={rf(40)} color="#4F46E5" />
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

      {/* Connection Error Modal */}
      <Modal transparent visible={isConnectionErrorModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFF' }]}>
            <View style={styles.modalSubHeader}>
              <View style={[styles.line, { backgroundColor: '#FEE2E2' }]} />
              <Text style={styles.lineLabel}>CONNECTION FAILED</Text>
              <View style={[styles.line, { backgroundColor: '#FEE2E2' }]} />
            </View>
            <View style={styles.iconCircleError}>
              <Ionicons name="alert-circle" size={rf(40)} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: '#B91C1C' }]}>Printer Refused Connection</Text>
            <Text style={styles.modalDetail}>The printer might be busy, too far away, or already connected to another device.</Text>

            <View style={styles.troubleshootBox}>
              <Text style={styles.troubleshootTitle}>Try these steps:</Text>
              <Text style={styles.troubleshootItem}>• Turn Printer OFF and then ON again</Text>
              <Text style={styles.troubleshootItem}>• Check if it's connected to another phone</Text>
              <Text style={styles.troubleshootItem}>• Unpair and Repair the printer in BT settings</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => setIsConnectionErrorModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>TRY AGAIN</Text>
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
    paddingTop: vs(60),
    paddingBottom: vs(55),
    paddingHorizontal: s(25),
    borderBottomLeftRadius: s(30),
    borderBottomRightRadius: s(30),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: rf(28), fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: rf(14), color: "rgba(255,255,255,0.8)", marginTop: vs(4) },
  headerIcon: { opacity: 0.9 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: s(20),
    marginTop: vs(-20),
    gap: s(12),
  },
  mainBtn: {
    flex: 1,
    height: vs(55),
    borderRadius: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(15) },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#374151",
    marginTop: vs(30),
    marginHorizontal: s(20),
    marginBottom: vs(10),
  },
  deviceList: { flex: 1, paddingHorizontal: s(20) },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: s(16),
    padding: s(16),
    marginBottom: vs(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeDevice: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  deviceIconBox: {
    width: s(45),
    height: s(45),
    borderRadius: s(12),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: { fontSize: rf(16), fontWeight: "600", color: "#111827" },
  deviceAddress: { fontSize: rf(12), color: "#6B7280", marginTop: vs(2) },
  connectedStatus: { fontSize: rf(12), color: "#10B981", fontWeight: "bold" },
  emptyState: {
    alignItems: 'center',
    marginTop: vs(40),
    gap: vs(10),
  },
  emptyText: { color: '#9CA3AF', fontSize: rf(14) },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    padding: s(15),
  },
  disconnectText: { color: '#EF4444', fontWeight: '600' },
  forgetBtn: {
    paddingHorizontal: s(8),
    paddingVertical: vs(5),
    backgroundColor: '#FEE2E2',
    borderRadius: s(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  forgetBtnText: {
    color: '#EF4444',
    fontSize: rf(10),
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  newBadgeText: {
    fontSize: rf(8),
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  logSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: s(15),
    height: vs(140),
  },
  logTitle: { fontSize: rf(12), fontWeight: 'bold', color: '#9CA3AF', marginBottom: vs(5), textTransform: 'uppercase' },
  logBox: { flex: 1 },
  logText: { fontSize: rf(11), color: "#6B7280", marginBottom: vs(2) },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: s(25),
  },
  modalContent: {
    borderRadius: s(32),
    padding: s(24),
    alignItems: 'center',
    width: '100%',
    elevation: 20,
  },
  modalSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: vs(20),
  },
  line: { flex: 1, height: 1.5 },
  lineLabel: { marginHorizontal: s(10), color: '#6B7280', fontWeight: 'bold', fontSize: rf(12), letterSpacing: 1 },
  iconCircleWarning: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  iconCircleInfo: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  modalTitle: { fontSize: rf(22), fontWeight: 'bold', marginBottom: vs(10), textAlign: 'center' },
  modalDetail: { fontSize: rf(15), color: '#6B7280', textAlign: 'center', lineHeight: rf(22) },
  bottomLineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: vs(25),
    marginBottom: vs(5),
  },
  bottomLineLabel: { marginHorizontal: s(10), color: '#9CA3AF', fontWeight: 'bold', fontSize: rf(10), letterSpacing: 2 },
  modalBtn: {
    width: '100%',
    paddingVertical: vs(16),
    borderRadius: s(18),
    alignItems: 'center',
    marginTop: vs(15),
  },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(18) },
  iconCircleError: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  troubleshootBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: s(12),
    padding: s(15),
    width: '100%',
    marginTop: vs(15),
    marginBottom: vs(10),
  },
  troubleshootTitle: { fontSize: rf(12), fontWeight: 'bold', color: '#374151', marginBottom: vs(8) },
  troubleshootItem: { fontSize: rf(12), color: '#6B7280', marginBottom: vs(4) },
});
