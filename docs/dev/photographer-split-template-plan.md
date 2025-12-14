# Photographer Split Template - Implementation Plan

## Design Specifications

### Visual Analysis
Based on the reference design (Chiaki Sato business card), this template features:

**Layout:**
- 40/60 asymmetric split layout
- Vertical black divider (4px solid)
- Full-width contact footer
- Decorative geometric shapes (bottom-right corner)

**Color Palette:**
- Primary Gray: `#C8C8C8` (left section, footer)
- Secondary Gray: `#E8E8E8` (right section/photo area)
- Divider: `#000000` (black)
- Accent Gold: `#D4AF37` (triangle outline)
- Accent Mint: `#B4E7CE` (triangle fill)
- Text: `#000000` (black)

**Typography:**
- Name: Bold, uppercase, 3.5rem, vertical orientation (rotated 90° CCW)
- Title: Script/cursive font (Dancing Script or Pacifico), 1.5rem, vertical
- Contact: Regular weight, 0.95rem, horizontal

**Spacing:**
- Section padding: 2rem
- Contact item gap: 1rem
- Footer padding: 2rem

---

## Implementation Strategy

### Phase 1: Template Foundation (CSS + Database)

#### 1.1 Custom CSS Template
Create `photographer-split.css` with:
- Grid layout (40% | 4px | 60%)
- Vertical text transformations
- Photo section styling
- Contact footer layout
- Decorative SVG triangles

**File:** `apps/api/src/cards/styles/photographer-split.css`

#### 1.2 Database Template Entry
Add to `apps/api/prisma/seed-templates.ts`:
```typescript
{
  name: 'Photographer Split',
  slug: 'photographer-split',
  category: 'CREATIVE',
  tier: 'PRO',
  description: 'Bold asymmetric split design with vertical text - perfect for creatives and photographers',
  customCss: photographerSplitCss,
  primaryColor: '#C8C8C8',
  accentColor: '#000000',
  layout: 'vertical',
  previewImage: '/templates/photographer-split-preview.png'
}
```

---

### Phase 2: Component Theme System

#### 2.1 Template Theme Interface
Create `packages/shared/src/types/template-theme.ts`:

```typescript
export interface TemplateTheme {
  id: string;
  name: string;
  layout: 'horizontal' | 'vertical' | 'split' | 'centered';
  colors: {
    primary: string;      // Main background
    secondary: string;    // Alternate background
    text: string;         // Text color
    accent: string;       // Highlight color
    border?: string;      // Border color
  };
  typography: {
    fontFamily: string;
    headingSize: string;
    bodySize: string;
    headingWeight: number;
    bodyWeight: number;
  };
  spacing: {
    section: string;      // Between major sections
    component: string;    // Between components
    item: string;         // Between items within component
  };
  style: 'minimal' | 'decorative' | 'bold' | 'classic' | 'modern';
  componentDefaults: {
    showBorders: boolean;
    showShadows: boolean;
    roundedCorners: boolean;
    iconStyle: 'solid' | 'outline' | 'minimal';
  };
}
```

#### 2.2 Theme Extraction Utility
Create `apps/web/src/lib/template-themes.ts`:

```typescript
export function getTemplateTheme(customCss?: string): TemplateTheme | null {
  if (!customCss) return null;

  // Detect Photographer Split template
  if (customCss.includes('card-split-layout')) {
    return {
      id: 'photographer-split',
      name: 'Photographer Split',
      layout: 'split',
      colors: {
        primary: '#C8C8C8',
        secondary: '#E8E8E8',
        text: '#000000',
        accent: '#D4AF37',
        border: '#000000'
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        headingSize: '1.5rem',
        bodySize: '0.95rem',
        headingWeight: 700,
        bodyWeight: 400
      },
      spacing: {
        section: '2rem',
        component: '1.5rem',
        item: '1rem'
      },
      style: 'minimal',
      componentDefaults: {
        showBorders: false,
        showShadows: false,
        roundedCorners: false,
        iconStyle: 'outline'
      }
    };
  }

  // Detect Photographer Warm/Rose/Minimal (curved wave)
  if (customCss.includes('card-wave-divider')) {
    return {
      id: 'photographer-wave',
      name: 'Photographer Wave',
      layout: 'vertical',
      colors: {
        primary: extractColorFromCss(customCss, '.card-info-section') || '#D4A574',
        secondary: '#FFFFFF',
        text: '#2C2C2C',
        accent: extractColorFromCss(customCss, '.card-info-section') || '#D4A574'
      },
      // ... rest of theme config
    };
  }

  return null;
}
```

---

### Phase 3: Component Adaptations

#### 3.1 Update CardComponentList
Modify `apps/web/src/components/nexus/CardComponentList.tsx`:

