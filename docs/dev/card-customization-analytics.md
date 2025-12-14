# Card Customization Analytics Events

**Last Updated**: December 8, 2025  
**Status**: Active

## Overview

This document defines analytics events for the card customization feature. Events track user engagement with templates, styling, and components to inform product decisions and measure feature adoption.

## Event Catalog

### 1. Customization Session Events

#### `CUSTOMIZATION_SESSION_STARTED`

**Description**: Fired when user enters the customization page and initial data loads.

**Emitted**: Frontend - customization page mount

**Payload**:
```typescript
{
  userId: string;          // User ID (not email/PII)
  cardId: string;          // Card being customized
  templateId?: string;     // Current template (if any)
  tier: SubscriptionTier;  // User's subscription tier
  componentCount: number;  // Number of components on card
  timestamp: Date;         // Event timestamp
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "templateId": "template_modern_pro",
  "tier": "PRO",
  "componentCount": 3,
  "timestamp": "2025-12-08T10:30:00Z"
}
```

**Analysis Use Cases**:
- Track customization page visits
- Measure engagement by tier
- Identify most customized cards

---

#### `CUSTOMIZATION_SESSION_COMPLETED`

**Description**: Fired when user leaves customization page or session ends.

**Emitted**: Frontend - page unmount or navigation away

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  templateId?: string;
  tier: SubscriptionTier;
  durationSeconds: number;    // Time spent in session
  changesCount: number;        // Number of modifications made
  componentsAdded: number;     // Components added this session
  componentsRemoved: number;   // Components removed this session
  templateChanged: boolean;    // Whether template was applied
  stylingChanged: boolean;     // Whether styling was modified
  customCssChanged: boolean;   // Whether custom CSS was edited
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "templateId": "template_modern_pro",
  "tier": "PRO",
  "durationSeconds": 245,
  "changesCount": 7,
  "componentsAdded": 2,
  "componentsRemoved": 1,
  "templateChanged": true,
  "stylingChanged": true,
  "customCssChanged": false,
  "timestamp": "2025-12-08T10:34:05Z"
}
```

**Analysis Use Cases**:
- Calculate average customization session duration
- Measure completion rates
- Identify friction points (short sessions with few changes)
- Track feature usage patterns

---

### 2. Component Management Events

#### `COMPONENT_ADDED`

**Description**: Fired when user adds a new component to their card.

**Emitted**: Backend - CardComponentsService.create()

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  componentId: string;
  componentType: ComponentType;  // PROFILE, ABOUT, GALLERY, etc.
  tier: SubscriptionTier;
  componentCount: number;        // Total components after addition
  source?: string;               // "palette" | "quick_add" | "template"
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "componentId": "comp_123",
  "componentType": "GALLERY",
  "tier": "PRO",
  "componentCount": 4,
  "source": "palette",
  "timestamp": "2025-12-08T10:31:15Z"
}
```

**Analysis Use Cases**:
- Track most popular component types
- Measure feature adoption by tier
- Identify component usage patterns

---

#### `COMPONENT_REMOVED`

**Description**: Fired when user deletes a component from their card.

**Emitted**: Backend - CardComponentsService.remove()

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  componentId: string;
  componentType: ComponentType;
  tier: SubscriptionTier;
  componentCount: number;        // Total components after removal
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "componentId": "comp_456",
  "componentType": "VIDEO",
  "tier": "PRO",
  "componentCount": 3,
  "timestamp": "2025-12-08T10:32:30Z"
}
```

**Analysis Use Cases**:
- Identify components frequently removed (potential UX issues)
- Track component churn rates

---

#### `COMPONENT_UPDATED`

**Description**: Fired when user modifies component configuration.

**Emitted**: Backend - CardComponentsService.update()

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  componentId: string;
  componentType: ComponentType;
  tier: SubscriptionTier;
  configChanged: boolean;    // Whether config was modified
  stylingChanged: boolean;   // Whether component styling changed
  enabledChanged: boolean;   // Whether enabled state changed
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "componentId": "comp_789",
  "componentType": "ABOUT",
  "tier": "PRO",
  "configChanged": true,
  "stylingChanged": false,
  "enabledChanged": false,
  "timestamp": "2025-12-08T10:33:00Z"
}
```

**Analysis Use Cases**:
- Measure component engagement (how often users edit)
- Identify most frequently modified components

---

#### `COMPONENT_REORDERED`

