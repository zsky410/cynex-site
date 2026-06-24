# Admin Hard Delete And Integrity Warnings Design

Date: 2026-06-24
Project: `@cynex/api` + `@cynex/admin`
Status: Draft for review

## Objective

Tighten admin data management so that:

- admin delete actions perform hard deletes from the database
- deletion is blocked when the target still has dependent records
- admin users see clear dependency errors before data is deleted
- records with broken references or business-invalid linked data show a red warning indicator in admin list and detail/edit views

This change is intended to eliminate silent soft-delete drift and make broken admin data visible and actionable.

## Current State

The current admin implementation mixes soft-delete behavior with editable cross-resource references.

Observed backend behavior:

- `DELETE /admin/supply-sources/:id` sets `status = "archived"`
- `DELETE /admin/source-orders/:id` sets `status = "cancelled"`
- `DELETE /admin/inventory-accounts/:id` sets `status = "disabled"`
- `DELETE /admin/inventory-keys/:id` sets `status = "invalid"`
- `DELETE /admin/users/:id` is already a true delete flow with explicit dependent cleanup
- audit logs and email logs have list endpoints but no delete behavior

Observed UX problem:

- a related record can remain editable even after its source record is "deleted"
- example: a supply source removed from the source tab can still appear as the selected source in inventory edit pages
- the current UI does not highlight records whose linked data is missing or invalid

## Goals

1. Convert targeted admin resources from soft delete to hard delete.
2. Prevent hard delete when the target still has dependent data.
3. Return precise dependency details from the API so the admin can fix the data first.
4. Surface integrity warnings in both list and detail/edit screens.
5. Detect pre-existing orphaned or broken records without mutating them automatically.

## Non-Goals

- automatic cleanup or auto-repair of orphaned records
- nulling or archiving linked data implicitly during delete
- generic integrity scanning for every database table
- changing customer-facing storefront behavior

## Approved Direction

Implement a dedicated admin integrity layer for the resources that are currently causing data drift.

Why this direction:

- database-level FK errors alone are too raw for admin UX
- one-off delete patches would not solve the missing warning problem
- a shared integrity layer lets delete preflight and warning rendering use the same source of truth
- the repo already has resource-specific admin controllers, which fits targeted integrity checks well

## Scope

Initial resources in scope:

- `supply-sources`
- `source-orders`
- `inventory-accounts`
- `inventory-keys`
- admin email logs
- admin audit logs

Secondary warning-only scope if needed by existing relations:

- `orders`
- other resources whose detail screen directly embeds one of the resources above

## Target Architecture

### 1. Integrity Checker Layer

Add a dedicated service in the admin API that can evaluate two things for a record:

- whether the record can be hard-deleted safely
- whether the record currently has integrity warnings

This service is resource-aware, not fully generic. Each supported resource gets a small checker that knows:

- which dependent tables block deletion
- which linked relations are required for the record to remain valid
- how to render stable warning codes and human-readable messages

Suggested structure:

- one orchestrator service under `apps/api/src/admin/integrity/*`
- one checker per resource or per resource family

### 2. Delete Preflight Contract

Hard-delete routes must perform a dependency preflight before deletion.

Flow:

1. load target record
2. compute blocking dependencies
3. if dependencies exist, return `409 Conflict`
4. if dependencies are empty, delete in a transaction
5. return deleted record metadata

Delete must not partially mutate related rows.

### 3. Integrity Warning Contract

Admin list and get-one responses for in-scope resources will include:

- `integrityWarnings`

`integrityWarnings` is an array of structured warning objects. Each warning should include:

- `code`
- `message`
- optional `field`
- optional `relatedResource`
- optional `relatedId`

Example warning cases:

- inventory account references a deleted supply source
- inventory key references a deleted source
- source order references a deleted source
- any record references a variant, source, or order-related entity that no longer exists

### 4. Admin UI Presentation

The admin frontend should render warnings in two places:

- list pages: a red warning icon at the start of the row
- detail/edit pages: a red warning banner with the warning messages

This is intentionally read-only guidance. The warning itself does not auto-fix the record.

## Resource Rules

### 1. Supply Sources

