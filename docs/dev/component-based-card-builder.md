# Component-Based Card Builder - Architecture

**Status**: 🚧 Planning Phase  
**Date**: 2025-11-27  
**Inspired By**: QRCodeChimp Digital Business Cards

---

## Overview

Transform the card customization experience from fixed layouts to a **flexible, component-based builder** where users can add, remove, reorder, and customize individual sections of their digital business cards.

---

## Key Concepts

### 1. Components (Building Blocks)

Each card is composed of **reorderable components**:

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Profile** | Basic contact info | Photo, name, title, company, contact buttons (call, email, SMS) |
| **About** | Bio/description | Rich text editor, heading customization |
| **Contact** | Detailed contact info | Phone, email, address with map integration, save to contacts button |
| **Gallery** | Image showcase | Multiple view types (list, grid, masonry), title/description |
| **Social Links** | Social media profiles | Platform icons, custom titles, follow CTAs |
| **Custom Links** | Website links | Title, subtitle, thumbnail, URL |
| **Video** | Embedded videos | YouTube, Vimeo, custom video uploads |
| **Calendar** | Scheduling | Calendly, Cal.com integration, appointment booking |
| **Form** | Lead capture | Custom fields, email integration, thank you message |
| **Testimonials** | Social proof | Customer reviews, ratings display |
| **Services** | Offerings | Service cards with pricing, descriptions |

### 2. Component Properties

Each component has:

```typescript
interface CardComponent {
  id: string;                    // Unique identifier
  type: ComponentType;           // Profile, About, Gallery, etc.
  order: number;                 // Display order (drag-drop)
  enabled: boolean;              // Show/hide toggle
  config: ComponentConfig;       // Component-specific settings
  background?: BackgroundConfig; // Per-component background
  createdAt: Date;
  updatedAt: Date;
}

type ComponentType =
  | 'PROFILE'
  | 'ABOUT'
  | 'CONTACT'
  | 'GALLERY'
  | 'SOCIAL_LINKS'
  | 'CUSTOM_LINKS'
  | 'VIDEO'
  | 'CALENDAR'
  | 'FORM'
  | 'TESTIMONIALS'
  | 'SERVICES';

interface ComponentConfig {
  // Varies by component type
  [key: string]: any;
}

interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  imageUrl?: string;
}
```

---

## Database Schema Changes

### New Tables

#### `card_components`
```sql
CREATE TABLE card_components (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- PROFILE, ABOUT, GALLERY, etc.
  order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  background_type TEXT DEFAULT 'solid',
  background_color TEXT DEFAULT '#ffffff',
  background_gradient_start TEXT,
  background_gradient_end TEXT,
  background_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, order)
);

CREATE INDEX idx_card_components_card_id ON card_components(card_id);
CREATE INDEX idx_card_components_type ON card_components(type);
CREATE INDEX idx_card_components_order ON card_components(card_id, order);
```

