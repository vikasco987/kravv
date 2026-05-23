import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import {
  getRecentCompanyProfile,
  updateBusinessSettings,
} from "../../services/companyService";
import { rf, s, vs } from "../../utils/responsive";
import { StaffPermissionEngine } from "../staff creat/StaffPermissionEngine";

// Import Settings Components
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { AdvancedControlsModal } from "./AdvancedControlsModal";
import { AdvancedDiscountCard } from "./AdvancedDiscountCard";
import { AdvancedDiscountModal } from "./AdvancedDiscountModal";
import { AppFeaturesCard } from "./AppFeaturesCard";
import { BusinessManagementCard } from "./BusinessManagementCard";
import CompanyInfoView from "./CompanyInfoView";
import { KOTTablesModal } from "./KOTTablesModal";
import { LanguageCard } from "./LanguageCard";
import { LanguageSelectionModal } from "./LanguageSelectionModal";
import { OrderAcceptModal } from "./OrderAcceptModal";
import PrintingPreviewScreen from "./PrintingPreviewScreen";
import PrintingSetupScreen from "./PrintingSetupScreen";
import SettingsHeader from "./SettingsHeader";
import { StaffCard } from "./StaffCard";
import { StaffModal } from "./StaffModal";
import { SuccessFeedback } from "./SuccessFeedback";
import { TaxDiscountsCard } from "./TaxDiscountsCard";
import { TaxDiscountsModal } from "./TaxDiscountsModal";
import { WhySignInBox } from "./WhySignInBox";

const LOCAL_COLORS = {
  background: "#F9FAFB",
  primary: "#4F46E5",
  text: "#111827",
  textLight: "#6B7280",
};

