import { Form, Modal } from "antd";
import { useEffect, useState } from "react";
import { AsyncState } from "../../components/common/AsyncState";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import {
  buildCategoryPayload,
  CategoryFormFields,
  type CategoryFormValues,
  type CategoryRecord,
} from "./CategoryFormFields";

type CategoryModalProps = {
  open: boolean;
  categoryId?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CategoryModal({ open, categoryId, onClose, onSaved }: CategoryModalProps) {
  const [form] = Form.useForm<CategoryFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSlugChange, syncAutoSlugState } = useAutoSlug(form);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setError(null);
      syncAutoSlugState(null);
      return;
    }

    if (!categoryId) {
      const defaults: Partial<CategoryFormValues> = {};
      form.setFieldsValue(defaults);
      syncAutoSlugState(defaults);
      return;
    }

    setLoading(true);
    setError(null);
    getResource<CategoryRecord>("categories", categoryId)
      .then((response) => {
        form.setFieldsValue(response.data);
        syncAutoSlugState(response.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId, form, open, syncAutoSlugState]);

  async function submit(values: CategoryFormValues) {
    setSaving(true);
    try {
      const payload = buildCategoryPayload(values);
      if (categoryId) {
        await updateResource("categories", categoryId, payload as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật danh mục");
      } else {
        await createResource("categories", payload as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo danh mục");
      }
      onSaved();
      onClose();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu danh mục");
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
      title={categoryId ? "Chỉnh sửa danh mục" : "Tạo danh mục"}
      width={720}
    >
      <AsyncState loading={loading} error={error}>
        <CategoryFormFields
          form={form}
          saving={saving}
          onFinish={submit}
          onCancel={onClose}
          onSlugChange={handleSlugChange}
        />
      </AsyncState>
    </Modal>
  );
}
