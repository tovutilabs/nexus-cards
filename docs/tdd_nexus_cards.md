# Technical Design Document: Nexus Cards (Updated)

## 1. Overview

Nexus Cards is a digital business card platform that lets users create, customize, share, and analyze digital business cards, with optional NFC tags that resolve directly to a specific card.

This document describes **how** we implement the product defined in the PRD using:

- **Frontend:** Next.js (App Router, React, TypeScript), Tailwind CSS, shadcn/ui
- **Backend:** NestJS (TypeScript)
- **ORM:** **Prisma** (PostgreSQL, single ORM for all database access)
- **Data:** PostgreSQL (primary DB), Redis (cache + jobs + rate limiting)
- **Infra:** Dockerized services deployed on a Linux VPS behind a reverse proxy (Caddy or Nginx)
- **Edge/CDN:** Cloudflare for DNS, TLS, and static asset caching

Key resolutions in this TDD:

- We use **Prisma** as the single ORM.
- **Each NFC tag is associated with at most one card** (1 tag → 0/1 card).
- You **cannot link multiple cards to a tag**; however, a **card may have multiple tags** if needed.
- **Analytics are stored and exposed at daily granularity** using a `date` field (no hourly buckets).

---

## 2. High-Level Architecture

### 2.1 Logical Components

1. **Web App (Next.js)**

   - Marketing site
   - Auth flows (login, register, reset)
   - **Admin dashboard** (internal UI)

     - Web-based admin console (part of the same Next.js app, behind role-based access).
     - Accessible only to users with `role = ADMIN`.
     - Manages:
       - NFC inventory management (UID import, assignment, revocation)
       - User and subscription management
       - Global analytics (daily aggregated metrics) and reporting
       - System-wide configuration and settings

   - User dashboard:

     - Card list & editor
     - NFC tag association UI
     - Contacts wallet
     - Analytics dashboard
     - Billing & integrations

   - Uses shadcn/ui + Tailwind + a custom Nexus design system.

2. **API Server (NestJS)**

   - Modules:

     - Auth, Users, Cards, NFC, Contacts, Analytics, Billing, Integrations, Notifications, Files, Public API

   - Public REST APIs under `/api/*`.
   - Business logic for:

     - Auth & subscriptions
     - Card creation/customization
     - NFC inventory + tag-to-card association
     - Contacts & exports
     - Analytics/event ingestion & daily aggregation
     - Billing + integrations stubs

3. **PostgreSQL**

   - Source of truth for:

     - Users
     - Cards
     - NFC tags (with direct `card_id` association)
     - Contacts
     - Analytics events & daily aggregates
     - Subscriptions
     - Integrations & webhooks

4. **Redis**

   - Caching:

     - Public card payloads
     - Frequently used config

   - Rate limiting for:

     - Public endpoints
     - Auth endpoints

   - Background job queues:

     - Analytics aggregation
     - Email notifications
     - Housekeeping

5. **Reverse Proxy (Caddy or Nginx)**

   - Terminates TLS.
   - Routes:

     - `/` and Next.js routes → `web`
     - `/api/*` → `api`

6. **Storage**

   - Initially: local VPS disk for small uploads (avatars, card images).
   - Later: optional S3-compatible storage.

---

## 3. Tech Stack

### 3.1 Frontend

- **Next.js (App Router)** with TypeScript
- **UI**: Tailwind CSS + shadcn/ui + custom Nexus primitives
- **State & Data Fetching**:

  - React Query (or TanStack Query) for client-side fetching
  - `fetch` in server components for simple server-side data

- **Forms**:

  - React Hook Form + Zod for validation

### 3.2 Backend

- **NestJS** with TypeScript
- **Modules** (initial set):

  - `AuthModule`
  - `UsersModule`
  - `CardsModule`
  - `NfcModule`
  - `ContactsModule`
  - `AnalyticsModule`
  - `BillingModule`
  - `IntegrationsModule`
  - `NotificationsModule`
  - `FilesModule`
  - `PublicApiModule`

### 3.3 ORM & Data

- **ORM:** **Prisma**
- **Primary DB:** PostgreSQL 14+
- **Cache/Queue:** Redis 7+

**Prisma Patterns:**

