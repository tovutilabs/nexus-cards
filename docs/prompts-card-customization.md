# prompts-card-customization.md

This file contains the full set of coding-agent prompts to implement the Nexus Card Customization System end-to-end.

Each prompt MUST begin by reading and acknowledging:

- `docs\house_rules.md`
- `docs\card-customization-specs.md`
- `docs\prd_nexus_cards.md`
- `docs\tdd_nexus_cards.md`
- `docs\design-system.md`

Any documentation produced by the agent must be saved under `docs/dev`.

---

## Prompt 1 — Backend Foundations: Models, Migrations, and Basic Wiring

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**
>
> Assume the existing project uses NestJS, Prisma, PostgreSQL, Redis, and Next.js, and that a basic `Card` model and card CRUD already exist. Do not rewrite what already works; extend it safely.

### Context

We are implementing the **Nexus Card Customization System** backend foundations:

- `CardComponent` model and tier-based component availability.
- `CardTemplate` model and card-level styling fields.
- Minimal NestJS module wiring for components and templates (no detailed business logic yet).

Follow the architecture defined in `docs\card-customization-specs.md`.

### Tasks

1. **Inspect existing schema and modules**
   - Find the current Prisma schema (`schema.prisma`) and locate the `Card` model.
   - Identify existing NestJS modules related to cards (e.g., `cards.module.ts`, `cards.service.ts`, `cards.controller.ts`).

2. **Add `CardComponent` model**
   - Implement `CardComponent` in Prisma exactly as specified:
     - Fields: `id`, `cardId`, `type`, `config`, `order`, `enabled`, `locked`, timestamps.
     - Relation to `Card`.
     - Unique constraint on `(cardId, order)`.
   - Generate relevant Prisma client changes.

3. **Add component availability matrix**
   - Create a new table `tier_component_rules` in Prisma (or through raw SQL migration) with:
     - `id`, `tier`, `component_type`, `max_allowed`, timestamps.
   - This table will be used later for tier enforcement.

4. **Extend `Card` with styling fields**
   - Add card-level styling fields as per spec:
     - `templateId`, `backgroundType`, `backgroundColor`, `backgroundImage`,
       `layout`, `fontFamily`, `fontSizeScale`, `borderRadiusPreset`, `shadowPreset`, `customCss`.
   - Ensure `templateId` is nullable and links to `CardTemplate`.

5. **Add `CardTemplate` model**
   - Implement `CardTemplate` in Prisma:
     - Fields: `id`, `name`, `slug`, `description`, `category`, `industries`, `config`, `minTier`, `usageCount`, `isArchived`, timestamps.
     - `slug` must be unique.
   - Prepare relation from `Card.templateId` to `CardTemplate`.

6. **Create basic NestJS modules**
   - Under `src/card-components`, add:
     - `card-components.module.ts`
     - `card-components.service.ts`
     - `card-components.controller.ts`
     - DTO stubs:
       - `create-card-component.dto.ts`
       - `update-card-component.dto.ts`
       - `reorder-card-components.dto.ts`
   - Under `src/templates`, add:
     - `templates.module.ts`
     - `templates.service.ts`
     - `templates.controller.ts`
     - DTO stubs for:
       - Template CRUD
       - Card styling operations.

7. **Wire modules into the main NestJS app**
   - Register `CardComponentsModule` and `TemplatesModule` in the root `AppModule` (or aggregated modules) without breaking existing behavior.

### Constraints

- Follow house rules:
  - ASCII-only code, repo-relative paths, no TODOs or partial code.
- Do not remove or alter existing card logic beyond necessary schema extensions.
- Naming must be consistent with existing conventions.

### Tests

- Ensure `npx prisma migrate dev` (or equivalent migration command) runs successfully.
- Ensure backend tests (`npm test` / `pnpm test` / `yarn test`) still pass.
- Ensure the NestJS app boots without DI errors.

