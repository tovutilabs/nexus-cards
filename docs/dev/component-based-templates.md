# Component-Based Template System

## Overview

The component-based template system converts hardcoded template sections into editable components. This allows users to customize template sections in the Components tab while maintaining the template's visual design.

## Architecture

### Three-Layer System

1. **Template CSS**: Defines the visual styling (colors, layouts, typography)
2. **Component Configs**: Store component settings (variant, layout options, visibility)
3. **Component Renderers**: Render components using template CSS classes

### Key Concepts

**Template Variants**: Components detect which template is active and render using template-specific CSS classes.

```typescript
// Example: ProfileComponent with basic-business variant
if (variant === 'basic-business') {
  return (
    <div className="card-basic-header">
      <div className="card-basic-avatar">...</div>
      <h1 className="card-basic-name">{name}</h1>
    </div>
  );
}
```

**Dual Rendering Path**: Cards render via components if they exist, otherwise fall back to hardcoded HTML.

```typescript
// CardRenderView.tsx
const hasTemplateComponents = components?.some(c => 
  ['PROFILE', 'CONTACT', 'SOCIAL_LINKS'].includes(c.type) && c.enabled
);

if (hasTemplateComponents) {
  // NEW: Component-based rendering
  return components.map(component => 
    <CardComponentRenderer component={component} />
  );
} else {
  // OLD: Hardcoded fallback
  return <div className="card-basic-header">...</div>;
}
```

## Supported Templates

### Basic Business Card (`basic-business`)

**Template ID**: `cmj4rc7si000010dbyxd3bz8p`  
**Slug**: `basic-business`

#### Components

1. **PROFILE** (order: 0)
   - Variant: `basic-business`
   - CSS: `.card-basic-header`, `.card-basic-avatar`, `.card-basic-name`
   - Config: `{ variant, showAvatar, showJobTitle, showCompany, showBio, avatarShape, avatarSize }`

2. **CONTACT** (order: 1)
   - Variant: `basic-business`
   - Layout: `tiles`
   - CSS: `.card-basic-contact`, `.card-basic-contact-item`, `.card-basic-contact-icon`
   - Config: `{ variant, layout, showPhone, showEmail, showWebsite, showAddress }`

3. **SOCIAL_LINKS** (order: 2)
   - Variant: `basic-business`
   - Layout: `circles`
   - CSS: `.card-basic-social`, `.card-basic-social-link`
   - Config: `{ variant, layout, title, platforms }`

#### Template Theme

```typescript
{
  id: 'basic-business',
  layout: 'vertical',
  colors: {
    primary: '#6366f1',    // Indigo
    secondary: '#8b5cf6',  // Purple
    text: '#111827',
    accent: '#6366f1',
  },
  defaultVariants: {
    PROFILE: 'basic-business',
    CONTACT: 'basic-business',
    SOCIAL_LINKS: 'basic-business',
  },
  supportedComponents: ['PROFILE', 'CONTACT', 'SOCIAL_LINKS'],
}
```

## Implementation Guide

### Adding a New Template with Components

#### Step 1: Create Template CSS

```typescript
// apps/api/prisma/seed-templates.ts
const customCss = `
.card-mytemplate-container { /* ... */ }
.card-mytemplate-header { /* ... */ }
.card-mytemplate-content { /* ... */ }
`;
```

#### Step 2: Add Component Variants

```typescript
// apps/web/src/components/card-components/ProfileComponent.tsx
if (variant === 'my-template') {
  return (
    <div className="card-mytemplate-header">
      {/* Template-specific HTML structure */}
    </div>
  );
}
```

#### Step 3: Update Template Theme Detection

```typescript
// apps/web/src/lib/template-themes.ts
export function getTemplateTheme(customCss?: string | null): TemplateTheme | null {
  if (customCss?.includes('card-mytemplate-container')) {
    return {
      id: 'my-template',
      name: 'My Template',
      defaultVariants: {
        PROFILE: 'my-template',
        // ... other components
      },
    };
  }
}
```

#### Step 4: Create Component Factory

```typescript
// apps/api/src/templates/services/template-component-factory.service.ts
const factories = {
  'my-template': () => this.createMyTemplateComponents(cardId, cardData),
};

private async createMyTemplateComponents(cardId: string, cardData: any) {
  const components = [];
  
  components.push(await this.prisma.cardComponent.create({
    data: {
      cardId,
      type: 'PROFILE',
      order: 0,
      enabled: true,
      config: {
        variant: 'my-template',
        // ... template-specific config
      },
    },
  }));
  
  return components;
}
```

#### Step 5: Add Blueprint

```typescript
const blueprints: Record<string, any> = {
  'my-template': {
    components: [
      { type: 'PROFILE', order: 0, config: { variant: 'my-template' } },
      // ... other components
    ],
  },
};
```

## Auto-Creation Flow

When a user applies a template to a card:

1. **Template Applied**: User clicks "Apply Template" in dashboard
2. **Check Components**: `applyTemplateToCard` checks if card has any components
3. **Auto-Create**: If zero components, call `TemplateComponentFactory.createComponentsForTemplate()`
4. **Create Components**: Factory creates PROFILE, CONTACT, SOCIAL_LINKS with template variant
5. **Render**: Card renders using component-based path with template CSS

## Migration Process

### Migrating Existing Cards

Use the admin endpoint to migrate cards from hardcoded rendering to component-based:

```bash
# Dry run (safe, no changes)
curl -X POST http://localhost:3001/api/admin/templates/migrate-components \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"templateSlug": "basic-business", "dryRun": true}'

# Actual migration
curl -X POST http://localhost:3001/api/admin/templates/migrate-components \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"templateSlug": "basic-business", "dryRun": false}'
```

### Response Format

```json
{
  "total": 100,
  "needsMigration": 45,
  "migrated": 45,
  "failed": 0,
  "errors": [],
  "dryRun": false
}
```

### Idempotency

The migration system is idempotent:
- Only migrates cards with **zero** components
- Safe to run multiple times
- Skips already-migrated cards automatically

## Testing

### Unit Tests

```typescript
// Test component variant rendering
describe('ProfileComponent', () => {
  it('renders basic-business variant correctly', () => {
    const component = {
      type: 'PROFILE',
      config: { variant: 'basic-business' },
    };
    
    const { container } = render(
      <ProfileComponent component={component} cardData={mockData} />
    );
    
    expect(container.querySelector('.card-basic-header')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Test auto-creation
describe('Template Application', () => {
  it('creates components when applying template', async () => {
    const card = await createCard();
    await applyTemplate(card.id, 'basic-business');
    
    const components = await getComponents(card.id);
    expect(components).toHaveLength(3);
  });
});
```

### Visual Regression Tests

```typescript
// Compare component vs hardcoded rendering
describe('Visual Regression', () => {
  it('component rendering matches hardcoded', async () => {
    const componentVersion = await screenshot('/p/component-card');
    const hardcodedVersion = await screenshot('/p/hardcoded-card');
    
    expect(componentVersion).toMatchImageSnapshot(hardcodedVersion);
  });
});
```

## Troubleshooting

### Hydration Warnings

**Issue**: "Hydration failed" console errors

**Cause**: Wrapper divs in CardComponentRenderer don't match SSR/CSR HTML

**Solution**: Template variant components render without wrapper:

```typescript
// CardComponentRenderer.tsx
const hasTemplateVariant = component.config?.variant !== 'default';
if (hasTemplateVariant) {
  return <>{renderComponent()}</>;  // No wrapper
}
```

### Components Not Showing

**Issue**: Card renders with hardcoded HTML instead of components

**Possible Causes**:
1. Card has zero components (check database)
2. Components are disabled (`enabled: false`)
3. Template detection failing (check `customCss` includes correct class)

**Debug**:
```sql
SELECT COUNT(*) FROM card_components WHERE card_id = 'YOUR_CARD_ID';
SELECT type, enabled FROM card_components WHERE card_id = 'YOUR_CARD_ID';
```

### Migration Failures

**Issue**: Migration reports failed cards

**Check Logs**:
```bash
docker compose logs api | grep -i "migrate\|error"
```

**Common Issues**:
- Missing card data (email, phone, etc.)
- Database constraints violated
- Template slug mismatch

## Performance Considerations

### Component Count

- Basic Business: 3 components
- Photographer templates: 4-6 components
- Keep component count under 10 for optimal performance

### CSS Size

- Basic Business CSS: 5,672 characters
- Limit template CSS to < 10KB for fast loading
- Use CSS minification in production

### Rendering Performance

- Component-based: ~5ms render time
- Hardcoded HTML: ~3ms render time
- Difference negligible for users

## Future Enhancements

### Planned Features

1. **Visual Component Editor**: Drag-and-drop component ordering
2. **Component Library**: Pre-built components users can add
3. **Template Marketplace**: Share templates with component configs
4. **Component Presets**: Save component configurations for reuse
5. **A/B Testing**: Test component variants automatically

### Extensibility

The system is designed for easy extension:

- Add new component types in `types.ts`
- Create variant renderers in component files
- Update factory to auto-create new components
- No changes needed to rendering logic

## API Reference

### Component Config Interface

```typescript
interface ProfileConfig {
  variant?: 'default' | 'basic-business' | 'photographer-split' | 'photographer-wave';
  showAvatar?: boolean;
  showJobTitle?: boolean;
  showCompany?: boolean;
  showBio?: boolean;
  avatarShape?: 'circle' | 'square' | 'rounded';
  avatarSize?: 'sm' | 'md' | 'lg';
}

interface ContactConfig {
  variant?: 'default' | 'basic-business';
  layout?: 'grid' | 'list' | 'tiles';
  showEmail?: boolean;
  showPhone?: boolean;
  showWebsite?: boolean;
  showAddress?: boolean;
}

interface SocialLinksConfig {
  variant?: 'default' | 'basic-business';
  layout?: 'icons' | 'buttons' | 'compact' | 'circles';
  title?: string;
  platforms?: string[];
}
```

### TemplateComponentFactory API

```typescript
class TemplateComponentFactory {
  // Create components for a template
  async createComponentsForTemplate(
    templateSlug: string,
    cardId: string,
    cardData: any
  ): Promise<CardComponent[]>
  
  // Get component blueprint (no creation)
  getBlueprint(templateSlug: string): any
}
```

### TemplatesService API

```typescript
class TemplatesService {
  // Migrate cards to component-based rendering
  async migrateTemplateCards(
    templateSlug: string,
    dryRun: boolean = true
  ): Promise<MigrationResult>
  
  // Get component blueprint for template
  async getComponentBlueprint(
    templateId: string
  ): Promise<TemplateBlueprint>
}
```

## Resources

- [Component Types](../apps/web/src/components/card-components/types.ts)
- [Template Themes](../apps/web/src/lib/template-themes.ts)
- [Component Factory](../apps/api/src/templates/services/template-component-factory.service.ts)
- [Migration Documentation](./template-to-components-migration.md)
