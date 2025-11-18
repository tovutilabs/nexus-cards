# Nexus Design System

## Overview

The Nexus Design System is a comprehensive set of design tokens, components, and patterns that define the visual language and user experience of Nexus Cards. It is built on top of shadcn/ui primitives and extends them with Nexus-specific branding, interactions, and utilities.

## Architecture

### Layer 1: Base (shadcn/ui)
- 14 primitive components from shadcn/ui library
- Located in `/apps/web/src/components/ui/`
- Provides headless, accessible base components
- Styled with Tailwind CSS and CSS variables

### Layer 2: Design Tokens
- Defined in `/apps/web/tailwind.config.ts`
- Extended CSS variables in `/apps/web/src/app/globals.css`
- Includes Nexus-specific color palettes, typography, spacing

### Layer 3: Nexus Components
- Located in `/apps/web/src/components/nexus/`
- Branded wrapper components that consume shadcn/ui primitives
- Consistent API with opinionated defaults
- Support for light/dark mode via CSS variables

## Design Tokens

### Colors

#### Primary Palette (Nexus Blue)
```css
nexus-blue-50  -> #eff6ff
nexus-blue-100 -> #dbeafe
nexus-blue-200 -> #bfdbfe
nexus-blue-300 -> #93c5fd
nexus-blue-400 -> #60a5fa
nexus-blue-500 -> #3b82f6 (Primary)
nexus-blue-600 -> #2563eb
nexus-blue-700 -> #1d4ed8
nexus-blue-800 -> #1e40af
nexus-blue-900 -> #1e3a8a
nexus-blue-950 -> #172554
```

#### Success Palette (Nexus Green)
```css
nexus-green-500 -> #22c55e (Success)
nexus-green-600 -> #16a34a
nexus-green-700 -> #15803d
```

#### Danger Palette (Nexus Red)
```css
nexus-red-500 -> #ef4444 (Danger)
nexus-red-600 -> #dc2626
nexus-red-700 -> #b91c1c
```

#### Semantic Colors
```css
--success: 142 76% 36%
--warning: 38 92% 50%
--danger: 0 84% 60%
```

### Typography

#### Font Families
- **Sans**: `var(--font-inter)` - Primary body font (system fallback)
- **Display**: `var(--font-display)` - Headings and hero text (system fallback)

#### Font Sizes
```css
text-2xs -> 0.625rem (10px)
text-xs  -> 0.75rem (12px)
text-sm  -> 0.875rem (14px)
text-base -> 1rem (16px)
text-lg  -> 1.125rem (18px)
text-xl  -> 1.25rem (20px)
text-2xl -> 1.5rem (24px)
text-3xl -> 1.75rem (28px)
text-4xl -> 2.25rem (36px)
```

### Spacing

Extended spacing scale:
```css
18  -> 4.5rem (72px)
88  -> 22rem (352px)
128 -> 32rem (512px)
```

### Border Radius

```css
--radius: 0.5rem (8px)
lg: var(--radius)
md: calc(var(--radius) - 2px)
sm: calc(var(--radius) - 4px)
```

## Components

### NexusButton

Branded button component with variants, sizes, and loading states.

**Variants:**
- `primary` - Nexus blue background (default)
- `secondary` - Muted background
- `success` - Green background
- `danger` - Red background
- `outline` - Transparent with border
- `ghost` - Transparent with hover effect
- `link` - Text link style

**Sizes:**
- `sm` - 36px height
- `default` - 40px height
- `lg` - 44px height
- `icon` - 40x40px square

**Props:**
```tsx
interface NexusButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  asChild?: boolean;
}
```

**Example:**
```tsx
<NexusButton variant="primary" size="lg" loading={false}>
  Click Me
</NexusButton>
```

### NexusCard

Branded card component with variants and hover effects.

**Variants:**
- `default` - Standard card with shadow
- `elevated` - Stronger shadow
- `outlined` - Colored border
- `gradient` - Subtle gradient background
- `glass` - Glassmorphism effect

**Hover Effects:**
- `none` - No hover effect (default)
- `lift` - Translates up on hover
- `glow` - Ring glow on hover
- `scale` - Scales up on hover

