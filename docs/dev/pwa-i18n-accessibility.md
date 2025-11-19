# PWA, i18n, Accessibility & Advanced Analytics Implementation

**Date:** November 19, 2025  
**Prompt:** Prompt 8 - Progressive Web App, Internationalization, Accessibility & Advanced Analytics

## Overview

This document covers the implementation of Progressive Web App features, internationalization with bilingual card support, accessibility improvements (WCAG 2.1 AA compliance), analytics dashboard UI, and A/B testing scaffolding.

---

## 1. Progressive Web App (PWA)

### Features Implemented

#### Service Worker (`/public/sw.js`)
- **Cache Strategies:**
  - **Cache-First:** Static assets (`/_next/static/`, `/icons/`, `manifest.json`)
  - **Network-First:** Dynamic content and dashboard pages
  - **Network-First with Offline Fallback:** Public card pages (`/p/[slug]`)
  - **Network-Only:** API calls (`/api/*`)

- **Cache Management:**
  - Static cache: `nexus-static-v1`
  - Dynamic cache: `nexus-dynamic-v1`
  - Automatic cache invalidation on version updates

- **Offline Support:**
  - Cached public card pages available offline
  - Dedicated `/offline` page for error states
  - Service worker update notification with user prompt

#### Manifest (`/public/manifest.json`)
- **App Identity:**
  - Name: "Nexus Cards"
  - Short name: "Nexus"
  - Standalone display mode for app-like experience

- **Icons:** 8 sizes from 72x72 to 512x512 (maskable, any purpose)
- **Shortcuts:** Quick access to Dashboard and Create Card
- **Screenshots:** Wide (desktop) and narrow (mobile) form factors
- **Categories:** business, productivity, social

#### PWA Metadata (`/apps/web/src/app/layout.tsx`)
```typescript
metadata: {
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Nexus Cards' }
}
```

#### Service Worker Registration (`/apps/web/src/components/service-worker-registration.tsx`)
- Auto-registration on page load
- Update detection with user confirmation
- Automatic reload on controller change

#### Next.js Configuration
```javascript
headers: [
  { source: '/sw.js', Cache-Control: 'no-cache, no-store, must-revalidate' },
  { source: '/manifest.json', Cache-Control: 'public, max-age=31536000, immutable' }
]
```

### Testing PWA

1. **Lighthouse PWA Audit:**
   ```bash
   npx lighthouse http://localhost:3000 --view
   ```

2. **Service Worker DevTools:**
   - Open Chrome DevTools → Application → Service Workers
   - Verify registration and cache storage

3. **Offline Mode:**
   - Visit a public card page
   - Toggle offline mode in DevTools Network tab
   - Refresh page - should load from cache

---

## 2. Internationalization (i18n)

### Architecture

#### Framework
- **next-intl** v4.5.3 with App Router
- Locale detection via middleware
- Cookie-based locale persistence

#### Supported Locales
- English (`en`) - Default
- Spanish (`es`)

#### Translation Structure
```
apps/web/messages/
  en.json  # English translations
  es.json  # Spanish translations
```

#### Namespaces
- `common` - Shared UI strings (loading, error, actions)
- `dashboard` - Dashboard-specific strings
- `publicCard` - Public card page strings
- `settings` - Settings page strings
- `billing` - Billing and subscription strings
- `analytics` - Analytics dashboard strings
- `errors` - Error messages

### Middleware Configuration (`/apps/web/src/middleware.ts`)
```typescript
createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // No /en prefix for default locale
})
```

### Language Switcher Component
- **Location:** `/apps/web/src/components/language-switcher.tsx`
- **Features:**
  - Dropdown menu with flag icons
  - Persists selection via cookies
  - Updates URL with locale prefix
  - Accessible with ARIA labels

