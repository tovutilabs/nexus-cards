FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.22.0

# Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Build application (automatically includes shared package)
RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app

# Set CI environment variable for non-interactive installs
ENV CI=true

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for workspace packages
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install production dependencies (skip scripts to avoid postinstall errors)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

# Copy Prisma Client from builder (generated during build stage)
# PNPM stores it in apps/api/node_modules/.prisma/client
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "dist/apps/api/src/main.js"]
