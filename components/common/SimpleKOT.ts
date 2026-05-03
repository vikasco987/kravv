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

let connectedPrinter: any = null;

/* ---------- Ensure Printer ---------- */
async function ensurePrinterConnected() {
  try {
    if (connectedPrinter) return connectedPrinter;

    const saved = await AsyncStorage.getItem("saved_printer");
    if (!saved) return null;

    connectedPrinter = await RNBluetoothClassic.connectToDevice(saved);
    return connectedPrinter;
  } catch (err) {
    connectedPrinter = null;
    return null;
  }
}

/* ---------- MAIN KOT FUNCTION ---------- */
export async function SimpleKOT(
  cartItems: any[],
  token: string,
  userClerkId: string,
  tableNumber?: string | null,
  tokenNumber?: string,
  roomNumber?: string | null,
) {
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

    // --- Start Printing (Backgrounded for speed) ---
    (async () => {
      try {
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x40])); // ESC @ (Initialize)
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x01])); // Align center

        let kotHeader1 = "";
        kotHeader1 += line("=") + "\n";
        kotHeader1 += "KITCHEN ORDER TICKET\n";
        kotHeader1 += line("-") + "\n";
        kotHeader1 += `KOT No: ${kotNo}\n`;
        if (tableNumber) {
          const cleanName = tableNumber
            .replace(/^Table\s+/i, "")
            .replace(/^T-/i, "");
          kotHeader1 += `Table T-${cleanName}\n`;
        }
        if (roomNumber) {
          const cleanName = roomNumber
            .replace(/^Room\s+/i, "")
            .replace(/^R-/i, "");
          kotHeader1 += `Room R-${cleanName}\n`;
        }

        // @ts-ignore
        await printer.write(encoder.encode(kotHeader1));

        if (tokenNumber) {
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x45, 0x01])); // BOLD ON
          // @ts-ignore
          await printer.write(encoder.encode(`TOKEN NO: #${tokenNumber}\n`));
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x45, 0x00])); // BOLD OFF
        }

        let kotHeader2 = "";
        kotHeader2 += `Date: ${date.toLocaleString()}\n`;
        kotHeader2 += line("-") + "\n";

        // @ts-ignore
        await printer.write(encoder.encode(kotHeader2));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x00])); // Align left

        // Print items one by one for buffer safety
        for (const item of cartItems) {
          let itemText = `${item.name}\n`;
          itemText += `Qty: ${item.quantity}\n`;
          itemText += line("-") + "\n";
          // @ts-ignore
          await printer.write(encoder.encode(itemText));
        }

        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x01])); // Align center
        // @ts-ignore
        await printer.write(encoder.encode("PREPARE FAST\n\n"));

        // Feed 3 lines & cut
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x64, 0x03]));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));
      } catch (e) {
        console.log("KOT Print background error:", e);
      }
    })();

    return true;
  } catch (err) {
    console.log("KOT ERROR:", err);
    ToastAndroid.show("❌ Failed to print KOT!", ToastAndroid.SHORT);
    return false;
  }
}
