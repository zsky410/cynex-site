# Admin Ant Design Refactor Design

Date: 2026-06-23
Project: `@cynex/admin`
Status: Draft for review

## Objective

Refactor the admin frontend so it no longer uses `react-admin`, replaces the UI with an Ant Design application shell, and translates the admin interface to Vietnamese where appropriate.

The refactor must preserve:

- all existing backend endpoints and methods
- all existing route targets and resource identities
- all existing query parameter shapes and payload mappings used by the current UI
- the current local auth token flow and access expectations

This is a UI and client orchestration refactor, not a backend contract change.

## Current State

The admin app currently relies on `react-admin` primitives:

- `App.tsx` wires resources through `<Admin>` and `<Resource>`
- `dataProvider.ts` owns the contract with the NestJS admin API
- `authProvider.ts` owns login, logout, auth checks, and identity lookup
- screen modules under `apps/admin/src/resources/*.tsx` mix UI and resource behaviors using `react-admin`

The current contract that must stay intact is:

- list: `GET /admin/<resource>?page&perPage&sort&order&filter(JSON)` -> `{ data, total }`
- many: `GET /admin/<resource>?ids(JSON)` -> `{ data }`
- one: `GET /admin/<resource>/:id` -> `{ data }`
- create: `POST /admin/<resource>` -> `{ data }`
- update: `PATCH /admin/<resource>/:id` -> `{ data }`
- delete: `DELETE /admin/<resource>/:id` -> `{ data }`

The current admin resources are:

- `products`
- `product-variants`
- `orders`
- `email-logs`
- `audit-logs`
- `warranty-cases`
- `users`
- `supply-sources`
- `source-orders`
- `inventory-accounts`
- `inventory-keys`

## Goals

1. Remove runtime dependency on `react-admin` from the admin app.
2. Build a cohesive Ant Design admin experience with a modern SaaS-style shell.
3. Preserve existing backend behavior and frontend data mapping.
4. Translate admin UI labels, actions, feedback states, and form copy into Vietnamese.
5. Keep the existing admin sitemap and route coverage, while allowing cleaner grouping in the sidebar.

## Non-Goals

- changing backend endpoints, request bodies, or response shapes
- redesigning business workflows or changing permissions
- changing resource names used by the client-to-server contract
- introducing a new global state library unless the existing app structure proves it necessary
- reworking unrelated web or API packages

## Approved Direction

The implementation will use a new Ant Design SPA rather than progressively skinning `react-admin`.

Why this direction:

- it fully satisfies the requirement to stop using `react-admin`
- it allows a coherent design system instead of fighting the old abstractions
- it preserves backend stability by keeping the data contract layer explicit and separate from presentation

## Target Architecture

### 1. Application Shell

The admin app will be rebuilt around an Ant Design shell:

- `Layout` with `Sider`, `Header`, `Content`
- grouped sidebar navigation
- page title and breadcrumb region
- shared top-level notifications, loading, and empty states
- responsive collapse behavior for the sidebar

The visual direction is:

- bright, modern, restrained
- clearer spacing and hierarchy than the current default React Admin look
- card-driven dashboard and detail views
- tables with explicit filter controls and actions

### 2. Routing

The app will use explicit client routes instead of `react-admin` resource registration.

Routes must preserve the current functional coverage. The exact path strings may be normalized for the new router, but each existing resource must keep a stable dedicated screen for:

- list
- show/detail where currently supported
- create where currently supported
- edit where currently supported

The sidebar may group items visually, but it must not remove access to any existing resource screen.

### 3. Data Access Layer

`dataProvider.ts` will be replaced by framework-agnostic API helpers, for example:

- `adminFetch`
- `listResource`
- `getResource`
- `getManyResources`
- `createResource`
- `updateResource`
- `deleteResource`

These helpers must preserve the current HTTP behavior exactly:

- same paths
- same query string keys
- same JSON encoding for `filter` and `ids`
- same auth header logic
- same error propagation semantics needed by the UI

This layer becomes the compatibility boundary that protects backend logic from UI refactoring.

### 4. Authentication

`authProvider.ts` will be replaced by dedicated auth utilities and route guards.

Behavior to preserve:

- login against `POST /admin/auth/login`
- persist `accessToken` in localStorage
- persist admin identity in localStorage
- clear auth state on logout
- treat `401` and `403` as session expiry paths

New UI expectations:

- a Vietnamese login screen
- guarded private routes
- a clear session-expired flow

### 5. Screen Patterns

Each screen type will map to Ant Design primitives:

- lists: `Table` + pagination + filter bar + action column
- detail pages: `Card`, `Descriptions`, timelines, action sections
- create and edit pages: `Form`, `Input`, `InputNumber`, `Select`, `Switch`, `DatePicker`, `Button`
- dense contextual actions: `Dropdown`, `Popconfirm`, `Modal`, `Drawer`

