**First, read `docs/house_rules.md` and `docs/design-system.md` and explicitly acknowledge that you will strictly follow them, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

---

## Context

The Nexus Design System is fully specified in `docs/design-system.md`, including:

* Design principles
* Design tokens (colors, typography, spacing, radii, shadows, opacity, z-index, motion)
* Layout & grid rules
* Iconography
* UI primitives & Nexus-level components
* Accessibility & interaction guidelines
* Tailwind configuration
* CSS variables in `globals.css`
* shadcn/ui configuration via `components.json`

Your task is to **implement and wire up the design system in `apps/web`** so that:

* Tailwind, CSS variables, and shadcn/ui are all aligned with the design system
* All primitives in `components/ui` use the defined tokens
* A first set of Nexus components in `components/nexus` is available and consistent
* Storybook (or equivalent) demonstrates the primitives and Nexus components

> **Important note:** If your implementation introduces any changes or refinements beyond what is currently documented, you MUST update `docs/design-system.md` so that it remains the single source of truth and reflects the final implemented state.

Assume a Next.js App Router app under `apps/web`.

---

## Tasks

### 1. Tailwind + Tokens Setup

1. Implement or update `apps/web/tailwind.config.ts` using the Tailwind configuration from `docs/design-system.md`:

   * Extend `colors` with `brand`, `neutral`, `semantic`, and shadcn-compatible color keys.
   * Extend `borderRadius`, `boxShadow`, `spacing`, `fontFamily`, `zIndex`, and `transitionDuration` as specified.
2. Ensure `content` paths cover:

   * `./app/**/*.{ts,tsx}`
   * `./components/**/*.{ts,tsx}`
   * `./components.json`

### 2. Global CSS Variables & Theme Hookup

1. Implement or update `apps/web/app/globals.css`:

   * Define the CSS variables for brand, neutral, semantic colors, typography, radii, shadows, opacity, z-index, and motion tokens as per `docs/design-system.md`.
   * Map Nexus tokens to shadcn’s expected variables (`--background`, `--foreground`, `--primary`, `--primary-foreground`, etc.) for both light (`:root`) and dark (`.dark`) themes.
   * Set the `body` font-family to `var(--font-body)` and background/foreground using `hsl(var(--background))` and `hsl(var(--foreground))`.

### 3. shadcn/ui Configuration

1. Implement or update `apps/web/components.json`:

   * Point `tailwind.config` to `tailwind.config.ts`.
   * Point `css` to `app/globals.css`.
   * Set `aliases.components` to `"@/components"` and `aliases.utils` to `"@/lib/utils"`.
   * Set `"cssVariables": true` and `"style": "default"`.

2. Confirm that the shadcn generator will emit components into `apps/web/components/ui`.

### 4. Implement UI Primitives in `components/ui`

Using shadcn/ui as a base but ensuring tokens from the design system are applied, create or update the following primitives under `apps/web/components/ui`:

* `button.tsx`
* `input.tsx`
* `textarea.tsx`
* `select.tsx`
* `checkbox.tsx`
* `radio-group.tsx`
* `switch.tsx`
* `tabs.tsx`
* `dialog.tsx`
* `dropdown-menu.tsx`
* `tooltip.tsx`
* `popover.tsx`
* `card.tsx`
* `badge.tsx`
* `alert.tsx`
* `skeleton.tsx`
* `avatar.tsx`
* `breadcrumb.tsx`
* `pagination.tsx`

For each primitive:

* Use Tailwind classes that reference the design tokens (colors, spacing, radius, shadow).
* Support size variants (`sm`, `md`, `lg`) where applicable.
* Support semantic variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, etc.) on `Button` and any relevant components.
* Implement focus states using the brand primary color and visible outlines.
* Ensure accessibility semantics (roles, ARIA attributes, keyboard focus) are correct as per shadcn defaults and the design system.

### 5. Implement Initial Nexus Components in `components/nexus`

Create the following domain-level components under `apps/web/components/nexus`:

1. `dashboard-shell.tsx`

   * Layout component with:

     * Sidebar area
     * Top header area
     * Main content area
   * Uses `Card`, `Button`, and other primitives where natural.
   * Applies spacing, typography, and background tokens.

