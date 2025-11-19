# Database Seeding

## Overview

The Nexus Cards project includes a database seeding system to create test users and initial data for development environments.

## Seeded Users (Development Only)

The following users are automatically created when running the seed script in development mode:

### Admin User

- **Email**: `admin@nexus.cards`
- **Password**: `Admin123!`
- **Role**: `ADMIN`
- **Tier**: `PREMIUM`
- **Purpose**: Testing admin dashboard and privileged operations

### Regular Users

#### FREE Tier User

- **Email**: `user.free@example.com`
- **Password**: `User123!`
- **Role**: `USER`
- **Tier**: `FREE`
- **Limits**: 1 card, 7-day analytics, 50 contacts
- **Purpose**: Testing FREE tier restrictions

#### PRO Tier User

- **Email**: `user.pro@example.com`
- **Password**: `User123!`
- **Role**: `USER`
- **Tier**: `PRO`
- **Limits**: 5 cards, 90-day analytics, unlimited contacts
- **Purpose**: Testing PRO tier features

#### PREMIUM Tier User

- **Email**: `user.premium@example.com`
- **Password**: `User123!`
- **Role**: `USER`
- **Tier**: `PREMIUM`
- **Limits**: Unlimited cards, unlimited analytics, all features
- **Purpose**: Testing PREMIUM tier features

## Running the Seed Script

### Inside Docker Container (Recommended)

```bash
# Run seed script in the API container
docker exec nexus-api sh -c "cd /app/apps/api && npx ts-node prisma/seed.ts"
```

### Locally (if running outside Docker)

```bash
# From the API directory
cd apps/api
pnpm seed

# Or with explicit NODE_ENV
NODE_ENV=development pnpm seed
```

### Production Environment

In production, the seed script will **NOT** create admin users or test accounts:

```bash
# This will skip admin/test user creation
NODE_ENV=production pnpm seed:prod
```

## Environment Behavior

- **Development** (`NODE_ENV=development` or not set):
  - Creates all test users (admin + 3 regular users)
  - Seeds common data
- **Production** (`NODE_ENV=production`):
  - Skips admin and test user creation
  - Only seeds essential common data (if any)

## Automatic Seeding

The seed script runs automatically after:

- `prisma migrate dev` (development)
- `prisma migrate deploy` (production, but skips admin users)

This is configured via the `prisma.seed` field in `package.json`.

## Security Notes

1. **Never use these credentials in production**
2. Admin users are only created in development environments
3. All passwords are hashed with Argon2
4. In production, admin accounts should be created manually with secure credentials
5. The seed script checks `NODE_ENV` to prevent accidental admin user creation in production

## Customization

To add more seed data, edit `/apps/api/prisma/seed.ts`:

- **Development-only data**: Add to `seedDevelopmentUsers()`
- **All environments**: Add to `seedCommonData()`

## Resetting the Database

To clear all data and re-seed:

```bash
# Reset the database (WARNING: destroys all data)
docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate reset"

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run the seed script
```
