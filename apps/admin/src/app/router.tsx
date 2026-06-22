import { DashboardOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Card, Result, Space, Typography } from "antd";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import { ADMIN_HOME_PATH, LOGIN_PATH } from "../config";
import LoginPage from "../features/auth/LoginPage";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AdminLayout } from "../components/layout/AdminLayout";

function ComingSoonPage() {
  return (
    <Card className="admin-dashboard-panel">
      <Result
        icon={<LockOutlined style={{ color: "#1677ff" }} />}
        title="Khu vực này sẽ được chuyển sang Ant Design ở bước tiếp theo"
        subTitle="Shell, router và đăng nhập đã sẵn sàng. Các resource page sẽ được migrate riêng theo từng task."
        extra={
          <Typography.Text type="secondary">
            Giữ nguyên API contract hiện tại trong khi thay thế dần giao diện quản trị.
          </Typography.Text>
        }
      />
    </Card>
  );
}

export const router = createBrowserRouter([
  {
    path: LOGIN_PATH,
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ADMIN_HOME_PATH} replace />,
          },
          {
            path: ADMIN_HOME_PATH.replace(/^\//, ""),
            element: <App />,
          },
          {
            path: "products",
            element: <ComingSoonPage />,
          },
          {
            path: "variants",
            element: <ComingSoonPage />,
          },
          {
            path: "orders",
            element: <ComingSoonPage />,
          },
          {
            path: "users",
            element: <ComingSoonPage />,
          },
          {
            path: "warranty",
            element: <ComingSoonPage />,
          },
          {
            path: "sources",
            element: <ComingSoonPage />,
          },
          {
            path: "source-orders",
            element: <ComingSoonPage />,
          },
          {
            path: "inventory/accounts",
            element: <ComingSoonPage />,
          },
          {
            path: "inventory/keys",
            element: <ComingSoonPage />,
          },
          {
            path: "email-logs",
            element: <ComingSoonPage />,
          },
          {
            path: "audit-logs",
            element: <ComingSoonPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={ADMIN_HOME_PATH} replace />,
  },
]);
