# Storefront Session Cart And Card Simplification Design

Date: 2026-06-29
Status: Proposed
Scope: Customer-facing storefront updates in `apps/web` for product cards, navbar cart UX, session-based cart state, cart page flow, and checkout footer consistency.

## 1. Goal

Refine the current storefront so browsing and pre-checkout behavior feel complete instead of provisional.

Success criteria:

- product cards in listing screens only show product name, starting price, and `Xem chi tiết`
- clicking or hovering anywhere on a product card still leads to `/products/[slug]`
- the navbar shows a real cart entry point with a visible item count
- adding to cart updates a shared cart state with immediate visual feedback
- the cart survives page reloads in the same browser session
- the cart resets when the browser session ends and does not sync across devices
- checkout pages render the same footer language as the rest of the storefront
- `Mua ngay` continues to create an order immediately and bypass the cart

## 2. Constraints

- keep the current Next.js route structure in `apps/web/src/app`
- do not introduce backend cart tables, cart APIs, or cross-device cart persistence
- do not change the current direct-buy order creation flow behind `Mua ngay`
- preserve existing product variant validation and customer input behavior in `BuyPanel`
- keep the existing storefront visual language rather than introducing a new redesign direction
- avoid coupling cart persistence to `localStorage`, because the requested lifecycle matches browser-session persistence rather than long-lived storage

## 3. Chosen Direction

Use a frontend-only session cart backed by `sessionStorage` and a shared client store/provider in `apps/web`.

Why this direction:

- it matches the requested lifecycle exactly: survives reload, resets when the browser session ends, and does not follow the user to another device
- it is smaller and less risky than adding a backend cart system
- it can still provide a complete user-facing cart experience: navbar badge, cart page, add/remove flows, and payment handoff

Rejected directions:

- `localStorage` cart: survives browser restarts longer than requested and reads as a pseudo-persistent cart rather than a session cart
- API-backed cart: useful for multi-device persistence, but it expands scope into backend schema, auth merge logic, and longer-lived product-state reconciliation that the user did not ask for

## 4. Product Card Changes

Affected surfaces include the homepage featured grid and the products catalog where `ProductPreviewCard` is used.

### 4.1 Content rules

Each product card will render only:

- product image or fallback tile visual
- product name
- starting price and cadence
- `Xem chi tiết`

The following content will be removed from listing cards:

- category chip
- short description text
- extra metadata that competes with the desired simplified scan pattern

### 4.2 Interaction rules

- the entire card remains one link to `/products/[slug]`
- there will be no dead zones inside the card
- hover treatment should reinforce clickability but must not create a separate CTA hotspot
- keyboard focus should still outline the full card link cleanly

### 4.3 Layout implications

- card body spacing should be tightened after removing the description block
- price and CTA row should remain anchored near the bottom so the grid still scans consistently
- the visual tile can remain for recognition and to avoid an overly empty card

## 5. Cart Architecture

### 5.1 State model

Add a shared cart client state in `apps/web`, likely via a small provider and hook pair such as:

- `CartProvider`
- `useCart`

The cart item shape should include enough data to render UI without refetching:

- `productSlug`
- `productName`
- `productVariantId`
- `variantName`
- `price`
- optional lightweight visual metadata if already available from the current page

### 5.2 Persistence model

- source of persistence: `sessionStorage`
- storage key: one explicit namespaced key for the web storefront
- hydrate on client mount
- write through on every cart mutation
- gracefully recover from malformed stored payloads by resetting to an empty cart

This gives:

- reload persistence inside the same tab/browser session
- reset when the session ends
- no server dependency

### 5.3 Mutation rules

- adding a variant that is not already in cart inserts a new line item
- adding the same variant again updates the existing line instead of duplicating rows
- removing an item deletes that line from the cart
- clearing the cart removes all items and clears session storage

The current design does not add quantity controls. The repo currently treats digital packages as variant-based selections rather than bulk physical-cart quantities, so one line per variant is the simplest correct behavior for this pass.

## 6. Add-To-Cart UX

### 6.1 Buy panel behavior

`BuyPanel` will split the two actions more clearly:

- `Mua ngay`: unchanged direct order creation flow
- `Thêm vào giỏ hàng`: writes to shared cart state and triggers immediate feedback

The current `"giỏ tạm"` message will be removed.

### 6.2 Feedback and animation

Add a lightweight animation on successful add:

- cart icon badge increments immediately
- button can briefly swap state, pulse, or show a short success label
- avoid long toast stacks or heavy modal interruption

The feedback should confirm success without blocking browsing.

### 6.3 Validation behavior

