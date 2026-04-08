

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
  gst?: number;
  taxType?: string;
  hsnCode?: string;
  taxStatus?: string;
};

export type BillOptions = {
  customerName?: string;
  phone?: string;
  notes?: string;
  paymentMode?: string;
  billId?: string;
  orderId?: string; // Add this for table orders
  silent?: boolean;
  staffName?: string;
  tableName?: string; // Add this for table name
  partyId?: string;
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
export async function ensurePrinterConnected(silent?: boolean) {
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
      if (!silent) ToastAndroid.show("⚠️ Printer not found! Connect in Setup.", ToastAndroid.SHORT);
      return null;
    }

    connectedPrinter = await RNBluetoothClassic.connectToDevice(printer.address);
    if (!connectedPrinter || !(await connectedPrinter.isConnected())) {
      if (!silent) ToastAndroid.show("❌ Failed to connect printer!", ToastAndroid.SHORT);
      connectedPrinter = null;
      return null;
    }

    return connectedPrinter;
  } catch (err) {
    console.log("Printer connect error:", err);
    if (!silent) ToastAndroid.show("⚠️ Printer connection failed", ToastAndroid.SHORT);
    connectedPrinter = null;
    return null;
  }
}

// ✅ Process Cloudinary URL to monochrome bitmap for ESC/POS
async function processAndPrintLogo(printer: any, url: string, silent?: boolean) {
  try {
    if (!url) return;
    if (!silent) ToastAndroid.show("🖼️ Printing Logo...", ToastAndroid.SHORT);

    // 1. Scale to ~240px and convert to 24-bit BMP (uncompressed)
    let transformedUrl = url;
    if (url.includes("cloudinary.com")) {
      const uploadIdx = url.indexOf("/upload/");
      if (uploadIdx !== -1) {
        transformedUrl = url.slice(0, uploadIdx + 8) + 
          "c_scale,w_240,f_bmp/" + 
          url.slice(uploadIdx + 8);
      }
    }

    const response = await fetch(transformedUrl);
    if (!response.ok) return;
    
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 2. BMP Parsing (Windows BMP V3 Header)
    if (bytes[0] !== 0x42 || bytes[1] !== 0x4D) return; // 'BM'
    const dataOffset = bytes[10] | (bytes[11] << 8) | (bytes[12] << 16) | (bytes[13] << 24);
    const width = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
    const height = Math.abs(bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24));
    const bpp = bytes[28] | (bytes[29] << 8);

    if (bpp !== 24 && bpp !== 32) return; // Standard RGB formats

    const bytesPerLine = Math.ceil(width / 8);
    const bppBytes = bpp / 8;
    // Scanlines in BMP are multiple of 4 bytes
    const bmpStride = Math.ceil((width * bppBytes) / 4) * 4;

    // ESC/POS GS v 0 (Print raster bit image)
    const xL = bytesPerLine % 256;
    const xH = Math.floor(bytesPerLine / 256);
    const yL = height % 256;
    const yH = Math.floor(height / 256);

    const printerData = new Uint8Array(8 + (bytesPerLine * height));
    printerData.set([0x1D, 0x76, 0x30, 0, xL, xH, yL, yH]);

    let pos = 8;
    // BMP is bottom-up (y = height-1 down to 0)
    for (let y = height - 1; y >= 0; y--) {
      const lineStart = dataOffset + y * bmpStride;
      for (let xByte = 0; xByte < bytesPerLine; xByte++) {
        let byteValue = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = xByte * 8 + bit;
          if (x < width) {
            const p = lineStart + x * bppBytes;
            // RGB to Grayscale: 0.299R + 0.587G + 0.114B (BMP stores B-G-R)
            const luminance = bytes[p+2] * 0.299 + bytes[p+1] * 0.587 + bytes[p] * 0.114;
            if (luminance < 128) byteValue |= (1 << (7 - bit)); // If dark, set bit to 1
          }
        }
        printerData[pos++] = byteValue;
      }
    }

    // 3. Write in small chunks to the printer (CRITICAL for Bluetooth stability)
    for (let i = 0; i < printerData.length; i += 512) {
      const chunk = printerData.slice(i, i + 512);
      await printer.write(chunk);
    }
    await printer.write("\n\n"); // Extra padding after logo
  } catch (err) {
    console.log("Logo processing failed:", err);
  }
}

