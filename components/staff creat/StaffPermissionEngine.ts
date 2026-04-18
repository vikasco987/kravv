import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * StaffPermissionEngine
 * All logic for checking staff access is centralized here.
 * This ensures no 1% change happens in existing business logic.
 */

export interface StaffSession {
  id: string;
  name: string;
  email: string;
  accessType: string;
  permissions: string[];
  businessId: string;
  token: string;
}

export const StaffPermissionEngine = {
  /**
   * Features that are EXCLUSIVELY for the Owner and cannot be accessed by any staff.
   */
  ONLY_OWNER_FEATURES: ["Manage Staff", "Business Profile"],

  /**
   * Main function to verify if the current user has access.
   */
  async hasAccess(requiredPermission: string, isOwnerSignedIn: boolean): Promise<boolean> {
    // Rule 1: Owners have 100% access to everything.
    if (isOwnerSignedIn) return true;

    // Rule 2: Strict Block for Owner-Only features
    const isRestricted = this.ONLY_OWNER_FEATURES.some(feat =>
      requiredPermission.includes(feat) || feat.includes(requiredPermission)
    );
    if (isRestricted) return false;

    // Rule 3: Check for Staff Session
    try {
      const sessionStr = await AsyncStorage.getItem('staff_session');
      if (!sessionStr) return false;

      const session: StaffSession = JSON.parse(sessionStr);

      // Rule 3: Admin/Full Access has full control
      if (session.accessType === "Admin" || session.accessType === "Full Access") return true;

      // Rule 4: Smart Matching
      // Often, the app might call with "Category - Permission" (e.g., "Menu - Add Menu Items")
      // We check for exact match OR if the staff's permission is a part of the required string.
      const staffPerms = session.permissions || [];

      const hasDirectAccess = staffPerms.includes(requiredPermission);
      if (hasDirectAccess) return true;

      // Fallback: Check if any of the staff's permissions match the end of the required string
      // Example: "Add Menu Items" should match "Menu & Items Permissions - Add Menu Items"
      const hasSmartAccess = staffPerms.some(p => requiredPermission.includes(p));

      return hasSmartAccess;
    } catch (e) {
      console.error("Permission check failed:", e);
      return false;
    }
  },

  /**
   * Checks if a user has access to a WHOLE FOLDER/CATEGORY.
   * Useful for hiding entire tabs or sidebar items.
   */
  async hasCategoryAccess(categoryTitle: string, isOwnerSignedIn: boolean): Promise<boolean> {
    if (isOwnerSignedIn) return true;

    try {
      const sessionStr = await AsyncStorage.getItem('staff_session');
      if (!sessionStr) return false;

      const session: StaffSession = JSON.parse(sessionStr);

      // Rule: Admin/Full Access has full control
      if (session.accessType === "Admin" || session.accessType === "Full Access") return true;

      const staffPerms = session.permissions || [];

      // Mapping of Tab Names to Permission Keywords
      const mapping: Record<string, string[]> = {
        "Dashboard": ["Today Sales", "Weekly Sales", "Monthly Sales", "Analytics", "Dashboard"],
        "Menu": ["Menu", "Add Menu Items", "Edit Menu Items", "QR Codes", "Items", "Menu & Items"],
        "Orders": ["Bill Records", "Reprint", "Delete Bill", "Invoices", "Live Orders", "Tables", "Order", "Billing", "Receipts"],
        "Client": ["Customer", "Parties", "Ledger", "Client", "History"],
        "Intelligence": ["Profit Engine", "Voice Command", "AI Tools", "Intelligence"],
        "Reports": ["Daily Sales Report", "Weekly Sales Report", "Monthly Sales Report", "Records", "Report"],
        "Settings": ["App General Settings", "Printer", "PIN", "Staff", "Settings"]
      };

      const keywords = mapping[categoryTitle];
      if (!keywords) return false;

      // If staff has ANY of the permissions in this category, show the tab.
      return staffPerms.some(sp =>
        keywords.some(kw => sp.includes(kw) || kw.includes(sp))
      );
    } catch (e) {
      return false;
    }
  },

  /**
   * Returns the ID that should be used for data fetching (Bills, Tables, etc.)
   * For the Owner, we return null to ensure they use their standard API endpoints.
   * For Staff, we return the businessId from their session.
   */
  async getActiveBusinessId(clerkUserId: string | undefined): Promise<string | null> {
    // Rule: If an owner is signed in (via Clerk), we return null.
    // This prevents adding unnecessary/problematic 'businessId' query params for the owner.
    if (clerkUserId) return null;

    // Rule: For Staff members, we return their associated businessId.
    try {
      const sessionStr = await AsyncStorage.getItem('staff_session');
      if (sessionStr) {
        const session: StaffSession = JSON.parse(sessionStr);
        return session.businessId;
      }
    } catch (e) { }

    return null;
  }
};
