# Cynex Customer Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete dark-first, curated-commerce UI for all customer-facing Cynex web routes using the current API and placeholder product visuals.

**Architecture:** Introduce a small shared design system inside `apps/web/src/components`, refresh global tokens and shell styling in the app layout, then migrate customer-facing pages onto reusable panels, status chips, product cards, and form surfaces. Keep existing route/data behavior intact while improving hierarchy, responsiveness, and state presentation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, lucide-react

---

## File Structure

- Create: `apps/web/src/components/ui/`
  - Shared customer-facing UI primitives for panels, pills, visuals, headers, inputs, and empty states.
- Create: `apps/web/src/components/catalog/`
  - Product-specific building blocks for cards, highlights, variant selection, and buy box composition.
- Modify: `apps/web/src/app/globals.css`
  - Global tokens, background layers, typography, utility classes, and motion polish.
- Modify: `apps/web/src/app/layout.tsx`
  - Site shell, header, nav, and shared page container.
- Modify: `apps/web/src/app/page.tsx`
  - New discovery homepage.
- Modify: `apps/web/src/app/products/page.tsx`
  - Curated listing page.
- Modify: `apps/web/src/app/products/[slug]/page.tsx`
  - Three-zone product detail layout.
- Modify: `apps/web/src/components/BuyPanel.tsx`
  - Rich buy box with variant selector, customer-input form, and mobile sticky CTA.
- Modify: `apps/web/src/app/checkout/[orderCode]/page.tsx`
  - Premium checkout summary and payment method UI.
- Modify: `apps/web/src/app/orders/page.tsx`
  - Refined stacked order list.
- Modify: `apps/web/src/app/orders/[orderCode]/page.tsx`
  - State-aware order detail screen.
- Modify: `apps/web/src/app/warranty/page.tsx`
  - Split support/warranty experience.
- Modify: `apps/web/src/app/orders/[orderCode]/warranty/page.tsx`
  - Form surface aligned with the new support UI.
- Modify: `apps/web/src/app/wallet/page.tsx`
  - Wallet dashboard treatment.
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/register/page.tsx`
- Modify: `apps/web/src/app/forgot-password/page.tsx`
- Modify: `apps/web/src/app/reset-password/page.tsx`
  - Shared auth panel styling across auth routes.

## Task 1: Establish Global Shell And Design Primitives

**Files:**
- Create: `apps/web/src/components/ui/shell.tsx`
- Create: `apps/web/src/components/ui/panel.tsx`
- Create: `apps/web/src/components/ui/status-pill.tsx`
- Create: `apps/web/src/components/ui/section-header.tsx`
- Create: `apps/web/src/components/ui/empty-state.tsx`
- Create: `apps/web/src/components/ui/form-field.tsx`
- Create: `apps/web/src/components/ui/product-visual.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] Add shared design tokens, atmospheric background, button/input/panel utility classes, and site shell primitives.
- [ ] Update the root layout to use the new shell, customer nav, and consistent page container.
- [ ] Verify the web app still typechecks after shell extraction.

## Task 2: Rebuild Discovery Surfaces

**Files:**
- Create: `apps/web/src/components/catalog/product-card.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/products/page.tsx`

- [ ] Build a featured product card component using placeholder visuals, pricing, badges, and CTA treatment.
- [ ] Redesign the homepage with compact hero, search, category chips, featured products, and four-step purchase explanation.
- [ ] Redesign the product listing page with search/sort/filter surface and curated grid layout.
- [ ] Verify homepage and listing pages compile and render using current product data shape.

## Task 3: Rebuild Product Decision Flow

**Files:**
- Create: `apps/web/src/components/catalog/variant-card.tsx`
- Modify: `apps/web/src/components/BuyPanel.tsx`
- Modify: `apps/web/src/app/products/[slug]/page.tsx`
- Modify: `apps/web/src/app/checkout/[orderCode]/page.tsx`

- [ ] Extract richer variant presentation and buy box UI while preserving the current order creation behavior.
- [ ] Redesign product detail into visual, content, and sticky buy zones with mobile sticky purchase affordance.
- [ ] Redesign checkout with summary, payment methods, and manual-fulfillment expectation copy.
- [ ] Verify product purchase and checkout routes still typecheck against current API contracts.

## Task 4: Rebuild Orders, Delivery, And Support Flows

**Files:**
- Modify: `apps/web/src/app/orders/page.tsx`
- Modify: `apps/web/src/app/orders/[orderCode]/page.tsx`
- Modify: `apps/web/src/app/warranty/page.tsx`
- Modify: `apps/web/src/app/orders/[orderCode]/warranty/page.tsx`

- [ ] Redesign order list cards with better hierarchy for code, date, amount, payment, and fulfillment state.
- [ ] Redesign order detail with status summary, delivered information panel, payment CTA, and warranty entry points.
- [ ] Redesign warranty list/detail/reply layout using the shared panel system.
- [ ] Align the order-scoped warranty creation form with the new support styling.
- [ ] Verify all support/order screens still respect auth redirects and current fetch behavior.

## Task 5: Rebuild Wallet And Auth Surfaces

**Files:**
- Modify: `apps/web/src/app/wallet/page.tsx`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/register/page.tsx`
- Modify: `apps/web/src/app/forgot-password/page.tsx`
- Modify: `apps/web/src/app/reset-password/page.tsx`

- [ ] Redesign wallet balance, deposit form, and transaction ledger into one coherent account dashboard.
- [ ] Create a unified auth panel look and migrate login, register, forgot-password, and reset-password flows onto it.
- [ ] Verify the auth and wallet pages still keep their existing submission and redirect behavior.

## Task 6: Final Responsive Polish And Verification

**Files:**
- Modify: any touched web UI files as needed for final polish

- [ ] Check critical mobile behaviors for discovery, product detail, checkout, orders, warranty, wallet, and auth routes.
- [ ] Run `pnpm --filter @cynex/web typecheck`.
- [ ] Run `pnpm --filter @cynex/web build`.
- [ ] If lint remains usable in this repo, run `pnpm --filter @cynex/web lint`.
- [ ] Commit the frontend redesign changes.

## Self-Review

- Spec coverage:
  - Global shell and tokens: Task 1
  - Discovery pages: Task 2
  - Product decision and checkout: Task 3
  - Orders and warranty: Task 4
  - Wallet and auth: Task 5
  - Responsive/state/verification polish: Task 6
- Placeholder scan:
  - No `TODO` or `TBD` markers included.
- Type consistency:
  - The plan keeps route-level data flow on existing `apiFetch` and `publicFetch` contracts and centralizes new visuals into reusable UI/catalog components.
