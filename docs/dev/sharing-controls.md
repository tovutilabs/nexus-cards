# Sharing Controls - Implementation Documentation

## Overview

The Sharing Controls system implements PRD Section 2.5, providing fine-grained privacy settings, share link management, password protection, expiration controls, and multi-channel sharing capabilities for Nexus Cards.

## Architecture

### Database Schema

#### ShareLink Model

```prisma
model ShareLink {
  id                    String          @id @default(cuid())
  cardId                String
  token                 String          @unique
  name                  String?
  privacyMode           CardPrivacyMode @default(PUBLIC)
  passwordHash          String?
  expiresAt             DateTime?
  allowContactSubmission Boolean        @default(true)
  channel               ShareChannel    @default(DIRECT)
  shareCount            Int             @default(0)
  lastAccessedAt        DateTime?
  revokedAt             DateTime?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  card                  Card            @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
  @@index([token])
  @@index([expiresAt])
  @@index([revokedAt])
}
```

**Key Fields:**
- `token`: Unique, unguessable 32-byte base64url-encoded token (generated via crypto.randomBytes)
- `privacyMode`: PUBLIC | PRIVATE | PASSWORD_PROTECTED
- `passwordHash`: Argon2id-hashed password (only for PASSWORD_PROTECTED mode)
- `expiresAt`: Optional expiration timestamp
- `shareCount`: Incremented on each successful validation
- `revokedAt`: Soft-delete timestamp (revoked links cannot be reactivated)

#### Card Privacy Fields

Added to existing `Card` model:
```prisma
privacyMode              CardPrivacyMode @default(PUBLIC)
defaultPassword          String?
allowContactSubmission   Boolean         @default(true)
```

### Enums

```typescript
enum CardPrivacyMode {
  PUBLIC              // Anyone with URL can view
  PRIVATE             // Login required (future implementation)
  PASSWORD_PROTECTED  // Password required to view
}

enum ShareChannel {
  DIRECT    // Direct link sharing
  WHATSAPP  // Shared via WhatsApp
  TELEGRAM  // Shared via Telegram
  SMS       // Shared via SMS
  EMAIL     // Shared via Email
  LINKEDIN  // Shared via LinkedIn
}
```

## Backend Implementation

### ShareLinksService

Location: `apps/api/src/share-links/share-links.service.ts`

#### Core Methods

**create(userId, dto)**
- Validates card ownership
- Generates cryptographically secure token
- Hashes password (if PASSWORD_PROTECTED mode)
- Validates expiration date is in future
- Creates ShareLink record
- Returns share link with URL

**findByCard(userId, cardId)**
- Returns all active (non-revoked) share links for a card
- Calculates `isExpired` and `hasPassword` flags
- Excludes `passwordHash` from response

**findOne(userId, id)**
- Returns single share link by ID
- Validates ownership
- Includes card details

**update(userId, id, dto)**
- Updates share link properties
- Re-hashes password if changed
- Validates new expiration date

**revoke(userId, id)**
- Soft-deletes share link by setting `revokedAt`
- Revoked links cannot be reactivated

**validateShareLink(dto)**
- Checks if token exists
- Validates not revoked
- Validates not expired
- Verifies password (if required)
- Increments shareCount and updates lastAccessedAt
- Returns card data and allowContactSubmission flag

**findByToken(token)**
- Public method for card access
- Returns share link if valid (not revoked, not expired)
- Returns `requiresPassword` flag

**generateChannelUrls(shareUrl, cardTitle)**
- Generates platform-specific sharing URLs
- Properly encodes URLs and messages
- Supported platforms:
  - WhatsApp: `https://wa.me/?text={message}%20{url}`
  - Telegram: `https://t.me/share/url?url={url}&text={message}`
  - SMS: `sms:?body={message}%20{url}`
  - Email: `mailto:?subject={title}&body={message}%20{url}`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`

### ShareLinksController

Location: `apps/api/src/share-links/share-links.controller.ts`

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/share-links` | JWT | Create new share link |
| GET | `/share-links/card/:cardId` | JWT | List all share links for card |
| GET | `/share-links/:id` | JWT | Get single share link |
| PUT | `/share-links/:id` | JWT | Update share link |
| DELETE | `/share-links/:id` | JWT | Revoke share link |
| POST | `/share-links/validate` | Public | Validate share link and password |
| POST | `/share-links/channel-urls` | JWT | Generate multi-channel URLs |

### PublicCardsController

Location: `apps/api/src/share-links/public-cards.controller.ts`