- Single `PrismaClient` instance in NestJS via `PrismaModule` / `PrismaService`.
- Repositories wrap Prisma calls per domain (e.g., `CardsRepository`, `NfcRepository`).
- Migrations managed with `prisma migrate`.

---

## 4. Domain Model (Database Schema via Prisma)

### 4.1 Core Tables

#### `User`

- `id` (UUID, PK)
- `email` (unique)
- `passwordHash`
- `name`
- `profilePhotoUrl` (nullable)
- `role` (enum: `USER`, `ADMIN`)
- `subscriptionTier` (enum: `FREE`, `PRO`, `PREMIUM`)
- `createdAt`, `updatedAt` (timestamps)

#### `Card`

- `id` (UUID, PK)
- `userId` (UUID, FK → User)
- `slug` (string, unique, for public URLs)
- `title` (string)
- `isDefault` (boolean)
- `status` (enum: `ACTIVE`, `ARCHIVED`, `DRAFT`)
- `designConfig` (JSON) — template, palette, typography, layout, background
- `content` (JSON) — structured fields (phones, emails, links, bio, etc.)
- `createdAt`, `updatedAt`

**Relationships:**

- 1 **User** → many **Cards**
- 1 **Card** → many **NfcTags** (see below)

#### `NfcTag`

> **Resolution**: Each NFC tag maps to **exactly one card at a time** (0/1 association; cannot be mapped to multiple cards). A card can have **multiple tags**; a tag **cannot** link to multiple cards.

- `id` (UUID, PK)
- `uid` (string, unique) — NTAG UID
- `status` (enum: `AVAILABLE`, `ASSIGNED`, `REVOKED`)
- `assignedUserId` (UUID, FK → User, nullable when unassigned)
- `cardId` (UUID, FK → Card, nullable while unassociated)
- `createdAt`, `updatedAt`

Rules:

- Admin can create/import tags (only `AVAILABLE`).
- Admin can assign tag to a user → `status=ASSIGNED`, `assignedUserId` set.
- User can associate **assigned** tags to **one card at a time** → `cardId` set.
- A tag cannot be associated with multiple cards.
- To change association: user disassociates (sets `cardId=NULL`) then associates to a different card.

> **No `NfcTagCardLink` join table** anymore. The 1:1 tag-to-card relationship is enforced in this `NfcTag` table.

#### `Contact`

- `id` (UUID, PK)
- `ownerUserId` (FK → User) — the card owner
- `sourceCardId` (FK → Card, nullable)
- `name`
- `email` (nullable)
- `phone` (nullable)
- `company` (nullable)
- `note` (nullable)
- `tags` (string[], optional)
- `createdFrom` (enum: `FORM`, `QR`, `IMPORT`, `MANUAL`)
- `createdAt`, `updatedAt`

#### `AnalyticsEvent`

- `id` (UUID, PK)
- `cardId` (FK → Card)
- `userId` (FK → User, nullable — viewer, if authenticated)
- `eventType` (enum: `VIEW`, `LINK_CLICK`, `CONTACT_SUBMIT`, `NFC_TAP`)
- `source` (enum: `QR`, `DIRECT`, `NFC`, `EMAIL`, `SOCIAL`, `OTHER`)
- `metadata` (JSON) — link ID, referrer, device, geo, etc.
- `occurredAt` (timestamp)

#### `AnalyticsCardDaily`

> **Resolution**: Analytics granularity is **daily**.
> We aggregate events into a single daily record per card.

- `id` (UUID, PK)
- `cardId` (FK → Card)
- `date` (DATE)
- `views` (int)
- `uniqueVisitors` (int, optional)
- `linkClicks` (int, optional)
- `nfcTaps` (int, optional)
- `contactSubmissions` (int, optional)
- Additional daily counters as needed
- Unique index: (`cardId`, `date`)

> There are **no hourly buckets**. All analytics charts and queries use **daily** aggregation, possibly over ranges (7/90/∞ days).

#### `Subscription`

- `id` (UUID, PK)
- `userId` (FK → User)
- `tier` (enum: `FREE`, `PRO`, `PREMIUM`)
- `status` (enum: `ACTIVE`, `CANCELED`, `PAST_DUE`)
- `renewalDate`
- `createdAt`, `updatedAt`

(Additional integration tables: `IntegrationToken`, `WebhookSubscription`, etc. as needed.)

