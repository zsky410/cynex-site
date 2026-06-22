import { labels } from "./labels";

export type ResourceConfigKey =
  | "products"
  | "variants"
  | "orders"
  | "users"
  | "warranty"
  | "sources"
  | "sourceOrders"
  | "inventoryAccounts"
  | "inventoryKeys"
  | "emailLogs"
  | "auditLogs";

export type ResourceConfig = {
  key: ResourceConfigKey;
  label: string;
  legacyResourceName: string;
  shellPath: string;
  legacyPrefixes: string[];
  supportsCreate?: boolean;
  supportsEdit?: boolean;
  supportsShow?: boolean;
};

export const resourceConfigs: Record<ResourceConfigKey, ResourceConfig> = {
  products: {
    key: "products",
    label: labels.products,
    legacyResourceName: "products",
    shellPath: "/shell/products",
    legacyPrefixes: ["/products"],
    supportsCreate: true,
    supportsEdit: true,
  },
  variants: {
    key: "variants",
    label: labels.variants,
    legacyResourceName: "product-variants",
    shellPath: "/shell/variants",
    legacyPrefixes: ["/product-variants", "/variants"],
    supportsCreate: true,
    supportsEdit: true,
  },
  orders: {
    key: "orders",
    label: labels.orders,
    legacyResourceName: "orders",
    shellPath: "/shell/orders",
    legacyPrefixes: ["/orders"],
    supportsShow: true,
  },
  users: {
    key: "users",
    label: labels.users,
    legacyResourceName: "users",
    shellPath: "/shell/users",
    legacyPrefixes: ["/users"],
    supportsEdit: true,
    supportsShow: true,
  },
  warranty: {
    key: "warranty",
    label: labels.warranty,
    legacyResourceName: "warranty-cases",
    shellPath: "/shell/warranty",
    legacyPrefixes: ["/warranty-cases", "/warranty"],
    supportsEdit: true,
    supportsShow: true,
  },
  sources: {
    key: "sources",
    label: labels.sources,
    legacyResourceName: "supply-sources",
    shellPath: "/shell/sources",
    legacyPrefixes: ["/supply-sources", "/sources"],
    supportsCreate: true,
    supportsEdit: true,
  },
  sourceOrders: {
    key: "sourceOrders",
    label: labels.sourceOrders,
    legacyResourceName: "source-orders",
    shellPath: "/shell/source-orders",
    legacyPrefixes: ["/source-orders"],
    supportsCreate: true,
    supportsEdit: true,
  },
  inventoryAccounts: {
    key: "inventoryAccounts",
    label: labels.inventoryAccounts,
    legacyResourceName: "inventory-accounts",
    shellPath: "/shell/inventory/accounts",
    legacyPrefixes: ["/inventory-accounts", "/inventory/accounts"],
    supportsCreate: true,
    supportsEdit: true,
  },
  inventoryKeys: {
    key: "inventoryKeys",
    label: labels.inventoryKeys,
    legacyResourceName: "inventory-keys",
    shellPath: "/shell/inventory/keys",
    legacyPrefixes: ["/inventory-keys", "/inventory/keys"],
    supportsCreate: true,
    supportsEdit: true,
  },
  emailLogs: {
    key: "emailLogs",
    label: labels.emailLogs,
    legacyResourceName: "email-logs",
    shellPath: "/shell/email-logs",
    legacyPrefixes: ["/email-logs"],
    supportsShow: true,
  },
  auditLogs: {
    key: "auditLogs",
    label: labels.auditLogs,
    legacyResourceName: "audit-logs",
    shellPath: "/shell/audit-logs",
    legacyPrefixes: ["/audit-logs"],
    supportsShow: true,
  },
};

export const resourceConfigList = Object.values(resourceConfigs);

export function getResourceConfigByPrefix(pathname: string) {
  const normalizedPath = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");

  return resourceConfigList.find((config) =>
    config.legacyPrefixes.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
    ),
  );
}
