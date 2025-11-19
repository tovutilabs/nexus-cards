# Testing & CI/CD - Nexus Cards

## Overview

This document covers the testing strategy, CI/CD pipeline, and quality assurance practices for the Nexus Cards platform.

---

## Public API Access

### Authentication

All Public API v1 endpoints require API key authentication via the `X-API-Key` header or `apiKey` query parameter.

```bash
# Header-based authentication (recommended)
curl -H "X-API-Key: nxk_your_api_key_here" https://nexus.cards/api/v1/cards

# Query parameter authentication
curl https://nexus.cards/api/v1/cards?apiKey=nxk_your_api_key_here
```

### API Key Management

#### Create API Key

```http
POST /api/api-keys
Authorization: Bearer <jwt_token>

{
  "name": "My Integration",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

Response:

```json
{
  "id": "cuid123",
  "userId": "user123",
  "name": "My Integration",
  "key": "nxk_dGhpc19pc19hX3NlY3JldF9rZXk",
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**IMPORTANT**: Save the `key` value immediately - it cannot be retrieved later.

#### List API Keys

```http
GET /api/api-keys
Authorization: Bearer <jwt_token>
```

#### Rotate API Key

```http
POST /api/api-keys/{keyId}/rotate
Authorization: Bearer <jwt_token>
```

Revokes the old key and generates a new one.

#### Revoke API Key

```http
POST /api/api-keys/{keyId}/revoke
Authorization: Bearer <jwt_token>
```

#### Delete API Key

```http
DELETE /api/api-keys/{keyId}
Authorization: Bearer <jwt_token>
```

### Premium Tier Enforcement

API keys are **PREMIUM tier only**. Attempting to create an API key with a FREE or PRO subscription returns:

```json
{
  "statusCode": 403,
  "message": "API keys require a PREMIUM subscription",
  "error": "Forbidden"
}
```

---

## Public API V1 Endpoints

### List Cards

```http
GET /api/v1/cards
X-API-Key: nxk_your_api_key
```

Returns all published cards for the authenticated user.

Response:

```json
[
  {
    "id": "card123",
    "slug": "john-doe",
    "fullName": "John Doe",
    "jobTitle": "Software Engineer",
    "company": "Acme Inc",
    "email": "john@example.com",
    "phone": "+1234567890",
    "isPublished": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Get Card Metadata

```http
GET /api/v1/cards/{cardId}
X-API-Key: nxk_your_api_key
```

Returns card details with analytics counts.

Response:

```json
{
  "id": "card123",
  "slug": "john-doe",
  "fullName": "John Doe",
  "jobTitle": "Software Engineer",
  "company": "Acme Inc",
  "email": "john@example.com",
  "phone": "+1234567890",
  "isPublished": true,
  "totalViews": 1234,
  "totalContacts": 56,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### List Contacts

```http
GET /api/v1/contacts?limit=100&offset=0
X-API-Key: nxk_your_api_key
```

Paginated list of contacts collected across all cards.

Response:

```json
{
  "contacts": [
    {
      "id": "contact123",
      "cardId": "card123",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+9876543210",
      "company": "Tech Corp",
      "createdAt": "2024-01-16T14:20:00Z"
    }
  ],
  "total": 56,
  "limit": 100,
  "offset": 0
}
```

### Log Analytics Event

```http
POST /api/v1/analytics/events
X-API-Key: nxk_your_api_key
Content-Type: application/json

{
  "cardId": "card123",
  "eventType": "CARD_VIEW",
  "metadata": {
    "source": "external_integration",
    "campaign": "email_signature"
  }
}
```

Response:

```json
{
  "id": "event123",
  "cardId": "card123",
  "eventType": "CARD_VIEW",
  "timestamp": "2024-01-17T09:15:00Z"
}
```

---

## Rate Limiting

All Public API v1 endpoints enforce rate limits to prevent abuse:

- **Global limit**: 100 requests per 60 seconds per API key
- **Per-endpoint limits**: Same as global (100/min)

When rate limit is exceeded:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1610874600
```

---

## Webhooks

### Event Types

Nexus Cards supports the following webhook events:

- `CARD_VIEW` - Card was viewed
- `CONTACT_CREATED` - New contact submitted
- `PAYMENT_SUCCESS` - Subscription payment completed
- `NFC_TAG_SCAN` - NFC tag was scanned
- `EXPERIMENT_EVENT` - A/B test event triggered

### Creating a Webhook

```http
POST /api/webhooks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://example.com/webhooks",
  "events": ["CARD_VIEW", "CONTACT_CREATED"]
}
```

Response:

```json
{
  "id": "webhook123",
  "url": "https://example.com/webhooks",
  "events": ["CARD_VIEW", "CONTACT_CREATED"],
  "secret": "whsec_dGhpc19pc19hX3NlY3JldF93aHNlY3JldA",
  "isActive": true,
  "createdAt": "2024-01-18T11:00:00Z"
}
```

**IMPORTANT**: Save the `secret` immediately for signature verification.

### Webhook Payload

```http
POST https://example.com/webhooks
Content-Type: application/json
X-Webhook-Signature: a3f8b9c2d1e0f9a8b7c6d5e4f3a2b1c0
X-Webhook-Timestamp: 1610874600

{
  "event": "CARD_VIEW",
  "data": {
    "cardId": "card123",
    "userId": "user123",
    "timestamp": "2024-01-18T12:00:00Z",
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.1"
    }
  }
}
```

### Signature Verification

All webhook requests include HMAC-SHA256 signatures for verification:

**Node.js Example:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');

  return signature === expectedSignature;
}

// Express middleware
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = req.body;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, signature, timestamp, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  console.log('Valid webhook:', payload);
  res.status(200).json({ received: true });
});
```

