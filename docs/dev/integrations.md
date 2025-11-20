# Integrations System Documentation

## Overview

The Nexus Cards integrations system enables users to connect third-party services and automate workflows. It supports 8 integration providers across 4 categories:

- **CRM**: Salesforce, HubSpot, Zoho
- **Email Marketing**: Mailchimp, SendGrid
- **Automation**: Zapier (via webhooks)
- **Cloud Storage**: Google Drive, Dropbox

## Architecture

### Components

```
integrations/
├── integrations.controller.ts      # REST API endpoints
├── integrations.service.ts         # Business logic & orchestration
├── integrations.repository.ts      # Database operations
├── oauth.controller.ts             # OAuth callbacks
├── crm.service.ts                  # CRM provider implementations
├── email.service.ts                # Email provider implementations
├── cloud-storage.service.ts        # Cloud storage implementations
├── webhooks.service.ts             # Webhook system
└── dto/                            # Data transfer objects
```

### Database Schema

```prisma
enum IntegrationProvider {
  SALESFORCE
  HUBSPOT
  ZOHO
  MAILCHIMP
  SENDGRID
  ZAPIER
  GOOGLE_DRIVE
  DROPBOX
}

enum IntegrationStatus {
  ACTIVE
  INACTIVE
  ERROR
}

model Integration {
  id          String              @id @default(cuid())
  userId      String
  provider    IntegrationProvider
  status      IntegrationStatus   @default(ACTIVE)
  credentials Json                // Encrypted credentials
  settings    Json                @default("{}")
  lastSyncAt  DateTime?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider])
}

model WebhookSubscription {
  id         String            @id @default(cuid())
  userId     String
  url        String
  events     WebhookEventType[]
  secret     String            // HMAC secret
  isActive   Boolean           @default(true)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  
  user       User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliveries WebhookDelivery[]
}

model WebhookDelivery {
  id                     String            @id @default(cuid())
  webhookSubscriptionId  String
  eventType              WebhookEventType
  payload                Json
  responseStatus         Int?
  responseBody           String?
  attemptCount           Int               @default(0)
  deliveredAt            DateTime?
  failedAt               DateTime?
  nextRetryAt            DateTime?
  createdAt              DateTime          @default(now())
  
  webhookSubscription WebhookSubscription @relation(fields: [webhookSubscriptionId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Integration Management

#### List Integrations
```http
GET /integrations
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "integration-123",
    "provider": "SALESFORCE",
    "status": "ACTIVE",
    "credentials": { ... },
    "lastSyncAt": "2025-11-20T10:30:00Z"
  }
]
```

#### Connect Integration
```http
POST /integrations/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "SALESFORCE",
  "credentials": {
    "accessToken": "your-token",
    "instanceUrl": "https://your-instance.salesforce.com"
  }
}

Response: 201 Created
{
  "id": "integration-123",
  "provider": "SALESFORCE",
  "status": "ACTIVE",
  "credentials": { ... },
  "createdAt": "2025-11-20T10:30:00Z"
}
```

#### Disconnect Integration
```http
DELETE /integrations/:provider
Authorization: Bearer <token>

Response: 200 OK
{ "success": true }
```

#### Sync Integration
```http
POST /integrations/:provider/sync
Authorization: Bearer <token>

Response: 201 Created
{
  "message": "Salesforce sync completed",
  "contactsSynced": 42
}
```

### Webhook Management

#### Create Webhook
```http
POST /integrations/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["CONTACT_CREATED", "CARD_VIEW"]
}

Response: 201 Created
{
  "id": "webhook-123",
  "url": "https://your-app.com/webhook",
  "events": ["CONTACT_CREATED", "CARD_VIEW"],
  "secret": "whsec_abc123...",
  "isActive": true
}
```

#### List Webhooks
```http
GET /integrations/webhooks
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "webhook-123",
    "url": "https://your-app.com/webhook",
    "events": ["CONTACT_CREATED"],
    "isActive": true
  }
]
```

#### Update Webhook
```http
PATCH /integrations/webhooks/:id
Authorization: Bearer <token>

{
  "isActive": false
}

Response: 200 OK
```

#### Delete Webhook
```http
DELETE /integrations/webhooks/:id
Authorization: Bearer <token>

