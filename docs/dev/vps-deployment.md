# VPS Deployment Guide - Ubuntu

This guide provides step-by-step instructions to deploy Nexus Cards on an Ubuntu VPS using Docker Compose with Nginx as a reverse proxy.

## Prerequisites

- Ubuntu 20.04 LTS or 22.04 LTS VPS
- Root or sudo access
- Domain name pointing to your VPS IP
- Minimum requirements: 2GB RAM, 2 CPU cores, 20GB storage
- SSH access to the server

## Step 1: Initial Server Setup

### 1.1 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Create Non-Root User (if not exists)

```bash
sudo adduser nexus
sudo usermod -aG sudo nexus
sudo su - nexus
```

### 1.3 Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## Step 2: Install Docker and Docker Compose

### 2.1 Install Docker

```bash
# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker ${USER}

# Apply group changes (or logout and login again)
newgrp docker

# Verify installation
docker --version
```

### 2.2 Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

## Step 3: Install Node.js and PNPM

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PNPM globally
sudo npm install -g pnpm@10.22.0

# Verify PNPM installation
pnpm --version
```

## Step 4: Clone and Setup Application

### 4.1 Clone Repository

```bash
cd ~
git clone https://github.com/your-username/nexus-cards.git
cd nexus-cards
```

### 4.2 Create Production Environment File

```bash
cp .env.production.example .env.production
```

**Important:** The `.env.production` file must be in the **root directory** of the project (`~/nexus-cards/.env.production`), not in the apps directories.

### 4.3 Configure Environment Variables

Edit `.env.production` with your production values:

```bash
nano .env.production
```

**Critical environment variables to configure:**

```env
NODE_ENV=production

# Database (use strong password)
DATABASE_URL=postgresql://nexus_user:STRONG_PASSWORD_HERE@db:5432/nexus_cards

# Redis
REDIS_URL=redis://redis:6379

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=7d

# API Configuration
API_PORT=3001
API_URL=https://api.yourdomain.com

# Web Configuration
WEB_PORT=3000
WEB_URL=https://yourdomain.com

# SMTP Configuration (use production SMTP service)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
EMAIL_FROM=noreply@yourdomain.com

# Stripe (use live keys)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
STRIPE_PRICE_ID_PREMIUM=price_YOUR_PREMIUM_ID

# Encryption Key (generate with: openssl rand -hex 64)
ENCRYPTION_KEY=YOUR_GENERATED_ENCRYPTION_KEY

# OAuth (optional, configure if needed)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

### 4.4 Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate encryption key
openssl rand -hex 64
```

**Important:** Copy the generated secrets and update your `.env.production` file with these values.

### 4.5 Verify Environment File

Ensure your `.env.production` has all required variables:

```bash
# Check for missing or placeholder values
grep -E "(YOUR_|CHANGE_ME|_HERE|^[A-Z_]+=\s*$)" .env.production
```

If any placeholders or empty values are found, update them before proceeding.

## Step 5: Create Production Docker Compose

**Option 1: Copy from template (Recommended):**

```bash
cp docker-compose.prod.yml.example docker-compose.prod.yml
```

**Option 2: Create manually:**

Create `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```

Add the following configuration:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: nexus-db
    restart: always
    environment:
      POSTGRES_USER: nexus_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: nexus_cards
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nexus_user']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nexus-network

  redis:
    image: redis:7-alpine
    container_name: nexus-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nexus-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: nexus-api
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      API_PORT: 3001
      API_URL: ${API_URL}
      WEB_URL: ${WEB_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      EMAIL_FROM: ${EMAIL_FROM}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      STRIPE_PRICE_ID_PRO: ${STRIPE_PRICE_ID_PRO}
      STRIPE_PRICE_ID_PREMIUM: ${STRIPE_PRICE_ID_PREMIUM}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3001/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - nexus-network

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: nexus-web
    restart: always
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
      API_URL_INTERNAL: http://nexus-api:3001
      NEXT_TELEMETRY_DISABLED: 1
    depends_on:
      api:
        condition: service_healthy
    networks:
      - nexus-network

volumes:
  postgres_data:
  redis_data:

networks:
  nexus-network:
    driver: bridge
```

