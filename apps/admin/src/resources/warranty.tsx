import { useState } from "react";
import {
  ArrayField,
  Datagrid,
  DateField,
  Edit,
  List,
  NumberField,
  SelectInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  useNotify,
  useRecordContext,
  useRefresh,
} from "react-admin";
import { Box, Button, TextField as MuiTextField, Typography } from "@mui/material";
import { API_URL } from "../config";
import { getToken } from "../authProvider";

const STATUS_CHOICES = [
  { id: "open", name: "open" },
  { id: "waiting_admin", name: "waiting_admin" },
  { id: "waiting_customer", name: "waiting_customer" },
  { id: "processing", name: "processing" },
  { id: "resolved", name: "resolved" },
  { id: "rejected", name: "rejected" },
  { id: "closed", name: "closed" },
];

const REASON_CHOICES = [
  { id: "cannot_login", name: "cannot_login" },
  { id: "wrong_password", name: "wrong_password" },
  { id: "key_invalid", name: "key_invalid" },
  { id: "premium_missing", name: "premium_missing" },
  { id: "account_limited", name: "account_limited" },
  { id: "need_instruction", name: "need_instruction" },
  { id: "other", name: "other" },
];

const warrantyFilters = [
  <SelectInput key="status" source="status" choices={STATUS_CHOICES} alwaysOn />,
  <SelectInput key="reason" source="reason" choices={REASON_CHOICES} />,
  <TextInput key="q" source="q" label="Search" alwaysOn />,
];

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? res.statusText);
  return body;
}

function WarrantyReplyBox() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api(`/admin/warranty-cases/${record!.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setMessage("");
      notify("Đã gửi phản hồi", { type: "success" });
      refresh();
    } catch (e) {
      notify((e as Error).message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", borderRadius: 2, maxWidth: 720 }}>
      <Typography variant="subtitle2" gutterBottom>
        Phản hồi cho khách hàng
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
        <MuiTextField
          label="Nội dung phản hồi"
          multiline
          minRows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ flex: 1, minWidth: 280 }}
        />
        <Button variant="contained" onClick={submit} disabled={busy || !message.trim()}>
          Gửi
        </Button>
      </Box>
    </Box>
  );
}

function WarrantyReplaceBox() {
  const record = useRecordContext<any>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [accountId, setAccountId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [busy, setBusy] = useState<"account" | "key" | null>(null);

  async function submit(path: string, body: Record<string, string>, kind: "account" | "key") {
    setBusy(kind);
    try {
      await api(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (kind === "account") setAccountId("");
      if (kind === "key") setKeyId("");
      notify("Đã thay thế asset cho case", { type: "success" });
      refresh();
    } catch (e) {
      notify((e as Error).message, { type: "error" });
    } finally {
      setBusy(null);
    }
  }

  if (!record?.id) return null;

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", borderRadius: 2, maxWidth: 720 }}>
      <Typography variant="subtitle2" gutterBottom>
        Replace account / key
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap", mb: 2 }}>
        <MuiTextField
          label="New inventoryAccountId"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          sx={{ flex: 1, minWidth: 280 }}
        />
        <Button
          variant="outlined"
          onClick={() =>
            submit(`/admin/warranty-cases/${record.id}/replace-account`, { inventoryAccountId: accountId }, "account")
          }
          disabled={busy !== null || !accountId.trim()}
        >
          Replace account
        </Button>
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
        <MuiTextField
          label="New inventoryKeyId"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          sx={{ flex: 1, minWidth: 280 }}
        />
        <Button
          variant="outlined"
          onClick={() =>
            submit(`/admin/warranty-cases/${record.id}/replace-key`, { inventoryKeyId: keyId }, "key")
          }
          disabled={busy !== null || !keyId.trim()}
        >
          Replace key
        </Button>
      </Box>
    </Box>
  );
}

export const WarrantyList = () => (
  <List filters={warrantyFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="user.email" label="User" />
      <TextField source="order.orderCode" label="Order" />
      <TextField source="reason" />
      <TextField source="status" />
      <NumberField source="_count.messages" label="Messages" />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

export const WarrantyShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="status" />
      <TextField source="reason" />
      <TextField source="adminNote" />
      <TextField source="user.email" label="User" />
      <TextField source="order.orderCode" label="Order" />
      <TextField source="orderItem.product.name" label="Product" />
      <TextField source="orderItem.variant.name" label="Variant" />
      <TextField source="source.name" label="Source" />
      <TextField source="sourceOrder.id" label="Source order" />
      <TextField source="inventoryAccount.id" label="Inventory account id" />
      <TextField source="inventoryAccount.username" label="Inventory account" />
      <TextField source="inventoryKey.id" label="Inventory key" />
      <DateField source="createdAt" showTime />
      <DateField source="closedAt" showTime />
      <WarrantyReplyBox />
      <WarrantyReplaceBox />
      <ArrayField source="messages" label="Messages">
        <Datagrid bulkActionButtons={false}>
          <TextField source="authorType" />
          <TextField source="authorId" />
          <TextField source="message" />
          <DateField source="createdAt" showTime />
        </Datagrid>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);

export const WarrantyEdit = () => (
  <Edit>
    <SimpleForm>
      <SelectInput source="status" choices={STATUS_CHOICES} />
      <TextInput source="adminNote" multiline fullWidth />
      <TextInput source="sourceId" fullWidth />
      <TextInput source="sourceOrderId" fullWidth />
      <TextInput source="inventoryAccountId" fullWidth />
      <TextInput source="inventoryKeyId" fullWidth />
    </SimpleForm>
  </Edit>
);
