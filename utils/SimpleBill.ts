import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter, Image } from "react-native";
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
};

const line = (char = "-") => char.repeat(32);

// Printer Constants
const ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]);
const ALIGN_LEFT = new Uint8Array([0x1b, 0x61, 0x00]);
const SIZE_LARGE = new Uint8Array([0x1b, 0x21, 0x10]);
const SIZE_NORMAL = new Uint8Array([0x1b, 0x21, 0x00]);
const BOLD_ON = new Uint8Array([0x1b, 0x45, 0x01]);
const BOLD_OFF = new Uint8Array([0x1b, 0x45, 0x00]);

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
    Image.prefetch(url).catch(() => {});
  }
};

export async function SimpleBill(
  cartItems: CartItem[],
  token: string | null | any,
  userClerkId: string | null | any,
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
    const date = new Date();
    const tempBillNo = `NEW-${Date.now().toString().slice(-4)}`;

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
    const globalTaxRate = tS ? tS.rate : parseFloat(sMap["tax_rate"] || "0.00");
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
      : parseFloat(sMap["service_gst_rate"] || "0.00");
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
      : parseFloat(sMap["delivery_gst_rate"] || "0.00");
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
      : parseFloat(sMap["packaging_gst_rate"] || "0.00");

    let totalTaxable = 0;
    let totalGst = 0;
    let subtotal = 0;

    const productsForBackend = cartItems.map((item) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      const qty = Number(item.quantity || 1);
      const lineTotal = unitPrice * qty;
      let itemGstRate = 0;
      const productGst = Number(item.gst || 0);

      if (perProductTaxEnabled && productGst > 0) itemGstRate = productGst;
      else if (isTaxEnabled) itemGstRate = globalTaxRate;
      else if (perProductTaxEnabled) itemGstRate = productGst;

      let taxable = 0,
        gst = 0;
      if (item.taxStatus === "With Tax" || item.taxType === "With Tax") {
        taxable = lineTotal / (1 + itemGstRate / 100);
        gst = lineTotal - taxable;
      } else {
        taxable = lineTotal;
        gst = (lineTotal * itemGstRate) / 100;
      }
      totalTaxable += taxable;
      totalGst += gst;
      subtotal += lineTotal;

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
        total: Number(lineTotal.toFixed(2)),
        taxStatus: item.taxStatus || item.taxType || "With Tax",
      };
    });

    const discountAmount = isDiscountEnabled
      ? totalTaxable * (discountRatePercent / 100)
      : 0;
    const taxableAfterDiscount = totalTaxable - discountAmount;
    const avgGstRate = totalTaxable > 0 ? totalGst / totalTaxable : 0;
    const finalGstAmount = taxableAfterDiscount * avgGstRate;

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
      taxableAfterDiscount +
      finalGstAmount +
      serviceCharge +
      serviceGst +
      deliveryCharge +
      deliveryGst +
      packagingCharge +
      packagingGst;

    // Printing
    const printer: any = await ensurePrinterConnected(options?.silent);
    if (printer) {
      await printer.write(ALIGN_CENTER);
      await printer.write(SIZE_LARGE);
      await printer.write(BOLD_ON);
      await printer.write(
        utf8Encode((companyInfo?.companyName || "KRAVY").toUpperCase() + "\n"),
      );
      await printer.write(BOLD_OFF);
      await printer.write(SIZE_NORMAL);
      if (companyInfo?.businessTagLine)
        await printer.write(utf8Encode(companyInfo.businessTagLine + "\n"));
      await printer.write(utf8Encode(line("=") + "\n"));
      await printer.write(
        utf8Encode((companyInfo?.companyAddress || "") + "\n"),
      );
      if (companyInfo?.gstNumber)
        await printer.write(utf8Encode(`GSTIN: ${companyInfo.gstNumber}\n`));
      await printer.write(utf8Encode(line("-") + "\n"));
      await printer.write(ALIGN_LEFT);

      let body = `Bill No: ${tempBillNo}\nDate: ${date.toLocaleString()}\n`;
      if (options?.tableName) body += `Table: ${options.tableName}\n`;
      if (options?.customerName) body += `Cust: ${options.customerName}\n`;
      await printer.write(utf8Encode(body));

      body = `${line("-")}\nItem         Qty  Price   Total\n${line("-")}\n`;
      productsForBackend.forEach((i) => {
        body += `${i.name.slice(0, 12).padEnd(12)} ${String(i.qty).padStart(3)} ${i.rate.toFixed(2).padStart(6)} ${i.total.toFixed(2).padStart(8)}\n`;
      });
      body += `${line("-")}\n`;
      body += `${"subtotal:".padEnd(20)}${subtotal.toFixed(2).padStart(12)}\n`;
      if (isDiscountEnabled)
        body += `${`Disc (${discountRatePercent}%):`.padEnd(20)}${`-${discountAmount.toFixed(2)}`.padStart(12)}\n`;
      body += `${"Taxable:".padEnd(20)}${taxableAfterDiscount.toFixed(2).padStart(12)}\n`;
      body += `${"GST:".padEnd(20)}${finalGstAmount.toFixed(2).padStart(12)}\n`;
      if (serviceCharge > 0)
        body += `${"Service:".padEnd(20)}${serviceCharge.toFixed(2).padStart(12)}\n`;
      if (deliveryCharge > 0)
        body += `${"Delivery:".padEnd(20)}${deliveryCharge.toFixed(2).padStart(12)}\n`;
      if (packagingCharge > 0)
        body += `${"Packaging:".padEnd(20)}${packagingCharge.toFixed(2).padStart(12)}\n`;
      body += `${line("-")}\n`;
      body += `${"TOTAL:".padEnd(20)}${finalGrandTotal.toFixed(2).padStart(12)}\n`;
      body += `${line("-")}\n`;
      await printer.write(utf8Encode(body));

      const upiId = companyInfo?.upiId || companyInfo?.upi;
      if (upiId) {
        const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyInfo?.companyName || "KRAVY")}&am=${finalGrandTotal.toFixed(2)}&cu=INR`;
        await printer.write(ALIGN_CENTER);
        await printQRCode(printer, upiUri);
      }
      await printer.write(ALIGN_CENTER);
      await printer.write(utf8Encode("Thank You! Visit Again\n"));
      await printer.write(new Uint8Array([0x1b, 0x64, 0x03]));
      await printer.write(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));
    }

    // Backend Save
    const discountFactor =
      totalTaxable > 0 ? (totalTaxable - discountAmount) / totalTaxable : 1;
    const discountedItems = productsForBackend.map((item) => {
      const dTaxable = Number((item.taxableAmount * discountFactor).toFixed(2));
      const dGst = Number((item.gstPaid * discountFactor).toFixed(2));
      return {
        ...item,
        taxableAmount: dTaxable,
        gstPaid: dGst,
        total: Number((dTaxable + dGst).toFixed(2)),
      };
    });

    const finalItemsGst = discountedItems.reduce(
      (sum, it) => sum + (Number(it.gstPaid) || 0),
      0,
    );
    const finalBillTax = Number(
      (finalItemsGst + serviceGst + deliveryGst + packagingGst).toFixed(2),
    );
    const finalBillTotal = Number(finalGrandTotal.toFixed(2));

    const url = options?.billId
      ? `https://billing.kravy.in/api/bill-manager/${options.billId}`
      : "https://billing.kravy.in/api/bill-manager";

    const response = await fetch(url, {
      method: options?.billId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${finalToken}`,
      },
      body: JSON.stringify({
        items: discountedItems,
        subtotal: Number(subtotal.toFixed(2)),
        tax: finalBillTax,
        gstAmount: Number(finalItemsGst.toFixed(2)),
        total: finalBillTotal,
        paymentMode: options?.paymentMode || "Cash",
        paymentStatus: "Paid",
        isHeld: false,
        clerkUserId: finalClerkId || finalBusinessId,
        userClerkId: finalClerkId || finalBusinessId,
        businessId: finalBusinessId,
        orderId: options?.orderId || null,
        customerName: options?.customerName || "Walk-in",
        customerPhone: options?.phone || null,
        tableName: options?.tableName || "POS",
        roomName: options?.roomName || null,
        tokenNumber: options?.tokenNo ? Number(options.tokenNo) : null,
        source: options?.source || "POS",
        discountAmount: Number(discountAmount.toFixed(2)),
        serviceCharge: Number(serviceCharge.toFixed(2)),
        serviceGst: Number(serviceGst.toFixed(2)),
        deliveryCharge: Number(deliveryCharge.toFixed(2)),
        deliveryGst: Number(deliveryGst.toFixed(2)),
        packagingCharge: Number(packagingCharge.toFixed(2)),
        packagingGst: Number(packagingGst.toFixed(2)),
        isKotPrinted: true,
        auditNote: options?.notes || "App Order",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bill Save Failed:", response.status, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    DeviceEventEmitter.emit("refresh_orders_list");
    DeviceEventEmitter.emit("REFRESH_DASHBOARD");
    return { status: "success" };
  } catch (e: any) {
    console.log("Bill saving error:", e);
    return { status: "error", error: e.message };
  }
}
