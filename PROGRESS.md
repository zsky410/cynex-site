# Cynex MVP — Implementation Progress / Handoff

> Handoff note for resuming in a new chat. The authoritative task list is the plan at
> `.cursor/plans/cynex_mvp_implementation_5a2af0fe.plan.md` (do NOT edit it).
> This file tracks what is DONE vs PENDING and how to continue.

Last updated: after converting targeted admin resources to hard delete with dependency preflight and integrity warnings in backend/admin UI, with verification rerun.

## Status summary

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 0 | Monorepo foundation (pnpm+turbo, packages, docker, scaffolds, Dockerfiles, README) | ✅ DONE & verified |
| Phase 1 | Core commerce (auth, catalog, orders, SePay pay + idempotent webhook, email job, web + admin) | ✅ DONE & verified |
| Phase 2 | Wallet (read, deposit, pay-with-wallet, admin adjustment, web + admin UI) | ✅ DONE & verified |
| Phase 3 | Source & inventory (sources, source-orders, inventory accounts/keys with AES-256-GCM, admin CRUD + UI) | ✅ DONE & verified |
| Phase 4 | Manual fulfillment (assign account/key, delivery email, user reveal secret) | ✅ DONE & verified |
| Phase 5 | Warranty / logs / security / ops (warranty, R2 files, audit log, refund, dashboard, cron, Sentry, backup) | ✅ DONE & verified |

**Next immediate step:** MVP phases 0-5 are complete. Remaining work is post-MVP polish: richer audit coverage, production provider keys, and operational hardening beyond the baseline shipped here.

---

## How to run / verify locally

```bash
cd /home/obi/Projects/cynexsite
docker compose up -d postgres redis          # infra (already has volumes)
pnpm install                                  # if needed
pnpm -F @cynex/shared build && pnpm -F @cynex/db build   # build workspace libs (api/worker import dist)
pnpm db:generate                              # prisma client

# DB already migrated + seeded. To redo:
DATABASE_URL="postgresql://cynex:cynex@localhost:5432/cynex?schema=public" pnpm -F @cynex/db exec prisma migrate dev
DATABASE_URL="postgresql://cynex:cynex@localhost:5432/cynex?schema=public" pnpm -F @cynex/db seed
```

### Run services (each in its own terminal)

```bash
# API — IMPORTANT: rebuild before running the compiled output
pnpm -F @cynex/api exec nest build && (cd apps/api && node dist/main.js)
# or dev mode:
pnpm -F @cynex/api dev

# Worker (loads root .env itself via config.ts):
pnpm -F @cynex/worker exec tsx src/main.ts
# or: pnpm -F @cynex/worker dev

# Web:   pnpm -F @cynex/web dev     -> http://localhost:3000
# Admin: pnpm -F @cynex/admin dev   -> http://localhost:5173
# API health: curl localhost:3001/health  -> {"status":"ok","db":"ok"}
```

### Checks

```bash
pnpm -F @cynex/api typecheck   # PASS
pnpm -F @cynex/admin test      # PASS (24/24)
pnpm -F @cynex/admin typecheck # PASS
pnpm build                     # PASS
pnpm typecheck                 # PASS
```

`pnpm -F @cynex/api test` is not fully green in the current local `.env`, but the remaining failures are environment-sensitive and unrelated to the admin integrity slice:

- `apps/api/test/refund-email-job.test.ts` fails when `RESEND_API_KEY` is set to a real key whose sender domain is not verified.
- `apps/api/test/sepay-payment.test.ts` includes a case that expects missing SePay config; it passes when `SEPAY_*` vars are unset/overridden, but not with the current fully populated local SePay config.

Verified by rerunning the failing subset with env overrides:

```bash
pnpm --dir apps/api exec env RESEND_API_KEY= SEPAY_BANK_NAME= SEPAY_BANK_ACCOUNT= SEPAY_ACCOUNT_HOLDER= node --env-file=/home/obi/Projects/cynexsite/.env --test --test-concurrency=1 --import tsx test/refund-email-job.test.ts test/sepay-payment.test.ts
```

