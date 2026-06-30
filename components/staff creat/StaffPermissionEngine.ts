// import AsyncStorage from '@react-native-async-storage/async-storage';

// /**
//  * StaffPermissionEngine
//  * Centralized logic for checking staff access. (Logic removed by user request for re-implementation)
//  */

// export interface StaffSession {
//   id: string;
//   name: string;
//   email: string;
//   accessType: string;
//   permissions: string[];
//   businessId: string;
//   token: string;
// }

// export const StaffPermissionEngine = {

//   /**
//    * Fetches the current staff session from storage.
//    */
//   async getSession(): Promise<StaffSession | null> {
//     try {
//       const sessionStr = await AsyncStorage.getItem('staff_session');
//       return sessionStr ? JSON.parse(sessionStr) : null;
//     } catch {
//       return null;
//     }
//   },

//   /**
//    * Simplified Access Check (Bypassed for re-implementation)
//    */
//   async hasAccess(requiredPermission: string, isOwner: boolean): Promise<boolean> {
//     if (isOwner) return true;
//     const session = await this.getSession();
//     return session ? session.permissions.includes(requiredPermission) : false;
//   },

//   /**
//    * Simplified Category Check (Bypassed for re-implementation)
//    */
//   async hasCategoryAccess(category: string, isOwner: boolean): Promise<boolean> {
//     if (isOwner) return true;
//     const session = await this.getSession();
//     if (!session) return false;
//     return session.permissions.some(p => p.toLowerCase().includes(category.toLowerCase()));
//   },

//   /**
//    * Returns the Business ID for data fetching.
//    */
//   async getActiveBusinessId(clerkUserId: string | undefined): Promise<string | null> {
//     if (clerkUserId) return null;
//     try {
//       const session = await this.getSession();
//       return session ? session.businessId : null;
//     } catch {
//       return null;
//     }
//   }
// };

// import AsyncStorage from '@react-native-async-storage/async-storage';

// export interface StaffSession {
//   id: string;
//   name: string;
//   email: string;
//   accessType: string;
//   permissions: string[];
//   businessId: string;
//   token: string;
// }

// export const StaffPermissionEngine = {

//   async getSession(): Promise<StaffSession | null> {
//     try {
//       const sessionStr = await AsyncStorage.getItem('staff_session');
//       return sessionStr ? JSON.parse(sessionStr) : null;
//     } catch {
//       return null;
//     }
//   },

//   // ✅ FINAL ACCESS CHECK
//   async hasAccess(requiredPermission: string): Promise<boolean> {
//     try {
//       const sessionStr = await AsyncStorage.getItem('staff_session');

//       // Owner → full access
//       if (!sessionStr) return true;

//       const session: StaffSession = JSON.parse(sessionStr);

//       if (!session?.permissions) return false;

//       const permissions = session.permissions.map((p: string) =>
//         p.toLowerCase().trim()
//       );

//       return permissions.includes(requiredPermission.toLowerCase().trim());

//     } catch {
//       return false;
//     }
//   },

//   async getActiveBusinessId(clerkUserId: string | undefined): Promise<string | null> {
//     if (clerkUserId) return null;
//     try {
//       const session = await this.getSession();
//       return session ? session.businessId : null;
//     } catch {
//       return null;
//     }
//   }
// };

// // hooks/useStaffPermissions.ts

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useEffect, useState } from "react";

// type StaffSession = {
//   permissions: string[];
//   businessId: string;
// };

// export const useStaffPermissions = () => {
//   const [session, setSession] = useState<StaffSession | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isOwner, setIsOwner] = useState(true);

//   useEffect(() => {
//     const loadSession = async () => {
//       try {
//         const data = await AsyncStorage.getItem("staff_session");

//         if (data) {
//           const parsed = JSON.parse(data);
//           setSession(parsed);
//           setIsOwner(false);
//         } else {
//           setSession(null);
//           setIsOwner(true);
//         }
//       } catch (e) {
//         setSession(null);
//         setIsOwner(true);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadSession();
//   }, []);

//   // ✅ CATEGORY ACCESS
//   const canAccessCategory = (category: string) => {
//     if (isOwner) return true;
//     if (!session) return false;

//     return session.permissions.some((p) =>
//       p.toLowerCase().includes(category.toLowerCase())
//     );
//   };

//   // ✅ GENERAL PERMISSION
//   const canAccess = (permission: string) => {
//     if (isOwner) return true;
//     if (!session) return false;

//     return session.permissions.includes(permission);
//   };

//   return {
//     loading,
//     isOwner,
//     canAccess,
//     canAccessCategory,
//     businessId: session?.businessId || null,
//   };
// };

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StaffSession {
  id: string;
  name: string;
  email: string;
  accessType: string;
  permissions: string[];
  businessId: string;
  token: string;
  role?: string;
  clerkId?: string;
}

