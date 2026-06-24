import { Card, Form, Modal } from "antd";
import { useEffect, useState } from "react";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningAlert } from "../../components/common/IntegrityWarningAlert";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import { SourceFormFields, type SourcePayload, type SourceRecord } from "./SourceFormFields";

type SourceModalProps = {
  open: boolean;
  sourceId?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function SourceModal({ open, sourceId, onClose, onSaved }: SourceModalProps) {
  const [form] = Form.useForm<SourcePayload>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<SourceRecord | null>(null);
  const { handleSlugChange, syncAutoSlugState } = useAutoSlug(form);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setRecord(null);
      setError(null);
      syncAutoSlugState(null);
      return;
    }

    if (!sourceId) {
      const defaults: Partial<SourcePayload> = {
        contactChannel: "internal",
        defaultWarrantyDays: 0,
        status: "active",
      };
      form.setFieldsValue(defaults);
      syncAutoSlugState(defaults);
      return;
    }

    setLoading(true);
    setError(null);
    getResource<SourcePayload>("supply-sources", sourceId)
      .then((response) => {
        setRecord(response.data);
        form.setFieldsValue(response.data);
        syncAutoSlugState(response.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [form, open, sourceId, syncAutoSlugState]);

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
      onSaved();
      onClose();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu nguồn cung");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      destroyOnHidden
      footer={null}
      onCancel={onClose}
      open={open}
      title={sourceId ? "Chỉnh sửa nguồn cung" : "Tạo nguồn cung"}
      width={820}
    >
      <AsyncState loading={loading} error={error}>
        <Card bordered={false} styles={{ body: { padding: 0 } }}>
          <IntegrityWarningAlert integrityWarnings={record?.integrityWarnings} />
          <SourceFormFields
            form={form}
            saving={saving}
            onFinish={submit}
            onCancel={onClose}
            onSlugChange={handleSlugChange}
          />
        </Card>
      </AsyncState>
    </Modal>
  );
}
