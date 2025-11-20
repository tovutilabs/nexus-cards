# Card Customization System

## Overview

The card customization system allows users to personalize their digital business cards with templates, custom styling, typography, layouts, and advanced CSS (Premium tier only). The system includes 16 pre-built templates across 5 industries with tier-based access control.

## Architecture

### Database Schema

#### CardTemplate Model

```prisma
model CardTemplate {
  id          String           @id @default(cuid())
  name        String
  slug        String           @unique
  description String?
  category    String
  industry    String[]
  config      Json
  minTier     SubscriptionTier @default(FREE)
  isActive    Boolean          @default(true)
  isFeatured  Boolean          @default(false)
  usageCount  Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  cards       Card[]

  @@index([category])
  @@index([slug])
  @@index([minTier])
  @@index([isActive])
}
```

#### Card Model Enhancements

New customization fields added:

- `logoUrl` - URL to custom logo/avatar image
- `fontFamily` - Typography font family (Inter, Roboto, Poppins, etc.)
- `fontSize` - Base font size (sm, base, lg)
- `layout` - Card layout type (vertical, horizontal, center, image-first, compact)
- `backgroundType` - Background style (solid, gradient, image)
- `backgroundColor` - Background color (hex or CSS color)
- `backgroundImage` - Background image URL
- `borderRadius` - Border radius preset (none, sm, md, lg, xl, full)
- `shadowPreset` - Box shadow preset (none, sm, md, lg, xl)
- `customCss` - Custom CSS code (Premium tier only)
- `templateId` - FK to applied template

### Template Configuration Format

Templates use a JSON configuration object:

```typescript
{
  colorScheme: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent?: '#f59e0b',
    text?: '#1f2937',
    background?: '#ffffff'
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: 'base',
    headingWeight?: 700,
    bodyWeight?: 400
  },
  layout: {
    type: 'vertical' | 'horizontal' | 'center' | 'image-first' | 'compact',
    spacing: 'tight' | 'comfortable' | 'relaxed',
    alignment?: 'left' | 'center' | 'right'
  },
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full',
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}
```

## Backend Implementation

### TemplatesModule

Location: `apps/api/src/templates/`

#### TemplatesService

**Public Methods:**

- `findAll(userTier, category?)` - Returns templates accessible to user tier, optionally filtered by category
- `findFeatured(userTier)` - Returns featured templates accessible to user
- `findByCategory(category, userTier)` - Returns templates in category accessible to user
- `findOne(id)` - Returns template by ID
- `findBySlug(slug)` - Returns template by slug
- `applyTemplateToCard(cardId, userId, templateId, userTier)` - Applies template config to card
- `updateCardCustomCss(cardId, userId, customCss, userTier)` - Updates card custom CSS (Premium only)
- `canAccessTemplate(userTier, templateTier)` - Checks if user tier can access template
- `sanitizeCustomCss(css)` - Validates and sanitizes custom CSS

**Tier Access Control:**

- FREE users: Access FREE templates only
- PRO users: Access FREE and PRO templates
- PREMIUM users: Access all templates + custom CSS

**CSS Sanitization:**

Blocks dangerous patterns:
- `@import` statements (prevent external CSS injection)
- `javascript:` URLs (XSS prevention)
- `vbscript:` URLs (legacy XSS prevention)
- `expression()` function (IE legacy exploits)
- `behavior:` property (IE legacy exploits)
- `<script>` tags (even in comments)
- `on*` event handlers (onclick, onerror, etc.)
- CSS exceeding 100KB size limit

#### TemplatesController

**Endpoints:**

```typescript
GET    /templates                        // List all accessible templates
GET    /templates/featured               // List featured templates
GET    /templates/category/:category     // List templates by category
GET    /templates/:id                    // Get template by ID
GET    /templates/slug/:slug             // Get template by slug
POST   /templates                        // Create template (ADMIN only)
PUT    /templates/:id                    // Update template (ADMIN only)
DELETE /templates/:id                    // Delete template (ADMIN only)
POST   /templates/apply/:cardId          // Apply template to card
PUT    /templates/custom-css/:cardId     // Update card custom CSS (Premium)
```

