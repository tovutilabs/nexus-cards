# Nexus Design System
Version 2.0.0

This document defines the visual and interaction language for the Nexus web application (dashboard, public cards, admin). All frontend implementation MUST conform to this design system to ensure UI consistency.

---

## 1. Design Principles

These principles guide every UI decision:

1. **Clarity**  
   - Interfaces must be easy to scan and understand.
   - Clear hierarchy, minimal clutter, obvious calls to action.

2. **Consistency**  
   - Use the same patterns, components, spacing, and labels for the same concepts.
   - Never restyle primitives ad-hoc; always use tokens and Nexus components.

3. **Efficiency**  
   - Fewer clicks, fewer decisions, clear shortcuts.
   - Reduce cognitive load through predictable layouts and behaviors.

4. **Scalability**  
   - Components and patterns must work for current features and future growth.
   - Consider multiple languages, themes, and new modules.

5. **Accessibility**  
   - WCAG 2.1 AA or better.
   - Keyboard-first, screen-reader-friendly, sufficient contrast.

6. **Professional and Minimal**  
   - Clean, modern, understated visual style.
   - Avoid excessive decoration; function over flourish.

---

## 2. Design Tokens

Design tokens are the single source of truth for visual styles. They must be implemented as:

- CSS variables (for runtime theming).
- Tailwind config extensions (for utility classes).

### 2.1 Color Tokens

Example values; you can tweak them, but keep the structure.

**Brand**

- `color.brand.primary` – `#2D3494`
- `color.brand.secondary` – `#0784B5`
- `color.brand.muted` – `#BBDCF2`
- `color.brand.dark` – `#1A1E4D`

**Neutrals**

- `color.neutral.50` – `#FAFAFA`
- `color.neutral.100` – `#F5F5F5`
- `color.neutral.200` – `#E5E5E5`
- `color.neutral.300` – `#D4D4D4`
- `color.neutral.400` – `#A3A3A3`
- `color.neutral.500` – `#737373`
- `color.neutral.600` – `#525252`
- `color.neutral.700` – `#404040`
- `color.neutral.800` – `#262626`
- `color.neutral.900` – `#171717`

**Semantic**

- `color.semantic.success` – `#16A34A`
- `color.semantic.warning` – `#F59E0B`
- `color.semantic.danger` – `#DC2626`
- `color.semantic.info` – `#2563EB`

**Background and Surface**

- `color.bg.app` – main app background (typically neutral 50 or 100)
- `color.bg.card` – card surfaces (neutral 0–100)
- `color.bg.elevated` – modals, menus, dropdowns

**Text**

- `color.text.primary` – neutral 900
- `color.text.secondary` – neutral 600
- `color.text.muted` – neutral 500
- `color.text.inverse` – for use on dark backgrounds

### 2.2 Typography Tokens

**Font families**

- `font.family.heading` – "Poppins", "Inter", system-ui, sans-serif
- `font.family.body` – "Inter", system-ui, sans-serif

**Font sizes** (assuming 16px root)

- `font.size.h1` – 32px
- `font.size.h2` – 28px
- `font.size.h3` – 24px
- `font.size.subtitle` – 18px
- `font.size.body` – 16px
- `font.size.small` – 14px
- `font.size.caption` – 12px

**Line height**

- `font.lineHeight.tight` – 1.2
- `font.lineHeight.normal` – 1.5
- `font.lineHeight.relaxed` – 1.7

**Weights**

- `font.weight.regular` – 400
- `font.weight.medium` – 500
- `font.weight.semibold` – 600
- `font.weight.bold` – 700

### 2.3 Spacing Tokens (8px grid)

- `space.xs` – 4px
- `space.sm` – 8px
- `space.md` – 16px
- `space.lg` – 24px
- `space.xl` – 32px
- `space.2xl` – 48px

### 2.4 Radii Tokens

- `radius.sm` – 4px
- `radius.md` – 8px
- `radius.lg` – 16px
- `radius.pill` – 9999px

### 2.5 Shadow Tokens

- `shadow.sm` – 0 1px 2px rgba(0, 0, 0, 0.05)
- `shadow.md` – 0 4px 6px rgba(0, 0, 0, 0.1)
- `shadow.lg` – 0 10px 15px rgba(0, 0, 0, 0.2)

