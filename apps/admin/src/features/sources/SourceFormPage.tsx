import { Button, Card, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningAlert, type IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { PageHeader } from "../../components/common/PageHeader";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type SourcePayload = {
  name: string;
  slug: string;
  contactName?: string;
  contactChannel: string;
  contactUrl?: string;
  telegramUsername?: string;
  discordUsername?: string;
  email?: string;
  phone?: string;
  defaultWarrantyDays?: number;
  warrantyPolicy?: string;
  notes?: string;
  rating?: number | null;
  status: string;
  integrityWarnings?: IntegrityWarning[];
};
type SourceRecord = SourcePayload;

const channelOptions = ["internal", "telegram", "discord", "website", "facebook", "email", "phone", "other"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));
const statusOptions = ["active", "inactive", "blocked", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function SourceFormPage() {
  const navigate = useNavigate();
  const { sourceId } = useParams();
  const [form] = Form.useForm<SourcePayload>();
  const [loading, setLoading] = useState(Boolean(sourceId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<SourceRecord | null>(null);

  useEffect(() => {
    if (!sourceId) {
      form.setFieldsValue({ contactChannel: "internal", defaultWarrantyDays: 0, status: "active" });
      return;
    }
    getResource<SourcePayload>("supply-sources", sourceId)
      .then((response) => {
        setRecord(response.data);
        form.setFieldsValue(response.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [form, sourceId]);

  async function submit(values: SourcePayload) {
    setSaving(true);
    try {
      if (sourceId) {
        await updateResource("supply-sources", sourceId, values as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật nguồn cung");
      } else {
        await createResource("supply-sources", values as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo nguồn cung");
      }
      navigate("/shell/sources", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu nguồn cung");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={`${sourceId ? labels.edit : labels.create} ${labels.sources}`} subtitle="Giữ nguyên toàn bộ field nguồn cung từ giao diện legacy." />
      <AsyncState loading={loading} error={error}>
        <Card>
          <IntegrityWarningAlert integrityWarnings={record?.integrityWarnings} />
          <Form<SourcePayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Tên nguồn" name="name" rules={[{ required: true, message: "Nhập tên nguồn" }]}><Input /></Form.Item>
            <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}><Input /></Form.Item>
            <Form.Item label="Tên liên hệ" name="contactName"><Input /></Form.Item>
            <Form.Item label="Kênh liên hệ" name="contactChannel"><Select options={channelOptions} /></Form.Item>
            <Form.Item label="URL liên hệ" name="contactUrl"><Input /></Form.Item>
            <Form.Item label="Tên đăng nhập Telegram" name="telegramUsername"><Input /></Form.Item>
            <Form.Item label="Tên đăng nhập Discord" name="discordUsername"><Input /></Form.Item>
            <Form.Item label="Email" name="email"><Input /></Form.Item>
            <Form.Item label="Số điện thoại" name="phone"><Input /></Form.Item>
            <Form.Item label="Bảo hành mặc định (ngày)" name="defaultWarrantyDays"><InputNumber style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Chính sách bảo hành" name="warrantyPolicy"><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="Ghi chú" name="notes"><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="Đánh giá" name="rating"><InputNumber style={{ width: "100%" }} /></Form.Item>
            <Form.Item label={labels.status} name="status"><Select options={statusOptions} /></Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>{labels.save}</Button>
              <Button onClick={() => navigate("/shell/sources")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
