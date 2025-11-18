# Domain Model & Database Schema

## Overview

The Nexus Cards domain model is implemented using Prisma ORM with PostgreSQL. The schema follows a relational design with strict constraints aligned with the product requirements.

## Architecture Principles

1. **Prisma Exclusive**: Prisma is the ONLY ORM used in this project
2. **Repository Pattern**: All database access goes through repository classes
3. **Type Safety**: Full TypeScript integration with generated Prisma types
4. **Migrations**: All schema changes require explicit Prisma migrations

## Critical Constraints

### NFC Tag Mapping (1:1 Relationship)
- **One tag can only link to ONE card at any time**
- `NfcTag.cardId` is a direct foreign key (nullable when unassociated)
- **NO join table** exists or should be created
- A card CAN have multiple tags, but a tag CANNOT link to multiple cards

### Analytics Granularity (Daily Only)
- Raw events stored in `AnalyticsEvent` table
- Aggregated daily into `AnalyticsCardDaily`
- **No hourly or sub-daily buckets**
- Unique index on `(cardId, date)` enforces one record per card per day

## Database Schema

### Core Entities

#### User
Primary user account with authentication and profile data.

**Fields:**
- `id` (cuid) - Primary key
- `email` (unique) - Authentication email
- `passwordHash` - Argon2id hashed password
- `role` (USER | ADMIN) - Role-based access control
- `emailVerified` - Email verification status
- `twoFactorEnabled` - 2FA toggle
- `twoFactorSecret` - TOTP secret (encrypted)

**Relations:**
- `profile` - One-to-one with UserProfile
- `subscription` - One-to-one with Subscription
- `cards` - One-to-many with Card
- `contacts` - One-to-many with Contact
- `apiKeys` - One-to-many with ApiKey
- `integrations` - One-to-many with Integration

#### UserProfile
Extended user profile information.

**Fields:**
- `userId` (unique FK) - Links to User
- `firstName`, `lastName` - Display name
- `phone`, `company`, `jobTitle` - Contact info
- `avatarUrl` - Profile picture URL
- `timezone`, `language` - Localization preferences

#### Subscription
User subscription tier and billing status.

**Fields:**
- `userId` (unique FK) - Links to User
- `tier` (FREE | PRO | PREMIUM) - Subscription level
- `status` (ACTIVE | PAST_DUE | CANCELED | TRIALING | INCOMPLETE)
- `stripeCustomerId`, `stripeSubscriptionId` - Stripe integration
- `currentPeriodStart`, `currentPeriodEnd` - Billing cycle dates

**Tier Limits:**
- FREE: 1 card, 7-day analytics, 50 contacts
- PRO: 5 cards, 90-day analytics, unlimited contacts
- PREMIUM: Unlimited cards, unlimited analytics, API access, custom CSS

#### Card
Digital business card with customization options.

**Fields:**
- `id` (cuid) - Primary key
- `userId` (FK) - Card owner
- `slug` (unique) - URL-friendly identifier (e.g., `john-doe`)
- `status` (DRAFT | PUBLISHED | ARCHIVED)
- `templateId` - Template selection (Prompt 11)
- `firstName`, `lastName`, `jobTitle`, `company`, `email`, `phone`, `website`, `bio`
- `avatarUrl`, `coverImageUrl` - Media assets
- `theme` (JSON) - Color scheme, typography settings
- `customCss` (text) - PREMIUM tier only
- `socialLinks` (JSON) - Array of social media profiles
- `viewCount` - Total lifetime views
- `lastViewedAt` - Most recent view timestamp

**Relations:**
- `user` - Many-to-one with User
- `nfcTags` - One-to-many with NfcTag
- `contacts` - One-to-many with Contact
- `analyticsEvents` - One-to-many with AnalyticsEvent
- `analyticsDailies` - One-to-many with AnalyticsCardDaily

#### NfcTag
Physical NFC tag inventory and associations.

**Fields:**
- `id` (cuid) - Primary key
- `uid` (unique) - NFC tag unique identifier (hex string)
- `cardId` (FK, nullable) - Associated card (null when unassociated)
- `status` (UNASSOCIATED | ASSOCIATED | DEACTIVATED)
- `lastTappedAt` - Most recent tap timestamp

**Critical:** `cardId` is a direct FK, not a join table. One tag → one card.

**Relations:**
- `card` - Many-to-one with Card (nullable)

#### Contact
Contact information exchanged via cards.

**Fields:**
- `id` (cuid) - Primary key
- `userId` (FK) - Contact owner (who received the card)
- `cardId` (FK) - Source card that was shared
- `firstName`, `lastName`, `email`, `phone`, `company`, `jobTitle` - Contact details
- `notes` - User-added notes
- `tags` (array) - Categorization tags
- `metadata` (JSON) - Additional data
- `exchangedAt` - Exchange timestamp

**Relations:**
- `user` - Many-to-one with User
- `card` - Many-to-one with Card

#### AnalyticsEvent
Raw analytics events for detailed tracking.

**Fields:**
- `id` (cuid) - Primary key
- `cardId` (FK) - Card being tracked
- `eventType` (CARD_VIEW | CONTACT_EXCHANGE | LINK_CLICK | QR_SCAN | NFC_TAP | SHARE)
- `metadata` (JSON) - Event-specific data
- `ipAddress`, `userAgent`, `referer` - Request context
- `country`, `city` - Geolocation (derived from IP)
- `device`, `browser` - Parsed from user agent
- `timestamp` - Event time

