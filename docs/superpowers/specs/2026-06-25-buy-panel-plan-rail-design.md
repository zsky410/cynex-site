# Buy Panel Plan Rail Design

## Scope

Refine the product detail purchase section at `apps/web/src/app/products/[slug]/page.tsx` and `apps/web/src/components/BuyPanel.tsx`.

This change is limited to:

- removing decorative badges that do not come from real product data
- redesigning the variant selection block into a cleaner `Plan Rail` layout
- preserving the current purchase flow and validation behavior

This change does not alter checkout logic, order persistence, or fulfillment rules.

## Goals

- make variant selection feel more intentional and less like a default radio-card list
- remove misleading labels such as `Phần mềm`, `Hot Sale`, and `Tiết kiệm nhất`
- keep the selected state obvious without adding noisy pills or badges
- preserve readability on desktop and mobile

## Chosen Direction

Use a horizontal `Plan Rail` for each variant:

- left: compact selector and primary variant name
- middle: muted metadata row for duration, fulfillment type, and optional handling time
- right: price stack with current price and optional strikethrough original price only when `discountPercent > 0`

Selected state:

- slim colored rail on the left edge
- slightly brighter background
- tighter border and subtle shadow

Unselected state:

- plain white card
- low-contrast border
- small hover lift only

Out-of-stock state:

- same structure
- lowered opacity
- short red availability note

## Badge Removal

Remove these badges from the product detail hero and buy panel:

- category fallback badge such as `Phần mềm`
- static `Hot Sale`
- static `Tiết kiệm nhất`

Only real catalog data should remain.

## Customer Input Section

Keep the customer input block under the plan selector, but visually demote it:

- lighter border
- less visual weight than the plan selector
- same required-field behavior already implemented

## Implementation Notes

- update the product detail header in `apps/web/src/app/products/[slug]/page.tsx`
- restyle the variant selector in `apps/web/src/components/BuyPanel.tsx`
- keep `discountPercent` as the only source for strikethrough price rendering
- do not introduce new backend fields or API changes for this UI pass

## Verification

- `pnpm --dir apps/web typecheck`
- visually confirm the plan rails show correctly for selected and unselected items
- confirm no badge text remains in the product detail hero or plan selector