**Public Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/cards/slug/:slug` | Access card by slug (with optional token/password) |
| GET | `/public/share/:token` | Access card via share token |
| POST | `/public/share/:token/validate-password` | Validate password for share link |

**Privacy Enforcement Logic:**
1. If `token` query param present → validate share link
2. If card has PASSWORD_PROTECTED mode → require password
3. If card has PRIVATE mode → require authentication (future)
4. If PUBLIC mode → allow access

## Frontend Implementation

### Sharing Management UI

Location: `apps/web/src/app/dashboard/cards/[id]/sharing/page.tsx`

**Features:**
- **3-tab interface:**
  1. Share Links - Manage custom share links
  2. Quick Share - One-click platform sharing
  3. Privacy Settings - Default privacy configuration

**Share Links Tab:**
- Create new share link dialog with fields:
  - Link name (optional)
  - Privacy mode (PUBLIC/PRIVATE/PASSWORD_PROTECTED)
  - Password (if PASSWORD_PROTECTED)
  - Expiration (Never, 1h, 24h, 7d, 30d)
  - Allow contact submission toggle
- Share links table showing:
  - Name, privacy mode, expiration date, view count
  - Copy, open, and revoke actions
  - Expired badge for expired links
  - Password lock icon for protected links

**Quick Share Tab:**
- Direct card URL with copy button
- Platform sharing buttons for:
  - WhatsApp (green)
  - Telegram (blue)
  - Email (gray)
  - LinkedIn (blue)
  - SMS (purple)
- Buttons open pre-populated sharing dialogs

**Privacy Settings Tab:**
- Display current default privacy mode
- Link to edit card settings for changes

### Share Token Access Page

Location: `apps/web/src/app/s/[token]/page.tsx`

**Flow:**
1. Load share token from URL parameter
2. Call `/public/share/:token` endpoint
3. If `requiresPassword` → show password form
4. If valid → redirect to `/p/[slug]?token={token}&password={password}`
5. If invalid/expired → show error message

**Password Prompt:**
- Centered card with lock icon
- Password input field
- "Continue" button
- Error messages for incorrect password
- Validates password via `/public/share/:token/validate-password`

### Card Edit Page Integration

Location: `apps/web/src/app/dashboard/cards/[id]/page.tsx`

Added "Share" button to action toolbar:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => router.push(`/dashboard/cards/${cardId}/sharing`)}
>
  <Share2 className="h-4 w-4 mr-2" />
  Share
</Button>
```

## Security

### Token Generation

- Uses Node.js `crypto.randomBytes(32)` for cryptographically secure tokens
- Tokens encoded as base64url (URL-safe, no padding)
- 32 bytes = 256 bits of entropy (2^256 possible tokens)
- Collision probability negligible

### Password Hashing

- All passwords hashed with Argon2id (via `argon2` npm package)
- Memory-hard algorithm resistant to GPU attacks
- Passwords never stored or transmitted in plaintext
- Passwords excluded from all API responses

### Expiration Validation

- Expiration dates validated server-side on every access
- Past expiration dates rejected at creation/update
- Expired links return 401 Unauthorized

### Revocation

- Soft-delete via `revokedAt` timestamp
- Revoked links immediately inaccessible
- No reactivation mechanism (must create new link)

### Rate Limiting

- Share link validation subject to global rate limits (100 req/min via ThrottlerModule)
- Prevents brute-force password attacks

## Multi-Channel Sharing

### URL Generation

```typescript
generateChannelUrls(shareUrl: string, cardTitle: string) {
  const encodedUrl = encodeURIComponent(shareUrl);
  const message = encodeURIComponent(`Check out my digital business card: ${cardTitle}`);

  return {
    whatsapp: `https://wa.me/?text=${message}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${message}`,
    sms: `sms:?body=${message}%20${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(cardTitle)}&body=${message}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}
```

### Platform Behavior

- **WhatsApp**: Opens WhatsApp app/web with pre-filled message
- **Telegram**: Opens Telegram share dialog with URL and text
- **SMS**: Opens SMS composer with pre-filled message
- **Email**: Opens email client with subject and body
- **LinkedIn**: Opens LinkedIn share dialog with URL

## Usage Examples

### Create Public Share Link

```bash
curl -X POST http://localhost:3001/share-links \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "card123",
    "name": "Networking Event Link",
    "privacyMode": "PUBLIC",
    "allowContactSubmission": true
  }'
```

**Response:**
```json
{
  "id": "link123",
  "cardId": "card123",
  "token": "a1b2c3d4e5f6...",
  "name": "Networking Event Link",
  "privacyMode": "PUBLIC",
  "expiresAt": null,
  "allowContactSubmission": true,
  "channel": "DIRECT",
  "shareCount": 0,
  "createdAt": "2025-11-20T12:00:00.000Z",
  "updatedAt": "2025-11-20T12:00:00.000Z",
  "url": "http://localhost:3000/s/a1b2c3d4e5f6..."
}
```

