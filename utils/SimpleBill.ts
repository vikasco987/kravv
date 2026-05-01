

import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import { DeviceEventEmitter, ToastAndroid } from "react-native";
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
  businessProfile?: any;
  taxSettings?: any;
  tokenNo?: string;
};

// @ts-ignore
let connectedPrinter: any = null;

// --- LOGO CACHE ---
let cachedLogoData: Uint8Array | null = null;
let lastLogoUrl: string | null = null;

// Center text for thermal printer width (32 chars)
const centerText = (text: string, width: number = 32): string => {
  if (text.length >= width) return text;
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
};

// Line helper
const line = (char: string = '-', width: number = 32) => char.repeat(width);

// ✅ Connect printer using saved address or fallback scan
async function ensurePrinterConnected(silent?: boolean) {
  try {
    if (connectedPrinter) return connectedPrinter;

    const savedAddress = await AsyncStorage.getItem("saved_printer");
    if (savedAddress) {
      connectedPrinter = await RNBluetoothClassic.connectToDevice(savedAddress);
      return connectedPrinter;
    }

    const devices = await RNBluetoothClassic.getBondedDevices();
    const printer = devices.find(
      (d: any) =>
        d.name?.toLowerCase().includes("tish") ||
        d.name?.toLowerCase().includes("mt580") ||
        d.name?.toLowerCase().includes("printer")
    );

    if (!printer) return null;

    connectedPrinter = await RNBluetoothClassic.connectToDevice(printer.address);
    return connectedPrinter;
  } catch (err) {
    connectedPrinter = null;
    return null;
  }
}

// ✅ Process Cloudinary URL to monochrome bitmap for ESC/POS
async function processAndPrintLogo(printer: any, url: string, silent?: boolean) {
  try {
    if (!url) return;
    
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

    let printerData: Uint8Array | null = null;

    // --- CACHE LAYER 1: MEMORY ---
    if (cachedLogoData && lastLogoUrl === transformedUrl) {
      printerData = cachedLogoData;
    } else {
      // --- CACHE LAYER 2: ASYNC STORAGE ---
      try {
        const storedLogo = await AsyncStorage.getItem('@cached_logo_bitmap');
        const storedUrl = await AsyncStorage.getItem('@cached_logo_url');
        if (storedLogo && (storedUrl === transformedUrl || !url.startsWith("http"))) {
          const arr = JSON.parse(storedLogo);
          printerData = new Uint8Array(arr);
          cachedLogoData = printerData;
          lastLogoUrl = transformedUrl;
        }
      } catch (e) {
        console.log("Logo storage read failed:", e);
      }

      // --- LAYER 3: FETCH & PROCESS ---
      if (!printerData) {
        try {
          if (!silent) ToastAndroid.show("🖼️ Processing Logo...", ToastAndroid.SHORT);
          const response = await fetch(transformedUrl);
          if (!response.ok) throw new Error("Logo fetch failed");

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
          const bmpStride = Math.ceil((width * bppBytes) / 4) * 4;

          const xL = bytesPerLine % 256;
          const xH = Math.floor(bytesPerLine / 256);
          const yL = height % 256;
          const yH = Math.floor(height / 256);

          printerData = new Uint8Array(8 + (bytesPerLine * height));
          printerData.set([0x1D, 0x76, 0x30, 0, xL, xH, yL, yH]);

          let pos = 8;
          for (let y = height - 1; y >= 0; y--) {
            const lineStart = dataOffset + y * bmpStride;
            for (let xByte = 0; xByte < bytesPerLine; xByte++) {
              let byteValue = 0;
              for (let bit = 0; bit < 8; bit++) {
                const x = xByte * 8 + bit;
                if (x < width) {
                  const p = lineStart + x * bppBytes;
                  const luminance = bytes[p + 2] * 0.299 + bytes[p + 1] * 0.587 + bytes[p] * 0.114;
                  if (luminance < 128) byteValue |= (1 << (7 - bit));
                }
              }
              printerData[pos++] = byteValue;
            }
          }

          // Update Persistent Cache
          cachedLogoData = printerData;
          lastLogoUrl = transformedUrl;
          await AsyncStorage.setItem('@cached_logo_bitmap', JSON.stringify(Array.from(printerData)));
          await AsyncStorage.setItem('@cached_logo_url', transformedUrl);

        } catch (fetchErr) {
          console.log("Logo fetch/process failed (expected offline):", fetchErr);
          // If we have ANY stored logo, return it as fallback even if URL doesn't match
          const storedLogo = await AsyncStorage.getItem('@cached_logo_bitmap');
          if (storedLogo) {
             const arr = JSON.parse(storedLogo);
             printerData = new Uint8Array(arr);
          }
        }
      }
    }

    if (printerData) {
      // 3. Write in larger chunks for speed (1024 is usually safe for most printers)
      for (let i = 0; i < printerData.length; i += 1024) {
        const chunk = printerData.slice(i, i + 1024);
        await printer.write(chunk);
      }
      await printer.write("\n\n"); // Extra padding after logo
    }
  } catch (err) {
    console.log("Logo overall printing failed:", err);
  }
}

