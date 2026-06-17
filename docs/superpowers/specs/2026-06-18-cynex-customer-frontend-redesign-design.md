# Cynex Customer Frontend Redesign

Date: 2026-06-18
Status: Proposed
Scope: Customer-facing web UI redesign for discovery, purchase, order tracking, warranty, wallet, and auth flows.

## 1. Goal

Redesign the customer-facing frontend so the site feels like a premium digital service platform instead of a generic account shop. The new UI must be usable immediately with current API responses and placeholder visuals, while preserving the existing business flow and preparing the codebase for real product imagery and richer catalog data later.

Success criteria:

- The shopping flow looks complete and intentional on desktop and mobile.
- The visual language is dark-first, premium SaaS, and curated rather than marketplace-dense.
- Product discovery, product selection, checkout, order tracking, warranty, wallet, and auth pages share one consistent design system.
- The UI clearly communicates the manual fulfillment model and never implies instant automated delivery where the backend does not support it.
- Existing fetch flows and route structure continue to work with minimal backend assumptions.

## 2. Constraints

- Keep the current Next.js app structure and existing route paths.
- Continue using current API fields and current fetch helpers.
- Use placeholder visuals where the API does not yet provide imagery.
- Do not redesign the backend workflow in this task.
- Do not add unnecessary marketing sections, fake testimonials, or dense marketplace patterns.
- Mobile-first behavior is required, especially around product purchase and checkout CTAs.

## 3. Chosen Direction

The approved direction is:

- Visual tone: dark-first premium SaaS
- Information density: curated commerce
- Layout feel: spacious, selective, high-signal

Rejected directions:

- Editorial premium: too story-heavy and delays the purchase decision.
- Dense dashboard commerce: too shop-like, too busy, and weakens the premium brand signal.

## 4. Global UI Architecture

The customer frontend will be built around one shared shell and three layout families.

Shared shell:

- Dark layered background with subtle gradients and restrained highlights.
- Compact header with logo, primary nav, and prominent search/action access.
- Unified panel language: large radius cards, thin borders, soft elevated surfaces, no heavy glow.
- Consistent section spacing and status badge styling across all pages.

Layout families:

1. Discovery layout
   Used by `/` and `/products`.
   Purpose: help users understand what Cynex sells and move quickly into product browsing.

2. Decision layout
   Used by `/products/[slug]` and `/checkout/[orderCode]`.
   Purpose: help users choose the right package and complete payment with minimal friction.

3. Account layout
   Used by `/orders`, `/orders/[orderCode]`, `/warranty`, `/wallet`, `/login`, `/register`, `/forgot-password`, and `/reset-password`.
   Purpose: keep state-heavy screens clear, trustworthy, and easy to scan.

## 5. Design System

### 5.1 Visual tokens

The redesign will align with the guideline palette and interaction model:

- Background: near-black navy surfaces
- Elevated cards: dark blue-gray surfaces
- Borders: low-contrast cool gray
- Primary accent: cyan
- Secondary accent: violet, used sparingly
- Success, warning, and danger colors reserved for state communication

Typography:

- Strong headline weight
- Clean, readable body text
- Monospace treatment for order codes, payment refs, and delivered secrets when shown

Motion:

- Minimal but intentional
- Use staggered entrance and hover refinement where it adds clarity
- Avoid decorative animation that slows scanning or feels flashy

### 5.2 Core reusable components

The redesign should establish a reusable set of frontend primitives:

- `SiteHeader`
- `PageHero`
- `SectionHeader`
- `GlassPanel` or equivalent elevated card primitive
- `StatusPill`
- `SearchBar`
- `FilterChip`
- `ProductVisual`
- `ProductCard`
- `VariantCard`
- `BuyBox`
- `CheckoutSummary`
- `EmptyState`
- `FormField`
- `AuthPanel`

These components should be designed so the same styling language is reused instead of each page inventing its own card and spacing pattern.

## 6. Route-by-Route Design

### 6.1 `/`

Purpose:

- Introduce the service clearly
- Move the user into browsing fast

Structure:

- Compact premium hero with headline, short subtitle, and two CTAs
- Large search field near the top
- Category chips
- Featured products grid
- “How it works” four-step section
- Short trust/status section focused on fulfillment clarity and warranty

Rules:

- No long storytelling blocks
- No fake social proof
- No oversized carousel

### 6.2 `/products`

Purpose:

- Fast browsing and lightweight comparison

Structure:

- Small page hero or header row
- Search and sort controls
- Simple filter controls using chips, popovers, or compact grouped controls
- Product grid with curated spacing

Each product card should include:

- Placeholder image or icon treatment
- Product name
- One-line description
- Starting price
- Variant count
- Warranty badge or compact assurance badge
- View package CTA

Rules:

- No long left sidebar
- No excessive badges
- No dense metric-heavy commerce UI

### 6.3 `/products/[slug]`

Purpose:

- Help the user choose the correct variant and buy immediately

Desktop layout:

- Left: product visual
- Center: product information and variant selection
- Right: sticky buy box

Mobile layout:

- Single-column stack
- Sticky bottom purchase bar showing selected price and CTA

Content:

- Product title
- Short description
- Short benefit list
- Variant cards with price, package type, estimated processing, and warranty
- Customer input fields when required by the selected variant
- Sticky buy box summarizing selected package and total

Rules:

- Keep the CTA above the fold where possible
- Do not bury the purchase action behind tabs
- Do not over-expand the description block

