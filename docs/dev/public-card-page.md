# Public Card Frontend

## Overview

The public card page (`/p/[slug]`) is a mobile-first, client-rendered React page that displays a user's digital business card and enables contact exchange.

## Route

- **Path**: `/p/[slug]`
- **Example**: `https://nexus.cards/p/john-doe` or with NFC: `https://nexus.cards/p/john-doe?uid=04A1B2C3D4E5F6`

## Features

### 1. Card Display

- **Profile Header**: Gradient header with initials avatar, name, job title, company, location
- **Contact Information**: Email, phone, website with clickable links and icons
- **Social Links**: LinkedIn, Twitter, GitHub with branded icon buttons
- **Bio**: User biography/description
- **Theme Support**: Primary color customization via card.theme.primaryColor

### 2. Contact Exchange Form

- **Fields**: firstName, lastName, email (required), phone, company, notes
- **Submission**: POST `/api/public/cards/:slug/contacts`
- **NFC Support**: Automatically includes `?uid=` parameter if present
- **Success State**: Shows confirmation message after submission
- **Validation**: Client-side required field validation

### 3. Additional Actions

- **Save Contact**: Downloads VCard (.vcf) file with card owner's contact info
- **Share**: Uses Web Share API or falls back to clipboard copy
- **QR Code**: Displays QR code for easy sharing (placeholder implementation)

### 4. Analytics Tracking

- **Page View**: Tracked automatically on card load via GET `/api/public/cards/:slug`
- **NFC Tap**: Tracked when `?uid=` parameter is present
- **Event Types**: CARD_VIEW (web) and CARD_VIEW (NFC tap)

## API Integration

### Get Card Data

```
GET /api/public/cards/:slug
GET /api/public/cards/:slug?uid=04A1B2C3D4E5F6 (NFC)
```

Returns:

```typescript
{
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
  };
}
```

### Submit Contact

```
POST /api/public/cards/:slug/contacts
POST /api/public/cards/:slug/contacts?uid=04A1B2C3D4E5F6 (NFC)
```

Request body:

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}
```

## UI Components

### Mobile-First Design

- Responsive layout optimized for mobile devices
- Max-width container (max-w-2xl) for desktop
- Touch-friendly buttons and form inputs
- Gradient backgrounds and card shadows

### Action Buttons

- Grid layout (3 columns on mobile)
- Icon + text labels
- Outline variant for non-primary actions

### Loading States

- Spinner with "Loading card..." message
- Shown while fetching card data

### Error States

- "Card Not Found" message for invalid slugs
- Form error handling with alert dialogs

## VCard Generation

The "Save Contact" button generates a VCard 3.0 file:

```
BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
TITLE:CEO
ORG:Acme Corp
EMAIL:john@acme.com
TEL:+1234567890
URL:https://acme.com
NOTE:Bio text
END:VCARD
```

## Implementation Details

### File Location

`/home/anthony/nexus_cards/apps/web/src/app/p/[slug]/page.tsx`

### Component Type

Client component (`'use client'` directive)

### Dependencies

- `next/navigation` - useParams, useSearchParams
- `@/lib/api-client` - createApiClient
- `@/components/ui/*` - Card, Button, Input, Label
- `lucide-react` - Icons

### State Management

- `card` - CardData | null
- `loading` - boolean
- `showContactForm` - boolean
- `showQR` - boolean
- `submitting` - boolean
- `submitted` - boolean
- `contactForm` - Form data object

## NFC ASCII Mirror Support

The page automatically detects the `uid` query parameter which is appended by NFC tags using ASCII Mirror:

- Tag URL format: `https://nexus.cards/p/john-doe?uid=<TAG_UID>`
- UID is passed to API for analytics tracking
- Source metadata set to "NFC" instead of "WEB"

## Testing

### Manual Test (Browser)

1. Navigate to `http://localhost:3000/p/john-doe`
2. Verify card information displays correctly
3. Click "Exchange" to open contact form
4. Fill form and submit
5. Verify success message appears
6. Test "Save" button to download VCard
7. Test "Share" button functionality

### With NFC

1. Navigate to `http://localhost:3000/p/john-doe?uid=04A1B2C3D4E5F6`
2. Verify analytics logs NFC tap
3. Submit contact form
4. Verify contact has NFC metadata

### API Testing

```bash
# Get card
curl -s http://localhost:3001/api/public/cards/john-doe | jq '.'

# Submit contact
curl -X POST http://localhost:3001/api/public/cards/john-doe/contacts \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith","email":"jane@example.com"}'
```

## Future Enhancements

1. Replace QR code placeholder with actual qrcode.react implementation
2. Add card template themes (multiple color schemes)
3. Implement custom CSS support for PREMIUM users
4. Add OpenGraph meta tags for social sharing
5. Support for additional social platforms (Instagram, Facebook, etc.)
6. Map integration for location display
7. Calendar integration for scheduling meetings
8. Real-time availability status

## Security Considerations

- Only PUBLISHED cards are accessible
- Email addresses sanitized before display
- Rate limiting on contact submissions (tier-based)
- CORS properly configured for cross-origin requests
- No sensitive user data exposed in public API response
