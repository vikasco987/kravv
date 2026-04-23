import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { rf, s, vs } from "../../utils/responsive";

// Components
import CustomerHistory from "../AI intelligence tools/CustomerHistory";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import NetworkErrorModal from "../common/NetworkErrorModal";
import AddPartyView from "../menu/AddPartyView";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import ClientHeader from "./ClientHeader";
import CustomerDetailsModal from "./CustomerDetailsModal";
import PartyListItem from "./PartyListItem";

const THEME_PRIMARY = "#4F46E5";
const COLOR_BG_LIGHT = "#F5F5F5";

type Party = {
    id: string;
    name: string;
    phone: string;
    address?: string;
    dob?: string;
    balance?: number;
    isFavorite?: boolean;
};

const MainClientView = ({ isLockedUser = false }: { isLockedUser?: boolean }) => {
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const { t } = useLanguage();
    const { refreshSignal } = useRefresh();
    
    const [parties, setParties] = useState<Party[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"parties" | "categories">("parties");
    const [showAddPartyForm, setShowAddPartyForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedParty, setSelectedParty] = useState<Party | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [allBills, setAllBills] = useState([]);
    const [showNetworkError, setShowNetworkError] = useState(false);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

    // Settings states
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [perProductTax, setPerProductTax] = useState(false);
    const [taxRate, setTaxRate] = useState(5);
    const [discountEnabled, setDiscountEnabled] = useState(false);
    const [discountRate, setDiscountRate] = useState(0);
    const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
    const [serviceChargeRate, setServiceChargeRate] = useState(0);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.multiGet([
                'tax_enabled', 'per_product_tax', 'tax_rate',
                'discount_enabled', 'discount_rate',
                'service_charge_enabled', 'service_charge_rate'
            ]);
            const sMap: Record<string, string | null> = {};
            settings.forEach(([key, val]) => sMap[key] = val);

            setTaxEnabled(sMap['tax_enabled'] === 'true');
            setPerProductTax(sMap['per_product_tax'] === 'true');
            setTaxRate(parseFloat(sMap['tax_rate'] || '5'));
            setDiscountEnabled(sMap['discount_enabled'] === 'true');
            setDiscountRate(parseFloat(sMap['discount_rate'] || '0'));
            setServiceChargeEnabled(sMap['service_charge_enabled'] === 'true');
            setServiceChargeRate(parseFloat(sMap['service_charge_rate'] || '0'));
        } catch (e) {
            console.error("Failed to load settings in Client View:", e);
        }
    };

    const fetchParties = async (silent = false) => {
        if (isLockedUser) {
            setParties([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        let cacheFound = false;
        try {
            const cachedData = await AsyncStorage.getItem('@cached_parties');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                    setParties(parsed);
                    setLoading(false);
                    cacheFound = true;
                }
            }
        } catch (e) {
            console.log("Error loading parties cache:", e);
        }

        const sessionStr = await AsyncStorage.getItem('staff_session');
        if (!isLoaded || (!isSignedIn && !sessionStr)) {
            setParties([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        fetchBills();
        try {
            if (silent) setRefreshing(true);
            else if (!cacheFound) setLoading(true);
            
            const token = await getToken();
            const bId = await StaffPermissionEngine.getActiveBusinessId(isSignedIn ? user?.id : undefined);

            const url = bId ? `https://billing.kravy.in/api/parties?businessId=${bId}` : "https://billing.kravy.in/api/parties";

            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setParties(data);
                await AsyncStorage.setItem('@cached_parties', JSON.stringify(data));
            }
        } catch (err: any) {
            console.log("Fetch Parties Error:", err.message);
            if (!cacheFound && err.message === "Network request failed") {
                setShowNetworkError(true);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchBills = async () => {
        if (isLockedUser) {
            setAllBills([]);
            return;
        }

        let cacheFound = false;
        try {
            const cachedBills = await AsyncStorage.getItem('@cached_all_bills');
            if (cachedBills) {
                const parsed = JSON.parse(cachedBills);
                if (parsed && Array.isArray(parsed)) {
                    setAllBills(parsed);
                    cacheFound = true;
                }
            }
        } catch (e) {
            console.log("Error loading bills cache:", e);
        }

        try {
            const token = await getToken();
            const bId = await StaffPermissionEngine.getActiveBusinessId(isSignedIn ? user?.id : undefined);

            if (!token && !bId) return;

            const url = bId ? `https://billing.kravy.in/api/bill-manager?t=${Date.now()}&businessId=${bId}` : `https://billing.kravy.in/api/bill-manager?t=${Date.now()}`;

            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                },
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.bills) {
                    setAllBills(data.bills);
                    await AsyncStorage.setItem('@cached_all_bills', JSON.stringify(data.bills));
                }
            }
        } catch (err: any) {
            console.log("Fetch Bills Error:", err.message);
            // We don't necessarily show network error here if fetchParties already might
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSettings();
            fetchParties(true);
            fetchBills();
        }, [isLoaded, isSignedIn, user])
    );

    useEffect(() => {
        fetchParties();
        fetchBills();
    }, [isLockedUser]);

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchParties(true);
            fetchBills();
        }
    }, [refreshSignal]);

    const handleSelectAccount = async (party: Party) => {
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        const pId = party.id || (party as any)._id;
        setSelectedParty(party);
        setShowDetailsModal(true);
        fetchBills();

        try {
            const token = await getToken();
            const res = await fetch(`https://billing.kravy.in/api/parties/${pId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.party) setSelectedParty(data.party);
            }
        } catch (e) {
            console.log("Error fetching party profile:", e);
        }
    };

    const customerStats = React.useMemo(() => {
        if (!selectedParty || !allBills || allBills.length === 0) return { lifetimeSpend: 0, pending: 0 };

        const pId = (selectedParty as any).id || (selectedParty as any)._id;
        const tPhone = (selectedParty.phone || "").replace(/\D/g, '');
        const cleanTP = tPhone.length > 10 ? tPhone.slice(-10) : tPhone;
        const tName = (selectedParty.name || "").toLowerCase().trim();

        const relatedBills = allBills.filter((bill: any) => {
            if (pId && (bill.partyId === pId || bill.customerId === pId || bill.party === pId)) return true;
            const bPhone = (bill.customerPhone || bill.phone || "").replace(/\D/g, '');
            const cleanBP = bPhone.length > 10 ? bPhone.slice(-10) : bPhone;
            if (cleanTP && cleanBP && cleanTP === cleanBP) return true;
            const bName = (bill.customerName || bill.name || "").toLowerCase().trim();
            if (tName && bName && (bName.includes(tName) || tName.includes(bName))) return true;
            return false;
        });

        let lifetimeSpend = 0;
        let pending = 0;

        relatedBills.forEach((bill: any) => {
            let totalTaxable = 0;
            let totalGst = 0;

            (bill.items || []).forEach((item: any) => {
                const itemPrice = Number(item.price || item.rate || 0);
                const qty = Number(item.quantity || item.qty || 1);
                const lineTotal = itemPrice * qty;
                let itemGstRate = taxEnabled ? taxRate : (perProductTax ? Number(item.gst || 0) : 0);
                let taxable = 0, gst = 0;
                const mode = (item.taxStatus || item.taxType || "Without Tax");

                if (mode === "With Tax") {
                    taxable = lineTotal / (1 + itemGstRate / 100);
                    gst = lineTotal - taxable;
                } else {
                    taxable = lineTotal;
                    gst = (lineTotal * itemGstRate) / 100;
                }
                totalTaxable += taxable;
                totalGst += gst;
            });

            const dAmt = discountEnabled ? (totalTaxable * (discountRate / 100)) : 0;
            const netTaxableVal = (totalTaxable - dAmt) + (serviceChargeEnabled ? ((totalTaxable - dAmt) * (serviceChargeRate / 100)) : 0);
            const avgGstRate = totalTaxable > 0 ? (totalGst / totalTaxable) : 0;
            const calculatedTotal = Math.floor((netTaxableVal + (netTaxableVal * avgGstRate)) * 100) / 100;
            const effectiveTotal = Math.max(calculatedTotal, Number(bill.total || 0), Number(bill.receivedAmount || 0));

            lifetimeSpend += effectiveTotal;
            if ((bill.paymentStatus || "").toUpperCase() !== "PAID") {
                pending += (effectiveTotal - Number(bill.receivedAmount || 0));
            }
        });

        return { lifetimeSpend, pending };
    }, [selectedParty, allBills, taxEnabled, perProductTax, taxRate, discountEnabled, discountRate, serviceChargeEnabled, serviceChargeRate]);

    const partiesStatsMap = React.useMemo(() => {
        const map: Record<string, { lifetimeSpend: number }> = {};
        if (!allBills) return map;

        allBills.forEach((bill: any) => {
            const pId = bill.partyId || bill.customerId || bill.party;
            const bPhone = (bill.customerPhone || bill.phone || "").replace(/\D/g, '');
            const cleanBP = bPhone.length > 10 ? bPhone.slice(-10) : bPhone;

            let billTaxable = 0, billGst = 0;
            (bill.items || []).forEach((item: any) => {
                const line = Number(item.price || item.rate || 0) * Number(item.quantity || item.qty || 1);
                let gRate = taxEnabled ? taxRate : Number(item.gst || 0);
                let mode = item.taxStatus || item.taxType || "Without Tax";
                if (mode === "With Tax") {
                    const t = line / (1 + gRate / 100);
                    billTaxable += t; billGst += (line - t);
                } else {
                    billTaxable += line; billGst += (line * gRate) / 100;
                }
            });

            const net = (billTaxable - (discountEnabled ? (billTaxable * (discountRate / 100)) : 0)) + (serviceChargeEnabled ? ((billTaxable - (discountEnabled ? (billTaxable * (discountRate / 100)) : 0)) * (serviceChargeRate / 100)) : 0);
            const calcTotal = Math.floor((net + (net * (billTaxable > 0 ? (billGst / billTaxable) : 0))) * 100) / 100;
            const billTotal = Math.max(calcTotal, Number(bill.total || 0), Number(bill.receivedAmount || 0));

            const keys = [];
            if (pId) keys.push(String(pId));
            if (cleanBP) keys.push(`phone_${cleanBP}`);

            keys.forEach(k => {
                if (!map[k]) map[k] = { lifetimeSpend: 0 };
                map[k].lifetimeSpend += billTotal;
            });
        });
        return map;
    }, [allBills, taxEnabled, taxRate, discountEnabled, discountRate, serviceChargeEnabled, serviceChargeRate]);

    const filteredParties = parties.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm)
    );

    const handleAddParty = async () => {
        if (isLockedUser) {
            setIsLoginModalVisible(true);
            return;
        }
        const sessionStr = await AsyncStorage.getItem('staff_session');
        if (!isSignedIn && !sessionStr) {
            setIsLoginModalVisible(true);
            return;
        }
        setShowAddPartyForm(true);
    };

    return (
        <View style={styles.container}>
            <ClientHeader title={t('customers')} onRefresh={() => fetchParties(true)} />

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === "parties" && styles.activeTab]} onPress={() => setActiveTab("parties")}>
                    <Text style={[styles.tabText, activeTab === "parties" && styles.activeTabText]}>{t('parties')} ({parties.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === "categories" && styles.activeTab]} onPress={() => setActiveTab("categories")}>
                    <Text style={[styles.tabText, activeTab === "categories" && styles.activeTabText]}>{t('categories')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                <Ionicons name="search" size={rf(20)} color="#6B7280" style={styles.searchIcon} />
                <TextInput value={searchTerm} onChangeText={setSearchTerm} placeholder={t('search')} placeholderTextColor="#6B7280" style={styles.filterInput} />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={THEME_PRIMARY} /></View>
            ) : activeTab === "parties" ? (
                <FlatList
                    data={filteredParties}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchParties(true)} colors={[THEME_PRIMARY]} />}
                    renderItem={({ item }) => {
                        const pId = item.id || (item as any)._id;
                        const cleanP = (item.phone || "").replace(/\D/g, '').slice(-10);
                        const stats = partiesStatsMap[pId] || partiesStatsMap[`phone_${cleanP}`] || { lifetimeSpend: 0 };
                        return <PartyListItem item={item} lifetimeSpend={stats.lifetimeSpend} onSelect={handleSelectAccount} t={t} />;
                    }}
                    contentContainerStyle={{ paddingHorizontal: s(15), paddingBottom: vs(100) }}
                    ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="people-outline" size={rf(64)} color="#D1D5DB" /><Text style={styles.emptyText}>{t('no_customers')}</Text></View>}
                />
            ) : (
                <View style={styles.emptyContainer}><Ionicons name="folder-open-outline" size={rf(64)} color="#D1D5DB" /><Text style={styles.emptyText}>Categories feature coming soon...</Text></View>
            )}

            <TouchableOpacity style={styles.fab} onPress={handleAddParty}>
                <Feather name="plus-circle" size={rf(22)} color="#fff" />
                <Text style={styles.fabText}>{t('add_customer')}</Text>
            </TouchableOpacity>

            <Modal visible={showAddPartyForm} animationType="slide" transparent={false} onRequestClose={() => setShowAddPartyForm(false)}>
                <AddPartyView onSuccess={() => { setShowAddPartyForm(false); fetchParties(); }} onBack={() => setShowAddPartyForm(false)} />
            </Modal>

            <CustomerDetailsModal
                visible={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                party={selectedParty}
                stats={customerStats}
                t={t}
                onViewHistory={() => { setShowDetailsModal(false); setShowHistoryModal(true); }}
            />

            <CustomerHistory
                visible={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                party={selectedParty}
                bills={allBills}
            />

            <NetworkErrorModal visible={showNetworkError} onClose={() => setShowNetworkError(false)} />

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
    container: { flex: 1, backgroundColor: COLOR_BG_LIGHT },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    tabContainer: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#E5E7EB", marginHorizontal: s(15), marginVertical: vs(10), borderRadius: s(12), padding: s(4) },
    tab: { flex: 1, paddingVertical: vs(10), alignItems: "center", borderRadius: s(10) },
    activeTab: { backgroundColor: "#fff", elevation: 2 },
    tabText: { color: "#4B5563", fontWeight: "600", fontSize: rf(14) },
    activeTabText: { color: THEME_PRIMARY, fontWeight: "bold" },
    filterContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: s(12), marginHorizontal: s(15), marginBottom: vs(10), paddingHorizontal: s(12) },
    searchIcon: { marginRight: s(8) },
    filterInput: { flex: 1, paddingVertical: vs(12), fontSize: rf(16), color: "#1F2937" },
    fab: { position: "absolute", bottom: vs(30), right: s(30), flexDirection: "row", backgroundColor: THEME_PRIMARY, paddingVertical: vs(15), paddingHorizontal: s(20), borderRadius: s(30), elevation: 8, alignItems: "center" },
    fabText: { color: "#fff", fontWeight: "bold", fontSize: rf(16), marginLeft: s(8) },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: vs(100) },
    emptyText: { marginTop: vs(10), fontSize: rf(16), color: "#9CA3AF" },
});

export default MainClientView;
