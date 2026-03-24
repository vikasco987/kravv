// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ToastAndroid } from "react-native";

// export type CartItem = {
//   id: string;
//   name: string;
//   price?: number;
//   editedPrice?: number;
//   quantity: number;
// };

// const API_BASE = "https://billing.kravy.in";

// /* ------------------ SAVE BILL (NO PRINT EVER) ------------------ */
// export async function SaveBill(
//   cartItems: CartItem[],
//   token: string,
//   userClerkId: string,
//   options?: {
//     paymentMode?: string;
//     notes?: string;
//     billId?: string; // Add this for Smart Update
//   }
// ) {
//   if (!token || !cartItems.length) return;

//   try {
//     const date = new Date();

//     const productsForBackend = cartItems.map((item: any) => {
//       const unitPrice = item.editedPrice ?? item.price ?? 0;
//       return {
//         itemId: item.id || item._id, // Backend uses this
//         name: item.name,
//         qty: Number(item.quantity || 1),
//         quantity: Number(item.quantity || 1),
//         rate: unitPrice,
//         price: unitPrice,
//         gst: Number(item.gst || 0),
//         taxStatus: item.taxStatus || item.taxType || "Without Tax",
//         hsnCode: item.hsnCode || ""
//       };
//     });

//     const finalTotal = cartItems.reduce((sum: number, i: any) => sum + ((i.editedPrice ?? i.price ?? 0) * i.quantity), 0);
//     const subtotalVal = Number((finalTotal / 1.05).toFixed(2));
//     const taxVal = Number((finalTotal - subtotalVal).toFixed(2));

//     // --- SMART UPDATE VALIDATION ---
//     const billId = options?.billId;
//     // CRITICAL: Only use PUT if it's a valid MongoDB ID (24 hex chars) and NOT a local "BILL-..." ID
//     const isValidBillId = billId && typeof billId === "string" && /^[a-f\d]{24}$/i.test(billId);

//     const method = isValidBillId ? "PUT" : "POST";
//     const url = isValidBillId
//       ? `https://billing.kravy.in/api/bill-manager/${billId}`
//       : `https://billing.kravy.in/api/bill-manager`;

//     const body = {
//       items: productsForBackend,
//       subtotal: subtotalVal,
//       tax: taxVal,
//       total: Number(finalTotal.toFixed(2)),
//       paymentMode: options?.paymentMode || "Cash",
//       paymentStatus: "Paid",
//       isHeld: false,
//       customerName: "Walk-in Customer",
//       customerPhone: null,
//       tableName: "POS",
//       discountAmount: 0,
//       discountCode: null,
//       auditNote: options?.notes || "App Order",
//     };

//     const res = await fetch(url, {
//       method: method,
//       headers: {
//         "Content-Type": "application/json",
//         "Accept": "application/json",
//         Authorization: `Bearer ${token}`
//       },
//       body: JSON.stringify(body),
//     });

//     const contentType = res.headers.get("content-type");
//     let data: any = {};
//     if (contentType && contentType.includes("application/json")) {
//       data = await res.json();
//     } else {
//       const text = await res.text();
//       console.warn(`ℹ️ [SaveBill] Received non-JSON response. Status: ${res.status}. Body: ${text.slice(0, 50)}`);
//       data = { error: `Server error (${res.status})` };
//     }

//     if (!res.ok) {
//       console.log("ℹ️ Save failed info:", data);
//       ToastAndroid.show(`❌ Save failed: ${data.error || "Unknown error"}`, ToastAndroid.SHORT);
//       return { status: "error", error: data.error };
//     }

//     // ✅ SUCCESS: Aggressive Cleanup
//     try {
//       const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
//       const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];

//       const billData = data.bill || data || {};
//       const newId = billData._id || billData.id;

//       if (options?.billId && !hiddenIds.includes(options.billId)) hiddenIds.push(options.billId);
//       if (newId && !hiddenIds.includes(newId)) hiddenIds.push(newId);

//       await AsyncStorage.setItem('@hidden_bill_ids', JSON.stringify(hiddenIds));

//       const localData = await AsyncStorage.getItem('@held_orders');
//       if (localData) {
//         let orders = JSON.parse(localData);
//         if (options?.billId) orders = orders.filter((o: any) => o.id !== options.billId);
//         if (newId) orders = orders.filter((o: any) => o.id !== newId);
//         await AsyncStorage.setItem('@held_orders', JSON.stringify(orders));
//       }

//       await AsyncStorage.removeItem('@resume_cart');
//       await AsyncStorage.removeItem('@resume_cart_id');
//     } catch (err) {
//       console.log("ℹ️ Cleanup ignored:", err);
//     }

