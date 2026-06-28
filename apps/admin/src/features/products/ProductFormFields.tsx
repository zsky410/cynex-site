import { Button, Form, Input, Select, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import { useEffect, useState } from "react";
import { AdminFileUploadField, type AdminUploadedFile } from "../../components/files/AdminFileUploadField";
import { listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

export type ProductPayload = {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  status: "active" | "inactive";
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

const statusOptions = ["active", "inactive"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

type CategoryOption = {
  id: string;
  name: string;
};

export function normalizeProductStatus(status: string | null | undefined): ProductPayload["status"] {
  return status === "active" ? "active" : "inactive";
}

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
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    setLoadingCategories(true);
    listResource<CategoryOption>("categories", {
      page: 1,
      perPage: 200,
      sort: "name",
      order: "ASC",
      filter: {},
    })
      .then((response) => {
        setCategoryOptions(
          response.data.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        );
      })
      .catch(() => setCategoryOptions([]))
      .finally(() => setLoadingCategories(false));
  }, []);

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
      <Form.Item label={labels.categories} name="categoryId">
        <Select
          allowClear
          loading={loadingCategories}
          options={categoryOptions}
          placeholder="Chọn danh mục"
        />
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
