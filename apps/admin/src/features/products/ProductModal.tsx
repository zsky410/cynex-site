import { Card, Form, Modal } from "antd";
import { useEffect, useState } from "react";
import { AsyncState } from "../../components/common/AsyncState";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import { buildProductPayload, ProductFormFields, type ProductFormValues, type ProductRecord } from "./ProductFormFields";

type ProductModalProps = {
  open: boolean;
  productId?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ProductModal({ open, productId, onClose, onSaved }: ProductModalProps) {
  const [form] = Form.useForm<ProductFormValues>();
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

    if (!productId) {
      const defaults: Partial<ProductFormValues> = { status: "draft", sortOrder: 0 };
      form.setFieldsValue(defaults);
      syncAutoSlugState(defaults);
      return;
    }

    setLoading(true);
    setError(null);
    getResource<ProductRecord>("products", productId)
      .then((response) => {
        const values: ProductFormValues = {
          ...response.data,
          image: response.data.image ?? null,
          guideFiles: response.data.guideFiles ?? [],
        };
        form.setFieldsValue(values);
        syncAutoSlugState(values);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [form, open, productId, syncAutoSlugState]);

  async function submit(values: ProductFormValues) {
    setSaving(true);
    try {
      const payload = buildProductPayload(values);
      if (productId) {
        await updateResource("products", productId, payload as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật sản phẩm");
      } else {
        await createResource("products", payload as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo sản phẩm");
      }
      onSaved();
      onClose();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu sản phẩm");
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
      title={productId ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm"}
      width={820}
    >
      <AsyncState loading={loading} error={error}>
        <Card bordered={false} styles={{ body: { padding: 0 } }}>
          <ProductFormFields
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
