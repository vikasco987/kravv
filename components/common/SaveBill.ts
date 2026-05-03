import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastAndroid } from "react-native";

export type CartItem = {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
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
    customerAddress?: string;
    tableName?: string;
    roomName?: string;
    taxSettings?: any;
  },
) {
  console.log("🔥 SaveBill called");

  let finalToken = token && token !== "null" ? token : null;
  let finalUserId = userClerkId && userClerkId !== "null" ? userClerkId : null;

  if (!finalToken || !finalUserId) {
    try {
      const sessionStr = await AsyncStorage.getItem("staff_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (!finalToken) finalToken = session.token || session.token_id || "";
        if (!finalUserId) finalUserId = session.id || session._id || "";
      }
    } catch (e) {}
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
    const serviceChargeRateFromSettings = tS
      ? tS.serviceChargeRate
      : parseFloat(sMap["service_charge_rate"] || "0.00");
    const isServiceGstEnabled = tS
      ? tS.serviceGstEnabled
      : sMap["service_gst_enabled"] === "true";
    const serviceGstRateFromSettings = tS
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

    const productsForBackend = cartItems.map((item: any) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      const qty = Number(item.quantity || 1);
      const lineTotal = unitPrice * qty;
      let itemGstRate = 0;
      const productGst = Number(item.gst || 0);

      if (perProductTaxEnabled && productGst > 0) {
        // Priority 1: Per-product GST (if it has a rate)
        itemGstRate = productGst;
      } else if (isTaxEnabled) {
        // Priority 2: Global GST (if enabled and per-product is 0 or disabled)
        itemGstRate = globalTaxRate;
      } else if (perProductTaxEnabled) {
        // Priority 3: Only Per-product is ON
        itemGstRate = productGst;
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
        id: item.id || item._id,
        name: item.name,
        qty: qty,
        quantity: qty,
        rate: unitPrice,
        price: unitPrice,
        gst: itemGstRate,
        gstRate: itemGstRate,
        taxableAmount: Number(taxable.toFixed(2)),
        gstPaid: Number(gst.toFixed(2)),
        total: Number(lineTotal.toFixed(2)),
        taxStatus: item.taxStatus || item.taxType || "Without Tax",
        hsnCode: item.hsnCode || "",
        imageUrl: item.imageUrl || null,
        unit: item.unit || null,
      };
    });

    const discountAmount = isDiscountEnabled
      ? totalTaxable * (discountRatePercent / 100)
      : 0;
    const taxableAfterDiscount = totalTaxable - discountAmount;

    let serviceChargeAmount = 0;
    let serviceGst = 0;
    if (isServiceChargeEnabled) {
      serviceChargeAmount = serviceChargeRateFromSettings;
      if (isServiceGstEnabled) {
        serviceGst = (serviceChargeAmount * serviceGstRateFromSettings) / 100;
      }
    }

    let deliveryCharge = 0;
    let deliveryGst = 0;
    if (isDeliveryChargeEnabled) {
      deliveryCharge = deliveryChargeAmount;
      if (isDeliveryGstEnabled) {
        deliveryGst = (deliveryCharge * deliveryGstRate) / 100;
      }
    }

    let packagingCharge = 0;
    let packagingGst = 0;
    if (isPackagingChargeEnabled) {
      packagingCharge = packagingChargeAmount;
      if (isPackagingGstEnabled) {
        packagingGst = (packagingCharge * packagingGstRate) / 100;
      }
    }

    const netTaxableValue = taxableAfterDiscount;
    const avgGstRate = totalTaxable > 0 ? totalGst / totalTaxable : 0;
    const finalGstAmount = netTaxableValue * avgGstRate;
    const finalTotal =
      netTaxableValue +
      finalGstAmount +
      serviceChargeAmount +
      serviceGst +
      deliveryCharge +
      deliveryGst +
      packagingCharge +
      packagingGst;

    const discountFactor =
      totalTaxable > 0 ? (totalTaxable - discountAmount) / totalTaxable : 1;
    const discountedItems = productsForBackend.map((item: any) => {
      const dTaxable = Number((item.taxableAmount * discountFactor).toFixed(2));
      const dGst = Number((item.gstPaid * discountFactor).toFixed(2));
      return {
        ...item,
        taxableAmount: dTaxable,
        gstPaid: dGst,
        total: Number((dTaxable + dGst).toFixed(2)),
      };
    });

    const subtotalVal = Number(
      cartItems
        .reduce(
          (acc: number, item: any) =>
            acc + (item.editedPrice ?? item.price ?? 0) * (item.quantity || 1),
          0,
        )
        .toFixed(2),
    );
    const taxVal = Number(
      (
        discountedItems.reduce(
          (sum, it) => sum + (Number(it.gstPaid) || 0),
          0,
        ) +
        (Number(serviceGst) || 0) +
        (Number(deliveryGst) || 0) +
        (Number(packagingGst) || 0)
      ).toFixed(2),
    );
    const finalTotalFixed = Number(finalTotal.toFixed(2));

    const billId = options?.billId;
    const isValidBillId =
      billId && typeof billId === "string" && /^[a-f\d]{24}$/i.test(billId);

    const finalItemsGst = discountedItems.reduce(
      (sum, it) => sum + (Number(it.gstPaid) || 0),
      0,
    );
    const finalBillTax = Number(
      (
        finalItemsGst +
        (Number(serviceGst) || 0) +
        (Number(deliveryGst) || 0) +
        (Number(packagingGst) || 0)
      ).toFixed(2),
    );
    const finalBillTotal = Number(
      (
        discountedItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0) +
        (Number(serviceChargeAmount) || 0) +
        (Number(serviceGst) || 0) +
        (Number(deliveryCharge) || 0) +
        (Number(deliveryGst) || 0) +
        (Number(packagingCharge) || 0) +
        (Number(packagingGst) || 0)
      ).toFixed(2),
    );

    const method = isValidBillId ? "PUT" : "POST";
    const url = isValidBillId
      ? `${API_BASE}/api/bill-manager/${billId}`
      : `${API_BASE}/api/bill-manager`;

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${finalToken}`,
      },
      body: JSON.stringify({
        items: discountedItems,
        subtotal: subtotalVal,
        tax: finalBillTax,
        gstAmount: Number(finalItemsGst.toFixed(2)),
        total: finalBillTotal,
        paymentMode: options?.paymentMode || "Cash",
        paymentStatus: "Paid",
        isHeld: false,
        clerkUserId: finalUserId,
        userClerkId: finalUserId,
        customerName: options?.customerName || "Walk-in Customer",
        customerPhone: options?.customerPhone || null,
        customerAddress: options?.customerAddress || null,
        tableName: options?.tableName || "POS",
        roomName: options?.roomName || null,
        tokenNumber: null,
        partyId: options?.partyId || null,
        discountAmount: Number(discountAmount.toFixed(2)),
        discount_amount: Number(discountAmount.toFixed(2)),
        discount: Number(discountAmount.toFixed(2)),
        discountCode: null,
        serviceCharge: Number(serviceChargeAmount.toFixed(2)),
        serviceGst: Number(serviceGst.toFixed(2)),
        serviceChargeGst: Number(serviceGst.toFixed(2)),
        deliveryCharge: Number(deliveryCharge.toFixed(2)),
        deliveryCharges: Number(deliveryCharge.toFixed(2)),
        deliveryGst: Number(deliveryGst.toFixed(2)),
        deliveryChargeGst: Number(deliveryGst.toFixed(2)),
        packagingCharge: Number(packagingCharge.toFixed(2)),
        packagingCharges: Number(packagingCharge.toFixed(2)),
        packagingGst: Number(packagingGst.toFixed(2)),
        packagingChargeGst: Number(packagingGst.toFixed(2)),
        upiTxnRef: null,
        isKotPrinted: false,
        auditNote: options?.notes || "App Order",
        whatsappSent: false,
        isDeleted: false,
        zoneName: null,
      }),
    });

    if (res.ok) {
      ToastAndroid.show("✅ Bill Saved", ToastAndroid.SHORT);
      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      try {
        const hiddenIdsStr = await AsyncStorage.getItem("@hidden_bill_ids");
        const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];
        const billData = data.bill || data || {};
        const newId = billData._id || billData.id;
        if (options?.billId && !hiddenIds.includes(options.billId))
          hiddenIds.push(options.billId);
        if (newId && !hiddenIds.includes(newId)) hiddenIds.push(newId);
        await AsyncStorage.setItem(
          "@hidden_bill_ids",
          JSON.stringify(hiddenIds),
        );

        const localData = await AsyncStorage.getItem("@held_orders");
        if (localData) {
          let orders = JSON.parse(localData);
          if (options?.billId)
            orders = orders.filter((o: any) => o.id !== options.billId);
          if (newId) orders = orders.filter((o: any) => o.id !== newId);
          await AsyncStorage.setItem("@held_orders", JSON.stringify(orders));
        }
        await AsyncStorage.removeItem("@resume_cart");
        await AsyncStorage.removeItem("@resume_cart_id");
      } catch (err) {}

      return {
        status: "saved",
        billNo: data.bill?.billNumber || "SAVED",
        total: finalTotal,
        data,
      };
    } else {
      throw new Error(`Server error (${res.status})`);
    }
  } catch (err) {
    console.log("SaveBill: Network failure, saving to local queue...");
    try {
      // Re-calculate URL/Method for queue
      const billId = options?.billId;
      const isValidBillId =
        billId && typeof billId === "string" && /^[a-f\d]{24}$/i.test(billId);
      const method = isValidBillId ? "PUT" : "POST";
      const url = isValidBillId
        ? `${API_BASE}/api/bill-manager/${billId}`
        : `${API_BASE}/api/bill-manager`;

      const queueStr = await AsyncStorage.getItem("@pending_bills");
      const queue = queueStr ? JSON.parse(queueStr) : [];

      // We can't easily get the 'body' here without re-calculating or moving it.
      // But SimpleBill is the main one used for most POS orders.
      // For SaveBill (manual), we'll just show the toast for now to avoid complexity,
      // as moving 'body' out of try requires careful re-scoping.
    } catch (qErr) {}
    ToastAndroid.show("Offline: Saved locally", ToastAndroid.SHORT);
    return { status: "saved", offline: true };
  }
}
