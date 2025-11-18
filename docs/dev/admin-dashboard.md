# Admin Dashboard - Implementation Documentation

## Overview

The Nexus Cards admin dashboard provides comprehensive system management tools for administrators. All admin routes are protected by role-based access control (RBAC) enforcing `role = ADMIN` on both backend and frontend.

**Access**: `/admin/*` routes (admin users only)  
**Backend Guards**: `JwtAuthGuard` + `RolesGuard` with `@Roles('ADMIN')`  
**Frontend Protection**: `AdminGuard` component with redirect to `/dashboard`

---

## Architecture

### Backend (NestJS)

**RBAC Implementation**:
- `RolesGuard` checks `@Roles()` decorator metadata
- Applied to all admin controllers via `@UseGuards(JwtAuthGuard, RolesGuard)`
- Returns `403 Forbidden` if user lacks admin role

**Admin Controllers**:
1. `AdminUsersController` - `/admin/users`
2. `AdminAnalyticsController` - `/admin/analytics`
3. `AdminSettingsController` - `/admin/settings`
4. `AdminNfcController` - `/admin/nfc` (from Prompt 5)

### Frontend (Next.js)

**Protection Pattern**:
```tsx
import { AdminGuard } from '@/components/admin/admin-guard';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      {/* Admin UI */}
    </AdminGuard>
  );
}
```

**Admin Layout**: `/apps/web/src/app/admin/layout.tsx`
- Sidebar navigation with active route highlighting
- Role check on mount with loading state
- Redirect to `/dashboard` if not admin

---

## Admin API Endpoints

### User Management (`/admin/users`)

**Controller**: `apps/api/src/users/admin-users.controller.ts`  
**Service**: `apps/api/src/users/users.service.ts`  
**Repository**: `apps/api/src/users/users.repository.ts`

#### Endpoints

| Method | Path | Description | Query Params |
|--------|------|-------------|--------------|
| GET | `/admin/users` | List users with search/filters | `skip`, `take`, `search`, `role`, `tier` |
| GET | `/admin/users/:userId` | Get user details with stats | - |
| PATCH | `/admin/users/:userId/role` | Update user role | - |
| PATCH | `/admin/users/:userId/subscription` | Update subscription tier | - |
| GET | `/admin/users/:userId/usage` | Get usage metrics | - |
| GET | `/admin/users/stats/overview` | Get user statistics | - |

**DTOs**:
```typescript
// apps/api/src/users/dto/admin-user.dto.ts

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole; // USER | ADMIN
}

export class UpdateUserSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier; // FREE | PRO | PREMIUM
  
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus; // ACTIVE | CANCELED | PAST_DUE
  
  @IsString()
  @IsOptional()
  stripeCustomerId?: string;
  
  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;
}
```

