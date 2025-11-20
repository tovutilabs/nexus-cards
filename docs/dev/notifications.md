# Notifications System Documentation

## Overview

The Nexus Cards notifications system provides real-time in-app notifications and email notifications for important events. Users can customize their notification preferences per event type and channel.

## Architecture

### Components

```
NotificationsModule
├── NotificationsController    (REST API endpoints)
├── NotificationsService        (Business logic & triggers)
├── NotificationsRepository     (Database operations)
└── Email Service Integration   (Email delivery - stubbed)
```

### Database Schema

#### Notification Table

```prisma
model Notification {
  id          String            @id @default(cuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  link        String?
  metadata    Json?
  isRead      Boolean           @default(false)
  readAt      DateTime?
  createdAt   DateTime          @default(now())

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

#### NotificationPreferences Table

```prisma
model NotificationPreferences {
  id                    String    @id @default(cuid())
  userId                String    @unique
  newContactEmail       Boolean   @default(true)
  newContactInApp       Boolean   @default(true)
  analyticsMilestoneEmail Boolean @default(true)
  analyticsMilestoneInApp Boolean @default(true)
  paymentSuccessEmail   Boolean   @default(true)
  paymentSuccessInApp   Boolean   @default(true)
  nfcTagScanEmail       Boolean   @default(false)
  nfcTagScanInApp       Boolean   @default(true)
  cardViewMilestoneEmail Boolean  @default(true)
  cardViewMilestoneInApp Boolean  @default(true)
  subscriptionExpiringEmail Boolean @default(true)
  subscriptionExpiringInApp Boolean @default(true)
  marketingEmails       Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Notification Types

```typescript
enum NotificationType {
  NEW_CONTACT           // When someone shares their contact
  ANALYTICS_MILESTONE   // When metrics reach a milestone
  PAYMENT_SUCCESS       // When payment is processed
  NFC_TAG_SCAN         // When NFC tag is scanned
  CARD_VIEW_MILESTONE  // When card views reach a milestone
  SUBSCRIPTION_EXPIRING // When subscription is about to expire
  EXPERIMENT_RESULT    // When A/B test results are available
}
```

### Notification Channels

- **IN_APP**: Notifications appear in the `/dashboard/notifications` feed
- **EMAIL**: Notifications sent via email (currently stubbed)
- **PUSH**: (Planned for future implementation)

## API Endpoints

### GET /notifications

Get user's notifications.

**Authentication**: Required (JWT)

**Query Parameters**:
- `limit` (number, optional): Max notifications to return (default: 50)
- `unreadOnly` (boolean, optional): Return only unread notifications

**Response**:
```json
[
  {
    "id": "notif_123",
    "userId": "user_456",
    "type": "NEW_CONTACT",
    "title": "New Contact Received",
    "message": "John Doe just shared their contact information with you",
    "link": "/dashboard/contacts",
    "metadata": { "contactName": "John Doe" },
    "isRead": false,
    "readAt": null,
    "createdAt": "2025-11-20T10:30:00Z"
  }
]
```

### GET /notifications/unread-count

Get count of unread notifications.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "count": 3
}
```

### PATCH /notifications/:id/read

Mark a notification as read.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "id": "notif_123",
  "isRead": true,
  "readAt": "2025-11-20T10:35:00Z"
}
```

### POST /notifications/mark-all-read

Mark all user's notifications as read.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "count": 5
}
```

### DELETE /notifications/:id

Delete a notification.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true
}
```

### GET /notifications/preferences

Get notification preferences.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "id": "pref_123",
  "userId": "user_456",
  "newContactEmail": true,
  "newContactInApp": true,
  "analyticsMilestoneEmail": true,
  "analyticsMilestoneInApp": true,
  "paymentSuccessEmail": true,
  "paymentSuccessInApp": true,
  "nfcTagScanEmail": false,
  "nfcTagScanInApp": true,
  "cardViewMilestoneEmail": true,
  "cardViewMilestoneInApp": true,
  "subscriptionExpiringEmail": true,
  "subscriptionExpiringInApp": true,
  "marketingEmails": false,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-20T10:00:00Z"
}
```

### PATCH /notifications/preferences

Update notification preferences.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "newContactEmail": false,
  "analyticsMilestoneInApp": true,
  "marketingEmails": false
}
```

**Response**: Updated preferences object

## Triggering Notifications

### From Backend Code

```typescript
import { NotificationsService, NotificationTrigger } from './notifications/notifications.service';

// Inject service
constructor(private readonly notificationsService: NotificationsService) {}

// Trigger a notification
const trigger: NotificationTrigger = {
  userId: 'user_123',
  type: 'NEW_CONTACT',
  data: {
    contactName: 'John Doe',
  },
};

await this.notificationsService.triggerNotification(trigger);
```

### Notification Data by Type

**NEW_CONTACT**:
```typescript
{
  contactName: string;
}
```

