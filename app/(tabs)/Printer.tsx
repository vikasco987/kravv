import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";

import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from "react-native-bluetooth-escpos-printer";

export default function PrinterScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);

  // 🔵 Request Bluetooth Permissions
  const requestPermissions = async () => {
    if (Platform.OS === "android" && Platform.Version >= 31) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    } else {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  };

  // 🔍 Scan Devices
  const scanDevices = async () => {
    await requestPermissions();

    try {
      const paired = await BluetoothManager.enableBluetooth();
      const parsed = JSON.parse(paired);

      setDevices(parsed);
    } catch (error) {
      Alert.alert("Error", "Bluetooth not enabled");
    }
  };

  // 🔗 Connect to Printer
  const connectPrinter = async (device: any) => {
    try {
      await BluetoothManager.connect(device.address);
      setConnectedDevice(device);
      Alert.alert("Connected", `Connected to ${device.name}`);
    } catch (error) {
      Alert.alert("Error", "Connection failed");
    }
  };

  // 🧾 Print Receipt
  const printReceipt = async () => {
    if (!connectedDevice) {
      Alert.alert("Error", "No printer connected");
      return;
    }

    try {
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER
      );
      await BluetoothEscposPrinter.printText(
        "KRAVV STORE\n\r",
        {}
      );

      await BluetoothEscposPrinter.printText(
        "------------------------------\n\r",
        {}
      );

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT
      );

      await BluetoothEscposPrinter.printText(
        "Item 1        ₹200\n\r",
        {}
      );
      await BluetoothEscposPrinter.printText(
        "Item 2        ₹150\n\r",
        {}
      );

      await BluetoothEscposPrinter.printText(
        "------------------------------\n\r",
        {}
      );

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.RIGHT
      );

      await BluetoothEscposPrinter.printText(
        "TOTAL: ₹350\n\r",
        {}
      );

      await BluetoothEscposPrinter.printText("\n\n\n\r", {});
      await BluetoothEscposPrinter.cutPaper();

      Alert.alert("Success", "Printed Successfully");
    } catch (error) {
      Alert.alert("Error", "Printing failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Printers</Text>

      <Button title="Scan Printers" onPress={scanDevices} />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.device}
            onPress={() => connectPrinter(item)}
          >
            <Text>{item.name}</Text>
            <Text>{item.address}</Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Print Test Receipt" onPress={printReceipt} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  device: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
});
  