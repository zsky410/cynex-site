import { useState } from "react";
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  DateField,
  Show,
  SimpleShowLayout,
  ArrayField,
  FunctionField,
  Edit,
  SimpleForm,
  BooleanInput,
  TextInput,
  useRecordContext,
  useNotify,
  useRefresh,
} from "react-admin";
import { Box, Button, TextField as MuiTextField, Typography } from "@mui/material";
import { API_URL } from "../config";
import { getToken } from "../authProvider";

export const UserList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="show">
      <TextField source="email" />
      <TextField source="name" />
      <NumberField source="walletBalance" />
      <BooleanField source="isLocked" />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

function WalletAdjust() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${record!.id}/wallet-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amount: Number(amount), reason }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message ?? "Lỗi điều chỉnh");
      }
      notify("Đã điều chỉnh ví", { type: "success" });
      setAmount("");
      setReason("");
      refresh();
    } catch (e) {
      notify((e as Error).message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", borderRadius: 2, maxWidth: 480 }}>
      <Typography variant="subtitle2" gutterBottom>
        Điều chỉnh ví (âm = trừ tiền)
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <MuiTextField
          label="Số tiền (VND)"
          type="number"
          size="small"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <MuiTextField
          label="Lý do (bắt buộc)"
          size="small"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Button variant="contained" onClick={submit} disabled={busy || !amount || !reason.trim()}>
          Áp dụng
        </Button>
      </Box>
    </Box>
  );
}

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="email" />
      <TextField source="name" />
      <NumberField source="walletBalance" />
      <BooleanField source="isLocked" />
      <WalletAdjust />
      <ArrayField source="walletTxns" label="Lịch sử ví">
        <Datagrid bulkActionButtons={false}>
          <TextField source="type" />
          <NumberField source="amount" />
          <NumberField source="balanceAfter" />
          <TextField source="description" />
          <DateField source="createdAt" showTime />
        </Datagrid>
      </ArrayField>
      <ArrayField source="orders" label="Đơn hàng">
        <Datagrid bulkActionButtons={false}>
          <TextField source="orderCode" />
          <NumberField source="totalAmount" />
          <TextField source="paymentStatus" />
          <TextField source="fulfillmentStatus" />
        </Datagrid>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextField source="email" />
      <TextInput source="name" />
      <BooleanInput source="isLocked" helperText="Khóa đăng nhập của user" />
    </SimpleForm>
  </Edit>
);
