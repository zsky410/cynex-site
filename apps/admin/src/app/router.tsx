import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import { LOGIN_PATH } from "../config";
import LoginPage from "../features/auth/LoginPage";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AdminLayout } from "../components/layout/AdminLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import ProductFormPage from "../features/products/ProductFormPage";
import ProductListPage from "../features/products/ProductListPage";
import VariantFormPage from "../features/variants/VariantFormPage";
import VariantListPage from "../features/variants/VariantListPage";
import OrderListPage from "../features/orders/OrderListPage";
import OrderDetailPage from "../features/orders/OrderDetailPage";
import UserListPage from "../features/users/UserListPage";
import UserDetailPage from "../features/users/UserDetailPage";
import UserEditPage from "../features/users/UserEditPage";
import SourceListPage from "../features/sources/SourceListPage";
import SourceFormPage from "../features/sources/SourceFormPage";
import SourceOrderListPage from "../features/source-orders/SourceOrderListPage";
import SourceOrderFormPage from "../features/source-orders/SourceOrderFormPage";
import AccountListPage from "../features/inventory/AccountListPage";
import AccountFormPage from "../features/inventory/AccountFormPage";
import KeyListPage from "../features/inventory/KeyListPage";
import KeyFormPage from "../features/inventory/KeyFormPage";
import WarrantyListPage from "../features/warranty/WarrantyListPage";
import WarrantyDetailPage from "../features/warranty/WarrantyDetailPage";
import WarrantyEditPage from "../features/warranty/WarrantyEditPage";
import EmailLogListPage from "../features/logs/EmailLogListPage";
import EmailLogDetailPage from "../features/logs/EmailLogDetailPage";
import AuditLogListPage from "../features/logs/AuditLogListPage";
import AuditLogDetailPage from "../features/logs/AuditLogDetailPage";

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
          {
            path: "users",
            element: <UserListPage />,
          },
          {
            path: "users/:userId",
            element: <UserDetailPage />,
          },
          {
            path: "users/:userId/edit",
            element: <UserEditPage />,
          },
          {
            path: "sources",
            element: <SourceListPage />,
          },
          {
            path: "sources/new",
            element: <SourceFormPage />,
          },
          {
            path: "sources/:sourceId/edit",
            element: <SourceFormPage />,
          },
          {
            path: "source-orders",
            element: <SourceOrderListPage />,
          },
          {
            path: "source-orders/new",
            element: <SourceOrderFormPage />,
          },
          {
            path: "source-orders/:sourceOrderId/edit",
            element: <SourceOrderFormPage />,
          },
          {
            path: "inventory/accounts",
            element: <AccountListPage />,
          },
          {
            path: "inventory/accounts/new",
            element: <AccountFormPage />,
          },
          {
            path: "inventory/accounts/:accountId/edit",
            element: <AccountFormPage />,
          },
          {
            path: "inventory/keys",
            element: <KeyListPage />,
          },
          {
            path: "inventory/keys/new",
            element: <KeyFormPage />,
          },
          {
            path: "inventory/keys/:keyId/edit",
            element: <KeyFormPage />,
          },
          {
            path: "warranty",
            element: <WarrantyListPage />,
          },
          {
            path: "warranty/:warrantyId",
            element: <WarrantyDetailPage />,
          },
          {
            path: "warranty/:warrantyId/edit",
            element: <WarrantyEditPage />,
          },
          {
            path: "email-logs",
            element: <EmailLogListPage />,
          },
          {
            path: "email-logs/:emailLogId",
            element: <EmailLogDetailPage />,
          },
          {
            path: "audit-logs",
            element: <AuditLogListPage />,
          },
          {
            path: "audit-logs/:auditLogId",
            element: <AuditLogDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <App />,
  },
]);