### Seed credentials

- **Admin:** `contact.cynex@gmail.com` / `Giabao@#1504@@` (super_admin)
- Sample product `spotify-premium` with 2 variants (SHARED_ACCOUNT, CUSTOMER_ACCOUNT_UPGRADE)

---

## Important decisions / deviations from the plan (read before continuing)

1. **Single consolidated Prisma schema + one `init` migration.** The full data model for
   ALL phases already exists in `packages/db/prisma/schema.prisma` and is migrated. So
   "schema" sub-tasks in later phases are already satisfied — just build the code that uses
   the tables. (Tables for warranty/files/audit/settings/fulfillment already exist.)
2. **Email templates are HTML builder functions** in `apps/worker/src/email/templates.ts`
   (`.ts`, not React `.tsx`). Simpler, no extra deps.
3. **Dev email fallback:** if `RESEND_API_KEY` is empty, `apps/worker/src/email/resend.ts`
   logs to console and returns a fake id so `email_logs` flow is testable without a provider.
4. **SePay / Resend / R2 config now materially affects test behavior.** SePay QR generation and
   webhook validation require the SePay bank config + webhook secret instead of PayOS keys.
   File upload depends on working `R2_*` config and fails at runtime if R2 is missing.
   Email sending switches between console-dev fallback and real Resend depending on `RESEND_API_KEY`.
   Several tests are therefore env-sensitive unless those vars are overridden in the command.
5. **pnpm overrides** in root `package.json`: `ioredis@5.10.1` (match BullMQ), and
   `@types/react`/`@types/react-dom` pinned to v19 (admin also moved to React 19).
6. **`AuthModule` is `@Global`** so guards (`JwtAuthGuard`, `AdminAuthGuard`) + `TokensService`
   are injectable everywhere. `WalletModule`, `QueueModule` are global too.
7. **Admin API list contract** (consumed by `apps/admin/src/dataProvider.ts`):
   `GET /admin/<resource>?page&perPage&sort&order&filter(JSON)&ids(JSON)` → `{ data, total }`;
   getOne/create/update/delete → `{ data }`. Helper: `apps/api/src/admin/common/list-query.ts`.
8. **Secrets at rest:** inventory account password/recovery/note and key + source payload are
   encrypted via `@cynex/shared` `encrypt()`. Admin list/getOne return MASKED data
   (`hasPassword`, `hasKey`, …). Reveal happens only via explicit admin endpoints and now
   writes `ADMIN_VIEW_SECRET` audit rows.
9. **Admin delete semantics changed for targeted resources.** `supply-sources`, `source-orders`,
   `inventory-accounts`, `inventory-keys`, `email-logs`, and `audit-logs` now hard-delete when
   preflight says it is safe; otherwise they return `409` with `blockingDependencies`.
   The admin UI now renders `integrityWarnings` on list/detail pages and surfaces blocked-delete
   dependency messages to the operator.

## Local gotchas learned (save yourself time)

- Don't use `UID` as a shell variable (reserved). Use `USERID`.
- After editing API code you MUST `nest build` before `node dist/main.js` — stale dist will
  silently serve old routes. Symptom: new routes return 404 while old ones work.
- Only one process can hold port 3001 / 3000 / 5173 — kill stale `node dist/main.js` first
  (`pkill -9 -f "dist/main.js"`), otherwise the new API crashes with EADDRINUSE and the old
  build keeps serving.
- `redis-cli` is NOT installed; inspect queues with a tiny node+bullmq script instead.
- Run the worker with `tsx` (its `config.ts` loads root `.env`); the `--env-file` node flag
  invocation exited early in testing.

---

## What is implemented (file map)

