import { Card, Form } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningAlert, type IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { PageHeader } from "../../components/common/PageHeader";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import { SourceFormFields, type SourcePayload, type SourceRecord } from "./SourceFormFields";

export default function SourceFormPage() {
  const navigate = useNavigate();
  const { sourceId } = useParams();
  const [form] = Form.useForm<SourcePayload>();
  const [loading, setLoading] = useState(Boolean(sourceId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<SourceRecord | null>(null);
  const { handleSlugChange, syncAutoSlugState } = useAutoSlug(form);

  useEffect(() => {
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
    getResource<SourcePayload>("supply-sources", sourceId)
      .then((response) => {
        setRecord(response.data);
        form.setFieldsValue(response.data);
        syncAutoSlugState(response.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [form, sourceId, syncAutoSlugState]);

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
          <SourceFormFields
            form={form}
            saving={saving}
            onFinish={submit}
            onCancel={() => navigate("/shell/sources")}
            onSlugChange={handleSlugChange}
          />
        </Card>
      </AsyncState>
    </>
  );
}