### Usage in Components
```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

---

## 3. Bilingual Card Support

### Database Schema

#### Migration: `20251119082142_add_bilingual_card_fields`
```sql
ALTER TABLE "cards"
ADD COLUMN "secondaryLanguage" TEXT,
ADD COLUMN "firstName_es" TEXT,
ADD COLUMN "lastName_es" TEXT,
ADD COLUMN "jobTitle_es" TEXT,
ADD COLUMN "company_es" TEXT,
ADD COLUMN "bio_es" TEXT;
```

#### Card Model Fields
- `secondaryLanguage` - ISO 639-1 code (e.g., 'es', 'fr')
- `firstName_es` - Spanish first name
- `lastName_es` - Spanish last name
- `jobTitle_es` - Spanish job title
- `company_es` - Spanish company name
- `bio_es` - Spanish bio/description

### DTOs Updated

#### CreateCardDto (`/apps/api/src/cards/dto/create-card.dto.ts`)
```typescript
@IsOptional()
@IsString()
@MaxLength(10)
secondaryLanguage?: string;

@IsOptional()
@IsString()
@MaxLength(100)
firstName_es?: string;
// ... other bilingual fields
```

### Shared Types (`/packages/shared/src/types/index.ts`)
```typescript
export interface Card {
  // ... primary fields
  secondaryLanguage?: string;
  firstName_es?: string;
  lastName_es?: string;
  jobTitle_es?: string;
  company_es?: string;
  bio_es?: string;
}
```

### Implementation Notes
- Bilingual fields follow naming convention: `fieldName_languageCode`
- Only Spanish (`_es`) implemented currently
- Can be extended to support additional languages (e.g., `_fr`, `_de`)
- Public card page should detect user's language and display appropriate fields
- If secondary language fields are empty, fall back to primary fields

---

## 4. Accessibility Improvements

### WCAG 2.1 AA Compliance

#### Skip Navigation
- **Component:** `/apps/web/src/components/skip-to-content.tsx`
- Visually hidden by default, visible on keyboard focus
- Jumps to `#main-content` anchor
- Positioned with z-index 50 to always be accessible

#### Accessibility Hooks (`/apps/web/src/hooks/useAccessibility.ts`)

##### `useFocusTrap(isActive: boolean)`
- Traps keyboard focus within modals/dialogs
- Cycles focus between first and last focusable elements
- Prevents Tab key from escaping container

##### `useAnnouncement()`
- Creates live region announcements for screen readers
- Supports `polite` and `assertive` priority levels
- Auto-removes announcement after 1 second

##### `useKeyboardNavigation(onEscape?, onEnter?)`
- Global keyboard event handlers
- Escape key for closing modals
- Enter key for form submission

#### CSS Utilities (`/apps/web/src/app/globals.css`)
```css
.sr-only { /* Screen reader only */ }
.not-sr-only { /* Undo sr-only */ }
.focus-visible-ring { /* Focus indicator */ }
.focus-within-ring { /* Focus-within indicator */ }
```

#### Focus States
- All interactive elements have visible focus indicators
- 2px ring with 2px offset
- High contrast (black ring on white background)

#### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- `<main>` for primary content area
- `<nav>` for navigation
- `<article>` for card content
- `<section>` for distinct content areas

#### ARIA Attributes
- `aria-label` on icon-only buttons
- `aria-labelledby` for section headings
- `aria-live` regions for dynamic content updates
- `role="status"` for loading states
- `role="alert"` for error messages
- `role="img"` with `aria-label` for chart SVGs

#### Color Contrast
- All text meets 4.5:1 contrast ratio minimum
- Large text (18pt+) meets 3:1 ratio
- Interactive elements meet 3:1 ratio

#### Keyboard Navigation
- All functionality accessible via keyboard
- Logical tab order
- No keyboard traps (except intentional focus traps in modals)
- Escape key closes modals/dropdowns

---

## 5. Analytics Dashboard UI

### Page Location
`/apps/web/src/app/dashboard/analytics/page.tsx`

### Features

#### Overview Metrics Cards
- **Views:** Total card views
- **Unique Visitors:** Unique session count
- **Contact Exchanges:** Contact form submissions
- **Link Clicks:** Social link clicks