### packages
- `packages/shared/src/enums.ts` — all domain enums (mirror Prisma)
- `packages/shared/src/queues.ts` — BullMQ queue + job name constants
- `packages/shared/src/crypto.ts` (+ `crypto.test.ts`) — AES-256-GCM encrypt/decrypt
- `packages/shared/src/dto/*` — zod DTOs (auth, order, warranty)
- `packages/db/prisma/schema.prisma` — FULL schema (all phases), migrated
- `packages/db/prisma/seed.ts` — admin + sample product

### apps/api (NestJS)
- `auth/*` — register, login, /me, logout, forgot/reset password (argon2, JWT access+refresh,
  rate-limited, no email enumeration). Guards: `JwtAuthGuard`, `AdminAuthGuard`.
- `catalog/*` — public `/products`, `/products/:slug`, `/categories`
- `orders/*` — create order (+ fulfillment row per item), list, get-by-code (ownership), pay-wallet
- `payment/*` — SePay QR payload creation for order checkout + wallet deposit, **idempotent**
  webhook `/webhooks/sepay`, pending-attempt invalidation on retry, `markPaid` (order + deposit
  branches), enqueues confirmation emails
- `wallet/*` — atomic `WalletService.applyDelta` (credit/debit, ledger, no-negative), `/wallet`,
  `/wallet/transactions`, `/wallet/deposit`
- `queue/*` — BullMQ producer (`QueueService.enqueueEmail/enqueueAlert`)
- `admin/*` — admin auth; CRUD for products, product-variants, supply-sources, source-orders,
  inventory-accounts (encrypted), inventory-keys (encrypted); orders list/show; users
  list/show/edit + wallet-adjustment
- `warranty/*` — user warranty case create/list/detail + reply (`/warranty-cases`,
  `/warranty-cases/:id`, `/warranty-cases/:id/messages`) with ownership + delivered-item checks
- `admin/warranty/*` — admin warranty list/detail/reply/update/replace (`/admin/warranty-cases`,
  `/admin/warranty-cases/:id`, `/admin/warranty-cases/:id/messages`,
  `/admin/warranty-cases/:id/replace-account`, `/admin/warranty-cases/:id/replace-key`) with source/order/inventory linking
- `audit/*` + `admin/inventory/reveal.controller.ts` — `ADMIN_VIEW_SECRET` audit rows and
  reveal endpoints for inventory accounts/keys
- `admin/orders/admin-refund.*` — refund-to-wallet flow (`POST /admin/orders/:id/refund`)
- `admin/logs/*` — admin email-log + audit-log viewer endpoints
- `admin/dashboard/*` — `GET /admin/dashboard` pending/processing/delivered/revenue/stock metrics
- `admin/orders/admin-fulfillment.controller.ts` + `fulfillment.service.ts` — Phase 4 manual
  fulfillment: `POST /admin/fulfillments/:id/{mark-processing,assign-account,assign-key,manual,
  preview-delivery-email,send-delivery-email}`. Atomic slot logic (conditional `updateMany` guards
  oversell), variant-match validation, builds + encrypts the delivered message, order rollup via
  `leastAdvancedFulfillment`. `admin/orders/delivery-template.ts` mirrors the worker email for preview.
- `orders/orders.service.ts` `getByCode` now masks `deliveredMessageEncrypted` and reveals the
  decrypted `deliveredMessage` to the owner ONLY once the item is `delivered`.
- `sentry.ts` — lightweight Sentry/bootstrap logger for API uncaught exceptions (`SENTRY_DSN` aware)
- `test/payment-idempotency.test.ts` — order + deposit idempotency
- `test/fulfillment.test.ts` — shared-account capacity (no oversell, flips to `full`) + wrong-variant reject

### apps/worker (BullMQ)
- `main.ts` + `handlers.ts` + `redis.ts` — workers for `email` & `alerts` queues
- `email/resend.ts`, `email/deliver.ts` (idempotent via `email_logs.dedupeKey`), `email/templates.ts`
- `jobs/` — payment-confirmed, wallet-deposit, reset-password, **delivery** handlers. `send-delivery.ts`
  sends the (secret-free) notification then, ONLY on send success, flips fulfillment + inventory +
  order to `delivered` (failed send leaves `assigned` for retry/resend).