Response: 200 OK
{ "success": true }
```

#### Get Webhook Deliveries
```http
GET /integrations/webhooks/:id/deliveries?limit=50
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "delivery-123",
    "eventType": "CONTACT_CREATED",
    "payload": { ... },
    "responseStatus": 200,
    "attemptCount": 1,
    "deliveredAt": "2025-11-20T10:30:00Z"
  }
]
```

#### Retry Delivery
```http
POST /integrations/webhooks/:id/deliveries/:deliveryId/retry
Authorization: Bearer <token>

Response: 200 OK
{ "success": true }
```

## Provider Configuration

### CRM Providers

#### Salesforce
```typescript
{
  provider: "SALESFORCE",
  credentials: {
    accessToken: string,      // OAuth access token
    instanceUrl: string       // e.g., "https://na1.salesforce.com"
  }
}
```

**Contact Mapping:**
- `firstName` → `FirstName`
- `lastName` → `LastName`
- `email` → `Email`
- `phone` → `Phone`
- `company` → `Company`
- `jobTitle` → `Title`

#### HubSpot
```typescript
{
  provider: "HUBSPOT",
  credentials: {
    accessToken: string       // Private app access token
  }
}
```

**Contact Mapping:**
- `firstName` → `firstname`
- `lastName` → `lastname`
- `email` → `email`
- `phone` → `phone`
- `company` → `company`
- `jobTitle` → `jobtitle`

#### Zoho CRM
```typescript
{
  provider: "ZOHO",
  credentials: {
    accessToken: string,
    apiDomain: string         // e.g., "https://www.zohoapis.com" or "https://www.zohoapis.eu"
  }
}
```

**Contact Mapping:**
- `firstName` → `First_Name`
- `lastName` → `Last_Name`
- `email` → `Email`
- `phone` → `Phone`
- `company` → `Account_Name`
- `jobTitle` → `Title`

### Email Marketing Providers

#### Mailchimp
```typescript
{
  provider: "MAILCHIMP",
  credentials: {
    apiKey: string,           // API key
    audienceId: string        // List ID
  }
}
```

**Subscriber Fields:**
- `email_address`
- `status`: "subscribed" | "unsubscribed" | "pending"
- `merge_fields`: { FNAME, LNAME }
- `tags`: string[]

#### SendGrid
```typescript
{
  provider: "SENDGRID",
  credentials: {
    apiKey: string,
    listId: string            // Contact list ID
  }
}
```

**Subscriber Fields:**
- `email`
- `first_name`
- `last_name`
- `custom_fields`: Record<string, any>

### Cloud Storage Providers

#### Google Drive
```typescript
{
  provider: "GOOGLE_DRIVE",
  credentials: {
    accessToken: string,
    refreshToken: string,
    expiresAt: string         // ISO 8601 timestamp
  }
}
```

**OAuth Flow:**
1. User clicks "Connect Google Drive"
2. Redirect to `/integrations/oauth/google/authorize`
3. Google OAuth consent screen
4. Callback to `/integrations/oauth/google/callback`
5. Token exchange and storage

#### Dropbox
```typescript
{
  provider: "DROPBOX",
  credentials: {
    accessToken: string,
    accountId: string
  }
}
```

**OAuth Flow:**
1. User clicks "Connect Dropbox"
2. Redirect to `/integrations/oauth/dropbox/authorize`
3. Dropbox authorization page
4. Callback to `/integrations/oauth/dropbox/callback`
5. Token exchange and storage

### Zapier (Webhooks)

Zapier integration uses the webhook system. Users create a webhook subscription and use the URL in their Zapier workflows.

```typescript
{
  provider: "ZAPIER",
  credentials: {
    webhookUrl: string        // Zapier webhook URL
  }
}
```

## Webhook System

### Event Types

```typescript
enum WebhookEventType {
  CONTACT_CREATED      // When a new contact is added
  CARD_VIEW           // When a card is viewed
  LINK_CLICK          // When a link is clicked
  SUBSCRIPTION_UPDATED // When subscription changes
}
```

### Event Payloads

#### CONTACT_CREATED
```json
{
  "event": "CONTACT_CREATED",
  "timestamp": "2025-11-20T10:30:00Z",
  "data": {
    "contactId": "contact-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "cardId": "card-123"
  }
}
```

#### CARD_VIEW
```json
{
  "event": "CARD_VIEW",
  "timestamp": "2025-11-20T10:30:00Z",
  "data": {
    "cardId": "card-123",
    "viewerId": "user-456",
    "location": "New York, US",
    "device": "mobile"
  }
}
```

#### LINK_CLICK
```json
{
  "event": "LINK_CLICK",
  "timestamp": "2025-11-20T10:30:00Z",
  "data": {
    "cardId": "card-123",
    "linkType": "EMAIL",
    "linkValue": "john@example.com"
  }
}
```

#### SUBSCRIPTION_UPDATED
```json
{
  "event": "SUBSCRIPTION_UPDATED",
  "timestamp": "2025-11-20T10:30:00Z",
  "data": {
    "userId": "user-123",
    "oldTier": "FREE",
    "newTier": "PRO",
    "effectiveDate": "2025-11-20T10:30:00Z"
  }
}
```

### Security

#### HMAC Signature Verification

All webhook deliveries include an HMAC-SHA256 signature in the `X-Webhook-Signature` header.

**Verification Example (Node.js):**
```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express middleware
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();
  const secret = 'your-webhook-secret';
  
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const event = JSON.parse(payload);
  console.log('Received event:', event.event);
  
  res.json({ received: true });
});
```

### Delivery & Retry Logic

1. **Initial Delivery**: Webhook fired immediately when event occurs
2. **Timeout**: 10-second timeout for each attempt
3. **Retry Schedule**:
   - Attempt 1: Immediate
   - Attempt 2: 2 seconds later (2^1)
   - Attempt 3: 4 seconds later (2^2)
   - Attempt 4: 8 seconds later (2^3)
   - Attempt 5: 16 seconds later (2^4)
4. **Failure Handling**:
   - After 5 failed attempts, stop retrying
   - After 10 consecutive failures, auto-disable webhook
5. **Manual Retry**: Available via API endpoint

### Webhook Headers

All deliveries include these headers:
```http
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature>
X-Webhook-Id: <webhook-subscription-id>
X-Webhook-Event: <event-type>
```

## Environment Variables

```bash
# Google Drive OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/integrations/oauth/google/callback

