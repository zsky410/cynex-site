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
  buildProductPayload,
  normalizeProductStatus,
  ProductFormFields,
  type ProductFormValues,
  type ProductRecord,
} from "./ProductFormFields";

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [form] = Form.useForm<ProductFormValues>();
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSlugChange, syncAutoSlugState } = useAutoSlug(form);

  const isEdit = Boolean(productId);

  useEffect(() => {
    if (!productId) {
      const defaults: Partial<ProductFormValues> = { status: "inactive" };
      form.setFieldsValue(defaults);
      syncAutoSlugState(defaults);
      return;
    }

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
  }, [productId, form, syncAutoSlugState]);

  async function submit(values: ProductFormValues) {
    setSaving(true);
    const payload = buildProductPayload(values);
    try {
      if (productId) {
        await updateResource("products", productId, payload as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật sản phẩm");
      } else {
        await createResource("products", payload as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo sản phẩm");
      }
      navigate("/shell/products", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `${labels.edit} ${labels.products}` : `${labels.create} ${labels.products}`}
        subtitle="Biểu mẫu giữ nguyên các field hiện có của React Admin để không đổi request shape."
      />
      <AsyncState loading={loading} error={error}>
        <Card>
          <ProductFormFields
            form={form}
            saving={saving}
            onFinish={submit}
            onCancel={() => navigate("/shell/products")}
            onSlugChange={handleSlugChange}
          />
        </Card>
      </AsyncState>
    </>
  );
}
