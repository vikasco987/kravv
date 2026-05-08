// import { useUser } from '@clerk/clerk-expo';
// import { useEffect, useState } from 'react';
// import { StaffPermissionEngine, StaffSession } from './StaffPermissionEngine';

// /**
//  * useStaffPermissions
//  * Reactive hook for checking permissions. (Logic removed for re-implementation)
//  */
// export const useStaffPermissions = () => {
//   const { isSignedIn, isLoaded } = useUser();
//   const [session, setSession] = useState<StaffSession | null>(null);

//   useEffect(() => {
//     const loadSession = async () => {
//       const data = await StaffPermissionEngine.getSession();
//       setSession(data);
//     };
//     loadSession();
//   }, []);

//   const isOwner = !!isSignedIn;

//   // ✅ ALWAYS ALLOWED (System being recreated)
//   const canAccessCategory = (category: string): boolean => {
//     return true;
//   };

//   return {
//     isOwner,
//     canAccessCategory
//   };
// };

import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { StaffPermissionEngine, StaffSession } from "./StaffPermissionEngine";

export const useStaffPermissions = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadSession = async () => {
    console.log("[useStaffPermissions] Loading session...");
    const data = await StaffPermissionEngine.getSession();
    setSession(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isLoaded) {
      loadSession();
    }

    const sub = DeviceEventEmitter.addListener("PERMISSIONS_UPDATED", () => {
      console.log("[useStaffPermissions] PERMISSIONS_UPDATED signal received");
      setRefreshTrigger((prev) => prev + 1);
    });

    return () => sub.remove();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (isLoaded) {
      loadSession();
    }
  }, [refreshTrigger]);

  const isOwner =
    (isLoaded && !!isSignedIn) ||
    session?.role === "USER" ||
    session?.role === "ADMIN" ||
    session?.role === "SELLER";

  // ✅ SYNC CHECK (FOR UI)
  const canAccessSync = (category: string): boolean => {
    if (!isLoaded) return false;
    if (
      isOwner ||
      session?.role === "USER" ||
      session?.role === "ADMIN" ||
      session?.role === "SELLER"
    )
      return true;

    if (!session) {
      // If we are not owner and have no session, we can't access anything
      return false;
    }

    if (session.accessType === "Full Access") return true;

    const searchTerm = category.toLowerCase().trim();
    // Handle common naming variations (Order/Orders, Setting/Settings, Report/Reports)
    const variations = [
      searchTerm,
      searchTerm.endsWith("s") ? searchTerm.slice(0, -1) : searchTerm,
      searchTerm.endsWith("s") ? searchTerm : searchTerm + "s",
      searchTerm === "order" ? "billing" : "",
      searchTerm === "billing" ? "order" : "",
      searchTerm === "reports" ? "report" : "",
      searchTerm === "customer" ? "client" : "",
      searchTerm === "client" ? "customer" : "",
    ].filter((v) => v !== "");

    const perms = session.permissions || [];
    return perms.some((p) => {
      if (typeof p !== "string") return false;
      const pLower = p.toLowerCase().trim();

      // 1. Match variations
      if (variations.some((v) => pLower === v || pLower.includes(v)))
        return true;

      // 2. Normalization
      const normalizedP = pLower.replace(/[^a-z0-9]/g, "");
      return variations.some((v) => {
        const normalizedV = v.replace(/[^a-z0-9]/g, "");
        return normalizedP.includes(normalizedV);
      });
    });
  };

  return {
    isOwner,
    canAccessCategory: async (cat: string) =>
      await StaffPermissionEngine.hasPermission(cat, isOwner),
    canAccessSync,
    session,
    loading: !isLoaded || loading,
    refreshSession: loadSession,
  };
};