### Deliverables

- Updated Prisma schema and migrations for:
  - `CardComponent`
  - `CardTemplate`
  - Card styling fields
  - `tier_component_rules`
- New NestJS modules:
  - `CardComponentsModule` scaffolding
  - `TemplatesModule` scaffolding

### Definition of Done

- Server compiles and starts without errors.
- Database schema now includes `CardComponent`, `CardTemplate`, card styling fields, and `tier_component_rules`.
- New modules are registered and ready for further implementation.

---

## Prompt 2 — Backend: Card Components API (CRUD + Reorder + Tier Rules)

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**

### Context

We now implement the full **Card Components API** as specified:

- CRUD APIs for `CardComponent`s below the Identity Header.
- Reorder operation with transactional guarantee.
- Tier-based component availability using `tier_component_rules`.
- Locked component behavior after tier downgrade.

### Tasks

1. **Implement DTOs and validation**
   - Fill in:
     - `CreateCardComponentDto`
     - `UpdateCardComponentDto`
     - `ReorderCardComponentsDto`
   - Use `class-validator` or Zod (consistent with existing code) to validate payloads:
     - `type` is valid.
     - `config` shape is reasonable (start generic JSON; refine later).
     - Reorder payload includes a contiguous sequence of component IDs and orders.

2. **Implement `CardComponentsService`**
   - Methods:
     - `findByCard(cardId, userId)`
     - `create(cardId, dto, user)`
       - Check card ownership.
       - Determine user tier.
       - Enforce `tier_component_rules` for type + max count.
       - Insert with `order = max(existingOrders) + 1`.
     - `update(cardId, componentId, dto, user)`
       - Check ownership, fetch component.
       - If `locked = true`, disallow config changes (except allowed fields per spec).
       - Apply valid updates.
     - `reorder(cardId, dto, user)`
       - Check ownership.
       - Validate contiguous sequence.
       - Use two-step transaction (offset then normalize).
     - `delete(cardId, componentId, user)`
       - Check ownership.
       - Delete and (optionally) normalize orders.

3. **Implement `CardComponentsController`**
   - REST endpoints:
     - `GET /cards/:cardId/components`
     - `POST /cards/:cardId/components`
     - `PATCH /cards/:cardId/components/:componentId`
     - `PATCH /cards/:cardId/components/reorder`
     - `DELETE /cards/:cardId/components/:componentId`
   - Use consistent error envelope with `code` and `message`.

4. **Component locking behavior**
   - Add a service utility (or extend existing downgrade logic) that:
     - On tier downgrade, finds premium components forbidden at the new tier.
     - Sets `locked = true` for them.
   - Ensure `update` respects `locked` semantics.

5. **Integration with Identity Header**
   - Ensure that:
     - No endpoint allows creating a component “above” the Identity Header.
     - The component APIs only affect the list below the header; the header is not a component and is not exposed in these APIs.

### Constraints

- Do not break existing card ownership and auth logic.
- Use error codes from the spec: `TIER_LIMIT_EXCEEDED`, `COMPONENT_TYPE_NOT_ALLOWED`, `INVALID_REORDER`, `EDIT_LOCKED`, etc.
- Respect house rules: ASCII-only, no TODOs, repo-relative paths.

### Tests

- Unit tests for `CardComponentsService`:
  - Creating components under max limit.
  - Exceeding max limit.
  - Locked component behavior.
  - Reorder transaction validity and failure on invalid payload.
- E2E / integration tests for the component routes if such a test suite exists.

### Deliverables

- Fully implemented `card-components.service.ts`, `card-components.controller.ts`, DTOs, and supporting files.
- Unit tests and/or integration tests for all main service methods.

### Definition of Done

- Card components can be created, updated, reordered, and deleted via APIs.
- Tier rules are enforced.
- Locked components are respected.
- Identity Header remains unaffected by component APIs.
- Test suite for these behaviors passes.

---