# Dropbox OAuth
DROPBOX_APP_KEY=your-app-key
DROPBOX_APP_SECRET=your-app-secret
DROPBOX_REDIRECT_URI=http://localhost:3001/integrations/oauth/dropbox/callback
```

## Frontend Integration

### Integration Management Page

Location: `/dashboard/integrations`

**Features:**
- Card view of all 8 providers
- Connect/disconnect buttons
- OAuth redirect flows
- Sync now functionality
- Last sync timestamps
- Active/inactive status badges

**Usage Example:**
```typescript
import { createApiClient } from '@/lib/api-client';

const apiClient = createApiClient();

// Connect integration
await apiClient.post('/integrations/connect', {
  provider: 'SALESFORCE',
  credentials: {
    accessToken: 'token',
    instanceUrl: 'https://instance.salesforce.com'
  }
});

// Sync integration
await apiClient.post('/integrations/SALESFORCE/sync');

// Disconnect
await apiClient.delete('/integrations/SALESFORCE');
```

### Webhook Management UI

**Features:**
- List all webhooks
- Create new webhook with event selection
- Toggle active/inactive
- View delivery history
- Retry failed deliveries
- Delete webhooks

## Testing

### Unit Tests

Run integration service tests:
```bash
cd apps/api
npm test src/integrations/integrations.service.spec.ts
npm test src/integrations/webhooks.service.spec.ts
```

**Coverage:**
- Integration CRUD operations
- Provider-specific sync logic
- Webhook creation/management
- Delivery queue processing
- Retry logic
- Error handling

### E2E Tests

Run end-to-end integration tests:
```bash
cd apps/api
npm run test:e2e test/integrations.e2e-spec.ts
```

**Test Scenarios:**
- Complete integration lifecycle (connect → sync → disconnect)
- Multiple provider connections
- Webhook creation and management
- Delivery history retrieval
- Error cases (invalid credentials, non-existent resources)
- Authentication requirements

## Common Integration Patterns

### Sync Contacts to CRM

```typescript
// In your application code
import { IntegrationsService } from './integrations/integrations.service';

