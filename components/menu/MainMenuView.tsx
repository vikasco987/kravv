import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    ToastAndroid,
    View
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

// Project level imports
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { SimpleBill } from "../../utils/SimpleBill";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { SaveBill } from "../common/SaveBill";
import { SimpleKOT } from "../common/SimpleKOT";

// Menu Components
import VoiceOrder from "../AI intelligence tools/VoiceOrder";
import NetworkErrorModal from "../common/NetworkErrorModal";
import { CartBar } from "./CartBar";
import { CartItemsModal } from "./CartItemsModal";
import { CategorySidebar } from "./CategorySidebar";
import { ClearCartModal } from "./ClearCartModal";
import { ConfirmHoldModal } from "./ConfirmHoldModal";
import { MenuHeader } from "./MenuHeader";
import { MenuItemCard } from "./MenuItemCard";
import { QuickAddItemCard } from "./QuickAddItemCard";
import { QuickAddItemModal } from "./QuickAddItemModal";
import { TableSelectionModal } from "./TableSelectionModal";

// Batched Components
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import AddItemView from "./AddItemView";
import CheckoutView from "./CheckoutView";
import HeldOrdersView from "./HeldOrdersView";


// --- TYPE DEFINITIONS ---
type MenuItem = {
    id: string;
    name: string;
    price?: number;
    imageUrl?: string;
    unit?: string;
    gst?: number;
    taxType?: string;
    hsnCode?: string;
};

type MenuCategory = {
    id: string;
    name: string;
    items: MenuItem[];
};

type CartItem = MenuItem & { quantity: number; editedPrice?: number; };