## Prompt 3 — Backend: Templates, Card Styling, and Custom CSS

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**

### Context

Implement the **Template & Styling Engine (TSE)** backend:

- Admin CRUD for templates.
- User-facing template listing and application.
- Card-level styling endpoints.
- Custom CSS (premium) with sanitization.

### Tasks

1. **Admin Template CRUD**
   - Implement in `templates.controller.ts` and `templates.service.ts`:
     - `POST /admin/templates` — create a new template.
     - `PATCH /admin/templates/:id` — update template tokens/config.
     - `PATCH /admin/templates/:id/archive` — archive template (`isArchived = true`).
     - `GET /admin/templates` — list templates (filter by category, tier, archived as needed).
   - Enforce admin role using existing auth/guard patterns.

2. **Safety: no hard delete for applied templates**
   - Implement logic such that templates with `usageCount > 0`:
     - Cannot be hard deleted.
     - Can only be archived.
   - When a template is applied/removed:
     - Increment/decrement `usageCount` appropriately.

3. **User template selection**
   - Implement:
     - `GET /templates` for end-users:
       - Filters to `!isArchived` and `minTier <= userTier`.
     - `GET /templates/:slug`:
       - Returns template details for preview.
     - `POST /cards/:cardId/apply-template/:templateId`:
       - Checks card ownership.
       - Checks tier and `!isArchived`.
       - Sets `card.templateId`.
       - Applies default styling from `CardTemplate.config` into card styling fields.

4. **Card styling overrides**
   - Implement `PATCH /cards/:cardId/styling`:
     - Allows updating fields like `backgroundType`, `backgroundColor`, `layout`, `fontFamily`, `fontSizeScale`, `borderRadiusPreset`, `shadowPreset`.
     - Enforces tier rules for advanced features (e.g., gradient, image, advanced tokens).
     - Validates input against design system tokens.

5. **Custom CSS endpoint**
   - Implement `PATCH /cards/:cardId/custom-css`:
     - Checks card ownership.
     - Checks user tier for custom CSS capability.
     - Validates size (e.g., <= 100 KB).
     - Sanitizes CSS using a strict whitelist / safe sanitizer.
     - On success, persists sanitized CSS; on failure, returns `CUSTOM_CSS_INVALID`.

6. **Error handling**
   - Return proper error codes:
     - `TEMPLATE_NOT_FOUND`
     - `TEMPLATE_TIER_INSUFFICIENT`
     - `TEMPLATE_ARCHIVED`
     - `STYLING_NOT_ALLOWED_FOR_TIER`
     - `CUSTOM_CSS_TOO_LARGE`
     - `CUSTOM_CSS_INVALID`

### Constraints

- Do not break existing card APIs.
- Do not expose admin routes to non-admin users.
- Maintain consistent error envelope and HTTP status mapping.

### Tests

- Unit tests for `TemplatesService`:
  - Template tier gating.
  - Applying templates and updating card styling fields.
  - Archiving templates and preventing new applications.
- Unit tests for custom CSS:
  - Valid CSS passes and is stored sanitized.
  - Malicious CSS patterns are rejected.
  - CSS exceeding size limit is rejected.

### Deliverables

- Fully implemented template admin and user-facing endpoints.
- Custom CSS sanitization logic and tests.
- Any new docs under `docs/dev` summarizing template workflows.

### Definition of Done

- Admin can create, update, and archive templates.
- Users can list and apply templates.
- Card styling can be overridden within tier constraints.
- Custom CSS behaves securely and per spec.

---

## Prompt 4 — Backend: Render Model Builder and Identity Header Integration

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**

### Context

We need a **render model builder** to power both the editor preview and the public card page:

- Fetch card, template, styling, components.
- Derive effective styling.
- Assemble a `CardRenderModel` that includes the Identity Header and components.

### Tasks

