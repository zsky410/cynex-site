import { Button, Form, Input, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import { labels } from "../../lib/labels";

export type CategoryPayload = {
  name: string;
  slug: string;
};

export type CategoryRecord = CategoryPayload & {
  id: string;
};

export type CategoryFormValues = CategoryPayload;

type CategoryFormFieldsProps = {
  form: FormInstance<CategoryFormValues>;
  saving: boolean;
  onFinish: (values: CategoryFormValues) => Promise<void> | void;
  onCancel: () => void;
  onSlugChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function buildCategoryPayload(values: CategoryFormValues): CategoryPayload {
  return {
    name: values.name,
    slug: values.slug,
  };
}

export function CategoryFormFields({
  form,
  saving,
  onFinish,
  onCancel,
  onSlugChange,
}: CategoryFormFieldsProps) {
  return (
    <Form<CategoryFormValues> form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Tên danh mục" name="name" rules={[{ required: true, message: "Nhập tên danh mục" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}>
        <Input onChange={onSlugChange} />
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