**Authentication:**

All endpoints require JWT authentication via `@UseGuards(JwtAuthGuard)`.

Admin endpoints also require `@Roles('ADMIN')` with RolesGuard.

**DTOs:**

- `CreateTemplateDto` - Validation for template creation
- `UpdateTemplateDto` - Partial update validation
- `ApplyTemplateDto` - Template application payload

### CardsModule Integration

Updated `CreateCardDto` and `UpdateCardDto` with optional customization fields:

```typescript
@IsOptional()
@IsString()
logoUrl?: string;

@IsOptional()
@IsString()
fontFamily?: string;

@IsOptional()
@IsIn(['sm', 'base', 'lg'])
fontSize?: string;

// ... (other fields)
```

## Frontend Implementation

### Customization UI

Location: `apps/web/src/app/dashboard/cards/[id]/customize/page.tsx`

**Features:**

1. **Templates Tab** - Grid of 16 templates with live preview and apply button
2. **Colors & Background Tab** - Background type selector, color picker, gradient/image URL inputs
3. **Typography Tab** - Font family dropdown, font size selector
4. **Layout Tab** - Layout type selector (5 options), border radius presets, shadow presets
5. **Advanced Tab** - Custom CSS textarea with Premium gate and live preview

**State Management:**

Uses React useState for 11 customization properties:
- templateId, logoUrl, fontFamily, fontSize, layout
- backgroundType, backgroundColor, backgroundImage
- borderRadius, shadowPreset, customCss

**API Integration:**

- `applyTemplate()` - POST to `/templates/apply/:cardId`
- `saveCustomization()` - PUT to `/cards/:cardId`
- `saveCustomCss()` - PUT to `/templates/custom-css/:cardId`

### Public Card Rendering

Location: `apps/web/src/app/p/[slug]/page.tsx`

Integrates template styles using helper utilities from `lib/card-styles.ts`:

```typescript
const cardClasses = getCardClasses({
  borderRadius: card.borderRadius || 'md',
  shadowPreset: card.shadowPreset || 'md',
});

const cardStyles = getCardStyles({
  backgroundType: card.backgroundType || 'solid',
  backgroundColor: card.backgroundColor || primaryColor,
  backgroundImage: card.backgroundImage,
});

const layoutClass = getLayoutContainerClass(card.layout || 'vertical');
const textSizeClass = getTextSizeClass(card.fontSize || 'base');
```

Custom CSS injected via:

```tsx
{card.customCss && (
  <style dangerouslySetInnerHTML={{ __html: card.customCss }} />
)}
```

### Styling Utilities

Location: `apps/web/src/lib/card-styles.ts`

**Functions:**

- `getCardClasses(options)` - Returns Tailwind classes for card styling
- `getCardStyles(options)` - Returns inline styles for backgrounds
- `getLayoutContainerClass(layout)` - Returns layout-specific classes
- `getTextSizeClass(fontSize)` - Returns font size classes

**Maps:**

- `fontFamilyMap` - Font family to CSS font-family mapping
- `fontSizeMap` - Size preset to Tailwind class mapping
- `borderRadiusMap` - Border radius preset to Tailwind class mapping
- `shadowMap` - Shadow preset to Tailwind class mapping

## Template Library

### 16 Pre-built Templates

#### Technology (3 templates)