1. **Create render model builder service**
   - Implement e.g. `CardRenderModelService` in an appropriate module (e.g., `cards` or a shared `rendering` module).
   - Function: `buildRenderModel(cardSlugOrId, viewerContext)`:
     - Fetch card metadata (including Identity Header fields).
     - Fetch card styling fields.
     - Fetch `CardTemplate` (if `templateId` is set).
     - Fetch ordered, enabled `CardComponent`s.
     - Compute `EffectiveStyling` via a pure helper `deriveStyling(templateConfig, cardOverrides, designSystemTokens)`.

2. **Define `CardRenderModel` type**
   - Add TypeScript types somewhere shared (e.g., `src/shared/models/card-render-model.ts`).
   - Include:
     - Identity header fields.
     - Styling object.
     - Components list (id, type, order, enabled, locked, config).

3. **Identity Header integration**
   - Ensure the builder:
     - Always includes Identity Header section from card metadata.
     - Does **not** treat the header as a component.
     - Ensures header is conceptually “position 0” above any components.

4. **Public API for render model**
   - Optionally expose a route like `GET /public/cards/:slug/render-model`:
     - Returns `CardRenderModel`.
     - Handles deleted, private, or disabled cards appropriately.

5. **Caching hooks (backend side)**
   - Add optional helpers for caching (e.g., Redis) keyed by `cardId` or `slug`.
   - Actual caching strategy will be finalized when implementing public rendering.

### Constraints

- `CardRenderModelService` must be side-effect free beyond DB/Redis reads.
- `deriveStyling` must be a pure function.

### Tests

- Unit tests for `deriveStyling`:
  - Template-only.
  - Overrides-only.
  - Template + overrides.
- Unit tests for `CardRenderModelService`:
  - Correct Identity Header data.
  - Correct ordering of components.
  - Behavior when there is no template.

### Deliverables

- Implementation of `CardRenderModelService` (or equivalent).
- Shared TS types for `CardRenderModel` and `EffectiveStyling`.
- Tests for styling derivation and render model construction.

### Definition of Done

- A single function exists that can produce a complete `CardRenderModel` for any valid card.
- Identity Header is always present in the model.
- Tests for the render model and styling pass.

---

## Prompt 5 — Frontend: Customization Page Shell and Data Hooks

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**

### Context

Implement the **frontend shell** for the card customization page:

- Route: `/[locale]/dashboard/cards/[cardId]/customize`.
- Tabs: Templates, Colors & Background, Typography, Layout & Shape, Advanced (CSS), Components.
- Data hooks to interact with backend endpoints.

### Tasks

1. **Create customization route**
   - In the Next.js app router, implement a page at `/[locale]/dashboard/cards/[cardId]/customize`.
   - The page should:
     - Read `cardId` (and locale) from params.
     - Use React Query (or existing data fetching pattern) for:
       - Card metadata (Identity Header fields).
       - `useCardStyling(cardId)`.
       - `useCardComponents(cardId)`.
       - `useTemplates()`.

2. **Implement data hooks**
   - Implement or wire frontend hooks:
     - `useCardComponents`
     - `useCreateComponent`
     - `useUpdateComponent`
     - `useReorderComponents`
     - `useDeleteComponent`
     - `useTemplates`
     - `useCardStyling`
     - `useApplyTemplate`
     - `useUpdateCardStyling`
     - `useUpdateCardCustomCss`
   - Ensure each hook:
     - Uses correct backend endpoints.
     - Caches and invalidates queries properly.

3. **Page layout & tabs**
   - Implement layout using shadcn and the Nexus design system:
     - Top section showing Identity Header preview.
     - Tab navigation or segmented controls for:
       - Templates
       - Colors & Background
       - Typography
       - Layout & Shape
       - Advanced (CSS)
       - Components

4. **Phone mockup preview**
   - Integrate a `PhoneMockup` component that:
     - Renders Identity Header and components using `CardComponentRenderer`.
     - Consumes a `CardRenderModel`-like structure built on the client side using hook data or from a dedicated render-model API.

