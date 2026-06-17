import {
  Datagrid,
  DateField,
  List,
  Show,
  SimpleShowLayout,
  TextField,
  TextInput,
} from "react-admin";

const emailLogFilters = [
  <TextInput key="type" source="type" alwaysOn />,
  <TextInput key="status" source="status" />,
  <TextInput key="q" source="q" label="Search" alwaysOn />,
];

const auditLogFilters = [
  <TextInput key="action" source="action" alwaysOn />,
  <TextInput key="targetType" source="targetType" />,
  <TextInput key="q" source="q" label="Search" alwaysOn />,
];

export const EmailLogList = () => (
  <List filters={emailLogFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="show">
      <TextField source="type" />
      <TextField source="status" />
      <TextField source="toEmail" />
      <TextField source="subject" />
      <TextField source="order.orderCode" label="Order" />
      <DateField source="sentAt" showTime />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

export const EmailLogShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="type" />
      <TextField source="status" />
      <TextField source="toEmail" />
      <TextField source="subject" />
      <TextField source="user.email" label="User" />
      <TextField source="order.orderCode" label="Order" />
      <TextField source="providerMessageId" />
      <TextField source="errorMessage" />
      <TextField source="dedupeKey" />
      <TextField source="bodySnapshot" />
      <DateField source="sentAt" showTime />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

export const AuditLogList = () => (
  <List filters={auditLogFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="show">
      <TextField source="action" />
      <TextField source="actorType" />
      <TextField source="actorId" />
      <TextField source="targetType" />
      <TextField source="targetId" />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

export const AuditLogShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="action" />
      <TextField source="actorType" />
      <TextField source="actorId" />
      <TextField source="targetType" />
      <TextField source="targetId" />
      <TextField source="ipAddress" />
      <TextField source="userAgent" />
      <TextField source="metadata" />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);
