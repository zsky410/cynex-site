import { Button, Form, Input, InputNumber, Select, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import { AdminFileUploadField, type AdminUploadedFile } from "../../components/files/AdminFileUploadField";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

export type ProductPayload = {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  status: "draft" | "active" | "inactive" | "archived";
  sortOrder: number;
  categoryId?: string;
  imageFileId?: string | null;
  guideFileIds?: string[];
};

export type ProductRecord = ProductPayload & {
  id: string;
  image?: AdminUploadedFile | null;
  guideFiles?: AdminUploadedFile[];
};

export type ProductFormValues = Omit<ProductPayload, "imageFileId" | "guideFileIds"> & {
  image?: AdminUploadedFile | null;
  guideFiles?: AdminUploadedFile[];
};

const statusOptions = ["draft", "active", "inactive", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

type ProductFormFieldsProps = {
  form: FormInstance<ProductFormValues>;
  saving: boolean;
  onFinish: (values: ProductFormValues) => Promise<void> | void;
  onCancel: () => void;
  onSlugChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function buildProductPayload(values: ProductFormValues): ProductPayload {
  return {
    name: values.name,
    slug: values.slug,
    shortDescription: values.shortDescription,
    description: values.description,
    status: values.status,
    sortOrder: values.sortOrder,
    categoryId: values.categoryId,
    imageFileId: values.image?.id ?? null,
    guideFileIds: values.guideFiles?.map((file) => file.id) ?? [],
  };
}

export function ProductFormFields({
  form,
  saving,
  onFinish,
  onCancel,
  onSlugChange,
}: ProductFormFieldsProps) {
  return (
    <Form<ProductFormValues> form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}>
        <Input onChange={onSlugChange} />
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
      <Form.Item label="Ảnh hiển thị sản phẩm" name="image">
        <AdminFileUploadField accept=".png,.jpg,.jpeg,.webp" />
      </Form.Item>
      <Form.Item label="File hướng dẫn" name="guideFiles">
        <AdminFileUploadField multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.txt" />
      </Form.Item>
      <Space>
        <Button htmlType="submit" type="primary" loading={saving}>
          {labels.save}
        </Button>
        <Button onClick={onCancel}>{labels.cancel}</Button>
      </Space>
    </Form>
  );
}