5. **Autosave UX**
   - Ensure:
     - Component edits trigger immediate or debounced API calls.
     - Styling changes trigger debounced API calls.
   - Show loading and error indicators according to design system patterns.

### Constraints

- Use shadcn and Nexus design system tokens.
- Avoid ad hoc styles that bypass the design system.

### Tests

- Component tests for:
  - Tab switching.
  - Basic rendering of Identity Header and components.
- If E2E framework exists:
  - Test loading the customization page and verifying core sections.

### Deliverables

- Customization page at `/[locale]/dashboard/cards/[cardId]/customize`.
- Frontend hooks for components, templates, and styling.

### Definition of Done

- Navigating to the customization page shows:
  - Identity Header preview.
  - Tabs for templates/styling/components.
  - Data loads correctly from backend.

---

## Prompt 6 — Frontend: Components Editor (Palette, List, Editor Dialog)

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**

### Context

Implement the **components editor** UI inside the customization page:

- Palette (available component types).
- List (ordered components).
- Edit dialog for individual components.
- Drag-and-drop reordering.

### Tasks

1. **ComponentPalette**
   - Renders all component types available at the current tier.
   - Shows locked/upsell states for premium-only components if user’s tier is insufficient.
   - On click, triggers `useCreateComponent` for that type.

2. **CardComponentList**
   - Renders components below the Identity Header.
   - Uses drag-and-drop to reorder:
     - On drop, calls `useReorderComponents`.
   - Shows `locked` components with:
     - Lock icon.
     - Disabled edit actions (or limited editing, per spec).

3. **ComponentEditDialog**
   - Opens when user clicks “Edit” on a component.
   - Switches editor based on `type`.
   - For each type, provide at least a minimal, functional editor for `config`.
   - On save/blur, calls `useUpdateComponent`.

4. **Integration with preview**
   - Ensure component changes are reflected in the `PhoneMockup` preview:
     - Either via React Query cache updates or re-fetching.

5. **Tier downgrade UX**
   - For locked components:
     - Disable editing.
     - Show tooltip or inline message explaining locked state and upgrade path.

### Constraints

- Do not allow operations that conceptually interact with the Identity Header (no drag target above it).
- All UI must respect design-system tokens and typography.

### Tests

- Component tests:
  - Creating a component.
  - Editing a component and seeing preview update.
  - Reordering components.
  - Locked components not being editable.

### Deliverables

- `ComponentPalette`, `CardComponentList`, `ComponentEditDialog`, and their integration in `CustomizePage`.

### Definition of Done

- Users can add, edit, delete, and reorder components.
- Locked components are visually distinguished and protected.
- Identity Header remains fixed at the top.

---

## Prompt 7 — Frontend: Templates & Styling Tabs (User Experience Layer)

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**

### Context

Implement the **Templates**, **Colors & Background**, **Typography**, **Layout & Shape**, and **Advanced (CSS)** tabs.

### Tasks

1. **Templates tab**
   - Use `useTemplates()` to list accessible templates.
   - Render templates as cards with:
     - Name
     - Category
     - Visual swatch (color + layout hint).
   - Show locked state for templates above current tier.
   - Applying a template:
     - Calls `useApplyTemplate`.
     - Updates styling state and preview.

2. **Colors & Background**
   - Controls for:
     - `backgroundType` (solid / gradient / image).
     - `backgroundColor` (via design system colors).
     - Gradient presets.
     - Background image (if tier allows).
   - Calls `useUpdateCardStyling` (debounced).

3. **Typography**
   - Controls for:
     - `fontFamily` (restricted to design system fonts).
     - `fontSizeScale` (sm / md / lg).
   - Calls `useUpdateCardStyling`.

