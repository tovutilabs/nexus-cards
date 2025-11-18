# Nexus Cards

A comprehensive digital business card platform built with Next.js, NestJS, PostgreSQL, and Redis.

## Architecture

This is a TypeScript monorepo with the following structure:

```
nexus_cards/
├── apps/
│   ├── web/          # Next.js App Router (Frontend)
│   └── api/          # NestJS API (Backend)
├── packages/
│   └── shared/       # Shared types, DTOs, and utilities
├── docs/             # Documentation
└── docker-compose.yml
```

## Technology Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Query** (data fetching)
- **React Hook Form + Zod** (forms)

### Backend
- **NestJS**
- **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **Redis** (cache, jobs, rate limiting)

### Infrastructure
- **PostgreSQL 16**
- **Redis 7**
- **Docker** (local development)
- **Cloudflare CDN** (production)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nexus_cards
```

2. Install dependencies:
```bash
npm install
```

3. Start all services with Docker Compose:
```bash
docker compose up --build
```

This will start:
- PostgreSQL at localhost:5432
- Redis at localhost:6379
- MailHog at localhost:8025 (SMTP: 1025)
- API server at http://localhost:3001
- Web server at http://localhost:3000

4. Seed the database (creates test users):
```bash
docker exec nexus-api sh -c "cd /app/apps/api && npx ts-node prisma/seed.ts"
```

### Test Users (Development)

After seeding, you can login with these accounts:

| Email | Password | Role | Tier |
|-------|----------|------|------|
| `admin@nexus.cards` | `Admin123!` | ADMIN | PREMIUM |
| `user.free@example.com` | `User123!` | USER | FREE |
| `user.pro@example.com` | `User123!` | USER | PRO |
| `user.premium@example.com` | `User123!` | USER | PREMIUM |

See [docs/dev/seeding.md](docs/dev/seeding.md) for more details.

### Available Scripts

- `npm run dev` - Start all services with Docker Compose
- `npm run docker:up` - Start containers in detached mode
- `npm run docker:down` - Stop all containers
- `npm run docker:logs` - Follow logs from all containers
- `npm run build` - Build all workspaces
- `npm run lint` - Lint all workspaces
- `npm run test` - Run tests in all workspaces

### Docker Commands

```bash
# View container status
docker compose ps

# View logs
docker compose logs -f

# Restart a specific service
docker compose restart api

# Execute commands in container
docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate dev"
```

## Project Structure

### apps/web (Next.js)
- Marketing pages
- User dashboard
- Admin dashboard
- Public card pages
- Authentication flows

### apps/api (NestJS)
- RESTful API
- Authentication & authorization
- Database management (Prisma)
- Background jobs
- Webhooks

### packages/shared
- TypeScript types
- DTOs
- Enums
- Utility functions
- Shared between web and api

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `API_URL` - API server URL
- `WEB_URL` - Web app URL

## Documentation

- [House Rules](docs/house_rules.md) - Coding standards and conventions
- [Product Requirements](docs/prd_nexus_cards.md) - Feature specifications
- [Technical Design](docs/tdd_nexus_cards.md) - Architecture and design decisions
- [Implementation Prompts](prompts.md) - Sequential implementation guide

## Development Workflow

1. Follow the 17 sequential prompts in `prompts.md`
2. Acknowledge House Rules before each task
3. Document new features in `docs/dev/`
4. Ensure all code compiles and tests pass
5. Use full file contents (no snippets or ellipses)

## Critical Constraints

### NFC Tags
- **1 tag → 1 card mapping** (no join tables)
- Direct `cardId` FK on `NfcTag` table
- Admins manage tags; users associate/disassociate only

### Analytics
- **Daily granularity ONLY** (no hourly buckets)
- Aggregate into `AnalyticsCardDaily` table
- Tier-based retention: FREE (7d), PRO (90d), PREMIUM (unlimited)

### ORM
- **Prisma is the ONLY ORM**
- All models in `schema.prisma`
- Migrations via `prisma migrate`
- Repositories wrap Prisma calls

### Subscription Tiers
- **FREE**: 1 card, 7-day analytics, 50 contacts
- **PRO**: 5 cards, 90-day analytics, unlimited contacts
- **PREMIUM**: unlimited cards, unlimited analytics, custom CSS, API access

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Production Deployment

The application is designed for containerized VPS deployment:

1. Build Docker images
2. Deploy to VPS with Docker Compose
3. Use Caddy/Nginx as reverse proxy
4. Configure Cloudflare CDN

## License

Private - All Rights Reserved

## Support

For questions or issues, please refer to the documentation in the `docs/` directory.