// ✅ NEW: Pre-cache logo bitmap when online to ensure offline availability
export async function preCacheLogo(url: string) {
  if (!url || !url.startsWith("http")) return;
  try {
    const cachedUrl = await AsyncStorage.getItem('@cached_logo_url');
    if (cachedUrl === url) return; // Already cached
    
    let transformedUrl = url;
    if (url.includes("cloudinary.com")) {
      const uploadIdx = url.indexOf("/upload/");
      if (uploadIdx !== -1) {
        transformedUrl = url.slice(0, uploadIdx + 8) + "c_scale,w_240,f_bmp/" + url.slice(uploadIdx + 8);
      }
    }

    const response = await fetch(transformedUrl);
    if (!response.ok) return;

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes[0] !== 0x42 || bytes[1] !== 0x4D) return;
    const dataOffset = bytes[10] | (bytes[11] << 8) | (bytes[12] << 16) | (bytes[13] << 24);
    const width = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
    const height = Math.abs(bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24));
    const bpp = bytes[28] | (bytes[29] << 8);
    if (bpp !== 24 && bpp !== 32) return;

    const bytesPerLine = Math.ceil(width / 8);
    const bppBytes = bpp / 8;
    const bmpStride = Math.ceil((width * bppBytes) / 4) * 4;

    const xL = bytesPerLine % 256;
    const xH = Math.floor(bytesPerLine / 256);
    const yL = height % 256;
    const yH = Math.floor(height / 256);

    const printerData = new Uint8Array(8 + (bytesPerLine * height));
    printerData.set([0x1D, 0x76, 0x30, 0, xL, xH, yL, yH]);

    let pos = 8;
    for (let y = height - 1; y >= 0; y--) {
      const lineStart = dataOffset + y * bmpStride;
      for (let xByte = 0; xByte < bytesPerLine; xByte++) {
        let byteValue = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = xByte * 8 + bit;
          if (x < width) {
            const p = lineStart + x * bppBytes;
            const luminance = bytes[p + 2] * 0.299 + bytes[p + 1] * 0.587 + bytes[p] * 0.114;
            if (luminance < 128) byteValue |= (1 << (7 - bit));
          }
        }
        printerData[pos++] = byteValue;
      }
    }

    await AsyncStorage.setItem('@cached_logo_bitmap', JSON.stringify(Array.from(printerData)));
    await AsyncStorage.setItem('@cached_logo_url', url); // store the original url
  } catch (err: any) {
    // Silently fail
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

// ✅ ESC/POS QR Code printing
async function printQRCode(printer: any, data: string) {
  try {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const pL = (dataBytes.length + 3) % 256;
    const pH = Math.floor((dataBytes.length + 3) / 256);

    // 1. Model 2
    await printer.write(new Uint8Array([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
    // 2. Size (7)
    await printer.write(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x07]));
    // 3. Error correction L
    await printer.write(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30]));
    // 4. Store data
    const header = new Uint8Array([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    await printer.write(header);
    await printer.write(dataBytes);
    // 5. Print
    await printer.write(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));
  } catch (err) {
    console.log("QR printing failed:", err);
  }
}

// ✅ Main SimpleBill function
export async function SimpleBill(
  cartItems: CartItem[],
  token: string,
  userClerkId: string,
  options?: BillOptions
) {
  // 🚀 INSTANT RETURN: Don't wait for anything!
  (async () => {
    try {
      let finalToken = (token && token !== "null") ? token : null;
      let finalUserId = (userClerkId && userClerkId !== "null") ? userClerkId : null;

      // 1. Background Auth & Data Fetching
      if (!finalToken || !finalUserId) {
        const sessionStr = await AsyncStorage.getItem('staff_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (!finalToken) finalToken = session.token || session.token_id || "";
          if (!finalUserId) finalUserId = session.id || session._id || "";
        }
      }

      const companyInfo = options?.businessProfile || await getRecentCompanyProfile(finalToken || "");
      const date = new Date();
      const tempBillNo = `NEW-${Date.now().toString().slice(-4)}`;
      const paymentMode = options?.paymentMode || "CASH";

      // 2. Background Calculations
      let sMap: Record<string, string | null> = {};
      const settings = await AsyncStorage.multiGet([
        'tax_enabled', 'tax_rate', 'per_product_tax',
        'discount_enabled', 'discount_rate',
        'service_charge_enabled', 'service_charge_rate',
        'service_gst_enabled', 'service_gst_rate',
        'delivery_charge_enabled', 'delivery_charge_amount',
        'delivery_gst_enabled', 'delivery_gst_rate',
        'packaging_charge_enabled', 'packaging_charge_amount',
        'packaging_gst_enabled', 'packaging_gst_rate'
      ]);
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
      let subtotal = 0;
      const usedGstRates = new Set<number>();

      const productsForBackend = cartItems.map((item) => {
        const unitPrice = item.editedPrice ?? item.price ?? 0;
        const qty = item.quantity;
        const lineTotal = unitPrice * qty;
        let itemGstRate = isTaxEnabled ? globalTaxRate : (perProductTaxEnabled ? (Number(item.gst) || 0) : 0);
        let taxable = (item.taxStatus === "With Tax" || item.taxType === "With Tax") ? (lineTotal / (1 + itemGstRate / 100)) : lineTotal;
        let gst = (item.taxStatus === "With Tax" || item.taxType === "With Tax") ? (lineTotal - taxable) : (lineTotal * itemGstRate / 100);
        totalTaxable += taxable;
        totalGst += gst;
        subtotal += lineTotal;
        if (itemGstRate > 0) usedGstRates.add(itemGstRate);
        return { ...item, quantity: qty, price: unitPrice, taxableAmount: taxable, gstPaid: gst, gstRate: itemGstRate, total: lineTotal };
      });

      const discountAmount = isDiscountEnabled ? (totalTaxable * (discountRatePercent / 100)) : 0;
      const taxableAfterDiscount = totalTaxable - discountAmount;
      // Service Charge moved to add-on section
      const netTaxableValue = taxableAfterDiscount;
      const finalGstAmount = netTaxableValue * (totalTaxable > 0 ? (totalGst / totalTaxable) : 0);
      const finalTotalFixed = netTaxableValue + finalGstAmount;

      let serviceCharge = 0;
      let serviceGst = 0;
      let serviceGstRate = 0;
      if (sMap['service_charge_enabled'] === 'true') {
        serviceCharge = parseFloat(sMap['service_charge_rate'] || "0.00") || 0;
        if (sMap['service_gst_enabled'] === 'true') {
          serviceGstRate = parseFloat(sMap['service_gst_rate'] || "0.00") || 0;
          serviceGst = (serviceCharge * serviceGstRate) / 100;
        }
      }

      let deliveryCharge = 0;
      let deliveryGst = 0;
      let deliveryGstRate = 0;
      if (sMap['delivery_charge_enabled'] === 'true') {
        deliveryCharge = parseFloat(sMap['delivery_charge_amount'] || "0") || 0;
        if (sMap['delivery_gst_enabled'] === 'true') {
          deliveryGstRate = parseFloat(sMap['delivery_gst_rate'] || "0") || 0;
          deliveryGst = (deliveryCharge * deliveryGstRate) / 100;
        }
      }
      const grandTotalBeforeDel = finalTotalFixed + serviceCharge + serviceGst;
      const grandTotal = grandTotalBeforeDel + deliveryCharge + deliveryGst;

      let packagingCharge = 0;
      let packagingGst = 0;
      let packagingGstRate = 0;
      if (sMap['packaging_charge_enabled'] === 'true') {
        packagingCharge = parseFloat(sMap['packaging_charge_amount'] || "0") || 0;
        if (sMap['packaging_gst_enabled'] === 'true') {
          packagingGstRate = parseFloat(sMap['packaging_gst_rate'] || "0") || 0;
          packagingGst = (packagingCharge * packagingGstRate) / 100;
        }
      }
      const finalGrandTotal = grandTotal + packagingCharge + packagingGst;

      let displayGstLabel = 'GST';
      if (isTaxEnabled) {
        displayGstLabel = `GST (${globalTaxRate}%)`;
      } else if (perProductTaxEnabled) {
        if (usedGstRates.size === 1) {
          displayGstLabel = `GST (${Array.from(usedGstRates)[0]}%)`;
        } else if (usedGstRates.size > 1) {
          displayGstLabel = `GST (Mixed)`;
        }
      }

      // 3. Background Printing
      const printer = await ensurePrinterConnected(options?.silent);
      if (printer) {
        const encoder = new TextEncoder();
        const ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01]);
        const ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00]);
        const SIZE_LARGE = new Uint8Array([0x1B, 0x21, 0x10]);
        const SIZE_NORMAL = new Uint8Array([0x1B, 0x21, 0x00]);
        const BOLD_ON = new Uint8Array([0x1B, 0x45, 0x01]);
        const BOLD_OFF = new Uint8Array([0x1B, 0x45, 0x00]);

        await printer.write(ALIGN_CENTER);
        if (companyInfo?.logoUrl) await processAndPrintLogo(printer, companyInfo.logoUrl, options?.silent);

        await printer.write(SIZE_LARGE);
        await printer.write(BOLD_ON);
        await printer.write(encoder.encode((companyInfo?.companyName || "KRAVY").toUpperCase() + "\n"));
        await printer.write(BOLD_OFF);
        await printer.write(SIZE_NORMAL);
        if (companyInfo?.businessTagLine) await printer.write(encoder.encode(companyInfo.businessTagLine + "\n"));
        await printer.write(encoder.encode(line('=') + "\n"));
        await printer.write(encoder.encode((companyInfo?.companyAddress || "") + "\n"));
        if (companyInfo?.gstNumber) await printer.write(encoder.encode(`GSTIN: ${companyInfo.gstNumber}\n`));
        await printer.write(encoder.encode(line('-') + "\n"));
        await printer.write(ALIGN_LEFT);

        // Simple text body (Already optimized in background)
        let body = `Bill No: ${tempBillNo}\nDate: ${date.toLocaleString()}\n`;
        if (options?.tableName) body += `Table: ${options.tableName}\n`;
        if (options?.customerName) body += `Cust: ${options.customerName}\n`;
        
        await printer.write(encoder.encode(body));

        if (options?.tokenNo) {
          await printer.write(ALIGN_CENTER);
          await printer.write(BOLD_ON);
          await printer.write(SIZE_LARGE);
          await printer.write(encoder.encode("================\n"));
          await printer.write(encoder.encode(` TOKEN NO: #${options.tokenNo} \n`));
          await printer.write(encoder.encode("================\n"));
          await printer.write(SIZE_NORMAL);
          await printer.write(BOLD_OFF);
          await printer.write(ALIGN_LEFT);
        }

        body = `${line('-')}\nItem         Qty  Price   Total\n${line('-')}\n`;
        productsForBackend.forEach(i => {
          body += `${i.name.slice(0, 12).padEnd(12)} ${String(i.quantity).padStart(3)} ${i.price?.toFixed(2).padStart(6)} ${i.total.toFixed(2).padStart(8)}\n`;
        });
        body += `${line('-')}\n`;
        body += `${"subtotal:".padEnd(20)}${subtotal.toFixed(2).padStart(12)}\n`;
        if (isDiscountEnabled) {
          body += `${(`Disc (${discountRatePercent}%):`).padEnd(20)}${(`-${discountAmount.toFixed(2)}`).padStart(12)}\n`;
        }
        body += `${"taxable_amount:".padEnd(20)}${netTaxableValue.toFixed(2).padStart(12)}\n`;
        body += `${(displayGstLabel + ":").padEnd(20)}${finalGstAmount.toFixed(2).padStart(12)}\n`;

        if (serviceCharge > 0) {
          body += `${"Service Charge:".padEnd(20)}${serviceCharge.toFixed(2).padStart(12)}\n`;
          if (serviceGst > 0) {
            body += `${(`GST on Serv (${serviceGstRate}%):`).padEnd(20)}${serviceGst.toFixed(2).padStart(12)}\n`;
          }
        }
        
        if (deliveryCharge > 0) {
          body += `${"Delivery Charge:".padEnd(20)}${deliveryCharge.toFixed(2).padStart(12)}\n`;
          if (deliveryGst > 0) {
            body += `${(`GST on Del (${deliveryGstRate}%):`).padEnd(20)}${deliveryGst.toFixed(2).padStart(12)}\n`;
          }
        }

        if (packagingCharge > 0) {
          body += `${"Packaging Charge:".padEnd(20)}${packagingCharge.toFixed(2).padStart(12)}\n`;
          if (packagingGst > 0) {
            body += `${(`GST on Pack (${packagingGstRate}%):`).padEnd(20)}${packagingGst.toFixed(2).padStart(12)}\n`;
          }
        }

        body += `${line('-')}\n`;
        body += `${"TOTAL:".padEnd(20)}${finalGrandTotal.toFixed(2).padStart(12)}\n`;
        body += `${line('-')}\n`;

        await printer.write(encoder.encode(body));

        // 4. UPI QR Code
        const upiId = companyInfo?.upiId || companyInfo?.upi;
        if (upiId) {
          const businessName = companyInfo?.companyName || "KRAVY";
          const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${finalGrandTotal.toFixed(2)}&cu=INR`;
          
          await printer.write(ALIGN_CENTER);
          await printer.write(encoder.encode("Scan to Pay\n"));
          await printQRCode(printer, upiUri);
          await printer.write(encoder.encode(`${upiId}\n\n`));
        }

        await printer.write(ALIGN_CENTER);
        await printer.write(encoder.encode(centerText("Thank You! Visit Again", 32) + "\n"));
        await printer.write(new Uint8Array([0x1b, 0x64, 0x03])); 
        await printer.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00])); 
      }

      // 4. Background Backend Save
      const url = options?.billId ? `https://billing.kravy.in/api/bill-manager/${options.billId}` : "https://billing.kravy.in/api/bill-manager";
      await fetch(url, {
        method: options?.billId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${finalToken}` },
        body: JSON.stringify({
          items: productsForBackend,
          total: Number(finalGrandTotal.toFixed(2)),
          paymentMode: options?.paymentMode || "Cash",
          customerName: options?.customerName || "Walk-in",
          userClerkId: finalUserId,
          businessId: options?.orderId,
          serviceCharge: Number(serviceCharge.toFixed(2)),
          serviceGst: Number(serviceGst.toFixed(2)),
          deliveryCharge: Number(deliveryCharge.toFixed(2)),
          deliveryGst: Number(deliveryGst.toFixed(2)),
          packagingCharge: Number(packagingCharge.toFixed(2)),
          packagingGst: Number(packagingGst.toFixed(2)),
        }),
      });
      DeviceEventEmitter.emit('refresh_orders_list');
    } catch (e) {
      console.log("Background bill processing error:", e);
    }
  })();

  return { status: "success", error: undefined };
}
