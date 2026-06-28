import { Form, Modal } from "antd";
import { useEffect, useState } from "react";
import { AsyncState } from "../../components/common/AsyncState";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import {
  buildProductPayload,
  normalizeProductStatus,
  ProductFormFields,
  type ProductFormValues,
  type ProductRecord,
} from "./ProductFormFields";

type ProductModalProps = {
  open: boolean;
  productId?: string | null;
  onClose: () => void;
  onSaved: (product: { id: string; name: string; created: boolean }) => void;
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
      const defaults: Partial<ProductFormValues> = { status: "inactive" };
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
          status: normalizeProductStatus(response.data.status),
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
      let savedProduct: ProductRecord;
      if (productId) {
        const response = await updateResource<ProductRecord>("products", productId, payload as unknown as Record<string, unknown>);
        savedProduct = response.data;
        notifySuccess("Đã cập nhật sản phẩm");
      } else {
        const response = await createResource<ProductRecord>("products", payload as unknown as Record<string, unknown>);
        savedProduct = response.data;
        notifySuccess("Đã tạo sản phẩm");
      }
      onSaved({ id: savedProduct.id, name: savedProduct.name, created: !productId });
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
        <ProductFormFields
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
