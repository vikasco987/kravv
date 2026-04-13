import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useClerk, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { rf, s, vs } from "../../utils/responsive";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";

// Import Settings Components
import { WhySignInBox } from "./WhySignInBox";
import { BusinessManagementCard } from "./BusinessManagementCard";
import { TaxDiscountsCard } from "./TaxDiscountsCard";
import { AppFeaturesCard } from "./AppFeaturesCard";
import { LanguageCard } from "./LanguageCard";
import { TaxDiscountsModal } from "./TaxDiscountsModal";
import { AdvancedDiscountModal } from "./AdvancedDiscountModal";
import { AdvancedDiscountCard } from "./AdvancedDiscountCard";
import { KOTTablesModal } from "./KOTTablesModal";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import { SuccessFeedback } from "./SuccessFeedback";
import { LanguageSelectionModal } from "./LanguageSelectionModal";
import { StaffCard } from "./StaffCard";
import { StaffModal } from "./StaffModal";
import SettingsHeader from "./SettingsHeader";
import CompanyInfoView from "./CompanyInfoView";
import { PermissionGuard } from "../common/PermissionGuard";


const LOCAL_COLORS = {
    background: '#F9FAFB',
    primary: '#4F46E5',
    text: '#111827',
    textLight: '#6B7280',
};

