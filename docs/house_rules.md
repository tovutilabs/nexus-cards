# HOUSE RULES (Apply to Every Response)

## 1. Output & Format Rules

- Always reply with full file contents for every created or modified file.
- Paths must be repo-relative. No snippets or ellipses.
- No extra prose unless explicitly requested by the user.
- Code must use ASCII characters only.
- No TODOs, placeholders, or stubs—code must compile.
- Place documentation into docs/dev/ as needed.

## 2. Stack & Architecture Conventions

### Frontend (Next.js App Router)

- Use Next.js App Router with TypeScript, shadcn/ui, Tailwind.
- Use React Query for data fetching.
- Use React Hook Form + Zod for forms.
- Place UI primitives in components/ui and Nexus primitives in components/nexus.
- Client components only when necessary.

### Backend (NestJS)

- Follow strict layering: controllers -> services -> repositories -> entities/dtos.
- Controllers remain thin.
- No hardcoded secrets; read from env vars.
- Use **Prisma ORM** as the exclusive ORM for all database access.
- NFC tags must enforce **1 tag → exactly 1 card** mapping at any given time in both schema and services.
- No join table is allowed for NFC tag–card relations.
- A tag must not reference multiple cards; a card may have multiple tags.

### Shared

- Use packages/shared for DTOs, types, and utilities.
- Maintain naming consistency across backend and frontend.
- Use a shared isomorphic fetch client; do not import next/headers directly in reusable modules.

## 3. Database, Migrations & Repositories

- Use PostgreSQL, and Prisma ORM exclusively for all database access and migrations.
- Every DB change must include a migration file and updated schema.
- All timestamps must be ISO8601 UTC.
- All DB access goes through repository classes.
- All database models and relations must be defined in schema.prisma.
- Migrations must be generated using prisma migrate.
- Repositories must wrap Prisma client calls.

## 4. Contracts & API Quality

- API must match docs/openapi.yaml exactly.
- Use strict DTO validation with class-validator or Zod.
- Standard error envelope and correct HTTP status codes.
- Use global NestJS exception filters for consistency.

## 5. Testing Requirements

- Backend: controller, service, and repository tests.
- Frontend: component tests and E2E tests for critical flows.
- API endpoints: positive, negative, auth, and schema validation tests.
- No skipped or flaky tests.

## 6. Security, Privacy & Observability

### Authentication

- Password hashing using Argon2id.
- Rate-limit all auth endpoints.

### Logging

- Use structured logs with request_id and user_id.
- Do not log PII.

### Background Jobs

- All jobs must be idempotent.

### Compliance

- Implement GDPR/CCPA: export, delete, cookie consent.
- Never log secrets.

### Analytics

- Analytics aggregation must operate exclusively on **daily-level granularity**.
- No hourly or sub-daily buckets are permitted anywhere in the system (storage, queries, or dashboards).

## 7. Docker, Environments & DevOps

- **All services run in Docker Compose** (db, redis, mailhog, api, web).
- Local development: `docker compose up` builds and runs all containers.
- API and web services use development Dockerfiles (`Dockerfile.dev`) with hot-reload support.
- Production uses optimized Dockerfiles with multi-stage builds.
- All inter-service communication uses Docker network hostnames (db, redis, mailhog, api, web).
- Database connection string uses `db:5432` not `localhost:5432`.
- Dockerfiles must build successfully and services must stay healthy.

## 8. Deliverables Block (Required Each Task)

Each response must include:

- Files created/updated (with paths).
- Full file contents.
- DB migrations (if any).
- Commands executed.
- Documentation updates (docs/dev/...).

## 9. Definition of Done

### Backend

- nest build and nest test succeed.
- curl happy-path requests work.
- Schema matches OpenAPI.

### Frontend

- next build succeeds.
- No TypeScript or ESLint errors.

### Docker

- All services start cleanly.
- Health checks pass.

### Quality

- No TODOs, commented-out code, unused imports, or console.logs.

## 10. Always Acknowledge the House Rules

Before executing any task, respond: "I acknowledge the House Rules and will adhere to them."
