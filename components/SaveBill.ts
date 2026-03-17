import { ToastAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartItem = {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
};

const API_BASE = "https://billing.kravy.in";

/* ------------------ SAVE BILL (NO PRINT EVER) ------------------ */
export async function SaveBill(
  cartItems: CartItem[],
  token: string,
  userClerkId: string,
  options?: {
    paymentMode?: string;
    notes?: string;
    billId?: string; // Add this for Smart Update
  }
) {
  if (!token || !cartItems.length) return;

  try {
    const date = new Date();
    const billNo = "MS-" + Math.floor(10000 + Math.random() * 90000);

    const products = cartItems.map((i) => {
      const finalPrice = i.editedPrice ?? i.price ?? 0;

      return {
        productId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: finalPrice,
        originalPrice: i.price ?? 0,
        total: finalPrice * i.quantity,
      };
    });

    const total = products.reduce((s, p) => s + p.total, 0);

    // --- Load Tax Settings ---
    const isTaxEnabled = (await AsyncStorage.getItem('tax_enabled')) === 'true';
    const taxRate = parseFloat((await AsyncStorage.getItem('tax_rate')) || "5.00");
    const gstRateDecimal = isTaxEnabled ? (taxRate / 100) : 0;
    
    const subtotalVal = Number((total / (1 + gstRateDecimal)).toFixed(2));
    
    // Smart Update: Use PUT if billId exists
    const method = options?.billId ? "PUT" : "POST";
    const url = options?.billId 
      ? `${API_BASE}/api/bill-manager/${options.billId}`
      : `${API_BASE}/api/bill-manager`;

    const res = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: products,
        subtotal: subtotalVal,
        total: total,
        paymentMode: options?.paymentMode === "UPI" || options?.paymentMode === "Card" ? options.paymentMode : "Cash",
        paymentStatus: "Paid",
        isHeld: false,
        upiTxnRef: null,
        customerName: "Walk-in",
        customerPhone: null,
      }),
    });

    const contentType = res.headers.get("content-type");
    let data: any = {};
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.warn(`ℹ️ [SaveBill] Received non-JSON response. Status: ${res.status}. Body: ${text.slice(0, 50)}`);
      data = { error: `Server error (${res.status})` };
    }

    if (!res.ok) {
        console.log("ℹ️ Save failed info:", data);
        ToastAndroid.show(`❌ Save failed: ${data.error || "Unknown error"}`, ToastAndroid.SHORT);
        return { status: "error", error: data.error };
    }

    // ✅ SUCCESS: Aggressive Cleanup
    try {
      const hiddenIdsStr = await AsyncStorage.getItem('@hidden_bill_ids');
      const hiddenIds = hiddenIdsStr ? JSON.parse(hiddenIdsStr) : [];
      
      const billData = data.bill || data;
      const newId = billData._id || billData.id;
      const newNo = billData.billNumber;

      // 1. Hide the original held ID (if any)
      if (options?.billId && !hiddenIds.includes(options.billId)) {
        hiddenIds.push(options.billId);
      }

      // 2. Hide the newly created bill info from Hold list just in case
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
    } catch (err) {
      console.log("ℹ️ Cleanup ignored:", err);
    }

    return { status: "saved", billNo: data.bill?.billNumber || billNo, total, data };
  } catch (err) {
    console.log("❌ SaveBill Error:", err);
    ToastAndroid.show("❌ Failed to save bill", ToastAndroid.SHORT);
  }
}
