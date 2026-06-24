# Admin Hard Delete And Integrity Warnings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace soft delete behavior in the targeted admin resources with safe hard deletes, and surface integrity warnings for orphaned or broken linked records in admin list and detail/edit views.

**Architecture:** Add a focused admin integrity service in the API that performs delete preflight checks and computes `integrityWarnings` for selected resources. Then thread that metadata through the existing Ant Design admin list/detail pages and tighten delete UX so blocked deletes show actionable dependency errors instead of silent soft deletes.

**Tech Stack:** NestJS, Prisma, Node test runner with `tsx`, React, Ant Design, TypeScript

---

## File Map

- Modify: `apps/api/src/admin/admin.module.ts`
  Registers the new integrity service/providers.
- Create: `apps/api/src/admin/integrity/admin-integrity.service.ts`
  Shared orchestration for delete preflight and warning generation.
- Create: `apps/api/src/admin/integrity/integrity.types.ts`
  Shared TypeScript shapes for warning and dependency payloads.
- Modify: `apps/api/src/admin/sources/admin-sources.controller.ts`
  Switch source delete to hard delete with preflight and append `integrityWarnings` to list/getOne.
- Modify: `apps/api/src/admin/sources/admin-source-orders.controller.ts`
  Switch source-order delete to hard delete with preflight and append `integrityWarnings`.
- Modify: `apps/api/src/admin/inventory/admin-accounts.controller.ts`
  Switch account delete to hard delete with preflight and append `integrityWarnings`.
- Modify: `apps/api/src/admin/inventory/admin-keys.controller.ts`
  Switch key delete to hard delete with preflight and append `integrityWarnings`.
- Modify: `apps/api/src/admin/logs/admin-email-logs.controller.ts`
  Add hard-delete route and optionally expose warning arrays consistently.
- Modify: `apps/api/src/admin/logs/admin-audit-logs.controller.ts`
  Add hard-delete route and optionally expose warning arrays consistently.
- Create: `apps/api/test/admin-integrity.test.ts`
  Backend coverage for blocked delete, successful delete, and warning generation.
- Modify: `apps/admin/src/lib/admin-api.ts`
  Preserve structured `409` payload details in thrown `HttpError`.
- Modify: `apps/admin/src/components/common/useBulkDelete.ts`
  Surface dependency-block failures cleanly to the user.
- Create: `apps/admin/src/components/common/IntegrityWarningCell.tsx`
  Shared red icon renderer for row-level warnings.
- Create: `apps/admin/src/components/common/IntegrityWarningAlert.tsx`
  Shared detail/form banner for `integrityWarnings`.
- Modify: `apps/admin/src/features/sources/SourceListPage.tsx`
  Render warning icon column.
- Modify: `apps/admin/src/features/sources/SourceFormPage.tsx`
  Render banner when the source itself has warnings.
- Modify: `apps/admin/src/features/source-orders/SourceOrderListPage.tsx`
  Render warning icon column.
- Modify: `apps/admin/src/features/source-orders/SourceOrderFormPage.tsx`
  Render warning banner.
- Modify: `apps/admin/src/features/inventory/AccountListPage.tsx`
  Render warning icon column.
- Modify: `apps/admin/src/features/inventory/AccountFormPage.tsx`
  Render warning banner and keep orphaned selected ids visible.
- Modify: `apps/admin/src/features/inventory/KeyListPage.tsx`
  Render warning icon column.
- Modify: `apps/admin/src/features/inventory/KeyFormPage.tsx`
  Render warning banner and keep orphaned selected ids visible.
- Modify: `apps/admin/src/features/logs/EmailLogListPage.tsx`
  Enable bulk delete and optional warning icon column.
- Modify: `apps/admin/src/features/logs/EmailLogDetailPage.tsx`
  Render warning banner if warning support is enabled there.
- Modify: `apps/admin/src/features/logs/AuditLogListPage.tsx`
  Enable bulk delete and optional warning icon column.
- Modify: `apps/admin/src/features/logs/AuditLogDetailPage.tsx`
  Render warning banner if warning support is enabled there.
- Modify: `PROGRESS.md`
  Handoff update after verification.

### Task 1: Build Backend Integrity Contracts

**Files:**
- Create: `apps/api/src/admin/integrity/integrity.types.ts`
- Create: `apps/api/src/admin/integrity/admin-integrity.service.ts`
- Modify: `apps/api/src/admin/admin.module.ts`
- Test: `apps/api/test/admin-integrity.test.ts`

