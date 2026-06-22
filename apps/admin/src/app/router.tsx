import { DashboardOutlined } from "@ant-design/icons";
import { Card, Space, Tag, Typography } from "antd";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import { LOGIN_PATH } from "../config";
import LoginPage from "../features/auth/LoginPage";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AdminLayout } from "../components/layout/AdminLayout";
import { PageHeader } from "../components/common/PageHeader";
import DashboardPage from "../features/dashboard/DashboardPage";
import ProductFormPage from "../features/products/ProductFormPage";
import ProductListPage from "../features/products/ProductListPage";
import VariantFormPage from "../features/variants/VariantFormPage";
import VariantListPage from "../features/variants/VariantListPage";
import OrderListPage from "../features/orders/OrderListPage";
import OrderDetailPage from "../features/orders/OrderDetailPage";
import { adminNavGroups } from "./routes";

function ShellOverviewPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Shell Ant Design an toàn"
        subtitle="Khu vực này dùng để rollout router, điều hướng và giao diện mới mà không chặn các màn hình React Admin hiện tại."
        extra={<Tag color="blue">Shell preview</Tag>}
      />
      <Card className="admin-dashboard-panel">
        <Space direction="vertical" size={12}>
          <Space size="middle">
            <DashboardOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Legacy routes vẫn là mặc định
            </Typography.Title>
          </Space>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Các route như sản phẩm, đơn hàng, tồn kho và audit vẫn chạy qua React Admin để tránh
            regression trong giai đoạn chuyển đổi.
          </Typography.Paragraph>
          <Typography.Paragraph style={{ margin: 0 }}>
            Shell mới chỉ hiển thị điều hướng và placeholder an toàn cho đến khi từng resource page
            được migrate hoàn chỉnh.
          </Typography.Paragraph>
        </Space>
      </Card>
    </Space>
  );
}

const fallbackShellRoutes = adminNavGroups
  .flatMap((group) => group.items)
  .filter((item) => item.key !== "dashboard" && item.legacyPath);

export const router = createBrowserRouter([
  {
    path: LOGIN_PATH,
    element: <LoginPage />,
  },
  {
    path: "/shell",
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/shell/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "products",
            element: <ProductListPage />,
          },
          {
            path: "products/new",
            element: <ProductFormPage />,
          },
          {
            path: "products/:productId/edit",
            element: <ProductFormPage />,
          },
          {
            path: "variants",
            element: <VariantListPage />,
          },
          {
            path: "variants/new",
            element: <VariantFormPage />,
          },
          {
            path: "variants/:variantId/edit",
            element: <VariantFormPage />,
          },
          {
            path: "orders",
            element: <OrderListPage />,
          },
          {
            path: "orders/:orderId",
            element: <OrderDetailPage />,
          },
          ...fallbackShellRoutes.map((item) => ({
            path: item.path.replace(/^\/shell\//, ""),
            element: <Navigate to={item.legacyPath!} replace />,
          })),
        ],
      },
    ],
  },
  {
    path: "*",
    element: <App />,
  },
]);
