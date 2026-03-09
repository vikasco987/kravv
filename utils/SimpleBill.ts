

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
  billId?: string;
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

    await connectedPrinter?.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00])); // GS V B 0
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

    const companyName = companyInfo?.companyName || "KRAVY Billing";
    const companyAddress = companyInfo?.companyAddress || "New Delhi, India";
    const companyPhone = companyInfo?.companyPhone || "";
    // @ts-ignore
    const companyTagline = companyInfo?.businessTagLine || "";
    const gstNumber = companyInfo?.gstNumber || "";

    // --- Bill Formatting ---
    const centeredCompanyName = centerText(companyName.toUpperCase(), 32);
    const centeredTagline = companyTagline ? centerText(companyTagline, 32) : '';
    const centeredAddress = centerText(companyAddress, 32);
    const centeredPhone = companyPhone ? centerText(`PH: ${companyPhone}`, 32) : '';
    const centeredGst = gstNumber ? centerText(`GST: ${gstNumber}`, 32) : '';

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
${centeredTagline ? centeredTagline + '\n' : ''}${centeredAddress}
${centeredPhone}
${centeredGst ? centeredGst + '\n' : ''}${line('-')}
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

    // --- Faster Execution: Print & Save in Parallel ---
    const printPromise = printBill(billText);
    
    const subtotalVal = Number((total / 1.05).toFixed(2));
    const method = options?.billId ? "PUT" : "POST";
    const url = options?.billId 
      ? `https://billing.kravy.in/api/bill-manager/${options.billId}`
      : "https://billing.kravy.in/api/bill-manager";

    const savePromise = fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: products,
        subtotal: subtotalVal,
        total: total,
        paymentMode: options?.paymentMode === "UPI" || options?.paymentMode === "Card" ? options.paymentMode : "Cash",
        paymentStatus: "Paid",
        isHeld: false,
        upiTxnRef: null,
        customerName: options?.customerName || "Walk-in",
        customerPhone: options?.phone || null,
      }),
    });

    const [_, res] = await Promise.all([printPromise, savePromise]);
    const data = await res.json();

    if (!res.ok) {
      console.log("❌ Backend Error:", data);
      ToastAndroid.show(`⚠️ Save failed: ${data.error || "Unknown error"}`, ToastAndroid.SHORT);
      return { status: "error", error: data.error };
    } else {
      // ✅ SUCCESS: Aggressive Cleanup
      try {
        const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
        const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];
        
        // 1. Hide the original held ID (if any)
        if (options?.billId && !hiddenIds.includes(options.billId)) {
          hiddenIds.push(options.billId);
        }

        // 2. Hide the newly created bill info from Hold list just in case
        const billData = data.bill || data;
        const newId = billData._id || billData.id;
        const newNo = billData.billNumber;

        if (newId && !hiddenIds.includes(newId)) hiddenIds.push(newId);
        if (newNo && !hiddenIds.includes(newNo)) hiddenIds.push(newNo);

        await AsyncStorage.setItem('@hidden_bill_ids', JSON.stringify(hiddenIds));

        // 3. Remove from local held_orders array
        const localData = await AsyncStorage.getItem('@held_orders');
        if (localData) {
          let orders = JSON.parse(localData);
          if (options?.billId) orders = orders.filter((o: any) => o.id !== options.billId);
          if (newId) orders = orders.filter((o: any) => o.id !== newId);
          await AsyncStorage.setItem('@held_orders', JSON.stringify(orders));
        }

        // 4. Clear resume markers
        await AsyncStorage.removeItem('@resume_cart');
        await AsyncStorage.removeItem('@resume_cart_id');
      } catch (e) {
        console.log("ℹ️ Cleanup error ignored:", e);
      }

      return { 
        status: "success", 
        data: data.bill || data, 
        payload: { companyName, billNo: data.bill?.billNumber || billNo, total } 
      };
    }
  } catch (err: any) {
    console.log("❌ [SimpleBill Error]:", err.message || err);
    ToastAndroid.show("❌ Error creating bill", ToastAndroid.SHORT);
  }
}