**Description**: Fired when user changes component order via drag-and-drop.

**Emitted**: Backend - CardComponentsService.reorder()

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  tier: SubscriptionTier;
  componentCount: number;
  reorderCount: number;      // Number of components reordered
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "tier": "PRO",
  "componentCount": 4,
  "reorderCount": 3,
  "timestamp": "2025-12-08T10:33:45Z"
}
```

**Analysis Use Cases**:
- Track drag-and-drop feature usage
- Measure layout experimentation

---

### 3. Template & Styling Events

#### `CARD_TEMPLATE_APPLIED`

**Description**: Fired when user applies a template to their card.

**Emitted**: Backend - TemplatesService or CardsService template application

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  templateId: string;
  templateSlug: string;
  templateCategory: string;  // "professional" | "creative" | "minimal"
  templateTier: SubscriptionTier;
  userTier: SubscriptionTier;
  previousTemplateId?: string;
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "templateId": "template_modern_pro",
  "templateSlug": "modern-professional",
  "templateCategory": "professional",
  "templateTier": "PRO",
  "userTier": "PRO",
  "previousTemplateId": "template_minimal",
  "timestamp": "2025-12-08T10:30:30Z"
}
```

**Analysis Use Cases**:
- Track most popular templates
- Measure template adoption by category
- Identify template switching patterns
- Validate template tier pricing

---

#### `CARD_STYLING_UPDATED`

**Description**: Fired when user modifies card-level styling (colors, fonts, layout).