4. **Layout & Shape**
   - Controls for:
     - `layout` variant (`vertical`, `horizontal`, `centered`, `image-first`, `compact`).
     - `borderRadiusPreset` (`soft`, `rounded`, `pill`).
     - `shadowPreset` (`none`, `soft`, `medium`, `strong`).
   - Changes should affect both Identity Header and components area.

5. **Advanced (Custom CSS)**
   - Visible only if the user’s tier includes custom CSS.
   - Text area for CSS input.
   - Length indicator.
   - On submit:
     - Calls `useUpdateCardCustomCss`.
     - Shows errors based on backend responses.

6. **Live preview**
   - All styling changes must reflect in the preview with minimal latency.

### Constraints

- Do not allow user to break Identity Header invariants (header must always render).
- Use design-system tokens for default values.

### Tests

- Component tests verifying:
  - Template apply updates styling.
  - Background and typography changes apply to preview.
  - Advanced CSS shows correct success/error states.

### Deliverables

- Fully functional styling tabs wired to backend endpoints.

### Definition of Done

- Users can change template and styling of their card and see changes in preview and persisted on backend.

---

## Prompt 8 — Public Card Page & Caching: WYSIWYG with Customization Page

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**
>
> Assume core backend and frontend customization features are implemented. This prompt focuses on the **public card page** and ensuring WYSIWYG behavior with caching/ISR.

### Context

We need:

- A public card route.
- Reuse of the same render model and renderer from customization.
- Caching / ISR for performance.

### Tasks

1. **Public card route**
   - Implement public route (e.g., `/p/[slug]` or `/card/[slug]`) using Next.js App Router.
   - On build or first request:
     - Fetch `CardRenderModel` via:
       - Direct server-side call to `CardRenderModelService`, or
       - A backend API (`GET /public/cards/:slug/render-model`).

2. **Reuse renderer**
   - Use:
     - Identity Header component.
     - `CardComponentRenderer`.
   - Wrap in a responsive public-facing layout.

3. **Caching / ISR**
   - If using ISR:
     - Configure appropriate `revalidate` period or on-demand revalidation.
   - If using Redis:
     - Cache `CardRenderModel` responses with reasonable TTL.
   - Ensure you have hooks in backend to trigger revalidation when:
     - Card metadata changes.
     - Styli
ng/Template changes.
     - Components change.

4. **Error & disabled states**
   - Handle:
     - `Card not found`.
     - Card hidden/private (if PRD defines).
   - Show minimal, user-friendly error page.

### Constraints

- Do not expose sensitive user data beyond what PRD allows on public pages.
- Respect any privacy settings defined in PRD/TDD.

### Tests

- Snapshot or component tests:
  - Verify that a known `CardRenderModel` renders as expected.
- E2E:
  - Customize a card in dashboard.
  - Visit public URL.
  - Confirm preview and public page match.

### Deliverables

- Public card route and rendering logic.
- Caching / ISR configuration and wiring.
- Optional `docs/dev/public-card-rendering.md` describing caching strategy.

### Definition of Done

- For a given card, preview and public card output match.
- Public card route performs adequately due to caching/ISR.
- Error/disabled states are correctly handled.

---

## Prompt 9 — Comprehensive Test Coverage for Card Customization (Backend & Frontend)

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**
>
> Assume all core card customization features (components, templates, styling, Identity Header, public card rendering) are implemented according to the spec. This prompt is about adding *comprehensive tests* to reach a “production-ready” level of confidence.

### Context

We need **high-confidence test coverage** across:

- NestJS backend: components, templates & styling, render model builder.
- Next.js frontend: customization UI, hooks, and public card rendering.
- Identity Header invariants.
- Tier behaviors and locked components.
- Custom CSS handling.

Use the existing testing stack (e.g., Jest, React Testing Library, Playwright/Cypress).

### Tasks

