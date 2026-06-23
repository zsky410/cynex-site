import { Button, Card, Form, Input, Space, Switch } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { getResource, updateResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type UserPayload = {
  email: string;
  name?: string | null;
  isLocked: boolean;
};

export default function UserEditPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [form] = Form.useForm<UserPayload>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getResource<UserPayload>("users", userId)
      .then((response) => form.setFieldsValue(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [form, userId]);

  async function submit(values: UserPayload) {
    if (!userId) return;
    setSaving(true);
    try {
      await updateResource("users", userId, {
        name: values.name,
        isLocked: values.isLocked,
      });
      notifySuccess("Đã cập nhật người dùng");
      navigate(`/shell/users/${userId}`, { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu người dùng");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={`${labels.edit} ${labels.users}`}
        subtitle="Giữ nguyên field chỉnh sửa của user từ màn hình legacy."
      />
      <AsyncState loading={loading} error={error}>
        <Card>
          <Form<UserPayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Tên" name="name">
              <Input />
            </Form.Item>
            <Form.Item label="Khóa đăng nhập" name="isLocked" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>
                {labels.save}
              </Button>
              <Button onClick={() => navigate(userId ? `/shell/users/${userId}` : "/shell/users")}>
                {labels.cancel}
              </Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
