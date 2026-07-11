export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  accessType: string;
  permissions: string[];
};


export const PERMISSION_GROUPS = [
  {
    title: "Dashboard Permissions",
    permissions: [
      "View Today Sales",
      "View Weekly Sales",
      "View Monthly Sales",
      "View Sales Analytics"
    ]
  },
  {
    title: "Order & Billing Permissions",
    permissions: [
      "Create New Bill",
      "Hold Bill",
      "Clear Cart",
      "Apply Discount",
      "Apply Service Charge",
      "Apply GST/Tax",
      "Delete Items from Cart"
    ]
  },
  {
    title: "Invoices & Receipts",
    permissions: [
      "View Bill Records",
      "Reprint Bill",
      "Delete Bill",
      "Edit Saved Bill"
    ]
  },
  {
    title: "Customer Permissions",
    permissions: [
      "Add New Customer",
      "View Customer List",
      "Edit Customer Details",
      "Delete Customer",
      "View Customer Insights",
      "Access Party Ledger"
    ]
  },
  {
    title: "Menu & Items Permissions",
    permissions: [
      "Add Menu Items",
      "Delete Menu Items",
      "Manage Item Categories",
      "Generate Table QR Codes",
      "Adjust Item Stock"
    ]
  },
  {
    title: "AI Intelligence Tools",
    permissions: [
      "Access Profit Engine",
      "Access Voice Command",
      "Access Table Rotation"
    ]
  },
  {
    title: "Report Permissions",
    permissions: [
      "Daily Sales Report",
      "Weekly Sales Report",
      "Monthly Sales Report",
      "Item Sales Report",
      "Deep Sale Records"
    ]
  },
  {
    title: "Inventory Permissions",
    permissions: [
      "View Inventory Dashboard",
      "Manage Raw Materials",
      "Manage Finished Products",
      "View Inventory Reports"
    ]
  },
  {
    title: "Settings Permissions",
    permissions: [
      "App General Settings",
      "Manage Staff",
      "Set/Reset Login PIN",
      "Printer Settings",
      "WhatsApp Bill Notifications"
    ]
  },
  {
    title: "Restaurant Expenses",
    permissions: [
      "Access Restaurant Expenses"
    ]
  },
  {
    title: "Past Bills History",
    permissions: [
      "Access Past Bills / History"
    ]
  },
  {
    title: "Item Editor",
    permissions: [
      "Dedicated Item Editor"
    ]
  },
  {
    title: "edit tables and delete",
    permissions: [
      "edit tables and delete"
    ]
  }
];

export const TOTAL_PERMISSIONS_COUNT = 47;

