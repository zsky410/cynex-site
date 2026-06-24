import { Button, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { createSlug } from "../../lib/slug";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

export type CustomerInputField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  required?: boolean;
  placeholder?: string;
};

export type VariantPayload = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  discountPercent?: number | null;
  durationDays?: number | null;
  fulfillmentType:
    | "CUSTOMER_ACCOUNT_UPGRADE"
    | "DEDICATED_ACCOUNT"
    | "SHARED_ACCOUNT"
    | "LICENSE_KEY"
    | "MANUAL_DELIVERY";
  warrantyDays?: number | null;
  estimatedDeliveryMinutes?: number | null;
  requiresCustomerInput?: boolean;
  customerInputSchema?: { fields?: CustomerInputField[] } | null;
  status: "active" | "inactive" | "out_of_stock" | "archived";
};

export type VariantRecord = VariantPayload & { id: string };
export type ProductOption = { id: string; name: string };

export const fulfillmentOptions = [
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
const customerInputTypeOptions = [
  { value: "text", label: "Văn bản" },
  { value: "email", label: "Email" },
  { value: "password", label: "Mật khẩu" },
  { value: "tel", label: "Số điện thoại" },
] as const;

type VariantFormFieldsProps = {
  form: FormInstance<VariantPayload>;
  productOptions: Array<{ value: string; label: string }>;
  saving: boolean;
  onFinish: (values: VariantPayload) => Promise<void> | void;
  onCancel: () => void;
  onSlugChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ProductVariantFormFields({
  form,
  productOptions,
  saving,
  onFinish,
  onCancel,
  onSlugChange,
}: VariantFormFieldsProps) {
  const requiresCustomerInput = Form.useWatch("requiresCustomerInput", form);

  return (
    <Form<VariantPayload>
      form={form}
      layout="vertical"
      onFinish={(values) => {
        const fields = (values.customerInputSchema?.fields ?? [])
          .map((field) => ({
            ...field,
            name: field.name?.trim() || createSlug(field.label ?? "").replace(/-/g, "_"),
            label: field.label?.trim() ?? "",
            placeholder: field.placeholder?.trim() || undefined,
          }))
          .filter((field) => field.name && field.label);

        onFinish({
          ...values,
          customerInputSchema: values.requiresCustomerInput ? { fields } : null,
        });
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: "Chọn sản phẩm" }]}>
            <Select options={productOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label={labels.status} name="status">
            <Select options={statusOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Tên biến thể" name="name" rules={[{ required: true, message: "Nhập tên biến thể" }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}>
            <Input onChange={onSlugChange} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Giá" name="price" rules={[{ required: true, message: "Nhập giá" }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="% giảm giá" name="discountPercent">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Số ngày sử dụng" name="durationDays">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Kiểu giao hàng"
            name="fulfillmentType"
            rules={[{ required: true, message: "Chọn phương thức fulfillment" }]}
          >
            <Select options={fulfillmentOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Số ngày bảo hành" name="warrantyDays">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Phút giao dự kiến" name="estimatedDeliveryMinutes">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Yêu cầu khách nhập thông tin" name="requiresCustomerInput" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      {requiresCustomerInput ? (
        <div className="mb-6 overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <Form.List
            name={["customerInputSchema", "fields"]}
            rules={[
              {
                validator: async (_, fields: CustomerInputField[] | undefined) => {
                  if (!requiresCustomerInput) return;
                  if (!fields?.length) {
                    throw new Error("Thêm ít nhất một ô khách cần nhập");
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div className="mb-5">
                  <Typography.Text strong>Các thông tin khách cần nhập</Typography.Text>
                  <p className="mt-1 text-sm text-slate-500">
                    Mỗi dòng sẽ hiện thành một ô nhập ở trang mua hàng.
                  </p>
                </div>
                <Button
                  className="mb-4"
                  icon={<PlusOutlined />}
                  type="dashed"
                  onClick={() => add({ type: "text", required: true })}
                >
                  Thêm ô nhập
                </Button>
                <Space direction="vertical" size="middle" style={{ display: "flex" }}>
                  {fields.map((field) => (
                    <div key={field.key} className="rounded-xl border border-slate-200 bg-white p-4">
                      <Row gutter={12}>
                        <Col xs={24} md={10}>
                          <Form.Item
                            label="Nhãn hiển thị"
                            name={[field.name, "label"]}
                            rules={[{ required: true, message: "Nhập nhãn hiển thị" }]}
                          >
                            <Input placeholder="Ví dụ: Email tài khoản Google" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                          <Form.Item
                            label="Mã field"
                            name={[field.name, "name"]}
                            extra="Để trống sẽ tự tạo từ nhãn."
                          >
                            <Input placeholder="account_email" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={5}>
                          <Form.Item label="Loại input" name={[field.name, "type"]}>
                            <Select options={customerInputTypeOptions as unknown as { value: string; label: string }[]} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={3}>
                          <Form.Item label="Bắt buộc" name={[field.name, "required"]} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={21}>
                          <Form.Item label="Placeholder" name={[field.name, "placeholder"]}>
                            <Input placeholder="Ví dụ: name@gmail.com" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={3}>
                          <div className="flex h-full items-end">
                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                              Xóa
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Space>
                {errors.length ? <Typography.Text type="danger">{errors[0]}</Typography.Text> : null}
              </>
            )}
          </Form.List>
        </div>
      ) : null}
      <Space>
        <Button htmlType="submit" type="primary" loading={saving}>
          {labels.save}
        </Button>
        <Button onClick={onCancel}>{labels.cancel}</Button>
      </Space>
    </Form>
  );
}
