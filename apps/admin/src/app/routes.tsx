import {
  AppstoreOutlined,
  AuditOutlined,
  DashboardOutlined,
  KeyOutlined,
  MailOutlined,
  SafetyOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ComponentType, ReactNode } from "react";
import { ADMIN_HOME_PATH } from "../config";

export type AdminRouteKey =
  | "dashboard"
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

export type AdminNavItem = {
  key: AdminRouteKey;
  path: string;
  label: string;
  icon: ComponentType | (() => ReactNode);
  description?: string;
  enabled?: boolean;
  matchPrefixes?: string[];
};

export type AdminNavGroup = {
  key: string;
  label: string;
  items: AdminNavItem[];
};

export const adminDashboardRoute: AdminNavItem = {
  key: "dashboard",
  path: "/shell",
  label: "Tổng quan",
  icon: DashboardOutlined,
  description: "Khu shell Ant Design an toàn để rollout dần mà không chặn màn hình legacy.",
  enabled: true,
  matchPrefixes: [ADMIN_HOME_PATH, "/"],
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    key: "overview",
    label: "Điều hướng",
    items: [adminDashboardRoute],
  },
  {
    key: "catalog",
    label: "Danh mục",
    items: [
      {
        key: "products",
        path: "/shell/products",
        label: "Sản phẩm",
        icon: AppstoreOutlined,
        description: "Danh sách và biểu mẫu sản phẩm sẽ được chuyển sang Ant Design ở bước sau.",
        matchPrefixes: ["/products"],
      },
      {
        key: "variants",
        path: "/shell/variants",
        label: "Biến thể",
        icon: ToolOutlined,
        description: "Quản lý biến thể và fulfillment sẽ được kích hoạt sau khi shell ổn định.",
        matchPrefixes: ["/product-variants", "/variants"],
      },
    ],
  },
  {
    key: "operations",
    label: "Vận hành",
    items: [
      {
        key: "orders",
        path: "/shell/orders",
        label: "Đơn hàng",
        icon: ShoppingCartOutlined,
        description: "Theo dõi xử lý đơn, trạng thái giao hàng và hoàn tiền.",
        matchPrefixes: ["/orders"],
      },
      {
        key: "users",
        path: "/shell/users",
        label: "Người dùng",
        icon: TeamOutlined,
        description: "Thông tin tài khoản, ví và lịch sử hoạt động người dùng.",
        matchPrefixes: ["/users"],
      },
      {
        key: "warranty",
        path: "/shell/warranty",
        label: "Bảo hành",
        icon: WarningOutlined,
        description: "Case bảo hành, thay thế asset và phản hồi hỗ trợ.",
        matchPrefixes: ["/warranty-cases", "/warranty"],
      },
    ],
  },
  {
    key: "supply",
    label: "Nguồn hàng",
    items: [
      {
        key: "sources",
        path: "/shell/sources",
        label: "Nguồn cung",
        icon: ShopOutlined,
        description: "Theo dõi nguồn hàng và đối tác cung ứng.",
        matchPrefixes: ["/supply-sources", "/sources"],
      },
      {
        key: "sourceOrders",
        path: "/shell/source-orders",
        label: "Đơn nhập",
        icon: ShoppingCartOutlined,
        description: "Kiểm soát đơn nhập từ nhà cung cấp.",
        matchPrefixes: ["/source-orders"],
      },
      {
        key: "inventoryAccounts",
        path: "/shell/inventory/accounts",
        label: "Kho tài khoản",
        icon: SafetyOutlined,
        description: "Tài khoản tồn kho, chia sẻ và trạng thái sử dụng.",
        matchPrefixes: ["/inventory-accounts", "/inventory/accounts"],
      },
      {
        key: "inventoryKeys",
        path: "/shell/inventory/keys",
        label: "Kho key",
        icon: KeyOutlined,
        description: "Kho key và lộ trình reveal bảo mật.",
        matchPrefixes: ["/inventory-keys", "/inventory/keys"],
      },
    ],
  },
  {
    key: "logs",
    label: "Nhật ký",
    items: [
      {
        key: "emailLogs",
        path: "/shell/email-logs",
        label: "Email",
        icon: MailOutlined,
        description: "Nhật ký gửi email và trạng thái deliverability.",
        matchPrefixes: ["/email-logs"],
      },
      {
        key: "auditLogs",
        path: "/shell/audit-logs",
        label: "Audit",
        icon: AuditOutlined,
        description: "Audit trail cho thao tác quản trị và reveal secrets.",
        matchPrefixes: ["/audit-logs"],
      },
    ],
  },
];

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function matchesPrefix(pathname: string, prefix: string) {
  const normalizedPath = normalizePathname(pathname);
  const normalizedPrefix = normalizePathname(prefix);

  return (
    normalizedPath === normalizedPrefix ||
    normalizedPath.startsWith(`${normalizedPrefix}/`)
  );
}

export function getRouteMeta(pathname: string) {
  const normalizedPath = normalizePathname(pathname);
  const candidates = adminNavGroups
    .flatMap((group) => group.items)
    .flatMap((item) => [item.path, ...(item.matchPrefixes ?? [])].map((prefix) => ({ item, prefix })))
    .filter(({ prefix }) => matchesPrefix(normalizedPath, prefix))
    .sort((a, b) => normalizePathname(b.prefix).length - normalizePathname(a.prefix).length);

  return candidates[0]?.item ?? adminDashboardRoute;
}
