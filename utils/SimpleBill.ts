

import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import { ToastAndroid } from "react-native";
// @ts-ignore
import RNBluetoothClassic from "react-native-bluetooth-classic";
import { getRecentCompanyProfile } from "../services/companyService";

export type CartItem = {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
};

export type BillOptions = {
  customerName?: string;
  phone?: string;
  notes?: string;
  paymentMode?: string;
};

// @ts-ignore
let connectedPrinter: any = null;

// Center text for thermal printer width (32 chars)
const centerText = (text: string, width: number = 32): string => {
  if (text.length >= width) return text;
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
};

// Line helper
const line = (char: string = '-', width: number = 32) => char.repeat(width);

// ✅ Connect printer using saved address or fallback scan
export async function ensurePrinterConnected() {
  try {
    if (connectedPrinter && (await connectedPrinter.isConnected())) return connectedPrinter;

    // Try saved printer first
    const savedAddress = await AsyncStorage.getItem("saved_printer");
    if (savedAddress) {
      console.log("📍 Connecting to saved printer:", savedAddress);
      connectedPrinter = await RNBluetoothClassic.connectToDevice(savedAddress);
      if (connectedPrinter && (await connectedPrinter.isConnected())) {
        return connectedPrinter;
      }
    }

    // Fallback to name-based scan
    const devices = await RNBluetoothClassic.getBondedDevices();
    const printer = devices.find(
      (d: any) =>
        d.name?.toLowerCase().includes("tish") ||
        d.name?.toLowerCase().includes("mt580") ||
        d.name?.toLowerCase().includes("printer")
    );

    if (!printer) {
      ToastAndroid.show("⚠️ Printer not found! Connect in Setup.", ToastAndroid.SHORT);
      return null;
    }

    connectedPrinter = await RNBluetoothClassic.connectToDevice(printer.address);
    if (!connectedPrinter || !(await connectedPrinter.isConnected())) {
      ToastAndroid.show("❌ Failed to connect printer!", ToastAndroid.SHORT);
      connectedPrinter = null;
      return null;
    }

    ToastAndroid.show(`✅ Connected: ${printer.name}`, ToastAndroid.SHORT);
    return connectedPrinter;
  } catch (err) {
    console.log("Printer connect error:", err);
    ToastAndroid.show("⚠️ Printer connection failed", ToastAndroid.SHORT);
    connectedPrinter = null;
    return null;
  }
}

// ✅ Print helper
export async function printBill(text: string) {
  try {
    if (!connectedPrinter) {
      const printer = await ensurePrinterConnected();
      if (!printer) return;
    }

    const cleanText = text.replace(/[^\x00-\x7F]/g, "");
    const encoder = new TextEncoder();
    await connectedPrinter?.write(encoder.encode(cleanText));

    // Feed 3 lines & cut paper
    await connectedPrinter?.write(new Uint8Array([0x1b, 0x64, 0x03])); // ESC d 3
    await connectedPrinter?.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00])); // GS V B 0

    ToastAndroid.show("🧾 Bill Printed!", ToastAndroid.SHORT);
  } catch (err) {
    console.log("Print error:", err);
    ToastAndroid.show("❌ Print failed", ToastAndroid.SHORT);
  }
}

// ✅ Main SimpleBill function
export async function SimpleBill(
  cartItems: CartItem[],
  token: string,
  userClerkId: string,
  options?: BillOptions
) {
  try {
    if (!token) throw new Error("❌ Clerk token missing!");
    if (!userClerkId) throw new Error("❌ userClerkId missing!");

    const companyInfo = await getRecentCompanyProfile(token);
    const date = new Date();
    const billNo = `MS-${Math.floor(Math.random() * 10000) + 5000}`;

    const products = cartItems.map((item) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      return {
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: unitPrice,
        total: unitPrice * item.quantity,
      };
    });

    const total = products.reduce((sum, p) => sum + p.total, 0);
    const paymentMode = options?.paymentMode || "CASH";

    const companyName = "Magic Scale";
    const companyAddress = companyInfo?.companyAddress || "New Delhi, India";
    const companyPhone = companyInfo?.companyPhone || "";

    // --- Bill Formatting ---
    const centeredCompanyName = centerText(companyName.toUpperCase(), 32);
    const centeredAddress = centerText(companyAddress, 32);
    const centeredPhone = companyPhone ? centerText(`PH: ${companyPhone}`, 32) : '';

    // Item List: Name (12) | Qty (3) | Price (6) | Total (7) = 28 + separators
    const itemsText = products
      .map(
        (i) =>
          `${i.name.slice(0, 12).padEnd(12)} ${String(i.quantity).padStart(3)} ${i.price?.toFixed(2).padStart(6)} ₹${i.total.toFixed(2).padStart(7)}`
      )
      .join("\n");

    const customerDetails =
      options?.phone && options.phone.trim().length > 0
        ? `Customer: ${options.customerName || "Walk-in"}\nPh: ${options.phone}`
        : `Customer: ${options.customerName || "Walk-in"}`;

    // --- Final Bill Text (no top blank lines) ---
    const billText =
      `${line('=')}
${centeredCompanyName}
${centeredAddress}
${centeredPhone}
${line('-')}
Bill No: ${billNo}
Date: ${date.toLocaleString()}
${customerDetails}
Payment Mode: ${paymentMode}
${line('-')}
Item         Qty  Price   Total
${line('-')}
${itemsText}
${line('-')}
TOTAL: ${`₹${total.toFixed(2)}`.padStart(25)}
${line('-')}
${centerText("Thank You! Visit Again 🙏", 32)}
`;

    // Print instantly
    await printBill(billText);

    // Save bill in backend
    const res = await fetch("https://billing-backend-sable.vercel.app/api/billing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userClerkId,
        customerName: options?.customerName || "Walk-in",
        phone: options?.phone || "",
        date: date.toISOString(),
        billNo,
        products,
        total,
        grandTotal: total,
        discount: 0,
        gst: 0,
        paymentMode,
        paymentStatus: "PAID",
        notes: options?.notes || `Bill No ${billNo}`,
        companyName,
        companyAddress,
        companyPhone,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log("❌ Backend Error:", errText);
      ToastAndroid.show("⚠️ Bill save failed!", ToastAndroid.SHORT);
    } else {
      ToastAndroid.show("✅ Bill saved!", ToastAndroid.SHORT);
    }

    return { status: "success", payload: { companyName, billNo, total } };
  } catch (err: any) {
    console.log("❌ [SimpleBill Error]:", err.message || err);
    ToastAndroid.show("❌ Error creating bill", ToastAndroid.SHORT);
  }
}