const MainSettingsView = () => {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const { language: currentLanguage, setLanguage: setCurrentLanguage, t } = useLanguage();
    
    const [loginModalVisible, setLoginModalVisible] = React.useState(false);
    const [taxEnabled, setTaxEnabled] = React.useState(false);
    const [perProductTax, setPerProductTax] = React.useState(false);
    const [taxRate, setTaxRate] = React.useState("0.00");
    const [discountEnabled, setDiscountEnabled] = React.useState(false);
    const [discountRate, setDiscountRate] = React.useState("0.00");
    const [serviceChargeEnabled, setServiceChargeEnabled] = React.useState(false);
    const [serviceChargeRate, setServiceChargeRate] = React.useState("0.00");
    const [taxModalVisible, setTaxModalVisible] = React.useState(false);
    const [advancedDiscountModalVisible, setAdvancedDiscountModalVisible] = React.useState(false);
    const [kotModalVisible, setKotModalVisible] = React.useState(false);
    const [successModalVisible, setSuccessModalVisible] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState("");
    const [kotEnabled, setKotEnabled] = React.useState(false);
    const [tableBookingEnabled, setTableBookingEnabled] = React.useState(false);
    const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
    const [staffModalVisible, setStaffModalVisible] = React.useState(false);
    const [currentView, setCurrentView] = React.useState<"main" | "profile">("main");
    const [isStaffSignedIn, setIsStaffSignedIn] = React.useState(false);


    React.useEffect(() => { 
        loadSettings(); 
        const checkStaff = async () => {
            const session = await AsyncStorage.getItem('staff_session');
            setIsStaffSignedIn(!!session);
        };
        checkStaff();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.multiGet([
                'tax_enabled', 'per_product_tax', 'tax_rate',
                'discount_enabled', 'discount_rate',
                'service_charge_enabled', 'service_charge_rate',
                'kot_enabled', 'table_booking_enabled',
                'app_language'
            ]);
            settings.forEach(([key, value]) => {
                if (value !== null) {
                    switch (key) {
                        case 'tax_enabled': setTaxEnabled(value === 'true'); break;
                        case 'per_product_tax': setPerProductTax(value === 'true'); break;
                        case 'tax_rate': setTaxRate(value); break;
                        case 'discount_enabled': setDiscountEnabled(value === 'true'); break;
                        case 'discount_rate': setDiscountRate(value); break;
                        case 'service_charge_enabled': setServiceChargeEnabled(value === 'true'); break;
                        case 'service_charge_rate': setServiceChargeRate(value); break;
                        case 'kot_enabled': setKotEnabled(value === 'true'); break;
                        case 'table_booking_enabled': setTableBookingEnabled(value === 'true'); break;
                    }
                }
            });
        } catch (e) { console.error("Failed to load settings:", e); }
    };

    const saveSetting = async (key: string, value: string | boolean, label: string) => {
        try {
            await AsyncStorage.setItem(key, String(value));
            const message = (typeof value === 'boolean' && !value) ? `${label} disabled successfully!` : `${label} updated successfully!`;
            setSuccessMessage(message);
            setSuccessModalVisible(true);
            setTimeout(() => setSuccessModalVisible(false), 2000);
        } catch (e) { console.error(`Failed to save ${key}:`, e); }
    };

    if (!isLoaded) return <View style={styles.center}><ActivityIndicator size="large" color={LOCAL_COLORS.primary} /></View>;

    if (currentView === "profile") return <CompanyInfoView onBack={() => setCurrentView("main")} />;

    const effectiveUser = user || (isStaffSignedIn ? { id: 'staff_user', firstName: 'Staff' } : null);

    return (

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SettingsHeader title={t('settings')} subtitle={t('manage_account')} />

            {!user && !isStaffSignedIn && <WhySignInBox />}
            
            <BusinessManagementCard user={effectiveUser} onPress={() => setCurrentView("profile")} onLoginRequired={() => setLoginModalVisible(true)} />
            
            <TaxDiscountsCard user={effectiveUser} onPress={() => setTaxModalVisible(true)} onLoginRequired={() => setLoginModalVisible(true)} />

            <AppFeaturesCard user={effectiveUser} onPress={() => setKotModalVisible(true)} onLoginRequired={() => setLoginModalVisible(true)} />
            
            <StaffCard user={effectiveUser} onPress={() => setStaffModalVisible(true)} onLoginRequired={() => setLoginModalVisible(true)} />
            
            <AdvancedDiscountCard user={effectiveUser} onPress={() => setAdvancedDiscountModalVisible(true)} onLoginRequired={() => setLoginModalVisible(true)} />
            
            <LanguageCard user={effectiveUser} onLanguagePress={() => setLanguageModalVisible(true)} onLoginRequired={() => setLoginModalVisible(true)} />

            <View style={styles.footer}>
                <Text style={styles.versionText}>Kravy - Smart Billing App</Text>
                <Text style={styles.versionNumber}>Version 1.0.0 (Build 102)</Text>
            </View>

            {/* Modals */}
            <TaxDiscountsModal visible={taxModalVisible} onClose={() => setTaxModalVisible(false)} taxEnabled={taxEnabled} setTaxEnabled={setTaxEnabled} perProductTax={perProductTax} setPerProductTax={setPerProductTax} taxRate={taxRate} setTaxRate={setTaxRate} discountEnabled={discountEnabled} setDiscountEnabled={setDiscountEnabled} discountRate={discountRate} setDiscountRate={setDiscountRate} serviceChargeEnabled={serviceChargeEnabled} setServiceChargeEnabled={setServiceChargeEnabled} serviceChargeRate={serviceChargeRate} setServiceChargeRate={setServiceChargeRate} onSave={saveSetting} />
            <AdvancedDiscountModal visible={advancedDiscountModalVisible} onClose={() => setAdvancedDiscountModalVisible(false)} />
            <KOTTablesModal visible={kotModalVisible} onClose={() => setKotModalVisible(false)} kotEnabled={kotEnabled} setKotEnabled={setKotEnabled} tableBookingEnabled={tableBookingEnabled} setTableBookingEnabled={setTableBookingEnabled} onSave={saveSetting} />
            <LoginRequiredModal visible={loginModalVisible} onClose={() => setLoginModalVisible(false)} onSignIn={() => { setLoginModalVisible(false); router.push("/(auth)/sign-in" as any); }} />
            <SuccessFeedback visible={successModalVisible} message={successMessage} />
            <LanguageSelectionModal visible={languageModalVisible} currentLanguage={currentLanguage} onClose={() => setLanguageModalVisible(false)} onSelectLanguage={(langId) => { setCurrentLanguage(langId as any); saveSetting('app_language', langId, 'Language'); }} />
            <StaffModal visible={staffModalVisible} onClose={() => setStaffModalVisible(false)} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { padding: s(20), paddingTop: vs(20) },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LOCAL_COLORS.background },
    footer: { marginTop: vs(30), alignItems: 'center', marginBottom: vs(30) },
    versionText: { fontSize: rf(14), color: LOCAL_COLORS.text, fontWeight: '700', opacity: 0.8 },
    versionNumber: { fontSize: rf(12), color: LOCAL_COLORS.textLight, marginTop: vs(4), fontWeight: '500' },
});

export default MainSettingsView;
