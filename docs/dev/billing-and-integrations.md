# Billing and Integrations Implementation

## Overview

This document describes the implementation of subscription payments, billing management, and external integrations for Nexus Cards. The system supports Stripe as the primary payment processor with extension points for PayPal and M-Pesa, along with stubs for eight CRM/productivity integrations.

## Architecture

### Backend Structure

```
apps/api/src/
├── billing/
│   ├── billing.module.ts
│   ├── billing.service.ts
│   ├── billing.controller.ts
│   ├── dto/
│   │   ├── create-checkout-session.dto.ts
│   │   └── index.ts
│   └── providers/
│       ├── payment-provider.interface.ts
│       ├── paypal.provider.ts
│       └── mpesa.provider.ts
├── integrations/
│   ├── integrations.module.ts
│   ├── integrations.service.ts
│   ├── integrations.controller.ts
│   └── dto/
│       ├── connect-integration.dto.ts
│       └── index.ts
```

### Frontend Structure

```
apps/web/src/app/dashboard/
├── settings/
│   └── billing/
│       └── page.tsx
└── integrations/
    └── page.tsx
```

## Billing System

### Stripe Integration

#### Environment Variables

Required environment variables in `apps/api/.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
```

#### Checkout Flow

1. User selects a tier on `/dashboard/settings/billing`
2. Frontend calls `POST /billing/checkout-session` with tier
3. Backend creates Stripe checkout session with customer ID
4. User is redirected to Stripe hosted checkout
5. After payment, user returns to success URL
6. Stripe sends webhook events to update subscription

#### Webhook Events

The system handles the following Stripe webhook events:

- **customer.subscription.created**: Initial subscription creation
- **customer.subscription.updated**: Plan changes, renewal
- **customer.subscription.deleted**: Subscription cancellation
- **invoice.payment_succeeded**: Successful payment, create invoice record
- **invoice.payment_failed**: Failed payment, mark subscription PAST_DUE

#### Idempotency

Webhook processing is idempotent through the `activity_logs` table:
- Each webhook event ID is recorded after processing
- Duplicate events are detected and skipped
- Ensures no double-processing of payments

Example check:

```typescript
const existingLog = await this.prisma.activityLog.findFirst({
  where: {
    action: 'webhook_processed',
    metadata: {
      path: ['eventId'],
      equals: event.id,
    },
  },
});

if (existingLog) {
  this.logger.log(`Webhook ${event.id} already processed, skipping`);
  return;
}
```

#### Subscription Tiers

| Tier | Cards | Contacts | Analytics | Price |
|------|-------|----------|-----------|-------|
| FREE | 1 | 50 | 7 days | $0 |
| PRO | 5 | Unlimited | 90 days | $9/mo |
| PREMIUM | Unlimited | Unlimited | Unlimited | $29/mo |

#### Subscription Lifecycle

1. **Creation**: User upgrades from FREE → PRO/PREMIUM
   - Stripe customer created if not exists
   - Checkout session initiated
   - On webhook: tier and status updated

2. **Updates**: User changes plan (upgrade/downgrade)
   - New checkout session with different price
   - Subscription updated via webhook
   - Prorated billing handled by Stripe

3. **Cancellation**: User cancels subscription
   - `cancel_at_period_end` set to true
   - Access continues until period end
   - Tier reverts to FREE after expiration

4. **Past Due**: Payment fails
   - Status changes to PAST_DUE
   - User notified on billing page
   - Retries handled by Stripe

### API Endpoints

#### POST /billing/checkout-session

Create Stripe checkout session.