---

## 5. Backend Module Design (NestJS)

### 5.1 AuthModule

Responsibilities:

- Email/password registration & login
- Password reset flows
- Token issuing (access/refresh)
- Later: social login & 2FA (if PRD requires)

Patterns:

- Guards: `JwtAuthGuard`, `RolesGuard`
- Password hashing using Argon2id

### 5.2 UsersModule

- Fetch/update user profile
- Expose subscription tier & remaining quotas
- Manage avatar uploads (via FilesModule)

### 5.3 CardsModule

Endpoints (examples, actual routes can vary):

- `GET /cards` — list user cards
- `POST /cards` — create card (respect tier limits)
- `GET /cards/:id` — read card (auth)
- `PATCH /cards/:id` — update design/content
- `DELETE /cards/:id` — archive/delete
- `PATCH /cards/:id/default` — set default card
- `GET /public/cards/:slug` — public card data for Next.js public page

Responsibilities:

- Enforce per-tier card count limits.
- Ensure slugs are unique and stable.
- Trigger cache invalidation on card updates.

### 5.4 NfcModule

> Implements final NFC rules with **1 tag → 1 card** mapping.

#### Admin Endpoints

- `POST /admin/nfc-tags/import`

  - Accept CSV of UIDs
  - Create `NfcTag` records with `status=AVAILABLE`, no `assignedUserId`, no `cardId`.

- `POST /admin/nfc-tags/:id/assign`

  - Set `assignedUserId` and `status=ASSIGNED`.

- `POST /admin/nfc-tags/:id/revoke`

  - Set `status=REVOKED`, clear `assignedUserId`, clear `cardId`.

#### User Endpoints

- `GET /me/nfc-tags`

  - List tags where `assignedUserId` is current user.

- `POST /me/nfc-tags/:id/associate-card`

  - Body: `{ cardId }`
  - Preconditions:

    - Tag `status=ASSIGNED`
    - Tag `assignedUserId` = current user

  - Action: set `cardId` to provided `cardId`.
  - If previously associated with another card, you must first disassociate.

- `POST /me/nfc-tags/:id/disassociate-card`

  - Set `cardId=NULL`.

> **Constraint**: The backend **must not allow multiple card associations** per tag. The schema and service logic enforce `cardId` as a single value.

#### Public NFC Resolve Endpoint

Example:

`GET /public/nfc/resolve?uid=<TAG_UID>`

Logic:

1. Find `NfcTag` by `uid`. If not found → 404.
2. If `status != ASSIGNED` → show “Inactive tag” response (no user info).
3. If `cardId` is `NULL` → show “Tag not configured” page (no card to load).
4. If `cardId` not null:

   - Load card
   - Log `AnalyticsEvent` of type `NFC_TAP`
   - Redirect to card’s public URL (`/p/[slug]`) or directly render payload.

ASCII Mirror:

- The NTAG’s URL is configured as:
  `https://app.example.com/p/<slug>?uid=<ASCII_MIRRORED_UID>`
- Next.js public card page sees `uid` and calls `/api/public/nfc/resolve?uid=...` for analytics & checks.

### 5.5 ContactsModule

- `POST /public/cards/:slug/contacts` — capture viewer contact details
- `GET /contacts` — list contacts (for the owner user)
- `PATCH /contacts/:id` — update notes/tags
- Data exports:

  - `GET /contacts/export.csv`
  - `GET /contacts/export.vcf`

### 5.6 AnalyticsModule

Responsibilities:

- Ingest events via:

  - `POST /public/events` — for View / LinkClick / ContactSubmit / NfcTap etc.
  - Internal logging (e.g., when NFC resolve happens)

- Analytics granularity:

  > **Daily only**: We store raw events in `AnalyticsEvent` for detail, but we aggregate exclusively into **daily** buckets (`AnalyticsCardDaily`) for dashboard reporting.

- Aggregation job (cron):

  - Group events by `cardId` + `date(occurredAt)`
  - Increment daily counters in `AnalyticsCardDaily`
  - Optionally mark processed events or work in time windows

- Query endpoints:

  - `GET /analytics/cards/:id?from=YYYY-MM-DD&to=YYYY-MM-DD`

    - Returns arrays keyed per day, using `AnalyticsCardDaily`.
    - Respect tier-based history windows:

      - FREE: last 7 days
      - PRO: last 90 days
      - PREMIUM: unlimited

