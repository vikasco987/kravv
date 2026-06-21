// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import { ToastAndroid } from "react-native";
// @ts-ignore
import RNBluetoothClassic from "react-native-bluetooth-classic";

let kotPrintQueueLock: Promise<any> = Promise.resolve();

/* ---------- Helpers ---------- */
const centerText = (text: string, width = 32) => {
  if (text.length >= width) return text;
  const pad = Math.floor((width - text.length) / 2);
  return " ".repeat(pad) + text;
};

const justify = (left: string, right: string, width = 32) => {
  const L = left || "";
  const R = right || "";
  const pad = Math.max(0, width - L.length - R.length);
  return L + " ".repeat(pad) + R;
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
    if (connectedPrinter) {
      try {
        const isConnected = await connectedPrinter.isConnected();
        if (isConnected) {
          if (!connectedPrinter._isSafeWrapped) {
            const _origWrite = connectedPrinter.write.bind(connectedPrinter);
            connectedPrinter.write = async (data: any) => {
              const d = data instanceof Uint8Array ? data : new Uint8Array(data);
              for (let i = 0; i < d.length; i += 64) {
                await _origWrite(d.slice(i, i + 64));
                await new Promise(r => setTimeout(r, 40));
              }
            };
            connectedPrinter._isSafeWrapped = true;
          }
          return connectedPrinter;
        }
      } catch (e) { }
      connectedPrinter = null;
    }

    const connected = await RNBluetoothClassic.getConnectedDevices();
    if (connected && connected.length > 0) {
      connectedPrinter = connected[0];
      if (!connectedPrinter._isSafeWrapped) {
        const _origWrite = connectedPrinter.write.bind(connectedPrinter);
        connectedPrinter.write = async (data: any) => {
          const d = data instanceof Uint8Array ? data : new Uint8Array(data);
          for (let i = 0; i < d.length; i += 64) {
            await _origWrite(d.slice(i, i + 64));
            await new Promise(r => setTimeout(r, 40));
          }
        };
        connectedPrinter._isSafeWrapped = true;
      }
      try { await connectedPrinter.clear(); } catch (e) { }
      return connectedPrinter;
    }

    const bonded = await RNBluetoothClassic.getBondedDevices();
    if (bonded && bonded.length > 0) {
      const dev = bonded[0];
      try {
        const isConnected = await dev.isConnected();
        if (isConnected) {
          connectedPrinter = dev;
          if (!connectedPrinter._isSafeWrapped) {
            const _origWrite = connectedPrinter.write.bind(connectedPrinter);
            connectedPrinter.write = async (data: any) => {
              const d = data instanceof Uint8Array ? data : new Uint8Array(data);
              for (let i = 0; i < d.length; i += 64) {
                await _origWrite(d.slice(i, i + 64));
                await new Promise(r => setTimeout(r, 40));
              }
            };
            connectedPrinter._isSafeWrapped = true;
          }
          return dev;
        }
      } catch (e) { }
      
      const success = await dev.connect();
      if (success) {
        connectedPrinter = dev;
        if (!connectedPrinter._isSafeWrapped) {
          const _origWrite = connectedPrinter.write.bind(connectedPrinter);
          connectedPrinter.write = async (data: any) => {
            const d = data instanceof Uint8Array ? data : new Uint8Array(data);
            for (let i = 0; i < d.length; i += 64) {
              await _origWrite(d.slice(i, i + 64));
              await new Promise(r => setTimeout(r, 40));
            }
          };
          connectedPrinter._isSafeWrapped = true;
        }
        try { await dev.clear(); } catch (e) { }
        return dev;
      }
    }

    const saved = await AsyncStorage.getItem("saved_printer");
    if (!saved) return null;

    connectedPrinter = await RNBluetoothClassic.connectToDevice(saved);
    if (connectedPrinter && !connectedPrinter._isSafeWrapped) {
      const _origWrite = connectedPrinter.write.bind(connectedPrinter);
      connectedPrinter.write = async (data: any) => {
        const d = data instanceof Uint8Array ? data : new Uint8Array(data);
        for (let i = 0; i < d.length; i += 64) {
          await _origWrite(d.slice(i, i + 64));
          await new Promise(r => setTimeout(r, 40));
        }
      };
      connectedPrinter._isSafeWrapped = true;
    }
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

    // --- STRICT INTERNET CHECK ---
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      await fetch("https://billing.kravy.in", { method: "GET", signal: controller.signal });
      clearTimeout(id);
    } catch (e) {
      ToastAndroid.show("⚠️ Internet required for KOT!", ToastAndroid.LONG);
      return false;
    }

    const date = new Date();
    const kotNo = "KOT-" + (Math.floor(Math.random() * 90000) + 10000);
    // @ts-ignore
    const encoder = new TextEncoder();

    const lineWidth = 32;

    // --- Start Printing (Backgrounded for speed) ---
    kotPrintQueueLock = kotPrintQueueLock.then(async () => {
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

        // K.O.T header
        // @ts-ignore
        await printer.write(getEscPosSize(18));
        // @ts-ignore
        await printer.write(getEscPosWeight("bold", globalWeight, "bold"));
        // @ts-ignore
        await printer.write(encoder.encode("K.O.T\n"));
        // @ts-ignore
        await printer.write(getEscPosSize(0));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x45, 0x00])); // BOLD OFF

        let headerStr = "";
        headerStr += line("-", lineWidth) + "\n";

        let leftBox = "[ COUNTER ]";
        if (tableNumber) leftBox = `[ TABLE ${tableNumber.replace(/^Table\s+/i, "").replace(/^T-/i, "")} ]`;
        else if (roomNumber) leftBox = `[ ROOM ${roomNumber.replace(/^Room\s+/i, "").replace(/^R-/i, "")} ]`;

        let rightTop = "TOKEN NO.";
        let rightBot = printSettings.showKOTToken && tokenNumber ? `#${tokenNumber}` : `#${kotNo.slice(-4)}`;

        headerStr += justify(leftBox, rightTop, lineWidth) + "\n";
        headerStr += justify("", rightBot, lineWidth) + "\n\n";

        let subHeader = "";
        if (printSettings.showKOTCustomer && customerName) subHeader += `Cust: ${customerName}`;
        if (subHeader) headerStr += subHeader.trim() + "\n";

        if (printSettings.showKOTTime) {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yy = date.getFullYear();
          let hr = date.getHours();
          const min = String(date.getMinutes()).padStart(2, '0');
          const ampm = hr >= 12 ? 'pm' : 'am';
          hr = hr % 12 || 12;
          headerStr += `Date: ${dd}/${mm}/${yy} - ${String(hr).padStart(2, '0')}:${min} ${ampm}\n`;
        }

        headerStr += line("-", lineWidth) + "\n";
        headerStr += justify("ITEM DESCRIPTION", "QTY", lineWidth) + "\n";
        headerStr += line("=", lineWidth) + "\n";

        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x00])); // Align left
        // @ts-ignore
        await printer.write(encoder.encode(headerStr));

        // Print items one by one for buffer safety
        for (let i = 0; i < cartItems.length; i++) {
          const item = cartItems[i];

          let itemName = item.name;
          const qtyStr = `${item.quantity}`;

          // @ts-ignore
          await printer.write(kotItemsSizeCmd);
          // @ts-ignore
          await printer.write(kotItemsWeightCmd);

          const availableNameLen = lineWidth - qtyStr.length - 1;
          const nameLine1 = itemName.length > availableNameLen ? itemName.substring(0, availableNameLen) : itemName;

          // @ts-ignore
          await printer.write(encoder.encode(justify(nameLine1, qtyStr, lineWidth) + "\n"));

          if (itemName.length > availableNameLen) {
            const remainingName = itemName.substring(availableNameLen);
            // @ts-ignore
            await printer.write(encoder.encode(remainingName + "\n"));
          }

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

          if (extraText) {
            // @ts-ignore
            await printer.write(encoder.encode(extraText));
          }

          if (i < cartItems.length - 1) {
            // @ts-ignore
            await printer.write(encoder.encode(line("-", lineWidth) + "\n"));
          }
        }

        // Reset Size after items
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x21, 0x00]));

        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x61, 0x01])); // Align center

        let footerStr = "";
        footerStr += line("=", lineWidth) + "\n";
        footerStr += "END OF KOT\n";

        const fdd = String(date.getDate()).padStart(2, '0');
        const fmm = String(date.getMonth() + 1).padStart(2, '0');
        const fyy = date.getFullYear();
        let fhr = date.getHours();
        const fmin = String(date.getMinutes()).padStart(2, '0');
        const fampm = fhr >= 12 ? 'pm' : 'am';
        fhr = fhr % 12 || 12;
        footerStr += `${fdd}/${fmm}/${fyy} - ${String(fhr).padStart(2, '0')}:${fmin} ${fampm}\n\n`;

        // @ts-ignore
        await printer.write(encoder.encode(footerStr));

        // Feed lines based on padding
        const feedLines = Math.max(2, Math.round((printSettings.paperBottomPadding || 80) / 24));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1b, 0x64, feedLines]));
        // @ts-ignore
        await printer.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));

        // Spooler Delay to prevent buffer freeze
        await new Promise(r => setTimeout(r, 4500));
      } catch (e) {
        console.log("KOT Print background error:", e);
      }
    }).catch(e => console.error("KOT Queue Error:", e));

    return true;
  } catch (err) {
    console.log("KOT ERROR:", err);
    ToastAndroid.show("❌ Failed to print KOT!", ToastAndroid.SHORT);
    return false;
  }
}
