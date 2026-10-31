// Module catalogue for the preview (keys are kebab-case; icon files live in public/icons/modules).
export const MODULE_ICON_FILES: Record<string, string> = {
  "analytics-and-bi": "Analytics and BI.svg",
  "asset-management": "Asset Management.svg",
  "compliance-and-legal": "Compliance and Legal.svg",
  "customer-support": "Customer Support.svg",
  "document-management": "Document Management.svg",
  "finance-and-accounting": "Finance and Accounting.svg",
  "inventory": "Inventory.svg",
  "manufacturing": "Manufacturing.svg",
  "marketing-and-ecommerce": "Marketing and eCommerce.svg",
  "pos-retail-billing": "POS.svg",
  "people-payroll": "People and Payroll.svg",
  "procurement": "Procurement.svg",
  "sales-and-crm": "Sales and CRM.svg",
  "self-service-portal": "Self Service Portal.svg",
  "supply-chain-and-logistics": "Supply Chain and Logistics.svg",
  "travel-and-expense-management": "Travel and Expense Management.svg",
  "warehouse-management": "Warehouse Management.svg",
  "work-management": "Work Management.svg",
};

export const MODULE_LABELS: Record<string, string> = {
  "analytics-and-bi": "Analytics and BI",
  "asset-management": "Asset Management",
  "compliance-and-legal": "Compliance and Legal",
  "customer-support": "Customer Support",
  "document-management": "Document Management",
  "finance-and-accounting": "Finance and Accounting",
  "inventory": "Inventory",
  "manufacturing": "Manufacturing",
  "marketing-and-ecommerce": "Marketing and eCommerce",
  "pos-retail-billing": "POS & Retail Billing",
  "people-payroll": "People & Payroll",
  "procurement": "Procurement",
  "sales-and-crm": "Sales and CRM",
  "self-service-portal": "Self Service Portal",
  "supply-chain-and-logistics": "Supply Chain and Logistics",
  "travel-and-expense-management": "Travel and Expense Management",
  "warehouse-management": "Warehouse Management",
  "work-management": "Work Management",
};

export function moduleLabel(key: string): string { return MODULE_LABELS[key] ?? key; }

export function moduleIconSrc(key: string): string | null {
  const file = MODULE_ICON_FILES[key];
  return file ? `/icons/modules/${encodeURIComponent(file)}` : null;
}

export const MODULE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_LABELS).map(([key, label]) => [key, `${label} workspace`]),
);

/** Modules with a page today. Empty in the preview, so every tile reads "Coming soon". */
export const MODULE_HOME_HREFS: Record<string, string> = {
  "people-payroll": "/people",
  "pos-retail-billing": "/pos/terminal",
};
