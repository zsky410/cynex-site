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
};

export type AdminNavGroup = {
  key: string;
  label: string;
  items: AdminNavItem[];
};

export const adminDashboardRoute: AdminNavItem = {
  key: "dashboard",
  path: ADMIN_HOME_PATH,
  label: "Tổng quan",
  icon: DashboardOutlined,
  description: "Tổng quan vận hành và tiến độ chuyển đổi giao diện.",
  enabled: true,
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
        path: "/products",
        label: "Sản phẩm",
        icon: AppstoreOutlined,
        description: "Danh sách và biểu mẫu sản phẩm sẽ được chuyển sang Ant Design ở bước sau.",
      },
      {
        key: "variants",
        path: "/variants",
        label: "Biến thể",
        icon: ToolOutlined,
        description: "Quản lý biến thể và fulfillment sẽ được kích hoạt sau khi shell ổn định.",
      },
    ],
  },
  {
    key: "operations",
    label: "Vận hành",
    items: [
      {
        key: "orders",
        path: "/orders",
        label: "Đơn hàng",
        icon: ShoppingCartOutlined,
        description: "Theo dõi xử lý đơn, trạng thái giao hàng và hoàn tiền.",
      },
      {
        key: "users",
        path: "/users",
        label: "Người dùng",
        icon: TeamOutlined,
        description: "Thông tin tài khoản, ví và lịch sử hoạt động người dùng.",
      },
      {
        key: "warranty",
        path: "/warranty",
        label: "Bảo hành",
        icon: WarningOutlined,
        description: "Case bảo hành, thay thế asset và phản hồi hỗ trợ.",
      },
    ],
  },
  {
    key: "supply",
    label: "Nguồn hàng",
    items: [
      {
        key: "sources",
        path: "/sources",
        label: "Nguồn cung",
        icon: ShopOutlined,
        description: "Theo dõi nguồn hàng và đối tác cung ứng.",
      },
      {
        key: "sourceOrders",
        path: "/source-orders",
        label: "Đơn nhập",
        icon: ShoppingCartOutlined,
        description: "Kiểm soát đơn nhập từ nhà cung cấp.",
      },
      {
        key: "inventoryAccounts",
        path: "/inventory/accounts",
        label: "Kho tài khoản",
        icon: SafetyOutlined,
        description: "Tài khoản tồn kho, chia sẻ và trạng thái sử dụng.",
      },
      {
        key: "inventoryKeys",
        path: "/inventory/keys",
        label: "Kho key",
        icon: KeyOutlined,
        description: "Kho key và lộ trình reveal bảo mật.",
      },
    ],
  },
  {
    key: "logs",
    label: "Nhật ký",
    items: [
      {
        key: "emailLogs",
        path: "/email-logs",
        label: "Email",
        icon: MailOutlined,
        description: "Nhật ký gửi email và trạng thái deliverability.",
      },
      {
        key: "auditLogs",
        path: "/audit-logs",
        label: "Audit",
        icon: AuditOutlined,
        description: "Audit trail cho thao tác quản trị và reveal secrets.",
      },
    ],
  },
];

export const adminRouteLookup = Object.fromEntries(
  adminNavGroups.flatMap((group) => group.items.map((item) => [item.path, item])),
) as Record<string, AdminNavItem>;

export function getRouteMeta(pathname: string) {
  return adminRouteLookup[pathname] ?? adminDashboardRoute;
}
