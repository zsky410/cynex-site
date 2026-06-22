import { Layout, theme } from "antd";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { adminShellStyles } from "../../styles/theme";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <Layout.Sider
        width={adminShellStyles.sidebarWidth}
        collapsedWidth={adminShellStyles.sidebarCollapsedWidth}
        collapsible
        trigger={null}
        collapsed={collapsed}
        theme="light"
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <AdminSidebar collapsed={collapsed} />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            padding: 0,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <AdminHeader
            collapsed={collapsed}
            onToggleSidebar={() => setCollapsed((value) => !value)}
          />
        </Layout.Header>
        <Layout.Content className="admin-shell-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