## Step 6: Build and Start Services

**Pre-flight Checklist:**
```bash
# Verify you're in the project root
pwd
# Should output: /home/nexus/nexus-cards

# Verify .env.production exists in current directory
ls -la .env.production

# Verify docker-compose.prod.yml exists
ls -la docker-compose.prod.yml

# Verify required variables are set
grep -c "=" .env.production
# Should show multiple lines (at least 20+)
```

### 6.1 Verify Docker is Running

```bash
# Check if Docker daemon is running
sudo systemctl status docker

# If not running, start Docker
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Verify Docker is working
docker ps
```

### 6.2 Build Docker Images

```bash
# Load environment variables (use --env-file flag instead)
# This ensures all variables are properly passed to Docker Compose

# Build images (this will take several minutes)
docker-compose -f docker-compose.prod.yml --env-file .env.production build
```

### 6.2.1 Understanding the Build Process

The Docker build follows this sequence:

**Builder Stage:**
1. Install pnpm globally
2. Copy package.json files (root + workspaces)
3. Install all dependencies (`pnpm install --frozen-lockfile`)
4. Copy source code
5. Build shared package first (`packages/shared`)
6. Build application (`apps/api` or `apps/web`)

**Runner Stage:**
1. Install pnpm globally
2. Copy package.json files
3. Install production dependencies only (`--prod`)
4. Copy built artifacts from builder
5. Generate Prisma client (API only)
6. Start application

**Common mistakes to avoid:**
- ❌ Running build before installing dependencies
- ❌ Not building shared package before app packages
- ❌ Copying node_modules instead of running pnpm install
- ❌ Installing dev dependencies in production stage

### 6.2.2 Build with Debug Output

If build fails, use verbose output:

```bash
# See detailed build steps
docker-compose -f docker-compose.prod.yml --env-file .env.production build --progress=plain

# Build specific service only
docker-compose -f docker-compose.prod.yml --env-file .env.production build --progress=plain web
docker-compose -f docker-compose.prod.yml --env-file .env.production build --progress=plain api
```

### 6.3 Start Services

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 6.4 Verify Services are Running

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production ps
```

All services should show status as "Up" and "healthy".

### 6.5 Run Database Migrations

```bash
docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

### 6.6 Seed Database (Optional - Development Data)

```bash
docker exec nexus-api sh -c "cd /app/apps/api && pnpm seed:prod"
```

### 6.7 Check Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f api
docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f web
```

## Step 7: Install and Configure Nginx

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Create Nginx Configuration

Create configuration for your domain:

```bash
sudo nano /etc/nginx/sites-available/nexus-cards
```

Add the following configuration:

```nginx
# API Server (api.yourdomain.com)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Increase body size for file uploads
        client_max_body_size 10M;
    }
}

# Web Application (yourdomain.com)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Next.js specific settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 7.3 Enable Site Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/nexus-cards /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 8: Install SSL Certificates with Certbot

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificates

```bash
# For API subdomain
sudo certbot --nginx -d api.yourdomain.com

# For web domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts and provide your email address.

### 8.3 Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### 8.4 Restart Nginx

```bash
sudo systemctl restart nginx
```

## Step 9: Configure DNS

Configure your DNS records with your domain registrar:

| Type  | Name | Value              | TTL  |
|-------|------|--------------------|------|
| A     | @    | YOUR_VPS_IP        | 3600 |
| A     | www  | YOUR_VPS_IP        | 3600 |
| A     | api  | YOUR_VPS_IP        | 3600 |
| CNAME | www  | yourdomain.com     | 3600 |

## Step 10: Post-Deployment Tasks

### 10.1 Create First Admin User

Access your API and create an admin user via API or database:

```bash
# Method 1: Via API (use Swagger at https://api.yourdomain.com/api-docs)
# Create user and manually set role to ADMIN in database

# Method 2: Direct database access
docker exec -it nexus-db psql -U nexus_user -d nexus_cards
```

### 10.2 Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/billing/webhook`
3. Select events: `customer.subscription.*`, `invoice.*`
4. Copy webhook secret to your `.env.production` as `STRIPE_WEBHOOK_SECRET`

### 10.3 Test Application

