import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useIsFocused } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

// Project level imports
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import {
  getCompanyProfiles,
  getRecentCompanyProfile,
  updateBusinessSettings,
} from "../../services/companyService";
import { preCacheLogo, resolveOrderToken, SimpleBill } from "../../utils/SimpleBill";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { SaveBill } from "../common/SaveBill";
import { SimpleKOT } from "../common/SimpleKOT";
import { SubscriptionRequiredModal } from "../common/SubscriptionRequiredModal";

// Menu Components
import VoiceOrder from "../AI intelligence tools/VoiceOrder";
import NetworkErrorModal from "../common/NetworkErrorModal";
import { BillPreviewModal } from "./BillPreviewModal";
import { CartBar } from "./CartBar";
import { CartItemsModal } from "./CartItemsModal";
import { CategorySidebar } from "./CategorySidebar";
import { ClearCartModal } from "./ClearCartModal";
import { ConfirmHoldModal } from "./ConfirmHoldModal";
import { MenuHeader } from "./MenuHeader";
import { MenuItemCard } from "./MenuItemCard";
import { ProfileSelectionModal } from "./ProfileSelectionModal";
import { QuickAddItemCard } from "./QuickAddItemCard";
import { QuickAddItemModal } from "./QuickAddItemModal";
import { TableSelectionModal } from "./TableSelectionModal";
import { ZoneSelectionModal } from "./ZoneSelectionModal";

// Batched Components
import { SyncManager } from "../../services/SyncManager";
import { SoundManager } from "../../utils/SoundManager";
import CheckoutView from "../common/CheckoutView";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";
import { useStaffPermissions } from "../staff creat/useStaffPermissions";
import AddItemView from "./AddItemView";
import HeldOrdersView from "./HeldOrdersView";

