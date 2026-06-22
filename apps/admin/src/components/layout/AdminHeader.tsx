import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Button, Space, Typography } from "antd";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LOGIN_PATH } from "../../config";
import { clearAuthStorage, getStoredIdentity } from "../../lib/auth-storage";
import { getRouteMeta } from "../../app/routes";

type AdminHeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

export function AdminHeader({ collapsed, onToggleSidebar }: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const route = getRouteMeta(location.pathname);
  const identity = getStoredIdentity<{ email?: string; name?: string }>();

  const breadcrumbItems = useMemo(
    () => [
      { title: "Quản trị" },
      { title: route.label },
    ],
    [route.label],
  );

  return (
    <div className="admin-shell-header">
      <Space size="middle">
        <Button
          type="text"
          size="large"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Mở menu" : "Thu gọn menu"}
        />
        <div>
          <Breadcrumb items={breadcrumbItems} />
          <Typography.Title level={4} style={{ margin: "8px 0 0" }}>
            {route.label}
          </Typography.Title>
        </div>
      </Space>
      <Space size="middle">
        <div className="admin-shell-user">
          <Typography.Text strong>{identity?.name ?? "Quản trị viên"}</Typography.Text>
          <Typography.Text type="secondary">{identity?.email ?? "admin@cynex.local"}</Typography.Text>
        </div>
        <Button
          icon={<LogoutOutlined />}
          onClick={() => {
            clearAuthStorage();
            navigate(LOGIN_PATH, { replace: true });
          }}
        >
          Đăng xuất
        </Button>
      </Space>
    </div>
  );
}