1. Visit `https://yourdomain.com`
2. Create a test account
3. Test card creation and NFC features
4. Verify email delivery
5. Test payment flows (use Stripe test mode)

### 10.4 Monitor Logs

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f

# View last 100 lines
docker-compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100

# API logs only
docker logs nexus-api -f

# Web logs only
docker logs nexus-web -f
```

## Step 11: Backup Configuration

### 11.1 Setup Database Backups

Create backup script:

```bash
nano ~/backup-nexus-db.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR=~/nexus-backups
DB_CONTAINER=nexus-db
DB_USER=nexus_user
DB_NAME=nexus_cards
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/nexus_db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "nexus_db_*.sql" -mtime +7 -delete

echo "Backup completed: nexus_db_$DATE.sql"
```

Make executable:

```bash
chmod +x ~/backup-nexus-db.sh
```

### 11.2 Schedule Automatic Backups

```bash
crontab -e
```

Add daily backup at 2 AM:

```cron
0 2 * * * ~/backup-nexus-db.sh >> ~/nexus-backups/backup.log 2>&1
```

## Step 12: Maintenance Commands

### Update Application

```bash
cd ~/nexus-cards
git pull origin main
docker-compose -f docker-compose.prod.yml --env-file .env.production down
docker-compose -f docker-compose.prod.yml --env-file .env.production build
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
docker exec nexus-api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

### View Resource Usage

```bash
docker stats
```

### Clean Up Docker Resources

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (CAUTION: Don't delete database volumes)
docker volume prune
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml --env-file .env.production restart

# Restart specific service
docker-compose -f docker-compose.prod.yml --env-file .env.production restart api
docker-compose -f docker-compose.prod.yml --env-file .env.production restart web
```

## Troubleshooting

### Docker Daemon Not Running

**Error:** `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

**Or:** `Active: failed (Result: exit-code)` / `Failed to start docker.service`

**Solutions:**

**Step 1: Check detailed error logs**
```bash
# View full Docker logs
sudo journalctl -xeu docker.service

# Check for specific errors
sudo journalctl -xeu docker.service | tail -50
```

**Step 2: Common fixes**

**A) Clean up Docker state (most common fix):**
```bash
# Stop Docker completely
sudo systemctl stop docker
sudo systemctl stop docker.socket

# Remove Docker state files
sudo rm -rf /var/lib/docker/network/files
sudo rm -rf /var/lib/docker/tmp

# Check for stale processes
sudo pkill dockerd
sudo pkill docker-containerd

# Restart Docker
sudo systemctl start docker
sudo systemctl status docker
```

**B) Fix containerd issues:**
```bash
# Restart containerd
sudo systemctl restart containerd
sudo systemctl status containerd

# Then try Docker again
sudo systemctl start docker
```

**C) Reset Docker networking:**
```bash
# Remove network configuration
sudo ip link delete docker0

# Restart Docker
sudo systemctl start docker
```

**D) Check disk space (Docker requires space):**
```bash
# Check available space
df -h

# If /var is full, clean up
sudo docker system prune -a --volumes
# Or manually clear space in /var/lib/docker
```

**E) Verify iptables:**
```bash
# Install iptables if missing
sudo apt install -y iptables

# Restart Docker
sudo systemctl restart docker
```

**Step 3: Full Docker reinstall (if all else fails):**
```bash
# Remove Docker completely
sudo systemctl stop docker
sudo apt remove -y docker-ce docker-ce-cli containerd.io
sudo apt purge -y docker-ce docker-ce-cli containerd.io
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm -rf /etc/docker

# Reinstall Docker (follow Step 2.1)
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker
```

**Step 4: Verify Docker is working:**
```bash
# Check Docker status
sudo systemctl status docker

# Test Docker
docker ps
docker run hello-world
```

### Environment Variables Not Loaded

**Error:** `The "DB_PASSWORD" variable is not set. Defaulting to a blank string.`

**Or:** `couldn't find env file: /path/to/apps/api/.env.production`

**Solutions:**

1. **Ensure .env.production is in the root directory:**
```bash
# Check current directory
pwd
# Should output: /home/nexus/nexus-cards (or your project root)

# Verify .env.production exists in root
ls -la .env.production

# If missing, create it from example
cp .env.production.example .env.production
```