export const StaffPermissionEngine = {
  async getSession(): Promise<StaffSession | null> {
    try {
      const sessionStr = await AsyncStorage.getItem("staff_session");
      if (!sessionStr) return null;

      try {
        const parsed = JSON.parse(sessionStr);
        return parsed;
      } catch (parseError) {
        return null;
      }
    } catch (err) {
      return null;
    }
  },

  /**
   * Generates a unique access token for terminal logging
   */
  generateAccessToken(
    permission: string,
    status: "GRANTED" | "DENIED",
    userType: "OWNER" | "STAFF",
  ): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `[TOKEN-${userType}-${status}]_${permission.toUpperCase()}_${timestamp}_${random}`;
  },

  // ✅ MAIN CHECK (OWNER + STAFF) WITH EXTREME DEBUG LOGGING
  async hasPermission(permission: string, isOwner: boolean): Promise<boolean> {
    let status: "GRANTED" | "DENIED" = "DENIED";
    let userType: "OWNER" | "STAFF" = isOwner ? "OWNER" : "STAFF";

    // 1. Clerk Owner check
    if (isOwner) {
      console.log(
        `[AUTH-SYSTEM] OWNER ACCESS (Clerk): ${permission} -> GRANTED`,
      );
      return true;
    }

    const session = await this.getSession();

    if (session) {
      console.log("DEBUG: Current session role:", session.role);
    }

    // 2. Role-based Owner check (for OTP Login)
    const normalizedRole = session?.role?.toUpperCase();
    if (
      normalizedRole === "USER" ||
      normalizedRole === "ADMIN" ||
      normalizedRole === "SELLER"
    ) {
      console.log(
        `[AUTH-SYSTEM] ROLE ACCESS (${normalizedRole}): ${permission} -> GRANTED`,
      );
      return true;
    }

    // If no session found
    if (!session) {
      console.log(
        `[AUTH-SYSTEM] SESSION ERROR: No staff session found in storage.`,
      );
      status = "DENIED";
      console.log(`[TOKEN-STAFF-DENIED]_${permission.toUpperCase()}`);
      return false;
    }

    // DEBUGGING - See exactly what we have
    const rawPerms = session.permissions || [];
    const accessType = session.accessType || "None";

    console.log("---------------- AUTH DEBUG ----------------");
    console.log(`CHECKING FOR : "${permission}"`);
    console.log(`USER NAME   : ${session.name}`);
    console.log(`ACCESS TYPE  : ${accessType}`);
    console.log(`ALL PERMS    :`, JSON.stringify(rawPerms));
    console.log("--------------------------------------------------");

    // 1. FULL ACCESS BYPASS
    if (accessType === "Full Access") {
      console.log(
        `[AUTH-SYSTEM] SUCCESS: Full Access granted to ${session.name}`,
      );
      status = "GRANTED";
      console.log(`[TOKEN-STAFF-GRANTED]_${permission.toUpperCase()}`);
      return true;
    }

    // 2. PERMISSION MATCHING LOGIC
    const searchTerm = permission.toLowerCase().trim();
    // Handle common naming variations (Order/Orders, Setting/Settings, Report/Reports)
    const variations = [
      searchTerm,
      searchTerm.endsWith("s") ? searchTerm.slice(0, -1) : searchTerm,
      searchTerm.endsWith("s") ? searchTerm : searchTerm + "s",
      // Manual overrides for common groups
      searchTerm === "order" ? "billing" : "",
      searchTerm === "billing" ? "order" : "",
      searchTerm === "reports" ? "report" : "",
      searchTerm === "customer" ? "client" : "",
      searchTerm === "client" ? "customer" : "",
    ].filter((v) => v !== "");

    const hasAccess =
      Array.isArray(rawPerms) &&
      rawPerms.some((p) => {
        if (typeof p !== "string") return false;
        const pLower = p.toLowerCase().trim();

        // STRICT EXCLUSION: Prevent dedicated item editor permissions from accidentally unlocking "Menu"
        if (searchTerm === "menu" && (pLower.includes("edit menu item") || pLower.includes("item editor"))) {
          return false;
        }

        // 1. Precise or Partial Match on variations
        if (variations.some((v) => pLower === v || pLower.includes(v)))
          return true;

        // 2. Robust Alphanumeric Normalization
        const normalizedP = pLower.replace(/[^a-z0-9]/g, "");
        return variations.some((v) => {
          const normalizedV = v.replace(/[^a-z0-9]/g, "");
          return normalizedP.includes(normalizedV);
        });
      });

    status = hasAccess ? "GRANTED" : "DENIED";

    if (hasAccess) {
      console.log(
        `[AUTH-SYSTEM] GRANTED: Staff has permission for ${permission}`,
      );
    } else {
      console.log(
        `[AUTH-SYSTEM] DENIED: Staff MISSING permission for ${permission}`,
      );
    }

    console.log(`[TOKEN-STAFF-${status}]_${permission.toUpperCase()}`);
    return hasAccess;
  },

  // ✅ FOR BACKWARD COMPATIBILITY
  async hasCategoryAccess(
    category: string,
    isOwner: boolean,
  ): Promise<boolean> {
    return await this.hasPermission(category, isOwner);
  },

  // ✅ BUSINESS ID (IMPORTANT FOR STAFF DATA)

  async getActiveBusinessId(clerkUserId?: string): Promise<string | null> {
    try {
      const explicitId = await AsyncStorage.getItem("@active_business_id");
      if (explicitId) return explicitId;
    } catch (e) { }

    // 🚀 Priority 1: If Clerk ID is provided (Owner login), use it immediately and EXCLUSIVELY.
    // This prevents stale staff sessions (like Masala House) from polluting owner data.
    if (clerkUserId) return clerkUserId;

    try {
      const session = await this.getSession();

      // Priority 2: Staff Session Business ID
      if (session?.businessId) return session.businessId;
      if (session?.clerkId) return session.clerkId;
      if (session?.id) return session.id;

      // Fallback 1: check cached profile (standard for Owners if Clerk is loading)
      // NOTE: We only use this if clerkUserId was NOT passed in.
      const cached = await AsyncStorage.getItem("@cached_business_profile");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const id = data._id || data.id || data.businessId;
          if (id) return id;
        } catch (e) { }
      }

      // Fallback 2: check if we have it stored elsewhere
      const altCached = await AsyncStorage.getItem("@active_business_id");
      if (altCached) return altCached;

      return null;
    } catch (err) {
      return null;
    }
  },
};
