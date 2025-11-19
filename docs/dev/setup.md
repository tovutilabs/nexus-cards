# Development Setup Documentation

## Overview

This document describes the monorepo setup, environment configuration, and development workflow for Nexus Cards.

## Monorepo Structure

Nexus Cards uses PNPM workspaces to manage a monorepo with the following structure:

```
nexus_cards/
├── apps/
│   ├── web/              # Next.js frontend application
│   │   ├── src/
│   │   │   └── app/      # Next.js App Router pages
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   └── api/              # NestJS backend application
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   └── app.controller.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
├── packages/
│   └── shared/           # Shared TypeScript code
│       ├── src/
│       │   ├── types/
│       │   ├── enums/
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   └── dev/              # Development documentation
├── docker-compose.yml    # Local development services
├── package.json          # Root workspace configuration
└── .env.example          # Environment variable template
```

## Environment Configuration

### Local Development

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Local development assumes Docker services are running:

- PostgreSQL on port 5432 (nexus-db)
- Redis on port 6379 (nexus-redis)
- MailHog on ports 1025 (SMTP) and 8025 (UI) (nexus-mailhog)

All Docker services include health checks and will show as "healthy" when ready.

### Environment Files

- `.env.example` - Template for all environments
- `.env.local.example` - Local development with Docker
- `.env.production.example` - Production VPS deployment
- `.env.local` - Your local settings (gitignored)

### Key Environment Variables

| Variable       | Description           | Default                                                     |
| -------------- | --------------------- | ----------------------------------------------------------- |
| `NODE_ENV`     | Environment mode      | `development`                                               |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/nexus_cards` |
| `REDIS_URL`    | Redis connection      | `redis://localhost:6379`                                    |
| `JWT_SECRET`   | JWT signing key       | Must be set                                                 |
| `API_PORT`     | API server port       | `3001`                                                      |
| `WEB_PORT`     | Web server port       | `3000`                                                      |

## Tooling

### ESLint

ESLint is configured at the root level with TypeScript support:

- Extends recommended TypeScript rules
- Integrates with Prettier
- Warns on console.log statements
- Ignores common build directories

Run linting:

```bash
pnpm lint
```

### Prettier

Prettier enforces consistent code formatting:

- Single quotes
- Semicolons
- 2-space indentation
- 80-character line width

Format all files:

```bash
pnpm format
```

### TypeScript

All apps and packages use TypeScript with strict mode enabled:

- Strict null checks
- No implicit any
- Strict bind/call/apply

## Development Workflow

### Starting Development

1. Start Docker services:

```bash
docker-compose up -d
```

2. Install dependencies:

```bash
pnpm install
```

3. Start development servers:

```bash
pnpm dev
```

This starts both web (port 3000) and api (port 3001) concurrently using concurrently package.

### Individual App Development

Start only the web app:

```bash
pnpm dev:web
```

Start only the API:

```bash
pnpm dev:api
```

### Building

Build all workspaces:

```bash
pnpm build
```

Build individual apps:

```bash
pnpm build:web
pnpm build:api
```

### Testing

Run all tests:

```bash
pnpm test
```

Tests are configured per workspace and will run in all apps/packages that have test scripts.

## Docker Services

### PostgreSQL

- Image: `postgres:16-alpine`
- Port: `5432`
- Default user: `postgres`
- Default password: `postgres`
- Default database: `nexus_cards`
- Volume: `postgres_data`

Health check runs `pg_isready` every 10 seconds.

### Redis

- Image: `redis:7-alpine`
- Port: `6379`
- Volume: `redis_data`

Health check pings Redis every 10 seconds.

### MailHog

- Image: `mailhog/mailhog:latest`
- SMTP Port: `1025`
- Web UI Port: `8025`

Access MailHog UI at http://localhost:8025 to view emails sent during development.

## Workspace Dependencies

The monorepo uses PNPM workspaces (configured in `pnpm-workspace.yaml`) to link packages. The `@nexus-cards/shared` package is referenced by both web and api:

```json
{
  "dependencies": {
    "@nexus-cards/shared": "*"
  }
}
```

TypeScript path aliases are configured to resolve shared code:

```json
{
  "paths": {
    "@nexus-cards/shared": ["../../packages/shared/src/index.ts"]
  }
}
```

## API Endpoints

### Health Check

`GET /api/health`

Returns API health status:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Web Routes

- `/` - Home page (marketing)

Additional routes will be added in subsequent prompts.

## Current Status

✅ **Prompt 1 Complete** - Core repository setup finished

- Monorepo structure with PNPM workspaces
- Next.js 14 (web) and NestJS (api) configured
- Docker services running (PostgreSQL, Redis, MailHog)
- ESLint, Prettier, TypeScript configured
- All 844 packages installed
- Development servers verified working

## Next Steps

**Prompt 2** - Design System: Brand Tokens, Typography, Spacing & shadcn Theme

- Tailwind theme tokens
- shadcn/ui integration
- Nexus UI primitives
- `/design-system` showcase route

Then:

1. Prompt 3 - Prisma schema and migrations
2. Prompt 4 - Authentication module
3. Prompt 5 - Core card functionality

## Troubleshooting

### Docker services not starting

Check if ports are already in use:

```bash
lsof -i :5432
lsof -i :6379
```

Stop existing services or change ports in `docker-compose.yml`.

### TypeScript errors

Ensure all dependencies are installed:

```bash
pnpm install
```

Restart your IDE/editor to pick up TypeScript configuration changes.

### Build failures

Clear build artifacts and rebuild:

```bash
rm -rf apps/*/dist apps/*/.next
pnpm build
```

### Port conflicts

If ports 3000 or 3001 are already in use:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

## References

- [House Rules](../house_rules.md)
- [PRD](../prd_nexus_cards.md)
- [TDD](../tdd_nexus_cards.md)
- [Implementation Prompts](../../prompts.md)
