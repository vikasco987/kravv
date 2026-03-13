// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import { ToastAndroid } from "react-native";
// @ts-ignore
import RNBluetoothClassic from "react-native-bluetooth-classic";

/* ---------- Helpers ---------- */
const centerText = (text: string, width = 32) => {
    if (text.length >= width) return text;
    const pad = Math.floor((width - text.length) / 2);
    return " ".repeat(pad) + text;
};

const line = (c = "-", width = 32) => c.repeat(width);

/* ---------- Ensure Printer ---------- */
async function ensurePrinterConnected() {
    try {
        const saved = await AsyncStorage.getItem("saved_printer");
        if (!saved) return null;

        const printer = await RNBluetoothClassic.connectToDevice(saved);
        if (!(await printer.isConnected())) return null;

        return printer;
    } catch (err) {
        console.log("KOT Printer Error:", err);
        return null;
    }
}

/* ---------- MAIN KOT FUNCTION ---------- */
export async function SimpleKOT(cartItems: any[], token: string, userClerkId: string, tableNumber?: string | null) {
    try {
        const printer = await ensurePrinterConnected();
        if (!printer) {
            ToastAndroid.show("⚠️ Printer not connected!", ToastAndroid.SHORT);
            return false;
        }

        const date = new Date();
        const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);

        let kotText = "";
        kotText += line("=");
        kotText += "\n" + centerText("KITCHEN ORDER TICKET") + "\n";
        kotText += line("-") + "\n";
        kotText += `KOT No: ${kotNo}\n`;
        if (tableNumber) {
            kotText += `Table: ${tableNumber}\n`;
        }
        kotText += `Date: ${date.toLocaleString()}\n`;
        kotText += line("-") + "\n";

        cartItems.forEach((i) => {
            kotText += `${i.name}\n`;
            kotText += `Qty: ${i.quantity}\n`;
            kotText += line("-") + "\n";
        });

        kotText += centerText("PREPARE FAST") + "\n\n\n";

        await printer.write(kotText);

        ToastAndroid.show("🍽️ KOT Printed!" + (tableNumber ? ` (Table ${tableNumber})` : ""), ToastAndroid.SHORT);
        return true;
    } catch (err) {
        console.log("KOT ERROR:", err);
        ToastAndroid.show("❌ Failed to print KOT!", ToastAndroid.SHORT);
        return false;
    }
}
