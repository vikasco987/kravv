

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
    const logoUrl = companyInfo?.logoUrl || "";
    const upi = companyInfo?.upi || "";

    // --- Load Settings from AsyncStorage ---
    const settings = await AsyncStorage.multiGet([
      'tax_enabled', 'tax_rate', 
      'discount_enabled', 'discount_rate',
      'service_charge_enabled', 'service_charge_rate'
    ]);
    
    const sMap: Record<string, string | null> = {};
    settings.forEach(([key, val]) => sMap[key] = val);

    const isTaxEnabled = sMap['tax_enabled'] === 'true';
    const taxRatePercent = parseFloat(sMap['tax_rate'] || "5.00");
    
    const isDiscountEnabled = sMap['discount_enabled'] === 'true';
    const discountRatePercent = parseFloat(sMap['discount_rate'] || "0.00");
    
    const isServiceChargeEnabled = sMap['service_charge_enabled'] === 'true';
    const serviceChargeRatePercent = parseFloat(sMap['service_charge_rate'] || "0.00");

    // --- Calculations ---
    // 1. Initial Total from Cart
    const baseTotal = products.reduce((sum, p) => sum + p.total, 0);
    
    // 2. Apply Discount (if enabled)
    const discountAmount = isDiscountEnabled ? (baseTotal * (discountRatePercent / 100)) : 0;
    const afterDiscount = baseTotal - discountAmount;
    
    // 3. Add Service Charge (if enabled)
    const serviceChargeAmount = isServiceChargeEnabled ? (afterDiscount * (serviceChargeRatePercent / 100)) : 0;
    const subtotalWithSC = afterDiscount + serviceChargeAmount;

    // 4. Handle GST (Exclusive)
    const gstRateDecimal = isTaxEnabled ? (taxRatePercent / 100) : 0;
    const subtotalCalc = subtotalWithSC;
    const gstAmount = Number((subtotalCalc * gstRateDecimal).toFixed(2));
    const finalTotal = subtotalCalc + gstAmount;

    // --- Final Bill Text ---
    // We will build the text part normally, but the print loop will handle ESC/POS alignment
    const headerLines = [
      companyName.toUpperCase(),
      companyTagline,
      companyAddress,
      companyPhone ? `PH: ${companyPhone}` : '',
      gstNumber ? `GSTIN: ${gstNumber}` : '',
    ].filter(l => l.length > 0);

    const productsLine = line('-');
    const doubleLine = line('=');

    const customerDetails =
      options?.phone && options.phone.trim().length > 0
        ? `Customer: ${options.customerName || "Walk-in"}\nPh: ${options.phone}`
        : `Customer: ${options.customerName || "Walk-in"}`;

    // Item List
    const itemsText = products
      .map(
        (i) =>
          `${i.name.slice(0, 12).padEnd(12)} ${String(i.quantity).padStart(3)} ${i.price?.toFixed(2).padStart(6)} ₹${i.total.toFixed(2).padStart(7)}`
      )
      .join("\n");

    const bodyText =
      `${line('-')}
Bill No: ${billNo}
Date: ${date.toLocaleString()}
${customerDetails}
Payment Mode: ${paymentMode}
${line('-')}
Item         Qty  Price   Total
${line('-')}
${itemsText}
${line('-')}
Subtotal:${`₹${subtotalCalc.toFixed(2)}`.padStart(21)}
${isTaxEnabled ? `GST (${taxRatePercent}%):${`₹${gstAmount.toFixed(2)}`.padStart(19)}\n` : ''}${isDiscountEnabled ? `Discount (${discountRatePercent}%):${`-₹${discountAmount.toFixed(2)}`.padStart(14)}\n` : ''}${isServiceChargeEnabled ? `S.Charge (${serviceChargeRatePercent}%):${`₹${serviceChargeAmount.toFixed(2)}`.padStart(14)}\n` : ''}${line('-')}
GRAND TOTAL:${`₹${finalTotal.toFixed(2)}`.padStart(18)}
${line('-')}
${centerText("Payment: " + paymentMode, 32)}
${line('-')}
${upi ? centerText("Scan & Pay", 32) + "\n" : ""}
${centerText("Thank You! Visit Again 🙏", 32)}
`;

    // --- Faster Execution: Print & Save in Parallel ---
    const printPromise = (async () => {
      try {
        if (!connectedPrinter) {
          const printer = await ensurePrinterConnected();
          if (!printer) return;
        }

        // 1. Initialize Printer & Set Alignment
        await connectedPrinter?.write(new Uint8Array([0x1B, 0x40])); // ESC @ (Initialize)
        
        const encoder = new TextEncoder();
        
        // --- ESC/POS COMMANDS ---
        const ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01]);
        const ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00]);
        const SIZE_LARGE = new Uint8Array([0x1B, 0x21, 0x30]); // Double height & width
        const SIZE_NORMAL = new Uint8Array([0x1B, 0x21, 0x00]);

        // Clear top margin
        await connectedPrinter?.write(encoder.encode("\n"));

        // Start Alignment
        await connectedPrinter?.write(ALIGN_CENTER);
        
        // Print Business Name (Large & Bold)
        await connectedPrinter?.write(SIZE_LARGE);
        await connectedPrinter?.write(encoder.encode(companyName.toUpperCase() + "\n"));
        await connectedPrinter?.write(SIZE_NORMAL);

        // Logo Placeholder or Info
        if (logoUrl) {
            // Ideally convert image to bits here. For now, stylized header.
            await connectedPrinter?.write(encoder.encode("--------------------------\n"));
        }

        // Print Tagline & Info
        const headerInfo = headerLines.slice(1).join("\n") + "\n";
        await connectedPrinter?.write(encoder.encode(headerInfo));
        
        // Reset to Left for Body
        await connectedPrinter?.write(ALIGN_LEFT);
        
        // Print Body items
        const cleanBody = bodyText.replace(/[^\x00-\x7F]/g, "");
        await connectedPrinter?.write(encoder.encode(cleanBody));

        // If UPI is available, print QR Code
        if (upi) {
          const upiUrl = `upi://pay?pa=${upi}&pn=${encodeURIComponent(companyName)}&am=${finalTotal.toFixed(2)}&cu=INR&tn=Bill_${billNo}`;
          
          // ESC/POS QR Code commands
          const size = upiUrl.length + 3;
          const pL = size % 256;
          const pH = Math.floor(size / 256);

          const qrCommands = new Uint8Array([
            0x1B, 0x61, 0x01,                         // Align center
            0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,    // Function 167: Set model
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06,          // Function 169: Set size (6)
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30,          // Function 171: Set error correction
            0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...Array.from(upiUrl).map(c => c.charCodeAt(0)), // Function 180: Store data
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30,          // Function 181: Print QR
            0x0A,                                     // New line
            ...Array.from(centerText(`UPI: ${upi}`, 32)).map(c => c.charCodeAt(0)),
            0x0A, 0x0A                                // Padding
          ]);
          await connectedPrinter?.write(qrCommands);
        }

        // Feed 3 lines & cut paper
        await connectedPrinter?.write(new Uint8Array([0x1b, 0x64, 0x03])); // ESC d 3
        await connectedPrinter?.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00])); // GS V B 0
      } catch (err) {
        console.log("Print error in SimpleBill:", err);
      }
    })();
    
    const subtotalVal = subtotalCalc;
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
        total: finalTotal,
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
        payload: { companyName, billNo: data.bill?.billNumber || billNo, total: finalTotal } 
      };
    }
  } catch (err: any) {
    console.log("❌ [SimpleBill Error]:", err.message || err);
    ToastAndroid.show("❌ Error creating bill", ToastAndroid.SHORT);
  }
}