> No hourly/time-of-day buckets. If needed later, can be added as new tables, but current design is strictly daily.

---

## 6. Frontend Architecture

### 6.1 Routes & Structure

- `/` — marketing / landing

- `/auth/login`, `/auth/register`, `/auth/reset`

- `/dashboard` — protected layout

  - `/dashboard/cards`
  - `/dashboard/cards/[id]` — editor view
  - `/dashboard/nfc` — list of tags, associate/disassociate to cards
  - `/dashboard/contacts`
  - `/dashboard/analytics`
  - `/dashboard/settings` (profile & billing)
  - `/dashboard/integrations`

- `/p/[slug]` — public card view

  - Accepts `uid` query param for NFC flows.

### 6.2 Design System

- Base primitives from shadcn/ui.
- Nexus UI wrappers for consistent brand tokens.
- Dark mode supported via CSS variables if needed.

---

## 7. Public APIs & Conventions

- Base API: `/api`
- Potential versioning: `/api/v1` as needed.
- Auth:

  - JWT (Bearer) or HTTP-only cookies.

Error format (Nest default, optionally wrapped):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Card limit exceeded"
}
```

Key public endpoints:

- `GET /public/cards/:slug`
- `POST /public/cards/:slug/contacts`
- `POST /public/events`
- `GET /public/nfc/resolve?uid=...`

---

## 8. Security & Compliance Highlights

- HTTPS via reverse proxy + HSTS.
- Rate-limiting public and auth endpoints using Redis.
- Password hashing: Argon2id.
- NFC: tags never leak owner identity until tag is assigned and associated with a card; even then, rules ensure only intended card is displayed.
- GDPR: implement data export/delete features per PRD.
- Logging: no PII in logs.

---

## 9. Performance & Caching

- Redis caching for public card payloads (`card:public:<slug>`).
- Cache invalidation on card update.
- Analytics queries run off `AnalyticsCardDaily` for speed.
- Next.js image optimization via `next/image`.
- Cloudflare CDN for static assets.

---

## 10. Background Jobs

Use BullMQ (or NestJS-compatible queue) backed by Redis:

- **AnalyticsAggregatorJob:**

  - Runs periodically (e.g., every 5–15 minutes or hourly), aggregates events into `AnalyticsCardDaily`.

- **EmailNotificationJob:**

  - Sends emails on contact submissions or billing events.

- **HousekeepingJob:**

  - Cleans old events/logs per retention policies.

---

## 11. Environments & Configuration

- **Envs:** `LOCAL`, `STAGING`, `PRODUCTION`
- **Docker Compose Configuration:**

  - Local development: services defined in `docker-compose.yml`
  - Production: services defined in `docker-compose.prod.yml` (when created)
  - All services run in isolated Docker network (`nexus-network`)

- Environment variables for:

  - DB URL (uses Docker service name: `postgresql://postgres:postgres@db:5432/nexus_cards`)
  - Redis URL (uses Docker service name: `redis://redis:6379`)
  - SMTP host (uses Docker service name: `mailhog`)
  - JWT secrets
  - Email provider keys
  - Payment provider keys
  - Public/APP URLs

- API service receives environment variables via `docker-compose.yml`
- Web service uses `NEXT_PUBLIC_API_URL` for client-side API calls

Use NestJS ConfigModule + Zod/Joi validation for `process.env`.

---

## 12. Deployment Strategy

- **Local Development:**

  - `docker compose up --build` builds and runs all services (db, redis, mailhog, api, web)
  - API runs on port 3001, Web runs on port 3000
  - All services communicate via Docker network using service names (db, redis, mailhog)
  - Source code mounted as volumes for hot-reload during development
  - Development Dockerfiles (`Dockerfile.dev`) used for api and web services

- **Production VPS:**

  - Build optimized images via CI using production Dockerfiles
  - Push to registry
  - On VPS: `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`
  - Production uses multi-stage builds with minimal image sizes

- Monitor health via:

  - `GET /api/health` endpoint in API
  - Container health checks in `docker-compose.yml`
  - All services have healthcheck configurations

---

## 13. Open Questions

At this time, there are **no remaining open questions** in this TDD.
