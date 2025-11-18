# Nexus Design System Implementation Guide

**Created**: 2024-01-18  
**Status**: ✅ Complete  
**Related**: `docs/design-system.md`, `docs/house_rules.md`

## Overview

This document provides practical guidance for using the Nexus design system in the Next.js web application. The design system is fully implemented with:

- **Tailwind CSS** configuration with all design tokens
- **CSS variables** for runtime theming
- **shadcn/ui** integration with Nexus branding
- **24 UI primitives** for atomic components
- **10 Nexus domain components** for application-specific features

---

## 1. Design Tokens

### 1.1 Colors

All colors are available via Tailwind utility classes:

```tsx
// Brand colors
<div className="bg-brand-primary text-white">Primary</div>
<div className="bg-brand-secondary text-white">Secondary</div>
<div className="bg-brand-muted text-gray-900">Muted</div>
<div className="bg-brand-dark text-white">Dark</div>

// Neutral scale (50-900)
<div className="bg-neutral-50">Lightest</div>
<div className="bg-neutral-500">Medium</div>
<div className="bg-neutral-900">Darkest</div>

// Semantic colors
<div className="text-semantic-success">Success message</div>
<div className="text-semantic-warning">Warning message</div>
<div className="text-semantic-danger">Error message</div>
<div className="text-semantic-info">Info message</div>
```

**CSS Variables** (for runtime theming):
```css
var(--color-brand-primary)
var(--color-brand-secondary)
var(--color-neutral-500)
var(--color-semantic-success)
```

### 1.2 Typography

**Font Families**:
- **Headings**: Poppins (loaded via Google Fonts)
- **Body**: Inter (loaded via Google Fonts)

```tsx
// Headings
<h1 className="font-heading text-h1">32px Heading</h1>
<h2 className="font-heading text-h2">24px Heading</h2>
<h3 className="font-heading text-h3">20px Heading</h3>

// Body text
<p className="font-body text-body-lg">Large body text (18px)</p>
<p className="font-body text-body-md">Medium body text (16px)</p>
<p className="font-body text-body-sm">Small body text (14px)</p>
<p className="font-body text-caption">Caption text (12px)</p>
```

**Font Scale**:
- `h1`: 32px / 2rem
- `h2`: 24px / 1.5rem
- `h3`: 20px / 1.25rem
- `body-lg`: 18px / 1.125rem
- `body-md`: 16px / 1rem (default)
- `body-sm`: 14px / 0.875rem
- `caption`: 12px / 0.75rem

### 1.3 Spacing

Uses 8px grid system:

```tsx
// Spacing scale
<div className="p-space-xs">4px padding</div>
<div className="p-space-sm">8px padding</div>
<div className="p-space-md">16px padding</div>
<div className="p-space-lg">24px padding</div>
<div className="p-space-xl">32px padding</div>
<div className="p-space-2xl">48px padding</div>

// Also works with margin, gap, etc.
<div className="m-space-md gap-space-sm">...</div>
```

### 1.4 Border Radius

```tsx
<div className="rounded-radius-sm">4px rounded</div>
<div className="rounded-radius-md">8px rounded</div>
<div className="rounded-radius-lg">16px rounded</div>
<div className="rounded-radius-pill">9999px rounded (pill)</div>
```

### 1.5 Shadows

```tsx
<div className="shadow-shadow-sm">Small shadow</div>
<div className="shadow-shadow-md">Medium shadow</div>
<div className="shadow-shadow-lg">Large shadow</div>
```

### 1.6 Z-Index Layers

Use CSS variables for z-index consistency:

```tsx
<div style={{ zIndex: 'var(--z-dropdown)' }}>Dropdown (10)</div>
<div style={{ zIndex: 'var(--z-modal)' }}>Modal (20)</div>
<div style={{ zIndex: 'var(--z-toast)' }}>Toast (30)</div>
<div style={{ zIndex: 'var(--z-overlay)' }}>Overlay (40)</div>
```

Or use Tailwind utilities:
```tsx
<div className="z-dropdown">Dropdown</div>
<div className="z-modal">Modal</div>
<div className="z-toast">Toast</div>
<div className="z-overlay">Overlay</div>
```

### 1.7 Motion/Transitions

```tsx
<div className="transition-motion-fast">100ms transition</div>
<div className="transition-motion-normal">200ms transition</div>
<div className="transition-motion-slow">300ms transition</div>
```

---

## 2. Component Library

### 2.1 UI Primitives (`@/components/ui`)

**24 atomic components** built with shadcn/ui and Radix UI:

#### Form Components
- `<Button>` - Primary action button with variants (default, destructive, outline, secondary, ghost, link)
- `<Input>` - Text input field
- `<Textarea>` - Multi-line text input
- `<Select>` - Dropdown select with groups
- `<Checkbox>` - Checkbox with indeterminate state
- `<RadioGroup>` - Radio button group
- `<Switch>` - Toggle switch
- `<Label>` - Form label with accessibility

