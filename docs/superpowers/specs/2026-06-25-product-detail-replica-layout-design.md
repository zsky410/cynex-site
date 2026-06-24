# Product Detail Replica Layout Design

## Scope

Refine the product detail page at `apps/web/src/app/products/[slug]/page.tsx` and the purchase selector at `apps/web/src/components/BuyPanel.tsx`.

This pass changes layout and presentation only. It does not introduce new backend fields, new API endpoints, or new ordering behavior.

## Goals

- match the overall composition of the provided reference more closely
- keep the page grounded in real schema fields instead of decorative placeholder metadata
- place the product preview on the left and all commercial actions on the right
- simplify the right column so it reads quickly on first glance

## Approved Direction

Use a two-column product detail layout:

- left column: large product preview image
- right column: product label, product name, product code from `slug`, active variant pricing, variant selector, optional customer-input form, and action buttons

The design should feel close to the reference image, but only render data that exists in the current catalog schema.

## Data Mapping

Only use current fields that already exist in the page payload:

- product label: static small heading `Sản phẩm`
- product name: `product.name`
- product code: `product.slug`
- preview image: `product.image.publicUrl` when available
- current price: selected `variant.price`
- discount display: selected `variant.discountPercent`
- selectable options: `product.variants`
- conditional customer fields: `variant.requiresCustomerInput` and `variant.customerInputSchema`

Do not add or infer extra metadata such as category chips, ratings, stock badges, hot-sale badges, or fake reference labels.

## Layout

### Left Column

- large rounded preview container
- render the uploaded product image when present
- keep the existing generated visual fallback only when there is no uploaded image
- no decorative badges over the image

### Right Column

- small eyebrow label `Sản phẩm`
- main product title
- one metadata line: `Mã sản phẩm: <slug>`
- active price block directly under the title area
- optional original price and discount badge only when `discountPercent > 0`
- variant options section under pricing
- customer-input form under options when required
- primary and secondary actions at the bottom

## Variant Selector

Replace the `Plan Rail` card list with a compact selector that resembles the reference:

- section label: `Thời gian sử dụng`
- each variant renders as a compact rounded pill/button
- selected option uses a solid blue background with white text
- unselected options use white background, gray border, and darker text
- labels should use `variant.name`
- do not display extra per-option chips or secondary metadata inside the pills

The selector must wrap cleanly on smaller widths.

## Pricing

- the visible price always comes from the selected variant
- show the current price in a prominent weight and size
- show the crossed-out original price only when `discountPercent > 0`
- show a small discount badge next to the original price when discount exists
- if there is no discount, render only the current price

## Customer Input

- keep the existing validation and order payload behavior
- only show the form when the selected variant requires customer input
- use a simple, light block under the variant selector
- keep the current field types, placeholders, and required markers

## Actions

- keep two actions side by side on desktop and stacked on narrow widths if needed
- primary button: `Mua ngay`
- secondary button: `Thêm vào giỏ`
- preserve current click behavior and loading state

## Non-Goals

- no schema change
- no admin change
- no API response change
- no gallery system or multi-image viewer
- no fake storefront metadata copied from the reference

## Verification

- `pnpm --dir apps/web typecheck`
- visually confirm the layout reads as left-image/right-purchase-panel
- confirm the right column only shows real fields: name, slug, price, discount, variants, customer-input fields
- confirm variant selection still drives price and checkout payload correctly
