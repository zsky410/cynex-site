import { Card, Form } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import {
  buildCategoryPayload,
  CategoryFormFields,
  type CategoryFormValues,
  type CategoryRecord,
} from "./CategoryFormFields";

export default function CategoryFormPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [form] = Form.useForm<CategoryFormValues>();
  const [loading, setLoading] = useState(Boolean(categoryId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSlugChange, syncAutoSlugState } = useAutoSlug(form);
  const isEdit = Boolean(categoryId);

  useEffect(() => {
    if (!categoryId) {
      const defaults: Partial<CategoryFormValues> = {};
      form.setFieldsValue(defaults);
      syncAutoSlugState(defaults);
      return;
    }

    getResource<CategoryRecord>("categories", categoryId)
      .then((response) => {
        form.setFieldsValue(response.data);
        syncAutoSlugState(response.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId, form, syncAutoSlugState]);

  async function submit(values: CategoryFormValues) {
    setSaving(true);
    const payload = buildCategoryPayload(values);
    try {
      if (categoryId) {
        await updateResource("categories", categoryId, payload as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật danh mục");
      } else {
        await createResource("categories", payload as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo danh mục");
      }
      navigate("/shell/categories", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu danh mục");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `${labels.edit} ${labels.categories}` : `${labels.create} ${labels.categories}`}
        subtitle="Quản lý danh mục thật để storefront và admin cùng dùng một nguồn dữ liệu."
      />
      <AsyncState loading={loading} error={error}>
        <Card>
          <CategoryFormFields
            form={form}
            saving={saving}
            onFinish={submit}
            onCancel={() => navigate("/shell/categories")}
            onSlugChange={handleSlugChange}
          />
        </Card>
      </AsyncState>
    </>
  );
}