- [ ] **Step 1: Write the failing backend test for source delete blocking**

```ts
test("blocks hard delete of a supply source when dependent records exist", async () => {
  const app = await createTestApp();
  const source = await createSource(app);
  await createInventoryAccount(app, { sourceId: source.id });

  const response = await adminDelete(app, `/admin/supply-sources/${source.id}`);
  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body.message).toContain("phụ thuộc");
  expect(body.blockingDependencies).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ resource: "inventory-accounts", count: 1 }),
    ]),
  );
});
```

- [ ] **Step 2: Run the targeted backend test to verify it fails**

Run: `pnpm --dir apps/api exec node --env-file=/home/obi/Projects/cynexsite/.env --import tsx --test test/admin-integrity.test.ts`

Expected: FAIL because `apps/api/test/admin-integrity.test.ts` does not exist and there is no `409` delete-preflight behavior yet.

- [ ] **Step 3: Add shared integrity types and service skeleton**

```ts
export type IntegrityWarning = {
  code: string;
  message: string;
  field?: string;
  relatedResource?: string;
  relatedId?: string;
};

export type BlockingDependency = {
  resource: string;
  count: number;
  sampleIds?: string[];
};

export type DeletePreflightResult = {
  canDelete: boolean;
  blockingDependencies: BlockingDependency[];
};
```

```ts
@Injectable()
export class AdminIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSupplySourceDeletePreflight(id: string): Promise<DeletePreflightResult> {
    const [sourceOrders, inventoryAccounts, inventoryKeys, variants] = await Promise.all([
      this.prisma.sourceOrder.findMany({ where: { sourceId: id }, select: { id: true }, take: 5 }),
      this.prisma.inventoryAccount.findMany({ where: { sourceId: id }, select: { id: true }, take: 5 }),
      this.prisma.inventoryKey.findMany({ where: { sourceId: id }, select: { id: true }, take: 5 }),
      this.prisma.productVariant.findMany({ where: { defaultSourceId: id }, select: { id: true }, take: 5 }),
    ]);

    const blockingDependencies = [
      toDependency("source-orders", sourceOrders),
      toDependency("inventory-accounts", inventoryAccounts),
      toDependency("inventory-keys", inventoryKeys),
      toDependency("product-variants", variants),
    ].filter(Boolean) as BlockingDependency[];

    return { canDelete: blockingDependencies.length === 0, blockingDependencies };
  }
}
```

- [ ] **Step 4: Register the service in the admin module**

```ts
import { AdminIntegrityService } from "./integrity/admin-integrity.service";

@Module({
  controllers: [/* existing controllers */],
  providers: [/* existing providers */, AdminIntegrityService],
})
export class AdminModule {}
```

- [ ] **Step 5: Run the targeted backend test to confirm the new failure is now behavioral**

Run: `pnpm --dir apps/api exec node --env-file=/home/obi/Projects/cynexsite/.env --import tsx --test test/admin-integrity.test.ts`

Expected: FAIL on controller behavior, not missing files or missing provider wiring.

- [ ] **Step 6: Commit the contract slice**

```bash
git add apps/api/src/admin/admin.module.ts apps/api/src/admin/integrity apps/api/test/admin-integrity.test.ts
git commit -m "feat: add admin integrity service contracts"
```

### Task 2: Implement Hard Delete Routes With Preflight

**Files:**
- Modify: `apps/api/src/admin/sources/admin-sources.controller.ts`
- Modify: `apps/api/src/admin/sources/admin-source-orders.controller.ts`
- Modify: `apps/api/src/admin/inventory/admin-accounts.controller.ts`
- Modify: `apps/api/src/admin/inventory/admin-keys.controller.ts`
- Modify: `apps/api/src/admin/logs/admin-email-logs.controller.ts`
- Modify: `apps/api/src/admin/logs/admin-audit-logs.controller.ts`
- Test: `apps/api/test/admin-integrity.test.ts`

- [ ] **Step 1: Extend the backend tests with safe-delete success and log deletion**