### 2.6 Opacity Tokens

- `opacity.disabled` – 0.6
- `opacity.muted` – 0.75
- `opacity.overlay` – 0.5

### 2.7 Z-Index Tokens

- `z.base` – 0
- `z.dropdown` – 10
- `z.modal` – 20
- `z.toast` – 30
- `z.overlay` – 40

### 2.8 Motion Tokens

- `motion.duration.fast` – 100ms
- `motion.duration.normal` – 200ms
- `motion.duration.slow` – 300ms

- `motion.easing.standard` – ease-in-out

---

## 3. Layout and Grid

### 3.1 Breakpoints

- `sm` – 640px
- `md` – 768px
- `lg` – 1024px
- `xl` – 1280px
- `2xl` – 1536px

### 3.2 Layout Rules

- Dashboard content width: max 1200px centered.
- Side navigation for desktop; collapsible drawer on mobile.
- Public cards: mobile-first; scale up responsively.

Use Flexbox for toolbars and navbars; CSS Grid for card lists and analytics layouts.

---

## 4. Iconography

- Use an outline icon set such as Lucide icons.
- Stroke weight: 1.5–2px.
- Sizes:
  - `icon.size.sm` – 16px
  - `icon.size.md` – 20px
  - `icon.size.lg` – 24px
- Color:
  - Default: `color.text.secondary`
  - In buttons: inherits text color from variant.

Centralize icon imports and exports to keep naming consistent.

---

## 5. Component Library

### 5.1 Layers

1. UI primitives (`components/ui/*`)
2. Nexus components (`components/nexus/*`)
3. Layouts and page blocks (`components/layouts/*`, `components/sections/*`)

### 5.2 Required UI Primitives

Primitives should be based on shadcn/ui components but themed with Nexus tokens:

- Button
- Input
- Textarea
- Select
- Checkbox
- RadioGroup
- Switch
- Tabs
- Dialog
- DropdownMenu
- Tooltip
- Popover
- Card
- Badge
- Alert
- Skeleton
- Avatar
- Breadcrumb
- Pagination

Each component must support:
- Size variants: `sm`, `md`, `lg`.
- Semantic variants: `primary`, `secondary`, `ghost`, `outline`, `danger`, etc.
- Disabled and loading states where applicable.

### 5.3 Nexus Components

Examples:

- `DashboardShell`
- `StatsCard`
- `CardListItem`
- `CardEditorSidebar`
- `CardPreview`
- `TagAssociationPanel`
- `ContactListItem`
- `AnalyticsChartCard`

These are composites built from primitives and must not bypass design tokens.

---

## 6. Interaction and Behavior

- Hover states should increase contrast and/or elevation subtly.
- Focus states must be clearly visible (outline using brand primary).
- Active states may slightly reduce brightness or adjust shadow.
- Modals:
  - Trap focus inside.
  - Close on ESC and overlay click (unless destructive confirmation).
- Forms:
  - Show inline validation errors below the field.
  - Use semantic danger color for errors.

---

## 7. Accessibility

Target WCAG 2.1 AA:

- Minimum contrast ratio 4.5:1 for body text.
- All interactive elements reachable by keyboard.
- Visible focus outlines.
- Use semantic HTML elements.
- Use ARIA roles and attributes only when necessary.

---

## 8. Naming, Code Style, and File Structure

### 8.1 Component Names and Props

- Components: PascalCase (e.g., `CardPreview`).
- Booleans: prefixed with `is` or `has` when it clarifies meaning.
- Common props: `variant`, `size`, `disabled`, `loading`, `className`.

### 8.2 File Structure

```text
apps/web/
  components/
    ui/          # shadcn-based primitives
    nexus/       # domain-specific Nexus components
    layouts/     # layout shells
    charts/      # analytics charts
  app/
    ...
```

---

## 9. Documentation and Tooling

- Use Storybook or similar for all primitives and key Nexus components.
- Each component should have usage examples for main variants and states.
- Use eslint-plugin-jsx-a11y for linting accessibility patterns.

---

## 10. Governance

- Any new token or component must be:
  - Proposed, reviewed, and accepted.
  - Documented in `docs/design-system.md` or a sub-doc under `docs/dev/design-system/`.
