import { Button, Card, Form, Input, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { getResource, updateResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type WarrantyPayload = {
  status: string;
  adminNote?: string;
  sourceId?: string;
  sourceOrderId?: string;
  inventoryAccountId?: string;
  inventoryKeyId?: string;
};

const statusOptions = ["open", "waiting_admin", "waiting_customer", "processing", "resolved", "rejected", "closed"].map((value) => ({ value, label: getDisplayLabel(value) }));

export default function WarrantyEditPage() {
  const navigate = useNavigate();
  const { warrantyId } = useParams();
  const [form] = Form.useForm<WarrantyPayload>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!warrantyId) return;
    getResource<WarrantyPayload>("warranty-cases", warrantyId)
      .then((response) => form.setFieldsValue(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [form, warrantyId]);

  async function submit(values: WarrantyPayload) {
    if (!warrantyId) return;
    setSaving(true);
    try {
      await updateResource("warranty-cases", warrantyId, values as unknown as Record<string, unknown>);
      notifySuccess("Đã cập nhật case bảo hành");
      navigate(`/shell/warranty/${warrantyId}`, { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu case bảo hành");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={`${labels.edit} ${labels.warranty}`} subtitle="Giữ nguyên field chỉnh sửa case bảo hành từ giao diện legacy." />
      <AsyncState loading={loading} error={error}>
        <Card>
          <Form<WarrantyPayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label={labels.status} name="status"><Select options={statusOptions} /></Form.Item>
            <Form.Item label="Ghi chú admin" name="adminNote"><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="Source ID" name="sourceId"><Input /></Form.Item>
            <Form.Item label="Source order ID" name="sourceOrderId"><Input /></Form.Item>
            <Form.Item label="Inventory account ID" name="inventoryAccountId"><Input /></Form.Item>
            <Form.Item label="Inventory key ID" name="inventoryKeyId"><Input /></Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>{labels.save}</Button>
              <Button onClick={() => navigate(warrantyId ? `/shell/warranty/${warrantyId}` : "/shell/warranty")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
