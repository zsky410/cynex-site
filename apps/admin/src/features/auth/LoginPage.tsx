import { Button, Card, Form, Input, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_HOME_PATH, API_URL } from "../../config";
import { setAuthStorage } from "../../lib/auth-storage";
import { notifyError, notifySuccess } from "../../lib/notifications";

type LoginValues = {
  email: string;
  password: string;
};

type LoginLocationState = {
  redirectTo?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;

  async function submit(values: LoginValues) {
    try {
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Đăng nhập thất bại");
      const data = await response.json();
      setAuthStorage({ accessToken: data.accessToken, admin: data.admin ?? {} });
      notifySuccess("Đăng nhập thành công");

      const redirectTo =
        locationState && typeof locationState.redirectTo === "string"
          ? locationState.redirectTo
          : ADMIN_HOME_PATH;

      navigate(redirectTo, { replace: true });
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "linear-gradient(135deg, rgba(0, 21, 41, 0.06), rgba(22, 119, 255, 0.14))",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          Đăng nhập quản trị
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Đăng nhập để truy cập hệ thống quản trị Cynex.
        </Typography.Paragraph>
        <Form<LoginValues> layout="vertical" onFinish={submit}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Nhập email" }]}
          >
            <Input autoComplete="username" placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu" }]}
          >
            <Input.Password autoComplete="current-password" placeholder="Nhập mật khẩu" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
