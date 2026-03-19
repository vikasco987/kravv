import { useClerk, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { rf, s, vs } from "../../utils/responsive";

// Import Settings Components
import { WhySignInBox } from "../../components/settings/WhySignInBox";
import { BusinessManagementCard } from "../../components/settings/BusinessManagementCard";
import { TaxDiscountsCard } from "../../components/settings/TaxDiscountsCard";
import { AppFeaturesCard } from "../../components/settings/AppFeaturesCard";
import { TaxDiscountsModal } from "../../components/settings/TaxDiscountsModal";
import { AdvancedDiscountModal } from "../../components/settings/AdvancedDiscountModal";
import { AdvancedDiscountCard } from "../../components/settings/AdvancedDiscountCard";
import { KOTTablesModal } from "../../components/settings/KOTTablesModal";
import { LoginRequiredModal } from "../../components/settings/LoginRequiredModal";
import { SuccessFeedback } from "../../components/settings/SuccessFeedback";

const LOCAL_COLORS = {
    background: '#F9FAFB',
    primary: '#4F46E5',
    text: '#111827',
    textLight: '#6B7280',
};

export default function SettingScreen() {
    const { signOut } = useClerk();
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [loginModalVisible, setLoginModalVisible] = React.useState(false);

    // Tax & Discounts States
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

    // App Features States
    const [kotEnabled, setKotEnabled] = React.useState(false);
    const [tableBookingEnabled, setTableBookingEnabled] = React.useState(false);

    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.multiGet([
                'tax_enabled', 'tax_per_product', 'tax_rate',
                'discount_enabled', 'discount_rate',
                'service_charge_enabled', 'service_charge_rate',
                'kot_enabled', 'table_booking_enabled'
            ]);

            settings.forEach(([key, value]) => {
                if (value !== null) {
                    switch (key) {
                        case 'tax_enabled': setTaxEnabled(value === 'true'); break;
                        case 'tax_per_product': setPerProductTax(value === 'true'); break;
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
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    };

    const saveSetting = async (key: string, value: string | boolean, label: string) => {
        try {
            await AsyncStorage.setItem(key, String(value));
            const message = (typeof value === 'boolean' && !value) 
                ? `${label} disabled successfully!` 
                : `${label} updated successfully!`;
            
            setSuccessMessage(message);
            setSuccessModalVisible(true);
            setTimeout(() => setSuccessModalVisible(false), 2000);
        } catch (e) {
            console.error(`Failed to save ${key}:`, e);
        }
    };

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={LOCAL_COLORS.primary} />
            </View>
        );
    }


    const handleSignIn = () => {
        setLoginModalVisible(false);
        router.push("/(auth)/sign-in" as any);
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Manage your account and preferences</Text>
                </View>


                {/* Why Sign In Info */}
                <WhySignInBox />

                {/* Business Section */}
                <BusinessManagementCard 
                    user={user}
                    onPress={() => router.push("/party/profile" as any)}
                    onLoginRequired={() => setLoginModalVisible(true)}
                />

                {/* Tax & Discounts Section */}
                <TaxDiscountsCard 
                    user={user}
                    onPress={() => setTaxModalVisible(true)} 
                    onLoginRequired={() => setLoginModalVisible(true)}
                />

                {/* App Features Section */}
                <AppFeaturesCard 
                    user={user}
                    onPress={() => setKotModalVisible(true)} 
                    onLoginRequired={() => setLoginModalVisible(true)}
                />

                {/* Advanced Discounts Section */}
                <AdvancedDiscountCard
                    user={user}
                    onPress={() => setAdvancedDiscountModalVisible(true)}
                    onLoginRequired={() => setLoginModalVisible(true)}
                />

                {/* Footer */}
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
                    onSave={saveSetting}
                />

                <AdvancedDiscountModal
                    visible={advancedDiscountModalVisible}
                    onClose={() => setAdvancedDiscountModalVisible(false)}
                />

                <KOTTablesModal 
                    visible={kotModalVisible}
                    onClose={() => setKotModalVisible(false)}
                    kotEnabled={kotEnabled}
                    setKotEnabled={setKotEnabled}
                    tableBookingEnabled={tableBookingEnabled}
                    setTableBookingEnabled={setTableBookingEnabled}
                    onSave={saveSetting}
                />

                <LoginRequiredModal 
                    visible={loginModalVisible}
                    onClose={() => setLoginModalVisible(false)}
                    onSignIn={handleSignIn}
                />

                <SuccessFeedback 
                    visible={successModalVisible}
                    message={successMessage}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: LOCAL_COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: LOCAL_COLORS.background,
    },
    scrollContent: {
        padding: s(20),
        paddingTop: vs(20),
    },
    header: {
        marginBottom: vs(15),
        paddingHorizontal: s(10),
    },
    title: {
        fontSize: rf(28),
        fontWeight: '800',
        color: LOCAL_COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: rf(14),
        color: LOCAL_COLORS.textLight,
        marginTop: vs(4),
        fontWeight: '500',
    },
    footer: {
        marginTop: vs(30),
        alignItems: 'center',
        marginBottom: vs(30),
    },
    versionText: {
        fontSize: rf(14),
        color: LOCAL_COLORS.text,
        fontWeight: '700',
        opacity: 0.8,
    },
    versionNumber: {
        fontSize: rf(12),
        color: LOCAL_COLORS.textLight,
        marginTop: vs(4),
        fontWeight: '500',
    },
});