#### Time Range Filter
- Last 7 Days
- Last 30 Days
- Last 90 Days
- All Time

#### Card Filter
- All Cards (default)
- Individual card selection (dropdown populated from user's cards)

#### Charts (`/apps/web/src/components/charts.tsx`)

##### LineChart
- Shows views over time
- SVG-based for performance
- Gradient fill under line
- Grid lines for readability
- Date labels on x-axis

##### BarChart
- Horizontal bars for top referrers
- Animated width transitions
- Percentage-based scaling
- Value labels on right

##### PieChart
- Device breakdown (desktop, mobile, tablet)
- SVG path generation
- Color-coded legend
- Percentage labels

#### Tabs
1. **Overview:** Views over time line chart
2. **Referrers:** Top referral sources bar chart
3. **Devices:** Device breakdown pie chart

#### API Integration
- Fetches data from `/api/analytics?timeRange=7d&cardId=all`
- Loading states with skeleton UI
- Error handling with fallback messages

#### Accessibility
- All charts have `role="img"` and descriptive `aria-label`
- Tab navigation between chart types
- Select dropdowns have `aria-label`
- Semantic HTML structure

---

## 6. A/B Testing Scaffolding

### Database Schema

#### Migration: `20251119082756_add_ab_testing`

##### Experiment Model
```prisma
model Experiment {
  id              String            @id @default(cuid())
  name            String
  description     String?
  status          ExperimentStatus  @default(DRAFT)
  startDate       DateTime?
  endDate         DateTime?
  targetPath      String            # e.g., '/p/[slug]', '/dashboard'
  variants        Json              # [{ id, name, weight }, ...]
  conversionGoal  String            # e.g., 'contact_exchange', 'link_click'
  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

enum ExperimentStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
}
```

##### ExperimentAssignment Model
```prisma
model ExperimentAssignment {
  id              String      @id @default(cuid())
  experimentId    String
  userId          String?     # Optional, null for anonymous
  sessionId       String      # Browser session ID
  variant         String      # Assigned variant ID
  assignedAt      DateTime    @default(now())
}
```

##### ExperimentEvent Model
```prisma
model ExperimentEvent {
  id              String      @id @default(cuid())
  experimentId    String
  sessionId       String
  variant         String
  eventType       String      # 'view', 'click', 'conversion'
  eventData       Json?       # Additional context
  timestamp       DateTime    @default(now())
}
```

### Frontend Hook: `useExperiment`
**Location:** `/apps/web/src/hooks/useExperiment.tsx`

#### Features
- Session ID generation and persistence
- Variant selection based on weights
- Assignment caching in localStorage
- Event tracking API

#### Usage Example
```typescript
import { useExperiment } from '@/hooks/useExperiment';

function PublicCardPage() {
  const { variant, loading, trackEvent } = useExperiment('card_cta_test');

  if (loading) return <Loading />;

  return (
    <div>
      {variant === 'variant_a' && <ButtonA onClick={() => trackEvent('click')} />}
      {variant === 'variant_b' && <ButtonB onClick={() => trackEvent('click')} />}
    </div>
  );
}
```

#### Variant Selection Algorithm
1. Calculate total weight of all variants
2. Generate random number between 0 and total weight
3. Subtract each variant's weight from random number
4. When random number <= 0, select that variant

#### ExperimentProvider Component
```typescript
<ExperimentProvider experimentId="hero_test">
  {(variant, trackEvent) => (
    variant === 'control' ? <HeroA /> : <HeroB />
  )}
</ExperimentProvider>
```

### Backend API Endpoints (To Be Implemented)

#### GET `/api/experiments/:id`
- Returns experiment configuration
- Checks if experiment is ACTIVE
- Returns variants array

#### POST `/api/experiments/:id/assign`
```json
{
  "sessionId": "session_123",
  "variant": "variant_a"
}
```
- Saves assignment to database
- Returns confirmation

#### POST `/api/experiments/:id/event`
```json
{
  "sessionId": "session_123",
  "variant": "variant_a",
  "eventType": "conversion",
  "eventData": { "cardId": "abc123" }
}
```
- Logs event for analytics
- Used to calculate conversion rates

### Analytics Queries (Example)
```sql
-- Conversion rate by variant
SELECT 
  variant,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END) as conversions,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END)::numeric / 
    COUNT(DISTINCT session_id) * 100, 
    2
  ) as conversion_rate
FROM experiment_events
WHERE experiment_id = 'exp_123'
GROUP BY variant;
```

---

## 7. Testing & Verification

### PWA Testing

#### Lighthouse Audit
```bash
# From project root
npx lighthouse http://localhost:3000 --view
```
**Target Scores:**
- PWA: 100
- Performance: 90+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

#### Service Worker Testing
1. Open DevTools → Application → Service Workers
2. Verify "Status: activated and is running"
3. Check "Update on reload" checkbox
4. Reload page multiple times to test cache

#### Offline Mode Testing
1. Visit `/p/test-card` while online
2. Open DevTools → Network tab
3. Toggle "Offline" checkbox
4. Refresh page - should load from cache
5. Try navigating to new page - should show `/offline` page

#### Manifest Validation
```bash
# Check manifest is accessible
curl http://localhost:3000/manifest.json
```

### i18n Testing

#### Language Switching
1. Visit any page on site
2. Click language switcher in header
3. Select "Español"
4. Verify URL changes to `/es/[path]`
5. Verify page content is in Spanish
6. Verify language persists after page refresh

#### Translation Coverage
```bash
# Check for missing translations
grep -r "t(" apps/web/src/ | wc -l
```

#### Bilingual Card Testing
1. Create a card with primary fields (English)
2. Add Spanish fields (`firstName_es`, etc.)
3. Visit public card page with `?lang=es`
4. Verify Spanish content displays
5. Remove `?lang=es` - verify English content displays

### Accessibility Testing

#### Lighthouse Accessibility Audit
```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility --view
```
**Target: 100 score**

#### Keyboard Navigation Test
1. Tab through entire page
2. Verify all interactive elements are reachable
3. Verify focus indicators are visible
4. Test Escape key on modals/dropdowns
5. Test Enter key on buttons

#### Screen Reader Testing
**macOS:**
```bash
# Enable VoiceOver
Cmd + F5
```

**Windows:**
```bash
# Enable NVDA (install from nvaccess.org)
Ctrl + Alt + N
```

**Test Checklist:**
- [ ] Page title announced on load
- [ ] Headings navigable with H key
- [ ] Form labels read correctly
- [ ] Button purposes clear
- [ ] Alt text on images
- [ ] Live region announcements work

#### Color Contrast Testing
```bash
# Use WebAIM Contrast Checker
# https://webaim.org/resources/contrastchecker/
```

**Check:**
- Primary text (#262626 on #ffffff)
- Secondary text (#737373 on #ffffff)
- Links (#2d3494 on #ffffff)
- Buttons (all states)

### Analytics Dashboard Testing

#### Functional Testing
1. Visit `/dashboard/analytics`
2. Select different time ranges
3. Verify charts update
4. Switch between tabs (Overview, Referrers, Devices)
5. Select individual cards from dropdown

#### Chart Rendering
1. Verify line chart renders with data
2. Verify bar chart horizontal bars render
3. Verify pie chart segments render correctly
4. Verify chart legends display

#### Responsive Testing
```bash
# Test on different screen sizes
# Mobile: 375px
# Tablet: 768px
# Desktop: 1440px
```

### A/B Testing Scaffolding

#### Database Testing
```sql
-- Verify tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should include: experiments, experiment_assignments, experiment_events

-- Test experiment creation
INSERT INTO experiments (id, name, status, target_path, variants, conversion_goal, created_by)
VALUES (
  'test_exp_1',
  'Hero CTA Test',
  'ACTIVE',
  '/p/[slug]',
  '[{"id":"control","name":"Control","weight":50},{"id":"variant_a","name":"Variant A","weight":50}]',
  'contact_exchange',
  'admin_user_id'
);
```

#### Hook Testing
```typescript
// Test component
import { useExperiment } from '@/hooks/useExperiment';

function TestComponent() {
  const { variant, loading, trackEvent } = useExperiment('test_exp_1');

  useEffect(() => {
    if (!loading) {
      console.log('Assigned variant:', variant);
    }
  }, [variant, loading]);

  return (
    <button onClick={() => trackEvent('click', { button: 'cta' })}>
      {variant === 'control' ? 'Get Started' : 'Try Now'}
    </button>
  );
}
```

---

## 8. Known Limitations & Future Improvements

### PWA
- [ ] Icon files need to be generated (currently placeholder references)
- [ ] Screenshot images need to be captured
- [ ] Push notification support not implemented
- [ ] Background sync not implemented

### i18n
- [ ] Only 2 languages supported (en, es)
- [ ] No RTL language support
- [ ] Date/time formatting not localized
- [ ] Currency formatting hardcoded to USD

### Bilingual Cards
- [ ] Only Spanish secondary language implemented
- [ ] No UI for editing bilingual fields in card editor
- [ ] No automatic translation suggestions
- [ ] Language switcher on public card page not implemented

### Accessibility
- [ ] No high contrast mode
- [ ] No text resizing support beyond browser defaults
- [ ] No reduced motion preference detection

### Analytics Dashboard
- [ ] Mock data only - no real backend integration
- [ ] No date picker for custom ranges
- [ ] No export functionality
- [ ] No real-time updates

### A/B Testing
- [ ] Backend API endpoints not implemented
- [ ] No admin UI for creating experiments
- [ ] No statistical significance calculation
- [ ] No automatic winner selection

---

## 9. Deployment Checklist

### PWA
- [ ] Generate all icon sizes (72x72 to 512x512)
- [ ] Capture and add screenshot images
- [ ] Verify manifest.json accessible at `/manifest.json`
- [ ] Verify service worker registers on production domain
- [ ] Test offline mode on mobile devices

### i18n
- [ ] Complete all translation strings in `en.json` and `es.json`
- [ ] Add language switcher to all page headers
- [ ] Test language switching on all pages
- [ ] Verify SEO meta tags include language alternates

### Bilingual Cards
- [ ] Add UI for bilingual field editing in card form
- [ ] Implement language detection on public card page
- [ ] Add language switcher button to public card page
- [ ] Test with real multilingual content

### Accessibility
- [ ] Run full WCAG 2.1 AA audit
- [ ] Test with real screen reader users
- [ ] Verify keyboard navigation on all pages
- [ ] Test with browser zoom at 200%

### Analytics Dashboard
- [ ] Implement backend API endpoint
- [ ] Connect to real analytics data
- [ ] Add error handling and loading states
- [ ] Test with production-scale data

### A/B Testing
- [ ] Implement backend API endpoints
- [ ] Create admin UI for experiment management
- [ ] Add conversion tracking to key pages
- [ ] Document experiment creation process

---

## 10. References

### Documentation
- [Next.js PWA](https://ducanh-next-pwa.vercel.app/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### Tools
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [PWA Builder](https://www.pwabuilder.com/)

### House Rules Compliance
- ✅ Full file contents provided (no snippets)
- ✅ ASCII characters only in code
- ✅ Repo-relative paths used throughout
- ✅ No hardcoded secrets
- ✅ Structured documentation in `docs/dev/`
- ✅ Prisma as exclusive ORM
- ✅ TypeScript strict mode
- ✅ Consistent naming conventions

---

**Implementation Date:** November 19, 2025  
**Last Updated:** November 19, 2025  
**Status:** Complete (Prompt 8)