2. **Use --env-file flag with correct path** (Recommended):
```bash
# Run from project root directory
cd ~/nexus-cards

# Build with env file
docker-compose -f docker-compose.prod.yml --env-file .env.production build
```

3. **Alternative: Export variables** (Less reliable):
```bash
set -a
source .env.production
set +a
docker-compose -f docker-compose.prod.yml build
```

4. **Verify environment file exists and has correct values:**
```bash
# Check file exists
ls -la .env.production

# Check for empty or placeholder values
grep -E "(YOUR_|CHANGE_ME|_HERE)" .env.production

# Verify critical variables are set
grep -E "(DB_PASSWORD|REDIS_PASSWORD|JWT_SECRET)" .env.production
```

### Database/Redis Containers Unhealthy

**Error:** `dependency failed to start: container nexus-db is unhealthy` or `container nexus-redis is unhealthy`

**This is the most common production deployment error.** It means the database or Redis container started but failed its health check.

**Step 1: Check container logs immediately**

```bash
# View database container logs
docker logs nexus-db

# View Redis container logs  
docker logs nexus-redis

# Common errors to look for:
# - "FATAL: password authentication failed"
# - "FATAL: database does not exist"
# - "permission denied"
# - Redis: "WRONGPASS invalid username-password pair"
```

**Step 2: Verify environment variables are loaded**

```bash
# Check if DB_PASSWORD is set in the database container
docker exec nexus-db printenv POSTGRES_PASSWORD

# Check if containers can see environment variables
docker inspect nexus-db | grep -A 10 "Env"
docker inspect nexus-redis | grep -A 10 "Env"

# If variables are empty or missing, the --env-file flag didn't work
```

**Step 3: Common causes and fixes**

**A) Missing or incorrect DB_PASSWORD/REDIS_PASSWORD:**

The `docker-compose.prod.yml` file uses `${DB_PASSWORD}` and `${REDIS_PASSWORD}` variables. These MUST be defined in `.env.production`:

```bash
# Add to .env.production
DB_PASSWORD=your_secure_database_password_here
REDIS_PASSWORD=your_secure_redis_password_here
```

Then restart:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production down
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**B) DATABASE_URL doesn't match DB_PASSWORD:**

Your `DATABASE_URL` in `.env.production` must use the SAME password as `DB_PASSWORD`:

```env
# These MUST match:
DB_PASSWORD=MySecurePass123
DATABASE_URL=postgresql://nexus_user:MySecurePass123@db:5432/nexus_cards
#                                    ^^^^^^^^^^^^^^^^
#                                    Must be the same password
```

**C) Redis password mismatch:**

If using Redis password, both Redis container and REDIS_URL must match:

```env
# In docker-compose.prod.yml:
# redis: --requirepass ${REDIS_PASSWORD}

# In .env.production:
REDIS_PASSWORD=MyRedisPass123
REDIS_URL=redis://:MyRedisPass123@redis:6379
#                  ^^^^^^^^^^^^^^^^
#                  Must match REDIS_PASSWORD
```

**D) Port conflicts:**

Check if ports 5432 or 6379 are already in use:

```bash
# Check what's using PostgreSQL port
sudo lsof -i :5432

# Check what's using Redis port
sudo lsof -i :6379

# If something else is using these ports, stop those services:
sudo systemctl stop postgresql  # If system PostgreSQL is running
sudo systemctl stop redis-server  # If system Redis is running
```

**E) Volume permission issues:**

```bash
# Stop containers
docker-compose -f docker-compose.prod.yml --env-file .env.production down

# Remove volumes (WARNING: This deletes all data!)
docker volume rm nexus-cards_postgres_data
docker volume rm nexus-cards_redis_data

# Restart
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Step 4: Test database connection manually**

```bash
# Wait for container to be healthy
docker-compose -f docker-compose.prod.yml --env-file .env.production ps

# Test PostgreSQL connection
docker exec nexus-db psql -U nexus_user -d nexus_cards -c "SELECT 1;"

# If this fails with authentication error, password is wrong
# If this fails with "database does not exist", database wasn't created
```

**Step 5: Verify health check commands work**

```bash
# Test database health check manually
docker exec nexus-db pg_isready -U nexus_user

