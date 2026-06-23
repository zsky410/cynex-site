# SePay Payment Migration Design

Date: 2026-06-24
Project: `@cynex/api` + `@cynex/web`
Status: Draft for review

## Objective

Replace PayOS completely with SePay for both order payments and wallet deposits.

The new flow must support:

- generating a QR payment payload for each payment attempt
- using one fixed receiving bank account for the whole system
- generating a new payment code for every payment attempt
- confirming incoming transfers through a SePay webhook
- preserving the existing paid-state business logic for orders and wallet deposits

## Current State

The payment implementation currently depends on PayOS in three places:

- payment creation for orders
- payment creation for wallet deposits
- webhook verification and payment confirmation

Current backend files:

- `apps/api/src/payment/payment.service.ts`
- `apps/api/src/payment/payos.service.ts`
- `apps/api/src/payment/payment.controller.ts`
- `apps/api/src/payment/webhook.controller.ts`

Current behavior:

- order payment creation returns `checkoutUrl`, `qrCode`, and `paymentCode`
- wallet deposit creation returns `checkoutUrl`, `qrCode`, and `paymentCode`
- webhook `/webhooks/payos` verifies the PayOS signature and then calls `markPaid()`
- `markPaid()` is the core idempotent business transition for:
  - setting `payment.status = paid`
  - updating order payment and fulfillment state
  - crediting wallet deposits
  - enqueueing confirmation emails

## Goals

1. Remove all runtime PayOS dependency from the API.
2. Replace PayOS link generation with SePay-compatible bank transfer QR data.
3. Keep `markPaid()` as the single business transition entrypoint for successful payments.
4. Generate a new pending payment record for every payment attempt.
5. Use SePay webhook confirmation to mark a payment as paid.
6. Keep the frontend payment experience functional after the provider switch.

## Non-Goals

- supporting PayOS and SePay in parallel
- preserving PayOS redirect checkout semantics
- auto-reconciling ambiguous or partial bank transfers
- rewriting order or wallet business rules outside payment-provider integration

## Approved Direction

The system will switch to a SePay-native transfer flow rather than preserving the old PayOS contract shape.

Why this direction:

- SePay in this scope is bank-transfer-based, not hosted-checkout-based
- keeping `checkoutUrl` would create a misleading API contract
- the existing `markPaid()` logic already isolates the most important business behavior
- a provider-native contract is simpler and easier to maintain than a fake PayOS compatibility layer

## Target Architecture

### 1. Payment Provider Service

Replace `PayosService` with a dedicated SePay service responsible for generating the response payload used by the frontend checkout screen.

Responsibilities:

- read SePay and bank-account configuration from environment variables
- validate required configuration at runtime
- generate QR data for a specific payment attempt
- build the canonical transfer content string from `paymentCode`
- validate incoming webhook authentication
- normalize webhook payload fields used by the payment service

This service must not own order or wallet business transitions.

### 2. Payment Record Strategy

Every payment attempt creates a new `payment` row.

Rules:

- no reuse of a previous pending payment for orders
- no reuse of a previous pending payment for wallet deposits
- each new row gets a new `paymentCode`
- new payments use `provider = "sepay"`
- existing historical rows with `provider = "payos"` remain unchanged

This preserves auditability and matches the approved requirement that each click generates a new code.

### 3. Transfer Matching Strategy

The fixed receiving bank account is shared by all customers. Payments are distinguished by a unique transfer content string.

Rules:

- `paymentCode` is the canonical unique identifier for matching
- the QR payload embeds the same transfer content shown to the user
- webhook processing extracts or resolves the `paymentCode` from transfer content
- the system only auto-confirms a payment when both the payment code and amount match the expected pending payment

Amount mismatch is a hard stop for automatic confirmation.

### 4. Confirmation Flow

Webhook handling remains a thin layer over the existing payment transition logic.

Flow:

1. receive SePay webhook
2. validate webhook authentication
3. normalize payload
4. extract `paymentCode`
5. find pending payment
6. verify amount matches expected amount
7. call `markPaid(paymentCode, providerTransactionId, rawPayload)`
8. return success response

`markPaid()` remains responsible for idempotency and business side effects.

## API Contract Changes

### 1. Order Payment Creation

`POST /orders/:orderCode/pay`

Old response:

- `checkoutUrl`
- `qrCode`
- `paymentCode`

New response:

- `paymentCode`
- `amount`
- `qrCode`
- `bankName`
- `bankAccount`
- `accountHolder`
- `transferContent`

Notes:

- `checkoutUrl` is removed
- `qrCode` may be a QR image URL, raw QR payload, or provider-hosted QR string depending on SePay integration details
- the frontend must render a transfer-instructions panel instead of redirecting to a PayOS checkout page

### 2. Wallet Deposit Creation

The wallet deposit endpoint returns the same shape as order payment creation:

- `paymentCode`
- `amount`
- `qrCode`
- `bankName`
- `bankAccount`
- `accountHolder`
- `transferContent`