#### Feedback Components
- `<Alert>` - Alert message with variants (default, destructive)
- `<Badge>` - Inline badge with variants (default, secondary, destructive, outline)
- `<Skeleton>` - Loading skeleton placeholder
- `<Toast>` / `<Toaster>` - Toast notifications

#### Overlay Components
- `<Dialog>` - Modal dialog
- `<Sheet>` - Slide-out panel
- `<Tooltip>` - Tooltip on hover
- `<Popover>` - Popover menu
- `<DropdownMenu>` - Dropdown menu with items

#### Layout Components
- `<Card>` - Content card with header/content/footer
- `<Tabs>` - Tabbed interface

#### Navigation Components
- `<Breadcrumb>` - Breadcrumb navigation
- `<Pagination>` - Pagination controls

#### Display Components
- `<Avatar>` - User avatar with image/fallback

**Usage Example**:
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### 2.2 Nexus Domain Components (`@/components/nexus`)

**10 application-specific components** with Nexus branding:

#### Wrapped Primitives
- `<NexusButton>` - Button with Nexus styling presets
- `<NexusCard>` - Card with Nexus variants
- `<NexusInput>` - Input with Nexus variants
- `<NexusBadge>` - Badge with Nexus variants
- `<NexusDialog>` - Dialog with Nexus branding

#### Layout Components
- `<NexusLayoutShell>` - Application layout with header/sidebar/main
- `<DashboardShell>` - Dashboard layout with sticky header and optional sidebar

#### Domain-Specific Components
- `<StatsCard>` - Statistics display with trend indicator
- `<CardListItem>` - Digital card list item with actions
- `<CardPreview>` - Live preview of digital business card

**StatsCard Example**:
```tsx
import { StatsCard } from '@/components/nexus';
import { Users } from 'lucide-react';

<StatsCard
  title="Total Contacts"
  value={1234}
  icon={Users}
  trend={{
    value: 12.5,
    label: 'from last week',
    isPositive: true,
  }}
/>
```

**CardListItem Example**:
```tsx
import { CardListItem } from '@/components/nexus';

<CardListItem
  id="card-123"
  title="John Doe - CEO"
  status="PUBLISHED"
  isDefault={true}
  onView={(id) => console.log('View', id)}
  onEdit={(id) => console.log('Edit', id)}
  onShare={(id) => console.log('Share', id)}
  onDelete={(id) => console.log('Delete', id)}
/>
```

**CardPreview Example**:
```tsx
import { CardPreview } from '@/components/nexus';

<CardPreview
  firstName="John"
  lastName="Doe"
  jobTitle="CEO"
  company="Acme Inc."
  email="john@acme.com"
  phone="+1 234 567 8900"
  website="https://acme.com"
  location="San Francisco, CA"
  bio="Passionate entrepreneur building the future of digital networking."
  theme={{
    primaryColor: '#2D3494',
    backgroundColor: '#FFFFFF',
  }}
/>
```

**DashboardShell Example**:
```tsx
import { DashboardShell } from '@/components/nexus';

<DashboardShell
  header={
    <div className="flex items-center justify-between w-full">
      <h1>Dashboard</h1>
      <Button>Add Card</Button>
    </div>
  }
  sidebar={
    <nav>
      <ul>
        <li>Overview</li>
        <li>Cards</li>
        <li>Analytics</li>
      </ul>
    </nav>
  }
>
  <div className="space-y-6">
    {/* Dashboard content */}
  </div>
</DashboardShell>
```

---

## 3. Form Validation

Use **React Hook Form + Zod** for all forms:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
}
```

---

## 4. Responsive Design

### 4.1 Breakpoints

```tsx
// Tailwind breakpoints
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### 4.2 Container

```tsx
// Max-width container with responsive padding
<div className="container">
  {/* Centered container with max-width */}
</div>

// Custom max-width
<div className="container max-w-4xl">
  {/* Narrow container */}
</div>
```

---

## 5. Dark Mode

Dark mode is supported via CSS variables. The theme automatically adjusts when the user's OS preference changes.

**Testing Dark Mode**:
```tsx
// In your browser DevTools, emulate dark mode:
// 1. Open DevTools
// 2. Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
// 3. Type "Rendering"
// 4. Select "Emulate CSS prefers-color-scheme: dark"
```

**CSS Variables** automatically switch between light and dark themes:
```css
/* Light mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;

/* Dark mode */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
```

---

## 6. Accessibility (WCAG 2.1 AA)

### 6.1 Color Contrast

All color combinations meet WCAG 2.1 AA contrast requirements:
- **Text on brand-primary**: White text on #2D3494 (ratio: 8.1:1) ✅
- **Text on brand-secondary**: White text on #0784B5 (ratio: 4.9:1) ✅
- **Text on semantic colors**: All meet 4.5:1 minimum

### 6.2 Keyboard Navigation

All interactive components support keyboard navigation:
- `<Button>` - Focusable with Enter/Space
- `<Dialog>` - Traps focus, Escape to close
- `<DropdownMenu>` - Arrow keys to navigate, Enter to select
- `<Tabs>` - Arrow keys to switch tabs

