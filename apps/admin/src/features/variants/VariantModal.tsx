import { Card, Form, Modal } from "antd";
import { useEffect, useState } from "react";
import { AsyncState } from "../../components/common/AsyncState";
import { createResource, getResource, listResource, updateResource } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { useAutoSlug } from "../../lib/useAutoSlug";
import {
  ProductVariantFormFields,
  type ProductOption,
  type VariantPayload,
  type VariantRecord,
} from "./VariantFormFields";

type VariantModalProps = {
  open: boolean;
  variantId?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function VariantModal({ open, variantId, onClose, onSaved }: VariantModalProps) {
  const [form] = Form.useForm<VariantPayload>();
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
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

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      listResource<ProductOption>("products", {
        page: 1,
        perPage: 100,
        sort: "sortOrder",
        order: "ASC",
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
          return;
        }
        const defaults: Partial<VariantPayload> = {
          status: "active",
          requiresCustomerInput: false,
          customerInputSchema: { fields: [] },
          warrantyDays: 0,
        };
        form.setFieldsValue(defaults);
        syncAutoSlugState(defaults);
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
  }, [form, open, syncAutoSlugState, variantId]);

  async function submit(values: VariantPayload) {
    setSaving(true);
    try {
      if (variantId) {
        await updateResource("product-variants", variantId, values as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật biến thể");
      } else {
        await createResource("product-variants", values as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo biến thể");
      }
      onSaved();
      onClose();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu biến thể");
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
      title={variantId ? "Chỉnh sửa biến thể" : "Tạo biến thể"}
      styles={{ body: { maxHeight: "75vh", overflowX: "hidden", overflowY: "auto" } }}
      width={760}
    >
      <AsyncState loading={loading} error={error}>
        <Card bordered={false} styles={{ body: { padding: 0 } }}>
          <ProductVariantFormFields
            form={form}
            productOptions={productOptions}
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