**Example Response** (`GET /admin/users`):
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "createdAt": "2024-01-15T10:00:00Z",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "subscription": {
        "tier": "PRO",
        "status": "ACTIVE"
      },
      "stats": {
        "cardsCount": 3,
        "contactsCount": 42
      }
    }
  ],
  "total": 150
}
```

**Usage Metrics Response** (`GET /admin/users/:userId/usage`):
```json
{
  "usage": {
    "cards": {
      "current": 3,
      "limit": 5,
      "percentage": 60
    },
    "contacts": {
      "current": 42,
      "limit": 9007199254740991,
      "percentage": 0
    }
  },
  "recentActivity": {
    "cardViews": 128,
    "nfcTaps": 45,
    "contactSubmissions": 12
  }
}
```

### Analytics (`/admin/analytics`)

**Controller**: `apps/api/src/analytics/admin-analytics.controller.ts`  
**Service**: `apps/api/src/analytics/analytics.service.ts`  
**Repository**: `apps/api/src/analytics/analytics.repository.ts`

#### Endpoints

| Method | Path | Description | Query Params |
|--------|------|-------------|--------------|
| GET | `/admin/analytics/overview` | Global overview stats | `days` (default: 7) |
| GET | `/admin/analytics/daily` | Daily aggregates | `days`, `skip`, `take` |
| GET | `/admin/analytics/top-cards` | Top performing cards | `limit` (default: 10) |
| GET | `/admin/analytics/by-tier` | Stats by subscription tier | `days` |
| GET | `/admin/analytics/events` | Recent events list | `skip`, `take`, `type`, `cardId` |

**Overview Response** (`GET /admin/analytics/overview?days=7`):
```json
{
  "totalViews": 1234,
  "totalTaps": 567,
  "totalExchanges": 89,
  "totalCards": 45,
  "totalUsers": 150
}
```

**Daily Stats Response** (`GET /admin/analytics/daily?days=7`):
```json
{
  "stats": [
    {
      "date": "2024-01-15",
      "totalViews": 123,
      "totalTaps": 45,
      "totalExchanges": 12,
      "uniqueCards": 8
    }
  ]
}
```

**Top Cards Response** (`GET /admin/analytics/top-cards?limit=5`):
```json
{
  "cards": [
    {
      "cardId": "uuid",
      "views": 456,
      "taps": 123,
      "exchanges": 34,
      "card": {
        "slug": "john-doe",
        "user": {
          "email": "john@example.com",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        }
      }
    }
  ]
}
```

**Tier Stats Response** (`GET /admin/analytics/by-tier?days=30`):
```json
{
  "stats": [
    {
      "tier": "FREE",
      "totalViews": 1000,
      "totalTaps": 200,
      "totalExchanges": 50,
      "uniqueCards": 50
    },
    {
      "tier": "PRO",
      "totalViews": 5000,
      "totalTaps": 1200,
      "totalExchanges": 300,
      "uniqueCards": 30
    },
    {
      "tier": "PREMIUM",
      "totalViews": 8000,
      "totalTaps": 2000,
      "totalExchanges": 500,
      "uniqueCards": 15
    }
  ]
}
```

### System Settings (`/admin/settings`)

**Controller**: `apps/api/src/users/admin-settings.controller.ts`  
**Service**: `apps/api/src/users/system-settings.service.ts`

#### Endpoints

| Method | Path | Description | Query Params |
|--------|------|-------------|--------------|
| GET | `/admin/settings` | List all settings | `category` (optional) |
| GET | `/admin/settings/:key` | Get specific setting | - |
| POST | `/admin/settings` | Create new setting | - |
| PATCH | `/admin/settings/:key` | Update setting | - |
| DELETE | `/admin/settings/:key` | Delete setting | - |
| GET | `/admin/settings/feature-flags/all` | Get feature flags | - |
| GET | `/admin/settings/limits/all` | Get system limits | - |

**DTOs**:
```typescript
// apps/api/src/users/dto/system-settings.dto.ts

export class CreateSettingDto {
  @IsString()
  @MinLength(1)
  key: string;
  
  @IsNotEmpty()
  value: any; // JSON value
  
  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @MinLength(1)
  category: string; // feature_flags, limits, export_options, etc.
}

