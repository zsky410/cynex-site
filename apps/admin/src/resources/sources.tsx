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
  required,
} from "react-admin";

const CHANNEL = [
  "internal", "telegram", "discord", "website", "facebook", "email", "phone", "other",
].map((id) => ({ id, name: id }));

const STATUS = ["active", "inactive", "blocked", "archived"].map((id) => ({ id, name: id }));

export const SourceList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <TextField source="contactChannel" />
      <NumberField source="defaultWarrantyDays" />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const Form = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} />
    <TextInput source="slug" validate={required()} />
    <TextInput source="contactName" />
    <SelectInput source="contactChannel" choices={CHANNEL} defaultValue="internal" />
    <TextInput source="contactUrl" />
    <TextInput source="telegramUsername" />
    <TextInput source="discordUsername" />
    <TextInput source="email" />
    <TextInput source="phone" />
    <NumberInput source="defaultWarrantyDays" defaultValue={0} />
    <TextInput source="warrantyPolicy" multiline fullWidth />
    <TextInput source="notes" multiline fullWidth />
    <NumberInput source="rating" />
    <SelectInput source="status" choices={STATUS} defaultValue="active" />
  </SimpleForm>
);

export const SourceEdit = () => (<Edit><Form /></Edit>);
export const SourceCreate = () => (<Create><Form /></Create>);
