const BACKEND_URL = "https://billing.kravy.in";

// ✅ getRecentCompanyProfile ab sahi token le raha hai
export const getRecentCompanyProfile = async (token: string) => {
  try {
    if (!token) throw new Error("Clerk token missing in getRecentCompanyProfile!");

    const res = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok || !data) {
      console.log("ℹ️ [CompanyService] No profile found yet, using defaults.");
      return null;
    }

    return {
      companyName: data.businessName || "KRAVY Billing",
      companyAddress: data.businessAddress || "New Delhi, India",
      companyPhone: data.contactPersonPhone || "+91-9999999999",
      contactPerson: data.contactPersonName || "Walk-in",
      gstNumber: data.gstNumber || "",
      logoUrl: data.profileImageUrl || data.logoUrl || "",
      signatureUrl: data.signatureUrl || "",
      businessTagLine: data.businessTagLine || "",
      upi: data.upi || "",
      upiId: data.upiId || "",
    };
  } catch (err) {
    console.error("❌ getRecentCompanyProfile Error:", err);
    return null;
  }
};
