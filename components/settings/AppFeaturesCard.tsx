import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from "../../context/LanguageContext";
import { rf, s, vs } from "../../utils/responsive";

const COLORS = {
    secondary: '#10B981',
    card: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
    white: '#FFFFFF',
    advanced: '#8B5CF6',
};

interface AppFeaturesCardProps {
    user: any;
    onPress: () => void;
    onOrderAcceptPress: () => void;
    onLoginRequired: () => void;
    onPrintingSetupPress?: () => void;
    onAdvancedControlsPress?: () => void;
}

export const AppFeaturesCard: React.FC<AppFeaturesCardProps> = ({
    user,
    onPress,
    onOrderAcceptPress,
    onLoginRequired,
    onPrintingSetupPress,
    onAdvancedControlsPress,
}) => {
    const { t } = useLanguage();

    const handlePress = (callback: () => void) => {
        if (user) {
            callback();
        } else {
            onLoginRequired();
        }
    };

    return (
        <View style={{ marginTop: vs(15) }}>
            <Text style={styles.sectionTitle}>{t('app_features')}</Text>
            <View style={{ marginTop: vs(10), gap: vs(12) }}>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => handlePress(onPress)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.secondary + "15" }]}>
                            <Ionicons name={"restaurant-outline" as any} size={rf(20)} color={COLORS.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoTitle, { marginBottom: 0 }]}>{t('kot_tables')}</Text>
                            <Text style={styles.infoText} numberOfLines={1}>{t('kitchen_orders')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={rf(18)} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* New Order Accept Button */}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => handlePress(onOrderAcceptPress)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.buttonIconBackground, { backgroundColor: "#4F46E5" + "15" }]}>
                            <Ionicons name={"checkmark-circle-outline" as any} size={rf(20)} color={"#4F46E5"} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoTitle, { marginBottom: 0 }]}>Order Accept</Text>
                            <Text style={styles.infoText} numberOfLines={1}>Manage incoming order settings</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={rf(18)} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Printing Setup Button */}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => handlePress(() => onPrintingSetupPress && onPrintingSetupPress())}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.buttonIconBackground, { backgroundColor: "#0EA5E9" + "15" }]}>
                            <Ionicons name={"print-outline" as any} size={rf(20)} color={"#0EA5E9"} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoTitle, { marginBottom: 0 }]}>Printing Setup</Text>
                            <Text style={styles.infoText} numberOfLines={1}>Customize receipt & KOT prints</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={rf(18)} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Advanced Controls Button */}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => handlePress(() => onAdvancedControlsPress && onAdvancedControlsPress())}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.buttonIconBackground, { backgroundColor: COLORS.advanced + "15" }]}>
                            <Ionicons name={"options-outline" as any} size={rf(20)} color={COLORS.advanced} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoTitle, { marginBottom: 0 }]}>Advanced Controls</Text>
                            <Text style={styles.infoText} numberOfLines={1}>Multi-Zone Menu & Special Controls</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={rf(18)} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        color: COLORS.text,
        opacity: 0.9,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: s(20),
        padding: s(16),
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.05)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIconBackground: {
        backgroundColor: '#fff',
        padding: s(8),
        borderRadius: s(12),
        marginRight: s(15),
    },
    infoTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: vs(3),
    },
    infoText: {
        fontSize: rf(12),
        color: COLORS.textLight,
        lineHeight: rf(18),
        fontWeight: '400',
    },
});