```ts
test("hard deletes a supply source when no dependencies remain", async () => {
  const app = await createTestApp();
  const source = await createSource(app);

  const response = await adminDelete(app, `/admin/supply-sources/${source.id}`);

  expect(response.status).toBe(200);
  await expect(findSource(app, source.id)).resolves.toBeNull();
});

test("hard deletes an email log from the admin endpoint", async () => {
  const app = await createTestApp();
  const emailLog = await createEmailLog(app);

  const response = await adminDelete(app, `/admin/email-logs/${emailLog.id}`);

  expect(response.status).toBe(200);
  await expect(findEmailLog(app, emailLog.id)).resolves.toBeNull();
});
```

- [ ] **Step 2: Run the targeted backend test to verify route behavior still fails**

Run: `pnpm --dir apps/api exec node --env-file=/home/obi/Projects/cynexsite/.env --import tsx --test test/admin-integrity.test.ts`

Expected: FAIL because controllers still soft-delete or have no `DELETE` route.

- [ ] **Step 3: Replace soft-delete behavior with preflight + transaction deletes**

```ts
@Delete(":id")
async remove(@Param("id") id: string) {
  await this.prisma.supplySource.findUniqueOrThrow({ where: { id } });
  const preflight = await this.integrity.getSupplySourceDeletePreflight(id);
  if (!preflight.canDelete) {
    throw new ConflictException({
      message: "Không thể xóa nguồn vì còn dữ liệu phụ thuộc",
      resource: "supply-sources",
      id,
      blockingDependencies: preflight.blockingDependencies,
    });
  }

  return {
    data: await this.prisma.$transaction(async (tx) =>
      tx.supplySource.delete({ where: { id } }),
    ),
  };
}
```

```ts
@Delete(":id")
async remove(@Param("id") id: string) {
  await this.prisma.emailLog.findUniqueOrThrow({ where: { id } });
  return { data: await this.prisma.emailLog.delete({ where: { id } }) };
}
```

- [ ] **Step 4: Add analogous preflight-based delete behavior for source orders, inventory accounts, inventory keys, and audit logs**

```ts
const preflight = await this.integrity.getInventoryAccountDeletePreflight(id);
if (!preflight.canDelete) {
  throw new ConflictException({
    message: "Không thể xóa tài khoản kho vì còn dữ liệu phụ thuộc",
    resource: "inventory-accounts",
    id,
    blockingDependencies: preflight.blockingDependencies,
  });
}
return { data: mask(await this.prisma.inventoryAccount.delete({ where: { id } })) };
```

- [ ] **Step 5: Run the targeted backend test to verify the delete flows pass**

Run: `pnpm --dir apps/api exec node --env-file=/home/obi/Projects/cynexsite/.env --import tsx --test test/admin-integrity.test.ts`

Expected: PASS for blocked delete and safe delete cases.

- [ ] **Step 6: Commit the delete-route slice**

```bash
git add apps/api/src/admin/sources/admin-sources.controller.ts apps/api/src/admin/sources/admin-source-orders.controller.ts apps/api/src/admin/inventory/admin-accounts.controller.ts apps/api/src/admin/inventory/admin-keys.controller.ts apps/api/src/admin/logs/admin-email-logs.controller.ts apps/api/src/admin/logs/admin-audit-logs.controller.ts apps/api/test/admin-integrity.test.ts
git commit -m "feat: enforce admin hard delete preflight"
```

### Task 3: Add Integrity Warnings To API Payloads

**Files:**
- Modify: `apps/api/src/admin/integrity/admin-integrity.service.ts`
- Modify: `apps/api/src/admin/sources/admin-sources.controller.ts`
- Modify: `apps/api/src/admin/sources/admin-source-orders.controller.ts`
- Modify: `apps/api/src/admin/inventory/admin-accounts.controller.ts`
- Modify: `apps/api/src/admin/inventory/admin-keys.controller.ts`
- Modify: `apps/api/src/admin/logs/admin-email-logs.controller.ts`
- Modify: `apps/api/src/admin/logs/admin-audit-logs.controller.ts`
- Test: `apps/api/test/admin-integrity.test.ts`

- [ ] **Step 1: Extend the backend tests with warning-generation cases**

```ts
test("returns integrity warnings for an inventory account whose source is missing", async () => {
  const app = await createTestApp();
  const source = await createSource(app);
  const account = await createInventoryAccount(app, { sourceId: source.id });
  await deleteSourceDirectly(app, source.id);

  const response = await adminGet(app, `/admin/inventory-accounts/${account.id}`);
  const body = await response.json();

  expect(body.data.integrityWarnings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "missing_source",
        field: "sourceId",
        relatedResource: "supply-sources",
      }),
    ]),
  );
});
```

