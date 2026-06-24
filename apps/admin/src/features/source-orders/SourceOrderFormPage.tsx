import { Button, Card, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningAlert, type IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { PageHeader } from "../../components/common/PageHeader";
import { AdminFileUploadField, type AdminUploadedFile } from "../../components/files/AdminFileUploadField";
import { createResource, getResource, listResource, updateResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type SourceOption = { id: string; name: string };
type SourceOrderPayload = {
  sourceId: string;
  orderId?: string;
  orderItemId?: string;
  externalRef?: string;
  cost?: number | null;
  status: string;
  sourcePayload?: string;
  note?: string;
  proofFileIds?: string[];
  integrityWarnings?: IntegrityWarning[];
};
type SourceOrderRecord = SourceOrderPayload & {
  proofFiles?: AdminUploadedFile[];
};
type SourceOrderFormValues = Omit<SourceOrderPayload, "proofFileIds"> & {
  proofFiles?: AdminUploadedFile[];
};

const statusOptions = ["not_ordered", "ordered", "waiting_source", "source_delivered", "source_failed", "claimed_warranty", "cancelled"].map((value) => ({ value, label: getDisplayLabel(value) }));

export default function SourceOrderFormPage() {
  const navigate = useNavigate();
  const { sourceOrderId } = useParams();
  const [form] = Form.useForm<SourceOrderFormValues>();
  const [sourceOptions, setSourceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<SourceOrderRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listResource<SourceOption>("supply-sources", { page: 1, perPage: 100, sort: "id", order: "DESC", filter: {} }),
      sourceOrderId ? getResource<SourceOrderRecord>("source-orders", sourceOrderId) : Promise.resolve(null),
    ])
      .then(([sourcesResponse, sourceOrderResponse]) => {
        if (cancelled) return;
        setSourceOptions(sourcesResponse.data.map((source) => ({ value: source.id, label: source.name })));
        if (sourceOrderResponse) {
          setRecord(sourceOrderResponse.data);
          form.setFieldsValue({
            ...sourceOrderResponse.data,
            proofFiles: sourceOrderResponse.data.proofFiles ?? [],
          });
        } else {
          form.setFieldsValue({ status: "not_ordered" });
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
  }, [form, sourceOrderId]);

  async function submit(values: SourceOrderFormValues) {
    setSaving(true);
    const payload: SourceOrderPayload = {
      sourceId: values.sourceId,
      orderId: values.orderId,
      orderItemId: values.orderItemId,
      externalRef: values.externalRef,
      cost: values.cost,
      status: values.status,
      sourcePayload: values.sourcePayload,
      note: values.note,
      proofFileIds: values.proofFiles?.map((file) => file.id) ?? [],
    };
    try {
      if (sourceOrderId) {
        await updateResource("source-orders", sourceOrderId, payload as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật đơn nhập");
      } else {
        await createResource("source-orders", payload as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo đơn nhập");
      }
      navigate("/shell/source-orders", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu đơn nhập");
    } finally {
      setSaving(false);
    }
  }

  const selectedSourceId = Form.useWatch("sourceId", form);
  const resolvedSourceOptions =
    selectedSourceId && !sourceOptions.some((option) => option.value === selectedSourceId)
      ? [{ value: selectedSourceId, label: `Thiếu nguồn (${selectedSourceId})` }, ...sourceOptions]
      : sourceOptions;

  return (
    <>
      <PageHeader title={`${sourceOrderId ? labels.edit : labels.create} ${labels.sourceOrders}`} subtitle="Giữ nguyên field đơn hàng và source payload của màn hình legacy." />
      <AsyncState loading={loading} error={error}>
        <Card>
          <IntegrityWarningAlert integrityWarnings={record?.integrityWarnings} />
          <Form<SourceOrderFormValues> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Nguồn cung" name="sourceId" rules={[{ required: true, message: "Chọn nguồn cung" }]}><Select options={resolvedSourceOptions} /></Form.Item>
            <Form.Item label="Order ID" name="orderId"><Input /></Form.Item>
            <Form.Item label="Order item ID" name="orderItemId"><Input /></Form.Item>
            <Form.Item label="Mã tham chiếu ngoài" name="externalRef"><Input /></Form.Item>
            <Form.Item label="Chi phí" name="cost"><InputNumber style={{ width: "100%" }} /></Form.Item>
            <Form.Item label={labels.status} name="status"><Select options={statusOptions} /></Form.Item>
            <Form.Item label="Source payload" name="sourcePayload"><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="Proof nguồn hàng" name="proofFiles">
              <AdminFileUploadField multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.txt" />
            </Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>{labels.save}</Button>
              <Button onClick={() => navigate("/shell/source-orders")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