1. **Modern Tech** (FREE)
   - Blue gradient (#3b82f6 → #1e40af)
   - Inter font, vertical layout
   - Large border radius, medium shadow

2. **Dark Mode Developer** (FREE)
   - Dark gray (#1f2937 → #111827)
   - Roboto Mono font, center layout
   - Extra large border radius, large shadow

3. **Startup Minimal** (FREE)
   - Purple gradient (#8b5cf6 → #6d28d9)
   - Poppins font, compact layout
   - Medium border radius, small shadow

#### Corporate (3 templates)

4. **Executive Professional** (PRO)
   - Navy blue (#1e40af → #1e3a8a)
   - Playfair Display font, horizontal layout
   - Small border radius, large shadow

5. **Corporate Blue** (FREE)
   - Light blue (#60a5fa → #3b82f6)
   - Inter font, vertical layout
   - Medium border radius, medium shadow

6. **Finance Pro** (PRO)
   - Dark blue (#1e3a8a → #1e293b)
   - Merriweather font, center layout
   - None border radius, extra large shadow

#### Creative (3 templates)

7. **Creative Bold** (FREE)
   - Orange gradient (#f97316 → #ea580c)
   - Montserrat font, image-first layout
   - Extra large border radius, medium shadow

8. **Artist Portfolio** (PRO)
   - Pink gradient (#ec4899 → #db2777)
   - Lora font, horizontal layout
   - Large border radius, large shadow

9. **Design Agency** (FREE)
   - Purple-pink gradient (#a855f7 → #ec4899)
   - Space Grotesk font, center layout
   - Extra large border radius, small shadow

#### Legal (2 templates)

10. **Legal Professional** (PRO)
    - Gray (#4b5563 → #374151)
    - Georgia font, vertical layout
    - Small border radius, medium shadow

11. **Law Firm Classic** (FREE)
    - Dark gray (#374151 → #1f2937)
    - Times New Roman font, center layout
    - None border radius, large shadow

#### Healthcare (3 templates)

12. **Medical Professional** (PRO)
    - Teal (#14b8a6 → #0d9488)
    - Inter font, vertical layout
    - Medium border radius, medium shadow

13. **Wellness Coach** (FREE)
    - Green (#10b981 → #059669)
    - Nunito font, horizontal layout
    - Large border radius, small shadow

14. **Healthcare Provider** (FREE)
    - Light teal (#2dd4bf → #14b8a6)
    - Open Sans font, compact layout
    - Medium border radius, medium shadow

#### Premium (2 templates)

15. **Luxury Gold** (PREMIUM)
    - Gold gradient (#f59e0b → #d97706)
    - Cormorant Garamond font, image-first layout
    - Full border radius, extra large shadow

16. **Elite Executive** (PREMIUM)
    - Black (#000000 → #1f2937)
    - Cinzel font, horizontal layout
    - None border radius, extra large shadow

## Tier-Based Access

### FREE Tier

- Access to 8 FREE templates
- Basic customization (fonts, colors, layouts)
- No custom CSS

### PRO Tier

- Access to 14 templates (FREE + PRO)
- Full basic customization
- No custom CSS

### PREMIUM Tier

- Access to all 16 templates
- Full basic customization
- Custom CSS (100KB limit, sanitized)
- Priority template updates

## Security

### CSS Sanitization

All custom CSS undergoes strict validation:

1. **Pattern Matching** - Regex blocks dangerous patterns
2. **Size Limit** - Maximum 100KB
3. **Content Security** - No external imports or scripts
4. **XSS Prevention** - Blocks javascript:, vbscript:, on* handlers
5. **Injection Prevention** - Blocks @import, expression()

### Tier Enforcement

Backend enforces tier restrictions at service layer:

```typescript
if (!this.canAccessTemplate(userTier, template.minTier)) {
  throw new ForbiddenException('Upgrade to access this template');
}

if (userTier !== SubscriptionTier.PREMIUM) {
  throw new ForbiddenException('Custom CSS requires Premium subscription');
}
```

## API Examples

### Apply Template to Card

```bash
POST /templates/apply/:cardId
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "template-uuid"
}

# Response
{
  "id": "card-uuid",
  "templateId": "template-uuid",
  "fontFamily": "Inter",
  "fontSize": "base",
  "layout": "vertical",
  "backgroundColor": "#3b82f6",
  "borderRadius": "lg",
  "shadowPreset": "md"
}
```

### Update Card Customization

```bash
PUT /cards/:cardId
Authorization: Bearer <token>
Content-Type: application/json

{
  "logoUrl": "https://example.com/logo.png",
  "fontFamily": "Roboto",
  "fontSize": "lg",
  "layout": "horizontal",
  "backgroundType": "gradient",
  "backgroundColor": "#3b82f6",
  "borderRadius": "xl",
  "shadowPreset": "lg"
}
```

### Update Custom CSS (Premium)

```bash
PUT /templates/custom-css/:cardId
Authorization: Bearer <token>
Content-Type: application/json

{
  "customCss": ".card { color: #333; font-size: 18px; }"
}
```

## Testing

### Unit Tests

Location: `apps/api/src/templates/templates.service.spec.ts`

Coverage:
- Tier-based access control (12 test cases)
- Template application with usage tracking
- CSS sanitization (9 dangerous patterns)
- Custom CSS updates with tier restrictions
- Error handling (404, 403 scenarios)

Run: `cd apps/api && npm test templates.service.spec.ts`

### E2E Tests

Location: `apps/api/test/card-customization.e2e-spec.ts`

Coverage:
- Template retrieval (all, featured, by category)
- Template application workflow
- Customization field updates
- Custom CSS with sanitization
- Tier-based access control (FREE vs PREMIUM)
- Public card rendering with templates

Run: `cd apps/api && npm run test:e2e card-customization.e2e-spec.ts`

## Development Workflow

### Adding New Templates

1. Create template config in `apps/api/prisma/seed-templates.ts`
2. Run seeding: `cd apps/api && npm run seed:templates`
3. Verify in database: `npx prisma studio`

### Modifying Template Schema

1. Update `schema.prisma`
2. Create migration: `npx prisma migrate dev --name update_templates`
3. Regenerate client: `npx prisma generate`
4. Update seed script if needed

### Customizing Frontend Styles

1. Edit utilities in `apps/web/src/lib/card-styles.ts`
2. Update mappings (fonts, sizes, shadows)
3. Test on public card page `/p/[slug]`
4. Verify in customization UI `/dashboard/cards/[id]/customize`

## Future Enhancements

### Planned Features

- [ ] Template preview in real-time before applying
- [ ] Template categories with filtering UI
- [ ] Custom template creation (admin tool)
- [ ] Template marketplace (user-submitted templates)
- [ ] A/B testing different templates for analytics
- [ ] Template versioning and rollback
- [ ] Export card as HTML with embedded styles
- [ ] Dynamic QR code styling based on template

### Performance Optimizations

- [ ] Cache frequently-used templates in Redis
- [ ] Lazy load template previews with intersection observer
- [ ] Preload featured templates on dashboard load
- [ ] Optimize CSS sanitization with compiled regex

### Analytics Integration

- [ ] Track template usage per user
- [ ] Popular template ranking algorithm
- [ ] Template conversion metrics (views → contacts)
- [ ] Heatmap of customization changes

## Troubleshooting

### Template Not Applying

**Symptom:** Template application returns 200 but styles not visible

**Solutions:**
1. Clear browser cache and hard reload (Ctrl+Shift+R)
2. Check if custom CSS is overriding template styles
3. Verify `fontFamily` is installed (fallback to sans-serif)
4. Check browser console for CSS errors

### Custom CSS Not Working

**Symptom:** Custom CSS saves but doesn't render on public card

**Solutions:**
1. Verify Premium subscription tier
2. Check CSS syntax with validator
3. Ensure CSS doesn't exceed 100KB
4. Review sanitization logs for blocked patterns
5. Use browser DevTools to inspect injected `<style>` tag

### Template Access Denied

**Symptom:** 403 Forbidden when applying template

**Solutions:**
1. Check user subscription tier in database
2. Verify template `minTier` requirement
3. Ensure `subscriptionStatus = 'ACTIVE'`
4. Check JWT token expiration

### Migration Failures

**Symptom:** Prisma migration fails with foreign key error

**Solutions:**
1. Check for existing cards with invalid `templateId`
2. Set `templateId` to NULL before migration
3. Ensure `CardTemplate` records exist before seeding
4. Run migrations in order: schema → seed → app restart

## Support

For issues or questions:
- Check existing GitHub issues
- Review house rules: `docs/house_rules.md`
- Consult TDD: `docs/tdd_nexus_cards.md`
- Contact: dev@nexus.cards
