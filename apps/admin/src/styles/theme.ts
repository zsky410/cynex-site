import type { ThemeConfig } from "antd";

export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0a74b8",
    colorInfo: "#0a74b8",
    colorSuccess: "#15803d",
    colorWarning: "#b45309",
    colorError: "#b91c1c",
    borderRadius: 16,
    fontFamily:
      "\"Be Vietnam Pro\", \"Inter\", \"Segoe UI\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    colorBgLayout: "#f4f6fb",
    colorBgContainer: "#ffffff",
    colorBorderSecondary: "#d9e5f2",
    colorText: "#16324f",
  },
  components: {
    Layout: {
      headerBg: "rgba(255,255,255,0.92)",
      siderBg: "#f7fbff",
      bodyBg: "#f4f6fb",
    },
    Card: {
      borderRadiusLG: 20,
    },
    Menu: {
      itemBorderRadius: 14,
      itemMarginInline: 8,
      itemMarginBlock: 6,
      itemSelectedBg: "#e7f2fb",
      itemSelectedColor: "#0a74b8",
      itemHoverColor: "#0a74b8",
    },
    Button: {
      borderRadius: 14,
      controlHeight: 40,
    },
    Breadcrumb: {
      itemColor: "#69839d",
      lastItemColor: "#16324f",
    },
    Table: {
      borderColor: "#e1eaf4",
      headerBg: "#f4f8fd",
      rowHoverBg: "#f8fbff",
    },
  },
};

export const adminShellStyles = {
  sidebarWidth: 280,
  sidebarCollapsedWidth: 88,
  contentMaxWidth: 1440,
};
