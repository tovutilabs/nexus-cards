# Compliance & Accessibility Documentation

## Overview

This document covers Nexus Cards' implementation of GDPR/CCPA compliance features, offline mode capabilities, and WCAG 2.1 AA accessibility standards.

## Table of Contents

1. [GDPR/CCPA Compliance](#gdpaccpa-compliance)
2. [Offline Mode](#offline-mode)
3. [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
4. [Testing](#testing)

---

## GDPR/CCPA Compliance

### Data Privacy Features

#### 1. Data Export (Right to Access)

Users can export all their personal data in JSON or CSV format.

**API Endpoints**:

```
POST /compliance/data-export
GET /compliance/data-exports
```

**Request Body** (POST):
```json
{
  "format": "JSON" | "CSV"
}
```

**Response** (POST):
```json
{
  "id": "export_123",
  "userId": "user_456",
  "format": "JSON",
  "status": "PENDING",
  "fileUrl": null,
  "expiresAt": "2025-11-27T10:00:00Z",
  "createdAt": "2025-11-20T10:00:00Z"
}
```

**Data Export Contents**:
- User profile information
- All digital cards (with links, NFC tags, share links)
- All contacts
- Integration connections
- Notification preferences
- OAuth provider connections
- Subscription information

**Export Lifecycle**:
1. User requests export → Status: PENDING
2. Background job processes export → Status: PENDING
3. File generated and uploaded → Status: COMPLETED
4. Export expires after 7 days → Automatic deletion

**Frontend Implementation**:

Location: `/dashboard/settings/privacy`

```typescript
const requestExport = async (format: 'JSON' | 'CSV') => {
  const response = await apiClient.post('/compliance/data-export', { format });
  // Poll for completion or show "check email" message
};
```

#### 2. Account Deletion (Right to be Forgotten)

Users can permanently delete their account and all associated data.

**API Endpoint**:

```
DELETE /compliance/account
```

**Authentication**: Required (JWT)

**Response**: 204 No Content

**Deletion Process**:

The following data is permanently deleted:
1. User profile
2. All cards and associated data
3. All contacts
4. All analytics events and aggregates
5. All integrations and tokens
6. All notifications
7. All webhook subscriptions
8. All API keys
9. All experiments and events
10. All share links
11. Connection records
12. NFC tag associations (tags unlinked, not deleted)
13. OAuth provider links
14. Subscription records
15. Activity logs

**Transaction Safety**:
All deletions are wrapped in a database transaction to ensure atomicity.

**Frontend Implementation**:

Location: `/dashboard/settings/privacy`

Features:
- Confirmation dialog with detailed warning
- List of data that will be deleted
- "This action cannot be undone" warning
- Requires explicit user confirmation

#### 3. Cookie Consent Manager

Compliance with cookie consent regulations.

**Database Schema**:

```prisma
model CookieConsent {
  id                String   @id @default(cuid())
  userId            String?
  sessionId         String   @unique
  necessary         Boolean  @default(true)
  analytics         Boolean  @default(false)
  marketing         Boolean  @default(false)
  preferences       Boolean  @default(false)
  ipAddress         String?
  userAgent         String?
  consentedAt       DateTime @default(now())

  user              User?    @relation(fields: [userId], references: [id])
}
```

**Cookie Categories**:

1. **Necessary** (always on):
   - Authentication tokens
   - Session management
   - Security features

2. **Analytics** (optional):
   - Usage tracking
   - Performance monitoring
   - Error logging

3. **Marketing** (optional):
   - Advertisement tracking
   - Conversion tracking
   - Remarketing

4. **Preferences** (optional):
   - User settings
   - Theme preferences
   - Language selection

**API Endpoints**:

```
POST /compliance/cookie-consent
GET /compliance/cookie-consent?sessionId=xxx
```

**Frontend Component**:

Component: `<CookieConsent />` in `components/nexus/cookie-consent.tsx`

Features:
- Modal overlay on first visit
- Accept all / Reject all / Customize options
- Granular consent per category
- Stores consent in localStorage
- Records consent in database
- Links to Privacy Policy and Cookie Policy

**Implementation**:

```typescript
// In root layout or app component
import { CookieConsent } from '@/components/nexus/cookie-consent';

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <CookieConsent />
    </>
  );
}
```

#### 4. Privacy Policy & Terms of Service

**Pages**:
- `/privacy-policy` - Complete privacy policy
- `/terms-of-service` - Terms and conditions (to be created)
- `/cookie-policy` - Cookie usage details (to be created)
- `/accessibility` - Accessibility statement

**Required Sections**:
1. Information collected
2. How data is used
3. Data sharing and disclosure
4. Security measures
5. User rights
6. Data retention
7. International transfers
8. Contact information

### Compliance Checklist

- [x] Data export (JSON/CSV)
- [x] Account deletion
- [x] Cookie consent manager
- [x] Privacy policy
- [x] Accessibility statement
- [x] Right to access data
- [x] Right to be forgotten
- [x] Right to data portability
- [ ] Terms of service page
- [ ] Cookie policy page
- [ ] Data processing agreements
- [ ] GDPR-compliant email templates
- [ ] Privacy by design documentation

---

## Offline Mode

### Service Worker Implementation

Location: `/apps/web/public/sw.js`

**Version**: nexus-cards-v2

**Cache Strategies**:

1. **Static Assets** (Cache-First):
   - `/_next/static/*` - Next.js static files
   - `/icons/*` - App icons
   - `/manifest.json` - PWA manifest
   - Dashboard shell pages

2. **Images** (Cache-First):
   - `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`
   - `/avatars/*` - User avatars
   - `/uploads/*` - User uploads

3. **Translations** (Cache-First):
   - `/messages/*.json` - i18n translation files

4. **Public Cards** (Network-First with Offline Fallback):
   - `/p/[slug]` routes
   - Falls back to cached version if offline
   - Shows offline message if not cached

5. **Dashboard** (Network-First with Cache):
   - `/dashboard/*` routes
   - Caches for offline access
   - Returns offline indicator when network fails

6. **API Requests** (Network-Only with Queue):
   - Contact submissions queued when offline
   - Synced when connection restored
   - Other API requests fail gracefully

### Offline Queue System

**Implementation**:

Uses IndexedDB to store failed requests:

```javascript
// Queue structure
{
  id: auto-increment,
  url: string,
  method: string,
  headers: object,
  body: string,
  timestamp: number
}
```

**Supported Operations**:
- Contact form submissions
- (Future: Card edits, Analytics events)

**Sync Mechanisms**:
1. Background Sync API (when available)
2. Manual sync on connection restore
3. Periodic retry on app activity

**Message to Service Worker**:

```javascript
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'PROCESS_QUEUE'
  });
}
```

### PWA Features

**Manifest** (`/public/manifest.json`):
- App name and description
- Icons (multiple sizes)
- Start URL
- Display mode: standalone
- Theme color
- Background color
- Orientation: portrait

**Installability**:
- Add to Home Screen prompt
- Desktop installation
- iOS Safari support

**Offline Fallback**:
- Custom offline page (`/offline`)
- Cached dashboard shell
- Offline indicator in UI

### Testing Offline Mode

**Chrome DevTools**:
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload page to test offline behavior

**Lighthouse Audit**:
```bash
npx lighthouse https://nexus.cards --view
```

Check PWA score and offline functionality.

---

## Accessibility (WCAG 2.1 AA)

### Conformance Level

**Target**: WCAG 2.1 Level AA

**Current Status**: Partially Conformant

### Accessibility Features Implemented

#### 1. Keyboard Navigation

- All interactive elements accessible via Tab/Shift+Tab
- Enter/Space to activate buttons and links
- Arrow keys for dropdown menus and lists
- Escape to close modals and dialogs
- Skip-to-content link (planned)

#### 2. Screen Reader Support

- Semantic HTML5 elements
- ARIA labels on all interactive elements
- ARIA roles for custom components
- ARIA live regions for dynamic content
- Alt text on all images
- Form labels explicitly associated

#### 3. Visual Accessibility

**Color Contrast**:
- Text contrast ratio ≥ 4.5:1 (normal text)
- Large text contrast ratio ≥ 3:1
- UI component contrast ≥ 3:1

**Focus Indicators**:
- Visible focus states on all interactive elements
- Custom focus rings using Tailwind
- Focus trap in modals and dialogs

**Text Sizing**:
- Relative units (rem, em) instead of px
- Text resizable up to 200% without loss of functionality
- Responsive typography scales

#### 4. Form Accessibility

- Labels for all inputs
- Required field indicators
- Error messages linked to fields
- Fieldsets and legends for grouped inputs
- Autocomplete attributes
- Help text with descriptions

#### 5. Semantic HTML

```html
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <h1>Page Title</h1>
  <section aria-labelledby="section-heading">
    <h2 id="section-heading">Section Title</h2>
  </section>
</main>

<footer>
  <nav aria-label="Footer navigation">
    <!-- Footer links -->
  </nav>
</footer>
```

#### 6. ARIA Implementation

**Button Example**:
```tsx
<button
  type="button"
  aria-label="Close dialog"
  aria-pressed={isActive}
  onClick={handleClose}
>
  <X aria-hidden="true" />
</button>
```

**Modal Example**:
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirmation</h2>
  <p id="dialog-description">Are you sure?</p>
</div>
```

**Alert Example**:
```tsx
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  Error: Form submission failed
</div>
```

### Accessibility Statement

Location: `/accessibility`

Includes:
- Conformance status
- Accessibility features
- Known limitations
- Feedback mechanism
- Contact information
- Assessment approach
- Formal complaints process
- Last review date

### Accessibility Testing Tools

#### Automated Testing

1. **axe DevTools** (Chrome Extension):
   - Install from Chrome Web Store
   - Run on each page
   - Fix critical and serious issues

2. **Lighthouse Accessibility Audit**:
   ```bash
   npx lighthouse https://nexus.cards --only-categories=accessibility --view
   ```

3. **WAVE** (WebAIM):
   - https://wave.webaim.org/
   - Check for errors, alerts, and contrast issues

#### Manual Testing

1. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Verify focus visibility
   - Test keyboard shortcuts

2. **Screen Reader Testing**:
   - **NVDA** (Windows) - Free
   - **JAWS** (Windows) - Commercial
   - **VoiceOver** (macOS/iOS) - Built-in
   - **TalkBack** (Android) - Built-in

3. **Color Contrast**:
   - Use browser DevTools contrast checker
   - Test with Contrast Checker tools
   - Verify in grayscale mode

4. **Zoom Testing**:
   - Zoom to 200% (Ctrl/Cmd + Plus)
   - Verify no content overlap
   - Check horizontal scrolling

### Component Accessibility Checklist

For each new component:

- [ ] Semantic HTML elements
- [ ] Keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels where needed
- [ ] Color contrast meets AA
- [ ] Works with screen readers
- [ ] Error messages accessible
- [ ] Alt text on images
- [ ] No layout shifts
- [ ] Responsive at 200% zoom

### Known Accessibility Issues

1. **Third-party Integrations**:
   - Some integration UIs may not be fully accessible
   - Working with vendors to improve

2. **Complex Data Visualizations**:
   - Charts need better alternative descriptions
   - Planned: Data tables as alternatives

3. **PDF Exports**:
   - Generated PDFs need accessibility tags
   - Planned: Accessible PDF library

4. **Dynamic Content Updates**:
   - Some content updates need aria-live regions
   - In progress

### Accessibility Roadmap

**Phase 1** (Complete):
- [x] Semantic HTML across all pages
- [x] Keyboard navigation
- [x] Focus indicators
- [x] Basic ARIA labels
- [x] Color contrast
- [x] Accessibility statement

**Phase 2** (In Progress):
- [ ] Skip-to-content links
- [ ] Enhanced ARIA for complex components
- [ ] Screen reader testing all flows
- [ ] Accessible error handling
- [ ] Form validation improvements

**Phase 3** (Planned):
- [ ] WCAG 2.1 AAA features (where feasible)
- [ ] Accessibility testing in CI
- [ ] Regular third-party audits
- [ ] User testing with assistive tech users
- [ ] Accessibility training for team

---

## Testing

### Unit Tests

**Notifications Service**:
```bash
npm test -- notifications.service.spec.ts
```

**Compliance Service**:
```bash
npm test -- compliance.service.spec.ts
```

### E2E Tests

**Notifications**:
```bash
npm run test:e2e -- notifications.e2e-spec.ts
```

**Compliance** (to be created):
```bash
npm run test:e2e -- compliance.e2e-spec.ts
```

### Manual Testing Checklist

**Data Export**:
- [ ] Request JSON export
- [ ] Request CSV export
- [ ] Download completed export
- [ ] Verify export contents complete
- [ ] Verify export expires after 7 days

**Account Deletion**:
- [ ] Delete account
- [ ] Verify all data removed from database
- [ ] Verify cannot login with deleted account
- [ ] Verify public cards return 404

**Cookie Consent**:
- [ ] Banner appears on first visit
- [ ] Accept all works
- [ ] Reject all works
- [ ] Customize preferences works
- [ ] Consent recorded in database

**Offline Mode**:
- [ ] Dashboard loads when offline
- [ ] Public cards cached and viewable offline
- [ ] Contact submission queued when offline
- [ ] Queue syncs when online
- [ ] Offline indicator appears

**Accessibility**:
- [ ] All pages keyboard navigable
- [ ] Focus indicators visible
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets AA
- [ ] Works at 200% zoom

---

## Best Practices

### GDPR/CCPA

1. **Minimize Data Collection**: Only collect what's necessary
2. **Encrypt Sensitive Data**: Use encryption at rest and in transit
3. **Retention Policies**: Delete old data per tier limits
4. **Audit Trails**: Log data access and modifications
5. **User Consent**: Get explicit consent for data usage
6. **Data Portability**: Make exports easy and comprehensive
7. **Privacy by Design**: Consider privacy in all features

### Offline Mode

1. **Cache Strategically**: Cache what users need offline
2. **Show Offline State**: Clear indicators when offline
3. **Queue Writes**: Save user actions for later sync
4. **Conflict Resolution**: Handle sync conflicts gracefully
5. **Background Sync**: Use Background Sync API when available
6. **Test Extensively**: Test on real devices with poor connectivity

### Accessibility

1. **Semantic First**: Use native HTML elements
2. **Test with Users**: Real users with disabilities
3. **Automated + Manual**: Combine automated and manual testing
4. **Progressive Enhancement**: Work without JavaScript
5. **Document Decisions**: Explain accessibility choices
6. **Regular Audits**: Review accessibility regularly
7. **Train Team**: Accessibility training for all developers

---

## Troubleshooting

### Data Export Not Completing

1. Check background job logs
2. Verify database connection
3. Check file upload permissions
4. Verify export status in database

### Account Deletion Fails

1. Check for foreign key constraints
2. Verify transaction rollback works
3. Check database logs
4. Ensure all cascade deletes configured

### Offline Mode Not Working

1. Check service worker registration
2. Verify cache storage quota
3. Clear cache and reinstall SW
4. Check browser console for SW errors

### Accessibility Issues

1. Run automated audit (axe, Lighthouse)
2. Test with screen reader
3. Verify keyboard navigation
4. Check color contrast
5. Test at different zoom levels

---

## Resources

### GDPR/CCPA

- [GDPR Official Text](https://gdpr-info.eu/)
- [CCPA Official Guide](https://oag.ca.gov/privacy/ccpa)
- [Data Protection by Design](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-by-design-and-default/)

### Offline Mode

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)

### Accessibility

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
