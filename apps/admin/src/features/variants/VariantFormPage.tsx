import { Button, Card, Form, Input, InputNumber, Select, Space, Switch } from "antd";
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
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type VariantPayload = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  costEstimate?: number | null;
  durationDays?: number | null;
  fulfillmentType:
    | "CUSTOMER_ACCOUNT_UPGRADE"
    | "DEDICATED_ACCOUNT"
    | "SHARED_ACCOUNT"
    | "LICENSE_KEY"
    | "MANUAL_DELIVERY";
  defaultSourceId?: string;
  warrantyDays?: number | null;
  estimatedDeliveryMinutes?: number | null;
  requiresCustomerInput?: boolean;
  status: "active" | "inactive" | "out_of_stock" | "archived";
};

type VariantRecord = VariantPayload & { id: string };
type ProductOption = { id: string; name: string };

const fulfillmentOptions = [
  { value: "CUSTOMER_ACCOUNT_UPGRADE", label: "Nâng cấp chính chủ" },
  { value: "DEDICATED_ACCOUNT", label: "Tài khoản riêng" },
  { value: "SHARED_ACCOUNT", label: "Tài khoản dùng chung" },
  { value: "LICENSE_KEY", label: "Key/License" },
  { value: "MANUAL_DELIVERY", label: "Giao thủ công" },
];

const statusOptions = ["active", "inactive", "out_of_stock", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function VariantFormPage() {
  const navigate = useNavigate();
  const { variantId } = useParams();
  const [form] = Form.useForm<VariantPayload>();
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(variantId);

  useEffect(() => {
    let cancelled = false;

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
        } else {
          form.setFieldsValue({
            status: "active",
            requiresCustomerInput: false,
            warrantyDays: 0,
          });
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
  }, [variantId, form]);

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
      navigate("/shell/variants", { replace: true });
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
          <Form<VariantPayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: "Chọn sản phẩm" }]}>
              <Select options={productOptions} />
            </Form.Item>
            <Form.Item label="Tên biến thể" name="name" rules={[{ required: true, message: "Nhập tên biến thể" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Giá" name="price" rules={[{ required: true, message: "Nhập giá" }]}>
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Ước tính giá vốn" name="costEstimate">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Số ngày sử dụng" name="durationDays">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Kiểu giao hàng"
              name="fulfillmentType"
              rules={[{ required: true, message: "Chọn phương thức fulfillment" }]}
            >
              <Select options={fulfillmentOptions} />
            </Form.Item>
            <Form.Item label="Source ID mặc định" name="defaultSourceId">
              <Input />
            </Form.Item>
            <Form.Item label="Số ngày bảo hành" name="warrantyDays">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Phút giao dự kiến" name="estimatedDeliveryMinutes">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Yêu cầu khách nhập thông tin" name="requiresCustomerInput" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label={labels.status} name="status">
              <Select options={statusOptions} />
            </Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>
                {labels.save}
              </Button>
              <Button onClick={() => navigate("/shell/variants")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