**Request Body:**
```json
{
  "tier": "PRO",
  "successUrl": "https://nexus.cards/dashboard/settings/billing?success=true",
  "cancelUrl": "https://nexus.cards/dashboard/settings/billing?canceled=true"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Guards:** JwtAuthGuard

#### POST /billing/webhook

Receive and process Stripe webhooks.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Request Body:** Raw Stripe event JSON

**Response:**
```json
{
  "received": true
}
```

**Guards:** None (public endpoint, verified via signature)

#### GET /billing/usage

Get user's subscription usage and limits.

**Response:**
```json
{
  "cardsUsed": 2,
  "cardsLimit": 5,
  "contactsCount": 145,
  "contactsLimit": -1,
  "analyticsRetentionDays": 90
}
```

**Guards:** JwtAuthGuard

#### DELETE /billing/subscription

Cancel user's subscription at period end.

**Response:**
```json
{
  "success": true
}
```

**Guards:** JwtAuthGuard

### Payment Provider Extension

The system includes a `PaymentProvider` interface for future payment methods:

```typescript
export interface PaymentProvider {
  name: string;
  createCheckoutSession(userId: string, amount: number, currency: string): Promise<{ url: string }>;
  processWebhook(signature: string, rawBody: Buffer): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
```

#### PayPal Provider (Stub)

Location: `apps/api/src/billing/providers/paypal.provider.ts`

Currently throws `Error('PayPal integration not yet implemented')` for all methods.

To implement:
1. Add PayPal SDK dependency
2. Implement checkout session creation
3. Handle IPN/webhook verification
4. Map PayPal subscription states to internal states

#### M-Pesa Provider (Stub)

Location: `apps/api/src/billing/providers/mpesa.provider.ts`

Currently throws `Error('M-Pesa integration not yet implemented')` for all methods.

To implement:
1. Add Safaricom M-Pesa SDK
2. Implement STK Push for payments
3. Handle callback verification
4. Support KES currency pricing

## Integrations System

### Supported Providers

1. **Salesforce** - CRM contact sync
2. **HubSpot** - CRM contact management
3. **Zoho CRM** - CRM contact sync
4. **Mailchimp** - Email list management
5. **SendGrid** - Email sending
6. **Zapier** - Webhook automation triggers
7. **Google Drive** - File storage
8. **Dropbox** - File storage

### Credential Encryption

All integration credentials are encrypted before storage using the `CryptoService`:

```typescript
const encryptedCredentials = this.crypto.encrypt(JSON.stringify(dto.credentials));
```

Encryption uses AES-256-CBC with:
- Key derived from `ENCRYPTION_KEY` environment variable
- Initialization vector (IV) generated per credential
- IV prepended to encrypted data for decryption

### API Endpoints

#### GET /integrations

List user's connected integrations.

**Response:**
```json
[
  {
    "id": "cuid...",
    "provider": "HUBSPOT",
    "status": "ACTIVE",
    "lastSyncAt": "2025-11-19T10:30:00Z",
    "createdAt": "2025-11-18T08:00:00Z",
    "updatedAt": "2025-11-19T10:30:00Z"
  }
]
```

**Guards:** JwtAuthGuard

#### POST /integrations/connect

Connect a new integration or update credentials.

**Request Body:**
```json
{
  "provider": "HUBSPOT",
  "credentials": {
    "apiKey": "hub_api_key_..."
  },
  "settings": {
    "syncInterval": 3600
  }
}
```

**Response:** Integration object

**Guards:** JwtAuthGuard

#### DELETE /integrations/:provider

Disconnect an integration.

**URL Parameters:**
- `provider`: IntegrationProvider enum value

**Response:**
```json
{
  "success": true
}
```

**Guards:** JwtAuthGuard

#### POST /integrations/:provider/sync

Manually trigger sync for an integration.

**URL Parameters:**
- `provider`: IntegrationProvider enum value

**Response:**
```json
{
  "provider": "HUBSPOT",
  "message": "HubSpot integration is stubbed - no actual sync performed",
  "contactsSynced": 0
}
```

**Guards:** JwtAuthGuard

### Integration Implementation Status

All integrations currently return stub responses. Each provider method:
1. Updates `lastSyncAt` timestamp
2. Returns success message indicating stub status
3. Returns zero counts for synced items

### Implementing Real Integrations

To implement a real integration (e.g., HubSpot):

1. **Add SDK Dependency**
   ```bash
   pnpm add @hubspot/api-client
   ```

2. **Update Service Method**
   ```typescript
   private async syncHubspot(userId: string, credentials: any, integrationId: string) {
     const hubspot = new Client({ accessToken: credentials.apiKey });
     
     const contacts = await this.prisma.contact.findMany({
       where: { userId },
     });
     
     let syncedCount = 0;
     for (const contact of contacts) {
       await hubspot.crm.contacts.basicApi.create({
         properties: {
           email: contact.email,
           firstname: contact.firstName,
           lastname: contact.lastName,
           company: contact.company,
         },
       });
       syncedCount++;
     }
     
     await this.prisma.integration.update({
       where: { id: integrationId },
       data: { lastSyncAt: new Date() },
     });
     
     return {
       provider: 'HUBSPOT',
       message: 'Contacts synced successfully',
       contactsSynced: syncedCount,
     };
   }
   ```

3. **Error Handling**
   ```typescript
   try {
     // sync logic
   } catch (error) {
     await this.prisma.integration.update({
       where: { id: integrationId },
       data: { status: IntegrationStatus.ERROR },
     });
     throw error;
   }
   ```

4. **Rate Limiting**
   - Implement per-provider rate limits
   - Queue sync jobs for large contact lists
   - Use exponential backoff for retries

## Frontend Implementation

### Billing Page

Location: `apps/web/src/app/dashboard/settings/billing/page.tsx`

Features:
- Display current plan and status badge
- Show renewal/cancellation date
- Usage metrics with progress bars (cards, contacts, analytics retention)
- Three-column tier comparison cards
- Upgrade/downgrade flow with confirmation dialog
- Cancel subscription with confirmation dialog
- Success/error toast notifications
- Stripe redirect handling (success/canceled query params)

Key Functions:
- `loadData()`: Fetches user subscription and usage
- `handleUpgrade()`: Creates checkout session and redirects
- `handleCancelSubscription()`: Marks subscription for cancellation
- `getStatusBadge()`: Color-coded status display

### Integrations Page

Location: `apps/web/src/app/dashboard/integrations/page.tsx`

Features:
- Grid of all available integrations
- Connection status badges (Active/Inactive/Error)
- Last sync timestamp display
- Connect dialog with credential input fields
- Sync button with loading state
- Reconfigure button to update credentials
- Disconnect button with confirmation

Key Functions:
- `loadIntegrations()`: Fetches connected integrations
- `handleConnect()`: Connects new integration with credentials
- `handleDisconnect()`: Removes integration
- `handleSync()`: Triggers manual sync
- `openConnectDialog()`: Opens credential input modal

Integration Providers Array:
Each provider defines:
- `id`: Provider enum value
- `name`: Display name
- `description`: Short explanation
- `icon`: Emoji icon
- `fields`: Array of credential inputs (key, label, type)

## Database Schema

### Subscription Table

```prisma
model Subscription {
  id                     String             @id @default(cuid())
  userId                 String             @unique
  tier                   SubscriptionTier   @default(FREE)
  status                 SubscriptionStatus @default(ACTIVE)
  stripeCustomerId       String?            @unique
  stripeSubscriptionId   String?            @unique
  stripePriceId          String?
  currentPeriodStart     DateTime?
  currentPeriodEnd       DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}
```

### Invoice Table

```prisma
model Invoice {
  id                String   @id @default(cuid())
  subscriptionId    String
  stripeInvoiceId   String?  @unique
  amount            Int
  currency          String   @default("usd")
  status            String
  invoiceUrl        String?
  pdfUrl            String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Integration Table

```prisma
model Integration {
  id          String              @id @default(cuid())
  userId      String
  provider    IntegrationProvider
  status      IntegrationStatus   @default(ACTIVE)
  credentials Json
  settings    Json?
  lastSyncAt  DateTime?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}
```

## Testing

### Webhook Testing with Stripe CLI

1. Install Stripe CLI:
   ```bash
   stripe login
   ```

2. Forward webhooks to local API:
   ```bash
   stripe listen --forward-to http://localhost:3001/billing/webhook
   ```

3. Trigger test events:
   ```bash
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   stripe trigger invoice.payment_failed
   ```

4. Verify idempotency:
   ```bash
   # Send same event twice
   stripe trigger customer.subscription.created
   # Check logs - second should be skipped
   ```

### Integration Testing

1. Connect integration via UI
2. Check database for encrypted credentials
3. Trigger sync via API or UI
4. Verify `lastSyncAt` timestamp updated
5. Check activity logs for sync events

### Manual E2E Test Flow

#### Billing Flow
1. Log in as FREE tier user
2. Navigate to `/dashboard/settings/billing`
3. Click "Upgrade" on PRO tier
4. Complete Stripe checkout (use test card 4242 4242 4242 4242)
5. Redirect to billing page with success message
6. Verify tier changed to PRO
7. Verify usage limits updated
8. Click "Cancel Subscription"
9. Verify shows "Cancels on [date]"

#### Integration Flow
1. Navigate to `/dashboard/integrations`
2. Click "Connect" on HubSpot
3. Enter fake API key
4. Verify connection shown as Active
5. Click "Sync" button
6. Verify toast shows stub message
7. Verify last sync timestamp updated
8. Click "Disconnect"
9. Verify integration removed

## Security Considerations

### Webhook Security
- Signature verification using `stripe.webhooks.constructEvent`
- Rejects webhooks with invalid signatures
- Logs all webhook attempts

### Credential Storage
- All credentials encrypted with AES-256
- Encryption key from environment variable
- Never logged or exposed in API responses
- Decrypted only when needed for API calls

### Payment Security
- No credit card data stored
- Stripe handles all payment processing
- PCI compliance through Stripe
- Customer IDs stored, not payment methods

### API Security
- All endpoints protected with JwtAuthGuard
- Webhook endpoint public but signature-verified
- User can only access their own subscriptions/integrations
- No admin override for billing operations

## Monitoring and Observability

### Logging

All billing and integration operations are logged:

```typescript
this.logger.log(`Subscription created for user ${userId}, tier: ${tier}`);
this.logger.error(`Failed to process webhook ${event.id}: ${error.message}`);
this.logger.warn('STRIPE_SECRET_KEY not configured - payment features disabled');
```

### Activity Logs

Critical events recorded in `activity_logs`:
- Webhook processing
- Integration connections/disconnections
- Subscription changes
- Payment failures

### Metrics to Track

- Subscription conversions (FREE → PRO → PREMIUM)
- Churn rate (cancellations)
- Failed payment rate
- Integration connection success rate
- Sync job success rate
- Webhook processing latency

## Future Enhancements

### Billing
- [ ] Implement PayPal payment flow
- [ ] Implement M-Pesa payment flow
- [ ] Add annual billing option with discount
- [ ] Support multiple currencies
- [ ] Add usage-based billing (overage charges)
- [ ] Implement grace period for failed payments
- [ ] Add dunning emails for past due subscriptions

### Integrations
- [ ] Implement actual HubSpot API integration
- [ ] Implement actual Salesforce API integration
- [ ] Add OAuth flows for integrations
- [ ] Background job queue for sync operations
- [ ] Bi-directional sync (import contacts from CRM)
- [ ] Webhook triggers for real-time sync
- [ ] Integration health monitoring
- [ ] Retry logic with exponential backoff
- [ ] Bulk operations for large contact lists

## Environment Variables

Complete list of required environment variables:

```bash
# Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PREMIUM=price_...

# Security
ENCRYPTION_KEY=32_byte_hex_string

# Database
DATABASE_URL=postgresql://...
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe CLI is forwarding:
   ```bash
   stripe listen --forward-to http://localhost:3001/billing/webhook
   ```

2. Verify webhook secret matches:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```

3. Check API logs for signature errors

### Integration Credentials Not Working

1. Verify encryption key is set:
   ```bash
   echo $ENCRYPTION_KEY
   ```

2. Check credentials are valid in provider's dashboard

3. Verify decryption works:
   ```typescript
   const decrypted = this.crypto.decrypt(encrypted);
   console.log(JSON.parse(decrypted));
   ```

### Subscription Not Updating

1. Check webhook events in Stripe dashboard
2. Verify activity logs for webhook processing
3. Check for duplicate event IDs in activity_logs
4. Manually trigger webhook event for testing

## Compliance

### PCI DSS
- No cardholder data stored
- All payment processing via Stripe
- Compliant through Stripe's PCI certification

### Data Privacy
- Credentials encrypted at rest
- User can delete all data (GDPR right to erasure)
- Integration data can be exported
- No sharing of credentials with third parties

## Conclusion

The billing and integrations system provides a complete foundation for:
- Stripe subscription management with webhook handling
- Extension points for additional payment providers
- Eight CRM/productivity integration stubs ready for implementation
- Secure credential storage with encryption
- User-friendly UI for managing subscriptions and connections

All webhooks are idempotent, credentials are encrypted, and the system follows the House Rules for structured logging, error handling, and security best practices.
