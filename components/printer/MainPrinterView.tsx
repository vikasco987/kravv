import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import RNBluetoothClassic from "react-native-bluetooth-classic";
import { rf, s, vs } from "../../utils/responsive";

// Components
import DeviceCard from "./DeviceCard";

import { useRouter } from "expo-router";
import { SoundManager } from "../../utils/SoundManager";
import { LoginRequiredModal } from "../common/LoginRequiredModal";

const THEME_PRIMARY = "#4F46E5";

const MainPrinterView = ({ isLockedUser = false }: { isLockedUser?: boolean }) => {
    const router = useRouter();
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [devices, setDevices] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"bill" | "kot">("bill");

    const [connectedBillDevice, setConnectedBillDevice] = useState<any>(null);
    const [connectedKOTDevice, setConnectedKOTDevice] = useState<any>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isBtOffModalVisible, setIsBtOffModalVisible] = useState(false);
    const [isNoDevicesModalVisible, setIsNoDevicesModalVisible] = useState(false);
    const [isConnectionErrorModalVisible, setIsConnectionErrorModalVisible] = useState(false);

    const connectedDevice = activeTab === "bill" ? connectedBillDevice : connectedKOTDevice;

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
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        const ok = await requestPermissions();
        if (!ok) return;

        const isEnabled = await ensureBluetoothEnabled();
        if (!isEnabled) return;

        try {
            setIsLoading(true);
            const bonded = await RNBluetoothClassic.getBondedDevices();
            setDevices(bonded);

            try { await RNBluetoothClassic.cancelDiscovery(); } catch (e) { }
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
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
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
                const storageKey = activeTab === "bill" ? "saved_bill_printer" : "saved_kot_printer";
                await AsyncStorage.setItem(storageKey, device.address);

                if (activeTab === "bill") {
                    setConnectedBillDevice(connection);
                } else {
                    setConnectedKOTDevice(connection);
                }

                ToastAndroid.show(`${activeTab === "bill" ? "Bill" : "KOT"} Printer Connected ✅`, ToastAndroid.SHORT);
                SoundManager.playSuccess();
            }
        } catch (e: any) {
            if (e.message.includes("read failed") || e.message.includes("socket")) {
                setIsConnectionErrorModalVisible(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ================= AUTO CONNECT =================
    const autoConnect = async (showLoader = false) => {
        try {
            const billSaved = await AsyncStorage.getItem("saved_bill_printer");
            const kotSaved = await AsyncStorage.getItem("saved_kot_printer");
            if (!billSaved && !kotSaved) return;

            const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
            if (!isEnabled) return;

            if (showLoader) setIsLoading(true);

            // Connect Bill Printer if saved and not connected
            if (billSaved && !connectedBillDevice) {
                try {
                    const conn1 = await RNBluetoothClassic.connectToDevice(billSaved, { connectorType: "rfcomm", secure: false });
                    if (conn1) setConnectedBillDevice(conn1);
                } catch (e) { }
            }

            // Connect KOT Printer if saved and not connected
            if (kotSaved && !connectedKOTDevice) {
                try {
                    const conn2 = await RNBluetoothClassic.connectToDevice(kotSaved, { connectorType: "rfcomm", secure: false });
                    if (conn2) setConnectedKOTDevice(conn2);
                } catch (e) { }
            }

            const bonded = await RNBluetoothClassic.getBondedDevices();
            setDevices(bonded);

        } catch (e) {
            // Silently fail for background auto-connect
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    // ================= DISCONNECT =================
    const disconnectDevice = async () => {
        if (!connectedDevice) return;
        try {
            await connectedDevice.disconnect();
            if (activeTab === "bill") setConnectedBillDevice(null);
            else setConnectedKOTDevice(null);
        } catch (e) { }
    };

    // ================= FORGET =================
    const forgetDevice = async (address: string) => {
        try {
            setDevices((prev) => prev.filter((d) => d.address !== address));

            if (connectedBillDevice?.address === address) {
                await connectedBillDevice.disconnect();
                setConnectedBillDevice(null);
            }
            if (connectedKOTDevice?.address === address) {
                await connectedKOTDevice.disconnect();
                setConnectedKOTDevice(null);
            }

            const savedBill = await AsyncStorage.getItem("saved_bill_printer");
            if (savedBill === address) await AsyncStorage.removeItem("saved_bill_printer");

            const savedKot = await AsyncStorage.getItem("saved_kot_printer");
            if (savedKot === address) await AsyncStorage.removeItem("saved_kot_printer");

            ToastAndroid.show("Device forgotten ✅", ToastAndroid.SHORT);
        } catch (e) { }
    };

    // ================= PRINT =================
    const printSample = async () => {
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        if (!connectedDevice) {
            ToastAndroid.show(`Connect ${activeTab === "bill" ? "Bill" : "KOT"} printer first`, ToastAndroid.SHORT);
            return;
        }
        try {
            setIsLoading(true);
            const text = `
Kravy ${activeTab === "bill" ? "Billing" : "KOT"} App
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

    useEffect(() => {
        const init = async () => {
            if (isLockedUser) return;
            const ok = await requestPermissions();
            if (ok) {
                await autoConnect(true);
            }
        };
        init();
    }, [isLockedUser]);

    // Periodic Reconnection Logic
    useEffect(() => {
        if (isLockedUser) return;
        const interval = setInterval(async () => {
            if ((!connectedBillDevice || !connectedKOTDevice) && !isLoading) {
                await autoConnect(false);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [connectedBillDevice, connectedKOTDevice, isLoading, isLockedUser]);

    // Connection Lost Listener
    useEffect(() => {
        const sub = RNBluetoothClassic.onDeviceDisconnected((event: any) => {
            if (connectedBillDevice?.address === event.device.address) setConnectedBillDevice(null);
            if (connectedKOTDevice?.address === event.device.address) setConnectedKOTDevice(null);
        });
        return () => sub.remove();
    }, [connectedBillDevice, connectedKOTDevice]);

    if (isLockedUser) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F9FAFB', padding: s(30) }}>
                <View style={{ backgroundColor: "#EEF2FF", padding: s(20), borderRadius: s(100), marginBottom: vs(20) }}>
                    <Ionicons name="lock-closed" size={s(40)} color="#4F46E5" />
                </View>
                <Text style={{ fontSize: rf(20), fontWeight: "800", color: "#1e293b", textAlign: "center" }}>
                    Authentication Required
                </Text>
                <Text style={{ fontSize: rf(14), color: "#64748b", textAlign: "center", marginTop: vs(10), lineHeight: vs(20) }}>
                    Please sign in to your account or staff portal to view and connect Bluetooth printers.
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: '#4F46E5', paddingHorizontal: s(30), paddingVertical: vs(12), borderRadius: s(12), marginTop: vs(20) }}
                    onPress={() => router.push("/(auth)/sign-in")}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: rf(14) }}>Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.content}>
            {/* Tabs for Bill / KOT */}
            <View style={{ flexDirection: 'row', paddingHorizontal: s(20), marginTop: vs(15) }}>
                <TouchableOpacity
                    style={{ flex: 1, paddingVertical: vs(12), borderBottomWidth: 3, borderBottomColor: activeTab === 'bill' ? '#4F46E5' : '#E5E7EB', alignItems: 'center' }}
                    onPress={() => setActiveTab('bill')}
                >
                    <Text style={{ fontWeight: 'bold', color: activeTab === 'bill' ? '#4F46E5' : '#6B7280', fontSize: rf(15) }}>Bill Printer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ flex: 1, paddingVertical: vs(12), borderBottomWidth: 3, borderBottomColor: activeTab === 'kot' ? '#F59E0B' : '#E5E7EB', alignItems: 'center' }}
                    onPress={() => setActiveTab('kot')}
                >
                    <Text style={{ fontWeight: 'bold', color: activeTab === 'kot' ? '#F59E0B' : '#6B7280', fontSize: rf(15) }}>KOT Printer</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#10B981' }]} onPress={scanDevices} disabled={isLoading}>
                    <Ionicons name="search" size={rf(20)} color="#fff" />
                    <Text style={styles.btnText}>Scan Devices</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.mainBtn, { backgroundColor: activeTab === 'bill' ? '#4F46E5' : '#F59E0B' }]} onPress={printSample} disabled={!connectedDevice || isLoading}>
                    <Ionicons name="document-text-outline" size={rf(20)} color="#fff" />
                    <Text style={styles.btnText}>Print Test</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Bonded Devices ({activeTab === "bill" ? "Bill Setup" : "KOT Setup"})</Text>

            {isLoading && <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: vs(20) }} />}

            <ScrollView style={styles.deviceList} {...{ delaysContentTouches: false } as any} keyboardShouldPersistTaps="handled">
                {devices.length === 0 && !isLoading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="bluetooth-outline" size={rf(48)} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No devices detected. Tap Scan.</Text>
                    </View>
                )}
                {devices.map((d, i) => {
                    const isConnected = connectedDevice?.address === d.address;
                    const isAssignedToOther = activeTab === "bill" ? (connectedKOTDevice?.address === d.address) : (connectedBillDevice?.address === d.address);
                    return (
                        <DeviceCard
                            key={i}
                            name={d.name + (isAssignedToOther ? (activeTab === "bill" ? " (In use by KOT)" : " (In use by Bill)") : "")}
                            address={d.address}
                            bonded={d.bonded}
                            isConnected={isConnected}
                            onConnect={() => connectDevice(d)}
                            onForget={() => forgetDevice(d.address)}
                        />
                    );
                })}

                {connectedDevice && (
                    <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectDevice}>
                        <Ionicons name="close-circle-outline" size={rf(18)} color="#EF4444" />
                        <Text style={styles.disconnectText}>Disconnect {activeTab === "bill" ? "Bill" : "KOT"} Printer</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

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
                        <Text style={styles.modalDetail}>Please turn on your phone&apos;s Bluetooth to scan and connect to a printer.</Text>
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
                        <Text style={styles.modalDetail}>Ensure your thermal printer is turned on and paired in your phone&apos;s Bluetooth settings.</Text>
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

            <LoginRequiredModal
                visible={isLoginModalVisible}
                onClose={() => setIsLoginModalVisible(false)}
                onSignIn={() => {
                    setIsLoginModalVisible(false);
                    router.push("/(auth)/sign-in");
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    content: { flex: 1 },
    actionRow: { flexDirection: 'row', paddingHorizontal: s(20), marginTop: vs(10), gap: s(12) },
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
