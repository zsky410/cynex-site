import { Button, Form, Input, InputNumber, Select, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import type { IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

export type SourcePayload = {
  name: string;
  slug: string;
  contactName?: string;
  contactChannel: string;
  contactUrl?: string;
  telegramUsername?: string;
  discordUsername?: string;
  email?: string;
  phone?: string;
  defaultWarrantyDays?: number;
  warrantyPolicy?: string;
  notes?: string;
  rating?: number | null;
  status: string;
  integrityWarnings?: IntegrityWarning[];
};

export type SourceRecord = SourcePayload;

const channelOptions = ["internal", "telegram", "discord", "website", "facebook", "email", "phone", "other"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));
const statusOptions = ["active", "inactive", "blocked", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

type SourceFormFieldsProps = {
  form: FormInstance<SourcePayload>;
  saving: boolean;
  onFinish: (values: SourcePayload) => Promise<void> | void;
  onCancel: () => void;
  onSlugChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function SourceFormFields({
  form,
  saving,
  onFinish,
  onCancel,
  onSlugChange,
}: SourceFormFieldsProps) {
  return (
    <Form<SourcePayload> form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Tên nguồn" name="name" rules={[{ required: true, message: "Nhập tên nguồn" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Slug" name="slug" rules={[{ required: true, message: "Nhập slug" }]}>
        <Input onChange={onSlugChange} />
      </Form.Item>
      <Form.Item label="Tên liên hệ" name="contactName">
        <Input />
      </Form.Item>
      <Form.Item label="Kênh liên hệ" name="contactChannel">
        <Select options={channelOptions} />
      </Form.Item>
      <Form.Item label="URL liên hệ" name="contactUrl">
        <Input />
      </Form.Item>
      <Form.Item label="Tên đăng nhập Telegram" name="telegramUsername">
        <Input />
      </Form.Item>
      <Form.Item label="Tên đăng nhập Discord" name="discordUsername">
        <Input />
      </Form.Item>
      <Form.Item label="Email" name="email">
        <Input />
      </Form.Item>
      <Form.Item label="Số điện thoại" name="phone">
        <Input />
      </Form.Item>
      <Form.Item label="Bảo hành mặc định (ngày)" name="defaultWarrantyDays">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Chính sách bảo hành" name="warrantyPolicy">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item label="Ghi chú" name="notes">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item label="Đánh giá" name="rating">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label={labels.status} name="status">
        <Select options={statusOptions} />
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