Resource-specific behaviors currently hidden inside `react-admin` resource files must be made explicit in page-level components and shared helpers.

### 6. Localization

The admin interface will move to Vietnamese-first copy.

Translate:

- navigation labels
- page titles
- form labels
- validation copy
- button labels
- success and error notifications
- table empty states
- filter labels
- authentication copy

Keep English where it is materially clearer or domain-correct, including examples like:

- `ID`
- `SKU`
- `API`
- raw system status values where translation could distort meaning

## Resource Mapping

The following resources must be retained one-for-one in the new UI:

### Dashboard

- overview cards
- quick operational visibility
- no backend contract changes

### Products

- list
- create
- edit

### Product Variants

- list
- create
- edit

### Orders

- list
- show/detail

### Email Logs

- list
- show/detail

### Audit Logs

- list
- show/detail

### Warranty Cases

- list
- show/detail
- edit

### Users

- list
- show/detail
- edit

### Supply Sources

- list
- create
- edit

### Source Orders

- list
- create
- edit

### Inventory Accounts

- list
- create
- edit

### Inventory Keys

- list
- create
- edit

## Proposed File Structure

This structure may be adjusted slightly during implementation, but the separation of concerns must remain:

```text
apps/admin/src/
  app/
    router.tsx
    providers.tsx
  components/
    layout/
    tables/
    filters/
    forms/
    feedback/
  features/
    auth/
    dashboard/
    products/
    variants/
    orders/
    logs/
    warranty/
    users/
    sources/
    inventory/
  lib/
    admin-api.ts
    auth.ts
    resource-query.ts
    notifications.ts
    formatters.ts
    constants.ts
  pages/
    login/
  styles/
    theme.ts
    global.css
```

## Implementation Strategy

The refactor should happen in controlled layers rather than trying to rewrite every screen blindly.

### Phase 1: Foundations

- add Ant Design and required supporting packages
- remove `react-admin` and MUI dependencies from the admin app
- build the app shell, router, auth guard, and API layer
- create shared table and form building blocks

### Phase 2: Core Screens

- migrate login
- migrate dashboard
- migrate products and variants
- migrate orders

These resources validate the main list/detail/form patterns.

### Phase 3: Remaining Resources

- migrate users
- migrate sources and source orders
- migrate inventory accounts and inventory keys
- migrate warranty cases
- migrate audit logs and email logs

### Phase 4: Polish and Translation Sweep

- normalize Vietnamese copy
- align spacing, actions, and notification behavior
- remove any dead `react-admin`-specific code

## Technical Constraints

- no backend API changes are allowed as part of this work
- no route or resource access regression is acceptable
- the list query contract must remain unchanged
- auth storage keys must remain compatible unless a migration path is explicitly implemented
- the app must continue to build under the existing monorepo tooling

## Risks and Mitigations

### Risk: Hidden Behavior in Existing Resource Files

Some behavior is currently embedded inside `react-admin` screens and may be easy to miss.

Mitigation:

- inspect each resource module before rewriting
- extract field mapping and action logic into explicit helpers
- verify create, edit, and show coverage resource by resource

### Risk: Contract Drift During Query Refactor

Replacing `react-admin` can accidentally change pagination, sort, or filter encoding.

Mitigation:

- preserve the current query keys exactly
- reuse one shared list query builder
- verify generated requests against the previous implementation

### Risk: Translation Changes Hide Business Meaning

Over-translating domain terms can reduce clarity.

Mitigation:

- default to Vietnamese copy
- keep English for identifiers and technical terms where needed
- normalize wording in one shared constants layer

## Verification Plan

The implementation will be considered acceptable only if the following are verified:

- `react-admin` is removed from the admin runtime code
- the admin app builds and typechecks
- every current resource still has an accessible screen in the new UI
- login, logout, auth guard, and expiry handling still work
- list requests still send `page`, `perPage`, `sort`, `order`, and `filter` exactly as before
- multi-fetch still sends `ids` exactly as before
- create, update, and delete flows still hit the same backend endpoints
- admin copy is Vietnamese-first across the app, with technical exceptions kept intentionally

## Open Implementation Decisions Already Resolved

These points are considered settled for the implementation:

- keep the existing sitemap and resource coverage
- allow sidebar grouping without changing destination coverage
- use a full Ant Design SPA instead of partial `react-admin` skinning
- preserve the backend contract exactly rather than redesigning API integration

## Success Criteria

This work is successful when:

- `apps/admin` no longer depends on `react-admin`
- the UI is visibly modernized through a coherent Ant Design shell
- all existing admin resources remain usable
- backend data flows remain intact
- the admin interface reads as Vietnamese for operators
