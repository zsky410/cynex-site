# Cynex MVP — Implementation Progress / Handoff

> Handoff note for resuming in a new chat. The authoritative task list is the plan at
> `.cursor/plans/cynex_mvp_implementation_5a2af0fe.plan.md` (do NOT edit it).
> This file tracks what is DONE vs PENDING and how to continue.

Last updated: after **Phase 4** completed and verified.

## Status summary

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 0 | Monorepo foundation (pnpm+turbo, packages, docker, scaffolds, Dockerfiles, README) | ✅ DONE & verified |
| Phase 1 | Core commerce (auth, catalog, orders, payOS pay + idempotent webhook, email job, web + admin) | ✅ DONE & verified |
| Phase 2 | Wallet (read, deposit, pay-with-wallet, admin adjustment, web + admin UI) | ✅ DONE & verified |
| Phase 3 | Source & inventory (sources, source-orders, inventory accounts/keys with AES-256-GCM, admin CRUD + UI) | ✅ DONE & verified |
| Phase 4 | Manual fulfillment (assign account/key, delivery email, user reveal secret) | ✅ DONE & verified |
| Phase 5 | Warranty / logs / security / ops (warranty, R2 files, audit log, refund, dashboard, cron, Sentry, backup) | ⏳ NOT STARTED |

**Next immediate step: Phase 5, task T5.1 (per the plan; NOT started yet).**

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

### Checks (all currently green)

```bash
pnpm typecheck                 # 9/9 packages
pnpm -F @cynex/shared test     # 4/4 (AES-256-GCM crypto)
pnpm -F @cynex/api test        # 4/4 (payment + deposit idempotency, shared-slot + variant-match)
```

### Seed credentials

- **Admin:** `admin@cynex.local` / `admin12345` (super_admin)
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
4. **payOS / Resend / R2 keys are NOT set** in `.env` (placeholders). payOS link creation
   and real email sending require real keys. Idempotency/credit logic is covered by tests
   that call the service directly (see `apps/api/test/payment-idempotency.test.ts`).
5. **pnpm overrides** in root `package.json`: `ioredis@5.10.1` (match BullMQ), and
   `@types/react`/`@types/react-dom` pinned to v19 (admin also moved to React 19).
6. **`AuthModule` is `@Global`** so guards (`JwtAuthGuard`, `AdminAuthGuard`) + `TokensService`
   are injectable everywhere. `WalletModule`, `QueueModule` are global too.
7. **Admin API list contract** (consumed by `apps/admin/src/dataProvider.ts`):
   `GET /admin/<resource>?page&perPage&sort&order&filter(JSON)&ids(JSON)` → `{ data, total }`;
   getOne/create/update/delete → `{ data }`. Helper: `apps/api/src/admin/common/list-query.ts`.
8. **Secrets at rest:** inventory account password/recovery/note and key + source payload are
   encrypted via `@cynex/shared` `encrypt()`. Admin list/getOne return MASKED data
   (`hasPassword`, `hasKey`, …). A decrypt/"view secret" endpoint with audit log is a
   **Phase 5** task (T5.x ADMIN_VIEW_SECRET) — not built yet.
9. **Soft deletes:** admin delete sets status to archived/disabled/invalid/cancelled rather
   than hard-deleting (preserves order history).

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
- `payment/*` — payOS link creation, **idempotent** webhook `/webhooks/payos`, deposit creation,
  `markPaid` (order + deposit branches), enqueues confirmation emails
- `wallet/*` — atomic `WalletService.applyDelta` (credit/debit, ledger, no-negative), `/wallet`,
  `/wallet/transactions`, `/wallet/deposit`
- `queue/*` — BullMQ producer (`QueueService.enqueueEmail/enqueueAlert`)
- `admin/*` — admin auth; CRUD for products, product-variants, supply-sources, source-orders,
  inventory-accounts (encrypted), inventory-keys (encrypted); orders list/show; users
  list/show/edit + wallet-adjustment
- `admin/orders/admin-fulfillment.controller.ts` + `fulfillment.service.ts` — Phase 4 manual
  fulfillment: `POST /admin/fulfillments/:id/{mark-processing,assign-account,assign-key,manual,
  preview-delivery-email,send-delivery-email}`. Atomic slot logic (conditional `updateMany` guards
  oversell), variant-match validation, builds + encrypts the delivered message, order rollup via
  `leastAdvancedFulfillment`. `admin/orders/delivery-template.ts` mirrors the worker email for preview.
- `orders/orders.service.ts` `getByCode` now masks `deliveredMessageEncrypted` and reveals the
  decrypted `deliveredMessage` to the owner ONLY once the item is `delivered`.
- `test/payment-idempotency.test.ts` — order + deposit idempotency
- `test/fulfillment.test.ts` — shared-account capacity (no oversell, flips to `full`) + wrong-variant reject

### apps/worker (BullMQ)
- `main.ts` + `handlers.ts` + `redis.ts` — workers for `email` & `alerts` queues
- `email/resend.ts`, `email/deliver.ts` (idempotent via `email_logs.dedupeKey`), `email/templates.ts`
- `jobs/` — payment-confirmed, wallet-deposit, reset-password, **delivery** handlers. `send-delivery.ts`
  sends the (secret-free) notification then, ONLY on send success, flips fulfillment + inventory +
  order to `delivered` (failed send leaves `assigned` for retry/resend).

### apps/web (Next.js)
- Pages: `/`, `/products`, `/products/[slug]` (+ `BuyPanel`), `/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/checkout/[orderCode]` (+ return/cancel),
  `/orders`, `/orders/[orderCode]`, `/wallet`
- `lib/api.ts` (token + fetch), `lib/utils.ts`, `lib/status.ts`

### apps/admin (React Admin + MUI)
- `dataProvider.ts`, `authProvider.ts`, resources: products, variants, orders, users,
  sources, sourceOrders, inventory (accounts + keys)

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
   No audit row written yet — `ADMIN_VIEW_SECRET`/access audit is a Phase 5 task.
8. **Admin UI (T4.12):** `apps/admin/src/resources/orders.tsx` OrderShow has a per-item panel with
   account/key dropdowns (fetched filtered by variant + `status=available`), manual-note box, and
   preview/send buttons. Plain `fetch` (not the dataProvider) since these are RPC-style actions.

## PENDING — Phase 5: Warranty / logs / security / ops (T5.1–T5.17)

Tables already exist (`warranty_cases`, `warranty_messages`, `files`, `audit_logs`, `settings`).
To build (high level): R2 storage service + file upload; user warranty create/list/messages;
admin warranty management + replace flow; **audit log service** + `ADMIN_VIEW_SECRET` reveal
endpoint for inventory secrets (decrypt + write `audit_logs`); admin refund-to-wallet
(`WalletService.credit(..., 'refund')` already exists) + refund email (`refundEmail` template
exists, add worker handler + `EMAIL_JOB.refund`); email/audit log viewer resources in admin;
dashboard stats; cron alerts (worker `alerts` queue + scheduler, `ALERT_JOB.*` already defined);
Sentry init (api + worker, `SENTRY_DSN` in env); pg backup/restore scripts + `docs/RESTORE.md`;
web warranty UI (`/orders/[orderCode]/warranty` link already present in order detail).

---

## Open env vars to fill for full functionality (`.env`)
`PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`, `RESEND_API_KEY`, `R2_*`, `SENTRY_DSN`.
`ENCRYPTION_KEY`, `JWT_*` already have working dev values.
