const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://billing.kravy.in";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Fetch company profile data from backend.
 */
export async function getRecentCompanyProfile(token: string) {
  try {
    if (!token) {
      return null;
    }

    const res = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType || !contentType.includes("application/json")) {
      return null;
    }

    const data: any = await res.json();
    if (!data) return null;

    const profile = {
      businessId: data._id || data.id || "",
      userId: data.userId || "",
      companyName: (data.businessName as string) || "",
      companyAddress: (data.businessAddress as string) || "",
      companyPhone: (data.contactPersonPhone as string) || "",
      contactPerson: (data.contactPersonName as string) || "",
      gstNumber: (data.gstNumber as string) || "",
      logoUrl:
        (data.logoUrl as string) || (data.profileImageUrl as string) || "",
      signatureUrl: (data.signatureUrl as string) || "",
      businessTagLine: (data.businessTagLine as string) || "",
      upi: (data.upi as string) || "",
      upiId: (data.upiId as string) || "",
      businessType: (data.businessType as string) || "",
      email: (data.email as string) || "",
      state: (data.state as string) || "",
      pinCode: (data.pinCode as string) || "",
      googleReviewLink: (data.googleReviewLink as string) || "",
      fssaiNumber: (data.fssaiNumber as string) || "",
      // Sync tax settings properties
      taxEnabled: data.taxEnabled,
      perProductTaxEnabled: data.perProductTaxEnabled,
      taxInclusive: data.taxInclusive,
      qrMenuPriceInclusive: data.qrMenuPriceInclusive,
      taxRate: data.taxRate,
      enableDeliveryCharges: data.enableDeliveryCharges,
      deliveryChargeAmount: data.deliveryChargeAmount,
      deliveryGstEnabled: data.deliveryGstEnabled,
      deliveryGstRate: data.deliveryGstRate,
      enablePackagingCharges: data.enablePackagingCharges,
      packagingChargeAmount: data.packagingChargeAmount,
      packagingGstEnabled: data.packagingGstEnabled,
      packagingGstRate: data.packagingGstRate,
      enableServiceCharges: data.enableServiceCharges,
      serviceChargeAmount: data.serviceChargeAmount,
      serviceGstEnabled: data.serviceGstEnabled,
      serviceGstRate: data.serviceGstRate,
      discountEnabled: data.discountEnabled,
      discountRate: data.discountRate,
      multiZoneMenuEnabled: data.multiZoneMenuEnabled,
      // Customer Setup Fields
      collectCustomerName: data.collectCustomerName ?? true,
      requireCustomerName: data.requireCustomerName ?? false,
      collectCustomerPhone: data.collectCustomerPhone ?? true,
      requireCustomerPhone: data.requireCustomerPhone ?? false,
      collectCustomerAddress: data.collectCustomerAddress ?? false,
      requireCustomerAddress: data.requireCustomerAddress ?? false,
      isOnline: data.isOnline ?? true,
      openingTime: data.openingTime ?? "00:00",
      closingTime: data.closingTime ?? "23:59",
      offlineMessage: data.offlineMessage ?? "Restaurant is currently closed or not accepting orders.",
      // Print Settings
      printSettings: data.printSettings || null,
      // SaaS Overrides
      isPremium: data.isPremium,
      showPremiumPopup: data.showPremiumPopup,
      isFrozen: data.isFrozen,
      trialStartedAt: data.trialStartedAt,
    };

    // DO NOT overwrite @active_business_id here, as it overrides user's manual selection
    // if (profile.businessId) {
    //   await AsyncStorage.setItem("@active_business_id", profile.businessId);
    // }
    await AsyncStorage.setItem(
      "@cached_company_profile",
      JSON.stringify(profile),
    );
    return profile;
  } catch (err: any) {
    const cached = await AsyncStorage.getItem("@cached_company_profile");
    if (cached) return JSON.parse(cached);

    if (err.message === "Network request failed") {
      // Offline but no cache - only then show alert or just return null
      console.log("Offline and no cached profile available");
    } else {
      console.log("❌ getRecentCompanyProfile Error:", err.message || err);
    }
    return null;
  }
}

/**
 * Update business settings in the backend.
 */
export async function updateBusinessSettings(token: string, settings: any) {
  try {
    if (!token) return null;

    const res = await fetch(`${BACKEND_URL}/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.log("❌ updateBusinessSettings Failed:", res.status, errData);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    console.log("❌ updateBusinessSettings Error:", err.message || err);
    return null;
  }
}

/**
 * Fetch all company profiles from backend.
 */
export async function getCompanyProfiles(token: string) {
  try {
    if (!token) return null;
    const res = await fetch(`${BACKEND_URL}/api/profiles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.log("❌ getCompanyProfiles Error:", err.message || err);
    return null;
  }
}