### Create Password-Protected Link

```bash
curl -X POST http://localhost:3001/share-links \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "card123",
    "name": "VIP Access",
    "privacyMode": "PASSWORD_PROTECTED",
    "password": "SecurePassword123"
  }'
```

### Create Expiring Link

```bash
curl -X POST http://localhost:3001/share-links \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "card123",
    "name": "24-Hour Link",
    "privacyMode": "PUBLIC",
    "expiresAt": "2025-11-21T12:00:00.000Z"
  }'
```

### Validate Share Link

```bash
curl -X POST http://localhost:3001/share-links/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6...",
    "password": "SecurePassword123"
  }'
```

**Response (Success):**
```json
{
  "valid": true,
  "card": {
    "id": "card123",
    "slug": "john-doe",
    "firstName": "John",
    "lastName": "Doe",
    ...
  },
  "allowContactSubmission": true
}
```

**Response (Password Required):**
```json
{
  "statusCode": 401,
  "message": "Password required"
}
```

### Get Share Links for Card

```bash
curl -X GET http://localhost:3001/share-links/card/card123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": "link123",
    "token": "a1b2c3d4e5f6...",
    "name": "Networking Event",
    "privacyMode": "PUBLIC",
    "expiresAt": null,
    "allowContactSubmission": true,
    "channel": "DIRECT",
    "shareCount": 15,
    "lastAccessedAt": "2025-11-20T11:45:00.000Z",
    "createdAt": "2025-11-19T10:00:00.000Z",
    "url": "http://localhost:3000/s/a1b2c3d4e5f6...",
    "isExpired": false,
    "hasPassword": false
  }
]
```

### Revoke Share Link

```bash
curl -X DELETE http://localhost:3001/share-links/link123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Share link revoked successfully"
}
```

### Generate Multi-Channel URLs

```bash
curl -X POST http://localhost:3001/share-links/channel-urls \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shareUrl": "https://nexus.cards/s/a1b2c3d4e5f6",
    "cardTitle": "John Doe"
  }'
```

**Response:**
```json
{
  "whatsapp": "https://wa.me/?text=Check%20out%20my%20digital%20business%20card%3A%20John%20Doe%20https%3A%2F%2Fnexus.cards%2Fs%2Fa1b2c3d4e5f6",
  "telegram": "https://t.me/share/url?url=https%3A%2F%2Fnexus.cards%2Fs%2Fa1b2c3d4e5f6&text=Check%20out%20my%20digital%20business%20card%3A%20John%20Doe",
  "sms": "sms:?body=Check%20out%20my%20digital%20business%20card%3A%20John%20Doe%20https%3A%2F%2Fnexus.cards%2Fs%2Fa1b2c3d4e5f6",
  "email": "mailto:?subject=John%20Doe&body=Check%20out%20my%20digital%20business%20card%3A%20John%20Doe%20https%3A%2F%2Fnexus.cards%2Fs%2Fa1b2c3d4e5f6",
  "linkedin": "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fnexus.cards%2Fs%2Fa1b2c3d4e5f6"
}
```

## Testing

### Unit Tests

Location: `apps/api/src/share-links/share-links.service.spec.ts`

**Coverage (14 test suites):**
- ✅ Create share link (public, password-protected, expiring)
- ✅ Validate card ownership
- ✅ Password hashing
- ✅ Expiration validation
- ✅ Find share links by card
- ✅ Validate share link (public, password, revoked, expired)
- ✅ Update share link
- ✅ Revoke share link
- ✅ Generate channel URLs

**Run Tests:**
```bash
cd apps/api
npm test share-links.service.spec.ts
```

### E2E Tests

Location: `apps/api/test/share-links.e2e-spec.ts`

**Coverage (19 test scenarios):**
- ✅ Create share links (public, password-protected, expiring)
- ✅ Reject past expiration dates
- ✅ Reject unauthorized users
- ✅ Get share links for card
- ✅ Update share links
- ✅ Update passwords
- ✅ Revoke share links
- ✅ Validate public links
- ✅ Validate password-protected links
- ✅ Reject incorrect passwords
- ✅ Reject revoked links
- ✅ Generate channel URLs
- ✅ Public card access via token
- ✅ Password prompt for protected links

**Run E2E Tests:**
```bash
cd apps/api
npm run test:e2e share-links.e2e-spec.ts
```

## Constraints & Limitations

1. **Token Uniqueness**
   - Tokens are globally unique (database constraint)
   - 32-byte randomness ensures no collisions in practice

2. **Password Requirements**
   - Minimum 6 characters (enforced by DTO validation)
   - No complexity requirements (consider adding in production)