**Props:**
```tsx
interface NexusCardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass';
  hover?: 'none' | 'lift' | 'glow' | 'scale';
  title?: string;
  description?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Example:**
```tsx
<NexusCard
  variant="elevated"
  hover="lift"
  title="Card Title"
  description="Card description"
>
  Card content
</NexusCard>
```

### NexusInput

Branded input component with validation states and icons.

**Variants:**
- `default` - Standard input
- `success` - Green border (valid state)
- `error` - Red border (invalid state)
- `warning` - Yellow border (warning state)

**Sizes:**
- `sm` - 36px height
- `default` - 40px height
- `lg` - 44px height

**Props:**
```tsx
interface NexusInputProps {
  variant?: 'default' | 'success' | 'error' | 'warning';
  inputSize?: 'sm' | 'default' | 'lg';
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Example:**
```tsx
<NexusInput
  label="Email"
  variant="error"
  errorText="Invalid email format"
  leftIcon={<MailIcon />}
/>
```

### NexusBadge

Branded badge component for status indicators and labels.

**Variants:**
- `primary` - Blue background
- `success` - Green background
- `danger` - Red background
- `warning` - Yellow background
- `secondary` - Muted background
- `outline` - Transparent with border

**Sizes:**
- `sm` - Extra small
- `default` - Standard
- `lg` - Large

**Props:**
```tsx
interface NexusBadgeProps {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  dot?: boolean;
}
```

**Example:**
```tsx
<NexusBadge variant="success" dot>
  Active
</NexusBadge>
```

### NexusDialog

Branded dialog modal component.

**Sizes:**
- `sm` - 384px max width
- `default` - 512px max width
- `lg` - 672px max width
- `xl` - 896px max width
- `full` - 95vw max width

**Props:**
```tsx
interface NexusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}
```

**Example:**
```tsx
<NexusDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  footer={<NexusButton>Confirm</NexusButton>}
>
  Dialog content
</NexusDialog>
```

### NexusLayoutShell

Application shell with header, sidebar, and responsive layout.

**Props:**
```tsx
interface NexusLayoutShellProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}
```

**Example:**
```tsx
<NexusLayoutShell
  maxWidth="xl"
  header={<AppHeader />}
  sidebar={<AppSidebar />}
>
  Page content
</NexusLayoutShell>
```

## Dark Mode Support

All Nexus components support dark mode via CSS variables defined in `globals.css`. The design system uses the `prefers-color-scheme` media query and can be manually toggled via a theme switcher.

**CSS Variable Structure:**
```css
:root {
  --primary: 217 91% 60%;        /* Light mode primary */
  --background: 0 0% 100%;       /* Light mode background */
}

.dark {
  --primary: 217 91% 60%;        /* Dark mode primary (same) */
  --background: 0 0% 3.9%;       /* Dark mode background */
}
```

## Usage Guidelines

### Component Selection

1. **Use shadcn/ui primitives** (`/components/ui/`) for:
   - Internal components without brand requirements
   - Highly custom one-off components

2. **Use Nexus components** (`/components/nexus/`) for:
   - User-facing UI in dashboard, cards, admin
   - Consistent branding across the application
   - Standard patterns (buttons, forms, cards)

### Importing Components

```tsx
// Import Nexus components (preferred for user-facing UI)
import { NexusButton, NexusCard } from '@/components/nexus';

// Import shadcn/ui primitives (for internal/custom components)
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
```

### Consistency Rules

1. **Always use Nexus components** for primary actions (CTAs, form submits)
2. **Use consistent variants** across similar contexts (e.g., all success actions use `success` variant)
3. **Maintain spacing** using Tailwind's spacing scale
4. **Respect color semantics** (blue = primary, green = success, red = danger)

## Design System Showcase

Visit `/design-system` in the web app to see all components, variants, and states in action.

## Future Enhancements

- [ ] Theme switcher component
- [ ] Animation presets
- [ ] Data visualization components (charts, graphs)
- [ ] Additional form components (Select, Checkbox, Radio)
- [ ] Toast notification system (already scaffolded)
- [ ] Loading states and skeletons
- [ ] Empty states and error boundaries