// --- CONSTANTS ---
const THEME_PRIMARY = "#4F46E5";
const COLOR_BG_LIGHT = "#F9FAFB";
const CATEGORY_COLUMN_WIDTH = s(80);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MainMenuView = ({ isLockedUser = false }: { isLockedUser?: boolean }) => {
    const { getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const params = useLocalSearchParams<{ staff?: string; login?: string }>();
    const { t } = useLanguage();
    const { session, canAccessSync } = useStaffPermissions();

    const [menus, setMenus] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card">("Cash");
    const [received, setReceived] = useState(false);
    const [isCartModalVisible, setIsCartModalVisible] = useState(false);
    const [isClearModalVisible, setIsClearModalVisible] = useState(false);
    const [showClearSuccess, setShowClearSuccess] = useState(false);
    const [heldCount, setHeldCount] = useState(0);
    const [isHoldModalVisible, setIsHoldModalVisible] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [showHoldSuccess, setShowHoldSuccess] = useState(false);
    const { refreshSignal, searchQuery } = useRefresh();

    // Settings states
    const [kotEnabled, setKotEnabled] = useState(false);
    const [tableBookingEnabled, setTableBookingEnabled] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [isTableModalVisible, setIsTableModalVisible] = useState(false);
    const [isQuickAddModalVisible, setIsQuickAddModalVisible] = useState(false);
    const [quickAddCategoryId, setQuickAddCategoryId] = useState("");
    const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
    const [activeCustomer, setActiveCustomer] = useState<any>(null);
    const [showNetworkError, setShowNetworkError] = useState(false);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [authBuffering, setAuthBuffering] = useState(false);
    const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);


    const [currentView, setCurrentView] = useState<"main" | "addItem" | "heldOrders" | "checkout">("main");
    const [checkoutParams, setCheckoutParams] = useState<any>(null);
    const isPrinting = useRef(false);
    const flatListRef = useRef<any>(null);
    const isFocused = useIsFocused();
    const login = params.login;




    const addSound = { play: () => { } };
    const removeSound = { play: () => { } };
    const prevSignedIn = useRef(isSignedIn);

    useEffect(() => {
        if (login === 'true') {
            setAuthBuffering(true);
            const timer = setTimeout(() => {
                setAuthBuffering(false);
                router.setParams({ login: undefined });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [login]);

    useEffect(() => {
        if (!isFocused) return;

        if (!isSignedIn && !isLoaded && !authBuffering) {
            // Handled by top level
        }
    }, [isSignedIn, isLoaded, isFocused, authBuffering]);

    useFocusEffect(useCallback(() => {
        const checkKOTCheckout = async () => {
            try {
                const data = await AsyncStorage.getItem('@temp_cart_for_checkout');
                if (data && menus.length > 0) {
                    const { items, tableName } = JSON.parse(data);

                    const newCart: Record<string, CartItem> = {};
                    items.forEach((kotItem: any) => {
                        let fullItem: MenuItem | undefined;
                        for (const cat of menus) {
                            fullItem = cat.items.find(i => i.name === kotItem.name);
                            if (fullItem) break;
                        }

                        if (fullItem) {
                            newCart[fullItem.id] = {
                                ...fullItem,
                                quantity: kotItem.quantity
                            };
                        }
                    });

                    if (Object.keys(newCart).length > 0) {
                        setCart(newCart);
                        if (tableName && tableName !== "Counter") {
                            setSelectedTable(tableName);
                        }

                        setCheckoutParams({
                            cart: JSON.stringify(newCart),
                            paymentMethod,
                            selectedTable: tableName === "Counter" ? null : tableName
                        });
                        setCurrentView("checkout");
                    }

                    await AsyncStorage.removeItem('@temp_cart_for_checkout');
                }
            } catch (e) {
                console.error("KOT to Checkout Error:", e);
            }
        };

        checkKOTCheckout();
    }, [menus, paymentMethod]));

    const fetchMenus = useCallback(async (isManualRefresh = false) => {
        if (isLockedUser) {
            setMenus([]);
            setCart({});
            setHeldCount(0);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            if (!isLoaded) return;

            // 1. Get Authentication Context
            const authToken = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const finalToken = authToken || session?.token;
            const bId = activeBusinessId || session?.businessId;

            // Allow if OWNER (has token) OR STAFF (has bId + session)
            if (!finalToken && !bId) {
                setMenus([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                if (menus.length === 0) {
                    const cachedData = await AsyncStorage.getItem('@cached_menu');
                    if (cachedData) {
                        setMenus(JSON.parse(cachedData));
                        setLoading(false);
                    } else {
                        setLoading(true);
                    }
                }
            }

            // Fetching logic depends on having either a token or a business ID for staff
            const url = bId ? `https://billing.kravy.in/api/menu/view?businessId=${bId}` : "https://billing.kravy.in/api/menu/view";

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${finalToken}`,
                    "Cache-Control": "no-cache"
                },
            });

            if (!response.ok) {
                const cachedData = await AsyncStorage.getItem('@cached_menu');
                if (cachedData) setMenus(JSON.parse(cachedData));
                return;
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const cachedData = await AsyncStorage.getItem('@cached_menu');
                if (cachedData) setMenus(JSON.parse(cachedData));
                return;
            }

            let items = await response.json();
            let processedItems: any[] = [];

            if (Array.isArray(items)) {
                processedItems = items;
            } else if (items && Array.isArray(items.menus)) {
                items.menus.forEach((cat: any) => {
                    const categoryRaw = { id: cat.id || cat._id || "others", name: cat.name || "Others" };
                    if (Array.isArray(cat.items)) {
                        cat.items.forEach((item: any) => {
                            processedItems.push({ ...item, category: categoryRaw });
                        });
                    }
                });
            } else if (items && Array.isArray(items.items)) {
                processedItems = items.items;
            }

            const categoryMap: Record<string, MenuCategory> = {};
            processedItems.forEach((item: any) => {
                const rawCat = item.category || { id: "others", name: "Others" };
                const catId = String(rawCat.id || rawCat._id || "others");
                const catName = String(rawCat.name || "Others");

                if (!categoryMap[catId]) {
                    categoryMap[catId] = { id: catId, name: catName, items: [] };
                }

                categoryMap[catId].items.push({
                    id: String(item.id || item._id || Math.random().toString()),
                    name: String(item.name || "Unnamed Item"),
                    price: Number(item.sellingPrice || item.price || item.selling_price || 0),
                    imageUrl: item.imageUrl,
                    unit: item.unit,
                    gst: item.gst,
                    taxType: item.taxType,
                    hsnCode: item.hsnCode,
                });
            });

            const catRes = await fetch("https://billing.kravy.in/api/categories", {
                headers: { Authorization: `Bearer ${finalToken}` },
            });
            if (catRes.ok) {
                const allCats = await catRes.json();
                if (Array.isArray(allCats)) {
                    allCats.forEach((c: any) => {
                        const cid = String(c.id || c._id);
                        if (!categoryMap[cid]) {
                            categoryMap[cid] = { id: cid, name: c.name, items: [] };
                        }
                    });
                }
            }

            const sortedMenus = Object.values(categoryMap)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(cat => ({
                    ...cat,
                    items: cat.items.sort((a, b) => a.name.localeCompare(b.name))
                }));

            await AsyncStorage.setItem('@cached_menu', JSON.stringify(sortedMenus));
            setMenus(sortedMenus);

        } catch (err: any) {
            if (err.message === "Network request failed") {
                setShowNetworkError(true);
            }
            const cachedData = await AsyncStorage.getItem('@cached_menu');
            if (cachedData) setMenus(JSON.parse(cachedData));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isLoaded, isSignedIn, activeBusinessId, getToken, user?.id, activeOrderId]);

    const fetchSettings = useCallback(async () => {
        try {
            const kot = await AsyncStorage.getItem('kot_enabled');
            const table = await AsyncStorage.getItem('table_booking_enabled');
            setKotEnabled(kot === 'true');
            setTableBookingEnabled(table === 'true');
        } catch (e) {
            console.error("Error fetching settings:", e);
        }
    }, []);

    const fetchHeldCount = useCallback(async () => {
        try {
            if (!isLoaded) return;

            const token = await getToken();
            const session = await StaffPermissionEngine.getSession();
            const finalToken = token || session?.token;

            if (!finalToken) {
                setHeldCount(0);
                return;
            }

            const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
            const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];

            const res = await fetch("https://billing.kravy.in/api/bill-manager?isHeld=true", {
                headers: { Authorization: `Bearer ${finalToken}` },
            });

            let backendValidCount = 0;
            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    const bills = data.bills || [];
                    backendValidCount = bills.filter((b: any) =>
                        !hiddenIds.includes(b.billNumber) && !hiddenIds.includes(b._id) && !hiddenIds.includes(b.id)
                    ).length;
                }
            }

            const localData = await AsyncStorage.getItem('@held_orders');
            let localValidCount = 0;
            if (localData) {
                const localHeld = JSON.parse(localData);
                localValidCount = localHeld.filter((lh: any) => !hiddenIds.includes(lh.id)).length;
            }

            setHeldCount(backendValidCount + localValidCount);
        } catch (e: any) {
            if (e.message === "Network request failed") {
                setShowNetworkError(true);
            }
        }
    }, [isLoaded, isSignedIn, getToken]);


    useEffect(() => {
        fetchMenus();
        fetchHeldCount();
        fetchSettings();
    }, [isLockedUser]);

    useFocusEffect(
        useCallback(() => {
            const resetFocus = async () => {
                const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
                
                // ONLY UPDATE IF CHANGED TO PREVENT LOOP
                if (bId !== activeBusinessId) {
                    setActiveBusinessId(bId);
                }

                fetchMenus();
                fetchHeldCount();
                fetchSettings();


                try {
                    const clearSignal = await AsyncStorage.getItem('@clear_cart_after_bill');
                    if (clearSignal === 'true') {
                        setCart({});
                        setActiveOrderId(null);
                        setSelectedTable(null);
                        setActiveCustomer(null);
                        await AsyncStorage.removeItem('@clear_cart_after_bill');
                    }

                    const activeCustStr = await AsyncStorage.getItem('@active_customer');
                    if (activeCustStr) {
                        setActiveCustomer(JSON.parse(activeCustStr));
                    } else {
                        setActiveCustomer(null);
                    }
                } catch (e) {
                    console.log("Error checking clear/active signals:", e);
                }
            };
            resetFocus();

            const checkResumeCart = async () => {
                try {
                    const data = await AsyncStorage.getItem('@resume_cart');
                    if (data) {
                        const resumedItems = JSON.parse(data);
                        const newCart: Record<string, CartItem> = {};
                        resumedItems.forEach((item: any) => { newCart[item.id] = item; });
                        setCart(newCart);
                        await AsyncStorage.removeItem('@resume_cart');
                        const id = await AsyncStorage.getItem('@resume_cart_id');
                        if (id) {
                            setActiveOrderId(id);
                            await AsyncStorage.removeItem('@resume_cart_id');
                        }
                        ToastAndroid.show("Order Loaded from Hold List", ToastAndroid.SHORT);
                    }
                } catch (error) { console.error("Error loading resumed cart:", error); }
            };
            checkResumeCart();
        }, [isLoaded, isSignedIn, params, user?.id, fetchMenus, fetchHeldCount, fetchSettings, refreshSignal])
    );

    useEffect(() => {
        if (refreshSignal > 0) {
            fetchMenus(true);
            fetchHeldCount();
        }
    }, [refreshSignal]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('add_to_cart_remote', (data) => {
            const itemsToAdd = Array.isArray(data) ? data : [data];
            if (itemsToAdd.length === 0) return;

            const firstItem = itemsToAdd[0];
            const catIndex = menus.findIndex(cat => (cat.items || []).some(i => i.id === firstItem.id));
            if (catIndex !== -1 && flatListRef.current) {
                try {
                    flatListRef.current.scrollToIndex({ index: catIndex, animated: true });
                } catch (e) { }
            }

            itemsToAdd.forEach(item => {
                if (item && item.id) {
                    addToCart(item);
                }
            });
            ToastAndroid.show(`Selected ${itemsToAdd.length} Favorite Items Added!`, ToastAndroid.SHORT);
        });
        return () => sub.remove();
    }, [menus]);

    const filteredMenus = useMemo(() => {
        if (!searchQuery) return menus;
        const query = searchQuery.toLowerCase();
        return menus
            .map((cat) => {
                const categoryMatches = cat.name.toLowerCase().includes(query);
                const filteredItems = cat.items.filter(
                    (item) => item.name.toLowerCase().includes(query) || item.price?.toString().includes(query)
                );
                if (categoryMatches || filteredItems.length > 0) {
                    return { ...cat, items: categoryMatches ? cat.items : filteredItems };
                }
                return null;
            })
            .filter((cat) => cat !== null) as MenuCategory[];
    }, [searchQuery, menus]);

    const addToCart = async (item: MenuItem) => {
        setCart((prev) => ({
            ...prev,
            [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
        }));
    };

    const removeFromCart = async (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev[item.id];
            if (!existing) return prev;
            if (existing.quantity === 1) {
                const newCart = { ...prev };
                delete newCart[item.id];
                return newCart;
            }
            return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } };
        });
    };

    const deleteFromCart = (item: MenuItem) => {
        setCart((prev) => {
            const newCart = { ...prev };
            delete newCart[item.id];
            return newCart;
        });
    };

    const handleConfirmClear = () => {
        setCart({});
        setActiveOrderId(null);
        setSelectedTable(null);
        setIsCartModalVisible(false);
        setIsClearModalVisible(false);
        setShowClearSuccess(true);
        setTimeout(() => setShowClearSuccess(false), 2000);
    };

    const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = Object.values(cart).reduce((sum, i) => sum + ((i.editedPrice ?? i.price ?? 0) * i.quantity), 0);

    const confirmPauseOrder = async (itemsToHold?: any[], totalOverride?: number) => {
        const itemsSnapshot = itemsToHold || Object.values(cart);
        const totalValue = totalOverride || totalAmount;
        if (itemsSnapshot.length === 0) return;

        // 🚀 INSTANT UI FEEDBACK
        setShowHoldSuccess(true);
        setIsHoldModalVisible(false);
        setCart({});
        setActiveOrderId(null);
        setSelectedTable(null);
        setHeldCount(prev => prev + 1);

        // Auto-hide success message shortly after
        setTimeout(() => setShowHoldSuccess(false), 800);

        try {
            const token = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = token || staffSession?.token;
            const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

            if (finalToken && bId) {
                const method = activeOrderId ? "PUT" : "POST";
                const url = activeOrderId ? `https://billing.kravy.in/api/bill-manager/${activeOrderId}` : "https://billing.kravy.in/api/bill-manager";

                // Background fetch (don't await for UI)
                fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
                    body: JSON.stringify({
                        items: itemsSnapshot.map(i => ({
                            itemId: i.id || Math.random().toString(16).padEnd(24, '0'),
                            productId: i.id,
                            name: i.name,
                            qty: Number(i.quantity || 1),
                            quantity: Number(i.quantity || 1),
                            rate: i.editedPrice ?? i.price ?? 0,
                            price: i.editedPrice ?? i.price ?? 0,
                            gst: Number(i.gst || 0),
                            taxStatus: (i as any).taxStatus || i.taxType || "Without Tax",
                            hsnCode: i.hsnCode || "",
                            businessId: bId
                        })),
                        subtotal: Number((totalValue / 1.05).toFixed(2)),
                        tax: Number((totalValue - (totalValue / 1.05)).toFixed(2)),
                        total: Number(totalValue.toFixed(2)),
                        paymentMode: "Cash",
                        paymentStatus: "HELD",
                        isHeld: true,
                        customerName: "Walk-in Customer",
                        tableName: "POS",
                        discountAmount: 0,
                        discountCode: null,
                        auditNote: "Held Order",
                        businessId: bId,
                        userClerkId: bId // Context ID
                    }),
                }).then(async (res) => {
                    if (!res.ok) await saveToLocalFallback(itemsSnapshot, totalValue);
                    fetchHeldCount(); // Refresh real count
                }).catch(async () => {
                    await saveToLocalFallback(itemsSnapshot, totalValue);
                });
            } else {
                await saveToLocalFallback(itemsSnapshot, totalValue);
            }

            async function saveToLocalFallback(snapshot: any[], totalVal: number) {
                try {
                    const localData = await AsyncStorage.getItem('@held_orders');
                    let orders = localData ? JSON.parse(localData) : [];

                    if (activeOrderId && activeOrderId.startsWith("BILL-")) {
                        orders = orders.map((o: any) => o.id === activeOrderId ? { ...o, items: snapshot, total: totalVal, timestamp: new Date().toISOString() } : o);
                    } else {
                        const id = "BILL-" + Date.now();
                        orders.push({ id, items: snapshot, total: totalVal, timestamp: new Date().toISOString() });
                    }
                    await AsyncStorage.setItem('@held_orders', JSON.stringify(orders));
                    fetchHeldCount();
                } catch (e) {
                    console.error("Local fallback failed:", e);
                }
            }
        } catch (e) {
            console.error("Hold process error:", e);
        }
    };

    const handlePrintKot = async (itemsOverride?: any[]) => {
        if (isPrinting.current) return;
        isPrinting.current = true;
        try {
            const token = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = token || staffSession?.token;
            const bId = activeBusinessId || await StaffPermissionEngine.getActiveBusinessId(user?.id);

            const itemsToPrint = Array.isArray(itemsOverride) ? itemsOverride : Object.values(cart);
            if (itemsToPrint.length === 0) return;

            // 1. Print
            await SimpleKOT(itemsToPrint, finalToken!, bId!, selectedTable);

            // 2. Save to KOT Page Locally (AsyncStorage)
            const localOrder = {
                id: Date.now().toString(),
                billNumber: Math.floor(1000 + Math.random() * 9000).toString(),
                tableName: selectedTable ? `Table ${selectedTable}` : "Counter",
                items: itemsToPrint.map(i => ({
                    name: i.name,
                    quantity: i.quantity
                })),
                createdAt: new Date().toISOString(),
                status: "PENDING"
            };

            const existingData = await AsyncStorage.getItem('@local_kot_list');
            const kotList = existingData ? JSON.parse(existingData) : [];
            kotList.unshift(localOrder); // Add to top
            await AsyncStorage.setItem('@local_kot_list', JSON.stringify(kotList));

            ToastAndroid.show("Sent to KOT Page & Printed!", ToastAndroid.SHORT);
        } catch (e) {
            console.error("KOT Process Error:", e);
        } finally {
            isPrinting.current = false;
        }
    };

    const handlePrintBill = async (itemsOverride?: any[], totalOverride?: number) => {
        if (isPrinting.current) return;

        const itemsToPrint = Array.isArray(itemsOverride) ? itemsOverride : Object.values(cart);
        if (itemsToPrint.length === 0) {
            ToastAndroid.show(t('no_items'), ToastAndroid.SHORT);
            return;
        }

        isPrinting.current = true;
        try {
            ToastAndroid.show("Generating Bill...", ToastAndroid.SHORT);
            const token = await getToken();
            const sessionStr = await AsyncStorage.getItem('staff_session');
            const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
            const finalToken = token || staffSession?.token;
            const bId = activeBusinessId || await StaffPermissionEngine.getActiveBusinessId(user?.id);

            const result = await SimpleBill(itemsToPrint, finalToken!, bId!, {
                paymentMode: paymentMethod,
                billId: activeOrderId || undefined,
                partyId: activeCustomer?.id || activeCustomer?._id
            });

            if (result?.status === "success") {
                setCart({});
                setActiveOrderId(null);
                setSelectedTable(null);
                fetchHeldCount();
                setActiveCustomer(null);
                await AsyncStorage.removeItem('@active_customer');
            }
        } finally {
            isPrinting.current = false;
        }
    };

    const handleSaveBill = async () => {
        const token = await getToken();
        const sessionStr = await AsyncStorage.getItem('staff_session');
        const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
        const finalToken = token || staffSession?.token;
        const bId = activeBusinessId || await StaffPermissionEngine.getActiveBusinessId(user?.id);

        const result = await SaveBill(Object.values(cart), finalToken!, bId!, {
            paymentMode: paymentMethod,
            billId: activeOrderId || undefined,
            partyId: activeCustomer?.id || activeCustomer?._id,
            customerName: activeCustomer?.name,
            customerPhone: activeCustomer?.phone
        });
        if (result?.status === "saved") {
            setCart({}); setActiveOrderId(null); setSelectedTable(null); fetchHeldCount();
            setActiveCustomer(null);
            await AsyncStorage.removeItem('@active_customer');
        }
    };

    const itemWidth = (SCREEN_WIDTH - CATEGORY_COLUMN_WIDTH - s(32)) / 3;

    if (!isLoaded || loading || authBuffering) return (
        <View style={styles.center}><ActivityIndicator size="large" color={THEME_PRIMARY} /><Text style={{ marginTop: 10 }}>{t('loading')}</Text></View>
    );


    if (currentView === "addItem") return <AddItemView onBack={() => setCurrentView("main")} />;
    if (currentView === "heldOrders") return <HeldOrdersView onBack={() => { setCurrentView("main"); fetchHeldCount(); }} />;
    if (currentView === "checkout") return (
        <CheckoutView
            onBack={(clearCart) => {
                if (clearCart) {
                    setCart({});
                    setActiveOrderId(null);
                    setSelectedTable(null);
                }
                setCurrentView("main");
            }}
            cartParams={checkoutParams}
        />
    );

    return (
        <View style={styles.container}>
            <MenuHeader
                onAddItem={async () => {
                    if (isLockedUser) {
                        setIsLoginModalVisible(true);
                        return;
                    }
                    const staffSession = await StaffPermissionEngine.getSession();
                    if (!isSignedIn && !staffSession) {
                        setIsLoginModalVisible(true);
                    } else {
                        setCurrentView("addItem");
                    }
                }}
                onPauseOrder={async () => {
                    if (isLockedUser) {
                        setIsLoginModalVisible(true);
                        return;
                    }
                    const staffSession = await StaffPermissionEngine.getSession();
                    if (!isSignedIn && !staffSession) {
                        setIsLoginModalVisible(true);
                    } else if (Object.keys(cart).length === 0) {
                        ToastAndroid.show(t('no_items'), ToastAndroid.SHORT);
                    } else {
                        setIsHoldModalVisible(true);
                    }
                }}
                onViewHeldOrders={async () => {
                    if (isLockedUser) {
                        setIsLoginModalVisible(true);
                        return;
                    }
                    const staffSession = await StaffPermissionEngine.getSession();
                    if (!isSignedIn && !staffSession) {
                        setIsLoginModalVisible(true);
                    } else {
                        setCurrentView("heldOrders");
                    }
                }}
                onVoicePress={async () => {
                    if (isLockedUser) {
                        setIsLoginModalVisible(true);
                        return;
                    }
                    const staffSession = await StaffPermissionEngine.getSession();
                    if (!isSignedIn && !staffSession) {
                        setIsLoginModalVisible(true);
                    } else if (!canAccessSync("AI Intelligence Tools")) {
                        // Just returned, visual lock will be handled by prop
                        return;
                    } else {
                        setIsVoiceModalVisible(true);
                    }
                }}
                heldCount={heldCount}
                isVoiceLocked={!canAccessSync("AI Intelligence Tools")}
            />


            <LoginRequiredModal
                visible={isLoginModalVisible}
                onClose={() => setIsLoginModalVisible(false)}
                onSignIn={() => {
                    setIsLoginModalVisible(false);
                    router.push("/(auth)/sign-in");
                }}
            />

            <View style={styles.row}>
                <CategorySidebar
                    categories={filteredMenus}
                    onCategoryPress={(cat, index) => flatListRef.current?.scrollToIndex({ index, animated: true })}
                    cartVisible={totalItems > 0}
                />

                <FlatList
                    ref={flatListRef}
                    data={filteredMenus}
                    keyExtractor={(cat) => cat.id}
                    contentContainerStyle={{ paddingBottom: 450, flexGrow: 1 }}
                    ListEmptyComponent={null}
                    onScrollToIndexFailed={(info) => {

                        const estimatedOffset = info.averageItemLength * info.index;
                        flatListRef.current?.scrollToOffset({ offset: estimatedOffset, animated: false });
                        setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 100);
                    }}
                    renderItem={({ item: cat }) => (
                        <View>
                            <Text style={styles.categoryHeader}>{cat.name}</Text>
                            <View style={styles.gridContainer}>
                                {cat.items.map((item) => (
                                    <MenuItemCard
                                        key={item.id}
                                        item={item}
                                        itemWidth={itemWidth}
                                        quantity={cart[item.id]?.quantity || 0}
                                        onAdd={addToCart}
                                        onRemove={removeFromCart}
                                    />
                                ))}
                                {!searchQuery && (
                                    <QuickAddItemCard
                                        itemWidth={itemWidth}
                                        onPress={() => {
                                            setQuickAddCategoryId(cat.id);
                                            setIsQuickAddModalVisible(true);
                                        }}
                                    />
                                )}
                            </View>
                        </View>
                    )}
                />
            </View>

            {totalItems > 0 && (
                <CartBar
                    totalItems={totalItems}
                    totalAmount={totalAmount}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    received={received}
                    setReceived={setReceived}
                    onViewCart={() => setIsCartModalVisible(true)}
                    onPrintKot={handlePrintKot}
                    onPrintBill={handlePrintBill}
                    onSaveBill={handleSaveBill}
                    onProceed={() => {
                        setCheckoutParams({ cart: JSON.stringify(cart), paymentMethod, selectedTable });
                        setCurrentView("checkout");
                    }}
                    kotEnabled={kotEnabled}

                    tableBookingEnabled={tableBookingEnabled}
                    onSelectTable={() => setIsTableModalVisible(true)}
                    selectedTable={selectedTable}
                />
            )}

            <CartItemsModal
                visible={isCartModalVisible}
                onClose={() => setIsCartModalVisible(false)}
                cartItems={Object.values(cart)}
                totalItems={totalItems}
                totalAmount={totalAmount}
                onAdd={addToCart}
                onRemove={removeFromCart}
                onDelete={deleteFromCart}
                onClear={() => setIsClearModalVisible(true)}
            />

            <TableSelectionModal
                visible={isTableModalVisible}
                onClose={() => setIsTableModalVisible(false)}
                selectedTable={selectedTable}
                onSelect={(table) => { setSelectedTable(table); setIsTableModalVisible(false); }}
            />

            <ConfirmHoldModal
                visible={isHoldModalVisible}
                onClose={() => setIsHoldModalVisible(false)}
                onConfirm={() => confirmPauseOrder()}
                totalAmount={totalAmount}
                totalItems={totalItems}
                showSuccess={showHoldSuccess}
            />

            <ClearCartModal
                visible={isClearModalVisible}
                onClose={() => setIsClearModalVisible(false)}
                onConfirm={handleConfirmClear}
                showSuccess={showClearSuccess}
            />

            <QuickAddItemModal
                visible={isQuickAddModalVisible}
                onClose={() => setIsQuickAddModalVisible(false)}
                categoryId={quickAddCategoryId}
                onSuccess={() => fetchMenus(true)}
            />

            <VoiceOrder
                visible={isVoiceModalVisible}
                onClose={() => setIsVoiceModalVisible(false)}
                menus={menus}
                onItemMatched={(item, qty) => {
                    for (let i = 0; i < qty; i++) addToCart(item);
                }}
                onSaveRequested={() => confirmPauseOrder()}
                onKOTRequested={handlePrintKot}
                onBillRequested={handlePrintBill}
            />

            <NetworkErrorModal
                visible={showNetworkError}
                onClose={() => setShowNetworkError(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: vs(2), backgroundColor: COLOR_BG_LIGHT },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    row: { flex: 1, flexDirection: "row" },
    categoryHeader: { fontSize: rf(11), fontWeight: "bold", backgroundColor: "#E0E7FF", padding: s(3), marginTop: vs(10), borderRadius: s(6), textAlign: "center", color: THEME_PRIMARY, marginHorizontal: s(10) },
    gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: s(4), marginTop: vs(5) },
    loginPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: s(40), marginTop: vs(50) },
    loginTitle: { fontSize: rf(24), fontWeight: '800', color: '#1E293B', marginTop: vs(20) },
    loginSubtitle: { fontSize: rf(14), color: '#64748B', textAlign: 'center', marginTop: vs(10), lineHeight: vs(20), paddingHorizontal: s(20) },
    loginBtn: { backgroundColor: THEME_PRIMARY, paddingVertical: vs(12), paddingHorizontal: s(30), borderRadius: s(12), marginTop: vs(25) },
    loginBtnText: { color: "#FFF", fontSize: rf(16), fontWeight: "bold" }
});

export default MainMenuView;