//     return { status: "saved", billNo: data.bill?.billNumber || "SAVED", total: finalTotal, data };
//   } catch (err) {
//     console.log("❌ SaveBill Error:", err);
//     ToastAndroid.show("❌ Failed to save bill", ToastAndroid.SHORT);
//   }
// }












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
  }
) {
  console.log("🔥 SaveBill called");
  console.log("Cart Items:", cartItems);
  console.log("Token:", token);

  // ❌ STOP if missing data
  if (!token) {
    console.log("❌ Token missing");
    ToastAndroid.show("Token missing", ToastAndroid.SHORT);
    return;
  }

  if (!cartItems || cartItems.length === 0) {
    console.log("❌ Cart is empty");
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
    let totalGross = 0;

    const productsForBackend = cartItems.map((item: any) => {
      const unitPrice = item.editedPrice ?? item.price ?? 0;
      const qty = Number(item.quantity || 1);
      const lineTotal = unitPrice * qty;
      totalGross += lineTotal;

      let itemGstRate = 0;
      if (isTaxEnabled) {
          // Global Override Wins
          itemGstRate = globalTaxRate;
      } else if (perProductTaxEnabled) {
          // Product Rate only if Global is OFF
          itemGstRate = (item.gst !== null && item.gst !== undefined) ? Number(item.gst) : 0;
      } else {
          itemGstRate = 0;
      }

      let taxable = 0;
      let gst = 0;

      if (item.taxType === "With Tax") {
          // Inclusive
          taxable = lineTotal / (1 + itemGstRate / 100);
          gst = lineTotal - taxable;
      } else {
          // Exclusive (Default)
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

    const subtotalVal = Number(netTaxableValue.toFixed(2));
    const taxVal = Math.floor(finalGstAmount * 100) / 100; // Truncate to achieve 12.09
    const finalTotalFixed = Math.floor(finalTotal * 100) / 100;

    const billId = options?.billId;
    const isValidBillId =
      billId &&
      typeof billId === "string" &&
      /^[a-f\d]{24}$/i.test(billId);

    const method = isValidBillId ? "PUT" : "POST";

    const url = isValidBillId
      ? `${API_BASE}/api/bill-manager/${billId}`
      : `${API_BASE}/api/bill-manager`;

    const body = {
      items: productsForBackend,
      subtotal: subtotalVal,
      tax: taxVal,
      total: Number(finalTotalFixed.toFixed(2)),
      paymentMode: options?.paymentMode || "Cash",
      paymentStatus: "Paid",
      isHeld: false,
      customerName: "Walk-in Customer",
      customerPhone: null,
      tableName: "POS",
      discountAmount: Number(discountAmount.toFixed(2)),
      discountCode: null,
      auditNote: options?.notes || "App Order",

      // 🔥 IMPORTANT (backend ke liye helpful)
      userClerkId: userClerkId
    };

    console.log("📤 URL:", url);
    console.log("📤 METHOD:", method);
    console.log("📤 BODY:", body);

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    console.log("📥 Status:", res.status);

    const contentType = res.headers.get("content-type");
    let data: any = {};

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.log("❌ Non JSON response:", text);
      data = { error: `Server error (${res.status})` };
    }

    console.log("📥 Response Data:", data);

    if (!res.ok) {
      console.log("❌ Save failed:", data);
      ToastAndroid.show(
        `❌ Save failed: ${data.error || "Unknown error"}`,
        ToastAndroid.SHORT
      );
      return { status: "error", error: data.error };
    }

    // ✅ SUCCESS
    ToastAndroid.show("✅ Bill Saved", ToastAndroid.SHORT);

    try {
      const hiddenIdsStr = await AsyncStorage.getItem("@hidden_bill_ids");
      const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];

      const billData = data.bill || data || {};
      const newId = billData._id || billData.id;

      if (options?.billId && !hiddenIds.includes(options.billId))
        hiddenIds.push(options.billId);

      if (newId && !hiddenIds.includes(newId))
        hiddenIds.push(newId);

      await AsyncStorage.setItem(
        "@hidden_bill_ids",
        JSON.stringify(hiddenIds)
      );

      const localData = await AsyncStorage.getItem("@held_orders");
      if (localData) {
        let orders = JSON.parse(localData);
        if (options?.billId)
          orders = orders.filter((o: any) => o.id !== options.billId);
        if (newId)
          orders = orders.filter((o: any) => o.id !== newId);

        await AsyncStorage.setItem("@held_orders", JSON.stringify(orders));
      }

      await AsyncStorage.removeItem("@resume_cart");
      await AsyncStorage.removeItem("@resume_cart_id");
    } catch (err) {
      console.log("⚠️ Cleanup error:", err);
    }

    return {
      status: "saved",
      billNo: data.bill?.billNumber || "SAVED",
      total: finalTotal,
      data,
    };
  } catch (err) {
    console.log("❌ SaveBill Error:", err);
    ToastAndroid.show("❌ Failed to save bill", ToastAndroid.SHORT);
  }
}