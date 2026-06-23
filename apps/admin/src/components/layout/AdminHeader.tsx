import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { LOGIN_PATH } from "../../config";
import { clearAuthStorage, getStoredIdentity } from "../../lib/auth-storage";

type AdminHeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

export function AdminHeader({ collapsed, onToggleSidebar }: AdminHeaderProps) {
  const navigate = useNavigate();
  const identity = getStoredIdentity<{ email?: string; name?: string }>();

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