# Test Redis health check manually  
docker exec nexus-redis redis-cli --raw incr ping

# If Redis requires password:
docker exec nexus-redis redis-cli -a "YOUR_REDIS_PASSWORD" ping
```

**Step 6: Check Docker Compose configuration**

Verify your `docker-compose.prod.yml` has correct variable substitution:

```bash
# View resolved configuration (shows actual values)
docker-compose -f docker-compose.prod.yml --env-file .env.production config

# Check database section shows correct password (not empty or placeholder)
```

**Step 7: Complete reset (if all else fails)**

```bash
# Stop everything
docker-compose -f docker-compose.prod.yml --env-file .env.production down -v

# Remove all containers and volumes
docker rm -f nexus-db nexus-redis nexus-api nexus-web
docker volume rm nexus-cards_postgres_data nexus-cards_redis_data

# Verify environment variables are correct
cat .env.production | grep -E "(DB_PASSWORD|REDIS_PASSWORD|DATABASE_URL|REDIS_URL)"

# Start fresh
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Watch logs in real-time
docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f
```

**Quick diagnostic command:**

```bash
# Run this single command to check everything:
echo "=== Environment Variables ===" && \
grep -E "(DB_PASSWORD|REDIS_PASSWORD|DATABASE_URL)" .env.production && \
echo -e "\n=== Container Status ===" && \
docker-compose -f docker-compose.prod.yml --env-file .env.production ps && \
echo -e "\n=== Database Logs ===" && \
docker logs nexus-db --tail 20 && \
echo -e "\n=== Redis Logs ===" && \
docker logs nexus-redis --tail 20
```

### API Container: Cannot find module '@nexus-cards/shared'

**Error:** `Error: Cannot find module '@nexus-cards/shared'` in nexus-api logs

**Cause:** The shared package (`packages/shared`) is not properly included in the Docker build or its node_modules are missing.

**Solutions:**

**Step 1: Verify Dockerfile copies shared package correctly**

Check `apps/api/Dockerfile` includes these lines in the production stage:

```dockerfile
# Copy built application and dependencies from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
```

**Step 2: Rebuild with no cache**

```bash
cd ~/nexus-cards

# Stop containers
docker-compose -f docker-compose.prod.yml --env-file .env.production down

# Remove old images
docker rmi nexus-cards-api nexus-cards-web

# Rebuild without cache
docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Step 3: Verify shared package exists in container**

```bash
# Check if shared package is present
docker exec nexus-api ls -la /app/packages/shared

# Check if node_modules are linked correctly
docker exec nexus-api ls -la /app/node_modules/@nexus-cards

# Verify package can be imported
docker exec nexus-api node -e "console.log(require.resolve('@nexus-cards/shared'))"
```

**Step 4: Check pnpm workspace configuration**

Ensure `pnpm-workspace.yaml` in project root contains:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Database Name Mismatch

**Error:** `FATAL: database "nexus_user" does not exist`

**Cause:** The `DATABASE_URL` is incorrectly formatted, using the username as the database name.

**Solution:**

Edit `.env.production` and ensure `DATABASE_URL` follows this exact format:

```env
# Correct format:
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
#                         ^^^^^^^^         ^^^^^^^^     ^^^^^^^^^^^^^
#                         User            Password      Actual DB name

# Example (must match docker-compose.prod.yml):
DATABASE_URL=postgresql://nexus_user:MySecurePass123@db:5432/nexus_cards
#                                                              ^^^^^^^^^^^
#                                                              This is the database name (not nexus_user)
```

**Verification:**

```bash
# Check DATABASE_URL format
grep DATABASE_URL .env.production

# Should end with /nexus_cards, not /nexus_user

# Restart containers after fixing
docker-compose -f docker-compose.prod.yml --env-file .env.production down
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Services Not Starting

```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker if needed
sudo systemctl start docker

# Check logs
docker-compose -f docker-compose.prod.yml --env-file .env.production logs

# Check service health
docker-compose -f docker-compose.prod.yml --env-file .env.production ps

# Rebuild containers
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --force-recreate
```

### Database Connection Issues

```bash
# Check database is running
docker exec nexus-db pg_isready -U nexus_user

