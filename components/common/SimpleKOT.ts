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
        // @ts-ignore
        const encoder = new TextEncoder();

        // --- Start Printing ---
        // @ts-ignore
        await printer.write(new Uint8Array([0x1B, 0x40])); // ESC @ (Initialize)
        // @ts-ignore
        await printer.write(new Uint8Array([0x1B, 0x61, 0x01])); // Align center

        let kotHeader = "";
        kotHeader += line("=") + "\n";
        kotHeader += centerText("KITCHEN ORDER TICKET") + "\n";
        kotHeader += line("-") + "\n";
        kotHeader += `KOT No: ${kotNo}\n`;
        if (tableNumber) kotHeader += `Table: ${tableNumber}\n`;
        kotHeader += `Date: ${date.toLocaleString()}\n`;
        kotHeader += line("-") + "\n";

        // @ts-ignore
        await printer.write(encoder.encode(kotHeader));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1B, 0x61, 0x00])); // Align left

        // Print items one by one for buffer safety
        for (const item of cartItems) {
            let itemText = `${item.name}\n`;
            itemText += `Qty: ${item.quantity}\n`;
            itemText += line("-") + "\n";
            // @ts-ignore
            await printer.write(encoder.encode(itemText));
        }

        // @ts-ignore
        await printer.write(new Uint8Array([0x1B, 0x61, 0x01])); // Align center
        // @ts-ignore
        await printer.write(encoder.encode(centerText("PREPARE FAST") + "\n\n"));
        
        // Feed 3 lines & cut
        // @ts-ignore
        await printer.write(new Uint8Array([0x1B, 0x64, 0x03]));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1D, 0x56, 0x42, 0x00])); 

        ToastAndroid.show("🍽️ KOT Printed!" + (tableNumber ? ` (Table ${tableNumber})` : ""), ToastAndroid.SHORT);
        return true;
    } catch (err) {
        console.log("KOT ERROR:", err);
        ToastAndroid.show("❌ Failed to print KOT!", ToastAndroid.SHORT);
        return false;
    }
}
