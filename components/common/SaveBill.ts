import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastAndroid } from "react-native";

export type CartItem = {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
};

const API_BASE = "https://billing.kravy.in";

/* ------------------ SAVE BILL ------------------ */
export async function SaveBill(
  cartItems: CartItem[],
  token: string,
  userClerkId: string,
  options?: {
    paymentMode?: string;
    notes?: string;
    billId?: string;
    partyId?: string;
    customerName?: string;
    customerPhone?: string;
  }
) {
  console.log("🔥 SaveBill called");

  let finalToken = (token && token !== "null") ? token : null;
  let finalUserId = (userClerkId && userClerkId !== "null") ? userClerkId : null;

  if (!finalToken || !finalUserId) {
    try {
      const sessionStr = await AsyncStorage.getItem('staff_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (!finalToken) finalToken = session.token || session.token_id || "";
        if (!finalUserId) finalUserId = session.id || session._id || "";
      }
    } catch (e) { }
  }

  if (!finalToken || finalToken === "") {
    console.error("SaveBill: Missing Token", { finalToken, finalUserId });
    ToastAndroid.show("Token missing", ToastAndroid.SHORT);
    return;
  }

  if (!cartItems || cartItems.length === 0) {
    ToastAndroid.show("Cart is empty", ToastAndroid.SHORT);
    return;
  }

  try {
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

    const productsForBackend = cartItems.map((item: any) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      const qty = Number(item.quantity || 1);
      const lineTotal = unitPrice * qty;

      let itemGstRate = 0;
      if (isTaxEnabled) {
        itemGstRate = globalTaxRate;
      } else if (perProductTaxEnabled) {
        itemGstRate = (item.gst !== null && item.gst !== undefined) ? Number(item.gst) : 0;
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
        itemId: item.id || item._id,
        name: item.name,
        qty: qty,
        quantity: qty,
        rate: unitPrice,
        price: unitPrice,
        gst: itemGstRate,
        taxStatus: (item.taxStatus || item.taxType || "Without Tax"),
        hsnCode: (item.hsnCode || "")
      };
    });

    const discountAmount = isDiscountEnabled ? (totalTaxable * (discountRatePercent / 100)) : 0;
    const taxableAfterDiscount = totalTaxable - discountAmount;
    const serviceChargeAmount = isServiceChargeEnabled ? (taxableAfterDiscount * (serviceChargeRatePercent / 100)) : 0;
    const netTaxableValue = taxableAfterDiscount + serviceChargeAmount;

    const avgGstRate = totalTaxable > 0 ? (totalGst / totalTaxable) : 0;
    const finalGstAmount = netTaxableValue * avgGstRate;
    const finalTotal = netTaxableValue + finalGstAmount;

    const subtotalVal = Number(netTaxableValue.toFixed(2));
    const taxVal = Math.floor(finalGstAmount * 100) / 100;
    const finalTotalFixed = Math.floor(finalTotal * 100) / 100;

    const billId = options?.billId;
    const isValidBillId = billId && typeof billId === "string" && /^[a-f\d]{24}$/i.test(billId);

    const method = isValidBillId ? "PUT" : "POST";
    const url = isValidBillId ? `${API_BASE}/api/bill-manager/${billId}` : `${API_BASE}/api/bill-manager`;

    const body = {
      items: productsForBackend,
      subtotal: subtotalVal,
      tax: taxVal,
      total: Number(finalTotalFixed.toFixed(2)),
      paymentMode: options?.paymentMode || "Cash",
      paymentStatus: "Paid",
      isHeld: false,
      customerName: options?.customerName || "Walk-in Customer",
      customerPhone: options?.customerPhone || null,
      tableName: "POS",
      discountAmount: Number(discountAmount.toFixed(2)),
      discountCode: null,
      auditNote: options?.notes || "App Order",
      userClerkId: finalUserId,
      customerId: options?.partyId || null,
      partyId: options?.partyId || null
    };

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${finalToken}`,
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type");
    let data: any = {};
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      ToastAndroid.show(`❌ Save failed: ${data.error || "Unknown error"}`, ToastAndroid.SHORT);
      return { status: "error", error: data.error };
    }

    ToastAndroid.show("✅ Bill Saved", ToastAndroid.SHORT);

    try {
      const hiddenIdsStr = await AsyncStorage.getItem("@hidden_bill_ids");
      const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];
      const billData = data.bill || data || {};
      const newId = billData._id || billData.id;
      if (options?.billId && !hiddenIds.includes(options.billId)) hiddenIds.push(options.billId);
      if (newId && !hiddenIds.includes(newId)) hiddenIds.push(newId);
      await AsyncStorage.setItem("@hidden_bill_ids", JSON.stringify(hiddenIds));

      const localData = await AsyncStorage.getItem("@held_orders");
      if (localData) {
        let orders = JSON.parse(localData);
        if (options?.billId) orders = orders.filter((o: any) => o.id !== options.billId);
        if (newId) orders = orders.filter((o: any) => o.id !== newId);
        await AsyncStorage.setItem("@held_orders", JSON.stringify(orders));
      }
      await AsyncStorage.removeItem("@resume_cart");
      await AsyncStorage.removeItem("@resume_cart_id");
    } catch (err) { }

    return { status: "saved", billNo: data.bill?.billNumber || "SAVED", total: finalTotal, data };
  } catch (err) {
    ToastAndroid.show("❌ Failed to save bill", ToastAndroid.SHORT);
  }
}
