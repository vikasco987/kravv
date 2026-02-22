import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastAndroid } from "react-native";
import RNBluetoothClassic from "react-native-bluetooth-classic";

let connectedPrinter: any = null;

export async function ensurePrinterConnected() {
    try {
        if (connectedPrinter && (await connectedPrinter.isConnected()))
            return connectedPrinter;

        const savedAddress = await AsyncStorage.getItem("saved_printer");
        if (!savedAddress) {
            ToastAndroid.show("⚠️ No saved printer! Please set in Printer settings.", ToastAndroid.SHORT);
            return null;
        }

        const printer = await RNBluetoothClassic.connectToDevice(savedAddress, {
            connectorType: "rfcomm",
            secure: false,
        });

        if (!(await printer.isConnected())) return null;

        connectedPrinter = printer;
        return printer;
    } catch (err) {
        console.log("❌ Printer Connection Error:", err);
        return null;
    }
}

async function printInstant(billText: string) {
    const printer = await ensurePrinterConnected();
    if (!printer) return false;

    try {
        const safeText = billText.replace(/[^\x00-\x7F]/g, "");
        await printer.write(safeText + "\n\n");
        await printer.write(new Uint8Array([0x1b, 0x64, 0x03])); // feed
        return true;
    } catch (err) {
        console.log("❌ Print Error:", err);
        return false;
    }
}

export default async function SimpleBill(data: any) {
    // This function is called by menu.tsx with { customerName, phone, cart, billNo, date }
    const { customerName, phone, cart, billNo, date } = data;

    const companyName = "Magic Scale";
    const companyAddress = "New Delhi, India";

    const centerText = (text: string, width = 32) => {
        if (text.length >= width) return text;
        const pad = Math.floor((width - text.length) / 2);
        return " ".repeat(pad) + text;
    };

    const line = (char = "-", width = 32) => char.repeat(width);

    const itemsText = cart
        .map((item: any) =>
            `${item.name.slice(0, 12).padEnd(12)} ${String(item.quantity).padStart(3)} ${item.price?.toFixed(2).padStart(6)} ₹${((item.price || 0) * item.quantity).toFixed(2).padStart(7)}`
        )
        .join("\n");

    const subtotal = cart.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0);

    const billText = `
${line("=")}
${centerText(companyName.toUpperCase())}
${centerText(companyAddress)}
${line("-")}
Bill No: ${billNo || "N/A"}
Date: ${date || new Date().toLocaleString()}
Customer: ${customerName || "Walk-in"}
Ph: ${phone || "N/A"}
${line("-")}
Item         Qty  Price   Total
${line("-")}
${itemsText}
${line("-")}
TOTAL: ${`₹${subtotal.toFixed(2)}`.padStart(25)}
${line("-")}
${centerText("Thank You! Visit Again 🙏")}
`;

    ToastAndroid.show("🖨 Printing Bill...", ToastAndroid.SHORT);
    const success = await printInstant(billText);
    if (!success) {
        ToastAndroid.show("❌ Print Failed! Check connection.", ToastAndroid.SHORT);
    }
    return success;
}