// --- TYPE DEFINITIONS ---
type MenuItem = {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  imageUrl?: string;
  unit?: string;
  gst?: number;
  taxType?: string;
  hsnCode?: string;
  zones?: string[];
  isVeg?: boolean;
  isEgg?: boolean;
  variants?: { name: string, price: number | string, originalId?: string, originalName?: string }[];
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

type CartItem = MenuItem & { quantity: number; editedPrice?: number };

// --- CONSTANTS ---
const THEME_PRIMARY = "#4F46E5";
const COLOR_BG_LIGHT = "#F4F4F5";
const CATEGORY_COLUMN_WIDTH = s(85);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Wallet">(
    "Cash",
  );
  const [received, setReceived] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isBillPreviewVisible, setIsBillPreviewVisible] = useState(false);
  const [isClearModalVisible, setIsClearModalVisible] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);
  const [heldCount, setHeldCount] = useState(0);
  const [isHoldModalVisible, setIsHoldModalVisible] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showHoldSuccess, setShowHoldSuccess] = useState(false);
  const { refreshSignal, triggerRefresh, searchQuery, isListView } = useRefresh();

  // Settings states
  const [kotEnabled, setKotEnabled] = useState(false);
  const [tableBookingEnabled, setTableBookingEnabled] = useState(false);
  const [roomBookingEnabled, setRoomBookingEnabled] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [multiZoneMenuEnabled, setMultiZoneMenuEnabled] = useState(false);
  const [menuGridEnabled, setMenuGridEnabled] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("Global");
  const [isZoneModalVisible, setIsZoneModalVisible] = useState(false);
  const [bookingMode, setBookingMode] = useState<"Table" | "Room">("Table");
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [isQuickAddModalVisible, setIsQuickAddModalVisible] = useState(false);
  const [quickAddCategoryId, setQuickAddCategoryId] = useState("");
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] =
    useState(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);
  const [authBuffering, setAuthBuffering] = useState(false);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [activeOwnerClerkId, setActiveOwnerClerkId] = useState<string | null>(
    null,
  );

  const [profiles, setProfiles] = useState<any[]>([]);
  const [enableMultipleProfiles, setEnableMultipleProfiles] = useState(false);
  const [isProfileSelectionVisible, setIsProfileSelectionVisible] = useState(false);

  const [currentView, setCurrentView] = useState<
    "main" | "addItem" | "heldOrders" | "checkout"
  >("main");

  const [checkoutParams, setCheckoutParams] = useState<any>(null);
  const [selectedItemForSize, setSelectedItemForSize] = useState<MenuItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentView !== "main") {
          if (currentView === "checkout" && checkoutParams?.kotId) {
            setCart({}); // Clear menu cart so items aren't selected
            setCheckoutParams(null);
            setCurrentView("main");
            if (checkoutParams.source === 'kot') {
              router.replace("/(tabs)/kot" as any);
            } else {
              router.replace("/(tabs)/orders" as any);
            }
          } else {
            setCurrentView("main");
          }
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [currentView, checkoutParams, router])
  );
  const isPrinting = useRef(false);
  const flatListRef = useRef<any>(null);
  const lastKotTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (Object.keys(cart).length === 0) {
      lastKotTokenRef.current = null;
    }
  }, [cart]);

  const isFocused = useIsFocused();
  const login = params.login;
  const [taxSettings, setTaxSettings] = useState<any>(null);
  const isFetchingHeldCount = useRef(false);

  const loadTaxSettings = async () => {
    try {
      const keys = [
        "tax_enabled",
        "tax_rate",
        "per_product_tax",
        "discount_enabled",
        "discount_rate",
        "service_charge_enabled",
        "service_charge_rate",
        "service_gst_enabled",
        "service_gst_rate",
        "delivery_charge_enabled",
        "delivery_charge_amount",
        "delivery_gst_enabled",
        "delivery_gst_rate",
        "packaging_charge_enabled",
        "packaging_charge_amount",
        "packaging_gst_enabled",
        "packaging_gst_rate",
      ];
      const results = await AsyncStorage.multiGet(keys);
      const settings: any = {};
      results.forEach(([key, val]) => {
        settings[key] = val;
      });

      setTaxSettings({
        enabled: settings["tax_enabled"] === "true",
        rate: parseFloat(settings["tax_rate"] || "0"),
        perProduct: settings["per_product_tax"] === "true",
        discountEnabled: settings["discount_enabled"] === "true",
        discountRate: parseFloat(settings["discount_rate"] || "0"),
        serviceChargeEnabled: settings["service_charge_enabled"] === "true",
        serviceChargeRate:
          parseFloat(settings["service_charge_rate"] || "0") || 0,
        serviceGstEnabled: settings["service_gst_enabled"] === "true",
        serviceGstRate: parseFloat(settings["service_gst_rate"] || "0") || 0,
        deliveryChargeEnabled: settings["delivery_charge_enabled"] === "true",
        deliveryChargeAmount:
          parseFloat(settings["delivery_charge_amount"] || "0") || 0,
        deliveryGstEnabled: settings["delivery_gst_enabled"] === "true",
        deliveryGstRate: parseFloat(settings["delivery_gst_rate"] || "0") || 0,
        packagingChargeEnabled: settings["packaging_charge_enabled"] === "true",
        packagingChargeAmount:
          parseFloat(settings["packaging_charge_amount"] || "0") || 0,
        packagingGstEnabled: settings["packaging_gst_enabled"] === "true",
        packagingGstRate:
          parseFloat(settings["packaging_gst_rate"] || "0") || 0,
      });
    } catch (e) {
      console.log("Tax settings loading info (MainMenuView):", e);
    }
  };

  const addSound = { play: () => { } };
  const removeSound = { play: () => { } };
  const prevSignedIn = useRef(isSignedIn);

  useEffect(() => {
    if (login === "true") {
      setIsSubscriptionModalVisible(true);
      setAuthBuffering(true);
      const timer = setTimeout(() => {
        setAuthBuffering(false);
        router.setParams({ login: undefined });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [login]);

  const fetchMenus = useCallback(
    async (isManualRefresh = false) => {
      if (isLockedUser) {
        setMenus([]);
        setCart({});
        setHeldCount(0);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let cacheFound = false;

      try {
        // 🚀 STEP 1: Always try to load from Cache FIRST for instant UI
        const cacheKey = `@cached_menu_${activeBusinessId || user?.id || 'guest'}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed && parsed.length > 0) {
            setMenus((prev) =>
              JSON.stringify(prev) !== JSON.stringify(parsed) ? parsed : prev,
            );
            setLoading((prev) => (prev ? false : prev));
            cacheFound = true;
          }
        }
      } catch (e) {
        console.log("Error reading menu cache:", e);
      }

      try {
        if (!isLoaded) return;

        // 1. Get Authentication Context
        let authToken = null;
        try {
          authToken = await getToken();
        } catch (e) {
          console.log("Token fetch failed (offline?)");
        }

        const session = await StaffPermissionEngine.getSession();
        const finalToken = authToken || session?.token;
        const bId = activeBusinessId || session?.businessId;

        // Allow syncing only if online/token exists
        if (finalToken) {
          SyncManager.syncPendingBills(finalToken);
        }

        // If we have NO token/bId AND NO cache, then we can't show anything
        if (!finalToken && !bId && !cacheFound) {
          setMenus([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (isManualRefresh) {
          setRefreshing((prev) => (!prev ? true : prev));
        } else if (!cacheFound) {
          setLoading((prev) => (!prev ? true : prev));
        }

        // Only proceed with network fetch if we have a way to identify the business
        if (!finalToken && !bId) {
          // Keep showing cached menus if we have them
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const itemsUrl = bId
          ? `https://billing.kravy.in/api/menu/view?businessId=${bId}&t=${Date.now()}`
          : `https://billing.kravy.in/api/menu/view?t=${Date.now()}`;
        const catUrl = bId
          ? `https://billing.kravy.in/api/categories?businessId=${bId}&t=${Date.now()}`
          : `https://billing.kravy.in/api/categories?t=${Date.now()}`;

        // 🚀 Parallel Fetch for ultimate speed
        const [menuRes, catRes] = await Promise.all([
          fetch(itemsUrl, {
            headers: {
              Authorization: `Bearer ${finalToken}`,
              Cookie: `staff_token=${finalToken}`,
              "Cache-Control": "no-cache",
            },
          }).catch((e) => null),
          fetch(catUrl, {
            headers: {
              Authorization: `Bearer ${finalToken}`,
              Cookie: `staff_token=${finalToken}`,
              "Cache-Control": "no-cache",
            },
          }).catch((e) => null),
        ]);

        let processedItems: any[] = [];
        const categoryMap: Record<string, MenuCategory> = {};

        // Process Menu Items
        if (menuRes && menuRes.ok) {
          const items = await menuRes.json();
          let itemsList = Array.isArray(items)
            ? items
            : items?.menus || items?.items || [];

          // If it's the 'menus' structure (grouped by category)
          if (items && Array.isArray(items.menus)) {
            items.menus.forEach((cat: any) => {
              const categoryRaw = {
                id: cat.id || cat._id || "others",
                name: cat.name || "Others",
              };
              if (Array.isArray(cat.items)) {
                cat.items.forEach((item: any) => {
                  processedItems.push({ ...item, category: categoryRaw });
                });
              }
            });
          } else {
            processedItems = itemsList;
          }

          // GROUPING LOGIC START (similar to QR menu)
          const groupedProcessedItems: any[] = [];
          const groupedMap: Record<string, any[]> = {};
          
          processedItems.forEach((it: any) => {
            let rawName = it.name || "Unnamed";
            // Remove (V), (v), (NV), (nv) from the name entirely
            rawName = rawName.replace(/\s*\([vV]\)\s*/g, '').replace(/\s*\([nN][vV]\)\s*/g, '').trim();
            it.name = rawName; // Update the name to hide it

            let baseName = rawName;
            // Match the size in the last parenthesis, e.g. "Pizza (Large)" -> "Large"
            const suffixMatch = rawName.match(/\s*\(([^)]+)\)$/);
            if (suffixMatch) {
               baseName = rawName.substring(0, suffixMatch.index).trim();
            }
            const catId = it.category?.id || it.category?._id || it.category?.name || "others";
            const groupKey = `${catId}_${baseName}`;
            
            if (!groupedMap[groupKey]) groupedMap[groupKey] = [];
            groupedMap[groupKey].push(it);
          });
          
          Object.values(groupedMap).forEach(group => {
            if (group.length === 1) {
              groupedProcessedItems.push(group[0]);
            } else {
              const baseItem = { ...group[0] };
              baseItem.name = (baseItem.name || "").replace(/\s*\([^)]+\)$/, "").trim();
              
              const minPrice = Math.min(...group.map(i => Number(i.sellingPrice || i.price || i.selling_price || 0)));
              baseItem.sellingPrice = minPrice;
              baseItem.price = minPrice;
              
              // Merge size variants with existing addons
              const existingVariants = group[0].variants || [];
              const sizeVariants = group.map(i => {
                  const match = (i.name || "").match(/\((.*?)\)/)?.[1] || (i.name || "");
                  let niceName = match;
                  if (match.toUpperCase() === 'F' || match.toUpperCase() === 'FULL') niceName = 'Full Portion';
                  else if (match.toUpperCase() === 'H' || match.toUpperCase() === 'HALF') niceName = 'Half Portion';
                  else if (match.toUpperCase() === 'S' || match.toUpperCase() === 'SMALL') niceName = 'Small';
                  else if (match.toUpperCase() === 'R' || match.toUpperCase() === 'REGULAR') niceName = 'Regular';
                  else if (match.toUpperCase() === 'M' || match.toUpperCase() === 'MEDIUM') niceName = 'Medium';
                  else if (match.toUpperCase() === 'L' || match.toUpperCase() === 'LARGE') niceName = 'Large';
                  
                  return {
                      name: niceName,
                      price: Number(i.sellingPrice || i.price || i.selling_price || 0),
                      originalId: String(i.id || i._id),
                      originalName: i.name
                  };
              });
              
              baseItem.variants = [...sizeVariants, ...existingVariants];
              
              groupedProcessedItems.push(baseItem);
            }
          });

          groupedProcessedItems.forEach((item: any) => {
            const rawCat = item.category || { id: "others", name: "Others" };
            const catId = String(rawCat.id || rawCat._id || "others");
            const catName = String(rawCat.name || "Others");

            if (!categoryMap[catId]) {
              categoryMap[catId] = { id: catId, name: catName, items: [] };
            }

            const newItem: MenuItem = {
              id: String(item.id || item._id || Math.random().toString()),
              name: String(item.name || "Unnamed Item"),
              price: Number(
                item.sellingPrice || item.price || item.selling_price || 0,
              ),
              imageUrl: item.imageUrl,
              unit: item.unit,
              gst: item.gst,
              taxType: item.taxType,
              hsnCode: item.hsnCode,
              zones: item.zones || [],
              variants: item.variants || [],
            };

            const nameLower = newItem.name.toLowerCase();
            const nameHasEgg = nameLower.includes("egg") || nameLower.includes("(e)");
            const nameHasNV = nameLower.includes("(nv)") || nameLower.includes("chicken") || nameLower.includes("mutton") || nameLower.includes("fish") || nameLower.includes("beef") || nameLower.includes("pork");

            let parsedEgg = item.isEgg === true || item.isEgg === "true" || item.isEgg === 1;
            let parsedVeg = item.isVeg === false || item.isVeg === "false" || item.isVeg === 0 ? false : true;

            if (nameHasEgg) parsedEgg = true;
            if (nameHasNV || nameHasEgg) parsedVeg = false;

            newItem.isEgg = parsedEgg;
            newItem.isVeg = parsedVeg;

            categoryMap[catId].items.push(newItem);
          });
        }

        // Process Extra Categories (empty ones)
        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          const allCats = Array.isArray(catData)
            ? catData
            : catData.data || catData.categories || [];
          if (Array.isArray(allCats)) {
            allCats.forEach((c: any) => {
              const cid = String(c.id || c._id);
              if (!categoryMap[cid]) {
                categoryMap[cid] = { id: cid, name: c.name, items: [] };
              }
            });
          }
        }

        const finalMenus = Object.values(categoryMap)
          .filter(
            (cat) =>
              cat.items.length > 0 ||
              (cat.id !== "others" && cat.id !== "none"),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((cat) => ({
            ...cat,
            items: cat.items.sort((a, b) => a.name.localeCompare(b.name)),
          }));

        // 🚀 RESILIENCE: If we have cached categories that are now missing (due to 504 on catRes),
        // we should try to keep them if possible.
        if (catRes && !catRes.ok && menus.length > 0) {
          menus.forEach((exCat) => {
            if (!categoryMap[exCat.id]) {
              finalMenus.push(exCat);
            }
          });
        }

        if (finalMenus.length > 0) {
          const cacheKey = `@cached_menu_${activeBusinessId || user?.id || 'guest'}`;
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify(finalMenus),
          );
          setMenus((prev) =>
            JSON.stringify(prev) !== JSON.stringify(finalMenus)
              ? finalMenus
              : prev,
          );
        } else if (!cacheFound) {
          setMenus((prev) => (prev.length > 0 ? [] : prev));
        }
      } catch (err: any) {
        console.log("Fetch Error:", err.message);
        // ONLY show network error if we have NOTHING to show (no cache)
        if (!cacheFound) {
          if (err.message === "Network request failed") {
            setShowNetworkError(true);
          }
        }
      } finally {
        setLoading((prev) => (prev ? false : prev));
        setRefreshing((prev) => (prev ? false : prev));
      }
    },
    [isLoaded, isSignedIn, activeBusinessId, user?.id, activeOrderId],
  );

  const fetchSettings = useCallback(async () => {
    try {
      const kot = await AsyncStorage.getItem("kot_enabled");
      const table = await AsyncStorage.getItem("table_booking_enabled");
      const room = await AsyncStorage.getItem("room_booking_enabled");
      const multiZone = await AsyncStorage.getItem("multi_zone_menu_enabled");
      const menuGrid = await AsyncStorage.getItem("menu_grid_enabled");
      const savedZone = await AsyncStorage.getItem("default_selected_zone");
      const isKot = kot === "true";
      const isTable = table === "true";
      const isRoom = room === "true";
      const isMultiZone = multiZone === "true";
      const isMenuGrid = menuGrid === "true";

      if (savedZone) {
        setSelectedZone(savedZone);
      }

      setKotEnabled((prev) => (prev !== isKot ? isKot : prev));
      setTableBookingEnabled((prev) => (prev !== isTable ? isTable : prev));
      setRoomBookingEnabled((prev) => (prev !== isRoom ? isRoom : prev));
      setMultiZoneMenuEnabled((prev) => (prev !== isMultiZone ? isMultiZone : prev));
      setMenuGridEnabled((prev) => (prev !== isMenuGrid ? isMenuGrid : prev));
    } catch (e) {
      console.log("Settings fetch info (local):", e);
    }
  }, []);

  const fetchHeldCount = useCallback(async () => {
    if (!isLoaded || isFetchingHeldCount.current) return;
    isFetchingHeldCount.current = true;

    try {
      const token = await getToken();
      const session = await StaffPermissionEngine.getSession();
      const finalToken = token || session?.token;

      if (!finalToken) {
        setHeldCount(0);
        return;
      }

      const bId = activeBusinessId || session?.businessId;
      const timestamp = Date.now();
      const res = await fetch(
        bId
          ? `https://billing.kravy.in/api/bill-manager?isHeld=true&businessId=${bId}&t=${timestamp}`
          : `https://billing.kravy.in/api/bill-manager?isHeld=true&t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${finalToken}`,
            Cookie: `staff_token=${finalToken}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        const bills = data.bills || [];
        const count = bills.filter((b: any) => b.isHeld !== false).length;
        setHeldCount((prev) => (prev !== count ? count : prev));
      }
    } catch (e: any) {
      console.log("Fetch held count info:", e.message);
    } finally {
      isFetchingHeldCount.current = false;
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isFocused) return;

    if (!isSignedIn && !isLoaded && !authBuffering) {
      // Handled by top level
    }
  }, [isSignedIn, isLoaded, isFocused, authBuffering]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("refresh_menu_data", () => {
      fetchMenus(false);
    });
    return () => sub.remove();
  }, [fetchMenus]);

  useFocusEffect(
    useCallback(() => {
      const checkKOTCheckout = async () => {
        try {
          const data = await AsyncStorage.getItem("@temp_cart_for_checkout");
          if (data && menus.length > 0) {
            const { items, tableName, tokenNumber } = JSON.parse(data);

            const newCart: Record<string, CartItem> = {};
            items.forEach((kotItem: any) => {
              let fullItem: MenuItem | undefined;
              for (const cat of menus) {
                fullItem = cat.items.find((i) => i.name === kotItem.name);
                if (fullItem) break;
              }

              const itemPrice = Number(kotItem.price ?? kotItem.sellingPrice ?? kotItem.rate ?? (fullItem?.price || 0));

              if (fullItem) {
                const isCustomPrice = itemPrice !== Number(fullItem.price);
                const cartKey = isCustomPrice ? `${fullItem.id}_custom_${itemPrice}` : fullItem.id;

                if (newCart[cartKey]) {
                  newCart[cartKey].quantity += Number(kotItem.quantity || 1);
                } else {
                  newCart[cartKey] = {
                    ...fullItem,
                    quantity: Number(kotItem.quantity || 1),
                    ...(isCustomPrice ? { editedPrice: itemPrice } : {})
                  };
                }
              } else {
                // Fallback for items no longer in menu
                const cartKey = `fallback_${itemPrice}_${kotItem.name.replace(/\s+/g, '')}`;
                if (newCart[cartKey]) {
                  newCart[cartKey].quantity += Number(kotItem.quantity || 1);
                } else {
                  newCart[cartKey] = {
                    id: cartKey,
                    name: kotItem.name,
                    price: itemPrice,
                    quantity: Number(kotItem.quantity || 1),
                    editedPrice: itemPrice
                  };
                }
              }
            });

            if (Object.keys(newCart).length > 0) {
              setCart(newCart);
              if (tableName && tableName !== "Counter") {
                setSelectedTable(tableName);
              }

              const parsedData = JSON.parse(data);
              setCheckoutParams({
                cart: JSON.stringify(newCart),
                paymentMethod,
                selectedTable: tableName === "Counter" ? null : tableName,
                tokenNo: tokenNumber,
                kotId: parsedData.kotId,
                customerName: parsedData.customerName,
                customerPhone: parsedData.customerPhone,
                customerAddress: parsedData.customerAddress,
                billNumber: parsedData.billNumber,
                source: parsedData.source,
              });
              setCurrentView("checkout");
            }

            await AsyncStorage.removeItem("@temp_cart_for_checkout");
          }
        } catch (e) {
          console.error("KOT to Checkout Error:", e);
        }
      };

      checkKOTCheckout();
    }, [menus, paymentMethod]),
  );

  const loadProfiles = useCallback(async () => {
    try {
      const clerkToken = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const token = clerkToken || staffSession?.token;
      if (token) {
        const data = await getCompanyProfiles(token);
        if (data) {
          setProfiles(data.profiles || []);
          setEnableMultipleProfiles(data.enableMultipleProfiles || false);
        }
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    fetchMenus();
    fetchHeldCount();
    fetchSettings();
    loadTaxSettings();
    loadProfiles();
  }, [isLockedUser]);

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchMenus(true);
      fetchHeldCount();
      fetchSettings();
      loadTaxSettings();
      loadProfiles();
    }
  }, [refreshSignal]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === "active") {
        console.log(
          "🔄 App returned to foreground! Checking payment/subscription status...",
        );
        try {
          const authToken = await getToken();
          const session = await StaffPermissionEngine.getSession();
          const finalToken = authToken || session?.token;
          const profile = await getRecentCompanyProfile(finalToken || "");
          if (profile) {
            console.log("DEBUG SaaS Overrides Foreground Received:", {
              isFrozen: profile.isFrozen,
              showPremiumPopup: profile.showPremiumPopup,
              isPremium: profile.isPremium,
            });
            setActiveOwnerClerkId(profile.userId || profile.businessId);
            if (profile.isFrozen === true) {
              setIsAccountBlocked(true);
              setIsSubscriptionModalVisible(true);
            } else {
              setIsAccountBlocked(false);

              if (profile.isPremium === true) {
                setIsSubscriptionModalVisible(false);
              } else if (profile.showPremiumPopup === true) {
                setIsSubscriptionModalVisible(true);
              } else {
                const trialStart = profile.trialStartedAt
                  ? new Date(profile.trialStartedAt)
                  : new Date();
                const now = new Date();
                const diffDays =
                  (now.getTime() - trialStart.getTime()) /
                  (1000 * 60 * 60 * 24);
                if (diffDays > 14) {
                  setIsSubscriptionModalVisible(true);
                } else {
                  setIsSubscriptionModalVisible(false);
                }
              }
            }
          }
        } catch (err) {
          console.error("Foreground SaaS Sync Error:", err);
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [user, activeBusinessId]);

  useFocusEffect(
    useCallback(() => {
      const resetFocus = async () => {
        let bId = await AsyncStorage.getItem("@active_business_id");
        if (!bId) {
          bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);
          if (bId) await AsyncStorage.setItem("@active_business_id", bId);
        }

        // ONLY UPDATE IF CHANGED TO PREVENT LOOP
        if (bId !== activeBusinessId) {
          setActiveBusinessId(bId);
        }

        fetchMenus();
        fetchHeldCount();
        fetchSettings();
        loadTaxSettings();
        loadProfiles();

        try {
          const authToken = await getToken();
          const session = await StaffPermissionEngine.getSession();
          const finalToken = authToken || session?.token;
          const profile = await getRecentCompanyProfile(finalToken || "");

          // Get the logged-in email and synchronize with company profile if out of sync
          const loggedInEmail =
            user?.primaryEmailAddress?.emailAddress || session?.email;
          if (
            finalToken &&
            loggedInEmail &&
            profile &&
            profile.email !== loggedInEmail
          ) {
            console.log(
              "🔄 Syncing email address to company profile:",
              loggedInEmail,
            );
            await updateBusinessSettings(finalToken, {
              email: loggedInEmail,
              contactPersonEmail: loggedInEmail,
              businessEmail: loggedInEmail,
            });
          }

          if (profile) {
            console.log("DEBUG SaaS Overrides Received:", {
              isFrozen: profile.isFrozen,
              showPremiumPopup: profile.showPremiumPopup,
              isPremium: profile.isPremium,
              trialStartedAt: profile.trialStartedAt,
            });
            setActiveOwnerClerkId(profile.userId || profile.businessId);
            // Check SaaS manual overrides
            if (profile.isFrozen === true) {
              setIsAccountBlocked(true);
              setIsSubscriptionModalVisible(true);
            } else {
              setIsAccountBlocked(false);

              if (profile.isPremium === true) {
                setIsSubscriptionModalVisible(false);
              } else if (profile.showPremiumPopup === true) {
                setIsSubscriptionModalVisible(true);
              } else {
                // Check trial expiry (14 days trial)
                const trialStart = profile.trialStartedAt
                  ? new Date(profile.trialStartedAt)
                  : new Date();
                const now = new Date();
                const diffDays =
                  (now.getTime() - trialStart.getTime()) /
                  (1000 * 60 * 60 * 24);
                if (diffDays > 14) {
                  setIsSubscriptionModalVisible(true);
                }
              }
            }

            if (profile.logoUrl) {
              preCacheLogo(profile.logoUrl);
            }
            // Real-time synchronization of tax settings on screen focus
            const syncTasks = [];
            if (profile.taxEnabled !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem("tax_enabled", String(profile.taxEnabled)),
              );
            }
            if (profile.perProductTaxEnabled !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "per_product_tax",
                  String(profile.perProductTaxEnabled),
                ),
              );
            }
            if (profile.taxRate !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem("tax_rate", String(profile.taxRate)),
              );
            }
            if (profile.enableDeliveryCharges !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "delivery_charge_enabled",
                  String(profile.enableDeliveryCharges),
                ),
              );
            }
            if (profile.deliveryChargeAmount !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "delivery_charge_amount",
                  String(profile.deliveryChargeAmount),
                ),
              );
            }
            if (profile.deliveryGstEnabled !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "delivery_gst_enabled",
                  String(profile.deliveryGstEnabled),
                ),
              );
            }
            if (profile.deliveryGstRate !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "delivery_gst_rate",
                  String(profile.deliveryGstRate),
                ),
              );
            }
            if (profile.enablePackagingCharges !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "packaging_charge_enabled",
                  String(profile.enablePackagingCharges),
                ),
              );
            }
            if (profile.packagingChargeAmount !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "packaging_charge_amount",
                  String(profile.packagingChargeAmount),
                ),
              );
            }
            if (profile.packagingGstEnabled !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "packaging_gst_enabled",
                  String(profile.packagingGstEnabled),
                ),
              );
            }
            if (profile.packagingGstRate !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "packaging_gst_rate",
                  String(profile.packagingGstRate),
                ),
              );
            }
            if (profile.enableServiceCharges !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "service_charge_enabled",
                  String(profile.enableServiceCharges),
                ),
              );
            }
            if (profile.serviceChargeAmount !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "service_charge_rate",
                  String(profile.serviceChargeAmount),
                ),
              );
            }
            if (profile.serviceGstEnabled !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "service_gst_enabled",
                  String(profile.serviceGstEnabled),
                ),
              );
            }
            if (profile.serviceGstRate !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "service_gst_rate",
                  String(profile.serviceGstRate),
                ),
              );
            }
            if (profile.discountEnabled !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "discount_enabled",
                  String(profile.discountEnabled),
                ),
              );
            }
            if (profile.discountRate !== undefined) {
              syncTasks.push(
                AsyncStorage.setItem(
                  "discount_rate",
                  String(profile.discountRate),
                ),
              );
            }
            if (syncTasks.length > 0) {
              await Promise.all(syncTasks);
              await loadTaxSettings();
            }
          }
        } catch (e) { }

        try {
          const clearSignal = await AsyncStorage.getItem(
            "@clear_cart_after_bill",
          );
          if (clearSignal === "true") {
            setCart({});
            setActiveOrderId(null);
            setSelectedTable(null);
            setSelectedRoom(null);
            setActiveCustomer(null);
            await AsyncStorage.removeItem("@clear_cart_after_bill");
          }

          const activeCustStr = await AsyncStorage.getItem("@active_customer");
          if (activeCustStr) {
            const parsed = JSON.parse(activeCustStr);
            // Deep comparison to avoid unnecessary updates and infinite loops
            if (JSON.stringify(parsed) !== JSON.stringify(activeCustomer)) {
              setActiveCustomer(parsed);
            }
          } else if (activeCustomer !== null) {
            setActiveCustomer(null);
          }
        } catch (e) {
          console.log("Error checking clear/active signals:", e);
        }
      };
      resetFocus();
    }, [
      isLoaded,
      isSignedIn,
      user?.id,
      refreshSignal,
      activeCustomer,
      activeBusinessId,
      menus,
    ]),
  );

  useEffect(() => {
    if (currentView === "main" && menus.length > 0) {
      const checkResumeCart = async () => {
        try {
          const data = await AsyncStorage.getItem("@resume_cart");
          if (data) {
            const resumedItems = JSON.parse(data);
            const newCart: Record<string, CartItem> = {};

            resumedItems.forEach((item: any) => {
              let foundInMenu = null;

              for (const cat of menus) {
                const found = cat.items.find(
                  (mi) =>
                    String(mi.id) === String(item.id) ||
                    String(mi.id) === String(item.productId) ||
                    String(mi.name).trim().toLowerCase() === String(item.name).trim().toLowerCase() ||
                    (item.productId && String(mi.id) === String(item.productId._id)),
                );
                if (found) {
                  foundInMenu = found;
                  break;
                }
              }

              const itemPrice = Number(item.price || item.rate || 0);

              if (foundInMenu) {
                const isCustomPrice = itemPrice !== foundInMenu.price;

                if (newCart[foundInMenu.id]) {
                  newCart[foundInMenu.id].quantity += Number(item.quantity || 1);
                } else {
                  newCart[foundInMenu.id] = {
                    ...foundInMenu,
                    quantity: Number(item.quantity || 1),
                    ...(isCustomPrice ? { editedPrice: itemPrice } : {})
                  };
                }
              } else {
                // Fallback for items no longer in menu
                const cartKey = `fallback_${itemPrice}_${item.name.replace(/\s+/g, '')}`;
                if (newCart[cartKey]) {
                  newCart[cartKey].quantity += Number(item.quantity || 1);
                } else {
                  newCart[cartKey] = {
                    id: cartKey,
                    name: item.name,
                    price: itemPrice,
                    quantity: Number(item.quantity || 1),
                    editedPrice: itemPrice
                  };
                }
              }
            });

            setCart(newCart);
            await AsyncStorage.removeItem("@resume_cart");
            const id = await AsyncStorage.getItem("@resume_cart_id");
            const isEdit = await AsyncStorage.getItem("@is_bill_edit");
            const token = await AsyncStorage.getItem("@resume_token");

            if (token) {
              lastKotTokenRef.current = token;
              await AsyncStorage.removeItem("@resume_token");
            }

            if (id) {
              setActiveOrderId(id);
              await AsyncStorage.removeItem("@resume_cart_id");
            }

            const table = await AsyncStorage.getItem("@resume_table");
            if (table) {
              setSelectedTable(table);
              await AsyncStorage.removeItem("@resume_table");
            }

            if (isEdit === "true") {
              ToastAndroid.show(
                "📝 Bill Loaded for Editing",
                ToastAndroid.SHORT,
              );
              await AsyncStorage.removeItem("@is_bill_edit");
            } else {
              ToastAndroid.show(
                "Order Loaded from Hold List",
                ToastAndroid.SHORT,
              );
            }
          }
        } catch (error) {
          console.log("Error loading resumed cart (local):", error);
        }
      };
      checkResumeCart();
    }
  }, [currentView, menus]);

  useEffect(() => {
    if (refreshSignal > 0) {
      fetchMenus(true);
      fetchHeldCount();
    }
  }, [refreshSignal]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("add_to_cart_remote", (data) => {
      const itemsToAdd = Array.isArray(data) ? data : [data];
      if (itemsToAdd.length === 0) return;

      const firstItem = itemsToAdd[0];
      const catIndex = menus.findIndex((cat) =>
        (cat.items || []).some((i) => i.id === firstItem.id),
      );
      if (catIndex !== -1 && flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: catIndex,
            animated: true,
          });
        } catch (e) { }
      }

      itemsToAdd.forEach((item) => {
        if (item && item.id) {
          addToCart(item);
        }
      });
      ToastAndroid.show(
        `Selected ${itemsToAdd.length} Favorite Items Added!`,
        ToastAndroid.SHORT,
      );
    });
    return () => sub.remove();
  }, [menus]);

  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    menus.forEach((cat) => {
      cat.items.forEach((item) => {
        if (Array.isArray(item.zones)) {
          item.zones.forEach((z) => zones.add(z));
        }
      });
    });
    return ["Global", ...Array.from(zones)];
  }, [menus]);

  const filteredMenus = useMemo(() => {
    if (isLockedUser) return [];

    let zoneFilteredMenus = menus;
    if (multiZoneMenuEnabled && selectedZone !== "Global") {
      zoneFilteredMenus = menus.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.zones?.includes(selectedZone))
      })).filter(cat => cat.items.length > 0);
    }

    if (!searchQuery) return zoneFilteredMenus;
    const query = searchQuery.toLowerCase();
    return zoneFilteredMenus
      .map((cat) => {
        const categoryMatches = cat.name.toLowerCase().includes(query);
        const filteredItems = cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.price?.toString().includes(query),
        );
        if (categoryMatches || filteredItems.length > 0) {
          return { ...cat, items: categoryMatches ? cat.items : filteredItems };
        }
        return null;
      })
      .filter((cat) => cat !== null) as MenuCategory[];
  }, [searchQuery, menus, isLockedUser, multiZoneMenuEnabled, selectedZone]);


  const addToCart = useCallback(async (item: MenuItem) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
    }));
  }, []);

  const removeFromCart = useCallback(async (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (!existing) {
        const variantKey = Object.keys(prev).reverse().find(key => key.startsWith(`${item.id}_`));
        if (!variantKey) return prev;
        const variantExisting = prev[variantKey];
        if (variantExisting.quantity === 1) {
          const newCart = { ...prev };
          delete newCart[variantKey];
          return newCart;
        }
        return {
          ...prev,
          [variantKey]: { ...variantExisting, quantity: variantExisting.quantity - 1 },
        };
      }
      if (existing.quantity === 1) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }
      return {
        ...prev,
        [item.id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  }, []);

  const deleteFromCart = useCallback((item: MenuItem) => {
    SoundManager.playDelete();
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[item.id];
      return newCart;
    });
  }, []);

  const updateCartItemPrice = useCallback(
    (itemId: string, newPrice: number) => {
      setCart((prev) => {
        if (!prev[itemId]) return prev;
        return {
          ...prev,
          [itemId]: { ...prev[itemId], editedPrice: newPrice },
        };
      });
    },
    [],
  );

  const handleConfirmClear = () => {
    setCart({});
    setActiveOrderId(null);
    setSelectedTable(null);
    setSelectedRoom(null);
    setIsCartModalVisible(false);
    setIsClearModalVisible(false);
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 2000);
  };

  const { totalItems, totalAmount } = useMemo(() => {
    if (isLockedUser) return { totalItems: 0, totalAmount: 0 };
    const cartValues = Object.values(cart);
    return {
      totalItems: cartValues.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: cartValues.reduce(
        (sum, i) => sum + (i.editedPrice ?? i.price ?? 0) * i.quantity,
        0,
      ),
    };
  }, [cart, isLockedUser]);


  const confirmPauseOrder = async (
    itemsToHold?: any[],
    totalOverride?: number,
    cName?: string,
    cPhone?: string,
  ) => {
    const itemsSnapshot = itemsToHold || Object.values(cart);
    const totalValue = totalOverride || totalAmount;
    if (itemsSnapshot.length === 0) return;

    const originalActiveId = activeOrderId;
    const finalIdToUse = originalActiveId && /^[a-fA-F0-9]{24}$/.test(originalActiveId) ? originalActiveId : undefined;
    const capturedToken = lastKotTokenRef.current;

    try {
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;
      const bId = await StaffPermissionEngine.getActiveBusinessId(user?.id);

      if (finalToken && bId) {
        const method = finalIdToUse ? "PUT" : "POST";
        const url = finalIdToUse
          ? `https://billing.kravy.in/api/bill-manager/${finalIdToUse}`
          : "https://billing.kravy.in/api/bill-manager";

        let totalTaxable = 0;
        let totalGst = 0;
        const productsPayload = itemsSnapshot.map((i) => {
          const rate = i.editedPrice ?? i.price ?? 0;
          const qty = Number(i.quantity || 1);
          const lineTotal = rate * qty;

          let itemGstRate = 0;
          if (taxSettings.enabled) {
            itemGstRate = taxSettings.perProduct
              ? Number(i.gst || 0)
              : Number(taxSettings.rate || 0);
          }

          const taxable = lineTotal / (1 + itemGstRate / 100);
          const gstAmount = lineTotal - taxable;

          totalTaxable += taxable;
          totalGst += gstAmount;

          return {
            id: i.id || Math.random().toString(16).padEnd(24, "0"),
            itemId: i.id || Math.random().toString(16).padEnd(24, "0"),
            productId: i.id,
            name: i.name,
            qty: qty,
            quantity: qty,
            rate: rate,
            price: rate,
            gst: itemGstRate,
            gstRate: itemGstRate,
            taxableAmount: Number(taxable.toFixed(2)),
            gstPaid: Number(gstAmount.toFixed(2)),
            total: Number(lineTotal.toFixed(2)),
            taxStatus: "With Tax",
            hsnCode: i.hsnCode || "",
            businessId: bId,
          };
        });

        // 🚀 Await API call
        const res = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${finalToken}`,
          },
          body: JSON.stringify({
            items: productsPayload,
            subtotal: Number(totalTaxable.toFixed(2)),
            tax: Number(totalGst.toFixed(2)),
            total: Number(totalValue.toFixed(2)),
            paymentMode: "Cash",
            paymentStatus: "HELD",
            isHeld: true,
            clerkUserId: bId,
            userClerkId: bId,
            orderId: finalIdToUse,
            customerName: cName || "Walk-in Customer",
            customerPhone: cPhone || "",
            customerAddress: null,
            tableName: selectedTable || selectedRoom || "POS",
            roomName: selectedRoom || null,
            tokenNumber: capturedToken ? Number(capturedToken) : null,
            discountAmount: 0,
            discountCode: null,
            auditNote: "Held Order",
            source: "POS",
            businessId: bId,
          }),
        });

        if (res.ok) {
          setShowHoldSuccess(true);
          SoundManager.playHold();
          setIsHoldModalVisible(false);
          setCart({});
          setActiveOrderId(null);
          setSelectedTable(null);
          setSelectedRoom(null);

          await fetchHeldCount();
          triggerRefresh();

          setTimeout(() => setShowHoldSuccess(false), 800);
        } else {
          const errText = await res.text();
          console.error("Hold POST Error:", errText);
          ToastAndroid.show("Failed to hold bill on server", ToastAndroid.SHORT);
        }
      }
    } catch (e) {
      console.error("Hold process error:", e);
      ToastAndroid.show("Network error holding bill", ToastAndroid.SHORT);
    }
  };

  const getNextTokenNumber = async () => {
    // Deprecated in favor of resolveOrderToken for strict sequential matching
    try {
      const currentToken = await AsyncStorage.getItem("@token_counter");
      const nextToken = currentToken ? parseInt(currentToken) + 1 : 1;
      await AsyncStorage.setItem("@token_counter", String(nextToken));
      return String(nextToken);
    } catch (e) {
      return String(Math.floor(100 + Math.random() * 900));
    }
  };

  const handlePrintKot = async (itemsOverride?: any[]) => {
    if (isPrinting.current) return;
    isPrinting.current = true;
    try {
      const tableToPrint = selectedTable;
      const roomToPrint = selectedRoom;
      const itemsToPrint = Array.isArray(itemsOverride)
        ? itemsOverride
        : Object.values(cart);
      if (itemsToPrint.length === 0) return;

      // 🌐 INTERNET CHECK
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch("https://billing.kravy.in", { method: "HEAD", signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (e) {
        ToastAndroid.show("❌ No Internet Connection! KOT not printed.", ToastAndroid.LONG);
        isPrinting.current = false;
        return;
      }

      // 🚀 INSTANT UI FEEDBACK: Do NOT clear cart after KOT (as requested)
      if (!Array.isArray(itemsOverride)) {
        // setCart({});
        // setSelectedTable(null);
        // setSelectedRoom(null);
      }

      // 1. Background Work
      (async () => {
        try {
          const sessionStr = await AsyncStorage.getItem("staff_session");
          const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
          const finalToken = staffSession?.token || (await getToken());
          const bId =
            activeBusinessId ||
            staffSession?.businessId ||
            (await StaffPermissionEngine.getActiveBusinessId(user?.id));

          const kotIdToUse = activeOrderId || checkoutParams?.kotId || Date.now().toString();
          const tokenNo = await resolveOrderToken(kotIdToUse, lastKotTokenRef.current, bId!, finalToken!);
          lastKotTokenRef.current = tokenNo;

          // Print (Now non-blocking inside SimpleKOT)
          SimpleKOT(
            itemsToPrint,
            finalToken!,
            bId!,
            tableToPrint,
            tokenNo,
            roomToPrint,
            activeCustomer?.name,
          );

          // 2. Save KOT Page Locally
          const localOrder = {
            id: kotIdToUse,
            tokenNumber: tokenNo,
            billNumber: checkoutParams?.billNumber || Math.floor(1000 + Math.random() * 9000).toString(),
            tableName:
              tableToPrint && roomToPrint
                ? `T-${tableToPrint} | R-${roomToPrint}`
                : tableToPrint
                  ? `Table ${tableToPrint}`
                  : roomToPrint
                    ? `Room ${roomToPrint}`
                    : "Counter",
            items: itemsToPrint.map((i) => ({
              name: i.name,
              quantity: i.quantity,
            })),
            createdAt: new Date().toISOString(),
            status: "PENDING",
            customerName: checkoutParams?.customerName || undefined,
            customerPhone: checkoutParams?.customerPhone || undefined,
          };

          const existingData = await AsyncStorage.getItem("@local_kot_list");
          let kotList = existingData ? JSON.parse(existingData) : [];

          if (checkoutParams?.kotId) {
            const index = kotList.findIndex((k: any) => k.id === checkoutParams.kotId);
            if (index !== -1) {
              kotList[index] = { ...kotList[index], ...localOrder };
            } else {
              kotList.unshift(localOrder);
            }
          } else {
            kotList.unshift(localOrder);
          }

          await AsyncStorage.setItem(
            "@local_kot_list",
            JSON.stringify(kotList),
          );
        } catch (e) {
          console.log("Background KOT error:", e);
        }
      })();

      ToastAndroid.show("🍽️ KOT Sent!", ToastAndroid.SHORT);
    } catch (e) {
      console.error("KOT Process Error:", e);
    } finally {
      isPrinting.current = false;
    }
  };

  const handlePrintBill = async (
    itemsOverride?: any[],
    totalOverride?: number,
  ) => {
    if (isPrinting.current) return;

    const itemsToPrint = Array.isArray(itemsOverride)
      ? itemsOverride
      : Object.values(cart);
    if (itemsToPrint.length === 0) {
      ToastAndroid.show(t("no_items"), ToastAndroid.SHORT);
      return;
    }

    // 🌐 INTERNET CHECK
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("https://billing.kravy.in", { method: "HEAD", signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {
      ToastAndroid.show("❌ No Internet Connection! Bill not printed.", ToastAndroid.LONG);
      return;
    }

    // CHECK WALLET BEFORE CLEARING CART
    if (paymentMethod === "Wallet") {
      if (!activeCustomer) {
        ToastAndroid.show("Please select a customer for Wallet payment.", ToastAndroid.LONG);
        return;
      }
      try {
        const token = await getToken();
        const sessionStr = await AsyncStorage.getItem("staff_session");
        const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
        const finalToken = token || staffSession?.token;
        const totalAmountDue = totalOverride || totalAmount;

        const walletRes = await fetch("https://billing.kravy.in/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
          body: JSON.stringify({ action: "payment", partyId: activeCustomer.id || activeCustomer._id, amount: totalAmountDue, description: "Quick Bill Payment" })
        });
        if (!walletRes.ok) {
          ToastAndroid.show("Insufficient wallet balance!", ToastAndroid.LONG);
          return;
        }
      } catch (e) {
        ToastAndroid.show("Wallet verification failed", ToastAndroid.SHORT);
        return;
      }
    }

    isPrinting.current = true;
    SoundManager.playPrint();
    try {
      const tableToPrint = selectedTable;
      const roomToPrint = selectedRoom;
      // 🚀 INSTANT UI FEEDBACK
      setCart({});
      setActiveOrderId(null);
      setSelectedTable(null);
      setSelectedRoom(null);
      setActiveCustomer(null);
      AsyncStorage.removeItem("@active_customer");

      (async () => {
        try {
          const sessionStr = await AsyncStorage.getItem("staff_session");
          const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
          const finalToken = staffSession?.token || (await getToken());
          const bId =
            activeBusinessId ||
            staffSession?.businessId ||
            (await StaffPermissionEngine.getActiveBusinessId(user?.id));

          const activeProfile = profiles.find((p) => (p.id || p._id || p.businessId) === bId) || profiles[0];

          await SimpleBill(itemsToPrint, finalToken!, bId!, {
            paymentMode: paymentMethod,
            billId: activeOrderId || undefined,
            partyId: activeCustomer?.id || activeCustomer?._id,
            customerName: activeCustomer?.name,
            phone: activeCustomer?.phone,
            customerAddress: activeCustomer?.address,
            businessProfile: activeProfile,
            tableName: tableToPrint || undefined,
            roomName: roomToPrint || undefined,
            taxSettings: taxSettings,
            businessId: bId!,
            tokenNo: lastKotTokenRef.current || undefined,
          });
          fetchHeldCount();
        } catch (e) {
          console.log("Background Bill error:", e);
        }
      })();

      ToastAndroid.show("⚡ Bill Processed", ToastAndroid.SHORT);
    } finally {
      isPrinting.current = false;
    }
  };

  const handleSaveBill = async () => {
    // 🚀 INSTANT UI FEEDBACK
    const itemsToSave = Object.values(cart);
    if (itemsToSave.length === 0) return;

    // 🌐 INTERNET CHECK
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("https://billing.kravy.in", { method: "HEAD", signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {
      ToastAndroid.show("❌ No Internet Connection! Bill not saved.", ToastAndroid.LONG);
      return;
    }

    // CHECK WALLET BEFORE CLEARING CART
    if (paymentMethod === "Wallet") {
      if (!activeCustomer) {
        ToastAndroid.show("Please select a customer for Wallet payment.", ToastAndroid.LONG);
        return;
      }
      try {
        const token = await getToken();
        const sessionStr = await AsyncStorage.getItem("staff_session");
        const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
        const finalToken = token || staffSession?.token;

        const walletRes = await fetch("https://billing.kravy.in/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
          body: JSON.stringify({ action: "payment", partyId: activeCustomer.id || activeCustomer._id, amount: totalAmount, description: "Bill Saved" })
        });
        if (!walletRes.ok) {
          ToastAndroid.show("Insufficient wallet balance!", ToastAndroid.LONG);
          return;
        }
      } catch (e) {
        ToastAndroid.show("Wallet verification failed", ToastAndroid.SHORT);
        return;
      }
    }

    const tableToSave = selectedTable;
    const roomToSave = selectedRoom;

    setCart({});
    setActiveOrderId(null);
    setSelectedTable(null);
    setSelectedRoom(null);
    setActiveCustomer(null);
    AsyncStorage.removeItem("@active_customer");

    (async () => {
      try {
        const token = await getToken();
        const sessionStr = await AsyncStorage.getItem("staff_session");
        const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
        const finalToken = token || staffSession?.token;
        const bId =
          activeBusinessId ||
          (await StaffPermissionEngine.getActiveBusinessId(user?.id));

        await SaveBill(itemsToSave, finalToken!, bId!, {
          paymentMode: paymentMethod,
          billId: activeOrderId || undefined,
          partyId: activeCustomer?.id || activeCustomer?._id,
          customerName: activeCustomer?.name,
          customerPhone: activeCustomer?.phone,
          tableName: tableToSave || undefined,
          roomName: roomToSave || undefined,
          taxSettings: taxSettings,
          tokenNo: lastKotTokenRef.current || undefined,
        });
        fetchHeldCount();
      } catch (e) {
        console.log("Background Save error:", e);
      }
    })();

    ToastAndroid.show("💾 Bill Saved", ToastAndroid.SHORT);
  };

  const availableWidth = SCREEN_WIDTH - CATEGORY_COLUMN_WIDTH - s(32);
  const getNumColumns = () => {
    if (SCREEN_WIDTH >= 1024) return menuGridEnabled ? 4 : 5;
    if (SCREEN_WIDTH >= 768) return menuGridEnabled ? 3 : 4;
    return menuGridEnabled ? 2 : 3;
  };

  const itemWidth = isListView
    ? (SCREEN_WIDTH - CATEGORY_COLUMN_WIDTH - s(20))
    : availableWidth / getNumColumns();

  if (!isLoaded || loading || authBuffering)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME_PRIMARY} />
        <Text style={{ marginTop: 10 }}>{t("loading")}</Text>
      </View>
    );

  if (currentView === "addItem")
    return (
      <AddItemView
        onBack={() => setCurrentView("main")}
        categories={menus}
        onRefresh={() => fetchMenus(true)}
      />
    );
  if (currentView === "heldOrders")
    return (
      <HeldOrdersView
        onBack={() => {
          setCurrentView("main");
          fetchHeldCount();
        }}
        onRefreshCount={fetchHeldCount}
      />
    );
  if (currentView === "checkout")
    return (
      <CheckoutView
        onBack={(clearCart) => {
          if (clearCart) {
            setCart({});
            setActiveOrderId(null);
            setSelectedTable(null);
            setSelectedRoom(null);
          }
          if (checkoutParams?.kotId) {
            setCart({}); // Clear menu cart so items aren't selected
            setCheckoutParams(null);
            setCurrentView("main");
            if (checkoutParams.source === 'kot') {
              router.replace("/(tabs)/kot" as any);
            } else {
              router.replace("/(tabs)/orders" as any);
            }
          } else {
            setCurrentView("main");
          }
        }}
        cartParams={checkoutParams}
      />
    );

  return (
    <View style={styles.container}>
      <MenuHeader
        multiZoneMenuEnabled={multiZoneMenuEnabled}
        selectedZone={selectedZone}
        onZonePress={() => setIsZoneModalVisible(true)}
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
            ToastAndroid.show(t("no_items"), ToastAndroid.SHORT);
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
        heldCount={isLockedUser ? 0 : heldCount}
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
          onCategoryPress={(cat, index) =>
            flatListRef.current?.scrollToIndex({ index, animated: true })
          }
          cartVisible={totalItems > 0}
          isListView={isListView}
        />

        <FlatList
          ref={flatListRef}
          data={filteredMenus}
          extraData={cart}
          keyExtractor={(cat) => cat.id}
          contentContainerStyle={{ paddingBottom: 450, flexGrow: 1 }}
          initialNumToRender={4}
          maxToRenderPerBatch={2}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => triggerRefresh()}
              colors={[THEME_PRIMARY]}
            />
          }
          ListEmptyComponent={null}
          onScrollToIndexFailed={(info) => {
            const estimatedOffset = info.averageItemLength * info.index;
            flatListRef.current?.scrollToOffset({
              offset: estimatedOffset,
              animated: false,
            });
            setTimeout(
              () =>
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                }),
              100,
            );
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
                    quantity={Object.keys(cart).filter(key => key === item.id || key.startsWith(`${item.id}_`)).reduce((sum, key) => sum + cart[key].quantity, 0)}
                    onAdd={(item: any) => {
                      if (item.variants && item.variants.length > 0) {
                        setSelectedItemForSize(item);
                      } else {
                        addToCart(item);
                      }
                    }}
                    onRemove={removeFromCart}
                    isListView={isListView}
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
          onPreviewBill={() => setIsBillPreviewVisible(true)}
          onPrintKot={handlePrintKot}
          onPrintBill={handlePrintBill}
          onSaveBill={handleSaveBill}
          onProceed={() => {
            setCheckoutParams({
              ...(checkoutParams || {}),
              cart: JSON.stringify(cart),
              paymentMethod,
              selectedTable,
              selectedRoom,
              billId: activeOrderId, // Crucial for updating existing records
              tokenNo: lastKotTokenRef.current || undefined,
            });
            setCurrentView("checkout");
          }}
          kotEnabled={kotEnabled}
          tableBookingEnabled={tableBookingEnabled}
          roomBookingEnabled={roomBookingEnabled}
          onSelectTable={() => {
            setBookingMode("Table");
            setIsTableModalVisible(true);
          }}
          onSelectRoom={() => {
            setBookingMode("Room");
            setIsTableModalVisible(true);
          }}
          selectedTable={selectedTable}
          selectedRoom={selectedRoom}
          enableMultipleProfiles={enableMultipleProfiles}
          onSelectProfilePress={() => setIsProfileSelectionVisible(true)}
          activeProfileName={
            profiles.find((p) => (p.id || p._id || p.businessId) === activeBusinessId)?.businessName ||
            profiles.find((p) => (p.id || p._id || p.businessId) === activeBusinessId)?.companyName ||
            "Business"
          }
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
        onEditPrice={updateCartItemPrice}
        onClear={() => setIsClearModalVisible(true)}
      />

      <BillPreviewModal
        visible={isBillPreviewVisible}
        onClose={() => setIsBillPreviewVisible(false)}
        cartItems={Object.values(cart)}
        totalAmount={totalAmount}
      />

      <TableSelectionModal
        visible={isTableModalVisible}
        onClose={() => setIsTableModalVisible(false)}
        selectedTable={selectedTable}
        selectedRoom={selectedRoom}
        onSelect={(table, room) => {
          setSelectedTable(table);
          setSelectedRoom(room);
        }}
        tableBookingEnabled={tableBookingEnabled}
        roomBookingEnabled={roomBookingEnabled}
        activeTabOverride={bookingMode}
      />

      <ZoneSelectionModal
        visible={isZoneModalVisible}
        onClose={() => setIsZoneModalVisible(false)}
        availableZones={availableZones}
        selectedZone={selectedZone}
        onSelectZone={(zone) => {
          setSelectedZone(zone);
          AsyncStorage.setItem("default_selected_zone", zone).catch(console.error);
          setIsZoneModalVisible(false);
        }}
      />

      <ConfirmHoldModal
        visible={isHoldModalVisible}
        onClose={() => setIsHoldModalVisible(false)}
        onConfirm={(name, phone) =>
          confirmPauseOrder(undefined, undefined, name, phone)
        }
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

      <SubscriptionRequiredModal
        visible={isSubscriptionModalVisible}
        onClose={() => setIsSubscriptionModalVisible(false)}
        isBlocked={isAccountBlocked}
        clerkId={activeOwnerClerkId}
      />

      <ProfileSelectionModal
        visible={isProfileSelectionVisible}
        onClose={() => setIsProfileSelectionVisible(false)}
        profiles={profiles}
        activeProfileId={activeBusinessId}
        onSelectProfile={async (profile) => {
          const pId = profile.id || profile._id || profile.businessId;
          setActiveBusinessId(pId);
          await AsyncStorage.setItem("@active_business_id", pId);
          await AsyncStorage.setItem("@cached_business_profile", JSON.stringify(profile));
          setIsProfileSelectionVisible(false);
          triggerRefresh();
        }}
      />

      <Modal
        visible={!!selectedItemForSize}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedItemForSize(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setSelectedItemForSize(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '85%', backgroundColor: '#FFF', borderRadius: s(16), padding: s(20), elevation: 5, alignItems: 'center' }}
          >
            {selectedItemForSize?.imageUrl ? (
              <Image source={{ uri: selectedItemForSize.imageUrl }} style={{ width: s(100), height: s(100), borderRadius: s(12), marginBottom: vs(15) }} resizeMode="cover" />
            ) : (
              <View style={{ width: s(100), height: s(100), borderRadius: s(12), backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: vs(15) }}>
                <Text style={{ color: '#9CA3AF', fontSize: rf(12) }}>No Image</Text>
              </View>
            )}

            <Text style={{ fontSize: rf(18), fontWeight: 'bold', color: '#1F2937', marginBottom: vs(5), textAlign: 'center' }}>
              {selectedItemForSize?.name}
            </Text>

            <Text style={{ fontSize: rf(14), color: '#6B7280', marginBottom: vs(20) }}>
              {selectedItemForSize?.variants && selectedItemForSize.variants.length > 0 ? "Select Variant" : "Add to Cart"}
            </Text>

            <ScrollView style={{ width: '100%', maxHeight: vs(250) }} showsVerticalScrollIndicator={false}>
              {/* Base Item Option */}
              {(!selectedItemForSize?.variants || selectedItemForSize.variants.length === 0) && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: s(15), borderRadius: s(10), marginBottom: vs(10), borderWidth: 1, borderColor: '#E5E7EB' }}
                  onPress={() => {
                    if (selectedItemForSize) {
                      addToCart(selectedItemForSize);
                      setSelectedItemForSize(null);
                    }
                  }}
                >
                  <Text style={{ fontSize: rf(15), fontWeight: '600', color: '#374151' }}>Regular</Text>
                  <Text style={{ fontSize: rf(15), fontWeight: 'bold', color: THEME_PRIMARY }}>₹{selectedItemForSize?.price}</Text>
                </TouchableOpacity>
              )}

              {/* Variants */}
              {selectedItemForSize?.variants?.map((v, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: s(15), borderRadius: s(10), marginBottom: vs(10), borderWidth: 1, borderColor: '#E5E7EB' }}
                  onPress={() => {
                    if (selectedItemForSize) {
                      addToCart({
                        ...selectedItemForSize,
                        id: v.originalId || `${selectedItemForSize.id}_${v.name}`,
                        name: v.originalName || `${selectedItemForSize.name} (${v.name})`,
                        price: Number(v.price) || 0,
                        sellingPrice: Number(v.price) || 0
                      });
                      setSelectedItemForSize(null);
                    }
                  }}
                >
                  <Text style={{ fontSize: rf(15), fontWeight: '600', color: '#374151' }}>{v.name}</Text>
                  <Text style={{ fontSize: rf(15), fontWeight: 'bold', color: THEME_PRIMARY }}>₹{v.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: vs(2), backgroundColor: COLOR_BG_LIGHT },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: { flex: 1, flexDirection: "row" },
  categoryHeader: {
    fontSize: rf(11),
    fontWeight: "bold",
    backgroundColor: "#E0E7FF",
    padding: s(3),
    marginTop: vs(10),
    borderRadius: s(6),
    textAlign: "center",
    color: THEME_PRIMARY,
    marginHorizontal: s(10),
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: s(4),
    marginTop: vs(5),
  },
  loginPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: s(40),
    marginTop: vs(50),
  },
  loginTitle: {
    fontSize: rf(24),
    fontWeight: "800",
    color: "#1E293B",
    marginTop: vs(20),
  },
  loginSubtitle: {
    fontSize: rf(14),
    color: "#64748B",
    textAlign: "center",
    marginTop: vs(10),
    lineHeight: vs(20),
    paddingHorizontal: s(20),
  },
  loginBtn: {
    backgroundColor: THEME_PRIMARY,
    paddingVertical: vs(12),
    paddingHorizontal: s(30),
    borderRadius: s(12),
    marginTop: vs(25),
  },
  loginBtnText: { color: "#FFF", fontSize: rf(16), fontWeight: "bold" },
});

export default MainMenuView;
