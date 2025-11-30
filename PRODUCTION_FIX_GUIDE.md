# Production Deployment Fix Guide

## Critical Issues Fixed

1. ✅ **Missing workspace dependency declarations** for `@nexus-cards/shared`
2. ✅ **Dockerfile improvements** to properly install workspace packages with PNPM symlinks
3. ⚠️ **DATABASE_URL format** (needs verification on production server)

## Apply Fixes on Production Server

### Step 1: Pull Latest Code

```bash
cd ~/nexus-cards
git pull origin master
```

### Step 2: Verify Environment Variables

Check your `.env.production` file has the correct format:

```bash
# Check DATABASE_URL format
grep DATABASE_URL .env.production

# MUST be in this format:
# DATABASE_URL=postgresql://nexus_user:PASSWORD@db:5432/nexus_cards
#                                                          ^^^^^^^^^^^
#                                                          Database name (NOT nexus_user)

# Check for missing passwords
grep -E "(DB_PASSWORD|REDIS_PASSWORD)" .env.production
```

**If DATABASE_URL is wrong**, edit it:

```bash
nano .env.production

# Change from:
# DATABASE_URL=postgresql://nexus_user:PASSWORD@db:5432/nexus_user

# To:
# DATABASE_URL=postgresql://nexus_user:PASSWORD@db:5432/nexus_cards
```

### Step 3: Stop Containers

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production down
```

### Step 4: Remove Old Images (Force Clean Build)

```bash
# Remove all nexus-cards images
docker rmi -f $(docker images | grep nexus-cards | awk '{print $3}')

# Or manually:
docker images | grep nexus-cards
# Then: docker rmi -f <IMAGE_ID> <IMAGE_ID> ...
```

### Step 5: Rebuild Without Cache (CRITICAL)

This ensures PNPM creates fresh symlinks for the workspace packages:

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache
```

**Expected build time:** 5-15 minutes depending on server specs.

**Watch for these successful steps:**
- ✓ Builder stage: `pnpm install --frozen-lockfile`
- ✓ Builder stage: `pnpm prisma generate`
- ✓ Builder stage: `pnpm build`
- ✓ Production stage: `pnpm install --frozen-lockfile --prod --ignore-scripts`
- ✓ Build completes without "Command prisma not found" errors

### Step 6: Start Services

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Step 7: Verify All Services are Healthy

```bash
# Check container status
docker-compose -f docker-compose.prod.yml --env-file .env.production ps

# All services should show "healthy" status
```

**If containers are unhealthy:**

```bash
# Check logs immediately
docker logs nexus-db --tail 50
docker logs nexus-redis --tail 50
docker logs nexus-api --tail 50
docker logs nexus-web --tail 50
```

### Step 8: Run Database Migrations

```bash
docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

### Step 9: Verify API is Working

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Should return: {"status":"ok"}

# Check API logs for successful startup
docker logs nexus-api --tail 100

# Look for:
# - "Nest application successfully started"
# - No "Cannot find module" errors
# - API listening on port 3001
```

### Step 10: Verify Web App is Working

```bash
# Test web app
curl http://localhost:3000

# Should return HTML (Next.js page)

# Check web logs
docker logs nexus-web --tail 50
```

## Verification Checklist

- [ ] Git pull completed successfully
- [ ] `.env.production` has correct `DATABASE_URL` format (ends with `/nexus_cards`)
- [ ] `.env.production` has `DB_PASSWORD` and `REDIS_PASSWORD` set
- [ ] Old Docker images removed
- [ ] Build completed without errors (--no-cache)
- [ ] All 4 containers show "healthy" status
- [ ] Database migrations ran successfully
- [ ] API health endpoint returns `{"status":"ok"}`
- [ ] Web app returns HTML content
- [ ] No "Cannot find module '@nexus-cards/shared'" errors in logs

## Troubleshooting

### If API still shows "Cannot find module '@nexus-cards/shared'"

```bash
# Verify shared package is accessible
docker exec nexus-api ls -la /app/packages/shared/src

# Verify PNPM symlink exists
docker exec nexus-api ls -la /app/node_modules/.pnpm | grep shared

# Try to resolve the module
docker exec nexus-api node -e "console.log(require.resolve('@nexus-cards/shared'))"

# If any of these fail, rebuild with --no-cache again
```

### If database connection fails

```bash
# Check DATABASE_URL in container
docker exec nexus-api printenv DATABASE_URL

# Test database connection
docker exec nexus-db psql -U nexus_user -d nexus_cards -c "SELECT 1;"

# If fails, check .env.production format and restart containers
```

## Success Indicators

When everything is working correctly, you should see:

```bash
$ docker-compose -f docker-compose.prod.yml --env-file .env.production ps

NAME                IMAGE                    STATUS                   PORTS
nexus-api          nexus-cards-api          Up (healthy)             0.0.0.0:3001->3001/tcp
nexus-db           postgres:16-alpine       Up (healthy)             5432/tcp
nexus-redis        redis:7-alpine           Up (healthy)             6379/tcp
nexus-web          nexus-cards-web          Up (healthy)             0.0.0.0:3000->3000/tcp
```

And API logs should show:

```
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO [NestApplication] Application is running on: http://0.0.0.0:3001
```

## Support

If issues persist after following this guide:

1. Collect logs: `docker-compose -f docker-compose.prod.yml --env-file .env.production logs > debug.log`
2. Check documentation: `docs/dev/vps-deployment.md` (troubleshooting section)
3. Verify all files match the latest repository version
