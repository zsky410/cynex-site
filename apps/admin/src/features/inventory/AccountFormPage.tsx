import { Button, Card, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { createResource, getResource, listResource, updateResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type VariantOption = { id: string; name: string };
type SourceOption = { id: string; name: string };
type AccountPayload = {
  productVariantId: string;
  sourceId?: string;
  username: string;
  password?: string;
  recoveryInfo?: string;
  privateNote?: string;
  publicNote?: string;
  accountType: "dedicated" | "shared";
  maxSlots?: number;
  cost?: number;
  status: string;
};

const accountTypeOptions = ["dedicated", "shared"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));
const statusOptions = [
  "available",
  "assigned",
  "delivered",
  "full",
  "replaced",
  "disabled",
  "expired",
].map((value) => ({ value, label: getDisplayLabel(value) }));

export default function AccountFormPage() {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const [form] = Form.useForm<AccountPayload>();
  const [variantOptions, setVariantOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [sourceOptions, setSourceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listResource<VariantOption>("product-variants", { page: 1, perPage: 100, sort: "id", order: "DESC", filter: {} }),
      listResource<SourceOption>("supply-sources", { page: 1, perPage: 100, sort: "id", order: "DESC", filter: {} }),
      accountId ? getResource<AccountPayload>("inventory-accounts", accountId) : Promise.resolve(null),
    ])
      .then(([variantsResponse, sourcesResponse, accountResponse]) => {
        if (cancelled) return;
        setVariantOptions(variantsResponse.data.map((item) => ({ value: item.id, label: item.name })));
        setSourceOptions(sourcesResponse.data.map((item) => ({ value: item.id, label: item.name })));
        if (accountResponse) {
          form.setFieldsValue(accountResponse.data);
        } else {
          form.setFieldsValue({ accountType: "dedicated", maxSlots: 1, status: "available" });
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
  }, [accountId, form]);

  async function submit(values: AccountPayload) {
    setSaving(true);
    try {
      if (accountId) {
        await updateResource("inventory-accounts", accountId, values as unknown as Record<string, unknown>);
        notifySuccess("Đã cập nhật tài khoản kho");
      } else {
        await createResource("inventory-accounts", values as unknown as Record<string, unknown>);
        notifySuccess("Đã tạo tài khoản kho");
      }
      navigate("/shell/inventory/accounts", { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể lưu tài khoản kho");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={`${accountId ? labels.edit : labels.create} ${labels.inventoryAccounts}`} subtitle="Giữ nguyên field nguồn/variant/mật khẩu của tài khoản kho." />
      <AsyncState loading={loading} error={error}>
        <Card>
          <Form<AccountPayload> form={form} layout="vertical" onFinish={submit}>
            <Form.Item label="Biến thể" name="productVariantId" rules={[{ required: true, message: "Chọn biến thể" }]}><Select options={variantOptions} /></Form.Item>
            <Form.Item label="Nguồn cung" name="sourceId"><Select allowClear options={sourceOptions} /></Form.Item>
            <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: "Nhập tên đăng nhập" }]}><Input /></Form.Item>
            <Form.Item label="Mật khẩu" name="password"><Input.Password /></Form.Item>
            <Form.Item label="Thông tin khôi phục" name="recoveryInfo"><Input /></Form.Item>
            <Form.Item label="Ghi chú riêng" name="privateNote"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item label="Ghi chú công khai" name="publicNote"><Input /></Form.Item>
            <Form.Item label="Loại tài khoản" name="accountType"><Select options={accountTypeOptions} /></Form.Item>
            <Form.Item label="Số slot tối đa" name="maxSlots"><InputNumber style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Chi phí" name="cost"><InputNumber style={{ width: "100%" }} /></Form.Item>
            <Form.Item label={labels.status} name="status"><Select options={statusOptions} /></Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={saving}>{labels.save}</Button>
              <Button onClick={() => navigate("/shell/inventory/accounts")}>{labels.cancel}</Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </>
  );
}
