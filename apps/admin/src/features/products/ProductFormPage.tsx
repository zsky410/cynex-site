import { Button, Card, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { createResource, getResource, updateResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type ProductPayload = {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  status: "draft" | "active" | "inactive" | "archived";
  sortOrder: number;
  categoryId?: string;
};

type ProductRecord = ProductPayload & { id: string };

const statusOptions = ["draft", "active", "inactive", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [form] = Form.useForm<ProductPayload>();
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(productId);

  useEffect(() => {
    if (!productId) {
      form.setFieldsValue({ status: "draft", sortOrder: 0 });
      return;
    }

    getResource<ProductRecord>("products", productId)
      .then((response) => form.setFieldsValue(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId, form]);

  async function submit(values: ProductPayload) {
    setSaving(true);
    try {
      if (productId) {
        await updateResource("products", productId, values as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật sản phẩm");
      } else {
        await createResource("products", values as unknown as Record<string, unknown>);
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
          <Form<ProductPayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Mô tả ngắn" name="shortDescription">
              <Input />
            </Form.Item>
            <Form.Item label="Mô tả chi tiết" name="description">
              <Input.TextArea rows={5} />
            </Form.Item>
            <Form.Item label={labels.status} name="status">
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item label="Thứ tự" name="sortOrder">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Category ID" name="categoryId">
              <Input />
            </Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>
                {labels.save}
              </Button>
              <Button onClick={() => navigate("/shell/products")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
