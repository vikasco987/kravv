const BACKEND_URL = "https://billing.kravy.in";
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
    };

    if (profile.businessId) {
      await AsyncStorage.setItem("@active_business_id", profile.businessId);
    }
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
      console.error("❌ getRecentCompanyProfile Error:", err);
    }
    return null;
  }
}
