import { Card, Col, Row, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_HOME_PATH } from "../../config";
import { adminFetch } from "../../lib/admin-api";
import { clearAuthStorage, getStoredToken } from "../../lib/auth-storage";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { getDashboardRecoveryAction } from "../../dashboardRecovery";

type DashboardData = {
  pending: number;
  processing: number;
  deliveredToday: number;
  revenue: number;
  revenue7Days: number;
  newUsersToday: number;
  openWarrantyCases: number;
  stalePendingOrders: number;
  stock: {
    accountsAvailable: number;
    keysAvailable: number;
    totalAvailable: number;
    sharedWithSlots: number;
  };
};

function money(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

const cardDefinitions = (data: DashboardData) => [
  {
    title: "Đơn chờ xử lý",
    value: data.pending,
    note: "Đơn đã thanh toán, chờ admin xử lý",
  },
  {
    title: "Đang xử lý",
    value: data.processing,
    note: "Đơn đang xử lý hoặc đã gán",
  },
  {
    title: "Giao hôm nay",
    value: data.deliveredToday,
    note: "Đơn giao thành công trong ngày",
  },
  {
    title: "Doanh thu paid",
    value: money(data.revenue),
    note: "Tổng đơn hàng trạng thái paid",
  },
  {
    title: "Doanh thu 7 ngày",
    value: money(data.revenue7Days),
    note: "Doanh thu 7 ngày gần nhất",
  },
  {
    title: "Người dùng mới",
    value: data.newUsersToday,
    note: "User đăng ký hôm nay",
  },
  {
    title: "Bảo hành mở",
    value: data.openWarrantyCases,
    note: "Case bảo hành đang mở",
  },
  {
    title: "Đơn chờ quá hạn",
    value: data.stalePendingOrders,
    note: "Đơn chờ admin hơn 24 giờ",
  },
  {
    title: "Tồn kho khả dụng",
    value: data.stock.totalAvailable,
    note: `Acc: ${data.stock.accountsAvailable} · Keys: ${data.stock.keysAvailable} · Shared slots: ${data.stock.sharedWithSlots}`,
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (getDashboardRecoveryAction({ hasToken: Boolean(token) }) === "logout") {
      clearAuthStorage();
      navigate(ADMIN_HOME_PATH === "/dashboard" ? "/login" : "/login", { replace: true });
      return;
    }

    adminFetch<DashboardData>("/admin/dashboard")
      .then((response) => setData(response))
      .catch((err: Error & { status?: number }) => {
        if (getDashboardRecoveryAction({ hasToken: true, status: err.status }) === "logout") {
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <>
      <PageHeader
        title="Tổng quan vận hành"
        subtitle="Ảnh chụp nhanh tình trạng đơn hàng, doanh thu và tồn kho của hệ thống Cynex."
      />
      <AsyncState loading={loading} error={error}>
        {data ? (
          <Row gutter={[16, 16]}>
            {cardDefinitions(data).map((card) => (
              <Col key={card.title} xs={24} sm={12} xl={8}>
                <Card className="admin-dashboard-panel">
                  <Statistic title={card.title} value={card.value} />
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 12 }}>
                    {card.note}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        ) : null}
      </AsyncState>
    </>
  );
}