```typescript
interface CardComponentListProps {
  components: CardComponent[];
  cardData: CardData;
  isEditable?: boolean;
  templateTheme?: TemplateTheme; // NEW
}

export function CardComponentList({ 
  components, 
  cardData, 
  isEditable,
  templateTheme 
}: CardComponentListProps) {
  return (
    <div className="space-y-4">
      {components.map((component) => {
        const Component = componentMap[component.type];
        return (
          <Component
            key={component.id}
            config={component.config}
            cardData={cardData}
            templateTheme={templateTheme} // Pass theme to each component
            {...otherProps}
          />
        );
      })}
    </div>
  );
}
```

#### 3.2 Update Individual Components
Each component needs to accept and use `templateTheme`:

**Gallery Component:**
```typescript
export function GalleryComponent({ 
  config, 
  cardData, 
  templateTheme 
}: ComponentProps) {
  const styles = templateTheme ? {
    backgroundColor: templateTheme.colors.secondary,
    padding: templateTheme.spacing.component,
    gap: templateTheme.spacing.item,
    borderRadius: templateTheme.componentDefaults.roundedCorners ? '8px' : '0',
    boxShadow: templateTheme.componentDefaults.showShadows ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
  } : defaultStyles;

  return (
    <div style={styles} className="gallery-component">
      {/* Gallery content */}
    </div>
  );
}
```

**Social Links Component:**
```typescript
export function SocialLinksComponent({ 
  config, 
  cardData, 
  templateTheme 
}: ComponentProps) {
  const iconStyle = templateTheme?.componentDefaults.iconStyle || 'solid';
  const iconColor = templateTheme?.colors.text || '#000000';
  
  return (
    <div style={{
      backgroundColor: templateTheme?.colors.primary,
      padding: templateTheme?.spacing.component
    }}>
      {/* Social links with theme-aware styling */}
    </div>
  );
}
```

---

### Phase 4: Template Rendering

#### 4.1 Update CardRenderView
Modify `apps/web/src/components/nexus/CardRenderView.tsx`:

```typescript
export function CardRenderView({ card, components }: CardRenderViewProps) {
  const templateTheme = getTemplateTheme(card.styling?.customCss);
  
  // Detect Photographer Split template
  const isPhotographerSplit = card.styling?.customCss?.includes('card-split-layout');
  
  if (isPhotographerSplit) {
    return (
      <div className="card-split-layout">
        {/* Left section with vertical text */}
        <div className="card-text-section">
          <div className="card-name-vertical">
            {card.firstName} {card.lastName}
          </div>
          <div className="card-title-script">
            {card.jobTitle}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="card-split-divider" />

        {/* Right section with photo */}
        <div className="card-photo-section-split">
          {card.avatarUrl && (
            <img 
              src={card.avatarUrl} 
              alt={`${card.firstName} ${card.lastName}`}
              className="card-photo-split"
            />
          )}
        </div>

        {/* Contact footer */}
        <div className="card-contact-footer">
          {card.phone && (
            <div className="contact-item">
              <span>{card.phone}</span>
              <Phone className="contact-icon" />
            </div>
          )}
          {/* ... other contact items */}
        </div>

        {/* Decorative shapes */}
        <div className="card-decorative-shapes">
          <svg viewBox="0 0 100 100">
            {/* Gold triangle outline */}
            <polygon points="50,10 90,90 10,90" 
              fill="none" 
              stroke="#D4AF37" 
              strokeWidth="2" />
            {/* Mint triangle filled */}
            <polygon points="60,20 95,85 25,85" 
              fill="#B4E7CE" 
              opacity="0.6" />
          </svg>
        </div>

        {/* Components below - with theme */}
        <div className="card-components-section">
          <CardComponentList 
            components={components}
            cardData={card}
            templateTheme={templateTheme}
          />
        </div>
      </div>
    );
  }

  // ... other template types
}
```

#### 4.2 Update CardPreview (Live Preview)
Apply same logic to `apps/web/src/components/nexus/PhoneMockup.tsx` CardPreview component.

---

### Phase 5: Template-Component CSS Integration

#### 5.1 Component CSS Variables
Each component stylesheet should check for template theme CSS variables:

```css
/* apps/web/src/components/card-components/GalleryComponent.css */
.gallery-component {
  /* Use template variables if available, fallback to defaults */
  background-color: var(--template-secondary-bg, #ffffff);
  padding: var(--template-component-spacing, 1rem);
  gap: var(--template-item-spacing, 0.75rem);
  border: var(--template-show-borders, 1px solid #e5e7eb);
  border-radius: var(--template-rounded-corners, 8px);
  box-shadow: var(--template-show-shadows, none);
}
```

#### 5.2 Inject CSS Variables
In template CSS, define variables:

```css
/* photographer-split.css */
.card-split-layout {
  --template-primary-bg: #C8C8C8;
  --template-secondary-bg: #E8E8E8;
  --template-text-color: #000000;
  --template-accent-color: #D4AF37;
  --template-section-spacing: 2rem;
  --template-component-spacing: 1.5rem;
  --template-item-spacing: 1rem;
  --template-show-borders: none;
  --template-show-shadows: none;
  --template-rounded-corners: 0;
}
```

