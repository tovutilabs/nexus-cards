# Production Build Fixes - Complete Summary

## Issues Fixed (in chronological order)

### 1. ✅ Missing Workspace Dependency Declarations
**Error:** `Cannot find module '@nexus-cards/shared'`

**Root Cause:** 
- `@nexus-cards/shared` was not declared as a workspace dependency in `apps/api/package.json` and `apps/web/package.json`
- PNPM workspaces require explicit declarations even for local packages

**Solution:**
```json
// Added to both apps/api/package.json and apps/web/package.json
"dependencies": {
  "@nexus-cards/shared": "workspace:*",
  // ...
}
```

**Files Changed:**
- `apps/api/package.json`
- `apps/web/package.json`

---

### 2. ✅ Postinstall Script Error in Production
**Error:** `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "prisma" not found`

**Root Cause:**
- Root `package.json` had `postinstall: "cd apps/api && pnpm prisma generate"`
- `pnpm install --prod` skips dev dependencies
- `prisma` CLI was a dev dependency, so postinstall failed

**Solution:**
- Use `--ignore-scripts` flag during production install
- Generate Prisma client explicitly after installing dependencies

```dockerfile
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
```

**Files Changed:**
- `apps/api/Dockerfile`

---

### 3. ✅ Prisma Client Generation Strategy
**Error:** `failed to calculate checksum: "/app/node_modules/.prisma": not found`

**Root Cause:**
- Attempted to copy pre-generated Prisma client from builder stage
- PNPM stores Prisma client in complex nested paths under `.pnpm`
- Paths don't match between stages

**Solution:**
- Generate Prisma client **in production stage** instead of copying
- Copy prisma schema before installing dependencies
- Run generation after dependencies are installed

```dockerfile
# Copy prisma schema (needed for generation)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm prisma generate
```

**Files Changed:**
- `apps/api/Dockerfile`

---

### 4. ✅ Prisma CLI Version Mismatch
**Error:** `Cannot find module 'query_engine_bg.postgresql.wasm-base64.js'`

**Root Cause:**
- Used `npx prisma generate` which downloads latest Prisma (v6.19.0)
- Installed `@prisma/client` was v5.22.0
- Version mismatch caused module resolution errors

**Solution:**
- Move `prisma` CLI from devDependencies to production dependencies
- Use `pnpm prisma generate` to use the locally installed version

```json
// apps/api/package.json
"dependencies": {
  "@prisma/client": "^5.22.0",
  "prisma": "^5.22.0",  // Moved from devDependencies
  // ...
}
```

```dockerfile
# Use local prisma CLI (matches @prisma/client version)
RUN pnpm prisma generate
```

**Files Changed:**
- `apps/api/package.json` (moved `prisma` to dependencies)
- `apps/api/Dockerfile` (changed `npx` to `pnpm`)
- `pnpm-lock.yaml` (regenerated)

---

### 4. ✅ Prisma CLI Version Mismatch

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm@10.22.0

# Build stage
FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app
ENV CI=true

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for workspace packages
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Copy prisma schema (needed for generation)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install production dependencies (skip scripts to avoid postinstall errors)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Generate Prisma Client in production
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Copy built application from builder
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/apps/api/src/main.js"]
```

---

## Other Production Issues to Address

### Database Configuration
**Issue:** `DATABASE_URL` format in `.env.production`

Ensure your production `.env.production` has:
```env
# Correct format (database name is nexus_cards, not nexus_user)
DATABASE_URL=postgresql://nexus_user:PASSWORD@db:5432/nexus_cards

# Required variables
DB_PASSWORD=your_strong_password
REDIS_PASSWORD=your_strong_password
```

### Environment Variables
Ensure all required variables are set in `.env.production`:
- `DB_PASSWORD` (must match password in `DATABASE_URL`)
- `REDIS_PASSWORD` (must match password in `REDIS_URL`)
- `JWT_SECRET` (generate with `openssl rand -hex 32`)
- `ENCRYPTION_KEY` (generate with `openssl rand -hex 64`)
- Stripe keys (use live keys in production)
- SMTP credentials

---

## Deployment Checklist

- [x] Pull latest code: `git pull origin master`
- [x] Verify `.env.production` has correct `DATABASE_URL` format
- [x] Verify all passwords match between env vars and connection strings
- [ ] Remove old Docker images: `docker rmi -f $(docker images | grep nexus-cards | awk '{print $3}')`
- [ ] Build without cache: `docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache`
- [ ] Start services: `docker-compose -f docker-compose.prod.yml --env-file .env.production up -d`
- [ ] Verify all containers are healthy: `docker-compose ps`
- [ ] Run migrations: `docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"`
- [ ] Test API health: `curl http://localhost:3001/api/health`
- [ ] Test web app: `curl http://localhost:3000`

---

## Key Learnings

1. **PNPM Workspaces:** Always declare workspace dependencies explicitly with `"workspace:*"`
2. **Prisma in Production:** Keep `prisma` CLI as a production dependency for migrations and generation
3. **Docker Multi-Stage:** Use `--ignore-scripts` to avoid dependency mismatch errors
4. **Lockfile Hygiene:** Always regenerate `pnpm-lock.yaml` after modifying `package.json`
5. **Version Matching:** Ensure `prisma` and `@prisma/client` versions always match
6. **Shared Package Build:** Compile TypeScript to JavaScript - Node.js cannot execute `.ts` files at runtime
7. **Build Order:** Build shared packages before dependent packages in Docker multi-stage builds

---

## Reference Documentation

- Main deployment guide: `docs/dev/vps-deployment.md`
- Quick fix guide: `PRODUCTION_FIX_GUIDE.md`
- Architecture: `.github/copilot-instructions.md`
