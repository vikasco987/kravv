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

const DEFAULT_PRINT_SETTINGS = {
  showKOTToken: true,
  showKOTCustomer: true,
  showKOTBillNo: true,
  showKOTTime: true,
  showKOTInstructions: true,
  sepKOTInstructions: true,
};

/* ---------- MAIN KOT FUNCTION ---------- */
export async function SimpleKOT(
  cartItems: any[],
  token: string,
  userClerkId: string,
  tableNumber?: string | null,
  tokenNumber?: string,
  roomNumber?: string | null,
  customerName?: string | null,
) {
  try {
    const printer = await ensurePrinterConnected();
    if (!printer) {
      ToastAndroid.show("⚠️ Printer not connected!", ToastAndroid.SHORT);
      return false;
    }

    // Load KOT print settings from AsyncStorage or fallback
    let printSettings = { ...DEFAULT_PRINT_SETTINGS };
    try {
      const cachedSettings = await AsyncStorage.getItem("print_settings");
      if (cachedSettings) {
        printSettings = { ...printSettings, ...JSON.parse(cachedSettings) };
      }
    } catch (e) {
      console.log("Failed to load print settings in SimpleKOT:", e);
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

        if (printSettings.showKOTBillNo) {
          kotHeader1 += `KOT No: ${kotNo}\n`;
        }

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

        if (printSettings.showKOTCustomer && customerName) {
          kotHeader1 += `Cust: ${customerName}\n`;
        }

        // @ts-ignore
        await printer.write(encoder.encode(kotHeader1));

        if (printSettings.showKOTToken && tokenNumber) {
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x45, 0x01])); // BOLD ON
          // @ts-ignore
          await printer.write(encoder.encode(`TOKEN NO: #${tokenNumber}\n`));
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x45, 0x00])); // BOLD OFF
        }

        let kotHeader2 = "";
        if (printSettings.showKOTTime) {
          kotHeader2 += `Date: ${date.toLocaleString()}\n`;
        }
        kotHeader2 += line("-") + "\n";

        // @ts-ignore
        await printer.write(encoder.encode(kotHeader2));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x00])); // Align left

        // Print items one by one for buffer safety
        for (const item of cartItems) {
          let itemText = `${item.name}\n`;
          itemText += `Qty: ${item.quantity}\n`;

          if (printSettings.showKOTInstructions) {
            const instruction = item.instruction || item.instructions || item.notes || item.note;
            if (instruction && instruction.trim().length > 0) {
              if (printSettings.sepKOTInstructions) {
                itemText += `*------------------------------*\n`;
                itemText += `* NOTE: ${instruction.trim()}\n`;
                itemText += `*------------------------------*\n`;
              } else {
                itemText += `  Note: ${instruction.trim()}\n`;
              }
            }
          }

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