const MainSettingsView = ({
  isLockedUser = false,
}: {
  isLockedUser?: boolean;
}) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const {
    language: currentLanguage,
    setLanguage: setCurrentLanguage,
    t,
  } = useLanguage();
  const { getToken } = useAuth();

  const [loginModalVisible, setLoginModalVisible] = React.useState(false);
  const [taxEnabled, setTaxEnabled] = React.useState(false);
  const [perProductTax, setPerProductTax] = React.useState(false);
  const [taxRate, setTaxRate] = React.useState("0");
  const [discountEnabled, setDiscountEnabled] = React.useState(false);
  const [discountRate, setDiscountRate] = React.useState("0.00");
  const [serviceChargeEnabled, setServiceChargeEnabled] = React.useState(false);
  const [serviceChargeRate, setServiceChargeRate] = React.useState("0.00");
  const [serviceGstEnabled, setServiceGstEnabled] = React.useState(false);
  const [serviceGstRate, setServiceGstRate] = React.useState("0.00");
  const [deliveryChargeEnabled, setDeliveryChargeEnabled] =
    React.useState(false);
  const [deliveryChargeAmount, setDeliveryChargeAmount] =
    React.useState("0.00");
  const [deliveryGstEnabled, setDeliveryGstEnabled] = React.useState(false);
  const [deliveryGstRate, setDeliveryGstRate] = React.useState("0.00");
  const [packagingChargeEnabled, setPackagingChargeEnabled] =
    React.useState(false);
  const [packagingChargeAmount, setPackagingChargeAmount] =
    React.useState("0.00");
  const [packagingGstEnabled, setPackagingGstEnabled] = React.useState(false);
  const [packagingGstRate, setPackagingGstRate] = React.useState("0.00");
  const [taxModalVisible, setTaxModalVisible] = React.useState(false);
  const [advancedControlsModalVisible, setAdvancedControlsModalVisible] = React.useState(false);
  const [multiZoneMenuEnabled, setMultiZoneMenuEnabled] = React.useState(false);
  const [advancedDiscountModalVisible, setAdvancedDiscountModalVisible] =
    React.useState(false);
  const [kotModalVisible, setKotModalVisible] = React.useState(false);
  const [successModalVisible, setSuccessModalVisible] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [kotEnabled, setKotEnabled] = React.useState(false);
  const [tableBookingEnabled, setTableBookingEnabled] = React.useState(false);
  const [roomBookingEnabled, setRoomBookingEnabled] = React.useState(false);
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [staffModalVisible, setStaffModalVisible] = React.useState(false);
  const [orderAcceptModalVisible, setOrderAcceptModalVisible] =
    React.useState(false);
  const [orderAutoAccept, setOrderAutoAccept] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<
    "main" | "profile" | "printing" | "printingPreview"
  >("main");
  const [printSettingsForPreview, setPrintSettingsForPreview] =
    React.useState<any>(null);
  const [businessProfileForPreview, setBusinessProfileForPreview] =
    React.useState<any>(null);
  const [isStaffSignedIn, setIsStaffSignedIn] = React.useState(false);
  const [hasSettingsAccess, setHasSettingsAccess] = React.useState(true);

  // Automatically reset currentView to "main" when settings screen loses focus (e.g. user signs out or navigates away)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setCurrentView("main");
      };
    }, [])
  );

  React.useEffect(() => {
    loadSettings();
    const checkStaff = async () => {
      if (isLockedUser) {
        setHasSettingsAccess(true);
        setIsStaffSignedIn(false);
        return;
      }
      if (user) {
        setHasSettingsAccess(true);
        setIsStaffSignedIn(false);
        return;
      }
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const isStaff = !!sessionStr;
      setIsStaffSignedIn(isStaff);
      if (isStaff) {
        const access = await StaffPermissionEngine.hasCategoryAccess(
          "Settings",
          false,
        );
        setHasSettingsAccess(access);
      } else {
        setHasSettingsAccess(true); // Guest
      }
    };
    checkStaff();
  }, [isLockedUser, user]);

  React.useEffect(() => {
    loadSettings();
  }, [isLockedUser]);

  React.useEffect(() => {
    if (taxModalVisible) {
      loadSettings();
    }
  }, [taxModalVisible]);

  const loadSettings = async () => {
    if (isLockedUser) {
      setTaxEnabled(false);
      setPerProductTax(false);
      setTaxRate("0");
      setDiscountEnabled(false);
      setDiscountRate("0.00");
      setServiceChargeEnabled(false);
      setServiceChargeRate("0.00");
      setKotEnabled(false);
      setTableBookingEnabled(false);
      setRoomBookingEnabled(false);
      setOrderAutoAccept(false);
      return;
    }
    try {
      // 1. First load from Backend to keep in sync
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      if (finalToken) {
        const profile: any = await getRecentCompanyProfile(finalToken);
        if (profile) {
          // Map backend fields back to app keys and save to AsyncStorage
          const syncTasks = [];
          if (profile.taxEnabled !== undefined) {
            setTaxEnabled(profile.taxEnabled);
            syncTasks.push(
              AsyncStorage.setItem("tax_enabled", String(profile.taxEnabled)),
            );
          }
          if (profile.perProductTaxEnabled !== undefined) {
            setPerProductTax(profile.perProductTaxEnabled);
            syncTasks.push(
              AsyncStorage.setItem(
                "per_product_tax",
                String(profile.perProductTaxEnabled),
              ),
            );
          }
          if (profile.taxRate !== undefined) {
            setTaxRate(String(profile.taxRate));
            syncTasks.push(
              AsyncStorage.setItem("tax_rate", String(profile.taxRate)),
            );
          }
          if (profile.enableDeliveryCharges !== undefined) {
            setDeliveryChargeEnabled(profile.enableDeliveryCharges);
            syncTasks.push(
              AsyncStorage.setItem(
                "delivery_charge_enabled",
                String(profile.enableDeliveryCharges),
              ),
            );
          }
          if (profile.deliveryChargeAmount !== undefined) {
            setDeliveryChargeAmount(String(profile.deliveryChargeAmount));
            syncTasks.push(
              AsyncStorage.setItem(
                "delivery_charge_amount",
                String(profile.deliveryChargeAmount),
              ),
            );
          }
          if (profile.deliveryGstEnabled !== undefined) {
            setDeliveryGstEnabled(profile.deliveryGstEnabled);
            syncTasks.push(
              AsyncStorage.setItem(
                "delivery_gst_enabled",
                String(profile.deliveryGstEnabled),
              ),
            );
          }
          if (profile.deliveryGstRate !== undefined) {
            setDeliveryGstRate(String(profile.deliveryGstRate));
            syncTasks.push(
              AsyncStorage.setItem(
                "delivery_gst_rate",
                String(profile.deliveryGstRate),
              ),
            );
          }
          if (profile.enablePackagingCharges !== undefined) {
            setPackagingChargeEnabled(profile.enablePackagingCharges);
            syncTasks.push(
              AsyncStorage.setItem(
                "packaging_charge_enabled",
                String(profile.enablePackagingCharges),
              ),
            );
          }
          if (profile.packagingChargeAmount !== undefined) {
            setPackagingChargeAmount(String(profile.packagingChargeAmount));
            syncTasks.push(
              AsyncStorage.setItem(
                "packaging_charge_amount",
                String(profile.packagingChargeAmount),
              ),
            );
          }
          if (profile.packagingGstEnabled !== undefined) {
            setPackagingGstEnabled(profile.packagingGstEnabled);
            syncTasks.push(
              AsyncStorage.setItem(
                "packaging_gst_enabled",
                String(profile.packagingGstEnabled),
              ),
            );
          }
          if (profile.packagingGstRate !== undefined) {
            setPackagingGstRate(String(profile.packagingGstRate));
            syncTasks.push(
              AsyncStorage.setItem(
                "packaging_gst_rate",
                String(profile.packagingGstRate),
              ),
            );
          }
          if (profile.enableServiceCharges !== undefined) {
            setServiceChargeEnabled(profile.enableServiceCharges);
            syncTasks.push(
              AsyncStorage.setItem(
                "service_charge_enabled",
                String(profile.enableServiceCharges),
              ),
            );
          }
          if (profile.serviceChargeAmount !== undefined) {
            setServiceChargeRate(String(profile.serviceChargeAmount));
            syncTasks.push(
              AsyncStorage.setItem(
                "service_charge_rate",
                String(profile.serviceChargeAmount),
              ),
            );
          }
          if (profile.serviceGstEnabled !== undefined) {
            setServiceGstEnabled(profile.serviceGstEnabled);
            syncTasks.push(
              AsyncStorage.setItem(
                "service_gst_enabled",
                String(profile.serviceGstEnabled),
              ),
            );
          }
          if (profile.serviceGstRate !== undefined) {
            setServiceGstRate(String(profile.serviceGstRate));
            syncTasks.push(
              AsyncStorage.setItem(
                "service_gst_rate",
                String(profile.serviceGstRate),
              ),
            );
          }
          if (profile.discountEnabled !== undefined) {
            setDiscountEnabled(profile.discountEnabled);
            syncTasks.push(
              AsyncStorage.setItem(
                "discount_enabled",
                String(profile.discountEnabled),
              ),
            );
          }
          if (profile.discountRate !== undefined) {
            setDiscountRate(String(profile.discountRate));
            syncTasks.push(
              AsyncStorage.setItem(
                "discount_rate",
                String(profile.discountRate),
              ),
            );
          }
          if (profile.multiZoneMenuEnabled !== undefined) {
            setMultiZoneMenuEnabled(profile.multiZoneMenuEnabled);
            syncTasks.push(
              AsyncStorage.setItem(
                "multi_zone_menu_enabled",
                String(profile.multiZoneMenuEnabled),
              ),
            );
          }
          await Promise.all(syncTasks);
        }
      }

      // 2. Load the rest from AsyncStorage
      const settings = await AsyncStorage.multiGet([
        "tax_enabled",
        "per_product_tax",
        "tax_rate",
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
        "kot_enabled",
        "table_booking_enabled",
        "room_booking_enabled",
        "app_language",
        "order_auto_accept",
        "multi_zone_menu_enabled",
      ]);
      settings.forEach(([key, value]) => {
        if (value !== null) {
          switch (key) {
            case "tax_enabled":
              setTaxEnabled(value === "true");
              break;
            case "per_product_tax":
              setPerProductTax(value === "true");
              break;
            case "tax_rate":
              setTaxRate(value);
              break;
            case "discount_enabled":
              setDiscountEnabled(value === "true");
              break;
            case "discount_rate":
              setDiscountRate(value);
              break;
            case "service_charge_enabled":
              setServiceChargeEnabled(value === "true");
              break;
            case "service_charge_rate":
              setServiceChargeRate(value);
              break;
            case "service_gst_enabled":
              setServiceGstEnabled(value === "true");
              break;
            case "service_gst_rate":
              setServiceGstRate(value);
              break;
            case "delivery_charge_enabled":
              setDeliveryChargeEnabled(value === "true");
              break;
            case "delivery_charge_amount":
              setDeliveryChargeAmount(value);
              break;
            case "delivery_gst_enabled":
              setDeliveryGstEnabled(value === "true");
              break;
            case "delivery_gst_rate":
              setDeliveryGstRate(value);
              break;
            case "packaging_charge_enabled":
              setPackagingChargeEnabled(value === "true");
              break;
            case "packaging_charge_amount":
              setPackagingChargeAmount(value);
              break;
            case "packaging_gst_enabled":
              setPackagingGstEnabled(value === "true");
              break;
            case "packaging_gst_rate":
              setPackagingGstRate(value);
              break;
            case "kot_enabled":
              setKotEnabled(value === "true");
              break;
            case "table_booking_enabled":
              setTableBookingEnabled(value === "true");
              break;
            case "room_booking_enabled":
              setRoomBookingEnabled(value === "true");
              break;
            case "order_auto_accept":
              setOrderAutoAccept(value === "true");
              break;
            case "multi_zone_menu_enabled":
              setMultiZoneMenuEnabled(value === "true");
              break;
          }
        }
      });
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const saveSetting = async (
    key: string,
    value: string | boolean,
    label: string,
  ) => {
    try {
      // 1. Update Local Storage
      await AsyncStorage.setItem(key, String(value));

      // 2. Sync to Backend if it's a shared setting
      const token = await getToken();
      const sessionStr = await AsyncStorage.getItem("staff_session");
      const staffSession = sessionStr ? JSON.parse(sessionStr) : null;
      const finalToken = token || staffSession?.token;

      if (finalToken) {
        const payload: any = {};
        let shouldSync = true;

        switch (key) {
          case "tax_enabled":
            payload.taxEnabled = value;
            break;
          case "per_product_tax":
            payload.perProductTaxEnabled = value;
            break;
          case "tax_rate":
            payload.taxRate = parseFloat(String(value));
            break;
          case "delivery_charge_enabled":
            payload.enableDeliveryCharges = value;
            break;
          case "delivery_charge_amount":
            payload.deliveryChargeAmount = parseFloat(String(value));
            break;
          case "delivery_gst_enabled":
            payload.deliveryGstEnabled = value;
            break;
          case "delivery_gst_rate":
            payload.deliveryGstRate = parseFloat(String(value));
            break;
          case "packaging_charge_enabled":
            payload.enablePackagingCharges = value;
            break;
          case "packaging_charge_amount":
            payload.packagingChargeAmount = parseFloat(String(value));
            break;
          case "packaging_gst_enabled":
            payload.packagingGstEnabled = value;
            break;
          case "packaging_gst_rate":
            payload.packagingGstRate = parseFloat(String(value));
            break;
          case "service_charge_enabled":
            payload.enableServiceCharges = value;
            break;
          case "service_charge_rate":
            payload.serviceChargeAmount = parseFloat(String(value));
            break;
          case "service_gst_enabled":
            payload.serviceGstEnabled = value;
            break;
          case "service_gst_rate":
            payload.serviceGstRate = parseFloat(String(value));
            break;
          case "discount_enabled":
            payload.discountEnabled = value;
            break;
          case "discount_rate":
            payload.discountRate = parseFloat(String(value));
            break;
          case "multi_zone_menu_enabled":
            payload.multiZoneMenuEnabled = value;
            break;
          default:
            shouldSync = false;
        }

        if (shouldSync) {
          await updateBusinessSettings(finalToken, payload);
        }
      }

      const message =
        typeof value === "boolean" && !value
          ? `${label} disabled successfully!`
          : `${label} updated successfully!`;
      setSuccessMessage(message);
      setSuccessModalVisible(true);
      setTimeout(() => setSuccessModalVisible(false), 2000);
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  };

  if (!isLoaded)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LOCAL_COLORS.primary} />
      </View>
    );

  if (currentView === "profile")
    return <CompanyInfoView onBack={() => setCurrentView("main")} />;

  if (currentView === "printing")
    return (
      <PrintingSetupScreen
        onBack={() => setCurrentView("main")}
        onPreview={(settings, profile) => {
          setPrintSettingsForPreview(settings);
          setBusinessProfileForPreview(profile);
          setCurrentView("printingPreview");
        }}
      />
    );

  if (currentView === "printingPreview")
    return (
      <PrintingPreviewScreen
        onBack={() => setCurrentView("printing")}
        printSettings={printSettingsForPreview}
        businessProfile={businessProfileForPreview}
      />
    );

  const effectiveUser = isLockedUser
    ? null
    : user ||
    (isStaffSignedIn ? { id: "staff_user", firstName: "Staff" } : null);

  if (!hasSettingsAccess && !user) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: LOCAL_COLORS.background,
          padding: s(30),
        }}
      >
        <View
          style={{
            backgroundColor: "#EEF2FF",
            padding: s(20),
            borderRadius: s(100),
            marginBottom: vs(20),
          }}
        >
          <Ionicons
            name="lock-closed"
            size={s(40)}
            color={LOCAL_COLORS.primary}
          />
        </View>
        <Text
          style={{
            fontSize: rf(20),
            fontWeight: "800",
            color: LOCAL_COLORS.text,
            textAlign: "center",
          }}
        >
          Settings Restricted
        </Text>
        <Text
          style={{
            fontSize: rf(14),
            color: LOCAL_COLORS.textLight,
            textAlign: "center",
            marginTop: vs(10),
            lineHeight: vs(20),
          }}
        >
          You don&apos;t have permission to modify app settings. Please contact
          your manager.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <SettingsHeader title={t("settings")} subtitle={t("manage_account")} />

      {!user && !isStaffSignedIn && <WhySignInBox />}

      <BusinessManagementCard
        user={effectiveUser}
        onPress={() => setCurrentView("profile")}
        onLoginRequired={() => setLoginModalVisible(true)}
      />

      <TaxDiscountsCard
        user={effectiveUser}
        onPress={() => setTaxModalVisible(true)}
        onLoginRequired={() => setLoginModalVisible(true)}
      />

      <AppFeaturesCard
        user={effectiveUser}
        onPress={() => setKotModalVisible(true)}
        onOrderAcceptPress={() => setOrderAcceptModalVisible(true)}
        onPrintingSetupPress={() => setCurrentView("printing")}
        onAdvancedControlsPress={() => setAdvancedControlsModalVisible(true)}
        onLoginRequired={() => setLoginModalVisible(true)}
      />

      <StaffCard
        user={effectiveUser}
        onPress={() => setStaffModalVisible(true)}
        onLoginRequired={() => setLoginModalVisible(true)}
      />

      <AdvancedDiscountCard
        user={effectiveUser}
        onPress={() => setAdvancedDiscountModalVisible(true)}
        onLoginRequired={() => setLoginModalVisible(true)}
      />

      <LanguageCard
        user={effectiveUser}
        onLanguagePress={() => setLanguageModalVisible(true)}
        onLoginRequired={() => setLoginModalVisible(true)}
      />

      <View style={styles.footer}>
        <Text style={styles.versionText}>Kravy - Smart Billing App</Text>
        <Text style={styles.versionNumber}>Version 1.0.0 (Build 102)</Text>
      </View>

      {/* Modals */}
      <TaxDiscountsModal
        visible={taxModalVisible}
        onClose={() => setTaxModalVisible(false)}
        taxEnabled={taxEnabled}
        setTaxEnabled={setTaxEnabled}
        perProductTax={perProductTax}
        setPerProductTax={setPerProductTax}
        taxRate={taxRate}
        setTaxRate={setTaxRate}
        discountEnabled={discountEnabled}
        setDiscountEnabled={setDiscountEnabled}
        discountRate={discountRate}
        setDiscountRate={setDiscountRate}
        serviceChargeEnabled={serviceChargeEnabled}
        setServiceChargeEnabled={setServiceChargeEnabled}
        serviceChargeRate={serviceChargeRate}
        setServiceChargeRate={setServiceChargeRate}
        serviceGstEnabled={serviceGstEnabled}
        setServiceGstEnabled={setServiceGstEnabled}
        serviceGstRate={serviceGstRate}
        setServiceGstRate={setServiceGstRate}
        deliveryChargeEnabled={deliveryChargeEnabled}
        setDeliveryChargeEnabled={setDeliveryChargeEnabled}
        deliveryChargeAmount={deliveryChargeAmount}
        setDeliveryChargeAmount={setDeliveryChargeAmount}
        deliveryGstEnabled={deliveryGstEnabled}
        setDeliveryGstEnabled={setDeliveryGstEnabled}
        deliveryGstRate={deliveryGstRate}
        setDeliveryGstRate={setDeliveryGstRate}
        packagingChargeEnabled={packagingChargeEnabled}
        setPackagingChargeEnabled={setPackagingChargeEnabled}
        packagingChargeAmount={packagingChargeAmount}
        setPackagingChargeAmount={setPackagingChargeAmount}
        packagingGstEnabled={packagingGstEnabled}
        setPackagingGstEnabled={setPackagingGstEnabled}
        packagingGstRate={packagingGstRate}
        setPackagingGstRate={setPackagingGstRate}
        onSave={saveSetting}
      />
      <AdvancedDiscountModal
        visible={advancedDiscountModalVisible}
        onClose={() => setAdvancedDiscountModalVisible(false)}
      />
      <AdvancedControlsModal
        visible={advancedControlsModalVisible}
        onClose={() => setAdvancedControlsModalVisible(false)}
        multiZoneMenuEnabled={multiZoneMenuEnabled}
        setMultiZoneMenuEnabled={setMultiZoneMenuEnabled}
        onSave={saveSetting}
      />
      <KOTTablesModal
        visible={kotModalVisible}
        onClose={() => setKotModalVisible(false)}
        kotEnabled={kotEnabled}
        setKotEnabled={setKotEnabled}
        tableBookingEnabled={tableBookingEnabled}
        setTableBookingEnabled={setTableBookingEnabled}
        roomBookingEnabled={roomBookingEnabled}
        setRoomBookingEnabled={setRoomBookingEnabled}
        onSave={saveSetting}
      />
      <LoginRequiredModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSignIn={() => {
          setLoginModalVisible(false);
          router.push("/(auth)/sign-in" as any);
        }}
      />
      <SuccessFeedback visible={successModalVisible} message={successMessage} />
      <LanguageSelectionModal
        visible={languageModalVisible}
        currentLanguage={currentLanguage}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={(langId) => {
          setCurrentLanguage(langId as any);
          saveSetting("app_language", langId, "Language");
        }}
      />
      <StaffModal
        visible={staffModalVisible}
        onClose={() => setStaffModalVisible(false)}
      />
      <OrderAcceptModal
        visible={orderAcceptModalVisible}
        onClose={() => setOrderAcceptModalVisible(false)}
        orderAutoAccept={orderAutoAccept}
        setOrderAutoAccept={setOrderAutoAccept}
        onSave={saveSetting}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: s(20), paddingTop: vs(20) },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LOCAL_COLORS.background,
  },
  footer: { marginTop: vs(30), alignItems: "center", marginBottom: vs(30) },
  versionText: {
    fontSize: rf(14),
    color: LOCAL_COLORS.text,
    fontWeight: "700",
    opacity: 0.8,
  },
  versionNumber: {
    fontSize: rf(12),
    color: LOCAL_COLORS.textLight,
    marginTop: vs(4),
    fontWeight: "500",
  },
});

export default MainSettingsView;