**Python Example:**

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, timestamp, secret):
    signature_payload = f"{timestamp}.{json.dumps(payload)}"
    expected_signature = hmac.new(
        secret.encode(),
        signature_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# Flask example
@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    timestamp = request.headers.get('X-Webhook-Timestamp')
    payload = request.get_json()
    secret = os.environ['WEBHOOK_SECRET']

    if not verify_webhook_signature(payload, signature, timestamp, secret):
        return {'error': 'Invalid signature'}, 401

    # Process webhook
    print('Valid webhook:', payload)
    return {'received': True}, 200
```

### Retry Logic

Failed webhook deliveries are automatically retried with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: After 60 seconds
- Attempt 3: After 5 minutes
- Attempt 4: After 15 minutes
- Attempt 5: After 1 hour
- Attempt 6: After 2 hours

After 5 failed attempts, the delivery is marked as permanently failed. You can manually retry failed deliveries from the dashboard.

### Managing Webhooks

#### List Webhooks

```http
GET /api/webhooks
Authorization: Bearer <jwt_token>
```

#### Get Webhook Details

```http
GET /api/webhooks/{webhookId}
Authorization: Bearer <jwt_token>
```

Includes delivery history (last 50 deliveries).

#### Update Webhook

```http
PUT /api/webhooks/{webhookId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://new-url.com/webhooks",
  "events": ["CARD_VIEW"],
  "isActive": false
}
```

#### Delete Webhook

```http
DELETE /api/webhooks/{webhookId}
Authorization: Bearer <jwt_token>
```

#### Regenerate Secret

```http
POST /api/webhooks/{webhookId}/regenerate-secret
Authorization: Bearer <jwt_token>
```

#### Retry Failed Delivery

```http
POST /api/webhooks/{webhookId}/deliveries/{deliveryId}/retry
Authorization: Bearer <jwt_token>
```

---

## Testing Strategy

### Unit Tests

Unit tests focus on individual service methods and business logic.

**Backend (NestJS + Jest):**

```bash
# Run all unit tests
cd apps/api && pnpm test

# Run specific test file
pnpm test auth.service.spec.ts

# Run with coverage
pnpm test --coverage
```

**Frontend (Next.js + Jest + React Testing Library):**

```bash
# Run all frontend tests
cd apps/web && pnpm test

# Run with watch mode
pnpm test --watch
```

### Integration Tests

Integration tests verify end-to-end flows across multiple modules.

**Example: API Key Validation**

```typescript
// apps/api/src/api-keys/api-keys.integration.spec.ts
describe('API Key Validation', () => {
  it('should reject expired API keys', async () => {
    const expiredKey = await createExpiredApiKey();
    const response = await request(app)
      .get('/v1/cards')
      .set('X-API-Key', expiredKey);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('expired');
  });

  it('should enforce Premium tier for API keys', async () => {
    const freeUser = await createUser({ tier: 'FREE' });
    const response = await request(app)
      .post('/api/api-keys')
      .set('Authorization', `Bearer ${freeUser.jwt}`)
      .send({ name: 'Test Key' });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('PREMIUM');
  });
});
```

**Example: Webhook Delivery**

```typescript
// apps/api/src/webhooks/webhook-delivery.integration.spec.ts
describe('Webhook Delivery', () => {
  it('should deliver webhook with valid signature', async () => {
    const mockServer = setupMockWebhookServer();
    const webhook = await createWebhook({ url: mockServer.url });

    await webhookDeliveryService.deliverWebhook('CARD_VIEW', {
      cardId: 'card123',
      userId: 'user123',
    });

    const request = mockServer.getLastRequest();
    expect(request.headers['x-webhook-signature']).toBeDefined();
    expect(request.headers['x-webhook-timestamp']).toBeDefined();

    const isValid = verifySignature(
      request.body,
      request.headers['x-webhook-signature'],
      request.headers['x-webhook-timestamp'],
      webhook.secret
    );
    expect(isValid).toBe(true);
  });

  it('should retry failed deliveries with exponential backoff', async () => {
    const mockServer = setupMockWebhookServer({ alwaysFail: true });
    const webhook = await createWebhook({ url: mockServer.url });

    await webhookDeliveryService.deliverWebhook('CONTACT_CREATED', {
      cardId: 'card123',
    });

    // Wait for retries
    await sleep(70000); // 60s + buffer

    const delivery = await getDeliveryRecord();
    expect(delivery.attemptCount).toBe(2);
    expect(delivery.nextRetryAt).toBeDefined();
  });
});
```

### E2E Tests

End-to-end tests verify complete user workflows using Playwright.

```bash
# Run E2E tests
cd apps/web && pnpm test:e2e

# Run in headed mode (visible browser)
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e --grep "webhook"
```

**Example: Webhook Management Flow**

```typescript
// apps/web/e2e/webhooks.spec.ts
test('should create and manage webhooks', async ({ page }) => {
  await page.goto('/login');
  await login(page, 'premium@example.com', 'password123');

  await page.goto('/dashboard/webhooks');
  await page.click('button:has-text("Create Webhook")');

  await page.fill('input[placeholder*="https://"]', 'https://example.com/hook');
  await page.check('input#CARD_VIEW');
  await page.check('input#CONTACT_CREATED');
  await page.click('button:has-text("Create")');

  // Should display secret
  await expect(page.locator('text=whsec_')).toBeVisible();
  const secret = await page.locator('code').textContent();
  expect(secret).toMatch(/^whsec_/);

  await page.click('button:has-text("Done")');

  // Should appear in list
  await expect(page.locator('text=https://example.com/hook')).toBeVisible();
  await expect(page.locator('text=CARD_VIEW')).toBeVisible();
  await expect(page.locator('text=CONTACT_CREATED')).toBeVisible();
});
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test-api:
    needs: install
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: nexus_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run API tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/nexus_test
          REDIS_URL: redis://localhost:6379
        run: |
          cd apps/api
          pnpm prisma migrate deploy
          pnpm test --coverage

  test-web:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run frontend tests
        run: cd apps/web && pnpm test --coverage

  e2e:
    needs: [test-api, test-web]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright
        run: cd apps/web && pnpm exec playwright install --with-deps
      - name: Run E2E tests
        run: cd apps/web && pnpm test:e2e

  build-api:
    needs: [lint, test-api]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Build API
        run: cd apps/api && pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: api-dist
          path: apps/api/dist

  build-web:
    needs: [lint, test-web]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Build Web
        run: cd apps/web && pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: web-dist
          path: apps/web/.next

  docker:
    needs: [build-api, build-web, e2e]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          push: true
          tags: |
            nexuscards/api:latest
            nexuscards/api:${{ github.sha }}
      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          push: true
          tags: |
            nexuscards/web:latest
            nexuscards/web:${{ github.sha }}
```

### Running CI Locally

```bash
# Lint all packages
pnpm lint

# Run all tests
pnpm test

# Build all apps
pnpm build

# Run E2E tests
cd apps/web && pnpm test:e2e
```

---

## Troubleshooting

### API Key Issues

**Issue**: "Invalid API key" error

- Verify key format starts with `nxk_`
- Check key hasn't expired (`expiresAt` field)
- Ensure key wasn't revoked (`revokedAt` field)

**Issue**: "API keys require PREMIUM subscription"

- Upgrade to PREMIUM tier
- Only PREMIUM users can create API keys

### Webhook Issues

**Issue**: Webhooks not being delivered

- Check webhook URL is HTTPS only
- Verify webhook is active (`isActive: true`)
- Check webhook server logs for errors
- Ensure webhook endpoint returns 2xx status

**Issue**: Signature verification failing

- Verify using exact payload received
- Include timestamp in signature payload: `${timestamp}.${payload}`
- Use correct secret from webhook creation response
- Check HMAC algorithm is SHA-256

### Rate Limiting

**Issue**: 429 Too Many Requests

- Implement exponential backoff in your client
- Consider caching responses when appropriate
- Contact support for higher rate limits (Enterprise plans)

---

## Summary

- **API Keys**: PREMIUM tier only, Argon2 hashing, rotation & revocation support
- **Public API V1**: 4 endpoints (cards, contacts, analytics) with rate limiting (100/min)
- **Webhooks**: 5 event types, HMAC-SHA256 signatures, automatic retries (5 attempts)
- **Testing**: Unit tests (Jest), integration tests (Supertest), E2E tests (Playwright)
- **CI/CD**: GitHub Actions with parallel jobs, Docker image builds, artifact uploads
- **Rate Limiting**: 100 requests/minute per API key with 429 responses

For detailed implementation examples, see:

- API routes: `apps/api/src/public-api-v1/`
- Webhook delivery: `apps/api/src/webhooks/webhook-delivery.service.ts`
- Frontend UI: `apps/web/src/app/dashboard/webhooks/page.tsx`
