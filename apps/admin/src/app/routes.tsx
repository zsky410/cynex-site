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
import {
  getResourceConfigByPrefix,
  resourceConfigList,
  resourceGroupLabels,
  type ResourceConfigKey,
} from "../lib/resource-config";

export type AdminRouteKey = "dashboard" | ResourceConfigKey;

export type AdminNavItem = {
  key: AdminRouteKey;
  path: string;
  label: string;
  icon: ComponentType | (() => ReactNode);
  description?: string;
  enabled?: boolean;
  legacyPath?: string;
};

export type AdminNavGroup = {
  key: string;
  label: string;
  items: AdminNavItem[];
};

export const adminDashboardRoute: AdminNavItem = {
  key: "dashboard",
  path: "/shell/dashboard",
  label: "Tổng quan",
  icon: DashboardOutlined,
  description: "Khu shell Ant Design an toàn để rollout dần mà không chặn màn hình legacy.",
  enabled: true,
  legacyPath: ADMIN_HOME_PATH,
};

const resourceIcons: Record<ResourceConfigKey, ComponentType> = {
  products: AppstoreOutlined,
  variants: ToolOutlined,
  orders: ShoppingCartOutlined,
  users: TeamOutlined,
  warranty: WarningOutlined,
  sources: ShopOutlined,
  sourceOrders: ShoppingCartOutlined,
  inventoryAccounts: SafetyOutlined,
  inventoryKeys: KeyOutlined,
  emailLogs: MailOutlined,
  auditLogs: AuditOutlined,
};

const shellGroupOrder = ["catalog", "operations", "supply", "logs"] as const;

const groupedResourceItems = shellGroupOrder.map((groupKey) => ({
  key: groupKey,
  label: resourceGroupLabels[groupKey],
  items: resourceConfigList
    .filter((config) => config.shellGroup === groupKey)
    .map((config) => ({
      key: config.key,
      path: config.shellPath,
      legacyPath: config.legacyPrefixes[0],
      label: config.label,
      icon: resourceIcons[config.iconKey],
      description: config.description,
      enabled: true,
    })),
}));

export const adminNavGroups: AdminNavGroup[] = [
  {
    key: "overview",
    label: "Điều hướng",
    items: [adminDashboardRoute],
  },
  ...groupedResourceItems,
];

export function getRouteMeta(pathname: string) {
  if (pathname === ADMIN_HOME_PATH || pathname === "/" || pathname.startsWith("/shell")) {
    const shellItem = adminNavGroups
      .flatMap((group) => group.items)
      .find((item) => item.path === pathname || pathname.startsWith(`${item.path}/`));

    return shellItem ?? adminDashboardRoute;
  }

  const resource = getResourceConfigByPrefix(pathname);
  if (!resource) return adminDashboardRoute;

  return (
    adminNavGroups
      .flatMap((group) => group.items)
      .find((item) => item.key === resource.key) ?? adminDashboardRoute
  );
}
