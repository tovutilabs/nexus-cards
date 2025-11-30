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

# Copy prisma schema (needed for generation)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install production dependencies (skip postinstall to avoid errors)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Generate Prisma Client in production (now that @prisma/client is installed)
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Copy built application from builder
WORKDIR /app
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/apps/api/src/main.js"]
