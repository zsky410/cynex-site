import { Card, Form } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import {
  createResource,
  getResource,
  listResource,
  updateResource,
} from "../../lib/admin-api";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import {
  ProductVariantFormFields,
  type ProductOption,
  type VariantPayload,
  type VariantRecord,
} from "./VariantFormFields";

export default function VariantFormPage() {
  const navigate = useNavigate();
  const { variantId } = useParams();
  const [form] = Form.useForm<VariantPayload>();
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSlugChange, syncAutoSlugState } = useAutoSlug(form);

  const isEdit = Boolean(variantId);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listResource<ProductOption>("products", {
        page: 1,
        perPage: 100,
        sort: "updatedAt",
        order: "DESC",
        filter: {},
      }),
      variantId ? getResource<VariantRecord>("product-variants", variantId) : Promise.resolve(null),
    ])
      .then(([productsResponse, variantResponse]) => {
        if (cancelled) return;
        setProductOptions(
          productsResponse.data.map((product) => ({
            value: product.id,
            label: product.name,
          })),
        );
        if (variantResponse) {
          form.setFieldsValue(variantResponse.data);
          syncAutoSlugState(variantResponse.data);
        } else {
          const defaults: Partial<VariantPayload> = {
            status: "active",
            requiresCustomerInput: false,
            customerInputSchema: { fields: [] },
            warrantyDays: 0,
          };
          form.setFieldsValue(defaults);
          syncAutoSlugState(defaults);
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
  }, [variantId, form, syncAutoSlugState]);

  async function submit(values: VariantPayload) {
    setSaving(true);
    try {
      if (variantId) {
        await updateResource(
          "product-variants",
          variantId,
          values as unknown as Record<string, unknown>,
        );
        notifySuccess("Đã cập nhật biến thể");
      } else {
        await createResource("product-variants", values as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo biến thể");
      }
      navigate("/shell/products", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu biến thể");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `${labels.edit} ${labels.variants}` : `${labels.create} ${labels.variants}`}
        subtitle="Giữ nguyên các field sản phẩm/fulfillment đang được React Admin sử dụng."
      />
      <AsyncState loading={loading} error={error}>
        <Card>
          <ProductVariantFormFields
            form={form}
            productOptions={productOptions}
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
