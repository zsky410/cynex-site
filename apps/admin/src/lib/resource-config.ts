import { labels } from "./labels";

export type ResourceConfigKey =
  | "categories"
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
  shellGroup: "catalog" | "operations" | "supply" | "logs";
  description: string;
  iconKey:
    | "categories"
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
  supportsCreate?: boolean;
  supportsEdit?: boolean;
  supportsShow?: boolean;
  hiddenInNavigation?: boolean;
};

export const resourceGroupLabels = {
  catalog: "Danh mục",
  operations: "Vận hành",
  supply: "Nguồn hàng",
  logs: "Nhật ký",
} as const;

export const resourceConfigs: Record<ResourceConfigKey, ResourceConfig> = {
  categories: {
    key: "categories",
    label: labels.categories,
    legacyResourceName: "categories",
    shellPath: "/shell/categories",
    legacyPrefixes: ["/categories"],
    shellGroup: "catalog",
    description: "Quản lý danh mục thật để storefront và biểu mẫu sản phẩm dùng chung một nguồn dữ liệu.",
    iconKey: "categories",
    supportsCreate: true,
    supportsEdit: true,
  },
  products: {
    key: "products",
    label: labels.products,
    legacyResourceName: "products",
    shellPath: "/shell/products",
    legacyPrefixes: ["/products"],
    shellGroup: "catalog",
    description: "Danh sách và biểu mẫu sản phẩm sẽ được chuyển sang Ant Design ở bước sau.",
    iconKey: "products",
    supportsCreate: true,
    supportsEdit: true,
  },
  variants: {
    key: "variants",
    label: labels.variants,
    legacyResourceName: "product-variants",
    shellPath: "/shell/variants",
    legacyPrefixes: ["/product-variants", "/variants"],
    shellGroup: "catalog",
    description: "Quản lý biến thể và fulfillment sẽ được kích hoạt sau khi shell ổn định.",
    iconKey: "variants",
    supportsCreate: true,
    supportsEdit: true,
    hiddenInNavigation: true,
  },
  orders: {
    key: "orders",
    label: labels.orders,
    legacyResourceName: "orders",
    shellPath: "/shell/orders",
    legacyPrefixes: ["/orders"],
    shellGroup: "operations",
    description: "Theo dõi xử lý đơn, trạng thái giao hàng và hoàn tiền.",
    iconKey: "orders",
    supportsShow: true,
  },
  users: {
    key: "users",
    label: labels.users,
    legacyResourceName: "users",
    shellPath: "/shell/users",
    legacyPrefixes: ["/users"],
    shellGroup: "operations",
    description: "Thông tin tài khoản, ví và lịch sử hoạt động người dùng.",
    iconKey: "users",
    supportsEdit: true,
    supportsShow: true,
  },
  warranty: {
    key: "warranty",
    label: labels.warranty,
    legacyResourceName: "warranty-cases",
    shellPath: "/shell/warranty",
    legacyPrefixes: ["/warranty-cases", "/warranty"],
    shellGroup: "operations",
    description: "Case bảo hành, thay thế asset và phản hồi hỗ trợ.",
    iconKey: "warranty",
    supportsEdit: true,
    supportsShow: true,
  },
  sources: {
    key: "sources",
    label: labels.sources,
    legacyResourceName: "supply-sources",
    shellPath: "/shell/sources",
    legacyPrefixes: ["/supply-sources", "/sources"],
    shellGroup: "supply",
    description: "Theo dõi nguồn hàng và đối tác cung ứng.",
    iconKey: "sources",
    supportsCreate: true,
    supportsEdit: true,
  },
  sourceOrders: {
    key: "sourceOrders",
    label: labels.sourceOrders,
    legacyResourceName: "source-orders",
    shellPath: "/shell/source-orders",
    legacyPrefixes: ["/source-orders"],
    shellGroup: "supply",
    description: "Kiểm soát đơn nhập từ nhà cung cấp.",
    iconKey: "sourceOrders",
    supportsCreate: true,
    supportsEdit: true,
  },
  inventoryAccounts: {
    key: "inventoryAccounts",
    label: labels.inventoryAccounts,
    legacyResourceName: "inventory-accounts",
    shellPath: "/shell/inventory/accounts",
    legacyPrefixes: ["/inventory-accounts", "/inventory/accounts"],
    shellGroup: "supply",
    description: "Tài khoản tồn kho, chia sẻ và trạng thái sử dụng.",
    iconKey: "inventoryAccounts",
    supportsCreate: true,
    supportsEdit: true,
  },
  inventoryKeys: {
    key: "inventoryKeys",
    label: labels.inventoryKeys,
    legacyResourceName: "inventory-keys",
    shellPath: "/shell/inventory/keys",
    legacyPrefixes: ["/inventory-keys", "/inventory/keys"],
    shellGroup: "supply",
    description: "Kho key và luồng xem bí mật bảo mật.",
    iconKey: "inventoryKeys",
    supportsCreate: true,
    supportsEdit: true,
  },
  emailLogs: {
    key: "emailLogs",
    label: labels.emailLogs,
    legacyResourceName: "email-logs",
    shellPath: "/shell/email-logs",
    legacyPrefixes: ["/email-logs"],
    shellGroup: "logs",
    description: "Nhật ký gửi email và trạng thái deliverability.",
    iconKey: "emailLogs",
    supportsShow: true,
  },
  auditLogs: {
    key: "auditLogs",
    label: labels.auditLogs,
    legacyResourceName: "audit-logs",
    shellPath: "/shell/audit-logs",
    legacyPrefixes: ["/audit-logs"],
    shellGroup: "logs",
    description: "Lịch sử thao tác quản trị và các lần xem secret.",
    iconKey: "auditLogs",
    supportsShow: true,
  },
};

export const resourceConfigList = Object.values(resourceConfigs);

export function normalizeResourcePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

export function getResourceMatchPaths(config: ResourceConfig) {
  return [config.shellPath, ...config.legacyPrefixes];
}

export function matchesResourcePath(pathname: string, prefix: string) {
  const normalizedPath = normalizeResourcePath(pathname);
  const normalizedPrefix = normalizeResourcePath(prefix);

  return (
    normalizedPath === normalizedPrefix ||
    normalizedPath.startsWith(`${normalizedPrefix}/`)
  );
}

export function getResourceConfigByPrefix(pathname: string) {
  const normalizedPath = normalizeResourcePath(pathname);
  const candidates = resourceConfigList
    .flatMap((config) =>
      getResourceMatchPaths(config).map((prefix) => ({
        config,
        prefix,
      })),
    )
    .filter(({ prefix }) => matchesResourcePath(normalizedPath, prefix))
    .sort(
      (a, b) => normalizeResourcePath(b.prefix).length - normalizeResourcePath(a.prefix).length,
    );

  return candidates[0]?.config;
}
