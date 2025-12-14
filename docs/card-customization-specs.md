# Nexus Card Customization System — Technical Architecture Specification  
**Version:** 2.0  
**Location:** `docs/card-customization-specs.md`  
**Status:** Canonical Architecture Spec (replaces previous card customization docs)

---

## 1. Purpose and Scope

This document defines the **full technical architecture** of the Nexus Card Customization System. It covers three tightly related subsystems:

1. **Card Component Customization System**  
   - User-controlled content building blocks (Text, Image, Social Links, CTA, etc.).
   - Drag-and-drop ordering, enabling/disabling, type-specific configuration.

2. **Template & Styling Engine (TSE)**  
   - Admin-managed templates with token-based styling (colors, layout, typography, radii, shadows, backgrounds).
   - Tier-gated template access, dynamic adjustments to tokens, and safe custom CSS for premium tiers.

3. **Card Identity Header**
   - A mandatory, non-removable, non-reorderable header at the top of every card.
   - Always displays the basic information: **photo, name, title, phone number, email, website, and social links**.
   - Styled by templates, but never removed or moved.

This spec is aligned with:

- **PRD**: `docs/prd_nexus_cards.md`  
- **TDD**: `docs/tdd_nexus_cards.md`  
- **Design System**: `docs/design-system.md`  
- **House Rules**: `docs/house_rules.md`

It is intended as the **authoritative reference** for backend, frontend, data models, behaviors, tier rules, rendering pipeline, security, testing, and extensibility.

---

## 2. Glossary / Definitions

### Card
A user’s digital profile / contact card as defined in the PRD. Each card has:

- Owner (user/account)
- Slug or public identifier
- Metadata (name, title, photo, contacts, etc.)
- References to styling and components.

### Card Identity Header
A **fixed, mandatory header section** rendered at the **top of every card and every template**, containing:

- Profile photo  
- Name  
- Title  
- Phone number  
- Email  
- Website  
- Social links  

Key rules:

- Not removable.
- Not reorderable.
- Not treated as a `CardComponent`.
- Styled by the template and design system.
- Always rendered above the components area.

### Card Component
A user-configurable content block rendered in the card **below the Identity Header**, e.g.:

- Text block  
- Image / logo block  
- Social links section  
- Call-to-action button  
- Divider / section header  
- Custom component types (future)

Each `CardComponent` belongs to a specific card and has:

- A `type`
- A `config` JSON
- An `order`
- `enabled` and `locked` flags

### Component Type
An identifier describing what a component is and how it behaves (e.g., `TEXT`, `IMAGE`, `SOCIAL_LINKS`, `CTA_BUTTON`). Determines:

- Valid configuration shape
- Rendering logic
- Availability per subscription tier

### Enabled Components
The subset of `CardComponent`s for a card where `enabled = true`, ordered by `order`, rendered in the components area below the Identity Header.

### Locked Component
A **premium component** that:

- Was created when the user had a higher tier.
- Remains on the card after downgrade.
- Is still rendered on the public card.
- Is visible in the editor.
- But cannot be edited or newly added at the downgraded tier.

Represented by `locked = true`.

### CardTemplate (Template)
An admin-defined **visual style package** that defines how the card looks:

- Color scheme  
- Backgrounds (solid, gradient, image)  
- Layout variants (vertical, horizontal, centered, image-first, compact)  
- Typography (font families, scales, weights)  
- Border radius presets  
- Shadows  
- Spacing tokens and other layout-related attributes

Templates are:

- Stored in a `CardTemplate` table.
- Tied to a minimum tier (`minTier`).
- Composed of **design-system-aligned tokens** in `config`.

### Template Config
The JSON style configuration associated with a template, e.g.:

```ts
type TemplateConfig = {
  colorScheme: {
    background: string;
    accent: string;
    primaryText: string;
    secondaryText: string;
  };
  typography: {
    fontFamily: string;       // maps to design system
    fontScale: "sm" | "md" | "lg";
    headingWeight: number;
    bodyWeight: number;
  };
  layout: {
    variant: "vertical" | "horizontal" | "centered" | "image-first" | "compact";
    padding: "sm" | "md" | "lg";
  };
  borderRadiusPreset: "soft" | "rounded" | "pill";
  shadowPreset: "none" | "soft" | "medium" | "strong";
  backgroundType: "solid" | "gradient" | "image";
  backgroundGradient?: string;
  backgroundImageUrl?: string;
};
````

### Card-Level Styling

Styling fields stored on the `Card` itself that represent template application and user overrides:

* `templateId`
* `backgroundType`, `backgroundColor`, `backgroundImage`
* `layout`
* `fontFamily`, `fontSizeScale`
* `borderRadiusPreset`
* `shadowPreset`
* `customCss` (premium, sanitized)

### Template Availability / Tier

Rules defining which templates and which styling capabilities are available at each subscription tier (e.g., gradients and custom CSS may require premium).

### Component Availability Matrix

A table mapping:

* `tier`
* `component_type`
* `max_allowed`

Used by backend to enforce which components a user can create and how many.

### Render Pipeline

The end-to-end process of:

1. Fetch card metadata, card styling, template, components.
2. Compute **effective styling** from template + card overrides + design system tokens.
3. Build a **render model**.
4. Render:

   * Identity Header
   * Components
   * Layout shell and backgrounds

Used both in editor preview and public card rendering.

### Reorder Transaction

A safe, two-step DB operation for updating component orders without violating uniqueness or leaving gaps.

### Customization Session

A user’s continuous interaction with the customization UI from the time the page loads until they navigate away or close the tab.

---

## 3. High-Level Architecture

### 3.1 Combined System Overview

```text
+----------------------------------------------------+
|                   Next.js Frontend                 |
|  (App Router, React Query, shadcn, Design System)  |
+---------------------------+------------------------+
                            |
                            | HTTP (JSON / HTML)
                            v
+---------------------------+------------------------+
|          Customization Surface (Dashboard)         |
|   - Templates & Styling Tabs                       |
|   - Components Editor (Palette/List/Edit Dialog)  |
|   - Identity Header Preview                        |
+---------------------------+------------------------+
                            |
                            v
+---------------------------+------------------------+
|             NestJS API (Backend)                   |
|  - CardComponentsModule                            |
|  - TemplatesModule                                 |
|  - CardsModule (metadata, identity header source) |
+----------------------+-----------------------------+
                       |
                       v
+----------------------+-----------------------------+
|                    Prisma ORM                      |
|  - Card                                             
|  - CardComponent                                    
|  - CardTemplate                                     
|  - Tier & rules (availability matrices)            
+----------------------+-----------------------------+
                       |
                       v
+----------------------+-----------------------------+
|                   PostgreSQL DB                    |
+----------------------------------------------------+
```

### 3.2 Rendering Stack (Preview + Public)

```text
[ Card + Card Styling + CardTemplate + CardComponents ]
                          |
                          v
                [ Derive EffectiveStyling ]
                          |
                          v
                  [ RenderModel Builder ]
                          |
                          v
        +-----------------+-------------------+
        |                                     |
        v                                     v
[ Editor Preview (PhoneMockup) ]     [ Public Card Page ]
[ Identity Header + Components ]     [ Identity Header + Components ]
```

The **same render model and renderer** are used for both preview and public views, guaranteeing WYSIWYG.

---

## 4. Backend Architecture: Components

This section describes the user-controlled component system (below the Identity Header).

### 4.1 Module Layout

```text
src/
  card-components/
    card-components.module.ts
    card-components.controller.ts
    card-components.service.ts
    dto/
      create-card-component.dto.ts
      update-card-component.dto.ts
      reorder-card-components.dto.ts
    models/
      card-component.model.ts
      component-type.enum.ts
      tier.enum.ts
      errors.ts
