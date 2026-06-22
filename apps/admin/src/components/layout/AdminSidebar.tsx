import { Menu, Typography } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { useLocation, useNavigate } from "react-router-dom";
import { adminNavGroups, getRouteMeta } from "../../app/routes";

type AdminSidebarProps = {
  collapsed: boolean;
};

export function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const items: ItemType[] = adminNavGroups.map((group) => ({
    key: group.key,
    type: "group",
    label: group.label,
    children: group.items.map((item) => ({
      key: item.path,
      icon: <item.icon />,
      label: item.label,
      disabled: item.enabled === false,
      title: item.description,
    })),
  }));

  const selectedPath = getRouteMeta(location.pathname).path;

  return (
    <div className="admin-sidebar-shell">
      <div className="admin-sidebar-brand">
        <Typography.Text strong>{collapsed ? "CX" : "Cynex Admin"}</Typography.Text>
        {!collapsed ? (
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Shell Ant Design
          </Typography.Paragraph>
        ) : null}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedPath]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  );
}
