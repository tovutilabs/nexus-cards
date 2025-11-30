FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.22.0

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all packages and apps needed for build
COPY packages ./packages
COPY apps/web ./apps/web

# Install all dependencies (skip postinstall to avoid API-specific scripts)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Generate Prisma Client if shared package needs it
WORKDIR /app/packages/shared
RUN if [ -f "prisma/schema.prisma" ]; then pnpm prisma generate; fi

# Build web application
WORKDIR /app/apps/web

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
