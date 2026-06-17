import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  SelectInput,
  ReferenceInput,
  required,
} from "react-admin";

const STATUS = [
  "not_ordered", "ordered", "waiting_source", "source_delivered",
  "source_failed", "claimed_warranty", "cancelled",
].map((id) => ({ id, name: id }));

export const SourceOrderList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="edit">
      <TextField source="externalRef" />
      <NumberField source="cost" />
      <TextField source="status" />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

const Form = () => (
  <SimpleForm>
    <ReferenceInput source="sourceId" reference="supply-sources">
      <SelectInput optionText="name" validate={required()} />
    </ReferenceInput>
    <TextInput source="orderId" helperText="ID đơn khách (tuỳ chọn)" />
    <TextInput source="orderItemId" helperText="ID order item (tuỳ chọn)" />
    <TextInput source="externalRef" />
    <NumberInput source="cost" />
    <SelectInput source="status" choices={STATUS} defaultValue="not_ordered" />
    <TextInput source="sourcePayload" multiline fullWidth helperText="Nội dung nhạy cảm — sẽ được mã hoá" />
    <TextInput source="note" multiline fullWidth />
  </SimpleForm>
);

export const SourceOrderEdit = () => (<Edit><Form /></Edit>);
export const SourceOrderCreate = () => (<Create><Form /></Create>);