// ✅ Print helper
export async function printBill(text: string, silent?: boolean) {
  try {
    if (!connectedPrinter) {
      const printer = await ensurePrinterConnected(silent);
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
    if (!silent) ToastAndroid.show("❌ Print failed", ToastAndroid.SHORT);
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
    // Use a transient identifier for the print if we can't wait for backend
    const tempBillNo = `NEW-${Date.now().toString().slice(-4)}`;

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
      'tax_enabled', 'tax_rate', 'per_product_tax',
      'discount_enabled', 'discount_rate',
      'service_charge_enabled', 'service_charge_rate'
    ]);
    
    const sMap: Record<string, string | null> = {};
    settings.forEach(([key, val]) => sMap[key] = val);

    const isTaxEnabled = sMap['tax_enabled'] === 'true';
    const globalTaxRate = parseFloat(sMap['tax_rate'] || "5.00");
    const perProductTaxEnabled = sMap['per_product_tax'] === 'true';
    const isDiscountEnabled = sMap['discount_enabled'] === 'true';
    const discountRatePercent = parseFloat(sMap['discount_rate'] || "0.00");
    const isServiceChargeEnabled = sMap['service_charge_enabled'] === 'true';
    const serviceChargeRatePercent = parseFloat(sMap['service_charge_rate'] || "10.00");

    let totalTaxable = 0;
    let totalGst = 0;
    let totalGross = 0;

    const productsForBackend = cartItems.map((item) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      const qty = item.quantity;
      const lineTotal = unitPrice * qty;
      totalGross += lineTotal;

      let itemGstRate = 0;
      if (isTaxEnabled) {
          // Global Override Always Wins
          itemGstRate = globalTaxRate;
      } else if (perProductTaxEnabled) {
          // Per-Product Rate Only if Global is OFF
          itemGstRate = (item.gst !== null && item.gst !== undefined) ? Number(item.gst) : 0;
      } else {
          itemGstRate = 0;
      }

      let taxable = 0;
      let gst = 0;

      if (item.taxType === "With Tax") {
          taxable = lineTotal / (1 + itemGstRate / 100);
          gst = lineTotal - taxable;
      } else {
          taxable = lineTotal;
          gst = (lineTotal * itemGstRate) / 100;
      }

      totalTaxable += taxable;
      totalGst += gst;

      return {
        productId: item.id,
        name: item.name,
        quantity: qty,
        price: unitPrice,
        originalPrice: item.price ?? 0,
        total: lineTotal,
        gstRate: itemGstRate,
        taxableAmount: taxable,
        gstPaid: gst,
        gst: item.gst ?? null,
        hsnCode: item.hsnCode ?? "",
        taxStatus: item.taxStatus || item.taxType || "Without Tax"
      };
    });

    // --- Refined Calculations ---
    // 1. Discount on Taxable Value
    const discountAmount = isDiscountEnabled ? (totalTaxable * (discountRatePercent / 100)) : 0;
    const taxableAfterDiscount = totalTaxable - discountAmount;

    // 2. Service Charge on Discounted Value
    const serviceChargeAmount = isServiceChargeEnabled ? (taxableAfterDiscount * (serviceChargeRatePercent / 100)) : 0;
    
    // 3. Taxable Amount Display Row (Base + SC)
    const netTaxableValue = taxableAfterDiscount + serviceChargeAmount;

    // 4. Final GST - Applied to netTaxableValue (Includes Service Charge)
    const avgGstRate = totalTaxable > 0 ? (totalGst / totalTaxable) : 0;
    const finalGstAmount = netTaxableValue * avgGstRate;

    // 5. Grand Total (Sum of all steps)
    const finalTotal = netTaxableValue + finalGstAmount;

    const gstAmount = Math.floor(finalGstAmount * 100) / 100;
    const finalTotalFixed = Math.floor(finalTotal * 100) / 100;

    // --- Final Bill Text ---
    const taxGroups: Record<number, { taxable: number, gst: number }> = {};
    productsForBackend.forEach(p => {
        const rate = p.gstRate || 0;
        if (!taxGroups[rate]) taxGroups[rate] = { taxable: 0, gst: 0 };
        taxGroups[rate].taxable += p.taxableAmount;
        taxGroups[rate].gst += p.gstPaid;
    });

    const taxBreakupText = Object.keys(taxGroups).map(rateStr => {
        const rate = parseFloat(rateStr);
        if (rate === 0) return "";
        const group = taxGroups[rate];
        return `${rate}% GST: ${group.taxable.toFixed(2).padStart(10)} | ${group.gst.toFixed(2).padStart(8)}`;
    }).filter(t => t.length > 0).join("\n");

    const customerDetails =
      options?.phone && options.phone.trim().length > 0
        ? `Customer: ${options.customerName || "Walk-in"}\nPh: ${options.phone}`
        : `Customer: ${options.customerName || "Walk-in"}`;

    const itemsText = productsForBackend
      .map(
        (i) =>
          `${i.name.slice(0, 12).padEnd(12)} ${String(i.quantity).padStart(3)} ${i.price?.toFixed(2).padStart(6)} ₹${i.total.toFixed(2).padStart(7)}`
      )
      .join("\n");

    // --- Build Summary Rows ---
    let summaryRows = `${line('-')}\n`;
    summaryRows += `Subtotal:${`₹${totalTaxable.toFixed(2)}`.padStart(23)}\n`;
    
    if (isDiscountEnabled) {
        summaryRows += `Discount (${discountRatePercent}%):${`-₹${discountAmount.toFixed(2)}`.padStart(16)}\n`;
    }
    
    if (isServiceChargeEnabled) {
        summaryRows += `S.Charge (${serviceChargeRatePercent}%):${`₹${serviceChargeAmount.toFixed(2)}`.padStart(16)}\n`;
    }

    // 🔥 Added "Taxable Amount" row (Subtotal - Discount + Service Charge)
    summaryRows += `Taxable Amount:${`₹${netTaxableValue.toFixed(2)}`.padStart(17)}\n`;

    if (isTaxEnabled || perProductTaxEnabled) {
        const gstLabelStr = perProductTaxEnabled ? "GST (Multi):" : `GST (${globalTaxRate}%):`;
        summaryRows += `${gstLabelStr}${`₹${gstAmount.toFixed(2)}`.padStart(32 - gstLabelStr.length)}\n`;
    }
    summaryRows += line('-');

    const bodyText =
      `Bill No: ${tempBillNo}
Date: ${date.toLocaleString()}
${customerDetails}
Payment Mode: ${paymentMode}
${line('-')}
Item         Qty  Price   Total
${line('-')}
${itemsText}
${summaryRows}
GRAND TOTAL:${`₹${finalTotalFixed.toFixed(2)}`.padStart(20)}
${line('-')}
${line('-')}
${(isTaxEnabled || perProductTaxEnabled) && taxBreakupText.length > 0 ? 
  `${centerText("TAX BREAKUP", 32)}\nRate   | Taxable Value | GST\n${line('-')}\n${taxBreakupText}\n${line('-')}\n` : ''}
${centerText("Payment: " + paymentMode, 32)}
${line('-')}
${upi ? centerText("Scan & Pay", 32) + "\n" : ""}
${centerText("Thank You! Visit Again 🙏", 32)}
`;

    // --- Faster Execution: Print & Save in Parallel ---
    const printPromise = (async () => {
      try {
        if (!connectedPrinter) {
          const printer = await ensurePrinterConnected(options?.silent);
          if (!printer) return;
        }

        // 1. Initialize Printer
        await connectedPrinter?.write(new Uint8Array([0x1B, 0x40])); // ESC @
        
        const encoder = new TextEncoder();
        
        // --- ESC/POS COMMANDS ---
        const ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01]);
        const ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00]);
        const SIZE_LARGE = new Uint8Array([0x1B, 0x21, 0x30]); // Double height & width
        const SIZE_NORMAL = new Uint8Array([0x1B, 0x21, 0x00]);
        const BOLD_ON = new Uint8Array([0x1B, 0x45, 0x01]);
        const BOLD_OFF = new Uint8Array([0x1B, 0x45, 0x00]);

        // Start With Banners (LOGO & BIDS)
        await connectedPrinter?.write(ALIGN_CENTER);

        // 2. Print Logo from URL
        if (logoUrl) {
            await processAndPrintLogo(connectedPrinter, logoUrl, options?.silent);
        }

        // Business Name Header (This is the large DELHI 38 in the screenshot)
        await connectedPrinter?.write(SIZE_LARGE);
        await connectedPrinter?.write(BOLD_ON);
        await connectedPrinter?.write(encoder.encode(companyName.toUpperCase() + "\n"));
        await connectedPrinter?.write(BOLD_OFF);
        await connectedPrinter?.write(SIZE_NORMAL);

        // Sub-header details
        if (companyTagline) {
            await connectedPrinter?.write(encoder.encode(companyTagline + "\n"));
        }
        
        // Decorative divider
        await connectedPrinter?.write(encoder.encode(line('=') + "\n"));

        // Address & Contact
        await connectedPrinter?.write(encoder.encode(companyAddress + "\n"));
        if (companyPhone) {
            await connectedPrinter?.write(encoder.encode(`PH: ${companyPhone}\n`));
        }
        if (gstNumber) {
            await connectedPrinter?.write(BOLD_ON);
            await connectedPrinter?.write(encoder.encode(`GSTIN: ${gstNumber}\n`));
            await connectedPrinter?.write(BOLD_OFF);
        }

        await connectedPrinter?.write(encoder.encode(line('-') + "\n"));
        
        // Reset to Left for Body
        await connectedPrinter?.write(ALIGN_LEFT);
        
        // Print Body items
        const cleanBody = bodyText.replace(/[^\x00-\x7F]/g, "");
        await connectedPrinter?.write(encoder.encode(cleanBody));

    const upi = companyInfo?.upiId || companyInfo?.upi || "";
    const upiUrl = upi ? `upi://pay?pa=${upi}&pn=${encodeURIComponent(companyName.slice(0, 20))}&am=${finalTotalFixed.toFixed(2)}&cu=INR&tn=BILL_${tempBillNo.slice(-4)}` : "";
          
    if (upiUrl) {
          // ESC/POS QR Code commands
          const size = upiUrl.length + 3;
          const pL = size % 256;
          const pH = Math.floor(size / 256);

          const qrCommands = new Uint8Array([
            0x1B, 0x61, 0x01,                         // Align center
            0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,    // Function 167: Set model
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08,          // Function 169: Set size (8 for better scanning)
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30,          // Function 171: Set error correction
            0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...Array.from(upiUrl).map(c => c.charCodeAt(0)), // Function 180: Store data
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30,          // Function 181: Print QR
            0x0A,                                     // New line
            ...Array.from(centerText(`SCAN TO PAY ₹${finalTotalFixed.toFixed(2)}`, 32)).map(c => c.charCodeAt(0)),
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
    
    // 0. Build Method and URL safely
    const billId = options?.billId;
    // CRITICAL: Only use PUT if it's a valid MongoDB ID (24 hex chars)
    const isValidBillId = billId && typeof billId === 'string' && /^[a-f\d]{24}$/i.test(billId);
    const method = isValidBillId ? "PUT" : "POST";
    const url = isValidBillId 
      ? `https://billing.kravy.in/api/bill-manager/${billId}`
      : "https://billing.kravy.in/api/bill-manager";

    // Standardize Payment Mode
    const normalizedPaymentMode = options?.paymentMode === "UPI" || options?.paymentMode === "Card" ? options.paymentMode : "Cash";

    // 1. Build Body exactly like working SaveBill.ts
    const body = {
      items: productsForBackend.map(p => ({
        itemId: p.productId || Math.random().toString(16).padEnd(24, '0'),
        productId: p.productId,
        name: p.name,
        qty: Number(p.quantity || 1),
        quantity: Number(p.quantity || 1),
        rate: p.price,
        price: p.price,
        gst: Number(p.gst || 0),
        taxStatus: p.taxStatus || "Without Tax",
        hsnCode: p.hsnCode || ""
      })),
      subtotal: Number(netTaxableValue.toFixed(2)),
      tax: Number(finalGstAmount.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      paymentMode: normalizedPaymentMode,
      paymentStatus: "Paid",
      isHeld: false,
      customerName: options?.customerName || "Walk-in Customer",
      customerPhone: (options?.phone && options.phone.trim().length >= 10) ? options.phone : null,
      tableName: options?.tableName || "POS",
      discountAmount: Number(discountAmount.toFixed(2)),
      discountCode: null,
      auditNote: options?.notes || "App Order",
      userClerkId: userClerkId,
      customerId: options?.partyId || null,
      partyId: options?.partyId || null
    };

    let res;
    let data: any = {};
    
    try {
      res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = (await res.json()) || {};
      }
    } catch (e: any) {
      console.log("❌ Network Error during save:", e.message);
      // We don't return error here because print might have worked
    }

    if (res && !res.ok) {
      console.log("❌ Backend Error:", data);
      // Even if backend fails, if print worked, we want success popup for the user
      // but we return "saved" status to handle the popup logic
      return { 
        status: "success", 
        data: data?.bill || data || {} 
      };
    } else {
      // ✅ SUCCESS: Fast Return for Popup
      try {
        const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
        const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];
        if (options?.billId && !hiddenIds.includes(options.billId)) {
          hiddenIds.push(options.billId);
        }
        if (options?.orderId && !hiddenIds.includes(options.orderId)) {
          hiddenIds.push(options.orderId);
        }
        if (hiddenIds.length > 0) {
          await AsyncStorage.setItem('@hidden_bill_ids', JSON.stringify(hiddenIds));
        }
        await AsyncStorage.removeItem('@resume_cart');
        await AsyncStorage.removeItem('@resume_cart_id');
      } catch (e) {}

      return { 
        status: "success", 
        data: data?.bill || data || {} 
      };
    }
  } catch (err: any) {
    console.log("❌ [SimpleBill Error]:", err.message);
    if (!options?.silent) ToastAndroid.show("❌ Error creating bill", ToastAndroid.SHORT);
    return { status: "error", error: err.message };
  }
}
