import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter, Image, ToastAndroid } from "react-native";
// @ts-ignore
import RNBluetoothClassic from "react-native-bluetooth-classic";
import { StaffPermissionEngine } from "../components/staff creat/StaffPermissionEngine";
import { getRecentCompanyProfile } from "../services/companyService";

export type CartItem = {
  id: string;
  _id?: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
  gst?: number;
  taxStatus?: string;
  taxType?: string;
  hsnCode?: string;
  imageUrl?: string;
  unit?: string;
};

export type BillOptions = {
  paymentMode?: string;
  notes?: string;
  billId?: string;
  billNumber?: string;
  partyId?: string;
  customerName?: string;
  phone?: string;
  customerAddress?: string;
  tableName?: string;
  roomName?: string;
  tokenNo?: string | number;
  businessProfile?: any;
  taxSettings?: any;
  businessId?: string;
  silent?: boolean;
  orderId?: string;
  source?: string;
  isHeld?: boolean;
};

const line = (char = "-") => char.repeat(32);

// Global Cache for Rasterized Logos
const logoCache = new Map<string, Uint8Array>();

const DEFAULT_PRINT_SETTINGS = {
  // Bill Settings
  showLogo: true,
  showTagline: true,
  showContact: true,
  showAddress: true,
  showGST: true,
  showFSSAI: true,
  showToken: true,
  showCustomerDetails: true,
  showTaxBreakup: true,
  showGreetings: true,
  showAmountInWords: true,
  showPaymentStatus: true,
  showFoodTypeSuffix: true,
  // Financial Summary
  showSubtotal: true,
  showDiscount: true,
  showTaxableAmt: true,
  showTotalTax: true,
  showDeliveryCharges: true,
  showPackagingCharges: true,
  showServiceCharge: true,
  // Footer & Branding
  showVisitAgain: true,
  showPoweredBy: true,
  // Layout Separators
  sepTop: true,
  sepCustomer: true,
  sepItemsHeader: true,
  sepTotalTop: true,
  sepTotalBottom: true,
  sepPayment: true,
  sepFooter: true,
  sepKOTInstructions: true,
  // KOT Settings
  showKOTToken: true,
  showKOTCustomer: true,
  showKOTBillNo: true,
  showKOTTime: true,
  showKOTInstructions: true,
  // QR
  showReviewQR: false,
};

function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
  return numberToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numberToWords(n % 100000) : "");
}

// Printer Constants
const ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]);
const ALIGN_LEFT = new Uint8Array([0x1b, 0x61, 0x00]);
const SIZE_LARGE = new Uint8Array([0x1b, 0x21, 0x10]);
const SIZE_NORMAL = new Uint8Array([0x1b, 0x21, 0x00]);
const BOLD_ON = new Uint8Array([0x1b, 0x45, 0x01]);
const BOLD_OFF = new Uint8Array([0x1b, 0x45, 0x00]);

const getEscPosSize = (size: number) => {
  if (!size) return SIZE_NORMAL;
  if (size <= 10) return new Uint8Array([0x1b, 0x21, 0x01]); // Font B
  if (size <= 14) return SIZE_NORMAL; // Font A
  if (size <= 18) return new Uint8Array([0x1b, 0x21, 0x10]); // Double Height
  return new Uint8Array([0x1b, 0x21, 0x30]); // Double Width & Height
};

const getEscPosWeight = (specific: string | undefined | null, global: string | undefined | null, fallback: string): Uint8Array => {
  const w = specific || global || fallback;
  if (!w) return BOLD_OFF;
  const lw = w.toLowerCase();
  if (lw === "bold" || lw === "700" || lw === "800" || lw === "900") return BOLD_ON;
  return BOLD_OFF;
};