Hard delete is allowed only when the source has no linked records in blocking tables.

Blocking dependencies include:

- `source_orders`
- `inventory_accounts`
- `inventory_keys`
- `product_variants.defaultSourceId`
- any other currently-live admin write path that still depends on `sourceId`

If any dependency exists, delete returns `409` and reports counts plus sample record ids when practical.

### 2. Source Orders

Hard delete is allowed only when the source order is not required by another record.

At minimum, the checker must verify whether any admin/business tables still reference the source order directly.

If no table currently references it, the source order can be hard-deleted.

If a source order already points to a missing supply source, it remains visible but gets an integrity warning.

### 3. Inventory Accounts

Hard delete is blocked when the account has downstream business usage that should remain auditable.

Blocking dependencies include:

- order fulfillment allocations
- warranty replacement records if applicable
- any delivered or assigned records that depend on the account id historically

If an inventory account points to a deleted source or deleted variant, it gets an integrity warning.

### 4. Inventory Keys

Hard delete is blocked when the key has downstream business usage.

Blocking dependencies include:

- sold or allocated usage records
- fulfillment linkage
- warranty replacement linkage if applicable

If an inventory key points to a deleted source or variant, it gets an integrity warning.

### 5. Email Logs

Add explicit admin delete support for email logs.

Because logs are historical by nature, deletion should be allowed only if there is no direct FK dependency that must be preserved. If the schema is standalone enough, allow hard delete.

No integrity warning logic is required unless the email log contains a strong relation to another deleted entity and the list/detail screen needs to flag that loss of context.

### 6. Audit Logs

Add explicit admin delete support for audit logs.

Because audit logs are historical evidence, this route should be deliberately explicit and admin-only like the rest of the admin surface.

If schema dependencies do not block it, allow hard delete. Otherwise return `409` with dependency details.

Integrity warnings for logs are optional unless the current admin UI exposes relational drill-down that breaks when linked entities disappear.

## API Contract

### 1. Delete Failure Shape

When deletion is blocked, return `409` with a structured payload:

- `message`
- `resource`
- `id`
- `blockingDependencies`

Each dependency item should include:

- `resource`
- `count`
- optional `sampleIds`

This shape is intended for direct display in admin notifications.

### 2. List And Detail Shape

For each in-scope resource, append:

- `integrityWarnings: []`

This field must always exist for in-scope resources, even when empty, so the admin UI can render consistently.

## Error Handling

- deleting a non-existent record returns `404`
- deleting a blocked record returns `409`
- malformed or unsupported delete requests return normal validation errors
- integrity warning generation must never crash the whole list response; if a checker fails unexpectedly, log the error and return an empty warning array for that record rather than taking down admin screens

## Testing Strategy

### Backend

Add fail-first tests for:

- supply source delete blocked by inventory/source-order/variant dependencies
- supply source delete succeeds when dependencies are absent
- inventory account get/list returns warnings when `sourceId` or `productVariantId` points to missing data
- inventory key get/list returns warnings for missing linked data
- source order warning when its source is missing
- email log delete route behavior
- audit log delete route behavior

### Frontend

Add focused UI tests where practical for:

- warning icon rendering in list rows
- warning banner rendering in detail/edit views
- blocked delete error surfaced to the admin user

## Rollout Notes

- this change will expose existing broken data instead of silently masking it
- existing orphaned records should remain editable unless a specific screen cannot function safely without the missing relation
- no automatic data migration is required for orphan repair in this phase
- if runtime data shows additional dependent tables during implementation, the checker coverage should expand before the delete route is considered complete

## Open Implementation Constraints

- the exact blocking tables must be confirmed from the current Prisma schema and admin business flows before coding
- the current admin list contract must remain `{ data, total }`
- the warning data must fit the existing Ant Design admin tables without requiring a router rewrite

## Success Criteria

- admin delete on in-scope resources performs real DB deletion when safe
- admin delete is blocked with a useful dependency list when unsafe
- deleting a source can no longer leave a silently broken inventory edit flow without a visible warning
- list and detail/edit screens show warning state for orphaned or broken linked data
- tests cover both blocked-delete and warning-generation behavior
