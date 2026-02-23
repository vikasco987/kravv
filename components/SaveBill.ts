// @ts-ignore
import { ToastAndroid } from "react-native";

export type CartItem = {
  id: string;
  name: string;
  price?: number;
  editedPrice?: number;
  quantity: number;
};

const API_BASE = "https://billing-backend-sable.vercel.app";

/* ------------------ SAVE BILL (NO PRINT EVER) ------------------ */
export async function SaveBill(
  cartItems: CartItem[],
  token: string,
  userClerkId: string,
  options?: {
    paymentMode?: string;
    notes?: string;
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

    await fetch(`${API_BASE}/api/billing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userClerkId,
        billNo,
        products,
        total,
        grandTotal: total,
        gst: 0,
        discount: 0,
        paymentMode: options?.paymentMode || "CASH",
        paymentStatus: "PAID",
        notes: options?.notes || "",
        date: date.toISOString(),
      }),
    });

    ToastAndroid.show("💾 Bill Saved Successfully", ToastAndroid.SHORT);

    return { status: "saved", billNo, total };
  } catch (err) {
    console.log("❌ SaveBill Error:", err);
    ToastAndroid.show("❌ Failed to save bill", ToastAndroid.SHORT);
  }
}
