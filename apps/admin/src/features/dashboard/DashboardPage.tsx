import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from "antd";
import { type CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { ADMIN_HOME_PATH } from "../../config";
import { getDashboardRecoveryAction } from "../../dashboardRecovery";
import { adminFetch } from "../../lib/admin-api";
import { clearAuthStorage, getStoredToken } from "../../lib/auth-storage";
import {
  getDashboardHighlights,
  getDashboardMetrics,
  type DashboardData,
  type DashboardHighlight,
} from "./dashboard-metrics";

function money(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function FlowBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%` : "0%";

  return (
    <div className="admin-chart-row">
      <div className="admin-chart-row-head">
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text strong>{value}</Typography.Text>
      </div>
      <div className="admin-chart-track">
        <div
          className="admin-chart-fill"
          style={
            {
              "--admin-chart-width": width,
              "--admin-chart-color": color,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}

function HighlightTile({ highlight }: { highlight: DashboardHighlight }) {
  return (
    <div className={`admin-highlight-tile admin-highlight-tile--${highlight.tone}`}>
      <Typography.Text>{highlight.label}</Typography.Text>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {highlight.value}
      </Typography.Title>
    </div>
  );
}

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
        subtitle="Gói gọn 4 chỉ số chính và các biểu đồ ưu tiên cho luồng đơn, tồn kho và áp lực xử lý."
      />
      <AsyncState loading={loading} error={error}>
        {data ? (
          (() => {
            const metrics = getDashboardMetrics(data);
            const highlights = getDashboardHighlights(data);
            const flowMax = Math.max(metrics.totalFlow, 1);
            const warrantyPressure =
              metrics.activeOrders + data.openWarrantyCases > 0
                ? Math.min(
                    100,
                    Number(
                      (
                        (data.openWarrantyCases /
                          (metrics.activeOrders + data.openWarrantyCases)) *
                        100
                      ).toFixed(2),
                    ),
                  )
                : 0;

            return (
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} xl={6}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--1">
                      <Statistic title="Đơn chờ xử lý" value={data.pending} />
                      <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                        Đơn đã thanh toán, đang chờ admin nhận việc.
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--2">
                      <Statistic title="Đang xử lý" value={data.processing} />
                      <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                        Đơn đang xử lý nội bộ hoặc đã gán tồn kho.
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--3">
                      <Statistic title="Doanh thu 7 ngày" value={money(data.revenue7Days)} />
                      <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                        Chiếm {metrics.revenueWindowShare}% tổng doanh thu đã thanh toán.
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--4">
                      <Statistic title="Tồn kho khả dụng" value={data.stock.totalAvailable} />
                      <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                        {data.stock.accountsAvailable} tài khoản, {data.stock.keysAvailable} key sẵn sàng giao.
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={14}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--2" title="Luồng đơn hàng">
                      <Space direction="vertical" size={18} style={{ width: "100%" }}>
                        <div className="admin-chart-badges">
                          <Tag color="blue">Tổng luồng: {metrics.totalFlow}</Tag>
                          <Tag color="cyan">Đơn đang chạy: {metrics.activeOrders}</Tag>
                          <Tag color={data.stalePendingOrders > 0 ? "gold" : "default"}>
                            Quá hạn: {data.stalePendingOrders}
                          </Tag>
                        </div>
                        <FlowBar label="Chờ xử lý" value={data.pending} max={flowMax} color="#0a74b8" />
                        <FlowBar label="Đang xử lý" value={data.processing} max={flowMax} color="#39a7f0" />
                        <FlowBar label="Giao hôm nay" value={data.deliveredToday} max={flowMax} color="#22a06b" />
                        <FlowBar label="Chờ quá hạn" value={data.stalePendingOrders} max={flowMax} color="#f59e0b" />
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} xl={10}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--3" title="Điểm nhấn hôm nay">
                      <div className="admin-highlight-grid">
                        {highlights.map((highlight) => (
                          <HighlightTile key={highlight.label} highlight={highlight} />
                        ))}
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={12}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--3" title="Cơ cấu tồn kho">
                      <div className="admin-stock-grid">
                        <div className="admin-stock-ring">
                          <Progress
                            type="circle"
                            percent={metrics.accountShare}
                            strokeColor="#0a74b8"
                            trailColor="#e8f1fb"
                            format={() => `${data.stock.accountsAvailable}`}
                          />
                          <Typography.Text>Tài khoản</Typography.Text>
                        </div>
                        <div className="admin-stock-ring">
                          <Progress
                            type="circle"
                            percent={metrics.keyShare}
                            strokeColor="#39a7f0"
                            trailColor="#e8f1fb"
                            format={() => `${data.stock.keysAvailable}`}
                          />
                          <Typography.Text>Key</Typography.Text>
                        </div>
                        <div className="admin-stock-ring">
                          <Progress
                            type="circle"
                            percent={metrics.sharedSlotShare}
                            strokeColor="#6d8ff7"
                            trailColor="#e9eeff"
                            format={() => `${data.stock.sharedWithSlots}`}
                          />
                          <Typography.Text>Slot dùng chung</Typography.Text>
                        </div>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} xl={12}>
                    <Card className="admin-dashboard-panel admin-animated-card admin-animated-card--4" title="Áp lực vận hành">
                      <div className="admin-metric-stack">
                        <div className="admin-metric-block">
                          <div className="admin-metric-head">
                            <Typography.Text strong>Đơn chờ quá hạn</Typography.Text>
                            <Typography.Text>{metrics.stalePressure}%</Typography.Text>
                          </div>
                          <Progress percent={metrics.stalePressure} strokeColor="#f59e0b" trailColor="#fdf0d9" showInfo={false} />
                          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            Tỷ lệ đơn chờ quá 24 giờ trên tổng đơn đang chờ xử lý.
                          </Typography.Paragraph>
                        </div>

                        <div className="admin-metric-block">
                          <div className="admin-metric-head">
                            <Typography.Text strong>Áp lực bảo hành</Typography.Text>
                            <Typography.Text>{warrantyPressure}%</Typography.Text>
                          </div>
                          <Progress percent={warrantyPressure} strokeColor="#e14c6f" trailColor="#f9e5ea" showInfo={false} />
                          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            So sánh case bảo hành mở với lượng đơn đang hoạt động.
                          </Typography.Paragraph>
                        </div>

                        <div className="admin-summary-grid">
                          <div className="admin-summary-chip">
                            <Typography.Text type="secondary">Doanh thu đã thanh toán</Typography.Text>
                            <Typography.Title level={4} style={{ margin: "6px 0 0" }}>
                              {money(data.revenue)}
                            </Typography.Title>
                          </div>
                          <div className="admin-summary-chip">
                            <Typography.Text type="secondary">Người dùng mới hôm nay</Typography.Text>
                            <Typography.Title level={4} style={{ margin: "6px 0 0" }}>
                              {data.newUsersToday}
                            </Typography.Title>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Space>
            );
          })()
        ) : null}
      </AsyncState>
    </>
  );
}