**Retention:** Tier-based (7d for FREE, 90d for PRO, unlimited for PREMIUM)

#### AnalyticsCardDaily
Aggregated daily analytics per card.

**Fields:**
- `cardId` (FK) - Card being tracked
- `date` (date) - Aggregation date
- `views`, `contactExchanges`, `linkClicks`, `qrScans`, `nfcTaps`, `shares` - Event counters
- `uniqueVisitors` - Distinct visitor count

**Unique Index:** `(cardId, date)` - One record per card per day

**Relations:**
- `card` - Many-to-one with Card

### Supporting Entities

#### Invoice
Billing invoices from Stripe.

**Fields:**
- `subscriptionId` (FK) - Links to Subscription
- `stripeInvoiceId` (unique) - Stripe invoice ID
- `amount`, `currency`, `status` - Invoice details
- `invoiceUrl`, `pdfUrl` - Stripe-hosted URLs

#### Integration
Third-party service integrations.

**Fields:**
- `userId` (FK) - Integration owner
- `provider` (SALESFORCE | HUBSPOT | ZOHO | MAILCHIMP | SENDGRID | ZAPIER | GOOGLE_DRIVE | DROPBOX)
- `status` (ACTIVE | INACTIVE | ERROR)
- `credentials` (JSON) - Encrypted OAuth tokens
- `settings` (JSON) - Provider-specific config
- `lastSyncAt` - Last successful sync

#### ApiKey
API keys for PREMIUM tier programmatic access.

**Fields:**
- `userId` (FK) - Key owner
- `name` - Descriptive name
- `keyHash` (unique) - SHA-256 hashed key
- `keyPrefix` - Visible prefix (e.g., `nx_live_`)
- `lastUsedAt`, `expiresAt` - Usage tracking

#### Webhook
Webhook subscriptions for event notifications.

**Fields:**
- `url` - Webhook endpoint URL
- `secret` - HMAC signature secret
- `events` (array) - Subscribed event types
- `active` - Enable/disable toggle
- `lastTriggeredAt` - Last invocation

#### ActivityLog
Audit trail for user and admin actions.

**Fields:**
- `userId` (FK, nullable) - Actor (null for system actions)
- `action` - Action type (e.g., `USER_LOGIN`, `CARD_CREATED`)
- `entityType`, `entityId` - Affected entity
- `metadata` (JSON) - Action-specific data
- `ipAddress`, `userAgent` - Request context

## Repository Pattern

All database access goes through repository classes in the corresponding module folder:

```
src/
  users/
    users.repository.ts
  cards/
    cards.repository.ts
  nfc/
    nfc.repository.ts
  contacts/
    contacts.repository.ts
  analytics/
    analytics.repository.ts
```

**Example Repository Methods:**
```typescript
class UsersRepository {
  async findById(id: string): Promise<User | null>
  async findByEmail(email: string): Promise<User | null>
  async create(data: Prisma.UserCreateInput): Promise<User>
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User>
  async delete(id: string): Promise<User>
  async findMany(params): Promise<User[]>
  async count(where?: Prisma.UserWhereInput): Promise<number>
}
```

## Migrations

### Creating Migrations

```bash
cd apps/api
npx prisma migrate dev --name <migration_name>
```

### Applying Migrations (Production)

```bash
cd apps/api
npx prisma migrate deploy
```

### Reset Database (Development Only)

```bash
cd apps/api
npx prisma migrate reset
```

## Seeding (Future)

Seed scripts will be added in `apps/api/prisma/seed.ts` for:
- Admin user creation
- Sample cards and templates
- NFC tag bulk import
- Test data for development

## Indexes

Performance-critical indexes:

- `users.email` - Authentication lookups
- `cards.userId` - User card queries
- `cards.slug` - Public card lookups
- `cards.status` - Published card queries
- `nfcTags.uid` - NFC tap lookups
- `nfcTags.cardId` - Tag associations
- `contacts.userId` - User contact queries
- `contacts.email` - Contact search
- `analyticsEvents.cardId` - Event queries
- `analyticsEvents.timestamp` - Time-based queries
- `analyticsCardDaily.cardId` - Daily stats queries
- `analyticsCardDaily.date` - Date range queries

## Type Generation

Prisma automatically generates TypeScript types in `node_modules/@prisma/client`.

**Usage in services:**
```typescript
import { User, Card, Prisma } from '@prisma/client';

async create(data: Prisma.CardCreateInput): Promise<Card> {
  return this.cardsRepository.create(data);
}
```

## Environment Variables

Required in `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## NestJS Integration

Prisma is integrated via `PrismaModule` and `PrismaService`:

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

The `PrismaModule` is marked as `@Global()` so all modules can inject `PrismaService`.

## Next Steps (Future Prompts)

- [ ] Prompt 4: Implement auth logic (password hashing, JWT tokens)
- [ ] Prompt 5: Card CRUD operations and public API
- [ ] Prompt 6: Admin dashboard queries
- [ ] Prompt 7: Stripe integration for subscriptions
- [ ] Prompt 8: Analytics event aggregation jobs
- [ ] Prompt 9: API key authentication
