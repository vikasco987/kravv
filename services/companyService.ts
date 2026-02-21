// import { useAuth } from "@clerk/clerk-expo";

// export type CompanyProfile = {
//   companyName: string;
//   businessAddress: string;
//   companyPhone: string;
//   contactPerson: string;
//   gstNumber?: string;
//   logoUrl?: string;
//   signatureUrl?: string;
// };

// const BACKEND_URL = "https://billing-backend-sable.vercel.app";

// // Plain function to fetch recent company profile
// export const getRecentCompanyProfile = async (getToken: () => Promise<string>): Promise<CompanyProfile> => {
//   try {
//     const token = await getToken();
//     const res = await fetch(`${BACKEND_URL}/api/profile`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();

//     if (!res.ok) throw new Error("Failed to fetch company profile");

//     return {
//       companyName: data.businessName || "KRAVY Billing",
//       businessAddress: data.businessAddress || "New Delhi, India",
//       companyPhone: data.contactPersonPhone || "+91-9999999999",
//       contactPerson: data.contactPersonName || "Walk-in",
//       gstNumber: data.gstNumber || "",
//       logoUrl: data.logoUrl || "",
//       signatureUrl: data.signatureUrl || "",
//     };
//   } catch (err) {
//     console.error("❌ getRecentCompanyProfile Error:", err);
//     return {
//       companyName: "KRAVY Billing",
//       businessAddress: "New Delhi, India",
//       companyPhone: "+91-9999999999",
//       contactPerson: "Walk-in",
//       gstNumber: "",
//       logoUrl: "",
//       signatureUrl: "",
//     };
//   }
// };





// import { useAuth } from "@clerk/clerk-expo";

// const BACKEND_URL = "https://billing-backend-sable.vercel.app";

// // ✅ Fetch recent company profile and normalize keys
// export const getRecentCompanyProfile = async (getToken: () => Promise<string>) => {
//   try {
//     if (!getToken) throw new Error("getToken function is required");

//     const token = await getToken();
//     console.log("🔑 [CompanyService] Clerk Token:", token);

//     const res = await fetch(`${BACKEND_URL}/api/profile`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       console.warn("⚠️ [CompanyService] No company profile found:", data);
//       return null;
//     }

//     // Normalize keys for SimpleBill
//     return {
//       companyName: data.businessName || "KRAVY Billing",
//       companyAddress: data.businessAddress || "New Delhi, India",
//       companyPhone: data.contactPersonPhone || "+91-9999999999",
//       contactPerson: data.contactPersonName || "Walk-in",
//       gstNumber: data.gstNumber || "",
//       logoUrl: data.logoUrl || "",
//       signatureUrl: data.signatureUrl || "",
//     };
//   } catch (err) {
//     console.error("❌ getRecentCompanyProfile Error:", err);
//     return null;
//   }
// };











const BACKEND_URL = "https://billing-backend-sable.vercel.app";

// ✅ getRecentCompanyProfile ab sahi token le raha hai
export const getRecentCompanyProfile = async (token: string) => {
  try {
    if (!token) throw new Error("Clerk token missing in getRecentCompanyProfile!");

    const res = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn("⚠️ [CompanyService] No company profile found:", data);
      return null;
    }

    return {
      companyName: data.businessName || "KRAVY Billing",
      companyAddress: data.businessAddress || "New Delhi, India",
      companyPhone: data.contactPersonPhone || "+91-9999999999",
      contactPerson: data.contactPersonName || "Walk-in",
      gstNumber: data.gstNumber || "",
      logoUrl: data.logoUrl || "",
      signatureUrl: data.signatureUrl || "",
    };
  } catch (err) {
    console.error("❌ getRecentCompanyProfile Error:", err);
    return null;
  }
};
