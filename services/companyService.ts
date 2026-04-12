const BACKEND_URL = "https://billing.kravy.in";
import { Alert, ToastAndroid } from "react-native";

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
        Authorization: `Bearer ${token}` 
      },
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType || !contentType.includes("application/json")) {
      return null;
    }

    const data: any = await res.json();
    if (!data) return null;

    return {
      companyName: (data.businessName as string) || "",
      companyAddress: (data.businessAddress as string) || "",
      companyPhone: (data.contactPersonPhone as string) || "",
      contactPerson: (data.contactPersonName as string) || "",
      gstNumber: (data.gstNumber as string) || "",
      logoUrl: (data.profileImageUrl as string) || (data.logoUrl as string) || "",
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
  } catch (err: any) {
    if (err.message === "Network request failed") {
      Alert.alert(
        "Connectivity Issue", 
        "It seems you are offline. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } else {
      console.error("❌ getRecentCompanyProfile Error:", err);
    }
    return null;
  }
}