#### `component_templates`
```sql
CREATE TABLE component_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  default_config JSONB NOT NULL,
  preview_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Component Configurations

### Profile Component
```typescript
interface ProfileComponentConfig {
  showPhoto: boolean;
  photoUrl?: string;
  photoShape: 'circle' | 'square' | 'rounded';
  showLogo: boolean;
  logoUrl?: string;
  name: string;
  title?: string;
  company?: string;
  contactButtons: {
    showPhone: boolean;
    phoneNumber?: string;
    showEmail: boolean;
    email?: string;
    showSMS: boolean;
    smsNumber?: string;
    showWebsite: boolean;
    websiteUrl?: string;
  };
  alignment: 'left' | 'center' | 'right';
}
```

### Gallery Component
```typescript
interface GalleryComponentConfig {
  title?: string;
  description?: string;
  viewType: 'list' | 'grid' | 'masonry' | 'carousel';
  columns?: number; // For grid view
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    caption?: string;
    order: number;
  }>;
  imageRatio: '1:1' | '4:5' | '16:9' | 'auto';
  enableLightbox: boolean;
}
```

### Social Links Component
```typescript
interface SocialLinksComponentConfig {
  title?: string;
  description?: string;
  layout: 'icons' | 'cards' | 'buttons';
  iconSize: 'sm' | 'md' | 'lg';
  links: Array<{
    id: string;
    platform: string; // 'linkedin', 'twitter', etc.
    url: string;
    title?: string;
    subtitle?: string;
    icon?: string;
    order: number;
  }>;
}
```

### Form Component
```typescript
interface FormComponentConfig {
  title: string;
  description?: string;
  displayType: 'inline' | 'overlay';
  allowDismiss: boolean;
  showDelay?: number; // seconds
  fields: Array<{
    id: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // for select
    order: number;
  }>;
  submitButtonText: string;
  successMessage: string;
  emailNotifications: boolean;
  notificationEmail?: string;
  integrations?: {
    zapier?: string;
    webhook?: string;
  };
}
```

---

## Frontend Architecture

### Component Builder UI

```
┌─────────────────────────────────────────────────┐
│  Card Builder                                   │
├─────────────────┬───────────────────────────────┤
│                 │                               │
│  Components     │    Live Preview               │
│  Sidebar        │    (Device Mockup)            │
│                 │                               │
│  ┌───────────┐  │   ┌─────────────────────┐   │
│  │ + Add     │  │   │  iPhone / Android   │   │
│  │Component  │  │   │  /  Tablet          │   │
│  └───────────┘  │   │                     │   │
│                 │   │  [Profile Component]│   │
│  Drag & Drop:   │   │  [About Component]  │   │
│  ≡ Profile      │   │  [Gallery Component]│   │
│  ≡ About        │   │  [Social Links]     │   │
│  ≡ Gallery      │   │  [Contact Form]     │   │
│  ≡ Social Links │   │                     │   │
│  ≡ Contact Form │   └─────────────────────┘   │
│                 │                               │
│  [Save]         │   [Preview on Real Device]   │
└─────────────────┴───────────────────────────────┘
```

### Component Palette

```tsx
// ComponentPalette.tsx
const AVAILABLE_COMPONENTS = [
  {
    type: 'PROFILE',
    name: 'Profile',
    icon: User,
    description: 'Photo, name, title, contact buttons',
    tier: 'FREE',
  },
  {
    type: 'ABOUT',
    name: 'About',
    icon: FileText,
    description: 'Bio and description section',
    tier: 'FREE',
  },
  {
    type: 'GALLERY',
    name: 'Gallery',
    icon: Image,
    description: 'Image showcase with multiple layouts',
    tier: 'PRO',
  },
  {
    type: 'VIDEO',
    name: 'Video',
    icon: Video,
    description: 'Embed videos from YouTube or Vimeo',
    tier: 'PRO',
  },
  {
    type: 'FORM',
    name: 'Contact Form',
    icon: MessageSquare,
    description: 'Capture leads with custom forms',
    tier: 'PREMIUM',
  },
  // ... more components
];
```

### Drag & Drop Implementation

```tsx
// CardComponentList.tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export function CardComponentList({ components, onReorder, onEdit, onDelete }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(components);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    // Update order property
    const updated = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    onReorder(updated);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="components">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {components.map((component, index) => (
              <Draggable
                key={component.id}
                draggableId={component.id}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <ComponentCard
                      component={component}
                      onEdit={() => onEdit(component)}
                      onDelete={() => onDelete(component.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

### Component Renderer

```tsx
// CardComponentRenderer.tsx
export function CardComponentRenderer({ component }: { component: CardComponent }) {
  switch (component.type) {
    case 'PROFILE':
      return <ProfileComponent config={component.config} background={component.background} />;
    case 'ABOUT':
      return <AboutComponent config={component.config} background={component.background} />;
    case 'GALLERY':
      return <GalleryComponent config={component.config} background={component.background} />;
    case 'SOCIAL_LINKS':
      return <SocialLinksComponent config={component.config} background={component.background} />;
    case 'FORM':
      return <FormComponent config={component.config} background={component.background} />;
    // ... other components
    default:
      return null;
  }
}

// Public card page rendering
export function PublicCardPage({ card, components }: PublicCardProps) {
  const sortedComponents = components
    .filter(c => c.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="card-container">
      {sortedComponents.map(component => (
        <CardComponentRenderer key={component.id} component={component} />
      ))}
    </div>
  );
}
```

---

## Backend API Routes

### Component Management

```typescript
// GET /api/cards/:cardId/components
// List all components for a card
router.get('/cards/:cardId/components', async (req, res) => {
  const components = await prisma.cardComponent.findMany({
    where: { cardId: req.params.cardId },
    orderBy: { order: 'asc' },
  });
  res.json(components);
});

// POST /api/cards/:cardId/components
// Add a new component
router.post('/cards/:cardId/components', async (req, res) => {
  const { type, config, order } = req.body;
  
  // Validate tier restrictions
  const card = await prisma.card.findUnique({
    where: { id: req.params.cardId },
    include: { user: { include: { subscription: true } } },
  });
  
  if (!canUseComponent(type, card.user.subscription.tier)) {
    return res.status(403).json({ error: 'Component requires higher tier' });
  }
  
  const component = await prisma.cardComponent.create({
    data: {
      cardId: req.params.cardId,
      type,
      config,
      order: order ?? 0,
    },
  });
  
  res.json(component);
});

// PATCH /api/cards/:cardId/components/:componentId
// Update component config or order
router.patch('/cards/:cardId/components/:componentId', async (req, res) => {
  const { config, order, enabled, background } = req.body;
  
  const component = await prisma.cardComponent.update({
    where: { id: req.params.componentId },
    data: {
      ...(config && { config }),
      ...(order !== undefined && { order }),
      ...(enabled !== undefined && { enabled }),
      ...(background && {
        backgroundType: background.type,
        backgroundColor: background.color,
        backgroundGradientStart: background.gradientStart,
        backgroundGradientEnd: background.gradientEnd,
        backgroundImageUrl: background.imageUrl,
      }),
      updatedAt: new Date(),
    },
  });
  
  res.json(component);
});

// POST /api/cards/:cardId/components/reorder
// Bulk update component order
router.post('/cards/:cardId/components/reorder', async (req, res) => {
  const { components } = req.body; // [{ id, order }, ...]
  
  await prisma.$transaction(
    components.map(({ id, order }) =>
      prisma.cardComponent.update({
        where: { id },
        data: { order },
      })
    )
  );
  
  res.json({ success: true });
});

// DELETE /api/cards/:cardId/components/:componentId
// Remove a component
router.delete('/cards/:cardId/components/:componentId', async (req, res) => {
  await prisma.cardComponent.delete({
    where: { id: req.params.componentId },
  });
  
  res.json({ success: true });
});
```

---

## Migration Strategy

### Phase 1: Database & Backend (Week 1-2)
1. Create `card_components` and `component_templates` tables
2. Write migration script to convert existing card data to components
3. Implement component CRUD API endpoints
4. Add tier-based component restrictions

### Phase 2: Component Library (Week 3-4)
1. Build reusable component renderers
2. Create component config editors
3. Implement drag-drop interface
4. Add component palette with add/remove functionality

### Phase 3: Enhanced Features (Week 5-6)
1. Per-component background customization
2. Component templates and presets
3. Advanced form builder with integrations
4. Gallery with lightbox and multiple view types

### Phase 4: Testing & Polish (Week 7-8)
1. End-to-end testing of builder
2. Mobile responsiveness for all components
3. Performance optimization
4. Analytics for component engagement

---

## Tier Restrictions

| Component | FREE | PRO | PREMIUM |
|-----------|------|-----|---------|
| Profile | ✅ | ✅ | ✅ |
| About | ✅ | ✅ | ✅ |
| Social Links | ✅ (max 3) | ✅ (max 10) | ✅ (unlimited) |
| Contact | ✅ | ✅ | ✅ |
| Gallery | ❌ | ✅ (max 10 images) | ✅ (unlimited) |
| Custom Links | ✅ (max 3) | ✅ (max 10) | ✅ (unlimited) |
| Video | ❌ | ✅ (1 video) | ✅ (unlimited) |
| Calendar | ❌ | ✅ | ✅ |
| Form | ❌ | ❌ | ✅ |
| Testimonials | ❌ | ✅ | ✅ |
| Services | ❌ | ✅ | ✅ |

**Component Limits:**
- FREE: Max 3 components
- PRO: Max 8 components
- PREMIUM: Unlimited components

---

## User Experience Flow

### Adding a Component

1. User clicks **"+ Add Component"** button
2. Component palette modal opens
3. User selects component type (with tier badge)
4. Component is added to bottom of list
5. Component config editor opens automatically
6. User configures component settings
7. Live preview updates in real-time
8. User saves changes

### Reordering Components

1. User drags component card by handle icon
2. Visual indicator shows drop position
3. Other components shift to make space
4. User drops component in new position
5. Order is saved automatically
6. Live preview updates immediately

### Editing a Component

1. User clicks on component card
2. Component editor panel opens
3. User modifies settings (title, description, images, etc.)
4. Live preview updates as user types
5. User can customize component background
6. Changes are auto-saved or saved via "Save" button

---

## Advanced Features

### Component Templates

Pre-built component configurations users can insert:

- **Professional Profile**: Photo + Title + Contact buttons
- **About Me**: Rich bio with formatted text
- **Social Media Hub**: All major platforms with icons
- **Portfolio Gallery**: Grid layout with lightbox
- **Contact Form**: Standard lead capture fields

### Lock Settings (Admin/Template)

Allow admins to lock specific components:

```typescript
interface ComponentLockSettings {
  readOnly: boolean;  // User can view but not edit
  hidden: boolean;    // User cannot see or access
  required: boolean;  // Component cannot be removed
}
```

### Analytics per Component

Track engagement for each component:

```typescript
interface ComponentAnalytics {
  componentId: string;
  views: number;
  clicks: number;
  interactions: {
    buttonClicks: number;
    formSubmissions: number;
    linkClicks: number;
  };
}
```

---

## Technical Considerations

### Performance

- **Lazy Loading**: Load component editors only when opened
- **Virtual Scrolling**: For cards with many components
- **Debounced Saves**: Prevent excessive API calls during editing
- **Optimistic Updates**: Update UI immediately before server confirmation

### Accessibility

- **Keyboard Navigation**: Full keyboard support for drag-drop
- **Screen Reader Support**: ARIA labels for all interactions
- **Focus Management**: Proper focus handling in modals/editors
- **Semantic HTML**: Use proper heading hierarchy in components

### Security

- **Input Sanitization**: Sanitize all user-provided HTML/URLs
- **Image Validation**: Verify uploaded images meet size/format requirements
- **Rate Limiting**: Prevent abuse of component creation
- **XSS Protection**: Escape all user content in component renderers

---

## Comparison: Current vs New System

| Feature | Current System | Component-Based System |
|---------|----------------|------------------------|
| **Layout** | Fixed (vertical, horizontal, center) | Fully customizable with components |
| **Content Sections** | Predefined fields | Add/remove sections dynamically |
| **Ordering** | Fixed order | Drag-drop reordering |
| **Backgrounds** | Global card background | Per-component backgrounds |
| **Extensibility** | Limited to predefined fields | Easy to add new component types |
| **User Control** | Limited customization | Full control over structure |
| **Complexity** | Simple, beginner-friendly | More powerful, slight learning curve |

---

## Conclusion

The component-based card builder transforms Nexus Cards from a simple contact card to a **flexible, professional micro-website builder** similar to QRCodeChimp's approach. This architecture enables:

✅ **Greater Flexibility**: Users control exactly what appears on their card  
✅ **Better Scalability**: Easy to add new component types without refactoring  
✅ **Enhanced Monetization**: Premium components drive upgrades  
✅ **Improved UX**: Drag-drop interface is intuitive and modern  
✅ **Future-Proof**: Component architecture supports unlimited expansion  

This is a significant evolution that will require careful planning, testing, and user education, but positions Nexus Cards as a true competitor to established platforms.