- Breaking changes to the design system must be versioned and recorded in a changelog.

---

## 11. Implementation Reference: Tailwind, CSS Variables, and shadcn Configuration

This section shows concrete code for Tailwind, CSS variables, and shadcn configuration that align with this design system.

### 11.1 Tailwind Config (tailwind.config.ts)

Place this in `apps/web/tailwind.config.ts` (adjust `content` paths according to your monorepo setup):

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./components.json"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2D3494",
          secondary: "#0784B5",
          muted: "#BBDCF2",
          dark: "#1A1E4D"
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717"
        },
        semantic: {
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          info: "#2563EB"
        },
        // shadcn/ui variables mapped for convenience
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
        full: "9999px"
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.2)"
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px"
      },
      fontFamily: {
        heading: ["Poppins", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      },
      zIndex: {
        base: "0",
        dropdown: "10",
        modal: "20",
        toast: "30",
        overlay: "40"
      },
      transitionDuration: {
        fast: "100ms",
        normal: "200ms",
        slow: "300ms"
      }
    }
  },
  plugins: [
    require("tailwindcss-animate")
  ]
};

export default config;
```

### 11.2 CSS Variables and shadcn Theme (globals.css)

In `apps/web/app/globals.css` (or your global stylesheet), define CSS variables that map Nexus tokens to shadcn/ui's expected variables:

```css
:root {
  /* Nexus brand tokens */
  --color-brand-primary: #2d3494;
  --color-brand-secondary: #0784b5;
  --color-brand-muted: #bbdcf2;
  --color-brand-dark: #1a1e4d;

  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  --color-semantic-success: #16a34a;
  --color-semantic-warning: #f59e0b;
  --color-semantic-danger: #dc2626;
  --color-semantic-info: #2563eb;

  --font-heading: "Poppins", "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);

  --opacity-disabled: 0.6;
  --opacity-muted: 0.75;
  --opacity-overlay: 0.5;

  --z-base: 0;
  --z-dropdown: 10;
  --z-modal: 20;
  --z-toast: 30;
  --z-overlay: 40;

  --motion-duration-fast: 100ms;
  --motion-duration-normal: 200ms;
  --motion-duration-slow: 300ms;
  --motion-easing-standard: ease-in-out;

  /* shadcn/ui color system mapped to Nexus tokens */
  --background: 0 0% 100%;
  --foreground: 240 10% 10%;

  --card: 0 0% 100%;
  --card-foreground: 240 10% 10%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 10%;

  --primary: 234 53% 37%; /* approximate HSL of #2D3494 */
  --primary-foreground: 0 0% 100%;

  --secondary: 199 92% 37%; /* approximate HSL of #0784B5 */
  --secondary-foreground: 0 0% 100%;

  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  --accent: 210 40% 96%;
  --accent-foreground: 240 10% 10%;

  --destructive: 0 72% 51%; /* #DC2626 */
  --destructive-foreground: 0 0% 100%;

  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 234 53% 37%;

  --radius: 8px;
}

.dark {
  --background: 240 10% 5%;
  --foreground: 0 0% 100%;

  --card: 240 10% 5%;
  --card-foreground: 0 0% 100%;

  --popover: 240 10% 5%;
  --popover-foreground: 0 0% 100%;

  --primary: 234 53% 55%;
  --primary-foreground: 0 0% 100%;

  --secondary: 199 92% 45%;
  --secondary-foreground: 0 0% 100%;

  --muted: 240 10% 15%;
  --muted-foreground: 240 5% 65%;

  --accent: 240 10% 15%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;

  --border: 240 10% 25%;
  --input: 240 10% 25%;
  --ring: 234 53% 55%;
}

body {
  font-family: var(--font-body);
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

### 11.3 shadcn/ui Configuration (components.json)

In the root of `apps/web`, add or update `components.json` like this:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

This tells shadcn/ui to:

- Use `tailwind.config.ts` for utilities.
- Use `app/globals.css` where we defined the CSS variables.
- Generate components into `components/ui` which are already wired to our tokens.

---

With Tailwind, CSS variables, and shadcn configured this way, all primitives and Nexus components can reliably use this design system without ad-hoc styling.
