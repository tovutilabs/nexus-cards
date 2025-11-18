# Nexus Cards - AI Agent Instructions

## Project Overview

Nexus Cards is a digital business card platform built as a **TypeScript monorepo** using Next.js (web), NestJS (API), and PostgreSQL with Prisma ORM. The project is in the **planning phase** with comprehensive documentation but no code yet.

## Critical Architecture Decisions

### Monorepo Structure (Not Yet Implemented)
```
apps/
  web/          # Next.js App Router (TypeScript)
  api/          # NestJS backend (TypeScript)
packages/
  shared/       # DTOs, types, utilities (isomorphic)
```

### Technology Stack
- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, React Query, React Hook Form + Zod
- **Backend**: NestJS, TypeScript, Prisma ORM (exclusive), PostgreSQL, Redis (cache/jobs/rate-limiting)
- **Infrastructure**: Docker for local dev, containerized VPS for production, Cloudflare CDN
- **Package Manager**: PNPM or NPM workspaces (to be decided)

### NFC Tag Architecture (Critical Constraint)
**One tag → exactly one card at any time** (1:1, not many-to-many):
- `NfcTag` table has direct `cardId` FK (nullable when unassociated)
- **NO join table** like `NfcTagCardLink` is allowed
- A card CAN have multiple tags, but a tag CANNOT link to multiple cards
- Only admins can import/assign tags; users can only associate/disassociate them
- Tags use NTAG ASCII Mirror: `https://nexus.cards/p/<slug>?uid=<TAG_UID>`

### Analytics Architecture (Critical Constraint)
**Daily granularity ONLY** - no hourly or sub-daily buckets:
- Raw events stored in `AnalyticsEvent` table
- Aggregated daily into `AnalyticsCardDaily` (unique index on `cardId` + `date`)
- Dashboard queries use daily buckets with tier-based retention (FREE: 7d, PRO: 90d, PREMIUM: unlimited)

### Database & ORM
- **Prisma is the ONLY ORM** - no TypeORM, Sequelize, or other ORMs
- All models defined in `schema.prisma`
- Migrations via `prisma migrate`
- Repositories wrap Prisma client calls (controller → service → repository pattern)

## House Rules (Mandatory)

### Code Quality
- **Full file contents only** - no snippets, ellipses, or TODOs
- **ASCII characters only** - no Unicode in code
- **Repo-relative paths** for all file references
- All code must compile; no placeholders or stubs
- Documentation goes to `docs/dev/`

### Backend (NestJS)
- Strict layering: controllers (thin) → services → repositories → entities/DTOs
- Argon2id for password hashing
- JWT or HTTP-only cookies for auth
- No hardcoded secrets (read from env vars)
- Structured logging with `request_id` and `user_id` (no PII)
- Global exception filters for consistent error responses

### Frontend (Next.js)
- App Router with TypeScript
- Server components by default; client components only when necessary
- UI primitives: `components/ui` (shadcn/ui), `components/nexus` (custom wrappers)
- Forms: React Hook Form + Zod validation
- Data fetching: React Query for client-side, `fetch` in server components

### Shared Code
- Use `packages/shared` for DTOs, types, and utilities
- Isomorphic fetch client (don't import `next/headers` directly)
- Maintain naming consistency across frontend/backend

## Key Workflows (When Code Exists)

### Development
```bash
# Root-level scripts (not yet implemented)
pnpm dev          # Start both web and api
pnpm dev:web      # Start Next.js only
pnpm dev:api      # Start NestJS only
pnpm build        # Build both apps
pnpm lint         # Lint all workspaces
pnpm test         # Run all tests
```

### Docker (Local Development)
- Docker Compose for Postgres, Redis, Next.js, NestJS
- All services must have health checks
- Migrations run inside Docker containers

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

## Reference Documentation

Before implementing features, consult these in order:
1. `docs/house_rules.md` - Mandatory coding standards (always follow)
2. `docs/prd_nexus_cards.md` - Product requirements and features
3. `docs/tdd_nexus_cards.md` - Technical architecture and design decisions
4. `prompts.md` - 17 sequential implementation prompts (execution roadmap)

## Current Status

**Project is in planning phase** - no code has been implemented yet. When starting implementation:
1. Begin with Prompt 1 (monorepo setup, environment config, tooling)
2. Acknowledge House Rules before every task
3. Follow the 17-prompt sequence in `prompts.md`
4. Create `docs/dev/` documentation for all new features
