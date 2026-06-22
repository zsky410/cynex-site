import { DashboardOutlined, RocketOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { adminNavGroups } from "./app/routes";
import { PageHeader } from "./components/common/PageHeader";

const activeMigrations = adminNavGroups
  .flatMap((group) => group.items)
  .filter((item) => item.path !== "/dashboard");

export default function App() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Tổng quan shell quản trị"
        subtitle="Router, đăng nhập và khung Ant Design đã sẵn sàng. Các resource page sẽ được thay thế dần mà không đổi API contract."
        extra={<Tag color="blue">Phase 1</Tag>}
      />

      <Card className="admin-dashboard-panel">
        <Space direction="vertical" size={12}>
          <Space size="middle">
            <DashboardOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Dashboard tạm thời
            </Typography.Title>
          </Space>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            `Dashboard.tsx` hiện vẫn phụ thuộc vào React Admin context, nên route protected mới đang
            dùng một landing page an toàn trong khi shell được ghép vào codebase.
          </Typography.Paragraph>
          <Typography.Paragraph style={{ margin: 0 }}>
            Mục tiêu của bước này là đưa vào production một khung điều hướng mới, để các task tiếp
            theo chỉ việc thay nội dung từng màn hình.
          </Typography.Paragraph>
        </Space>
      </Card>

      <Row gutter={[16, 16]} className="admin-dashboard-grid">
        {activeMigrations.map((item) => (
          <Col key={item.key} xs={24} md={12} xl={8}>
            <Card className="admin-dashboard-panel">
              <Space direction="vertical" size={10}>
                <Space size="middle">
                  <item.icon />
                  <Typography.Text strong>{item.label}</Typography.Text>
                </Space>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                  {item.description}
                </Typography.Paragraph>
                <Link to={item.path}>
                  <Space size={6}>
                    <RocketOutlined />
                    <span>Mở route tạm thời</span>
                  </Space>
                </Link>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