# Verify connection string
docker exec nexus-api printenv DATABASE_URL

# Access database directly
docker exec -it nexus-db psql -U nexus_user -d nexus_cards
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew --force-renewal

# Check Nginx configuration
sudo nginx -t
```

### Application Errors

```bash
# Check API health
curl http://localhost:3001/api/health

# Check web health
curl http://localhost:3000

# View detailed logs
docker logs nexus-api --tail=100
docker logs nexus-web --tail=100
```

### Docker Build Failures

**Error:** `sh: next: not found` or `node_modules missing, did you mean to install?`

**Cause:** Dependencies not properly installed during Docker build.

**Solution:**

```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild with no cache
docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

# If still failing, check Dockerfile has correct structure
# Ensure pnpm install runs before pnpm build in the builder stage
```

**Error:** `Failed to compile` with ESLint or TypeScript errors

**Cause:** Code quality issues preventing production build.

**Solutions:**

1. **Missing dependencies error** (`Cannot find module 'package-name'`):
   
   ```bash
   # Install missing dependencies locally first
   cd ~/nexus-cards
   pnpm install
   
   # Then rebuild Docker images
   docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache
   ```

2. **Temporary fix - Disable ESLint during builds:**
   
   Edit `apps/web/next.config.js`:
   ```javascript
   eslint: {
     ignoreDuringBuilds: true, // Disable ESLint for production builds
   },
   ```

3. **Proper fix - Fix the actual errors:**
   
   Common issues:
   - **React Hooks called conditionally**: Move all hooks to the top of the component before any return statements
   - **Missing ESLint rules**: Update `.eslintrc` configuration
   - **TypeScript errors**: Fix type issues in the codebase
   - **Missing dependencies**: Add them to `package.json`

4. **Check specific errors:**
   ```bash
   # View full build output
   docker-compose -f docker-compose.prod.yml --env-file .env.production build --progress=plain web
   ```

**Error:** `failed to solve: process did not complete successfully`

**Solutions:**

1. **Check for sufficient disk space:**
```bash
df -h
# Docker needs at least 10GB free for builds
```

2. **Clear Docker build cache:**
```bash
docker system prune -a --volumes
docker builder prune -a
```

3. **Build images one at a time:**
```bash
# Build API first
docker-compose -f docker-compose.prod.yml --env-file .env.production build api

# Then build web
docker-compose -f docker-compose.prod.yml --env-file .env.production build web
```

4. **Check Docker logs during build:**
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production build --progress=plain
```

**Error:** `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` or `Aborted removal of modules directory`

**Cause:** PNPM cannot remove modules in non-interactive CI environment.

**Solution:** The Dockerfile has been fixed to copy node_modules from builder instead of reinstalling. If you modified the Dockerfile, ensure it sets `ENV CI=true` and copies modules rather than running `pnpm install --prod`.

## Security Checklist

- [ ] Strong passwords for database and Redis
- [ ] JWT secret is cryptographically random (32+ bytes)
- [ ] Encryption key is cryptographically random (64+ bytes)
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] SSL certificates installed and auto-renewal configured
- [ ] Environment variables not committed to git
- [ ] Database backups scheduled
- [ ] Stripe webhook secret configured
- [ ] SMTP credentials secured
- [ ] SSH key-based authentication enabled
- [ ] Regular security updates scheduled

## Performance Optimization

### Enable Gzip Compression in Nginx

Add to your Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### Configure Docker Resource Limits

Add to `docker-compose.prod.yml`:

```yaml
services:
  api:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Enable Redis Persistence

Add to Redis service in `docker-compose.prod.yml`:

```yaml
redis:
  # ... existing config
  command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
```

## Monitoring Setup (Optional)

Consider adding monitoring tools:

- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Log management**: Papertrail, Logtail
- **Performance monitoring**: New Relic, DataDog

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation in `docs/` directory
- Check GitHub issues

## Next Steps

1. Configure Cloudflare CDN (optional but recommended)
2. Setup monitoring and alerts
3. Configure automatic backups to remote storage
4. Implement CI/CD pipeline for automated deployments
5. Setup staging environment for testing updates