2. `stats-card.tsx`

   * Displays:

     * Title
     * Main value
     * Optional trend indicator (e.g., +12% vs last 7 days)
     * Optional icon (using your icon system)
   * Uses `Card` primitive with appropriate radius and shadow tokens.

3. `card-list-item.tsx`

   * Represents a single user card in a list:

     * Card name/title
     * Status badge (e.g., ACTIVE/DRAFT/ARCHIVED)
     * Optional default label
     * Actions (e.g., edit, share menu)
   * Uses Nexus typography, `Badge`, and `Button` primitives.

4. `card-preview.tsx`

   * Shows a live preview of a digital card-like canvas:

     * Uses colors, radii, typography tokens
     * Structured to be responsive and reusable in the card editor.

All Nexus components must:

* Import primitives from `components/ui` (not re-implement base styling).
* Use design tokens and Tailwind utilities defined in the design system.
* Avoid hardcoded hex values, arbitrary spacing, or ad-hoc custom styles.

### 6. Storybook (or Equivalent) Setup

If not already present, set up Storybook for `apps/web`:

1. Configure Storybook to load Tailwind and `globals.css`.
2. Add stories for:

   * Core UI primitives (`Button`, `Input`, `Card`, `Alert`, etc.).
   * Nexus components (`DashboardShell`, `StatsCard`, `CardListItem`, `CardPreview`).
3. For each story:

   * Show default state, disabled state, and each key variant.
   * Confirm that colors, spacing, and typography match the design system.

### 7. Documentation

1. Create a short implementation note:

   * `docs/dev/design-system-implementation.md`
     Include:

     * Where Tailwind config lives and which tokens are defined.
     * Where CSS variables are defined and how themes work.
     * Where to find UI primitives and Nexus components.
     * A short example of how to import and use them in a Next.js page.

2. **Update the existing design system page:**

   * Review the actual implementation (Tailwind config, `globals.css`, shadcn components, Nexus components).
   * If any implementation detail differs from or extends `docs/design-system.md`, update `docs/design-system.md` so that:

     * All token values, component lists, and configuration details match what is implemented.
     * The document remains the canonical, accurate description of the live design system.

---

## Tests

You must ensure:

1. **Build & Lint**

   * `npm run lint` (or equivalent) in `apps/web` passes.
   * `npm run build` (or equivalent) in `apps/web` passes.

2. **Visual & Structural Checks**

   * Buttons, inputs, cards, and alerts:

     * Use brand colors and neutrals from tokens.
     * Use token-defined radii, shadows, and spacing.
   * Focus states are clearly visible and styled with brand primary.

3. **Storybook**

   * Storybook build (e.g., `npm run storybook` or `npm run build-storybook`) runs without errors.
   * Core primitives and Nexus components render correctly in Storybook.

4. **No Hardcoded Styling**

   * There are no hardcoded hex colors or random spacing values in primitives or Nexus components that duplicate or bypass the design tokens.
   * All styling references design tokens via Tailwind utilities and/or CSS variables set in `globals.css`.

---

## Deliverables

In your response, include:

1. **All created/updated files with full contents** (no snippets), including at least:

   * `apps/web/tailwind.config.ts`
   * `apps/web/app/globals.css`
   * `apps/web/components.json`
   * All new/updated files in `apps/web/components/ui/*`
   * All new files in `apps/web/components/nexus/*`
   * Storybook config files and stories (if created/updated)
   * `docs/dev/design-system-implementation.md`
   * Any updates made to `docs/design-system.md`

2. **List of commands** you expect to be run to:

   * Install any new dependencies
   * Build and test the app
   * Run Storybook

3. Any small notes necessary to apply the changes (e.g., required npm packages for shadcn/ui, Storybook, etc.).

Remember: all paths must be repo-relative and all code ASCII-only.

---

## Definition of Done

This prompt is complete when:

* Tailwind, CSS variables, and shadcn/ui configuration are fully aligned with `docs/design-system.md`.
* All UI primitives in `components/ui` are implemented using the design system tokens and are usable across the app.
* The initial Nexus components (`DashboardShell`, `StatsCard`, `CardListItem`, `CardPreview`) are implemented, render correctly, and depend only on primitives and design tokens.
* Storybook (or equivalent) can be used to inspect and verify the components.
* `docs/design-system.md` accurately reflects the implemented tokens, components, and configuration.
* The app builds successfully, and all changes respect `docs/house_rules.md`.
