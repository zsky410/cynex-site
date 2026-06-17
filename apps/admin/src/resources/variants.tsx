import {
  List,
  Datagrid,
  TextField,
  NumberField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  SelectInput,
  BooleanInput,
  ReferenceInput,
  required,
} from "react-admin";

const FULFILLMENT = [
  { id: "CUSTOMER_ACCOUNT_UPGRADE", name: "Nâng cấp chính chủ" },
  { id: "DEDICATED_ACCOUNT", name: "Tài khoản riêng" },
  { id: "SHARED_ACCOUNT", name: "Tài khoản dùng chung" },
  { id: "LICENSE_KEY", name: "Key/License" },
  { id: "MANUAL_DELIVERY", name: "Giao thủ công" },
];

const STATUS = [
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
  { id: "out_of_stock", name: "Out of stock" },
  { id: "archived", name: "Archived" },
];

export const VariantList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <NumberField source="price" />
      <TextField source="fulfillmentType" />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const Form = () => (
  <SimpleForm>
    <ReferenceInput source="productId" reference="products">
      <SelectInput optionText="name" validate={required()} />
    </ReferenceInput>
    <TextInput source="name" validate={required()} />
    <TextInput source="slug" validate={required()} />
    <NumberInput source="price" validate={required()} />
    <NumberInput source="costEstimate" />
    <NumberInput source="durationDays" />
    <SelectInput source="fulfillmentType" choices={FULFILLMENT} validate={required()} />
    <TextInput source="defaultSourceId" helperText="ID nguồn mặc định (tuỳ chọn)" />
    <NumberInput source="warrantyDays" defaultValue={0} />
    <NumberInput source="estimatedDeliveryMinutes" />
    <BooleanInput source="requiresCustomerInput" defaultValue={false} />
    <SelectInput source="status" choices={STATUS} defaultValue="active" />
  </SimpleForm>
);

export const VariantEdit = () => (
  <Edit>
    <Form />
  </Edit>
);

export const VariantCreate = () => (
  <Create>
    <Form />
  </Create>
);