// Simple UTF-8 Encoder for Environments without TextEncoder
function utf8Encode(str: string): Uint8Array {
  const codePoints = [];
  for (let i = 0; i < str.length; i++) {
    let codePoint = str.charCodeAt(i);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < str.length) {
      const low = str.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (codePoint < 0x80) {
      codePoints.push(codePoint);
    } else if (codePoint < 0x800) {
      codePoints.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      codePoints.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      codePoints.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return new Uint8Array(codePoints);
}

async function ensurePrinterConnected(silent = false): Promise<any> {
  try {
    const connected = await RNBluetoothClassic.getConnectedDevices();
    if (connected && connected.length > 0) return connected[0];
    const bonded = await RNBluetoothClassic.getBondedDevices();
    if (bonded && bonded.length > 0) {
      const dev = bonded[0];
      const success = await dev.connect();
      if (success) return dev;
    }
  } catch (err) {
    if (!silent) console.log("BT Error:", err);
  }
  return null;
}

async function printQRCode(printer: any, data: string) {
  try {
    const dataBytes = utf8Encode(data);
    const pL = (dataBytes.length + 3) % 256;
    const pH = Math.floor((dataBytes.length + 3) / 256);
    await printer.write(
      new Uint8Array([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
    );
    await printer.write(
      new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),
    );
    await printer.write(
      new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]),
    );
    const header = new Uint8Array([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
    await printer.write(header);
    await printer.write(dataBytes);
    await printer.write(
      new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
    );
  } catch (err) {
    console.log("QR printing failed:", err);
  }
}

export const preCacheLogo = (url: string) => {
  if (url && typeof url === "string" && url.startsWith("http")) {
    Image.prefetch(url).catch(() => { });
  }
};

/**
 * Ensures an order gets a consistent token number. If the backend didn't provide one, 
 * it generates a local token and caches it for future KOTs/Bills of the same order.
 */
export async function resolveOrderToken(orderId: string | undefined | null, backendToken: any): Promise<string> {
  if (backendToken) return String(backendToken);

  if (orderId) {
    try {
      const storedStr = await AsyncStorage.getItem("@order_tokens");
      const stored = storedStr ? JSON.parse(storedStr) : {};
      if (stored[orderId]) {
        return stored[orderId];
      }

      const currentToken = await AsyncStorage.getItem("@token_counter");
      const nextToken = currentToken ? parseInt(currentToken) + 1 : 1;
      await AsyncStorage.setItem("@token_counter", String(nextToken));

      stored[orderId] = String(nextToken);
      const keys = Object.keys(stored);
      if (keys.length > 100) {
        delete stored[keys[0]];
      }
      await AsyncStorage.setItem("@order_tokens", JSON.stringify(stored));
      return String(nextToken);
    } catch (e) {
      console.log("Error resolving order token:", e);
    }
  }

  // Fallback
  try {
    const currentToken = await AsyncStorage.getItem("@token_counter");
    const nextToken = currentToken ? parseInt(currentToken) + 1 : 1;
    await AsyncStorage.setItem("@token_counter", String(nextToken));
    return String(nextToken);
  } catch (e) {
    return String(Math.floor(100 + Math.random() * 900));
  }
}

/**
 * Fetches an image from Cloudinary as a BMP, rasterizes it into a 1-bit bitmask,
 * and returns the ESC/POS GS v 0 command bytes.
 */
async function fetchAndRasterizeLogo(url: string): Promise<Uint8Array | { error: string } | null> {
  try {
    // 0. Check Cache First
    if (logoCache.has(url)) {
      return logoCache.get(url) || null;
    }

    // 1. Force Cloudinary to return a high-contrast grayscale BMP
    // transformations: width 200px (smaller centered logo), high contrast, grayscale, BMP format
    let transformedUrl = url;
    if (url.startsWith("data:image/")) {
      console.log("[LOGO ERROR] Base64 images are not supported for thermal printing.");
      return null;
    }

    if (url.includes("/upload/")) {
      transformedUrl = url.replace(
        "/upload/",
        "/upload/w_250,c_scale,e_grayscale,e_contrast:100,f_bmp/",
      );
    } else if (url.startsWith("http")) {
      transformedUrl = `https://res.cloudinary.com/demo/image/fetch/w_250,c_scale,e_grayscale,e_contrast:100,f_bmp/${encodeURIComponent(url)}`;
    }

    const response = await fetch(transformedUrl);
    if (!response.ok) {
      console.log(`[LOGO ERROR] Failed to fetch transformed logo from: ${transformedUrl}. Status: ${response.status}`);
      return { error: `Fetch failed: ${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // 2. Basic BMP Parser (Supports 24-bit and 8-bit uncompressed)
    // Check 'BM' signature
    if (data[0] !== 0x42 || data[1] !== 0x4d) {
      console.log(`[LOGO ERROR] Not a BMP file. Signature: ${data[0].toString(16)} ${data[1].toString(16)} for URL:`, transformedUrl);
      return { error: `Not a BMP (Sig: ${data[0].toString(16)} ${data[1].toString(16)})` };
    }

    const offset =
      data[10] | (data[11] << 8) | (data[12] << 16) | (data[13] << 24);
    const width =
      data[18] | (data[19] << 8) | (data[20] << 16) | (data[21] << 24);
    const height = Math.abs(
      data[22] | (data[23] << 8) | (data[24] << 16) | (data[25] << 24),
    );
    const bpp = data[28] | (data[29] << 8);

    if (bpp !== 32 && bpp !== 24 && bpp !== 8) {
      console.log(`[LOGO ERROR] Unsupported BPP: ${bpp}. Only 8, 24, or 32 bit BMP supported.`);
      return { error: `Unsupported BPP: ${bpp}` };
    }

    // ESC/POS requires width to be a multiple of 8 for GS v 0
    const widthBytes = Math.ceil(width / 8);
    const actualWidth = widthBytes * 8;

    // Raster data
    const rasterData = new Uint8Array(widthBytes * height);
    const bytesPerRow = Math.ceil((width * (bpp / 8)) / 4) * 4;

    for (let y = 0; y < height; y++) {
      // BMP is bottom-to-top
      const bmpY = height - 1 - y;
      const rowOffset = offset + bmpY * bytesPerRow;

      for (let x = 0; x < width; x++) {
        let gray = 0;
        if (bpp === 32) {
          const p = rowOffset + x * 4;
          const alpha = data[p + 3];
          if (alpha < 128) {
            gray = 255; // treat transparent pixels as white (not printed)
          } else {
            gray = (data[p] + data[p + 1] + data[p + 2]) / 3;
          }
        } else if (bpp === 24) {
          const p = rowOffset + x * 3;
          // BMP is BGR
          gray = (data[p] + data[p + 1] + data[p + 2]) / 3;
        } else {
          gray = data[rowOffset + x];
        }

        // Threshold (128) - anything darker than mid-gray is black
        if (gray < 128) {
          const byteIdx = y * widthBytes + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          rasterData[byteIdx] |= 1 << bitIdx;
        }
      }
    }

    // 3. Construct ESC/POS GS v 0 command
    // GS v 0 m xL xH yL yH d1...dk
    const xL = widthBytes % 256;
    const xH = Math.floor(widthBytes / 256);
    const yL = height % 256;
    const yH = Math.floor(height / 256);

    const command = new Uint8Array(8 + rasterData.length);
    command.set([0x1d, 0x76, 0x30, 0, xL, xH, yL, yH], 0);
    command.set(rasterData, 8);

    // 4. Save to Cache
    logoCache.set(url, command);

    return command;
  } catch (err: any) {
    console.log("Logo Rasterization Error:", err.message || err);
    return { error: `Exception: ${err.message}` };
  }
}

export async function SimpleBill(
  cartItems: CartItem[],
  token: any,
  userClerkId: any,
  options?: BillOptions,
): Promise<{ status: string; error?: string }> {
  try {
    const sessionStr = await AsyncStorage.getItem("staff_session");
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    let finalToken: any =
      token && token !== "null" ? token : session?.token || null;
    let finalClerkId: any =
      userClerkId && userClerkId !== "null"
        ? userClerkId
        : session?.id || session?._id || null;
    let finalBusinessId =
      options?.businessId ||
      (await StaffPermissionEngine.getActiveBusinessId(
        finalClerkId || undefined,
      ));
    if (!finalToken && session?.token) finalToken = session.token;

    const companyInfo =
      options?.businessProfile ||
      (await getRecentCompanyProfile(finalToken || ""));

    if (!finalBusinessId && companyInfo?.businessId) {
      finalBusinessId = companyInfo.businessId;
    }

    // Load print settings from AsyncStorage or fallback
    let printSettings: any = { ...DEFAULT_PRINT_SETTINGS };
    try {
      const cachedSettings = await AsyncStorage.getItem("print_settings");
      if (cachedSettings) {
        printSettings = { ...printSettings, ...JSON.parse(cachedSettings) };
      } else if (companyInfo?.printSettings) {
        printSettings = { ...printSettings, ...companyInfo.printSettings };
      }
    } catch (e) {
      console.log("Failed to load print settings in SimpleBill:", e);
    }

    const date = new Date();
    const tempBillNo = `NEW-${Date.now().toString().slice(-4)}`;

    // --- AUTO-GENERATE OR FETCH TOKEN IF NOT PROVIDED ---
    let finalTokenNo = await resolveOrderToken(options?.orderId, options?.tokenNo);

    const settings = await AsyncStorage.multiGet([
      "tax_enabled",
      "tax_rate",
      "per_product_tax",
      "discount_enabled",
      "discount_rate",
      "service_charge_enabled",
      "service_charge_rate",
      "service_gst_enabled",
      "service_gst_rate",
      "delivery_charge_enabled",
      "delivery_charge_amount",
      "delivery_gst_enabled",
      "delivery_gst_rate",
      "packaging_charge_enabled",
      "packaging_charge_amount",
      "packaging_gst_enabled",
      "packaging_gst_rate",
    ]);
    const sMap: Record<string, string | null> = {};
    settings.forEach(([key, val]) => (sMap[key] = val));

    const tS = options?.taxSettings;
    const isTaxEnabled = tS ? tS.enabled : sMap["tax_enabled"] === "true";
    const globalTaxRate = tS ? tS.rate : parseFloat(sMap["tax_rate"] || "0");
    const perProductTaxEnabled = tS
      ? tS.perProduct
      : sMap["per_product_tax"] === "true";
    const isDiscountEnabled = tS
      ? tS.discountEnabled
      : sMap["discount_enabled"] === "true";
    const discountRatePercent = tS
      ? tS.discountRate
      : parseFloat(sMap["discount_rate"] || "0.00");
    const isServiceChargeEnabled = tS
      ? tS.serviceChargeEnabled
      : sMap["service_charge_enabled"] === "true";
    const serviceChargeRate = tS
      ? tS.serviceChargeRate
      : parseFloat(sMap["service_charge_rate"] || "0.00");
    const isServiceGstEnabled = tS
      ? tS.serviceGstEnabled
      : sMap["service_gst_enabled"] === "true";
    const serviceGstRate = tS
      ? tS.serviceGstRate
      : parseFloat(sMap["service_gst_rate"] || "0");
    const isDeliveryChargeEnabled = tS
      ? tS.deliveryChargeEnabled
      : sMap["delivery_charge_enabled"] === "true";
    const deliveryChargeAmount = tS
      ? tS.deliveryChargeAmount
      : parseFloat(sMap["delivery_charge_amount"] || "0.00");
    const isDeliveryGstEnabled = tS
      ? tS.deliveryGstEnabled
      : sMap["delivery_gst_enabled"] === "true";
    const deliveryGstRate = tS
      ? tS.deliveryGstRate
      : parseFloat(sMap["delivery_gst_rate"] || "0");

    const isPackagingChargeEnabled = tS
      ? tS.packagingChargeEnabled
      : sMap["packaging_charge_enabled"] === "true";
    const packagingChargeAmount = tS
      ? tS.packagingChargeAmount
      : parseFloat(sMap["packaging_charge_amount"] || "0.00");
    const isPackagingGstEnabled = tS
      ? tS.packagingGstEnabled
      : sMap["packaging_gst_enabled"] === "true";
    const packagingGstRate = tS
      ? tS.packagingGstRate
      : parseFloat(sMap["packaging_gst_rate"] || "0");

    let totalTaxable = 0;
    let totalGst = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let usedGlobalFallback = false;
    let globalGstTotal = 0;
    let perProductGstTotals: Record<number, number> = {};

    const discountRate = isDiscountEnabled ? discountRatePercent / 100 : 0;

    const productsForBackend = cartItems.map((item) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      const qty = Number(item.quantity || 1);
      const itemLineTotal = unitPrice * qty;
      const itemDiscount = itemLineTotal * discountRate;
      const itemPriceAfterDiscount = itemLineTotal - itemDiscount;

      let itemGstRate = 0;
      const productGst = Number(item.gst || 0);

      // --- ALAG ALAG CASES KA LOGIC ---

      // CASE 1: Global GST ON aur Per-Product GST OFF
      if (isTaxEnabled && !perProductTaxEnabled) {
        itemGstRate = globalTaxRate;
      }
      // CASE 2: Global GST OFF aur Per-Product GST ON
      else if (!isTaxEnabled && perProductTaxEnabled) {
        itemGstRate = productGst;
      }
      // CASE 3: Global GST ON aur Per-Product GST ON
      else if (isTaxEnabled && perProductTaxEnabled) {
        if (productGst > 0) {
          itemGstRate = productGst;
        } else {
          itemGstRate = globalTaxRate;
        }
      }

      let taxable = 0,
        gst = 0;

      const taxType = item.taxStatus || item.taxType || "Without Tax";

      if (taxType === "With Tax") {
        taxable = itemPriceAfterDiscount / (1 + itemGstRate / 100);
        gst = itemPriceAfterDiscount - taxable;
      } else {
        taxable = itemPriceAfterDiscount;
        // Always calculate GST on Discounted Price (Transaction Value)
        gst = (itemPriceAfterDiscount * itemGstRate) / 100;
      }

      // --- COUNTERS LOGIC ---
      if (isTaxEnabled && perProductTaxEnabled) {
        // In Case 3, we track based on source
        if (productGst > 0) {
          perProductGstTotals[itemGstRate] =
            (perProductGstTotals[itemGstRate] || 0) + gst;
        } else {
          globalGstTotal += gst;
        }
      } else if (isTaxEnabled && !perProductTaxEnabled) {
        // Case 1
        globalGstTotal += gst;
      } else if (!isTaxEnabled && perProductTaxEnabled) {
        // Case 2
        perProductGstTotals[itemGstRate] =
          (perProductGstTotals[itemGstRate] || 0) + gst;
      }

      totalTaxable += taxable;
      totalGst += gst;
      subtotal += itemLineTotal;
      totalDiscount += itemDiscount;

      return {
        id: item.id || item._id,
        itemId: item.id || item._id,
        name: item.name,
        qty: qty,
        quantity: qty,
        rate: unitPrice,
        price: unitPrice,
        taxableAmount: Number(taxable.toFixed(2)),
        gstPaid: Number(gst.toFixed(2)),
        gstRate: itemGstRate,
        total: Number(itemLineTotal.toFixed(2)),
        taxStatus: taxType,
      };
    });

    const taxableAfterDiscount = totalTaxable;
    const finalGstAmount = totalGst;
    const totalItemGstCalculated = Object.values(perProductGstTotals).reduce(
      (a, b) => a + b,
      0,
    );

    console.log(
      `[BILL-DEBUG] TotalTaxable=${totalTaxable.toFixed(2)}, TotalDisc=${totalDiscount.toFixed(2)}, TotalGST=${totalGst.toFixed(2)}, Subtotal=${subtotal.toFixed(2)}`,
    );

    let serviceCharge = 0,
      serviceGst = 0;
    if (isServiceChargeEnabled) {
      serviceCharge = serviceChargeRate;
      if (isServiceGstEnabled)
        serviceGst = (serviceCharge * serviceGstRate) / 100;
    }
    let deliveryCharge = 0,
      deliveryGst = 0;
    if (isDeliveryChargeEnabled) {
      deliveryCharge = deliveryChargeAmount;
      if (isDeliveryGstEnabled)
        deliveryGst = (deliveryCharge * deliveryGstRate) / 100;
    }
    let packagingCharge = 0,
      packagingGst = 0;
    if (isPackagingChargeEnabled) {
      packagingCharge = packagingChargeAmount;
      if (isPackagingGstEnabled)
        packagingGst = (packagingCharge * packagingGstRate) / 100;
    }

    const finalGrandTotal =
      totalTaxable +
      totalGst +
      serviceCharge +
      serviceGst +
      deliveryCharge +
      deliveryGst +
      packagingCharge +
      packagingGst;

    // 1. Prepare Backend Data (Fast, Local)
    const finalBillTotal = Number(finalGrandTotal.toFixed(2));
    const finalTax = Number(totalGst.toFixed(2));

    const isValidBillId =
      options?.billId &&
      typeof options.billId === "string" &&
      /^[a-f\d]{24}$/i.test(options.billId);

    const url = isValidBillId
      ? `https://billing.kravy.in/api/bill-manager/${options.billId}${finalBusinessId ? `?businessId=${finalBusinessId}` : ""}`
      : `https://billing.kravy.in/api/bill-manager${finalBusinessId ? `?businessId=${finalBusinessId}` : ""}`;

    // 🖨️ & 🌐 2. Combined Sync & Print Process
    (async () => {
      let finalBillNoToPrint = options?.billNumber || tempBillNo;
      let syncSuccess = false;

      // 🛡️ STEP A: IF NEW BILL, WE MUST SAVE FIRST TO GET MONGODB BILL NUMBER
      if (!options?.billNumber) {
        try {
          const method = isValidBillId ? "PUT" : "POST";
          const response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${finalToken}`,
            },
            body: JSON.stringify({
              items: productsForBackend,
              subtotal: Number(totalTaxable.toFixed(2)),
              taxableAmount: Number(totalTaxable.toFixed(2)),
              itemsSubtotal: Number(subtotal.toFixed(2)),
              tax: Number(totalGst.toFixed(2)),
              total: finalBillTotal,
              paymentMode: options?.paymentMode || "Cash",
              paymentStatus: "Paid",
              isHeld: options?.isHeld ?? false,
              clerkUserId: finalClerkId || finalBusinessId,
              businessId: finalBusinessId,
              orderId: options?.orderId || "",
              customerName: options?.customerName || "Walk-in",
              customerPhone: options?.phone || "",
              customerAddress: options?.customerAddress || "",
              tableName: options?.tableName || "POS",
              roomName: options?.roomName || "",
              tokenNumber: finalTokenNo ? Number(finalTokenNo) : 0,
              source: options?.source || "POS",
              discountAmount: Number(totalDiscount.toFixed(2)),
              discountRate: discountRatePercent,
              calculatedTaxable: Number(totalTaxable.toFixed(2)),
              calculatedGlobalGst: Number(globalGstTotal.toFixed(2)),
              calculatedItemGst: Number(totalItemGstCalculated.toFixed(2)),
              serviceCharge: Number(serviceCharge.toFixed(2)),
              serviceGst: Number(serviceGst.toFixed(2)),
              serviceGstRate: serviceGstRate,
              deliveryCharges: Number(deliveryCharge.toFixed(2)),
              deliveryGst: Number(deliveryGst.toFixed(2)),
              deliveryGstRate: deliveryGstRate,
              packagingCharges: Number(packagingCharge.toFixed(2)),
              packagingGst: Number(packagingGst.toFixed(2)),
              packagingGstRate: packagingGstRate,
              isKotPrinted: true,
              auditNote: options?.notes || "App Order",
            }),
          });

          if (response.ok) {
            syncSuccess = true;
            const data = await response.json().catch(() => ({}));
            const serverBillNo = data.bill?.billNumber || data.billNumber;
            if (serverBillNo) {
              finalBillNoToPrint = serverBillNo;
            }
            DeviceEventEmitter.emit("refresh_orders_list");
            DeviceEventEmitter.emit("REFRESH_ORDERS");
            DeviceEventEmitter.emit("REFRESH_DASHBOARD");
          }
        } catch (e) {
          console.log(
            "Saving failed before print (using fallback bill number):",
            e,
          );
        }
      }

      // 🖨️ STEP B: PRINTING PROCESS
      try {
        const printer: any = await ensurePrinterConnected(options?.silent);
        if (printer) {
          const businessName = (
            companyInfo?.businessName ||
            companyInfo?.businessProfile?.companyName ||
            companyInfo?.companyName ||
            "KRAVY"
          ).toUpperCase();
          const businessAddress =
            companyInfo?.businessAddress || companyInfo?.companyAddress || "";
          const businessTagLine =
            companyInfo?.businessTagline || companyInfo?.businessTagLine || "";
          const gstNumber = companyInfo?.gstNumber || "";
          const bizPhone = companyInfo?.companyPhone || companyInfo?.businessPhone || companyInfo?.phone || "";
          const bizFSSAI = companyInfo?.fssaiNumber || companyInfo?.businessFSSAI || "";
          const reviewLink = companyInfo?.googleReviewLink || "";

          await printer.write(ALIGN_CENTER);

          // Top Separator
          if (printSettings.sepTop) {
            await printer.write(utf8Encode(line("-") + "\n"));
          }

          // Print Logo
          const logoUrl = companyInfo?.logoUrl || companyInfo?.logo;
          if (String(printSettings.showLogo) === "true" && logoUrl) {
            const logoResult = await fetchAndRasterizeLogo(logoUrl);
            if (logoResult && !(logoResult as any).error) {
              await printer.write(logoResult);
              await printer.write(utf8Encode("\n"));
            } else {
              const errDetails = logoResult ? (logoResult as any).error : "Unknown";
              console.log("[BILL LOGO] Failed to print logo.", errDetails);
              ToastAndroid.show(`Logo print failed: ${errDetails}`, ToastAndroid.LONG);
            }
          }

          const globalWeight = printSettings.fontWeight;

          const bizNameSizeCmd = getEscPosSize(printSettings.businessNameSize || 18);
          const bizNameWeightCmd = getEscPosWeight(printSettings.businessNameWeight, globalWeight, "bold");

          const addressSizeCmd = getEscPosSize(printSettings.businessAddressSize || 11);
          const addressWeightCmd = getEscPosWeight(printSettings.businessAddressWeight, globalWeight, "normal");

          const taglineSizeCmd = getEscPosSize(printSettings.taglineSize || 11);
          const taglineWeightCmd = getEscPosWeight(printSettings.taglineWeight, globalWeight, "normal");

          const detailsSizeCmd = getEscPosSize(printSettings.detailsFontSize || 10);
          const detailsWeightCmd = getEscPosWeight(printSettings.detailsWeight, globalWeight, "normal");
          const detailsBoldCmd = getEscPosWeight(printSettings.detailsWeight, globalWeight, "bold");

          const itemsSizeCmd = getEscPosSize(printSettings.itemsFontSize || 11);
          const itemsWeightCmd = getEscPosWeight(printSettings.itemsWeight, globalWeight, "normal");

          const totalSizeCmd = getEscPosSize(printSettings.totalFontSize || 13);
          const totalWeightCmd = getEscPosWeight(printSettings.totalWeight, globalWeight, "bold");

          const tokenSizeCmd = getEscPosSize(printSettings.receiptTokenSize || 28);
          const tokenWeightCmd = getEscPosWeight(printSettings.receiptTokenWeight, globalWeight, "bold");

          const greetingSizeCmd = getEscPosSize(printSettings.greetingFontSize || 12);
          const greetingWeightCmd = getEscPosWeight(printSettings.greetingWeight, globalWeight, "normal");

          // Header
          await printer.write(bizNameSizeCmd);
          await printer.write(bizNameWeightCmd);
          await printer.write(utf8Encode(businessName + "\n"));
          await printer.write(BOLD_OFF);
          await printer.write(SIZE_NORMAL);

          if (printSettings.showTagline && businessTagLine) {
            await printer.write(taglineSizeCmd);
            await printer.write(taglineWeightCmd);
            await printer.write(utf8Encode(businessTagLine + "\n"));
            await printer.write(BOLD_OFF);
            await printer.write(SIZE_NORMAL);
          }

          if (printSettings.showAddress && businessAddress) {
            await printer.write(addressSizeCmd);
            await printer.write(addressWeightCmd);
            await printer.write(utf8Encode(businessAddress + "\n"));
            await printer.write(BOLD_OFF);
            await printer.write(SIZE_NORMAL);
          }

          await printer.write(detailsSizeCmd);
          await printer.write(detailsBoldCmd);
          if (printSettings.showContact && bizPhone)
            await printer.write(utf8Encode(`Mob: ${bizPhone}\n`));
          if (printSettings.showGST && gstNumber)
            await printer.write(utf8Encode(`GSTIN: ${gstNumber}\n`));
          if (printSettings.showFSSAI && bizFSSAI)
            await printer.write(utf8Encode(`FSSAI: ${bizFSSAI}\n`));

          await printer.write(BOLD_OFF);
          await printer.write(utf8Encode(line("-") + "\n"));
          await printer.write(ALIGN_LEFT);

          await printer.write(detailsSizeCmd);
          await printer.write(detailsWeightCmd);
          let printBody = `Bill No: ${finalBillNoToPrint}\nDate: ${date.toLocaleString()}\n`;
          if (options?.tableName) printBody += `Table: ${options.tableName}\n`;
          await printer.write(utf8Encode(printBody));

          if (printSettings.showToken && finalTokenNo) {
            await printer.write(tokenSizeCmd);
            await printer.write(tokenWeightCmd);
            await printer.write(utf8Encode(`Token No: #${finalTokenNo}\n`));
            await printer.write(BOLD_OFF);
            await printer.write(detailsSizeCmd);
            await printer.write(detailsWeightCmd);
          }

          if (printSettings.showCustomerDetails) {
            if (printSettings.sepCustomer) {
              await printer.write(utf8Encode(line("-") + "\n"));
            }
            let custBody = "";
            if (options?.customerName) custBody += `Cust: ${options.customerName}\n`;
            if (options?.phone) custBody += `Phone: ${options.phone}\n`;
            if (options?.customerAddress) custBody += `Addr: ${options.customerAddress}\n`;
            if (custBody) {
              await printer.write(utf8Encode(custBody));
            }
          }

          await printer.write(itemsSizeCmd);
          await printer.write(detailsBoldCmd);
          let itemsHeader = "";
          if (printSettings.sepItemsHeader) {
            itemsHeader += line("-") + "\n";
          }
          itemsHeader += "Item         Qty  Price   Total\n";
          itemsHeader += line("-") + "\n";
          await printer.write(utf8Encode(itemsHeader));

          await printer.write(itemsWeightCmd);

          printBody = "";
          productsForBackend.forEach((i) => {
            let suffix = "";
            if (printSettings.showFoodTypeSuffix) {
              const isVeg = (i as any).isVeg ?? (i as any).veg ?? !/\b(nv|egg|chicken|mutton|fish|meat|pork|beef|non-veg|nonveg)\b/i.test(i.name);
              suffix = isVeg ? "(V)" : "(NV)";
            }
            const displayName =
              i.gstRate > 0
                ? `${i.name.slice(0, 7)}${suffix}(${i.gstRate}%)`
                : `${i.name.slice(0, 12)}${suffix}`;
            printBody += `${displayName.padEnd(12)} ${String(i.qty).padStart(3)} ${i.rate.toFixed(2).padStart(6)} ${i.total.toFixed(2).padStart(8)}\n`;
          });

          await printer.write(utf8Encode(printBody));

          await printer.write(itemsSizeCmd);
          await printer.write(detailsWeightCmd);
          let taxBody = "";
          if (printSettings.sepTotalTop) {
            taxBody += `${line("-")}\n`;
          }
          if (printSettings.showSubtotal)
            taxBody += `${"Subtotal:".padEnd(20)}${subtotal.toFixed(2).padStart(12)}\n`;
          if (printSettings.showDiscount && isDiscountEnabled)
            taxBody += `${`Disc (${discountRatePercent}%):`.padEnd(20)}${`-${totalDiscount.toFixed(2)}`.padStart(12)}\n`;
          if (printSettings.showTaxableAmt)
            taxBody += `${"Taxable:".padEnd(20)}${taxableAfterDiscount.toFixed(2).padStart(12)}\n`;
          if (printSettings.showTotalTax && globalGstTotal > 0)
            taxBody += `${`Global GST(${globalTaxRate}%):`.padEnd(20)}${globalGstTotal.toFixed(2).padStart(12)}\n`;

          // Tax Breakup
          if (printSettings.showTaxBreakup) {
            if (globalGstTotal > 0) {
              const halfTax = globalGstTotal / 2;
              const halfRate = globalTaxRate / 2;
              taxBody += `${`CGST (${halfRate}%):`.padEnd(20)}${halfTax.toFixed(2).padStart(12)}\n`;
              taxBody += `${`SGST (${halfRate}%):`.padEnd(20)}${halfTax.toFixed(2).padStart(12)}\n`;
            }
            Object.entries(perProductGstTotals).forEach(([rate, amount]) => {
              if (amount > 0) {
                const r = parseFloat(rate);
                const halfTax = amount / 2;
                const halfRate = r / 2;
                taxBody += `${`CGST (${halfRate}%):`.padEnd(20)}${halfTax.toFixed(2).padStart(12)}\n`;
                taxBody += `${`SGST (${halfRate}%):`.padEnd(20)}${halfTax.toFixed(2).padStart(12)}\n`;
              }
            });
          }

          if (printSettings.showServiceCharge && serviceCharge > 0) {
            taxBody += `${"Service:".padEnd(20)}${serviceCharge.toFixed(2).padStart(12)}\n`;
            if (serviceGst > 0)
              taxBody += `${`Serv GST(${serviceGstRate}%):`.padEnd(20)}${serviceGst.toFixed(2).padStart(12)}\n`;
          }
          if (printSettings.showDeliveryCharges && deliveryCharge > 0) {
            taxBody += `${"Delivery:".padEnd(20)}${deliveryCharge.toFixed(2).padStart(12)}\n`;
            if (deliveryGst > 0)
              taxBody += `${`Del GST(${deliveryGstRate}%):`.padEnd(20)}${deliveryGst.toFixed(2).padStart(12)}\n`;
          }
          if (printSettings.showPackagingCharges && packagingCharge > 0) {
            taxBody += `${"Packaging:".padEnd(20)}${packagingCharge.toFixed(2).padStart(12)}\n`;
            if (packagingGst > 0)
              taxBody += `${`Pkg GST(${packagingGstRate}%):`.padEnd(20)}${packagingGst.toFixed(2).padStart(12)}\n`;
          }

          if (printSettings.sepTotalBottom) {
            taxBody += `${line("-")}\n`;
          }
          await printer.write(utf8Encode(taxBody));

          await printer.write(totalSizeCmd);
          await printer.write(totalWeightCmd);
          const totalStr = `Rs.${finalGrandTotal.toFixed(2)}`;
          await printer.write(utf8Encode(`${"TOTAL:".padEnd(32 - totalStr.length)}${totalStr}\n`));
          await printer.write(BOLD_OFF);

          await printer.write(itemsSizeCmd);
          await printer.write(detailsWeightCmd);
          let footerBody = "";
          if (printSettings.sepTotalBottom) {
            footerBody += `${line("-")}\n`;
          }

          // Amount in Words
          if (printSettings.showAmountInWords) {
            const amtWords = numberToWords(Math.round(finalGrandTotal));
            footerBody += `${amtWords} Rupees Only\n`;
          }

          // Payment Status
          if (printSettings.showPaymentStatus) {
            if (printSettings.sepPayment) {
              footerBody += `${line("-")}\n`;
            }
            footerBody += `[ PAID - ${options?.paymentMode || "CASH"} ]\n`;
          }

          await printer.write(utf8Encode(footerBody));

          await printer.write(ALIGN_CENTER);
          await printer.write(greetingSizeCmd);
          await printer.write(greetingWeightCmd);

          // Greetings / Footer
          if (printSettings.showGreetings || printSettings.showVisitAgain) {
            if (printSettings.sepFooter) {
              await printer.write(utf8Encode(line("-") + "\n"));
            }
            if (printSettings.showGreetings) {
              await printer.write(utf8Encode("Thank You! Visit Again\n"));
            }
            if (printSettings.showVisitAgain) {
              await printer.write(utf8Encode("Please visit again soon\n"));
            }
          }
          await printer.write(BOLD_OFF);
          await printer.write(SIZE_NORMAL);

          const upiId = companyInfo?.upi || companyInfo?.upiId;
          if (upiId) {
            await printer.write(utf8Encode(line("-") + "\n"));
            await printer.write(BOLD_ON);
            await printer.write(utf8Encode("SCAN TO PAY\n"));
            await printer.write(BOLD_OFF);
            await printer.write(utf8Encode(`UPI ID: ${upiId}\n`));
            const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${finalGrandTotal.toFixed(2)}&cu=INR`;
            await printQRCode(printer, upiUri);
            await printer.write(utf8Encode("\n"));
          }

          // Google Review QR
          if (printSettings.showReviewQR && reviewLink) {
            await printer.write(utf8Encode(line("-") + "\n"));
            await printer.write(BOLD_ON);
            await printer.write(utf8Encode("Rate Us on Google\n"));
            await printer.write(BOLD_OFF);
            await printQRCode(printer, reviewLink);
            await printer.write(utf8Encode("\n"));
          }

          // Powered By
          if (printSettings.showPoweredBy) {
            await printer.write(utf8Encode(line("-") + "\n"));
            await printer.write(utf8Encode("Powered by Kravy Billing\n"));
          }

          await printer.write(new Uint8Array([0x1b, 0x64, 0x03]));
          await printer.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));
        }
      } catch (err) {
        console.error("❌ Printer Error:", err);
      }

      // 🌐 STEP C: RETRY SYNC IF IT FAILED IN STEP A
      if (!syncSuccess) {
        try {
          const maxRetries = 2;
          let attempt = 0;
          while (attempt < maxRetries && !syncSuccess) {
            attempt++;
            const response = await fetch(url, {
              method: isValidBillId ? "PUT" : "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${finalToken}`,
              },
              body: JSON.stringify({
                items: productsForBackend,
                subtotal: Number(totalTaxable.toFixed(2)),
                taxableAmount: Number(totalTaxable.toFixed(2)),
                itemsSubtotal: Number(subtotal.toFixed(2)),
                tax: Number(totalGst.toFixed(2)),
                total: finalBillTotal,
                paymentMode: options?.paymentMode || "Cash",
                paymentStatus: "Paid",
                isHeld: options?.isHeld ?? false,
                clerkUserId: finalClerkId || finalBusinessId,
                businessId: finalBusinessId,
                orderId: options?.orderId || "",
                customerName: options?.customerName || "Walk-in",
                customerPhone: options?.phone || "",
                customerAddress: options?.customerAddress || "",
                tableName: options?.tableName || "POS",
                roomName: options?.roomName || "",
                tokenNumber: finalTokenNo ? Number(finalTokenNo) : 0,
                source: options?.source || "POS",
                discountAmount: Number(totalDiscount.toFixed(2)),
                discountRate: discountRatePercent,
                calculatedTaxable: Number(totalTaxable.toFixed(2)),
                calculatedGlobalGst: Number(globalGstTotal.toFixed(2)),
                calculatedItemGst: Number(totalItemGstCalculated.toFixed(2)),
                serviceCharge: Number(serviceCharge.toFixed(2)),
                serviceGst: Number(serviceGst.toFixed(2)),
                serviceGstRate: serviceGstRate,
                deliveryCharges: Number(deliveryCharge.toFixed(2)),
                deliveryGst: Number(deliveryGst.toFixed(2)),
                deliveryGstRate: deliveryGstRate,
                packagingCharges: Number(packagingCharge.toFixed(2)),
                packagingGst: Number(packagingGst.toFixed(2)),
                packagingGstRate: packagingGstRate,
                isKotPrinted: true,
                auditNote: options?.notes || "App Order",
              }),
            });
            if (response.ok) {
              syncSuccess = true;
              DeviceEventEmitter.emit("refresh_orders_list");
              DeviceEventEmitter.emit("REFRESH_ORDERS");
              DeviceEventEmitter.emit("REFRESH_DASHBOARD");
            } else {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        } catch (e) {
          console.log("Background sync retry failed:", e);
        }
      }
    })();

    return { status: "success" };
  } catch (e: any) {
    console.log("Bill saving error:", e);
    return { status: "error", error: e.message || "Unknown error" };
  }
}
