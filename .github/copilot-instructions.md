# Nexus Cards - AI Agent Instructions

## Project Overview

Nexus Cards is a **fully implemented** digital business card platform built as a TypeScript monorepo using Next.js 14, NestJS, PostgreSQL (Prisma ORM), and Redis. The codebase is production-ready with comprehensive testing, i18n support, PWA capabilities, and Docker-based development.

## Monorepo Architecture

```
nexus-cards/
├── apps/
│   ├── web/          # Next.js 14 App Router (port 3000)
│   │   ├── src/app/  # App Router pages (grouped routes with parentheses)
│   │   ├── src/components/ui/     # shadcn/ui primitives
│   │   ├── src/components/nexus/  # Custom components
│   │   └── src/lib/  # API client, utilities
│   └── api/          # NestJS backend (port 3001)
│       ├── src/      # Controllers → Services → Repositories
│       └── prisma/   # Schema + migrations + seeds
├── packages/shared/  # Types, enums, utilities (isomorphic)
└── docker-compose.yml  # All services (db, redis, mailhog, api, web)
```

**Package manager**: PNPM with workspaces (`pnpm-workspace.yaml`)

## Critical Architecture Patterns

### Backend: Controller → Service → Repository

All API endpoints follow strict layering (see `apps/api/src/cards/` as example):

```typescript
// Controller: Thin, handles HTTP concerns only
@Controller('api/cards')
export class CardsController {
  constructor(private cardsService: CardsService) {}
}

// Service: Business logic
export class CardsService {
  constructor(private cardsRepository: CardsRepository) {}
}

// Repository: All Prisma access isolated here
export class CardsRepository {
  constructor(private prisma: PrismaService) {}
  async findById(id: string): Promise<Card | null> {
    return this.prisma.card.findUnique({ where: { id } });
  }
}
```

**Critical rules**:
- Controllers NEVER call Prisma directly
- All database access goes through repositories
- Services contain business logic and orchestration

### Authentication: HTTP-Only Cookies + JWT

Auth strategy (`apps/api/src/auth/strategies/jwt.strategy.ts`):

```typescript
jwtFromRequest: ExtractJwt.fromExtractors([
  (request: Request) => request?.cookies?.access_token,
  ExtractJwt.fromAuthHeaderAsBearerToken(),
])
```

- Primary: `access_token` HTTP-only cookie
- Fallback: Bearer token in Authorization header
- Password hashing: Argon2id (via `CryptoService`)
- Guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`

### Frontend: Server Components + Client Hooks

Next.js App Router patterns (`apps/web/src/`):

- **Default**: Server Components (no `'use client'`)
- **Client components**: Forms, interactivity, React Query hooks
- **API client**: `lib/api-client.ts` (credentials: 'include' for cookies)
- **Grouped routes**: `(dashboard)/cards/[id]/` - parentheses hide from URL
- **i18n**: `next-intl` with `[locale]` dynamic route segment

Example React Query usage:
```typescript
const { data } = useQuery({
  queryKey: ['cards', cardId],
  queryFn: () => apiClient.get(`/cards/${cardId}`)
});
```

### Shared Package: Isomorphic Types & Enums

`packages/shared/src/` exports:
- `types/index.ts`: User, Card, Contact interfaces
- `enums/index.ts`: UserRole, SubscriptionTier, CardStatus, etc.
- `utils/index.ts`: generateSlug, isValidEmail, formatDate

**Always import from `@nexus-cards/shared`**, never duplicate types across apps.

## Data Model Constraints (CRITICAL)

### NFC Tag Architecture

**One tag → exactly one card at any time** (1:1, not many-to-many):

```prisma
model NfcTag {
  id       String  @id
  uid      String  @unique
  cardId   String? // Direct FK, nullable when unassociated
  card     Card?   @relation(fields: [cardId], references: [id])
}
```

- `NfcTag` table has direct `cardId` FK (nullable when unassociated)
- **NO join table** like `NfcTagCardLink` is allowed
- A card CAN have multiple tags, but a tag CANNOT link to multiple cards
- Only admins can import/assign tags; users can only associate/disassociate them
- Tags use NTAG ASCII Mirror: `https://nexus.cards/p/<slug>?uid=<TAG_UID>`

### Analytics Architecture

**Daily granularity ONLY** - no hourly or sub-daily buckets:

```prisma
model AnalyticsEvent {
  id        String   @id
  cardId    String
  eventType AnalyticsEventType
  timestamp DateTime @default(now())
  // Raw events stored here
}

model AnalyticsCardDaily {
  id      String   @id
  cardId  String
  date    DateTime @db.Date  // Daily buckets only
  views   Int      @default(0)
  // Aggregated daily metrics
  @@unique([cardId, date])
}
```

- Raw events stored in `AnalyticsEvent` table
- Aggregated daily into `AnalyticsCardDaily` (unique index on `cardId` + `date`)
- Dashboard queries use daily buckets with tier-based retention (FREE: 7d, PRO: 90d, PREMIUM: unlimited)

## Development Workflows

### Docker-First Development

All services run via Docker Compose - **never run services directly on host**:

