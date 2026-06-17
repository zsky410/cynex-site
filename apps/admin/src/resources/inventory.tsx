import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  SelectInput,
  PasswordInput,
  ReferenceInput,
  required,
} from "react-admin";

const ACC_STATUS = [
  "available", "assigned", "delivered", "full", "replaced", "disabled", "expired",
].map((id) => ({ id, name: id }));
const ACC_TYPE = ["dedicated", "shared"].map((id) => ({ id, name: id }));
const KEY_STATUS = [
  "available", "assigned", "delivered", "invalid", "replaced", "refunded",
].map((id) => ({ id, name: id }));

// ---- Inventory accounts ----
export const AccountList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="edit">
      <TextField source="username" />
      <TextField source="accountType" />
      <NumberField source="usedSlots" />
      <NumberField source="maxSlots" />
      <BooleanField source="hasPassword" />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const AccountForm = ({ isCreate }: { isCreate?: boolean }) => (
  <SimpleForm>
    <ReferenceInput source="productVariantId" reference="product-variants">
      <SelectInput optionText="name" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="sourceId" reference="supply-sources">
      <SelectInput optionText="name" />
    </ReferenceInput>
    <TextInput source="username" validate={required()} />
    <PasswordInput source="password" helperText={isCreate ? "Bắt buộc" : "Để trống nếu không đổi"} />
    <TextInput source="recoveryInfo" helperText="Sẽ được mã hoá" />
    <TextInput source="privateNote" multiline fullWidth helperText="Ghi chú nội bộ (mã hoá)" />
    <TextInput source="publicNote" fullWidth helperText="Ghi chú công khai cho khách" />
    <SelectInput source="accountType" choices={ACC_TYPE} defaultValue="dedicated" />
    <NumberInput source="maxSlots" defaultValue={1} />
    <NumberInput source="cost" />
    <SelectInput source="status" choices={ACC_STATUS} defaultValue="available" />
  </SimpleForm>
);

export const AccountEdit = () => (<Edit><AccountForm /></Edit>);
export const AccountCreate = () => (<Create><AccountForm isCreate /></Create>);

// ---- Inventory keys ----
export const KeyList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="edit">
      <TextField source="publicNote" />
      <BooleanField source="hasKey" />
      <TextField source="status" />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

const KeyForm = ({ isCreate }: { isCreate?: boolean }) => (
  <SimpleForm>
    <ReferenceInput source="productVariantId" reference="product-variants">
      <SelectInput optionText="name" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="sourceId" reference="supply-sources">
      <SelectInput optionText="name" />
    </ReferenceInput>
    <PasswordInput source="key" helperText={isCreate ? "Bắt buộc" : "Để trống nếu không đổi"} />
    <TextInput source="publicNote" fullWidth />
    <NumberInput source="cost" />
    <SelectInput source="status" choices={KEY_STATUS} defaultValue="available" />
  </SimpleForm>
);

export const KeyEdit = () => (<Edit><KeyForm /></Edit>);
export const KeyCreate = () => (<Create><KeyForm isCreate /></Create>);