1. **Backend: Unit Tests for Components**
   - For `CardComponentsService`:
     - Creation:
       - Under `max_allowed` → success.
       - Over `max_allowed` → `TIER_LIMIT_EXCEEDED`.
       - Disallowed type for tier → `COMPONENT_TYPE_NOT_ALLOWED`.
     - Update:
       - Normal component config update succeeds.
       - `locked = true` component config update fails with `EDIT_LOCKED` (unless allowed fields).
     - Reorder:
       - Valid, contiguous reorder succeeds.
       - Invalid reorder payload fails with `INVALID_REORDER`.
     - Delete:
       - Deletes component and leaves consistent ordering.

2. **Backend: Unit Tests for Templates & Styling**
   - For `TemplatesService`:
     - Template tier gating:
       - `minTier <= userTier` → apply succeeds.
       - `minTier > userTier` → `TEMPLATE_TIER_INSUFFICIENT`.
     - Archived templates:
       - Applying archived template → `TEMPLATE_ARCHIVED`.
       - Templates with `usageCount > 0` cannot be hard deleted.
     - Card styling:
       - Valid styling updates succeed.
       - Disallowed tokens or invalid values fail with appropriate validation error.
   - Custom CSS tests:
     - Valid CSS within size limit passes and is sanitized.
     - Malicious CSS patterns rejected with `CUSTOM_CSS_INVALID`.
     - Oversized CSS fails with `CUSTOM_CSS_TOO_LARGE`.

3. **Backend: Render Model & Identity Header Tests**
   - For `CardRenderModelService`:
     - Identity Header:
       - Always present with correct fields from card metadata.
       - Not part of components list.
     - Components:
       - Correctly ordered, locked flags preserved.
     - Styling:
       - `deriveStyling` coverage for:
         - Template-only.
         - Overrides-only.
         - Template + overrides.

4. **Frontend: Unit / Component Tests (Customization UI)**
   - `ComponentPalette`:
     - Shows correct component types by tier.
     - Locked/upsell states for premium-only.
   - `CardComponentList`:
     - Renders in correct order.
     - Drag-and-drop triggers reorder hook.
     - `locked` components show lock icon and disabled editing.
   - `ComponentEditDialog`:
     - Opens with correct config.
     - Submits updates and shows errors correctly.
   - Styling tabs:
     - Template apply triggers styling change and preview update.
     - Background/typography/layout/shape controls call appropriate hooks.
     - Advanced CSS tab handles success/error states from backend.
   - Identity Header preview:
     - Always visible at top.
     - Shows photo, name, title, phone, email, website, social links when present.

5. **Frontend: Public Card Page Tests**
   - Ensure public card route:
     - Uses the same renderer as preview.
     - Renders Identity Header and components correctly.
   - Snapshot/structural tests where appropriate.

6. **E2E / Integration Scenarios**
   - Scenario 1: Basic customization and publish flow:
     - Create card → set identity fields → apply template → add components → reorder → visit public URL.
   - Scenario 2: Tier downgrade & locked components:
     - Start higher tier → add premium components + premium template → downgrade tier → verify locked behavior and public rendering.

### Constraints

- Do not break existing tests; extend carefully.
- Respect house rules (ASCII, no TODOs, repo-relative paths, etc.).

### Tests

- All new backend and frontend tests pass.
- Coverage reports show meaningful coverage increases in:
  - Components module.
  - Templates/styling module.
  - Render model builder.
  - Customization page and public card page.

### Deliverables

- New/updated test files for backend and frontend.
- Optional `docs/dev/card-customization-testing.md` summarizing:
  - What’s covered.
  - How to run tests.

### Definition of Done

- Automated tests cover all critical behaviors described in `docs\card-customization-specs.md`.
- CI passes with the new test suite.
- We have high confidence that regressions in customization features will be caught.

---

## Prompt 10 — Analytics Events & Instrumentation for Card Customization