```bash
# Start all services (db, redis, mailhog, api, web)
pnpm dev  # or: docker compose up --build

# Individual services (still via docker compose)
docker compose up api
docker compose up web

# View logs
pnpm docker:logs  # or: docker compose logs -f

# Database operations (inside container)
pnpm seed        # Run seed script in nexus-api container
pnpm db:migrate  # Run migrations in container
pnpm db:studio   # Open Prisma Studio

# Local development (without Docker, less common)
pnpm dev:local   # Runs api and web directly on host
```

**Critical**: Services communicate using Docker network hostnames (`db:5432`, `redis:6379`), not `localhost`.

### Testing

```bash
# Backend tests
cd apps/api
pnpm test          # Jest unit tests
pnpm test:cov      # With coverage

# Frontend tests
cd apps/web
pnpm test          # Jest component tests
pnpm test:e2e      # Playwright E2E tests
pnpm test:e2e:ui   # Playwright with UI

# All workspaces
pnpm test          # From root
```

### Seeding & Test Users

After `pnpm seed`, these accounts are available:

| Email                      | Password    | Role  | Tier    |
|---------------------------|-------------|-------|---------|
| `admin@nexus.cards`       | `Admin123!` | ADMIN | PREMIUM |
| `user.free@example.com`   | `User123!`  | USER  | FREE    |
| `user.pro@example.com`    | `User123!`  | USER  | PRO     |
| `user.premium@example.com`| `User123!`  | USER  | PREMIUM |

Seed logic: `apps/api/prisma/seed.ts` and `seed-templates.ts`

## House Rules (Mandatory)

### Code Quality

- **Full file contents only** - no snippets, ellipses, or TODOs
- **ASCII characters only** - no Unicode in code
- **Repo-relative paths** for all file references
- All code must compile; no placeholders or stubs
- Documentation goes to `docs/dev/`

### Backend (NestJS)

- Strict layering: controllers (thin) → services → repositories → entities/DTOs
- Argon2id for password hashing (`CryptoService`)
- **Prisma is the ONLY ORM** - all DB access through repositories
- JWT or HTTP-only cookies for auth
- No hardcoded secrets (read from env vars)
- Structured logging with `request_id` and `user_id` (no PII)
- Global exception filters for consistent error responses
- API prefix: `/api/*` (except public routes like `/p/:slug`, `/templates/*`)

### Frontend (Next.js)

- App Router with TypeScript
- Server components by default; client components only when necessary
- UI primitives: `components/ui` (shadcn/ui), `components/nexus` (custom wrappers)
- Forms: React Hook Form + Zod validation
- Data fetching: React Query for client-side, `fetch` in server components
- **Always use `credentials: 'include'`** in API client for cookie-based auth

### Shared Code

- Use `packages/shared` for DTOs, types, and utilities
- Import as `@nexus-cards/shared`
- Isomorphic code only - no Next.js or NestJS-specific imports
- Maintain naming consistency across frontend/backend

## Subscription Tier Enforcement

Apply limits consistently across backend and frontend:

- **FREE**: 1 card, 7-day analytics, 50 contacts
- **PRO**: 5 cards, 90-day analytics, unlimited contacts, basic integrations
- **PREMIUM**: unlimited cards, unlimited analytics, advanced integrations, API access, custom CSS

## Admin Dashboard (Role-Based Access)

Admin routes (`/admin/*`) are strictly limited to users with `role = ADMIN`:

- `/admin/nfc` - NFC inventory management (import, assign, revoke UIDs)
- `/admin/users` - User & subscription management
- `/admin/analytics` - Global daily analytics (daily granularity only)
- `/admin/settings` - System configuration

Backend: Use `RolesGuard` on all admin controllers  
Frontend: Redirect non-admin users to `/dashboard`


## Common Pitfalls to Avoid

1. **DO NOT create a join table** for NFC tags and cards - use direct `cardId` FK
2. **DO NOT use hourly/sub-daily analytics buckets** - daily granularity only
3. **DO NOT use multiple ORMs** - Prisma is the exclusive ORM
4. **DO NOT hardcode secrets** - always use environment variables
5. **DO NOT log PII** - use structured logs with IDs only
6. **DO NOT skip migrations** - every schema change requires a Prisma migration

## Deployment

Production deployment uses Docker Compose on Ubuntu VPS with Nginx reverse proxy:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

**Full deployment guide**: `docs/dev/vps-deployment.md`

Key production requirements:
- Ubuntu 20.04+ VPS (2GB RAM, 2 CPU cores minimum)
- Docker & Docker Compose installed
- Nginx with SSL certificates (Certbot)
- Environment variables in `.env.production`
- Strong passwords for database, Redis, JWT, encryption keys
- Stripe webhooks configured for live mode

## Reference Documentation

Before implementing features, consult these in order:

1. `docs/house_rules.md` - Mandatory coding standards (always follow)
2. `docs/prd_nexus_cards.md` - Product requirements and features
3. `docs/tdd_nexus_cards.md` - Technical architecture and design decisions
4. `docs/dev/vps-deployment.md` - Production deployment guide
5. `prompts.md` - 17 sequential implementation prompts (execution roadmap)