---

## Implementation Checklist

### Phase 1: Template Foundation
- [ ] Create `photographer-split.css` with full layout CSS
- [ ] Add template to `seed-templates.ts`
- [ ] Generate preview image
- [ ] Run database seed to add template
- [ ] Test template selection in UI

### Phase 2: Theme System
- [ ] Create `template-theme.ts` types in shared package
- [ ] Create `template-themes.ts` utility for theme extraction
- [ ] Add theme detection for Photographer Split
- [ ] Add theme detection for existing Photographer Wave templates
- [ ] Add unit tests for theme extraction

### Phase 3: Component Updates
- [ ] Update `CardComponentList` to accept and pass `templateTheme`
- [ ] Update `GalleryComponent` for theme awareness
- [ ] Update `SocialLinksComponent` for theme awareness
- [ ] Update `AboutComponent` for theme awareness
- [ ] Update `ContactComponent` for theme awareness
- [ ] Update `CustomLinksComponent` for theme awareness
- [ ] Update `VideoComponent` for theme awareness

### Phase 4: Rendering Updates
- [ ] Update `CardRenderView` with Photographer Split detection
- [ ] Add split layout rendering logic
- [ ] Update `CardPreview` (PhoneMockup) with same logic
- [ ] Test public page rendering (`/p/[slug]`)
- [ ] Test customize page Live Preview

### Phase 5: CSS Integration
- [ ] Add CSS variables to Photographer Split template
- [ ] Update component stylesheets to use CSS variables
- [ ] Test component styling with template active
- [ ] Test component styling without template (fallback)

### Phase 6: Testing & Polish
- [ ] E2E test: Select Photographer Split template
- [ ] E2E test: Add components and verify styling
- [ ] E2E test: Switch between templates
- [ ] Visual regression testing
- [ ] Mobile responsiveness testing
- [ ] Accessibility testing (color contrast, screen readers)

---

## File Structure

```
nexus-cards/
├── apps/
│   ├── api/
│   │   └── src/cards/styles/
│   │       └── photographer-split.css          # NEW
│   │   └── prisma/
│   │       └── seed-templates.ts               # MODIFIED
│   └── web/
│       └── src/
│           ├── components/
│           │   ├── nexus/
│           │   │   ├── CardRenderView.tsx      # MODIFIED
│           │   │   ├── PhoneMockup.tsx         # MODIFIED
│           │   │   └── CardComponentList.tsx   # MODIFIED
│           │   └── card-components/
│           │       ├── GalleryComponent.tsx    # MODIFIED
│           │       ├── SocialLinksComponent.tsx # MODIFIED
│           │       ├── AboutComponent.tsx      # MODIFIED
│           │       ├── ContactComponent.tsx    # MODIFIED
│           │       └── types.ts                # MODIFIED
│           └── lib/
│               └── template-themes.ts          # NEW
└── packages/
    └── shared/
        └── src/
            └── types/
                └── template-theme.ts           # NEW
```

---

## Implementation Timeline

**Week 1: Foundation**
- Days 1-2: Create CSS template and database entry
- Days 3-4: Build theme system (types, utilities)
- Day 5: Testing and refinement

**Week 2: Component Integration**
- Days 1-3: Update all 6 components for theme awareness
- Days 4-5: Update rendering logic (CardRenderView, CardPreview)

**Week 3: Polish & Testing**
- Days 1-2: CSS variable integration
- Days 3-4: Comprehensive testing
- Day 5: Bug fixes and final polish

---

## Success Criteria

1. **Template Integrity**: Photographer Split template maintains exact design when applied
2. **Component Harmony**: All components adopt template's visual language automatically
3. **Flexibility**: Components can be added/removed without breaking template design
4. **Consistency**: Template looks identical on public page, live preview, and editor
5. **Responsiveness**: Template works on all device sizes
6. **Accessibility**: Meets WCAG AA standards for contrast and usability
7. **Performance**: No degradation in render time with theme system

---

## Risk Mitigation

**Risk: Component CSS conflicts with template CSS**
- Mitigation: Use CSS modules or scoped styling for components
- Mitigation: Establish clear CSS specificity hierarchy

**Risk: Theme detection fails for edge cases**
- Mitigation: Comprehensive unit tests for theme extraction
- Mitigation: Fallback to default styling if theme not detected

**Risk: Backward compatibility with existing cards**
- Mitigation: Theme system is opt-in via `templateTheme` prop
- Mitigation: Components work without theme (existing behavior)

**Risk: Performance impact from theme calculations**
- Mitigation: Memoize theme extraction with useMemo
- Mitigation: Cache theme objects to avoid recalculation

---

## Future Enhancements

1. **Template Builder UI**: Visual editor for creating custom templates
2. **Theme Variants**: Allow color scheme variations (light/dark/custom)
3. **Component Presets**: Pre-styled component sets per template
4. **Template Marketplace**: User-submitted templates with ratings
5. **AI Theme Generation**: Generate component themes from template analysis