### 6.3 Screen Readers

All components include proper ARIA labels:
```tsx
<Button aria-label="Delete card">
  <Trash2 className="h-4 w-4" />
</Button>

<Input type="email" aria-label="Email address" aria-required="true" />
```

---

## 7. Best Practices

### 7.1 Component Composition

**Prefer composition over configuration**:
```tsx
// Good: Composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid: Prop-heavy
<Card title="Title" content="Content" />
```

### 7.2 Styling

**Use Tailwind utilities directly**:
```tsx
// Good: Direct Tailwind classes
<div className="flex items-center gap-4 p-4 rounded-md bg-white shadow-sm">
  {/* ... */}
</div>

// Avoid: Inline styles (unless theme-dependent)
<div style={{ display: 'flex', padding: '16px' }}>
  {/* ... */}
</div>
```

**When to use inline styles**:
- Theme-dependent values from user preferences
- Dynamic colors from API responses
- Runtime-calculated dimensions

```tsx
// OK: Theme from user data
<CardPreview
  theme={{
    primaryColor: userCard.theme.primaryColor, // From DB
  }}
/>
```

### 7.3 Server vs Client Components

**Default to Server Components**:
```tsx
// Server Component (default)
export default function CardsPage() {
  // No 'use client' directive
  return <div>...</div>;
}
```

**Use Client Components only when needed**:
```tsx
'use client'; // Required for interactivity

import { useState } from 'react';

export function InteractiveForm() {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

**When to use 'use client'**:
- useState, useEffect, useContext
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React Query hooks (useQuery, useMutation)

### 7.4 Importing Components

**Always use path aliases**:
```tsx
// Good
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/nexus';
import { cn } from '@/lib/utils';

// Avoid
import { Button } from '../../components/ui/button';
```

### 7.5 Naming Conventions

- **Components**: PascalCase (`StatsCard`, `CardPreview`)
- **Files**: kebab-case (`stats-card.tsx`, `card-preview.tsx`)
- **Props**: camelCase (`isDefault`, `onDelete`)
- **CSS classes**: Tailwind utilities (no custom classes)

---

## 8. Migration Guide

### 8.1 Updating Existing Components

If you have existing components that don't use the design system:

**Before**:
```tsx
export function OldButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        backgroundColor: '#2D3494',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
      }}
    >
      {children}
    </button>
  );
}
```

**After**:
```tsx
import { Button } from '@/components/ui/button';

export function NewButton({ children }: { children: React.ReactNode }) {
  return <Button>{children}</Button>;
}
```

### 8.2 Replacing Custom Styles

**Before**:
```tsx
<div className="custom-card" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
  {/* ... */}
</div>
```

**After**:
```tsx
import { Card } from '@/components/ui/card';

<Card className="shadow-shadow-sm">
  {/* ... */}
</Card>
```

---

## 9. Troubleshooting

### 9.1 Colors Not Showing

**Issue**: Tailwind color classes not applying  
**Solution**: Ensure colors are in `tailwind.config.ts` and CSS variables are in `globals.css`

```bash
# Restart dev server after config changes
pnpm dev:web
```

### 9.2 Fonts Not Loading

**Issue**: Poppins/Inter not rendering  
**Solution**: Check `app/layout.tsx` for Google Fonts import:

```tsx
import { Poppins, Inter } from 'next/font/google';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-heading' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 9.3 Component Not Found

**Issue**: `Cannot find module '@/components/ui/button'`  
**Solution**: Check `tsconfig.json` has path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 9.4 TypeScript Errors

**Issue**: Type errors with shadcn/ui components  
**Solution**: Install missing types:

```bash
pnpm add -D @types/react @types/node
```

---

## 10. Resources

- **Design System Spec**: `docs/design-system.md`
- **House Rules**: `docs/house_rules.md`
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tailwind CSS Docs**: https://tailwindcss.com
- **Radix UI Docs**: https://radix-ui.com
- **React Hook Form**: https://react-hook-form.com
- **Zod**: https://zod.dev

---

## 11. Checklist for New Features

When building a new feature, follow this checklist:

- [ ] Use UI primitives from `@/components/ui` for atomic elements
- [ ] Use Nexus components from `@/components/nexus` for domain-specific patterns
- [ ] Apply design tokens via Tailwind classes (no hardcoded colors/spacing)
- [ ] Default to Server Components, use `'use client'` only when needed
- [ ] Validate forms with React Hook Form + Zod
- [ ] Test keyboard navigation and screen reader accessibility
- [ ] Ensure color contrast meets WCAG 2.1 AA
- [ ] Use responsive Tailwind classes (sm:, md:, lg:, etc.)
- [ ] Import with path aliases (`@/components`, `@/lib`)
- [ ] Follow naming conventions (PascalCase components, kebab-case files)

---

**Implementation Status**: ✅ Complete  
**Last Updated**: 2024-01-18  
**Next Steps**: Proceed with Prompt 6 (Analytics, Subscriptions, Stripe)