> **First, read and explicitly acknowledge that you will strictly follow `docs\house_rules.md`, `docs\card-customization-specs.md`, `docs\prd_nexus_cards.md`, `docs\tdd_nexus_cards.md`, and `docs\design-system.md` for all actions in this prompt and for all code you generate. Any documentation you create must be saved under `docs/dev`.**
>
> Assume a basic analytics/telemetry mechanism already exists (e.g., server-side event logger, client-side tracking helper). Your job is to instrument the card customization feature with events in a privacy-safe and performant way.

### Context

We want to track **meaningful, high-level events** for the customization system:

- So we understand usage and friction.
- And can make informed product decisions.

Event names and payloads should align with the spec but adapt to the existing analytics infra.

### Tasks

1. **Define Analytics Event Catalog**
   - Create or update a central file, e.g.:
     - `docs/dev/card-customization-analytics.md`, or
     - `src/analytics/events/card-customization.ts`.
   - Define events:
     - `customization_session_started`
     - `customization_session_completed`
     - `component_added`
     - `component_removed`
     - `component_updated`
     - `component_reordered`
     - `card_template_applied`
     - `card_styling_updated`
     - `card_custom_css_updated`
   - For each event, define payload fields:
     - Required:
       - `userId` (or anonymized equivalent).
       - `cardId`.
       - `templateId` (if relevant).
       - `componentId`, `componentType` (if relevant).
       - `tier`.
       - `timestamp` (or rely on analytics infra).
     - Optional:
       - Component count on card.
       - `source` (`"editor" | "onboarding" | ...`).

2. **Backend Event Emission**
   - In `CardComponentsService`:
     - Emit:
       - `component_added` on create.
       - `component_removed` on delete.
       - `component_updated` on update.
       - `component_reordered` on reorder.
   - In `TemplatesService` / styling logic:
     - Emit:
       - `card_template_applied` on template application.
       - `card_styling_updated` on styling changes.
       - `card_custom_css_updated` on custom CSS changes.
   - Use existing analytics abstraction (e.g., `AnalyticsService.emit(eventName, payload)`).

3. **Frontend Session Events**
   - On customization page:
     - Emit `customization_session_started`:
       - When page mounts and initial data is loaded.
       - Include `userId` (if safe & available), `cardId`, `templateId`, `tier`.
     - Emit `customization_session_completed`:
       - When user navigates away or page unmounts.
       - Include at least:
         - `userId` (if safe).
         - `cardId`.
         - `templateId`.
         - `tier`.
         - `duration` (seconds in session).
         - Basic summary (e.g., number of components added/removed).

4. **Privacy & Performance**
   - Ensure:
     - No sensitive payloads (emails, phone numbers, card content) are logged.
     - Use IDs and non-PII metadata for analytics.
   - For frontend:
     - Debounce or batch frequent events if needed (e.g., only emit `component_updated` on successful save).

5. **Developer Documentation**
   - Create `docs/dev/card-customization-analytics.md` describing:
     - Each event.
     - Payload schema.
     - Where it is emitted.
     - Example payloads.

6. **Tests / Verification**
   - Backend:
     - Unit/integration tests verifying analytics emission:
       - Use spies/mocks on the analytics service.
   - Frontend:
     - Component or integration tests:
       - Mock analytics helper and verify:
         - `customization_session_started` fires on mount.
         - `customization_session_completed` fires on unmount/route change.
   - Manual smoke test:
     - Run through customization flows and verify events in logs / debug tools.

### Constraints

- Reuse existing analytics abstractions; don’t add new vendor-specific clients unless required by existing architecture.
- Ensure event emission is non-blocking and does not add significant latency.

### Deliverables

- Analytics event catalog and documentation.
- Backend services instrumented for analytics.
- Frontend customization page instrumented for session events.
- Tests confirming analytics hooks are called.

### Definition of Done

- All major customization flows emit expected analytics events.
- No PII is leaked in payloads beyond what is explicitly allowed.
- Analytics documentation under `docs/dev` explains events and intended analysis.

---
