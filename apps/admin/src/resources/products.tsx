import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  NumberInput,
  required,
} from "react-admin";

const STATUS = [
  { id: "draft", name: "Draft" },
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
  { id: "archived", name: "Archived" },
];

export const ProductList = () => (
  <List sort={{ field: "sortOrder", order: "ASC" }}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <TextField source="slug" />
      <TextField source="status" />
      <TextField source="sortOrder" />
    </Datagrid>
  </List>
);

const Form = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} />
    <TextInput source="slug" validate={required()} />
    <TextInput source="shortDescription" fullWidth />
    <TextInput source="description" multiline fullWidth />
    <SelectInput source="status" choices={STATUS} defaultValue="draft" />
    <NumberInput source="sortOrder" defaultValue={0} />
    <TextInput source="categoryId" />
  </SimpleForm>
);

export const ProductEdit = () => (
  <Edit>
    <Form />
  </Edit>
);

export const ProductCreate = () => (
  <Create>
    <Form />
  </Create>
);
