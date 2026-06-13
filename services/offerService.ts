import { BACKEND_URL } from "./menuService";

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  currentUsage: number;
  buyItemId: string | null;
  buyQty: number | null;
  getItemOffId: string | null;
  getQty: number | null;
  getDiscount: number | null;
  isActive: boolean;
}

export const offerService = {
  getOffers: async (token: string, businessId?: string | null): Promise<Offer[]> => {
    const url = businessId
      ? `${BACKEND_URL}/api/admin/offers?businessId=${businessId}`
      : `${BACKEND_URL}/api/admin/offers`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch offers");
    return await response.json();
  },

  createOffer: async (token: string, offerData: any, businessId?: string | null) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/offers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...offerData, businessId }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create offer");
    }
    return await response.json();
  },

  updateOffer: async (token: string, offerId: string, offerData: any, businessId?: string | null) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/offers/${offerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...offerData, businessId }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to update offer");
    }
    return await response.json();
  },

  deleteOffer: async (token: string, offerId: string) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/offers/${offerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to delete offer");
    return await response.json();
  },
};