**Emitted**: Backend - CardsService styling update endpoint

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  tier: SubscriptionTier;
  changedFields: string[];   // ["backgroundColor", "fontFamily", "layout"]
  backgroundTypeChanged: boolean;
  layoutChanged: boolean;
  typographyChanged: boolean;
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "tier": "PRO",
  "changedFields": ["backgroundColor", "fontFamily"],
  "backgroundTypeChanged": true,
  "layoutChanged": false,
  "typographyChanged": true,
  "timestamp": "2025-12-08T10:32:00Z"
}
```

**Analysis Use Cases**:
- Track most frequently changed styling attributes
- Measure design system usage
- Identify popular color schemes and fonts

---

#### `CARD_CUSTOM_CSS_UPDATED`

**Description**: Fired when PREMIUM user edits custom CSS.

**Emitted**: Backend - CardsService custom CSS update endpoint

**Payload**:
```typescript
{
  userId: string;
  cardId: string;
  tier: SubscriptionTier;      // Always PREMIUM
  cssLength: number;           // Character count (not full content)
  hasCustomCss: boolean;       // True if CSS exists, false if cleared
  timestamp: Date;
}
```

**Example**:
```json
{
  "userId": "user_abc123",
  "cardId": "card_xyz789",
  "tier": "PREMIUM",
  "cssLength": 1250,
  "hasCustomCss": true,
  "timestamp": "2025-12-08T10:35:00Z"
}
```

**Analysis Use Cases**:
- Track custom CSS adoption (PREMIUM feature)
- Measure average CSS complexity
- Validate PREMIUM tier value

---

## Privacy & PII Compliance

### Allowed Data
- User IDs (UUIDs, not emails)
- Card IDs
- Template IDs
- Component types (not content)
- Tier information
- Counts and durations
- Timestamps

### Prohibited Data
- Email addresses
- Phone numbers
- Names (first, last, display)
- Card content (bio, about text, etc.)
- Social media handles
- Custom links or URLs
- Any user-generated text content
- CSS content (only length)

### Anonymization
All events use system-generated IDs. No personally identifiable information (PII) is included in analytics payloads.

---

## Implementation Guide

### Backend Event Emission

Use the existing `AnalyticsService` with new event types:

```typescript
// Example: Emit component added event
await this.analyticsService.logCustomizationEvent({
  eventType: 'COMPONENT_ADDED',
  userId: user.id,
  cardId: card.id,
  metadata: {
    componentId: component.id,
    componentType: component.type,
    tier: user.subscription.tier,
    componentCount: componentsCount,
  },
});
```

### Frontend Session Tracking

```typescript
// On page mount
useEffect(() => {
  analyticsClient.track('CUSTOMIZATION_SESSION_STARTED', {
    userId: user.id,
    cardId: params.cardId,
    templateId: card.templateId,
    tier: user.tier,
    componentCount: components.length,
  });

  const startTime = Date.now();

  // On unmount
  return () => {
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    analyticsClient.track('CUSTOMIZATION_SESSION_COMPLETED', {
      userId: user.id,
      cardId: params.cardId,
      templateId: card.templateId,
      tier: user.tier,
      durationSeconds,
      changesCount: sessionChanges,
      componentsAdded: sessionComponentsAdded,
      componentsRemoved: sessionComponentsRemoved,
      templateChanged: sessionTemplateChanged,
      stylingChanged: sessionStylingChanged,
      customCssChanged: sessionCustomCssChanged,
    });
  };
}, []);
```

---

## Event Emission Locations

| Event | Service/Component | Method/Hook |
|-------|------------------|-------------|
| `CUSTOMIZATION_SESSION_STARTED` | Frontend: CustomizeCardPage | useEffect mount |
| `CUSTOMIZATION_SESSION_COMPLETED` | Frontend: CustomizeCardPage | useEffect unmount |
| `COMPONENT_ADDED` | Backend: CardComponentsService | create() |
| `COMPONENT_REMOVED` | Backend: CardComponentsService | remove() |
| `COMPONENT_UPDATED` | Backend: CardComponentsService | update() |
| `COMPONENT_REORDERED` | Backend: CardComponentsService | reorder() |
| `CARD_TEMPLATE_APPLIED` | Backend: TemplatesService | applyToCard() |
| `CARD_STYLING_UPDATED` | Backend: CardsService | updateStyling() |
| `CARD_CUSTOM_CSS_UPDATED` | Backend: CardsService | updateCustomCss() |

---

## Testing Analytics Events

### Backend Tests

```typescript
it('should emit COMPONENT_ADDED event on create', async () => {
  const analyticsEmitSpy = jest.spyOn(analyticsService, 'logCustomizationEvent');
  
  await service.create(cardId, userId, dto);
  
  expect(analyticsEmitSpy).toHaveBeenCalledWith({
    eventType: 'COMPONENT_ADDED',
    userId: expect.any(String),
    cardId: expect.any(String),
    metadata: expect.objectContaining({
      componentType: dto.type,
      tier: expect.any(String),
    }),
  });
});
```

### Frontend Tests

```typescript
it('should emit session started event on mount', () => {
  const trackSpy = jest.spyOn(analyticsClient, 'track');
  
  render(<CustomizeCardPage cardId="card-1" />);
  
  expect(trackSpy).toHaveBeenCalledWith('CUSTOMIZATION_SESSION_STARTED', {
    userId: expect.any(String),
    cardId: 'card-1',
    tier: expect.any(String),
  });
});
```

---

## Performance Considerations

1. **Non-Blocking**: All analytics calls must be fire-and-forget
2. **Async**: Use async/await with try-catch to prevent failures from affecting UX
3. **Batching**: Frontend events may be batched to reduce network calls
4. **Debouncing**: Rapid updates (e.g., typing in CSS editor) debounced to final value
5. **Error Handling**: Analytics failures logged but never shown to user

---

## Analysis Queries

### Popular Templates
```sql
SELECT templateId, templateSlug, COUNT(*) as applications
FROM analytics_events
WHERE eventType = 'CARD_TEMPLATE_APPLIED'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY templateId, templateSlug
ORDER BY applications DESC
LIMIT 10;
```

### Component Usage by Tier
```sql
SELECT tier, componentType, COUNT(*) as additions
FROM analytics_events
WHERE eventType = 'COMPONENT_ADDED'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY tier, componentType
ORDER BY tier, additions DESC;
```

### Average Session Duration
```sql
SELECT 
  tier,
  AVG(metadata->>'durationSeconds')::int as avg_duration_seconds,
  AVG((metadata->>'changesCount')::int) as avg_changes
FROM analytics_events
WHERE eventType = 'CUSTOMIZATION_SESSION_COMPLETED'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY tier;
```

### Custom CSS Adoption
```sql
SELECT 
  COUNT(DISTINCT userId) as premium_users_with_css,
  AVG((metadata->>'cssLength')::int) as avg_css_length
FROM analytics_events
WHERE eventType = 'CARD_CUSTOM_CSS_UPDATED'
  AND (metadata->>'hasCustomCss')::boolean = true
  AND timestamp >= NOW() - INTERVAL '30 days';
```

---

## Changelog

- **2025-12-08**: Initial event catalog created for Prompt 10 implementation
