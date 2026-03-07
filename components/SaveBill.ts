// @ts-ignore
import { ToastAndroid } from "react-native";

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

    const subtotalVal = Number((total / 1.05).toFixed(2));
    
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

    const data = await res.json();

    if (!res.ok) {
        console.log("❌ Save failed:", data);
        ToastAndroid.show(`❌ Save failed: ${data.error || "Unknown error"}`, ToastAndroid.SHORT);
        return { status: "error", error: data.error };
    }

    ToastAndroid.show("💾 Bill Saved Successfully", ToastAndroid.SHORT);
    return { status: "saved", billNo: data.bill?.billNumber || billNo, total, data };
  } catch (err) {
    console.log("❌ SaveBill Error:", err);
    ToastAndroid.show("❌ Failed to save bill", ToastAndroid.SHORT);
  }
}