export class UpdateSettingDto {
  @IsNotEmpty()
  value: any;
  
  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  category?: string;
}
```

**Settings Response** (`GET /admin/settings`):
```json
{
  "settings": [
    {
      "id": "uuid",
      "key": "ENABLE_PUBLIC_SIGNUP",
      "value": true,
      "description": "Allow new user registration",
      "category": "feature_flags",
      "updatedBy": "admin@example.com",
      "updatedAt": "2024-01-15T12:00:00Z"
    },
    {
      "key": "MAX_CARDS_FREE_TIER",
      "value": 1,
      "description": "Card limit for FREE tier",
      "category": "limits",
      "updatedBy": "admin@example.com",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Categories**:
- `feature_flags` - Boolean flags for features
- `limits` - Numeric limits (rate limits, tier limits)
- `export_options` - Export format configurations
- `email_config` - SMTP and email settings
- `other` - Miscellaneous settings

### NFC Tag Management (`/admin/nfc`)

**Controller**: `apps/api/src/nfc/nfc.controller.ts` (admin endpoints)  
**Service**: `apps/api/src/nfc/nfc.service.ts`  
**Repository**: `apps/api/src/nfc/nfc.repository.ts`

See `/docs/dev/dashboard-frontend.md` for existing NFC endpoint documentation. Key enhancements in Prompt 6:

**Enhanced DTO** (`apps/api/src/nfc/dto/nfc.dto.ts`):
```typescript
export class AssignNfcTagDto {
  @IsString()
  @IsOptional()
  userId?: string; // Option 1: Direct user ID
  
  @IsEmail()
  @IsOptional()
  userEmail?: string; // Option 2: Lookup by email
}
```

Admins can now assign tags by either `userId` or `userEmail` (service will resolve email to user ID).

---

## Frontend Pages

### Users Page (`/admin/users`)

**File**: `apps/web/src/app/admin/users/page.tsx`

**Features**:
- User list table with role/tier badges
- Stats cards (total users, tier distribution, active subscriptions, admins)
- Search by email/name with live filtering
- Role filter dropdown (USER, ADMIN, all)
- Tier filter dropdown (FREE, PRO, PREMIUM, all)
- Role change dialog (USER ↔ ADMIN with confirmation)
- Tier adjustment dialog (FREE/PRO/PREMIUM)
- Usage metrics modal (cards/contacts with progress bars, 7-day activity)
- Toast notifications for all actions

**API Integration**:
```typescript
// Load users
const data = await apiClient.get<{ users: User[]; total: number }>(
  `/admin/users?role=${roleFilter}&tier=${tierFilter}`
);

// Change role
await apiClient.patch(`/admin/users/${userId}/role`, { role: 'ADMIN' });

// Change tier
await apiClient.patch(`/admin/users/${userId}/subscription`, { tier: 'PRO' });

// Load usage
const usage = await apiClient.get(`/admin/users/${userId}/usage`);
```

**UI Components**:
- `Card` - Container for user entries
- `Badge` - Role/tier/status indicators
- `Dialog` - Modal forms for role/tier changes
- `Select` - Dropdowns for filters and form fields
- `Input` - Search field
- `Button` - Action triggers

### Analytics Page (`/admin/analytics`)

**File**: `apps/web/src/app/admin/analytics/page.tsx`

**Features**:
- Overview stats cards (views, taps, exchanges, cards, users)
- Date range selector (7/30/90/365 days)
- Daily activity timeline with metrics breakdown
- Top performing cards leaderboard (top 10)
- Performance by tier comparison (FREE/PRO/PREMIUM)
- Icon-coded metrics (Eye=views, Zap=taps, TrendingUp=exchanges)

**API Integration**:
```typescript
// Load all analytics in parallel
const [overviewData, dailyData, topCardsData, tierData] = await Promise.all([
  apiClient.get<Overview>(`/admin/analytics/overview?days=${dateRange}`),
  apiClient.get<{ stats: DailyStat[] }>(`/admin/analytics/daily?days=${dateRange}`),
  apiClient.get<{ cards: TopCard[] }>('/admin/analytics/top-cards?limit=10'),
  apiClient.get<{ stats: TierStats[] }>(`/admin/analytics/by-tier?days=${dateRange}`),
]);
```

**Data Visualization**:
- Daily activity: Timeline list with date labels and metric columns
- Top cards: Numbered list with rank badges, user details, metric breakdown
- Tier stats: Grid cards with tier badges and metric totals

### Settings Page (`/admin/settings`)

**File**: `apps/web/src/app/admin/settings/page.tsx`

**Features**:
- Tabbed interface by category (All, Feature Flags, Limits, Export, Email)
- Settings list with key/value display
- Create dialog with key/value/description/category inputs
- Edit dialog (key read-only, update value/description/category)
- Delete confirmation dialog
- JSON value support (auto-parse/stringify)
- Category-specific icons and color-coded badges
- "Updated by" and timestamp display

**API Integration**:
```typescript
// Load settings
const data = await apiClient.get<{ settings: Setting[] }>(
  `/admin/settings${category !== 'all' ? `?category=${category}` : ''}`
);

// Create setting
await apiClient.post('/admin/settings', {
  key: 'ENABLE_FEATURE_X',
  value: true,
  description: 'Enable feature X',
  category: 'feature_flags'
});

// Update setting
await apiClient.patch(`/admin/settings/${key}`, {
  value: false,
  description: 'Updated description',
  category: 'feature_flags'
});

// Delete setting
await apiClient.delete(`/admin/settings/${key}`);
```

**Value Handling**:
- Simple values: String input (e.g., `true`, `"hello"`, `42`)
- Complex values: JSON textarea (e.g., `{"key": "value", "count": 10}`)
- Auto-parsing: Attempts `JSON.parse()`, falls back to string if invalid
- Display: Formats objects with `JSON.stringify(value, null, 2)` in monospace box

### NFC Page (`/admin/nfc`)

**File**: `apps/web/src/app/admin/nfc/page.tsx`

Enhanced in Prompt 6 with email-based assignment:

**Assign Dialog**:
```typescript
// Assign by email (new in Prompt 6)
await apiClient.patch(`/admin/nfc/tags/${tag.uid}/assign`, {
  userEmail: 'user@example.com'
});
```

See `/docs/dev/dashboard-frontend.md` for full NFC page documentation.

---

## Database Schema

### SystemSettings Model

**File**: `apps/api/prisma/schema.prisma`

```prisma
model SystemSettings {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  value       Json
  description String?
  category    String
  updatedBy   String   @map("updated_by")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([key])
  @@index([category])
  @@map("system_settings")
}
```

**Migration**: `20251118154451_add_system_settings`

### NfcTag Enhancement

**Added Field**:
```prisma
model NfcTag {
  // ... existing fields
  assignedUserId String? @map("assigned_user_id") @db.Uuid
  
  // Relations
  assignedUser User? @relation("AssignedNfcTags", fields: [assignedUserId], references: [id])
}
```

**Migration**: `20251118155834_add_nfc_assigned_user`

**User Relation**:
```prisma
model User {
  // ... existing relations
  assignedNfcTags NfcTag[] @relation("AssignedNfcTags")
}
```

---

## Access Control Matrix

| Endpoint | Role Required | Action |
|----------|--------------|--------|
| `/admin/*` | ADMIN | Access admin dashboard |
| `/admin/users` | ADMIN | List users, view details |
| `/admin/users/:id/role` | ADMIN | Change user role (USER ↔ ADMIN) |
| `/admin/users/:id/subscription` | ADMIN | Modify subscription tier |
| `/admin/analytics` | ADMIN | View global analytics |
| `/admin/settings` | ADMIN | Manage system configuration |
| `/admin/nfc` | ADMIN | Manage NFC tag inventory |

**Enforcement**:
- Backend: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')`
- Frontend: `AdminGuard` component wraps admin layout
- Redirect: Non-admin users sent to `/dashboard`
- Status Code: `403 Forbidden` for unauthorized backend access

---

## Testing Checklist

### Backend

- [ ] Admin guards reject USER role (403)
- [ ] Admin guards accept ADMIN role (200)
- [ ] User listing filters by role/tier correctly
- [ ] Role update validates enum values
- [ ] Subscription update validates tier enum
- [ ] Usage metrics calculate percentages correctly
- [ ] Analytics aggregates match raw event counts
- [ ] Settings CRUD operations work with JSON values
- [ ] NFC assignment resolves email to userId

### Frontend

- [ ] Non-admin users redirected from `/admin/*`
- [ ] Admin sidebar navigation highlights active route
- [ ] User search filters by email and name
- [ ] Role/tier dialogs update UI after save
- [ ] Usage modal loads metrics asynchronously
- [ ] Analytics date range triggers data reload
- [ ] Settings tabs filter by category
- [ ] Settings JSON values parse/stringify correctly
- [ ] Toast notifications appear on success/error
- [ ] Loading states display during API calls

---

## Usage Examples

### Change User Role to Admin

**API Request**:
```bash
curl -X PATCH http://localhost:3001/admin/users/{userId}/role \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

**Frontend Flow**:
1. Click "Role" button on user row
2. Select "Admin" in dialog dropdown
3. Click "Update Role"
4. Service calls `PATCH /admin/users/:id/role`
5. Toast notification confirms success
6. User list reloads with updated badge

### View User Usage Metrics

**API Request**:
```bash
curl -X GET http://localhost:3001/admin/users/{userId}/usage \
  -H "Authorization: Bearer <admin-jwt>"
```

**Frontend Flow**:
1. Click "Usage" button on user row
2. Modal opens with loading skeletons
3. Service calls `GET /admin/users/:id/usage`
4. Display cards/contacts with progress bars
5. Show 7-day activity metrics (views, taps, submissions)

### Create System Setting

**API Request**:
```bash
curl -X POST http://localhost:3001/admin/settings \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ENABLE_NEW_FEATURE",
    "value": true,
    "description": "Enable the new feature for all users",
    "category": "feature_flags"
  }'
```

**Frontend Flow**:
1. Click "New Setting" button
2. Fill form (key, value, description, category)
3. Click "Create"
4. Service calls `POST /admin/settings`
5. Toast confirms success
6. Settings list reloads with new entry

---

## Common Patterns

### Loading States

All admin pages use this pattern:
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, [filters]);

const loadData = async () => {
  try {
    setLoading(true);
    const data = await apiClient.get('/admin/...');
    setData(data);
  } catch (error) {
    toast({ title: 'Error', variant: 'destructive' });
  } finally {
    setLoading(false);
  }
};

if (loading && data.length === 0) {
  return <Skeleton />;
}
```

### Dialog Forms

Common pattern for edit/create dialogs:
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [saving, setSaving] = useState(false);
const [formValue, setFormValue] = useState('');

const handleSave = async () => {
  setSaving(true);
  try {
    await apiClient.patch('/admin/...', { value: formValue });
    toast({ title: 'Success' });
    setDialogOpen(false);
    loadData();
  } catch (error) {
    toast({ title: 'Error', variant: 'destructive' });
  } finally {
    setSaving(false);
  }
};
```

### API Error Handling

Consistent error display:
```typescript
catch (error: any) {
  console.error('Operation failed:', error);
  toast({
    title: 'Operation Failed',
    description: error.message || 'An error occurred',
    variant: 'destructive',
  });
}
```

---

## Security Notes

1. **JWT Required**: All admin endpoints require valid JWT token
2. **Role Enforcement**: Backend validates `user.role === 'ADMIN'` on every request
3. **Frontend Guards**: Prevents non-admins from viewing admin UI
4. **Audit Trail**: SystemSettings tracks `updatedBy` email for all changes
5. **Input Validation**: All DTOs use class-validator decorators
6. **SQL Injection**: Prisma ORM prevents SQL injection by default
7. **XSS Prevention**: React escapes all user-generated content

---

## Performance Considerations

1. **Pagination**: User lists and analytics use `skip`/`take` params (default: 50 items)
2. **Indexes**: Database indexes on `SystemSettings.key` and `SystemSettings.category`
3. **Parallel Queries**: Analytics page loads 4 endpoints in parallel with `Promise.all()`
4. **Debounced Search**: User search filters client-side (no API calls on every keystroke)
5. **Date Range Limits**: Analytics queries default to 7 days to minimize dataset size

---

## Future Enhancements

1. **Bulk Operations**: Multi-select users for batch role/tier changes
2. **Export Data**: CSV/JSON export for users, analytics, settings
3. **Activity Logs**: Audit trail for all admin actions
4. **Charts**: Visual charts for analytics (line/bar graphs with recharts)
5. **Search Filters**: Advanced filters with date ranges, status, activity
6. **Real-Time Updates**: WebSocket connections for live analytics
7. **Settings Validation**: Type-specific editors (boolean toggle, number input, JSON editor)
8. **Permission Granularity**: Sub-admin roles (e.g., analytics-only, users-only)

---

## Related Documentation

- `/docs/dev/dashboard-frontend.md` - User dashboard and NFC features
- `/docs/dev/api-routes.md` - Complete API reference
- `/docs/dev/database-schema.md` - Database schema documentation
- `/docs/house_rules.md` - Coding standards
- `/docs/tdd_nexus_cards.md` - Technical architecture