- `jobs/send-refund.ts` — refund email handler; writes `email_logs` type `refund`
- `jobs/notify-admin-pending.ts`, `jobs/daily-stock-alert.ts`, `scheduler.ts` — repeatable alerts queue registration + summary logging
- `sentry.ts` — lightweight Sentry/bootstrap logger for worker uncaught exceptions (`SENTRY_DSN` aware)

### apps/web (Next.js)
- Pages: `/`, `/products`, `/products/[slug]` (+ `BuyPanel`), `/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/checkout/[orderCode]` (+ return/cancel),
  `/orders`, `/orders/[orderCode]`, `/orders/[orderCode]/warranty`, `/wallet`, `/warranty`
- `apps/web` checkout + wallet now render SePay QR / transfer instructions directly instead of
  redirecting to a hosted payment URL
- `lib/api.ts` (token + fetch), `lib/utils.ts`, `lib/status.ts`

### apps/admin (React Admin + MUI)
- `dataProvider.ts`, `authProvider.ts`, resources: products, variants, orders, users,
  sources, sourceOrders, inventory (accounts + keys, now with reveal buttons), warranty cases,
  email logs, audit logs; order show now also has a refund box; dashboard + warranty replace box are live

---

## DONE — Phase 4: Manual fulfillment (T4.1–T4.12)

All implemented and verified end-to-end (admin login → paid order → assign account → preview →
send → worker delivers → user reveals secret). Key decisions/deviations:

1. **One combined controller** `admin/orders/admin-fulfillment.controller.ts` exposing per-fulfillment
   routes `POST /admin/fulfillments/:id/...` (id = `OrderFulfillment.id`). Logic lives in
   `FulfillmentService` (registered as a provider in `admin.module.ts`) so it's unit-testable.
2. **assign-account handles BOTH dedicated and shared** (branches on `account.accountType`), covering
   T4.4 + T4.5. Oversell is prevented by a conditional `updateMany` (`WHERE usedSlots < maxSlots`),
   which is atomic at the row level — no explicit SELECT FOR UPDATE. Account flips to `full` at capacity.
   ponytail ceiling noted in code: relies on the DB row update, fine for a single Postgres.
3. **Delivered message is built + encrypted at ASSIGN time** into `deliveredMessageEncrypted`
   (account → username/password/recovery/note; key → key/note; manual → the note). The delivery
   **email is generic** (no secrets) — the secret is revealed on the website only.
4. **State flips to `delivered` only after the email actually sends** (worker `send-delivery.ts`),
   so a failed send leaves the item `assigned`. Order-level status = least-advanced item via
   `leastAdvancedFulfillment` (added to `@cynex/shared`).
5. **Resend** of an already-delivered item requires `confirm:true`; it uses a fresh dedupe key so a
   real new email is sent (normal first send stays idempotent against BullMQ retries).
6. **GOTCHA:** BullMQ rejects `:` in custom job ids. `email_logs.dedupeKey` keeps the `:` form;
   the BullMQ jobId is the same string with `:`→`-`. (The pre-existing payment-confirmed jobIds in
   `orders.service.ts`/`payment.service.ts` still use `:` — they'd hit the same error if ever
   enqueued for real; left as-is, out of Phase 4 scope.)
7. **Reveal (T4.10):** `GET /orders/:orderCode` masks the ciphertext and returns decrypted
   `deliveredMessage` to the owner only when the item is `delivered`. Web page already renders it.
   Audit coverage for admin secret reveal was completed in Phase 5.
8. **Admin UI (T4.12):** `apps/admin/src/resources/orders.tsx` OrderShow has a per-item panel with
   account/key dropdowns (fetched filtered by variant + `status=available`), manual-note box, and
   preview/send buttons. Plain `fetch` (not the dataProvider) since these are RPC-style actions.

## DONE — Phase 5: Warranty / logs / security / ops (T5.1–T5.17)