- [ ] **Step 2: Run the targeted backend test to verify warning support fails first**

Run: `pnpm --dir apps/api exec node --env-file=/home/obi/Projects/cynexsite/.env --import tsx --test test/admin-integrity.test.ts`

Expected: FAIL because API payloads do not yet include `integrityWarnings`.

- [ ] **Step 3: Implement warning calculators in the integrity service**

```ts
async getInventoryAccountWarnings(record: { sourceId: string | null; productVariantId: string }): Promise<IntegrityWarning[]> {
  const warnings: IntegrityWarning[] = [];
  if (record.sourceId) {
    const source = await this.prisma.supplySource.findUnique({ where: { id: record.sourceId }, select: { id: true } });
    if (!source) {
      warnings.push({
        code: "missing_source",
        message: "Nguồn cung đã bị xóa, cần cập nhật lại bản ghi.",
        field: "sourceId",
        relatedResource: "supply-sources",
        relatedId: record.sourceId,
      });
    }
  }
  return warnings;
}
```

- [ ] **Step 4: Append `integrityWarnings` in list and detail payloads for in-scope resources**

```ts
const data = await Promise.all(
  rows.map(async (row) => ({
    ...mask(row),
    integrityWarnings: await this.integrity.getInventoryAccountWarnings(row),
  })),
);
return { data, total };
```

- [ ] **Step 5: Run the targeted backend test to verify warnings now pass**

Run: `pnpm --dir apps/api exec node --env-file=/home/obi/Projects/cynexsite/.env --import tsx --test test/admin-integrity.test.ts`

Expected: PASS for the warning cases and prior delete cases.

- [ ] **Step 6: Commit the warning-payload slice**

```bash
git add apps/api/src/admin/integrity/admin-integrity.service.ts apps/api/src/admin/sources/admin-sources.controller.ts apps/api/src/admin/sources/admin-source-orders.controller.ts apps/api/src/admin/inventory/admin-accounts.controller.ts apps/api/src/admin/inventory/admin-keys.controller.ts apps/api/src/admin/logs/admin-email-logs.controller.ts apps/api/src/admin/logs/admin-audit-logs.controller.ts apps/api/test/admin-integrity.test.ts
git commit -m "feat: expose admin integrity warnings"
```

### Task 4: Render Warnings And Blocked Deletes In Admin UI

**Files:**
- Create: `apps/admin/src/components/common/IntegrityWarningCell.tsx`
- Create: `apps/admin/src/components/common/IntegrityWarningAlert.tsx`
- Modify: `apps/admin/src/lib/admin-api.ts`
- Modify: `apps/admin/src/components/common/useBulkDelete.ts`
- Modify: `apps/admin/src/features/sources/SourceListPage.tsx`
- Modify: `apps/admin/src/features/sources/SourceFormPage.tsx`
- Modify: `apps/admin/src/features/source-orders/SourceOrderListPage.tsx`
- Modify: `apps/admin/src/features/source-orders/SourceOrderFormPage.tsx`
- Modify: `apps/admin/src/features/inventory/AccountListPage.tsx`
- Modify: `apps/admin/src/features/inventory/AccountFormPage.tsx`
- Modify: `apps/admin/src/features/inventory/KeyListPage.tsx`
- Modify: `apps/admin/src/features/inventory/KeyFormPage.tsx`
- Modify: `apps/admin/src/features/logs/EmailLogListPage.tsx`
- Modify: `apps/admin/src/features/logs/EmailLogDetailPage.tsx`
- Modify: `apps/admin/src/features/logs/AuditLogListPage.tsx`
- Modify: `apps/admin/src/features/logs/AuditLogDetailPage.tsx`
- Test: `apps/admin/src/components/common/ResourceTable.test.tsx`

- [ ] **Step 1: Add a failing frontend test for the warning cell**