### 6.4 `/checkout/[orderCode]`

Purpose:

- Confirm the order and let the user pay

Layout:

- Order summary panel
- Payment method panel
- Supporting state/copy panel if needed

Required copy:

- After successful payment, the order moves to a waiting-for-admin-processing state.

Payment CTAs:

- `payOS / VietQR`
- `Ví Cynex`

Rules:

- No upsell
- No multi-step checkout wizard
- No extra policy text beyond what is needed to set expectations

### 6.5 `/orders`

Purpose:

- Let users scan and reopen their orders fast

Layout:

- Header with short explanation
- Card list of orders
- Clear amount, date, fulfillment state, and payment state

Rules:

- Use stacked cards, not a dense data table
- Keep each order card scannable in one glance

### 6.6 `/orders/[orderCode]`

Purpose:

- Show the order state clearly
- Provide access to payment or delivered info

Layout:

- Summary/status panel at top
- Item list
- Delivered information panel when available
- Warranty CTA for delivered items with warranty coverage

Behavior:

- If unpaid, surface a prominent payment CTA
- If delivered, group delivered information in a dedicated panel

Sensitive information:

- Keep it visually isolated from general order metadata
- Provide strong copy affordance
- Do not show delivery-specific information before the relevant state is reached

### 6.7 `/warranty`

Purpose:

- Make support conversations and case state easy to follow

Desktop layout:

- Left rail: case list
- Main panel: conversation, status, admin note, reply composer

Mobile layout:

- Case list first
- Selected case content below

Behavior:

- Open cases remain reply-capable
- Closed or resolved cases become read-only
- Attachments remain part of the reply composer block

### 6.8 `/wallet`

Purpose:

- Show balance clearly and make deposits straightforward

Structure:

- Balance hero card
- Deposit form panel
- Transaction list as a refined ledger

Rules:

- Credits and debits must be visually distinct
- Avoid spreadsheet-like density

### 6.9 Auth pages

Routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Purpose:

- Give all auth flows one shared premium surface

Structure:

- Shared `AuthPanel`
- Minimal helper text
- Strong input affordances
- Consistent error rendering

Rules:

- Keep the layout compact
- Avoid different page structures for each auth route

## 7. Business-State Language

The UI must reflect the actual operational model.

Required messaging patterns:

- `Đã thanh toán - chờ xử lý`
- `Admin đang xử lý đơn hàng`
- `Thông tin sử dụng sẽ được gửi sau khi hoàn tất`

Forbidden implication:

- Any wording that implies instant automated delivery when manual processing still exists

Status badges must be standardized across order, checkout, and warranty flows so users do not interpret the same state differently in different places.

## 8. Data and Placeholder Strategy

Because the current API does not yet provide full visual merchandising data, the redesign will use placeholder product visuals and structured visual shells.

Requirements:

- Placeholder visuals must feel native to the design, not like broken-image stand-ins.
- Visual placeholders should be componentized so they can later accept real image URLs or product artwork without changing page structure.
- Missing optional content such as long descriptions must degrade cleanly without collapsing the layout.

## 9. Loading, Empty, and Error States

Every major page should define explicit states for:

- Loading
- Empty
- Error
- Ready data

Rules:

- Prefer skeletons or structured placeholders over raw spinners
- Empty states should be short and actionable
- Error states should be readable, calm, and localized to the relevant panel where possible

Examples:

- Empty product list: guide the user back to search or the homepage
- Empty orders: guide the user to start browsing
- Empty warranty list: explain where support cases originate

## 10. Mobile Behavior

Critical mobile behavior:

- Product cards render in one column
- Filters remain compact
- Buy CTA is sticky on product detail
- Checkout CTAs remain easy to reach
- Order and warranty cards prioritize status before supporting detail

The mobile experience should preserve the premium feel without hiding the path to purchase or support.

## 11. Implementation Boundaries

This redesign includes:

- Shared shell refresh
- Global visual system and tokens
- Customer-facing page layout redesign
- Placeholder media treatment
- Reusable UI components needed to support the redesign

This redesign excludes:

- Backend schema changes
- New commerce logic
- New payment flows
- New account-delivery behavior
- Marketing CMS features

## 12. Testing Strategy

Implementation should verify:

- Shared components render expected states
- Product detail and buy flow still submit the correct variant and customer input
- Checkout surfaces both payment actions correctly
- Order detail renders the correct state-specific sections
- Wallet and warranty flows preserve their current behavior while receiving the new UI layer

At minimum:

- Run targeted tests for newly extracted reusable components where practical
- Run project verification commands for the web app, such as lint and build, using whatever scripts are already available in the repo

## 13. Recommended Implementation Order

1. Establish global tokens, shell, and shared primitives
2. Redesign discovery pages
3. Redesign decision pages
4. Redesign account/support pages
5. Add loading/empty/error polish
6. Verify responsive behavior and app integrity

## 14. Risks

- The current codebase is page-local and sparse, so introducing shared components must not overcomplicate simple flows.
- The design can drift into “too empty” if spacing and hierarchy are not tuned carefully.
- Some existing client components may need modest restructuring to support sticky layouts and consistent empty/error handling.

## 15. Final Decision Summary

Build a dark-first, premium SaaS, curated-commerce redesign for the full customer-facing frontend. Keep the current route and data model, use placeholder visuals where needed, surface manual fulfillment expectations clearly, and standardize all customer pages around one shared design system and three layout families.