Tables already existed (`warranty_cases`, `warranty_messages`, `files`, `audit_logs`, `settings`).
The full Phase 5 feature set is now implemented:

1. **T5.5/T5.17 user warranty flow:**
   - `apps/api/src/warranty/warranty.service.ts` — create/list/detail + user reply logic.
   - `apps/api/src/warranty/warranty.controller.ts` — `POST /warranty-cases`, `GET /warranty-cases`,
     `GET /warranty-cases/:id`, `POST /warranty-cases/:id/messages`.
   - `apps/api/test/warranty.test.ts` — verifies:
     - own delivered item can create an `open` case with first message
     - undelivered item is rejected
     - list/detail are owner-scoped
     - owner can append a new message
   - `packages/shared/src/dto/warranty.ts` now includes both create-case and create-message DTOs.
   - `apps/web/src/app/orders/[orderCode]/warranty/page.tsx` creates cases from a delivered order item.
   - `apps/web/src/app/warranty/page.tsx` lists user cases, shows message history, and lets the user reply with more attachments.

2. **T5.6/T5.7 admin warranty handling + replace flow:**
- `apps/api/src/admin/warranty/admin-warranty.service.ts` — admin list/detail/reply/update logic.
   - `apps/api/src/admin/warranty/admin-warranty.controller.ts` — `GET /admin/warranty-cases`,
     `GET /admin/warranty-cases/:id`, `POST /admin/warranty-cases/:id/messages`,
     `PATCH /admin/warranty-cases/:id`, `POST /admin/warranty-cases/:id/replace-account`,
     `POST /admin/warranty-cases/:id/replace-key`.
   - `apps/api/src/warranty/replace.ts` — replacement logic that marks the old allocation/key as `replaced`,
     switches fulfillment to the new account/key, refreshes the delivered secret, and writes audit rows.
   - `apps/api/test/admin-warranty.test.ts` — verifies:
     - admin can list and inspect warranty cases with user/order context
     - admin reply appends a message and moves the case to `waiting_customer`
     - admin can update status/adminNote and link source/source-order/account/key
     - admin can replace a warranty account and replace a warranty key end-to-end
- `apps/admin/src/resources/warranty.tsx` + `apps/admin/src/App.tsx` now expose a React Admin
  warranty resource with list/show/edit plus a reply box and replace account/key actions.

3. **T5.4 file upload/storage slice:**
   - `apps/api/src/files/files.module.ts`, `files.service.ts`, `files.controller.ts`
     expose:
     - `POST /files/upload`, `GET /files/:id/content` for authenticated users
     - `POST /admin/files/upload`, `GET /admin/files/:id/content` for admins
   - Storage behavior:
     - files are stored on Cloudflare R2 only
     - API can still boot without `R2_*`, but file upload/download endpoints fail at runtime until R2 is configured
   - File registry now backs:
     - warranty/support attachments
     - product primary image
     - product banner
     - product guide files
     - source-order proof files
   - Admin product/source-order forms can upload files directly to R2 and bind returned `fileId` references into their resource payloads.
   - Public catalog/product detail payloads now resolve product assets into file descriptors (`publicUrl`, `contentPath`, metadata) so the storefront can render real images and guide links.
   - Warranty detail payloads for both web/admin now resolve message attachments into file descriptors for open/download actions.
   - `apps/api/test/files.test.ts` verifies metadata creation, owner/admin read access, missing-R2 runtime failure, and MIME rejection.
   - `apps/web/src/lib/api.ts` now supports multipart upload via `apiUploadFile()` and avoids forcing JSON headers on `FormData`.
   - `apps/web/src/app/orders/[orderCode]/warranty/page.tsx` now exists, so the order-detail warranty link is no longer broken; users can create a warranty/support case and attach image/PDF/text files.

