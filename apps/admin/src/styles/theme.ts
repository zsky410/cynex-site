import type { ThemeConfig } from "antd";

export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    colorInfo: "#1677ff",
    colorSuccess: "#19a35b",
    colorWarning: "#d48806",
    colorError: "#d4380d",
    borderRadius: 14,
    fontFamily:
      "\"Be Vietnam Pro\", \"Inter\", \"Segoe UI\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    colorBgLayout: "#f4f7fb",
    colorBgContainer: "#ffffff",
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      bodyBg: "#f4f7fb",
    },
    Card: {
      borderRadiusLG: 18,
    },
    Menu: {
      itemBorderRadius: 12,
      itemMarginInline: 10,
      itemMarginBlock: 4,
    },
    Button: {
      borderRadius: 12,
    },
  },
};

export const adminShellStyles = {
  sidebarWidth: 280,
  sidebarCollapsedWidth: 88,
  contentMaxWidth: 1440,
};
