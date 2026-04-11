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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNBluetoothClassic from "react-native-bluetooth-classic";
import { rf, s, vs } from "../../utils/responsive";

// Components
import PrinterHeader from "./PrinterHeader";
import DeviceCard from "./DeviceCard";

const THEME_PRIMARY = "#4F46E5";

const MainPrinterView = () => {
    const [devices, setDevices] = useState<any[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBtOffModalVisible, setIsBtOffModalVisible] = useState(false);
    const [isNoDevicesModalVisible, setIsNoDevicesModalVisible] = useState(false);
    const [isConnectionErrorModalVisible, setIsConnectionErrorModalVisible] = useState(false);

    // ================= PERMISSIONS =================
    const requestPermissions = async () => {
        if (Platform.OS !== "android") return true;
        try {
            const api31Plus = Platform.Version >= 31;
            let permissions = api31Plus ? [
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ] : [
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ];
            const result = await PermissionsAndroid.requestMultiple(permissions);
            return Object.values(result).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
        } catch (e) {
            console.error("Permission error:", e);
            return false;
        }
    };

    // ================= ENABLE BLUETOOTH =================
    const ensureBluetoothEnabled = async () => {
        try {
            const enabled = await RNBluetoothClassic.isBluetoothEnabled();
            if (!enabled) {
                const nowEnabled = await RNBluetoothClassic.requestBluetoothEnabled();
                if (!nowEnabled) {
                    setIsBtOffModalVisible(true);
                    return false;
                }
            }
            return true;
        } catch (e) {
            setIsBtOffModalVisible(true);
            return false;
        }
    };

    // ================= SCAN =================
    const scanDevices = async () => {
        const ok = await requestPermissions();
        if (!ok) return;

        const isEnabled = await ensureBluetoothEnabled();
        if (!isEnabled) return;

        try {
            setIsLoading(true);
            const bonded = await RNBluetoothClassic.getBondedDevices();
            setDevices(bonded);

            try { await RNBluetoothClassic.cancelDiscovery(); } catch (e) {}
            const discovered = await RNBluetoothClassic.startDiscovery();

            setDevices((prev) => {
                const consolidated = [...prev];
                discovered.forEach((newDev: any) => {
                    if (!consolidated.some((d) => d.address === newDev.address)) consolidated.push(newDev);
                });
                return consolidated;
            });

            if (bonded.length === 0 && discovered.length === 0) setIsNoDevicesModalVisible(true);
        } catch (e) {
            console.error("Scan error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // ================= CONNECT =================
    const connectDevice = async (device: any) => {
        try {
            setIsLoading(true);
            if (!device.bonded) {
                const paired = await RNBluetoothClassic.pairDevice(device.address);
                if (!paired) { setIsLoading(false); return; }
                device.bonded = true;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            const connection = await RNBluetoothClassic.connectToDevice(
                device.address, { connectorType: "rfcomm", secure: false }
            );

            if (connection) {
                setConnectedDevice(connection);
                await AsyncStorage.setItem("saved_printer", device.address);
                ToastAndroid.show("Connected ✅", ToastAndroid.SHORT);
            }
        } catch (e: any) {
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
            await connectedDevice.disconnect();
            setConnectedDevice(null);
        } catch (e) {}
    };

    // ================= FORGET =================
    const forgetDevice = async (address: string) => {
        try {
            setDevices((prev) => prev.filter((d) => d.address !== address));
            if (connectedDevice?.address === address) await disconnectDevice();
            const savedPrinter = await AsyncStorage.getItem("saved_printer");
            if (savedPrinter === address) await AsyncStorage.removeItem("saved_printer");
            ToastAndroid.show("Device forgotten ✅", ToastAndroid.SHORT);
        } catch (e) {}
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
        } catch (e) {
            console.error("Print error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { requestPermissions(); }, []);

    return (
        <View style={styles.content}>
            <PrinterHeader />

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
                    <DeviceCard 
                        key={i}
                        name={d.name}
                        address={d.address}
                        bonded={d.bonded}
                        isConnected={connectedDevice?.address === d.address}
                        onConnect={() => connectDevice(d)}
                        onForget={() => forgetDevice(d.address)}
                    />
                ))}
            </ScrollView>

            {connectedDevice && (
                <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectDevice}>
                    <Ionicons name="close-circle-outline" size={rf(18)} color="#EF4444" />
                    <Text style={styles.disconnectText}>Disconnect Printer</Text>
                </TouchableOpacity>
            )}

            {/* Modals */}
            <Modal transparent visible={isBtOffModalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: '#FFFBEB' }]}>
                        <View style={styles.modalSubHeader}>
                            <View style={[styles.line, { backgroundColor: '#FDE68A' }]} />
                            <Text style={styles.lineLabel}>WARNING</Text>
                            <View style={[styles.line, { backgroundColor: '#FDE68A' }]} />
                        </View>
                        <View style={styles.iconCircleWarning}><Ionicons name="bluetooth" size={rf(40)} color="#D97706" /></View>
                        <Text style={[styles.modalTitle, { color: '#D97706' }]}>Bluetooth is Off</Text>
                        <Text style={styles.modalDetail}>Please turn on your phone's Bluetooth to scan and connect to a printer.</Text>
                        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D97706' }]} onPress={() => setIsBtOffModalVisible(false)}>
                            <Text style={styles.modalBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={isNoDevicesModalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: '#F3F4F6' }]}>
                        <View style={styles.modalSubHeader}>
                            <View style={[styles.line, { backgroundColor: '#D1D5DB' }]} />
                            <Text style={styles.lineLabel}>ATTENTION</Text>
                            <View style={[styles.line, { backgroundColor: '#D1D5DB' }]} />
                        </View>
                        <View style={styles.iconCircleInfo}><Ionicons name="search" size={rf(40)} color="#4F46E5" /></View>
                        <Text style={[styles.modalTitle, { color: '#4F46E5' }]}>No Devices Found</Text>
                        <Text style={styles.modalDetail}>Ensure your thermal printer is turned on and paired in your phones Bluetooth settings.</Text>
                        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4F46E5' }]} onPress={() => setIsNoDevicesModalVisible(false)}>
                            <Text style={styles.modalBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={isConnectionErrorModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: '#FFF' }]}>
                        <View style={styles.modalSubHeader}>
                            <View style={[styles.line, { backgroundColor: '#FEE2E2' }]} />
                            <Text style={styles.lineLabel}>CONNECTION FAILED</Text>
                            <View style={[styles.line, { backgroundColor: '#FEE2E2' }]} />
                        </View>
                        <View style={styles.iconCircleError}><Ionicons name="alert-circle" size={rf(40)} color="#EF4444" /></View>
                        <Text style={[styles.modalTitle, { color: '#B91C1C' }]}>Printer Refused Connection</Text>
                        <Text style={styles.modalDetail}>The printer might be busy, too far away, or already connected to another device.</Text>
                        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#EF4444' }]} onPress={() => setIsConnectionErrorModalVisible(false)}>
                            <Text style={styles.modalBtnText}>TRY AGAIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    content: { flex: 1 },
    actionRow: { flexDirection: 'row', paddingHorizontal: s(20), marginTop: vs(-20), gap: s(12) },
    mainBtn: { flex: 1, height: vs(55), borderRadius: s(16), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), elevation: 4 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(15) },
    sectionTitle: { fontSize: rf(18), fontWeight: "bold", color: "#374151", marginTop: vs(30), marginHorizontal: s(20), marginBottom: vs(10) },
    deviceList: { flex: 1, paddingHorizontal: s(20) },
    emptyState: { alignItems: 'center', marginTop: vs(40), gap: vs(10) },
    emptyText: { color: '#9CA3AF', fontSize: rf(14) },
    disconnectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), padding: s(15) },
    disconnectText: { color: '#EF4444', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: s(25) },
    modalContent: { borderRadius: s(32), padding: s(24), alignItems: 'center', width: '100%', elevation: 20 },
    modalSubHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: vs(20) },
    line: { flex: 1, height: 1.5 },
    lineLabel: { marginHorizontal: s(10), color: '#6B7280', fontWeight: 'bold', fontSize: rf(12), letterSpacing: 1 },
    iconCircleWarning: { width: s(80), height: s(80), borderRadius: s(40), backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: vs(20), borderWidth: 2, borderColor: '#FDE68A' },
    iconCircleInfo: { width: s(80), height: s(80), borderRadius: s(40), backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: vs(20), borderWidth: 2, borderColor: '#C7D2FE' },
    iconCircleError: { width: s(80), height: s(80), borderRadius: s(40), backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: vs(20), borderWidth: 2, borderColor: '#FCA5A5' },
    modalTitle: { fontSize: rf(22), fontWeight: 'bold', marginBottom: vs(10), textAlign: 'center' },
    modalDetail: { fontSize: rf(15), color: '#6B7280', textAlign: 'center', lineHeight: rf(22) },
    modalBtn: { width: '100%', paddingVertical: vs(16), borderRadius: s(18), alignItems: 'center', marginTop: vs(15) },
    modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: rf(18) },
});

export default MainPrinterView;