```

### 4.2 Prisma Model: CardComponent

```prisma
model CardComponent {
  id        String   @id @default(cuid())
  cardId    String
  type      String   // "TEXT", "IMAGE", "SOCIAL_LINKS", etc.
  config    Json     // type-specific config
  order     Int
  enabled   Boolean  @default(true)
  locked    Boolean  @default(false) // premium locked after downgrade
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  Card      Card     @relation(fields: [cardId], references: [id])

  @@unique([cardId, order])
}
```

### 4.3 Component Availability Matrix (Tier Rules)

```text
table: tier_component_rules
columns:
  id              uuid (pk)
  tier            varchar  -- e.g., "FREE", "PRO", "BUSINESS"
  component_type  varchar  -- e.g., "TEXT", "IMAGE", ...
  max_allowed     int      -- null = no explicit limit
  created_at      timestamptz
  updated_at      timestamptz
```

* Loaded at startup, optionally cached in Redis.
* Used to:

  * Determine if user tier can use a given component type.
  * Determine how many of a given type are allowed for that tier.

### 4.4 Endpoints (Components)

All endpoints require authentication and card ownership.

#### 4.4.1 GET `/cards/:cardId/components`

* Returns ordered list of components for a card.
* Includes:

  * `id`, `type`, `config`, `order`, `enabled`, `locked`.

#### 4.4.2 POST `/cards/:cardId/components`

* Creates a new component instance.

* Flow:

  1. Ensure user owns card.
  2. Determine user’s tier.
  3. Check `tier_component_rules`:

     * Is this `type` available at that tier?
     * Has `max_allowed` been reached?
  4. Insert new component with `order = currentMaxOrder + 1`.

* Fails with:

  * `403 COMPONENT_TYPE_NOT_ALLOWED` if type not allowed at tier.
  * `409 TIER_LIMIT_EXCEEDED` if max count reached.

#### 4.4.3 PATCH `/cards/:cardId/components/:componentId`

* Updates `config` and/or `enabled`.

Behavior:

* Checks ownership.
* If `locked = true`:

  * Disallow changes to `config` (except possibly enable/disable if allowed by policy).
* Validates config with type-specific schema.

#### 4.4.4 PATCH `/cards/:cardId/components/reorder`

* Reorders components.
* Payload:

```json
{
  "order": [
    { "id": "cmp_1", "order": 0 },
    { "id": "cmp_2", "order": 1 },
    { "id": "cmp_3", "order": 2 }
  ]
}
```

* Behavior:

  * Validates that:

    * All IDs exist and belong to the same card.
    * No duplicates.
    * Sequence is contiguous.
  * Uses a **two-step transaction** to avoid unique key conflicts:

    1. Shift orders by an offset (e.g. +1000).
    2. Write final proper sequence (0..N-1).

* On invalid payload, returns `400 INVALID_REORDER`.

#### 4.4.5 DELETE `/cards/:cardId/components/:componentId`

* Deletes a component.
* Behavior:

  * Check ownership.
  * Delete row.
  * Optionally re-normalize orders for that card to keep them contiguous.

### 4.5 Tier Downgrade Behavior (Components)

* On tier downgrade:

  * Identify any components that are premium-only at the new tier.
  * Mark such components as `locked = true`.
* Locked components:

  * Are still rendered publicly.
  * Are visible in the editor.
  * Cannot be edited or duplicated.
  * May be disabled/hidden depending on policy (optional).

### 4.6 Component Error Format and Codes

All errors follow:

```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Readable message."
  }
}
```

Key component error codes:

* `TIER_LIMIT_EXCEEDED`
* `COMPONENT_TYPE_NOT_ALLOWED`
* `INVALID_REORDER`
* `NOT_OWNER`
* `CARD_NOT_FOUND`
* `EDIT_LOCKED`
* `VALIDATION_FAILED`

---

## 5. Backend Architecture: Templates & Styling Engine (TSE)

This subsystem manages templates, card-level styling, and custom CSS.

### 5.1 Prisma Model: CardTemplate

```prisma
model CardTemplate {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  category    String
  industries  String[]
  config      Json     // TemplateConfig (tokens)
  minTier     String   // Minimum tier required to apply
  usageCount  Int      @default(0)
  isArchived  Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Key rules:

* `usageCount` is incremented when template is applied by a card, decremented (optional) when card switches away.
* **An applied template is never hard-deleted**:

  * Instead, templates are **archived** via `isArchived = true`.
  * Archived templates:

    * Remain usable by cards that already have them.
    * Do not appear in the public template picker.
    * Can still have tokens updated by admin.

### 5.2 Card-Level Styling Fields on Card

```prisma
model Card {
  id                   String  @id @default(cuid())
  ownerId              String
  // ... other metadata fields (name, title, photo, phone, email, website, social)
  templateId           String?   // FK to CardTemplate
  backgroundType       String?   // "solid" | "gradient" | "image"
  backgroundColor      String?   // HEX or token
  backgroundImage      String?   // URL or storage key
  layout               String?   // "vertical" | "horizontal" | etc.
  fontFamily           String?   // maps to design system fonts
  fontSizeScale        String?   // "sm" | "md" | "lg"
  borderRadiusPreset   String?   // "soft" | "rounded" | "pill"
  shadowPreset         String?   // "none" | "soft" | "medium" | "strong"
  customCss            String?   // premium-only, sanitized
}
```

### 5.3 TemplatesModule

```text
src/
  templates/
    templates.module.ts
    templates.controller.ts
    templates.service.ts
    dto/
      create-template.dto.ts
      update-template.dto.ts
      apply-template.dto.ts
      update-card-styling.dto.ts
      update-card-custom-css.dto.ts
    models/
      card-template.model.ts
      template-category.enum.ts
      template-errors.ts
```

Responsible for:

* Admin template CRUD.
* Template listing & filtering.
* Applying templates to cards.
* Managing card-level styling overrides.
* Custom CSS validation and sanitization.

### 5.4 Admin Template Management

#### 5.4.1 Admin Endpoints

All require admin role/permission.

* **Create Template**
  `POST /admin/templates`

  * Payload: name, slug, config, minTier, category, industries.
  * Validates config against TemplateConfig schema.

* **Update Template**
  `PATCH /admin/templates/:id`

  * Allows editing tokens (colors, layout, typography, etc.).
  * Enforces design-system alignment (only valid tokens allowed).
  * Live updates for all cards using this template.

* **Archive Template**
  `PATCH /admin/templates/:id/archive`

  * Sets `isArchived = true`.
  * Template cannot be applied to new cards.
  * Existing cards keep their styling.
  * Attempting to apply archived template returns `TEMPLATE_ARCHIVED`.

* **List Templates (Admin)**
  `GET /admin/templates`

  * Returns active + archived templates.
  * Possibly filtered by category, tier, etc.

#### 5.4.2 Safety Invariant: No Hard Delete of Applied Templates

* Templates with `usageCount > 0`:

  * Cannot be hard deleted from DB.
  * Must only be archived.
* Hard delete is reserved for templates that:

  * Have never been used, or
  * Are in pre-production only (admin tool could be restricted).

### 5.5 User Template Selection & Switching

#### 5.5.1 User-Facing Endpoints

* **List Templates (User)**
  `GET /templates`

  * Returns only:

    * `!isArchived`.
    * Templates where `minTier <= userTier`.

* **Get Template Details**
  `GET /templates/:slug`

  * Provides config for showing preview in UI.

* **Apply Template**
  `POST /cards/:cardId/apply-template/:templateId`

  * Checks card ownership.
  * Checks `minTier <= userTier`.
  * Checks `isArchived == false`.
  * Updates card styling fields based on TemplateConfig.
  * Sets `card.templateId = template.id`.
  * Updates `usageCount` for template (increment/decrement as needed).

#### 5.5.2 User Workflow Guarantees

* User can pick **any accessible template** from the published (non-archived) list at any time.
* On apply:

  * Editor preview immediately reflects new template.
  * Public card reflects new template on next render / ISR revalidation.
* Component ordering remains unchanged; only styling changes.
* The Identity Header is always present and styled according to the template.

### 5.6 Template & Styling Tier Rules

* Each template has `minTier`; user must match or exceed to apply and use it.
* Additional styling features may have tier constraints:

  * Gradients (backgroundType = `gradient`) may require higher tier.
  * Background image support (image uploads) may require higher tier.
  * `customCss` is premium-only.

Backend enforces tier constraints at:

* Template application endpoint.
* Styling update endpoint.
* Custom CSS endpoint.

### 5.7 Custom CSS Support (Premium)

#### 5.7.1 Endpoint

`PATCH /cards/:cardId/custom-css`

* Requires:

  * Card ownership.
  * Tier that includes custom CSS capability.

* Validates:

  * Length limit (e.g. ≤ 100 KB).
  * Sanitization via whitelist/blacklist.

#### 5.7.2 Sanitization Rules

* Disallow:

  * `javascript:`
  * `expression(`
  * `@import`
  * `<script`
  * `behavior:`
  * `-moz-binding`
  * Inline event patterns like `onerror=`, `onload=`
* Prefer whitelist of properties:

  * Colors, fonts, sizes, margins, paddings, radii, shadows, etc.
* Any violation:

  * `400 CUSTOM_CSS_INVALID` or `400 VALIDATION_FAILED`.
  * Do **not** persist raw, unsanitized CSS.

### 5.8 Template & Styling Error Codes

Additional error codes:

* `TEMPLATE_NOT_FOUND`
* `TEMPLATE_TIER_INSUFFICIENT`
* `TEMPLATE_ARCHIVED`
* `STYLING_NOT_ALLOWED_FOR_TIER`
* `CUSTOM_CSS_TOO_LARGE`
* `CUSTOM_CSS_INVALID`

---

## 6. Card Identity Header

This section defines the invariant of always showing basic info at the top.

### 6.1 Definition & Purpose

The **Card Identity Header** is a special, fixed section at the top of every card that:

* Presents crucial identifying information at first glance.
* Ensures consistent branding and recognition across templates.

Contents:

* Photo (avatar / profile image)
* Name
* Title / role
* Phone number
* Email
* Website
* Social links (from card metadata)

### 6.2 Data Source

* All fields are taken from **card metadata** and user profile config.
* They are **not** represented as separate `CardComponent` entities.

### 6.3 Behavioral Rules

1. **Always on Top**

   * Identity Header is rendered above all components.
   * Users cannot drag or insert components above it.

2. **Not a Component**

   * It does not appear in the component list.
   * It cannot be disabled, deleted, or duplicated via the component APIs.

3. **Styled by Template**

   * Templates define layout and styling for the header region:

     * Vertical/horizontal orientation
     * Background color/gradient
     * Typography
     * Spacing, radius, shadow
   * Templates may **not** remove fields:

     * All identity fields must remain visible in some form.
   * Templates can choose layout (e.g., photo left, text right, or centered).

4. **Social Links Behavior**

   * Social links in the Identity Header show the primary social handles (as configured in card/profile metadata).
   * The **Social Links Component**, if used below, can present an extended or differently styled list.

5. **Validation**

   * Backends and UI should validate that:

     * Name and at least one contact method (phone/email) exist.
     * If missing, editor should prompt user to complete basic info.

---

## 7. Frontend Architecture: Components Editor

This subsystem is responsible for editing and managing `CardComponent`s.

### 7.1 Route

```text
/[locale]/dashboard/cards/[cardId]/customize
```

This single page hosts both:

* **Templates & Styling tabs**
* **Components tab with list editor and preview**

### 7.2 Core UI Components (Components Side)

* `CustomizePage`

  * Orchestrates all sub-views.
  * Loads card metadata, styling, template, components.

* `ComponentPalette`

  * Shows list of components user can add.
  * Reflects tier gating: hides or locks premium-only components.

* `CardComponentList`

  * List of components in their current order (below the header).
  * Supports drag-and-drop via `@dnd-kit` or `react-beautiful-dnd`.

* `ComponentEditDialog`

  * Shell that chooses which type-specific editor to render.
  * Handles saving, validation, error display.

* `CardComponentRenderer`

  * Shared renderer used by editor preview and public card.
  * Maps `type` to a React component and passes `config`.

* `PhoneMockup`

  * Visual shell simulating a phone screen.
  * Renders Identity Header + components.

### 7.3 React Query Hooks (Components)

```ts
useCardComponents(cardId: string)
useCreateComponent(cardId: string)
useUpdateComponent(cardId: string, componentId: string)
useReorderComponents(cardId: string)
useDeleteComponent(cardId: string, componentId: string)
```

Responsibilities:

* `useCardComponents`: fetch & cache `GET /cards/:cardId/components`.
* `useCreateComponent`: call POST, then update or invalidate components.
* `useUpdateComponent`: call PATCH, then update cache.
* `useReorderComponents`: call reorder endpoint, update cache.
* `useDeleteComponent`: call DELETE, update cache.

### 7.4 Data Flow (Components)

```text
[ CustomizePage ]
      |
      v
[ useCardComponents ] -> GET /cards/:cardId/components
      |
      v
[ CardComponentList ] + [ CardComponentRenderer ] + [ ComponentPalette ]
      |
      +-- add --> useCreateComponent -> POST /cards/:cardId/components
      |
      +-- edit -> useUpdateComponent -> PATCH /cards/:cardId/components/:componentId
      |
      +-- reorder -> useReorderComponents -> PATCH /cards/:cardId/components/reorder
      |
      +-- delete -> useDeleteComponent -> DELETE /cards/:cardId/components/:componentId
```

### 7.5 Autosave & Dirty State

* **Autosave**:

  * Immediate (debounced) on form inputs in `ComponentEditDialog`.
  * Immediate on toggles (e.g., `enabled`) and reorder operations.
* **Dirty State**:

  * Track unsaved local changes vs last successful server state.
  * On navigation away:

    * If dirty, show "unsaved changes" warning.
  * Handle in-flight requests gracefully.

### 7.6 Virtualization for Large Component Lists

* Use virtualization in `CardComponentList` if component count grows large (e.g., > 50).
* Backend still returns all components for a card in one call.

---

## 8. Frontend Architecture: Templates & Styling Editor

This subsystem handles the visual/design aspect of cards.

### 8.1 Tabs / Sections in UI

Recommended tab structure:

1. **Templates**

   * Template gallery, search, categories, apply button.

2. **Colors & Background**

   * Background type (solid/gradient/image).
   * Color pickers (from design tokens).
   * Gradient presets.

3. **Typography**

   * Font family selector (mapped to design system fonts).
   * Font size scale (sm/md/lg).

4. **Layout & Shape**

   * Layout variant (vertical, horizontal, centered, image-first, compact).
   * Border radius preset.
   * Shadow preset.

5. **Advanced (Custom CSS)**

   * Premium-only text area.
   * Live preview of sanitized CSS.

6. **Components**

   * The component management area described in section 7.

### 8.2 Hooks (Styling & Templates)

```ts
useTemplates()
useTemplateCategories() // optional

useCardStyling(cardId: string)
useApplyTemplate(cardId: string)
useUpdateCardStyling(cardId: string)
useUpdateCardCustomCss(cardId: string)
```

* `useTemplates()`:

  * Calls `GET /templates` (user-facing).
  * Returns only non-archived, tier-accessible templates.

* `useCardStyling()`:

  * Fetches current card styling and template info.

* `useApplyTemplate()`:

  * Calls POST `/cards/:cardId/apply-template/:templateId`.
  * On success: refresh styling & preview.

* `useUpdateCardStyling()`:

  * Calls `PATCH /cards/:cardId/styling` for overrides.

* `useUpdateCardCustomCss()`:

  * Calls `PATCH /cards/:cardId/custom-css`.

### 8.3 Templates UI Behavior

* **Gallery**:

  * Displays template cards with:

    * Name
    * Category
    * Small visual swatch (color & layout hint).
  * Shows lock icon & upgrade CTA if template requires higher tier.
  * Applies template on click, if accessible.

* **Usage & Versions**:

  * (Optional future enhancement) show how many cards use each template.

### 8.4 Styling Controls Behavior

* Changes via the styling controls immediately:

  * Update local UI state.
  * Trigger debounced server calls.
  * Reflect in preview.

* Template application resets card styling to template defaults (with some overrides preserved if desired by design).

---

## 9. Rendering Pipeline (Combined)

### 9.1 Data Inputs

For a given card:

* `Card` metadata, including Identity Header fields.
* `Card.templateId` and styling fields.
* `CardTemplate.config` (if template applied).
* `CardComponent[]` ordered by `order`.

### 9.2 Effective Styling Computation

```ts
const effectiveStyling = deriveStyling({
  templateConfig,         // from CardTemplate.config
  cardStylingOverrides,   // from Card styling fields
  designSystemTokens      // from design system
});
```

Outputs:

* Effective color scheme (background, accent, text).
* Typography styles (fonts, scales).
* Layout variant and container spacing.
* Border radius and shadow presets.
* Background details (solid, gradient, image).

### 9.3 Render Model

```ts
type CardRenderModel = {
  cardId: string;
  slug: string;
  identityHeader: {
    photoUrl: string | null;
    name: string;
    title: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    socialLinks: Array<{ type: string; url: string }>;
  };
  styling: EffectiveStyling;
  components: Array<{
    id: string;
    type: string;
    order: number;
    enabled: boolean;
    locked: boolean;
    config: any;
  }>;
};
```

### 9.4 Rendering Steps

```text
1. Build CardRenderModel.
2. Render LayoutShell with styling.
3. Render IdentityHeader with styling.
4. Render each enabled component via CardComponentRenderer.
```

This process is identical for:

* Editor preview (inside PhoneMockup).
* Public card page.

---

## 10. Public Card Rendering & Caching

### 10.1 Rendering Strategy

* **Preferred**: SSG + ISR (Incremental Static Regeneration)

  * Public routes like: `/p/[slug]` or `/card/[slug]`.
  * On build or first request:

    * Fetch card, template, styling, components.
    * Generate static HTML.

### 10.2 Revalidation Triggers

Potential triggers:

* Card metadata changes.
* Styling changes (template apply, overrides).
* Component changes (add/edit/reorder/delete).

On such events, revalidate the static page (ISR) or purge relevant caches.

### 10.3 Redis Caching

For dynamic APIs or SSR fallbacks:

* Store `CardRenderModel` in Redis:

```ts
key = `card_render_model:${cardId}`;
// TTL: e.g., 60–300 seconds
```

* On public request:

  * Check Redis → if hit, use cached render payload.
  * If miss, fetch from DB, build model, store in Redis, render.

---

## 11. Validation & Error Handling

### 11.1 Client-Side Validation

* Use Zod (or similar) for:

  * Component config per type.
  * Styling payloads (e.g., backgroundType, layout).
  * Template selection (e.g., ensure template is in list).
  * Basic sanity checks on custom CSS size.

### 11.2 Server-Side Validation

* DTOs (`class-validator`) or Zod on server:

  * `CreateCardComponentDto`
  * `UpdateCardComponentDto`
  * `ReorderCardComponentsDto`
  * `ApplyTemplateDto`
  * `UpdateCardStylingDto`
  * `UpdateCardCustomCssDto`

The server is the **final source of truth** and must reject invalid or unsafe payloads.

### 11.3 Error Envelope

All errors (components + templates) use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}
```

**HTTP status codes**:

* `200/201`: OK / Created.
* `400`: `INVALID_REORDER`, `VALIDATION_FAILED`, `CUSTOM_CSS_INVALID`, etc.
* `403`: `NOT_OWNER`, `TEMPLATE_TIER_INSUFFICIENT`, `STYLING_NOT_ALLOWED_FOR_TIER`, `EDIT_LOCKED`.
* `404`: `CARD_NOT_FOUND`, `TEMPLATE_NOT_FOUND`.
* `409`: `TIER_LIMIT_EXCEEDED`, other conflict states.
* `500`: unexpected server errors.

---

## 12. Security Considerations

### 12.1 Authentication & Authorization

* All `/cards/:cardId/*` endpoints require JWT.
* Always check ownership:

  * `card.ownerId === userId`.
* Admin endpoints:

  * `/admin/templates/*` require admin role/permission.

### 12.2 Data Integrity

* Enforce unique `(cardId, order)` in `CardComponent`.
* Reordering must be transactional:

  * Prevent mixed, partial state.
* Deleting a component should not leave orphaned references.

### 12.3 XSS & CSS Injection Prevention

* Sanitize all user-visible text fields from components.
* Encode output properly in React (default).
* Sanitized Custom CSS:

  * Strong whitelist or high-quality sanitization library.
  * Disallow scriptable constructs.

### 12.4 Template Safety

* Admin template updates:

  * Should be validated to avoid invalid `TemplateConfig` that could break many cards.
  * May require staging or preview environment for complex changes.

---

## 13. Extensibility

### 13.1 Adding a New Component Type

Steps:

1. Backend:

   * Add new type to `component-type.enum.ts` and/or Prisma enum.
   * Update schemas/DTOs for config validation.
   * Add tier rules to `tier_component_rules`.

2. Frontend:

   * Implement renderer component.
   * Implement type-specific editor.
   * Register in `CardComponentRenderer`.
   * Add to `ComponentPalette` with icon/label.

3. Testing:

   * Unit & integration tests for new type.

### 13.2 Adding a New Template

Steps:

1. Admin:

   * Use `POST /admin/templates` to create new template.
2. Provide `TemplateConfig` in `config`.
3. Set `minTier`.
4. Ensure design-system tokens are used.

### 13.3 Adding New Styling Features

E.g., new layout variant or new shadow preset:

1. Extend TemplateConfig schema and card styling fields if needed.
2. Update `deriveStyling`.
3. Add UI controls in styling tabs.
4. Add tier gating if needed.
5. Add tests.

---

## 14. Analytics

Suggested events:

* `component_added`
* `component_removed`
* `component_updated`
* `component_reordered`
* `card_template_applied`
* `card_styling_updated`
* `card_custom_css_updated`
* `customization_session_started`
* `customization_session_completed`

Each event may include:

* `userId`
* `cardId`
* `templateId` (if relevant)
* `componentId` and `componentType` (if relevant)
* `tier`
* Timestamps

Events can be emitted from the backend (authoritative actions).

---

## 15. Testing Requirements

### 15.1 Backend

**Components:**

* Unit tests:

  * Tier enforcement via `tier_component_rules`.
  * Reorder transaction correctness.
  * Locked component behavior.
* Integration tests:

  * Full flows: create/update/reorder/delete.
  * Downgrade scenarios with locked components.

**Templates & Styling:**

* Unit tests:

  * Template tier gating logic.
  * Template application.
  * Styling overrides.
  * Custom CSS sanitization and size limits.
* Integration tests:

  * Apply template → check card styling fields.
  * Update template tokens → verify changes flow through.
  * Attempt to apply archived template (should fail).

### 15.2 Frontend

**Component Editor:**

* Tests for:

  * `ComponentEditDialog` validation and submission.
  * `ComponentPalette` showing/hiding locked types properly.
  * `CardComponentList` reorder behavior.

**Template & Styling Editor:**

* Tests for:

  * Template gallery UI and tier locks.
  * Styling controls updating preview correctly.
  * Custom CSS editor error handling.

**Integration / E2E (Recommended):**

* Scenario:

  * User sets identity fields.
  * Applies template.
  * Adjusts styling.
  * Adds components.
  * Reorders components.
  * Publishes card.
  * Downgrades tier → sees locked components & template constraints.

---

## 16. Known Limitations

* No real-time collaborative editing.
* No user-defined templates (only admin-defined).
* Identity Header layout is not user-configurable beyond template styling.
* Advanced styling (e.g., per-component custom CSS) out of scope for now.

---

## 17. Future Enhancements

* User-defined templates (save card styling as template).
* Template versioning and migration strategies.
* Multi-device previews (phone, tablet, desktop).
* Real-time collaboration (WebSockets).
* A/B testing across templates or layouts.
* Template marketplace or sharing.

---

## 18. Document Ownership & Maintenance

* Owned by **Nexus Engineering Lead** (or delegated maintainer).
* All changes must:

  * Be tracked via version bumps.
  * Be reviewed by backend, frontend, and product stakeholders.
  * Remain consistent with PRD, TDD, House Rules, and Design System.

Versioning guidelines:

* **Patch**: minor clarifications, typos, non-behavioral changes.
* **Minor**: non-breaking enhancements / additions.
* **Major**: changes to behavior, APIs, or invariants.

---

# End of Specification