**ANALYTICS_MILESTONE**:
```typescript
{
  milestone: number;
  metricType: string; // e.g., 'views', 'taps'
}
```

**PAYMENT_SUCCESS**:
```typescript
{
  amount: number;
}
```

**NFC_TAG_SCAN**:
```typescript
{
  tagUid: string;
}
```

**CARD_VIEW_MILESTONE**:
```typescript
{
  cardTitle: string;
  milestone: number;
}
```

**SUBSCRIPTION_EXPIRING**:
```typescript
{} // No additional data needed
```

**EXPERIMENT_RESULT**:
```typescript
{
  experimentName: string;
}
```

## Frontend Integration

### Notifications Feed Page

Location: `/dashboard/notifications`

Features:
- List all notifications
- Filter by read/unread
- Mark individual notification as read
- Mark all as read
- Delete notifications
- Click notification to navigate to linked resource
- Real-time badge count

### Notification Preferences Page

Location: `/dashboard/settings/notifications`

Features:
- Toggle email notifications per event type
- Toggle in-app notifications per event type
- Toggle marketing emails
- Save preferences button
- Reset to defaults

### Example: Display Notification Badge

```typescript
import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';

const apiClient = createApiClient();

function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    const response = await apiClient.get('/notifications/unread-count');
    setUnreadCount(response.count);
  };

  return (
    <div className="relative">
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
```

## Email Notifications (Stub)

Currently, email notifications are logged but not sent. To implement:

1. Choose email provider (SendGrid, Mailgun, AWS SES)
2. Update `NotificationsService.sendEmail()` method
3. Create email templates
4. Add environment variables for email credentials

### Example Implementation

```typescript
private async sendEmail(userId: string, notification: CreateNotificationDto) {
  // Get user email
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.email) return;

  // Send via email provider
  await this.emailService.send({
    to: user.email,
    subject: notification.title,
    template: 'notification',
    data: {
      title: notification.title,
      message: notification.message,
      link: notification.link ? `${process.env.APP_URL}${notification.link}` : undefined,
    },
  });
}
```

## Testing

### Unit Tests

Run unit tests:
```bash
npm test -- notifications.service.spec.ts
```

Tests cover:
- Notification creation with preferences
- In-app vs email channel selection
- All notification types
- Marking as read
- Deletion
- Preferences management

### E2E Tests

Run E2E tests:
```bash
npm run test:e2e -- notifications.e2e-spec.ts
```

Tests cover:
- Authentication requirements
- Listing notifications
- Marking as read
- Deleting notifications
- Preferences CRUD
- Complete notification lifecycle

## Performance Considerations

### Indexing

The `Notification` table has indexes on:
- `userId` - Fast lookup of user's notifications
- `isRead` - Filter unread efficiently
- `createdAt` - Sort by date efficiently

### Query Optimization

- Default limit of 50 notifications prevents large result sets
- Unread count uses COUNT query instead of fetching all records
- Mark all as read uses bulk update instead of individual updates

### Pagination

For users with many notifications, consider implementing cursor-based pagination:

```typescript
GET /notifications?cursor=notif_123&limit=20
```

## Security

- All endpoints require JWT authentication
- Users can only access their own notifications
- Notification preferences are user-scoped
- Metadata is sanitized before storage
- Links are validated before rendering

## Future Enhancements

1. **Real-time Updates**: Use WebSockets or SSE for instant notifications
2. **Push Notifications**: Add web push API support
3. **Email Templates**: Rich HTML email templates with branding
4. **Notification Grouping**: Group similar notifications (e.g., "5 new contacts")
5. **Snooze Feature**: Allow users to snooze notifications
6. **Notification History**: Archive old notifications instead of deleting
7. **Digest Mode**: Send daily/weekly email digests instead of individual emails
8. **Custom Notification Rules**: Let users create custom notification rules
9. **Do Not Disturb**: Quiet hours for notifications
10. **Desktop Notifications**: Native OS notifications for desktop users

## Troubleshooting

### Notifications Not Appearing

1. Check user preferences are enabled
2. Verify notification was created in database
3. Check console for API errors
4. Ensure JWT token is valid

### Email Not Sending

1. Verify email service is implemented (currently stubbed)
2. Check email provider credentials
3. Verify user has valid email address
4. Check spam folder

### Performance Issues

1. Add pagination if returning too many notifications
2. Consider archiving old notifications
3. Use Redis caching for unread counts
4. Batch notification creation for bulk events

## Best Practices

1. **Always check preferences** before creating notifications
2. **Include metadata** for debugging and analytics
3. **Provide links** to relevant resources when possible
4. **Use descriptive titles** that summarize the notification
5. **Keep messages concise** and actionable
6. **Test email rendering** across different clients
7. **Monitor notification frequency** to avoid spamming users
8. **Log notification creation** for audit trail
9. **Handle failures gracefully** (email delivery, etc.)
10. **Allow users to customize** notification settings extensively