```tsx
it("renders a red warning icon when a row has integrity warnings", () => {
  render(<IntegrityWarningCell integrityWarnings={[{ code: "missing_source", message: "Nguồn đã bị xóa" }]} />);
  expect(screen.getByLabelText("Bản ghi cần cập nhật")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run: `pnpm -F @cynex/admin test -- --runInBand ResourceTable.test.tsx`

Expected: FAIL because the shared warning components do not exist yet.

- [ ] **Step 3: Implement reusable warning components and structured delete error handling**

```tsx
export function IntegrityWarningCell(props: { integrityWarnings?: Array<{ code: string; message: string }> }) {
  if (!props.integrityWarnings?.length) return null;
  return (
    <Tooltip title={props.integrityWarnings.map((item) => item.message).join("\n")}>
      <WarningFilled aria-label="Bản ghi cần cập nhật" style={{ color: "#ff4d4f" }} />
    </Tooltip>
  );
}
```

```ts
if (!response.ok) {
  throw new HttpError(message, response.status, body);
}
```

```ts
const firstFailure = result.failed[0];
notifyError(firstFailure?.message ?? "Không thể xóa các bản ghi đã chọn");
```

- [ ] **Step 4: Add warning columns and banners to the list/detail/edit pages**

```tsx
type AccountRecord = {
  id: string;
  username: string;
  status: string;
  integrityWarnings: Array<{ code: string; message: string }>;
};

const columns: ColumnsType<AccountRecord> = [
  {
    title: "",
    key: "integrityWarnings",
    width: 48,
    render: (_, record) => <IntegrityWarningCell integrityWarnings={record.integrityWarnings} />,
  },
  { title: "Tên đăng nhập", dataIndex: "username", key: "username" },
];
```

```tsx
{accountResponse?.data.integrityWarnings?.length ? (
  <IntegrityWarningAlert integrityWarnings={accountResponse.data.integrityWarnings} />
) : null}
```

- [ ] **Step 5: Keep orphaned selected ids visible on edit pages even if the dropdown options no longer contain them**

```tsx
const sourceValue = Form.useWatch("sourceId", form);
const mergedSourceOptions = sourceValue && !sourceOptions.some((item) => item.value === sourceValue)
  ? [{ value: sourceValue, label: `Thiếu nguồn (${sourceValue})` }, ...sourceOptions]
  : sourceOptions;
```

- [ ] **Step 6: Run the focused admin test and then admin typecheck**

Run: `pnpm -F @cynex/admin test -- --runInBand ResourceTable.test.tsx`

Expected: PASS

Run: `pnpm -F @cynex/admin typecheck`

Expected: PASS

- [ ] **Step 7: Commit the admin UI slice**

```bash
git add apps/admin/src/components/common/IntegrityWarningCell.tsx apps/admin/src/components/common/IntegrityWarningAlert.tsx apps/admin/src/lib/admin-api.ts apps/admin/src/components/common/useBulkDelete.ts apps/admin/src/features/sources/SourceListPage.tsx apps/admin/src/features/sources/SourceFormPage.tsx apps/admin/src/features/source-orders/SourceOrderListPage.tsx apps/admin/src/features/source-orders/SourceOrderFormPage.tsx apps/admin/src/features/inventory/AccountListPage.tsx apps/admin/src/features/inventory/AccountFormPage.tsx apps/admin/src/features/inventory/KeyListPage.tsx apps/admin/src/features/inventory/KeyFormPage.tsx apps/admin/src/features/logs/EmailLogListPage.tsx apps/admin/src/features/logs/EmailLogDetailPage.tsx apps/admin/src/features/logs/AuditLogListPage.tsx apps/admin/src/features/logs/AuditLogDetailPage.tsx apps/admin/src/components/common/ResourceTable.test.tsx
git commit -m "feat: show admin integrity warnings"
```

### Task 5: Final Verification And Handoff

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Run the full backend verification for the touched area**

Run: `pnpm -F @cynex/api test`

Expected: PASS including `admin-integrity.test.ts`

- [ ] **Step 2: Run the backend typecheck**

Run: `pnpm -F @cynex/api typecheck`

Expected: PASS

- [ ] **Step 3: Run the admin verification**

Run: `pnpm -F @cynex/admin typecheck`

Expected: PASS

- [ ] **Step 4: Run root verification in the repo’s known-safe order**

Run: `pnpm build`

Expected: PASS

Run: `pnpm typecheck`

Expected: PASS, with a rerun if the known `.next/types` race appears again.

- [ ] **Step 5: Update the handoff artifact**

```md
Last updated: after converting targeted admin resources to hard delete with dependency preflight and integrity warnings in list/detail views, with api/admin verification rerun.
```

- [ ] **Step 6: Commit the verification and handoff update**

```bash
git add PROGRESS.md
git commit -m "docs: update progress for admin integrity hard delete"
```
