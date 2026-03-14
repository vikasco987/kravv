import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from "@expo/vector-icons";
import { rf, s, vs } from "../../utils/responsive";

const THEME_PRIMARY = "#4F46E5";
const THEME_SECONDARY = "#10B981";
const THEME_DANGER = "#DC2626";
const KOT_BUTTON_COLOR = "#6366F1";

interface CartBarProps {
    totalItems: number;
    totalAmount: number;
    paymentMethod: "Cash" | "UPI" | "Card";
    setPaymentMethod: (method: "Cash" | "UPI" | "Card") => void;
    received: boolean;
    setReceived: (val: boolean) => void;
    onViewCart: () => void;
    onPrintKot: () => void;
    onPrintBill: () => void;
    onSaveBill: () => void;
    onProceed: () => void;
    kotEnabled: boolean;
    tableBookingEnabled: boolean;
    onSelectTable: () => void;
    selectedTable: string | null;
}

export const CartBar: React.FC<CartBarProps> = ({
    totalItems,
    totalAmount,
    paymentMethod,
    setPaymentMethod,
    received,
    setReceived,
    onViewCart,
    onPrintKot,
    onPrintBill,
    onSaveBill,
    onProceed,
    kotEnabled,
    tableBookingEnabled,
    onSelectTable,
    selectedTable,
}) => {
    return (
        <View style={styles.cartBar}>
            <View style={styles.summaryRow}>
                <TouchableOpacity
                    style={styles.viewItemsButton}
                    onPress={onViewCart}
                >
                    <Feather name="shopping-cart" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.viewItemsText}>Items ({totalItems})</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.receivedContainer} onPress={() => setReceived(!received)}>
                    <View style={[styles.receivedCheckbox, received && { backgroundColor: THEME_PRIMARY }]}>
                        {received && <Ionicons name="checkmark-sharp" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.receivedText}>Received</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.paymentSelector}>
                {["Cash", "UPI", "Card"].map((method) => (
                    <TouchableOpacity
                        key={method}
                        style={[styles.paymentOption, paymentMethod === method && styles.paymentSelected]}
                        onPress={() => setPaymentMethod(method as any)}
                    >
                        <Text style={[styles.paymentText, paymentMethod === method && { color: "#fff", fontWeight: "700" }]}>{method}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.actionButtonsRow}>
                {/* KOT */}
                {kotEnabled && (
                    <TouchableOpacity style={styles.printKotButton} onPress={onPrintKot}>
                        <Feather name="file-text" size={16} color="#fff" />
                        <Text style={styles.printBillText}>KOT</Text>
                    </TouchableOpacity>
                )}

                {/* TABLE BOOKING */}
                {tableBookingEnabled && (
                    <TouchableOpacity 
                        style={[styles.printKotButton, { backgroundColor: "#8B5CF6" }]} 
                        onPress={onSelectTable}
                    >
                        <Ionicons name="grid-outline" size={16} color="#fff" />
                        <Text style={styles.printBillText}>{selectedTable ? `T-${selectedTable}` : "TABLE"}</Text>
                    </TouchableOpacity>
                )}

                {/* BILL */}
                <TouchableOpacity style={styles.printBillButton} onPress={onPrintBill}>
                    <Feather name="printer" size={16} color="#fff" />
                    <Text style={styles.printBillText}>BILL</Text>
                </TouchableOpacity>

                {/* SAVE BILL */}
                <TouchableOpacity style={styles.saveBillButton} onPress={onSaveBill}>
                    <Feather name="save" size={16} color="#fff" />
                    <Text style={styles.printBillText}>SAVE</Text>
                </TouchableOpacity>

                {/* NEXT / TOTAL */}
                <TouchableOpacity style={styles.primaryButton} onPress={onProceed}>
                    <Text style={styles.primaryButtonText}>₹{totalAmount.toFixed(0)}</Text>
                    <Feather name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cartBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: s(10), // Reduced from s(15)
        paddingBottom: vs(12), // Reduced from vs(25)
        borderTopLeftRadius: s(25), // Adjusted
        borderTopRightRadius: s(25),
        borderTopWidth: 1.5,
        borderLeftWidth: 1.5,
        borderColor: "#4F46E533",
        zIndex: 999,
        elevation: 30,
        shadowColor: "#4F46E5",
        shadowOffset: { width: -5, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: vs(6) // Reduced from vs(10)
    },
    viewItemsButton: {
        backgroundColor: THEME_PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(12),
        paddingVertical: vs(6),
        borderRadius: s(20)
    },
    viewItemsText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: rf(13)
    },
    receivedContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    receivedCheckbox: {
        width: s(18),
        height: s(18),
        borderRadius: s(4),
        borderWidth: 1.5,
        borderColor: THEME_PRIMARY,
        marginRight: s(6),
        justifyContent: "center",
        alignItems: "center"
    },
    receivedText: {
        fontSize: rf(12),
        fontWeight: "500"
    },
    paymentSelector: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#F8FAFC",
        borderRadius: s(10),
        marginBottom: vs(8), // Reduced from vs(15)
        padding: s(4), // Reduced from s(6)
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    paymentOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: 'center',
        paddingVertical: vs(8), // Reduced from vs(12)
        marginHorizontal: s(2),
        borderRadius: s(8),
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    paymentSelected: {
        backgroundColor: THEME_PRIMARY
    },
    paymentText: {
        color: THEME_PRIMARY,
        fontWeight: "600",
        fontSize: rf(11)
    },
    actionButtonsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: s(6)
    },
    printKotButton: {
        flex: 0.8,
        backgroundColor: KOT_BUTTON_COLOR,
        borderRadius: s(10),
        paddingVertical: vs(10), // Reduced from vs(15)
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    saveBillButton: {
        flex: 0.8,
        backgroundColor: "#2563EB",
        borderRadius: s(10),
        paddingVertical: vs(10), // Reduced from vs(15)
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    printBillButton: {
        flex: 0.8,
        backgroundColor: THEME_DANGER,
        borderRadius: s(10),
        paddingVertical: vs(10), // Reduced from vs(15)
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    primaryButton: {
        flex: 1.2,
        backgroundColor: THEME_SECONDARY,
        borderRadius: s(10),
        paddingVertical: vs(12), // Reduced from vs(16)
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        elevation: 4
    },
    printBillText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: rf(11), // Slightly smaller
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: rf(14) // Slightly smaller
    },
});
