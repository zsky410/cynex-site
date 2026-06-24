import { Button, Card, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningAlert, type IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { PageHeader } from "../../components/common/PageHeader";
import { createResource, getResource, listResource, updateResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type VariantOption = { id: string; name: string };
type SourceOption = { id: string; name: string };
type KeyPayload = {
  productVariantId: string;
  sourceId?: string;
  key?: string;
  publicNote?: string;
  cost?: number;
  status: string;
  integrityWarnings?: IntegrityWarning[];
};
type KeyRecord = KeyPayload;

const statusOptions = ["available", "assigned", "delivered", "invalid", "replaced", "refunded"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function KeyFormPage() {
  const navigate = useNavigate();
  const { keyId } = useParams();
  const [form] = Form.useForm<KeyPayload>();
  const [variantOptions, setVariantOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [sourceOptions, setSourceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<KeyRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listResource<VariantOption>("product-variants", { page: 1, perPage: 100, sort: "id", order: "DESC", filter: {} }),
      listResource<SourceOption>("supply-sources", { page: 1, perPage: 100, sort: "id", order: "DESC", filter: {} }),
      keyId ? getResource<KeyPayload>("inventory-keys", keyId) : Promise.resolve(null),
    ])
      .then(([variantsResponse, sourcesResponse, keyResponse]) => {
        if (cancelled) return;
        setVariantOptions(variantsResponse.data.map((item) => ({ value: item.id, label: item.name })));
        setSourceOptions(sourcesResponse.data.map((item) => ({ value: item.id, label: item.name })));
        if (keyResponse) {
          setRecord(keyResponse.data);
          form.setFieldsValue(keyResponse.data);
        } else {
          form.setFieldsValue({ status: "available" });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form, keyId]);

  async function submit(values: KeyPayload) {
    setSaving(true);
    try {
      if (keyId) {
        await updateResource("inventory-keys", keyId, values as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật key");
      } else {
        await createResource("inventory-keys", values as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo key");
      }
      navigate("/shell/inventory/keys", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu key");
    } finally {
      setSaving(false);
    }
  }

  const selectedVariantId = Form.useWatch("productVariantId", form);
  const selectedSourceId = Form.useWatch("sourceId", form);
  const resolvedVariantOptions =
    selectedVariantId && !variantOptions.some((option) => option.value === selectedVariantId)
      ? [{ value: selectedVariantId, label: `Thiếu biến thể (${selectedVariantId})` }, ...variantOptions]
      : variantOptions;
  const resolvedSourceOptions =
    selectedSourceId && !sourceOptions.some((option) => option.value === selectedSourceId)
      ? [{ value: selectedSourceId, label: `Thiếu nguồn (${selectedSourceId})` }, ...sourceOptions]
      : sourceOptions;

  return (
    <>
      <PageHeader title={`${keyId ? labels.edit : labels.create} ${labels.inventoryKeys}`} subtitle="Giữ nguyên field key/variant/source như giao diện legacy." />
      <AsyncState loading={loading} error={error}>
        <Card>
          <IntegrityWarningAlert integrityWarnings={record?.integrityWarnings} />
          <Form<KeyPayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Biến thể" name="productVariantId" rules={[{ required: true, message: "Chọn biến thể" }]}><Select options={resolvedVariantOptions} /></Form.Item>
            <Form.Item label="Nguồn cung" name="sourceId"><Select allowClear options={resolvedSourceOptions} /></Form.Item>
            <Form.Item label="Key" name="key"><Input.Password /></Form.Item>
            <Form.Item label="Ghi chú công khai" name="publicNote"><Input /></Form.Item>
            <Form.Item label="Chi phí" name="cost"><InputNumber style={{ width: "100%" }} /></Form.Item>
            <Form.Item label={labels.status} name="status"><Select options={statusOptions} /></Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>{labels.save}</Button>
              <Button onClick={() => navigate("/shell/inventory/keys")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