If the selected variant requires customer input, add-to-cart should still respect that requirement.

Reason:

- otherwise the cart can hold incomplete purchase lines that cannot actually be converted into orders later

So both `Mua ngay` and `Thêm vào giỏ hàng` should validate required customer input for the active variant before proceeding.

## 7. Navbar And Cart Entry Point

### 7.1 Navbar updates

The storefront header/nav will gain:

- cart icon
- visible count badge when cart has items
- link target to the cart page

The cart entry should be available on customer-facing storefront routes, including product discovery and detail pages.

### 7.2 Header integration

Because `AppShell` currently treats many storefront routes as standalone, this change may require either:

- expanding the shared storefront shell pattern, or
- introducing a storefront-specific header/footer wrapper used by the relevant routes

Chosen preference:

- align storefront routes behind a reusable customer shell instead of scattering cart/header logic per page

This keeps nav badge state, footer consistency, and future storefront polish in one place.

## 8. Cart Page

Add a dedicated cart route in `apps/web/src/app`, such as `/cart`.

### 8.1 Cart page content

The page should include:

- page title and short explanation
- list of current cart items
- product name and selected variant name
- per-item price
- remove action
- cart summary section
- CTA to continue browsing
- CTA to proceed to payment flow

### 8.2 Empty state

If the cart is empty:

- show a clear empty-state panel
- provide a link back to `/products`

### 8.3 Mobile behavior

- summary and CTA stack beneath the list
- remove actions stay easy to hit
- total and primary action remain visible without excessive scroll

## 9. Checkout Handoff From Cart

The current backend creates orders directly via `POST /orders` per variant selection. This design intentionally does not add a multi-line cart order model on the backend.

### 9.1 Chosen flow

When the user proceeds from the cart:

- the frontend creates orders for the current cart items one by one
- after creation succeeds, the user is routed into the existing order/checkout flow instead of a new backend cart checkout model

### 9.2 UX implications

Because the current backend is order-based, not cart-based:

- the frontend must handle partial failure messaging if one cart item cannot be converted
- successful order creations should not be lost if a later item fails
- the user should land in a clear next step, likely the orders view or the first newly created checkout screen depending on what is less disruptive in the existing route model

Preferred behavior for this pass:

- create cart items sequentially
- if exactly one order is created, route straight to that order's checkout
- if multiple orders are created, route to `/orders` with a success message telling the user to complete payment for the newly created orders

This avoids inventing a fake combined checkout on top of a backend that does not support it.

### 9.3 Post-conversion cleanup

- remove successfully converted items from the cart
- preserve items that failed to convert so the user can retry or remove them

## 10. Checkout Footer Consistency

Checkout pages under `apps/web/src/app/checkout` currently need footer support.

Add a shared storefront footer so:

- checkout pages do not feel visually cut off
- the storefront keeps one consistent lower-page identity
- the same footer can be reused by `/products`, detail pages, and the new cart page where appropriate

The footer should be lightweight and informational, not marketing-heavy.

## 11. Error Handling

- if session cart hydration fails, reset to empty and continue without blocking render
- if add-to-cart fails because browser storage is unavailable, show a user-facing inline error
- if cart checkout conversion partially fails, clearly separate successful and failed items
- if the user is not logged in when starting cart checkout, redirect to login and preserve the intended next step if practical within the existing auth redirect utilities

## 12. Testing And Verification

Code-level verification should cover at least:

- product card content simplification and full-card link behavior
- cart store hydration and persistence via `sessionStorage`
- add/update/remove cart mutations
- navbar badge updates
- cart empty and populated states
- direct-buy flow remaining unchanged
- checkout from cart handling single-item and multi-item cases

Manual verification should cover:

- add item, reload page, cart still present
- close browser session or open a fresh session, cart resets
- add same variant twice, cart does not duplicate rows
- add different variants, badge count updates correctly
- `Mua ngay` still jumps directly into the current order checkout flow
- checkout screens render the footer without layout regressions

## 13. Files Likely To Change

Expected primary touch points:

- `apps/web/src/components/storefront/ProductPreviewCard.tsx`
- `apps/web/src/components/BuyPanel.tsx`
- `apps/web/src/components/AppShell.tsx`
- storefront route files under `apps/web/src/app`
- new cart state utilities under `apps/web/src/components` or `apps/web/src/lib`
- new cart route under `apps/web/src/app/cart`
- shared footer/header components if extracted

## 14. Out Of Scope

- backend cart tables or APIs
- multi-device cart sync
- persistent cross-browser cart recovery
- quantity-based cart math for the same variant
- redesigning the payment backend into a combined multi-line checkout model
