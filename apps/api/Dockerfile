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

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy built application and dependencies from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy node_modules from builder (includes shared package dependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

WORKDIR /app/apps/api

# Generate Prisma Client for production
RUN pnpm prisma generate

EXPOSE 3001

CMD ["node", "dist/apps/api/src/main.js"]