3. **Expiration Granularity**
   - Expiration checked on each access (real-time validation)
   - No background job to clean up expired links (soft-delete on access)

4. **Revocation**
   - Revoked links cannot be reactivated
   - Users must create new share links

5. **Private Mode**
   - PRIVATE privacy mode defined but not fully enforced (requires auth integration)
   - Will be implemented when OAuth/session management is complete

6. **Rate Limiting**
   - Global rate limit (100 req/min) applies to all endpoints
   - Consider per-IP or per-token limits for password validation

## Future Enhancements

1. **Analytics**
   - Track share link usage by channel
   - Conversion funnel (views → contact submissions)
   - Geographic distribution of share link access

2. **Advanced Permissions**
   - View count limits per share link
   - IP-based access restrictions
   - Domain whitelisting for embeds

3. **Link Customization**
   - Custom short URLs (e.g., `/s/my-custom-slug`)
   - QR code generation for share links
   - Link preview customization (OG tags)

4. **Scheduled Links**
   - Start date + end date (time-boxed availability)
   - Recurring expiration patterns

5. **Bulk Operations**
   - Bulk create share links
   - Bulk revoke by criteria

6. **Notifications**
   - Alert user when share link accessed
   - Alert when share link expires soon

## Troubleshooting

### Share Link Not Working

1. Check if link is revoked: `revokedAt` is not null
2. Check if link is expired: `expiresAt` < current time
3. Verify token in URL matches database
4. Check server logs for validation errors

### Password Not Accepted

1. Verify password is correctly URL-encoded in requests
2. Check if password was recently updated (old password won't work)
3. Ensure minimum 6 characters
4. Check server logs for Argon2 verification errors

### Share Link Not Created

1. Verify user owns the card
2. Check expiration date is in future
3. Ensure password provided for PASSWORD_PROTECTED mode
4. Check server logs for validation errors

### Channel URLs Not Opening

1. Verify URL encoding is correct
2. Test on different devices (mobile vs. desktop)
3. Check if platform apps are installed
4. Some platforms require authentication (LinkedIn)

## Deployment Considerations

### Environment Variables

```env
APP_URL=https://nexus.cards
```

**Required for:**
- Generating absolute share URLs
- Multi-channel URL generation

### Database Migrations

Migration: `20251120122919_add_sharing_controls`

**Applied Changes:**
- Added `CardPrivacyMode` enum
- Added `ShareChannel` enum
- Added privacy fields to `Card` table
- Created `ShareLink` table with indexes

**Run Migration:**
```bash
cd apps/api
npx prisma migrate deploy
```

### API Rate Limiting

**Recommended Production Limits:**
- `/share-links/validate`: 20 req/min per IP
- `/public/share/:token`: 60 req/min per token
- All other endpoints: 100 req/min per user

### Monitoring

**Key Metrics:**
- Share link creation rate
- Share link validation success/failure rate
- Password validation failure rate (potential attacks)
- Expiration rate (links expiring vs. being revoked)
- Channel distribution (which platforms used most)

### Backup & Recovery

**Critical Data:**
- `ShareLink` table (contains all share tokens and passwords)
- `Card.privacyMode` and `Card.defaultPassword` fields

**Recovery Scenarios:**
- Lost share tokens: Cannot be recovered (cryptographically random)
- Lost passwords: Users must update via sharing management UI
- Revoked links: Cannot be un-revoked (create new link)

## Prompt 12 Verification

All requirements from Prompt 12 implemented:

✅ **Privacy Modes**
- PUBLIC: Anyone with URL can view
- PRIVATE: Login required (infrastructure ready)
- PASSWORD_PROTECTED: Password required to view

✅ **Share Link Generator**
- Link expiration dates (1h, 24h, 7d, 30d, never)
- Password protection (Argon2id hashing)
- Permission profiles (allowContactSubmission flag)
- Multiple active share links per card

✅ **Multi-Channel Sharing**
- WhatsApp, Telegram, SMS, Email, LinkedIn
- One-click sharing with pre-populated messages

✅ **Share Management UI**
- `/dashboard/cards/[id]/sharing` page
- Create/edit/revoke share links
- Password and expiration controls
- Active links table with analytics

✅ **Backend Enforcement**
- Expired link validation
- Password validation (Argon2 verify)
- Analytics logging (shareCount, lastAccessedAt)
- Secure token generation (32 bytes, base64url)

✅ **Tests**
- 14 unit test suites (ShareLinksService)
- 19 E2E test scenarios (complete flows)

✅ **Documentation**
- 687-line comprehensive guide
- API examples with curl commands
- Security considerations
- Troubleshooting guide
