export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  accessType: string;
  permissions: string[];
};

export const PERMISSION_GROUPS = [
  {
    title: "Profile Permissions",
    permissions: ["Edit", "View"]
  },
  {
    title: "Select Party Page Permissions",
    permissions: ["Hide Phone"]
  },
  {
    title: "Party Permissions",
    permissions: ["Delete", "Edit", "View", "Create"]
  },
  {
    title: "Party Category Permissions",
    permissions: ["Delete", "Edit", "View", "Create"]
  },
  {
    title: "Item Permissions",
    permissions: ["Delete", "Edit", "View", "Create"]
  },
  {
    title: "Item Category Permissions",
    permissions: ["Delete", "Edit", "View", "Create"]
  },
  {
    title: "Item Stock Adjust Permissions",
    permissions: ["Adjust"]
  },
  {
    title: "Money In Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Money Out Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Estimate Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Expense Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Purchase Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Purchase Return Permissions",
    permissions: ["Delete", "View", "Create", "Reprint"]
  },
  {
    title: "Sale Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Sale Return Permissions",
    permissions: ["Delete", "Edit", "View", "Create", "Reprint"]
  },
  {
    title: "Kot Permissions",
    permissions: ["View"]
  },
  {
    title: "Dashboard Permissions",
    permissions: [
      "View Sales Total",
      "View Money Ins Total",
      "View Purchases Total",
      "View Money Outs Total",
      "View Receivable Total",
      "View Payable Total",
      "Item Low Stock Count",
      "View Today's Customer",
      "View Today's Loyal Customer",
      "View Today's New Customer"
    ]
  },
  {
    title: "Report Permissions",
    permissions: [
      "Sale Report",
      "Sale Wise Profit And Loss Report",
      "Purchase Report",
      "Expense Report",
      "Estimate Report",
      "Money In Report",
      "Money Out Report",
      "Party Ledger",
      "Party Details Report",
      "Party Receivable/Payable Report",
      "Stock Summary Report",
      "Item Sale Report",
      "Item Category wise Sale Report",
      "Item Report",
      "Item Details Report",
      "Day Book Report",
      "Cut Off Day Report"
    ]
  },
  {
    title: "Settings Permissions",
    permissions: [
      "Pin Access",
      "Set Login Pin",
      "Send Bill To Owner on WhatsApp",
      "Send Bill To Party on WhatsApp",
      "Reset Login Pin",
      "Activate Online Shop",
      "QR For Online Shop"
    ]
  }
];

export const TOTAL_PERMISSIONS_COUNT = 114;