4. **T5.8/T5.9 audit + view-secret slice:**
   - `apps/api/src/audit/audit.service.ts` — reusable audit writer for admin/system actions.
   - `apps/api/src/admin/inventory/admin-reveal.service.ts` +
     `apps/api/src/admin/inventory/reveal.controller.ts` — `POST /admin/inventory-accounts/:id/reveal`
     and `POST /admin/inventory-keys/:id/reveal`.
   - `apps/api/test/admin-secret-reveal.test.ts` — verifies:
     - inventory account reveal decrypts secrets and writes `ADMIN_VIEW_SECRET`
     - inventory key reveal decrypts secret and writes `ADMIN_VIEW_SECRET`
   - `apps/api/test/fulfillment.test.ts` now also verifies `assignAccount(..., adminId)` writes
     `ADMIN_ASSIGN_ACCOUNT`.
   - Audit logging is now wired for:
     - inventory secret reveal
     - assign account
     - assign key
     - send delivery email
     - wallet adjustment
     - admin warranty reply/update
   - `apps/admin/src/resources/inventory.tsx` now has minimal "Reveal" buttons in account/key lists.

5. **T5.10/T5.11 refund flow:**
   - `apps/api/src/admin/orders/admin-refund.service.ts` +
     `apps/api/src/admin/orders/admin-refund.controller.ts` — `POST /admin/orders/:id/refund`.
   - Refund behavior now:
     - credits the user's wallet with a `wallet_transactions.type = refund` row
     - marks order / order_items / order_fulfillments / paid payments as `refunded`
     - enqueues `EMAIL_JOB.refund`
     - writes `ADMIN_REFUND_ORDER` audit
   - `apps/worker/src/jobs/send-refund.ts` sends the refund email via existing `deliverEmail` flow
     and records `email_logs.type = refund`.
   - `apps/api/test/admin-refund.test.ts` verifies refund credit/status/queue/audit behavior.
   - `apps/api/test/refund-email-job.test.ts` verifies the worker handler writes a sent `email_logs` row.
   - `apps/admin/src/resources/orders.tsx` now has a minimal refund box on paid orders.

6. **T5.12/T5.13 admin viewers + dashboard:**
   - `apps/api/src/admin/logs/admin-email-logs.controller.ts` — `GET /admin/email-logs`,
     `GET /admin/email-logs/:id`.
   - `apps/api/src/admin/logs/admin-audit-logs.controller.ts` — `GET /admin/audit-logs`,
     `GET /admin/audit-logs/:id`.
   - `apps/api/test/admin-logs.test.ts` — verifies:
     - email-log viewer can list by type and return detail with user/order context
     - audit-log viewer can list by action and return detail
   - `apps/api/src/admin/dashboard/dashboard.controller.ts` + `apps/api/test/admin-dashboard.test.ts`
     provide and verify pending/processing/delivered-today/revenue/stock counts.
   - `apps/admin/src/Dashboard.tsx` renders those cards on the admin home screen.
   - `apps/admin/src/resources/logs.tsx` + `apps/admin/src/App.tsx` now expose read-only React Admin
     resources for email logs and audit logs.

7. **T5.14/T5.15/T5.16 ops baseline:**
   - `apps/worker/src/jobs/notify-admin-pending.ts`, `apps/worker/src/jobs/daily-stock-alert.ts`,
     `apps/worker/src/scheduler.ts`, `apps/api/test/alert-jobs.test.ts` — alert handlers are registered,
     schedulers are upserted on worker boot, and manual execution is verified.
   - `apps/api/src/sentry.ts`, `apps/worker/src/sentry.ts` — lightweight Sentry/bootstrap logging tied to `SENTRY_DSN`
     for uncaught exceptions and unhandled rejections.
   - `scripts/pg-backup.sh` + `docs/RESTORE.md` — dated PostgreSQL custom dumps plus restore instructions.

---

## Open env vars to fill for full functionality (`.env`)
`SEPAY_BANK_NAME`, `SEPAY_BANK_ACCOUNT`, `SEPAY_ACCOUNT_HOLDER`, `SEPAY_QR_TEMPLATE`, `SEPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `R2_*`, `SENTRY_DSN`.
`ENCRYPTION_KEY`, `JWT_*` already have working dev values.
