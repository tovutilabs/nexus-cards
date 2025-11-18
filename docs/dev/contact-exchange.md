# Contact Exchange System

## Overview

The contact exchange system allows visitors to submit their contact information on public card pages, and card owners to manage these contacts through a wallet interface.

## Architecture

### Database Model

```prisma
model Contact {
  id          String   @id @default(cuid())
  userId      String   // Card owner (recipient of contact)
  cardId      String   // Which card the contact was submitted to
  firstName   String
  lastName    String
  email       String?
  phone       String?
  company     String?
  jobTitle    String?
  notes       String?
  tags        String[] // User-defined tags for organization
  metadata    Json?    // Source tracking (NFC, WEB)
  exchangedAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Key Features

1. **Public Contact Submission** - Anyone can submit contact info on `/public/cards/:slug/contacts`
2. **Tier-Based Limits** - FREE users limited to 50 contacts, PRO/PREMIUM unlimited
3. **Source Tracking** - Metadata tracks whether contact came from NFC tap or web form
4. **Contact Management** - Card owners can view, edit, tag, and delete contacts
5. **Export Functionality** - Export contacts as VCF (vCard) or CSV formats

## API Endpoints

### Public Endpoint

```
POST /api/public/cards/:slug/contacts?uid={nfc_uid}
Body: { firstName, lastName, email, phone?, company?, notes? }
Response: { message, contactId }
```

### Authenticated Endpoints

```
GET    /api/contacts                    # List user's contacts
GET    /api/contacts/:id                # Get specific contact
PATCH  /api/contacts/:id                # Update contact (tags, notes, etc.)
DELETE /api/contacts/:id                # Delete contact
GET    /api/contacts/export/vcf         # Export as vCard
GET    /api/contacts/export/csv         # Export as CSV
```

## Implementation Details

### Contact Submission Flow

1. User visits public card page at `/p/{slug}`
2. Fills out contact form
3. POST to `/api/public/cards/:slug/contacts`
4. Backend:
   - Validates card exists and is PUBLISHED
   - Checks card owner's contact limit (FREE: 50, PRO/PREMIUM: unlimited)
   - Creates contact record with userId=cardOwner, cardId, metadata
   - Logs CONTACT_EXCHANGE analytics event
5. Returns success message to visitor

### Tier Enforcement

```typescript
// In ContactsService.submitContact()
const currentContactCount = await this.contactsRepository.countByUserId(card.userId);
await this.usersService.canAddContact(card.userId, currentContactCount);
```

FREE users hitting their 50-contact limit will receive:
```json
{
  "statusCode": 403,
  "message": "Contact limit reached. Your FREE plan allows 50 contacts. Please upgrade to add more contacts."
}
```

### Export Formats

#### VCF (vCard 3.0)
```
BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
EMAIL:john@example.com
TEL:+1234567890
ORG:Company Name
NOTE:Contact notes
END:VCARD
```

#### CSV
```
First Name,Last Name,Email,Phone,Company,Notes,Job Title,Exchanged At
John,Doe,john@example.com,+1234567890,Company Name,Notes,,2025-11-18T13:20:20.329Z
```

### Authorization

- **Public Submission**: No auth required
- **Contact Management**: JWT auth required
- **Ownership Check**: All operations verify `contact.userId === req.user.id`

### Analytics Integration

Every contact submission logs a `CONTACT_EXCHANGE` event with metadata:
```typescript
{
  source: uid ? 'NFC' : 'WEB',
  nfcUid: uid // If submitted via NFC tap
}
```

## Testing

### Submit Contact (Web)
```bash
curl -X POST http://localhost:3001/api/public/cards/john-doe/contacts \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith","email":"jane@example.com","phone":"+1234567890"}'
```

### Submit Contact (NFC)
```bash
curl -X POST 'http://localhost:3001/api/public/cards/john-doe/contacts?uid=04A1B2C3D4E5F6' \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Bob","lastName":"Johnson","email":"bob@example.com"}'
```

### List User's Contacts
```bash
curl -b /tmp/cookies.txt http://localhost:3001/api/contacts
```

### Update Contact Tags
```bash
curl -b /tmp/cookies.txt -X PATCH http://localhost:3001/api/contacts/{contactId} \
  -H "Content-Type: application/json" \
  -d '{"tags":["conference","tech"],"notes":"Follow up next week"}'
```

### Export as VCF
```bash
curl -b /tmp/cookies.txt http://localhost:3001/api/contacts/export/vcf > contacts.vcf
```

### Export as CSV
```bash
curl -b /tmp/cookies.txt http://localhost:3001/api/contacts/export/csv > contacts.csv
```

## Files Modified

- `/apps/api/src/contacts/contacts.service.ts` - Business logic with tier enforcement
- `/apps/api/src/contacts/contacts.controller.ts` - REST endpoints
- `/apps/api/src/contacts/contacts.repository.ts` - Database operations
- `/apps/api/src/contacts/dto/submit-contact.dto.ts` - Input validation
- `/apps/api/src/contacts/dto/update-contact.dto.ts` - Update validation
- `/apps/api/src/public-api/public-api.controller.ts` - Public contact submission endpoint
- `/apps/api/src/analytics/analytics.service.ts` - CONTACT_EXCHANGE event logging

## Next Steps

Frontend implementation needed:
1. **Public Card Page** (`/p/[slug]`) - Contact submission form
2. **Dashboard Contacts** (`/dashboard/contacts`) - List view with search/filter
3. **Contact Detail View** - Edit tags, notes, view metadata
4. **Export UI** - Buttons for VCF/CSV download