This keeps the frontend display model consistent across order checkout and wallet top-up.

### 3. Webhook Endpoint

Replace `/webhooks/payos` with a SePay endpoint, for example `/webhooks/sepay`.

The exact path may be configured differently if SePay integration conventions require it, but the backend should expose a single provider-specific webhook endpoint.

Expected behavior:

- reject missing or invalid authentication
- reject malformed payloads
- reject unmatched or ambiguous payment references
- reject amount mismatches
- return idempotent success for duplicate paid notifications

## Configuration

The API needs provider and recipient-account configuration. Exact variable names may be adjusted to match existing config conventions, but the design requires:

- a fixed receiving bank name
- a fixed receiving bank account number
- a fixed account holder name
- a webhook secret or token for inbound webhook validation
- optional QR template metadata if required by SePay

If required configuration is missing, payment creation must fail fast with a clear server error rather than generating unusable QR data.

## Data Model Impact

### 1. Payment Provider

The Prisma schema currently uses the shared `PaymentProvider` enum for both `payment.provider` and `order.paymentMethod`.

Implementation must add `sepay` to that enum while keeping:

- `payos` for historical rows
- `wallet` for wallet-funded orders
- `manual` for any existing manual-admin flows

The migration must be additive, not destructive.

### 2. Payment Metadata

Use existing payment columns wherever possible:

- `paymentCode`
- `provider`
- `providerPaymentId`
- `qrCode`
- `rawWebhookPayload`
- `status`
- `paidAt`

No schema expansion is required unless SePay integration proves that an essential field cannot fit the current model.

## Backend Implementation Plan

### 1. Replace Provider Service

- remove PayOS client integration
- add a SePay service with QR payload generation and webhook validation helpers
- update the payment module wiring accordingly

### 2. Update Payment Creation

- change `createOrderPayment()` to always create a new SePay payment row
- change `createDeposit()` to always create a new SePay payment row
- generate transfer content from the new payment code
- return the new SePay response contract

### 3. Update Payment Finalization

- keep `markPaid()` as the central state transition
- update paid order metadata to use `paymentMethod = "sepay"` for SePay-confirmed transfers
- update wallet deposit description text from PayOS-specific wording to SePay/bank-transfer wording

### 4. Replace Webhook Controller

- remove PayOS signature verification
- add SePay webhook authentication
- normalize webhook fields into:
  - `paymentCode`
  - `providerTransactionId`
  - `amount`
  - `rawPayload`
- only call `markPaid()` after all validation passes

## Frontend Impact

The current web flow expects payment creation to return PayOS-style fields. It must be updated to display bank transfer instructions.

Required frontend behavior:

- render QR for the returned payload
- show bank name, account number, account holder, amount, and transfer content
- allow the user to copy transfer content and account number easily
- stop expecting `checkoutUrl`
- keep the rest of the order status polling and payment-status experience intact unless it directly depends on hosted checkout behavior

The same display pattern should be reused for wallet top-up.

## Error Handling

### 1. Payment Creation Errors

- missing SePay configuration -> fail clearly
- invalid order state -> existing order validation remains unchanged
- invalid deposit amount -> existing deposit validation remains unchanged

### 2. Webhook Errors

- invalid secret/token -> no state mutation
- malformed payload -> no state mutation
- cannot extract `paymentCode` -> no state mutation
- no matching pending payment -> log warning, no state mutation
- amount mismatch -> log warning, no state mutation

### 3. Duplicate Events

Duplicate webhook deliveries are expected and must remain safe:

- `markPaid()` already handles duplicate paid events
- the webhook endpoint should return a success-shaped response for already-paid duplicate notifications

## Testing Strategy

Implementation must follow service-level TDD.

### 1. Payment Creation Tests

- order payment creation returns SePay fields
- deposit creation returns SePay fields
- each order payment attempt creates a new payment code
- each deposit attempt creates a new payment code
- created payment rows use provider `sepay`

### 2. Webhook Tests

- valid SePay webhook marks an order payment as paid
- valid SePay webhook credits a wallet deposit
- duplicate webhook is idempotent
- invalid webhook secret is rejected
- missing payment code is rejected
- amount mismatch does not mark payment as paid

### 3. Regression Tests

- existing `markPaid()` behavior for order state transition remains intact
- existing email enqueue side effects remain intact
- existing wallet credit side effects remain intact

## Rollout Notes

- historical PayOS data remains in place and readable
- all new payments are created with SePay only
- environment setup must be updated before production rollout
- any deployment checklist referencing PayOS keys or webhook URLs must be updated to SePay equivalents

## Open Assumptions Locked By This Design

These assumptions are now explicit and should drive implementation unless the user changes scope later:

- PayOS is removed completely
- SePay uses one fixed receiving bank account
- transfer content is the primary reconciliation key
- every pay action creates a new payment code
- amount mismatch blocks automatic confirmation
- frontend should present bank-transfer instructions rather than redirect checkout
