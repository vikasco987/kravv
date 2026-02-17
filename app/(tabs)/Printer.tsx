import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ToastAndroid,
} from "react-native";
import RNBluetoothClassic from "react-native-bluetooth-classic";

export default function PrinterScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [new Date().toLocaleTimeString() + " - " + msg, ...prev]);
  };

  // ================= PERMISSIONS =================
  const requestPermissions = async () => {
    if (Platform.OS !== "android") return true;

    try {
      const api31Plus = Platform.Version >= 31;

      const permissions = api31Plus
        ? [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]
        : [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];

      const result = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(result).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      setGranted(allGranted);
      addLog(allGranted ? "✅ Permissions granted" : "❌ Permissions denied");

      return allGranted;
    } catch (e: any) {
      addLog("Permission error: " + e.message);
      return false;
    }
  };

  // ================= ENABLE BLUETOOTH =================
  const ensureBluetoothEnabled = async () => {
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        await RNBluetoothClassic.requestEnabled();
      }
    } catch (e: any) {
      addLog("Bluetooth enable error: " + e.message);
    }
  };

  // ================= SCAN =================
  const scanDevices = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    await ensureBluetoothEnabled();

    try {
      setIsLoading(true);
      addLog("Scanning...");

      const bonded = await RNBluetoothClassic.getBondedDevices();
      setDevices(bonded);

      addLog("Found devices: " + bonded.length);
    } catch (e: any) {
      addLog("Scan error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= CONNECT =================
  const connectDevice = async (device: any) => {
    try {
      setIsLoading(true);
      addLog("Connecting to " + device.name);

      const connection = await RNBluetoothClassic.connectToDevice(
        device.address
      );

      if (connection) {
        setConnectedDevice(connection);
        addLog("Connected ✅");
        ToastAndroid.show("Connected", ToastAndroid.SHORT);
      }
    } catch (e: any) {
      addLog("Connection failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= DISCONNECT =================
  const disconnectDevice = async () => {
    if (!connectedDevice) return;

    await connectedDevice.disconnect();
    setConnectedDevice(null);
    addLog("Disconnected");
  };

  // ================= PRINT =================
  const printSample = async () => {
    if (!connectedDevice) {
      ToastAndroid.show("Connect printer first", ToastAndroid.SHORT);
      return;
    }

    try {
      setIsLoading(true);

      const text = `
Kravy Billing App
--------------------------
Burger x2    100
Pizza x1     200
--------------------------
Total:       300

Thank You\n\n\n`;

      await connectedDevice.write(text);

      addLog("Printed successfully");
    } catch (e: any) {
      addLog("Print error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Printer</Text>

      <Button title="Scan Devices" onPress={scanDevices} />
      <Button title="Print Sample" onPress={printSample} />
      <Button title="Disconnect" onPress={disconnectDevice} />

      {isLoading && <ActivityIndicator size="large" />}

      <ScrollView style={{ marginTop: 20 }}>
        {devices.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={styles.device}
            onPress={() => connectDevice(d)}
          >
            <Text>
              {d.name || "Unknown"} {connectedDevice?.address === d.address && "✅"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.logBox}>
        {logs.map((log, i) => (
          <Text key={i} style={{ fontSize: 12 }}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  device: {
    padding: 10,
    backgroundColor: "#eee",
    marginBottom: 5,
    borderRadius: 5,
  },
  logBox: {
    marginTop: 20,
    backgroundColor: "#f2f2f2",
    padding: 10,
    height: 150,
  },
});
