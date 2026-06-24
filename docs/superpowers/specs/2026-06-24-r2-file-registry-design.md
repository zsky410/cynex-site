# R2 File Registry Design

Date: 2026-06-24

## Goal

Make the repository match the PRD's Cloudflare R2 scope end-to-end by using the `files` table as the single registry for uploaded assets and attachments. All real bytes live in R2. Domain models keep only `fileId` references or arrays of `fileId` values.

Covered PRD file classes:

- Product images
- Product banners
- Product guide files
- Source-order proof files
- Warranty error images and attachments

## Current State

- R2-backed upload/download already exists in `apps/api/src/files`.
- Warranty flows already upload attachments and store `attachmentFileIds` on `warranty_messages`.
- `products.imageFileId` already exists in schema and is exposed by API, but is not resolved/rendered end-to-end.
- There is no admin UI to upload/select product images, banners, guide files, or source-order proof files.
- Admin and web warranty UIs do not render attachment metadata/links.

## Design

## File registry

Keep `files` as the single metadata registry for all uploads.

Each file record continues to store:

- `id`
- `fileName`
- `mimeType`
- `size`
- `storageDriver`
- `storageBucket`
- `storageKey`
- `publicUrl`
- uploader fields

No domain stores raw R2 URLs as source of truth. Domains store `fileId` references only.

## Domain mapping

Use `fileId` or `fileId[]` references in domain records:

- `products.imageFileId`: primary product image
- `products.bannerFileId`: product banner
- `products.guideFileIds`: guide files
- `source_orders.proofFileIds`: proof files
- `warranty_messages.attachmentFileIds`: attachments, preserved from current behavior

The API resolves these ids into file descriptors when returning domain records.

## File descriptor shape

Where a domain returns file-linked data, it should expose:

- `id`
- `fileName`
- `mimeType`
- `size`
- `publicUrl`
- `contentPath`

`contentPath` is the authenticated API download path. `publicUrl` is optional and used when configured.

## Ownership and validation

- Admin-originated product, banner, guide, and proof files must come from admin uploads.
- User-originated warranty attachments must belong to the user.
- Admin-originated warranty attachments, if added later, must belong to the admin.
- Domain write APIs reject unknown `fileId` values or ids uploaded by the wrong actor.

This keeps one registry while still enforcing domain-level ownership.

## API changes

## Files module

Keep the existing R2-only behavior:

- API boots without `R2_*`
- upload/download endpoints fail at runtime if R2 is not configured

Keep:

- `POST /files/upload`
- `GET /files/:id/content`
- `POST /admin/files/upload`
- `GET /admin/files/:id/content`

Add a small reusable resolver service/helper so domain services can turn `fileId` references into file descriptor payloads.

## Product admin API

Extend product write/read support for:

- `imageFileId`
- `bannerFileId`
- `guideFileIds`

Validate all referenced ids as admin-uploaded files.

## Catalog API

Catalog responses should return resolved file descriptors instead of only ids, at least for:

- product image
- product banner
- guide files

Raw ids may remain in internal/admin payloads if useful, but storefront responses need resolved asset data for rendering.

## Source-order admin API

Extend source-order write/read support for:

- `proofFileIds`

Return resolved proof file descriptors in detail/list payloads where needed by admin UI.

## Warranty API

Preserve current attachment behavior, but resolve `attachmentFileIds` into file descriptor lists in:

- user warranty detail responses
- admin warranty detail responses

## UI changes

## Admin

### Product form

Add upload/select controls for:

- primary image
- banner
- guide files

Display uploaded file list/previews:

- image preview where applicable
- file name, mime type, size
- remove/replace actions

### Source-order form/detail

Add upload/select controls for proof files and render the current proof list with view/download actions.

### Warranty detail

Render attachment lists per message with view/download actions.

Admin does not need a separate media library in this phase; direct upload-to-field is enough.

## Web storefront

### Product list/detail

Render the real product image when present.

Render the product banner when present.

Render guide file links on product detail when present.

Fallback visuals remain acceptable when a product has no linked file.

### Warranty pages

Keep current upload flow.

Render attachment lists in warranty conversation views so users can open/download what they uploaded.

## Migration

Add schema fields needed for PRD alignment:

- `products.bannerFileId`
- `products.guideFileIds`
- `source_orders.proofFileIds`

Existing `products.imageFileId` and `warranty_messages.attachmentFileIds` remain.

Use JSON array fields for `guideFileIds` and `proofFileIds` to stay aligned with the chosen single-registry approach and avoid introducing new media tables in this phase.

## Testing

Required verification:

- files tests for R2 upload/read and missing-R2 runtime failure
- catalog/admin tests for product file fields
- source-order tests for proof file linkage validation
- warranty tests for resolved attachment payloads
- `pnpm --dir apps/api typecheck`
- `pnpm --dir apps/admin typecheck`
- `pnpm typecheck`

Runtime spot checks:

- admin uploads product image/banner/guide and saves product
- storefront renders uploaded image/banner/guide
- admin uploads proof on source order and can open it
- user creates warranty case with attachments and both web/admin can see download links

## Scope boundaries

Included:

- End-to-end file linkage for the PRD file classes above
- R2-backed upload/download and rendering

Excluded:

- General-purpose media library UI
- File transformations, thumbnails, image resizing, or background jobs
- Bulk migration/backfill of historical local files

## Risks

- JSON `fileId[]` fields reduce relational strictness; validation must be explicit in services.
- Storefront payload shape changes may require coordinated UI updates.
- Admin forms need careful UX so upload state and saved references do not drift.

## Recommended implementation order

1. Schema and migration
2. Shared file resolver in API
3. Product admin/catalog API and UI
4. Source-order proof API and UI
5. Warranty attachment resolution in user/admin UIs
6. Verification and handoff updates
