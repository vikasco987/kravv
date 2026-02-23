// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  // @ts-ignore
  Button,
  // @ts-ignore
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  // @ts-ignore
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
        await RNBluetoothClassic.requestEnabled();
      }
    } catch (e: any) {
      console.error("Bluetooth enable error:", e);
      addLog("Bluetooth enable error: " + e.message);
    }
  };

  // ================= SCAN =================
  const scanDevices = async () => {
    const ok = await requestPermissions();
    if (!ok) {
      addLog("⚠️ Permissions not granted, cannot scan.");
      return;
    }

    await ensureBluetoothEnabled();

    try {
      setIsLoading(true);
      addLog("Scanning for bonded devices...");

      const bonded = await RNBluetoothClassic.getBondedDevices();
      console.log("Bonded devices found:", bonded);
      setDevices(bonded);

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