async function syncNewContact(contact: Contact) {
  const integrations = await integrationsService.listIntegrations(contact.userId);
  
  const crmIntegrations = integrations.filter(i => 
    ['SALESFORCE', 'HUBSPOT', 'ZOHO'].includes(i.provider)
  );
  
  for (const integration of crmIntegrations) {
    await integrationsService.syncContacts(contact.userId, integration.provider);
  }
}
```

### Trigger Webhook Events

```typescript
import { WebhooksService } from './integrations/webhooks.service';

async function notifyContactCreated(userId: string, contact: Contact) {
  await webhooksService.triggerEvent(
    userId,
    WebhookEventType.CONTACT_CREATED,
    {
      contactId: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      cardId: contact.cardId
    }
  );
}
```

### Export to Cloud Storage

```typescript
import { CloudStorageService } from './integrations/cloud-storage.service';

async function exportContacts(userId: string, contacts: Contact[]) {
  const integration = await integrationsRepository.findByUserAndProvider(
    userId,
    IntegrationProvider.GOOGLE_DRIVE
  );
  
  if (integration) {
    const csv = generateCSV(contacts);
    await googleDriveService.uploadFile(integration.credentials, {
      name: `contacts-export-${Date.now()}.csv`,
      content: Buffer.from(csv),
      mimeType: 'text/csv'
    });
  }
}
```

## Troubleshooting

### Integration Connection Fails

**Problem**: Integration shows ERROR status after connection attempt

**Solutions:**
1. Verify credentials are correct
2. Check API token hasn't expired
3. Verify API domain (for Zoho)
4. Check network connectivity to provider
5. Review integration service logs

### Webhook Not Receiving Events

**Problem**: Webhook configured but no deliveries received

**Solutions:**
1. Verify webhook is `isActive: true`
2. Check webhook URL is publicly accessible
3. Verify selected events match triggered events
4. Review delivery history for errors
5. Check webhook endpoint returns 2xx status code

### OAuth Flow Fails

**Problem**: OAuth redirect doesn't complete

**Solutions:**
1. Verify redirect URI matches OAuth app configuration
2. Check environment variables (CLIENT_ID, CLIENT_SECRET)
3. Ensure redirect URI is whitelisted in provider settings
4. Check browser console for errors
5. Verify state parameter integrity

### Webhook Deliveries Failing

**Problem**: All webhook deliveries show failed status

**Solutions:**
1. Verify webhook URL is correct and accessible
2. Check endpoint returns 2xx status within 10 seconds
3. Verify HMAC signature validation (if implemented)
4. Review endpoint logs for errors
5. Test endpoint with manual POST request

## Security Best Practices

1. **Credential Encryption**: All integration credentials stored encrypted in database
2. **HMAC Signatures**: All webhook deliveries signed with HMAC-SHA256
3. **OAuth Tokens**: Use OAuth 2.0 for Google Drive and Dropbox
4. **Token Refresh**: Automatic token refresh for Google Drive
5. **Webhook Secrets**: Unique secret per webhook subscription
6. **Rate Limiting**: Apply rate limits on integration API calls
7. **Audit Logging**: Log all integration operations with user IDs
8. **Access Control**: JWT authentication required for all endpoints

## Performance Considerations

1. **Webhook Queue**: Process webhook deliveries asynchronously
2. **Batch Operations**: Batch contact syncs when possible
3. **Retry Backoff**: Exponential backoff prevents overwhelming failing endpoints
4. **Connection Pooling**: Reuse HTTP connections to providers
5. **Caching**: Cache provider API responses when appropriate
6. **Timeout Handling**: 10-second timeout prevents hanging requests

## Future Enhancements

- [ ] Microsoft Dynamics 365 CRM integration
- [ ] ActiveCampaign email marketing
- [ ] OneDrive cloud storage
- [ ] Custom webhook event types
- [ ] Webhook signature rotation
- [ ] Integration health monitoring dashboard
- [ ] Bulk import/export operations
- [ ] Custom field mapping UI
- [ ] Integration usage analytics
