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

const getEscPosSize = (size: number) => {
  if (!size) return new Uint8Array([0x1b, 0x21, 0x00]);
  if (size <= 10) return new Uint8Array([0x1b, 0x21, 0x01]); // Font B (Small)
  if (size <= 14) return new Uint8Array([0x1b, 0x21, 0x00]); // Font A (Normal)
  if (size <= 18) return new Uint8Array([0x1b, 0x21, 0x10]); // Double Height
  return new Uint8Array([0x1b, 0x21, 0x30]); // Double Width & Height
};

const getEscPosWeight = (specific: string | undefined | null, global: string | undefined | null, fallback: string): Uint8Array => {
  const w = specific || global || fallback;
  if (!w) return new Uint8Array([0x1b, 0x45, 0x00]);
  const lw = w.toLowerCase();
  if (lw === "bold" || lw === "700" || lw === "800" || lw === "900") return new Uint8Array([0x1b, 0x45, 0x01]);
  return new Uint8Array([0x1b, 0x45, 0x00]);
};

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
  paperWidth: "58mm",
  printDensity: "balanced",
  paperBottomPadding: 80,
  spoolerDelay: 1500
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
    let printSettings: any = { ...DEFAULT_PRINT_SETTINGS };
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

    const lineWidth = printSettings.paperWidth === "80mm" ? 48 : 32;

    // --- Start Printing (Backgrounded for speed) ---
    (async () => {
      try {
        const globalWeight = printSettings.kotFontWeight;
        const kotTokenSizeCmd = getEscPosSize(Number(printSettings.kotTokenSize) || 16);
        const kotTokenWeightCmd = getEscPosWeight(printSettings.kotTokenWeight, globalWeight, "bold");

        const kotItemsSizeCmd = getEscPosSize(Number(printSettings.kotItemsFontSize) || 11);
        const kotItemsWeightCmd = getEscPosWeight(printSettings.kotItemsWeight, globalWeight, "normal");

        const kotQtySizeCmd = getEscPosSize(Number(printSettings.kotQtyFontSize) || 14);
        const kotQtyWeightCmd = getEscPosWeight(printSettings.kotQtyWeight, globalWeight, "bold");

        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x40])); // ESC @ (Initialize)

        // Apply Print Density (Line Spacing)
        if (printSettings.printDensity === "compact") {
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x33, 20])); // ESC 3 20
        } else if (printSettings.printDensity === "spacious" || printSettings.printDensity === "bold") {
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x33, 45])); // ESC 3 45
        } else {
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x32])); // ESC 2 (Default)
        }

        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x01])); // Align center

        let kotHeader1 = "";
        kotHeader1 += line("=", lineWidth) + "\n";
        kotHeader1 += "KITCHEN ORDER TICKET\n";
        kotHeader1 += line("-", lineWidth) + "\n";

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
          await printer.write(kotTokenSizeCmd);
          // @ts-ignore
          await printer.write(kotTokenWeightCmd);
          // @ts-ignore
          await printer.write(encoder.encode(`TOKEN NO: #${tokenNumber}\n`));
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x45, 0x00])); // BOLD OFF
          // @ts-ignore
          await printer.write(new Uint8Array([0x1b, 0x21, 0x00])); // Reset Size
        }

        let kotHeader2 = "";
        if (printSettings.showKOTTime) {
          kotHeader2 += `Date: ${date.toLocaleString()}\n`;
        }
        kotHeader2 += line("-", lineWidth) + "\n";

        // @ts-ignore
        await printer.write(encoder.encode(kotHeader2));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x00])); // Align left

        // Print items one by one for buffer safety
        for (const item of cartItems) {
          // @ts-ignore
          await printer.write(kotItemsSizeCmd);
          // @ts-ignore
          await printer.write(kotItemsWeightCmd);
          // @ts-ignore
          await printer.write(encoder.encode(`${item.name}\n`));

          // @ts-ignore
          await printer.write(kotQtySizeCmd);
          // @ts-ignore
          await printer.write(kotQtyWeightCmd);
          // @ts-ignore
          await printer.write(encoder.encode(`Qty: ${item.quantity}\n`));

          // @ts-ignore
          await printer.write(kotItemsSizeCmd);
          // @ts-ignore
          await printer.write(kotItemsWeightCmd);

          let extraText = "";
          if (printSettings.showKOTInstructions) {
            const instruction = item.instruction || item.instructions || item.notes || item.note;
            if (instruction && instruction.trim().length > 0) {
              if (printSettings.sepKOTInstructions) {
                extraText += `*${line("-", lineWidth - 2)}*\n`;
                extraText += `* NOTE: ${instruction.trim()}\n`;
                extraText += `*${line("-", lineWidth - 2)}*\n`;
              } else {
                extraText += `  Note: ${instruction.trim()}\n`;
              }
            }
          }

          extraText += line("-", lineWidth) + "\n";
          // @ts-ignore
          await printer.write(encoder.encode(extraText));
        }

        // Reset Size after items
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x21, 0x00]));

        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x01])); // Align center
        // @ts-ignore
        await printer.write(encoder.encode("PREPARE FAST\n\n"));

        // Feed lines based on padding
        const feedLines = Math.max(2, Math.round((printSettings.paperBottomPadding || 80) / 24));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x64, feedLines]));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));

        // Spooler Delay to prevent buffer freeze
        await new Promise(r => setTimeout(r, printSettings.spoolerDelay || 1500));
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
