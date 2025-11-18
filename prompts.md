# Nexus Cards – Full Prompt Pack (1–16)

## 1. Prompt 1 – Core Repo, Environments & Tooling

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

We are building _Nexus Cards_, a digital business card platform using:

- Next.js (React) for web
- NestJS for backend
- PostgreSQL
- Redis
- Containerized local development
- Production running on a VPS as specified in the updated PRD & TDD.

### **Tasks**

1. **Monorepo Setup**

   - Create a monorepo structure with:

     - `apps/web` -> Next.js App Router (TypeScript)
     - `apps/api` -> NestJS (TypeScript)
     - `packages/shared` -> shared types & utilities (DTOs, enums, helpers)

2. **Environment Configuration**

   - Configure environment files for `local`, `staging`, and `production`.
   - Ensure dev environment assumes **local Docker**.
   - Ensure production assumes **containerized VPS deployment**.
   - No secrets may be committed.

3. **Repository Tooling**

   - Configure ESLint + Prettier (consistent formatting).
   - Add root-level `README.md` explaining setup.
   - Set up workspace management using PNPM or NPM workspaces.

4. **Root-Level Scripts**

   - Create scripts:

     - `dev:web`, `dev:api`, `dev`
     - `build:web`, `build:api`
     - `build`
     - `lint`
     - `test`

### **Tests**

- Install dependencies and run `dev` to ensure both web and api start normally.
- Confirm environment variables load correctly.

### **Deliverables**

- Monorepo folder structure.
- Workspace config.
- README under project root.
- Any dev documentation -> `docs/dev`.

### **Constraints**

- Must use TypeScript everywhere.
- Must adhere to monorepo patterns.
- No secrets committed.

### **Definition of Done**

- Developer can clone the repo, install once, and run the whole system via a single `dev` command.

## 2. Prompt 2 – Design System: Brand Tokens, Typography, Spacing & shadcn Theme

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

We need to define the _Nexus UI Design System_ including tokens, typography, spacing, color palettes, and shadcn-theme overrides. This design system must satisfy all styling requirements from the PRD, including theme consistency across public cards, dashboard, and settings.

### **Tasks**

1. **Tailwind Theme Tokens**

   - Add semantic token categories:

     - primary, secondary, accent
     - muted, border
     - background, foreground
     - success, warning, danger

   - Define spacing scale, radii scale, shadow scale.
   - Add a typographic scale (Headings, Body, Display).

2. **shadcn/ui Integration**

   - Install shadcn/ui in `apps/web`.
   - Generate base components: Button, Card, Input, Dialog, DropdownMenu, Tabs, Badge, Alert, Sheet, Skeleton, Toast, Form, etc.
   - Map shadcn theme tokens to Nexus tokens.

3. **Nexus UI Primitives**

   - Create wrappers:

     - NexusButton
     - NexusCard
     - NexusInput
     - NexusBadge
     - NexusDialog
     - NexusLayoutShell (primary dashboard layout wrapper)

4. **Design System Showcase**

   - Add `/design-system` route showing every primitive and state.

### **Tests**

- Visual check: primitives correctly inherit tokens.
- Dark mode (if enabled) should work uniformly.

### **Deliverables**

- Tailwind config
- shadcn config
- Nexus UI component library
- `/design-system` page

### **Constraints**

- No inline styling except rare exceptions.
- All visual decisions must use tokens.
- Documentation goes to `docs/dev/design-system.md`.

### **Definition of Done**

- Entire UI can be built ad-infinitum using Nexus primitives + Tailwind.

## 3. Prompt 3 – Domain Model, ORM & NestJS Module Skeletons

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

We must model all backend domain entities in alignment with PRD + TDD:
Users, Cards, NFC Tags, Contacts, Analytics, Subscriptions, Integrations, etc.

### **Tasks**

1. **ORM**

   - Use **Prisma** as the single ORM for all database access (no additional ORMs).
   - Model (in `schema.prisma`):

     - User
     - Card
     - NfcTag (with direct `cardId` FK; no join table)
     - Subscription
     - Contact
     - AnalyticsEvent
     - AnalyticsCardDaily (daily-granularity analytics only)
     - WebhookSubscription
     - IntegrationTokens

2. **Migrations**

   - Implement migration pipeline runnable inside Docker.

3. **NestJS Modules**

   - Create modules:

     - Auth
     - Users
     - Cards
     - NFC
     - Contacts
     - Analytics
     - Billing
     - Integrations
     - PublicAPI

   - Stub controllers/services.

### **Tests**

- Migrations apply cleanly to PostgreSQL.
- NestJS can start all modules without circular deps.

### **Deliverables**

- Schema file(s)
- Migrations
- Module skeletons
- Minimal DTOs

### **Constraints**

- No unused fields.
- Adhere to PRD/TDD constraints.

### **Definition of Done**

- Domain model implemented with schemas, migrations, and modules.

## 4. Prompt 4 – Auth, Users & Subscription Awareness

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

Implement secure authentication (email/password), subscription awareness, and user profiles as required in PRD.

### **Tasks**

1. **Email + Password Auth**

   - Register, login, logout
   - Password hashing, session or JWT tokens
   - Forgot password flow

2. **User Profiles**

   - Update name/title/avatar/etc.

3. **Subscription Awareness**

   - Apply tier limits:

     - Free: 1 card
     - Professional: 5 cards
     - Premium: unlimited

   - Analytics retention:

     - Free: 7 days
     - Pro: 90 days
     - Premium: unlimited

4. **Frontend Integration**

   - Pages:

     - `/auth/login`
     - `/auth/register`
     - `/auth/forgot-password`
     - `/dashboard/settings/account`

### **Tests**

- Registration -> login flow
- Tier-enforced rate limits for cards

### **Deliverables**

- Auth module
- User module
- Subscription helpers

### **Constraints**

- No plaintext passwords
- Tokens must be HTTP-only cookies or secure JWTs

### **Definition of Done**

- Fully functional auth + tier enforcement.

## 5. Prompt 5 – Cards, Sharing, NFC Core & Contact Exchange

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

This step implements the core business logic of Nexus Cards: card creation, customization, NFC tag resolving & association, contact exchange, and public card rendering. All flows must strictly follow the PRD & TDD rules.

### **Tasks**

#### **1. Card Management (Backend)**

- Implement CRUD for cards:

  - title
  - user profile fields
  - contact info
  - social links
  - design settings
  - template/theme references

- Implement “default card” setting.
- Implement “delete card” with soft-delete (if PRD requires).
- Slug generator for public card URLs.

#### **2. Public Card API**

- Create endpoint:
  `GET /public/cards/:slug`
- Returns safe-to-display card payload only.
- Supports:

  - public/private visibility
  - passwords (if enabled in a later prompt)
  - analytics logging

#### **3. NFC Tag Core Logic**

Implement **ALL NFC rules** from PRD/TDD:

- Admin imports list of UIDs into NFC inventory.
- Admin assigns UIDs to user accounts.
- User **cannot** add physical tags; only view assigned ones.
- Users can only **associate / disassociate** tags with their own digital cards.
- Each NFC tag may be associated with **at most one card at a time** (1 tag -> 0/1 card); a **card may have multiple tags**, and a tag **must never link to multiple cards**.
- No `NfcTagCardLink` join table is allowed; the 1-tag-to-1-card relation is enforced via a single `cardId` on `NfcTag`.
- When scanning an NFC tag:

  1. If UID exists but unassigned -> "unassigned tag" screen
  2. If UID assigned to user but not linked to a card -> card association screen
  3. If UID assigned & linked -> redirect to associated card

- Support ASCII Mirror feature: detect UID from appended URL.

#### **4. Contact Exchange System**

- Non-users can submit their contact information on a public card.
- Store in `Contact` table linked to card owner.
- User contact wallet features:

  - list
  - view
  - edit
  - export (VCF, CSV)

#### **5. Dashboard UIs**

Implement:

- `/dashboard/cards`
- `/dashboard/cards/[id]` (multi-tab editor)
- `/dashboard/nfc` (tag assignment overview)
- `/dashboard/contacts`

Additionally, scaffold the **Admin dashboard shell** (no deep feature wiring yet):

- `/admin` (top-level layout + navigation visible only for users with `role = ADMIN`)
- `/admin/nfc` (placeholder page wired to later manage NFC inventory)
- `/admin/users` (placeholder page wired to later manage users and subscriptions)
- `/admin/analytics` (placeholder page wired to later show global/daily analytics)
- `/admin/settings` (placeholder page wired to later handle system configuration)

#### **6. Public Card Frontend**

Create:

- `/p/[slug]` public card route
- Mobile-first responsive layout
- Contact form
- QR code rendering
- NFC UID-aware redirect behavior

### **Tests**

- NFC resolve logic: all 4 possible tag states.
- Contact submission -> appears in dashboard.
- Card creation, editing, linking to NFC tag.
- Public card loads successfully.

### **Deliverables**

- Complete CardsModule
- NFCTagsModule
- ContactsModule
- Public card page UI
- Dashboard pages

### **Constraints**

- Must strictly follow NFC rules (admins manage tags, users link/unlink only).
- Must use Nexus UI primitives.

### **Definition of Done**

- Complete card editing + NFC flows + contact exchange functioning end-to-end.
- Admin dashboard shell routes exist and are gated to `role = ADMIN` users only.

## 6. Prompt 6 – Admin Dashboard & Ops Tools

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

Prompt 5 created the basic Admin dashboard shell (`/admin/*`) and NFC/user/analytics backend capabilities. This prompt wires the Admin UI to real admin APIs and enforces strict role-based access control so only `role = ADMIN` users can manage NFC inventory, users/subscriptions, global analytics, and system settings.

### **Tasks**

1. **Admin Auth & RBAC Enforcement**

   - Implement server-side checks so that all `/admin/*` routes are only accessible to authenticated users with `role = ADMIN`.
   - Add shared guards/middleware/hooks on both frontend and backend:

     - Backend: NestJS guards (e.g., `RolesGuard`) on all admin controllers (`/admin/nfc`, `/admin/users`, `/admin/analytics`, `/admin/settings`).
     - Frontend: Next.js route protection for `/admin/*` (redirect non-admin users to a safe page such as `/dashboard`).

   - Ensure non-admin users cannot see Admin nav items or hit Admin APIs (even by typing URLs directly).

2. **Admin NFC Inventory Management UI**

   - Wire `/admin/nfc` to the real NFC inventory endpoints defined in the `NfcModule`:

     - List all NFC tags in inventory with columns: UID, status (`AVAILABLE`, `ASSIGNED`, `REVOKED`), assigned user, createdAt/updatedAt.
     - Actions:

       - Import UIDs (CSV upload) -> calls admin NFC import endpoint.
       - Assign tag to user -> calls admin assign endpoint with `userId`.
       - Revoke tag -> calls revoke endpoint (sets status to `REVOKED`, clears `assignedUserId` and `cardId`).

   - Add filters/search by UID, status, and assigned user.
   - Log admin actions to an audit trail (optional stub for now).

3. **Admin User & Subscription Management UI**

   - Wire `/admin/users` to Users and Subscription APIs:

     - List users with: email, name, `role`, subscription tier, status, createdAt.
     - Actions:

       - Change user `role` between `USER` and `ADMIN` (with confirmation).
       - View and adjust subscription tier (`FREE`, `PRO`, `PREMIUM`) and subscription status (`ACTIVE`, `CANCELED`, `PAST_DUE`).
       - View high-level usage metrics per user (cards count, contacts count, recent activity).

   - Enforce that only admins can modify roles/tiers; regular users must never see this UI or hit these endpoints.

4. **Admin Global Analytics & Reporting**

   - Wire `/admin/analytics` to the daily analytics aggregates (`AnalyticsCardDaily`) and any existing analytics APIs:

     - Provide global, cross-tenant views with **daily granularity only**:

       - Total cards, total views, total NFC taps per day.
       - Top cards by views/taps.
       - Per-plan usage summaries (FREE vs PRO vs PREMIUM).

     - Allow time range selection (last 7/30/90 days, all-time) consistent with PRD/TDD.

   - Ensure that all analytics queries continue to use daily-level buckets and do not introduce hourly/sub-daily aggregations.

5. **Admin System Settings**

   - Wire `/admin/settings` to system configuration endpoints (or stubs if full implementation is deferred):

     - Feature flags (e.g., enabling/disabling experimental features).
     - Global limits (e.g., default card limits, default analytics retention windows aligned with tiers).
     - Contact/analytics export options (e.g., enabling exports, configuring destinations).

   - Persist settings via a dedicated configuration model/table or environment-backed config where appropriate.

### **Tests**

- RBAC:

  - Non-authenticated and non-admin users cannot access any `/admin/*` routes (UI or API); they receive correct HTTP status codes (e.g., 401/403) and are redirected away from Admin pages.
  - Admin users can fully access `/admin/*` routes.

- NFC Inventory:

  - Import, assign, and revoke flows work end-to-end from the `/admin/nfc` UI through to the database (NfcTag records updated correctly).

- User Management:

  - Changing `role` and subscription tier from `/admin/users` updates the underlying user/subscription records.

- Analytics:

  - `/admin/analytics` charts reflect `AnalyticsCardDaily` data and respect date ranges.
  - No non-daily aggregation is introduced.

### **Deliverables**

- Admin RBAC guards/middleware on API and web.
- `/admin/nfc` wired to real NFC inventory endpoints.
- `/admin/users` wired to user and subscription management APIs.
- `/admin/analytics` wired to daily analytics queries.
- `/admin/settings` wired to system configuration storage.
- `docs/dev/admin-dashboard.md` documenting Admin flows, permissions, and key endpoints.

### **Constraints**

- All `/admin/*` routes must be strictly limited to `role = ADMIN` users.
- No direct DB access from frontend; all Admin operations must go through typed APIs.
- Analytics in Admin views must continue to operate on daily granularity only.

### **Definition of Done**

- Admin users can manage NFC inventory, users/subscriptions, and global analytics/settings from the Admin dashboard.
- Non-admin users cannot see or access any Admin dashboard routes or APIs.

## 7. Prompt 7 – Payments, Billing & External Integrations

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

Implement subscription payment flows and integration stubs per PRD Section 2.10, including CRM/email/cloud systems.
Real payment integrations must at least support Stripe; others may use integration stubs with placeholder flows.

### **Tasks**

#### **1. Payment Processing**

- Integrate Stripe subscription flow:

  - Create checkout session
  - Handle webhook for:

    - subscription.created
    - subscription.updated
    - invoice.payment_succeeded

- On successful payment:

  - Update user’s subscription tier
  - Update renewal dates
  - Apply tier limits

- Add extension scaffolding for:

  - PayPal
  - M-Pesa

#### **2. Billing UI**

Add dashboard pages:

- `/dashboard/settings/billing`
  Show:
- Current plan
- Usage limits
- Upgrade/downgrade options

#### **3. CRM & Productivity Integrations**

Create integration services (stubbed or partial):

- Salesforce
- HubSpot
- Zoho
- Mailchimp
- SendGrid
- Zapier (via webhook triggers)
- Google Drive / Dropbox (token storage + simple test action)

#### **4. Integrations UI**

Page:
`/dashboard/integrations`

- Connect / disconnect buttons
- Show integration status

### **Tests**

- Mock Stripe checkout -> verify subscription changes.
- Test CRM sync endpoints (mock push contacts).
- Test webhook retries and idempotency.

### **Deliverables**

- BillingModule
- IntegrationsModule
- Billing UI
- Integrations UI
- Webhook handlers
- `docs/dev/billing-and-integrations.md`

### **Constraints**

- Payment webhooks must be idempotent.
- No tokens stored in plaintext; use encryption.

### **Definition of Done**

- User can upgrade/downgrade plan.
- Payments + integrations behave per PRD.
- Integrations UI functional.

## 8. Prompt 8 – PWA, i18n, Accessibility & Advanced Analytics / A/B Testing

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

The PRD requires that Nexus Cards operate as a PWA for public card viewing, support multi-language UI, render bilingual cards, meet accessibility requirements, and support advanced analytics dimensions and A/B testing.

### **Tasks**

#### **1. Progressive Web App (PWA)**

- Add `manifest.json` with icons in required sizes.
- Add service worker:

  - Cache-first for static assets.
  - Network-first for dynamic content.
  - Offline fallback for public card pages.

- Ensure `/p/[slug]` is viewable offline with a cached version.

#### **2. Internationalization (i18n)**

- Integrate `next-intl` or `next-i18next`.
- Set up translation namespaces:

  - common
  - dashboard
  - public-card
  - settings

- Add language switcher to dashboard.
- Implement bilingual card support:

  - Secondary language fields in card model.
  - Switcher toggle on the public card.

#### **3. Accessibility Requirements**

- Audit pages for WCAG 2.1 AA compliance:

  - Keyboard navigation
  - ARIA roles
  - Visible focus states
  - Color-contrast compliance

- Ensure Nexus UI primitives meet accessibility rules.

#### **4. Advanced Analytics (Foundations)**

Add analytics events:

- card_view
- link_click
- contact_submit
- referral_source
- device_type
- geo_country

Create:

- `/dashboard/analytics`
- Basic charts:

  - views over time
  - top referrals
  - device breakdown

#### **5. A/B Testing Scaffolding**

Implement:

- Experiment definition model
- Variant assignment (randomized or weighted)
- Event logging per variant
- Simple internal API to fetch active experiments

### **Tests**

- Lighthouse PWA score > 90.
- Lighthouse accessibility > 90.
- i18n renders pages in 2 languages.
- Offline mode loads a cached public card.
- Analytics log entries generated.

### **Deliverables**

- Manifest & service worker
- i18n setup
- Accessibility fixes
- Analytics UI + backend
- A/B testing scaffolding
- `docs/dev/pwa-i18n-accessibility.md`

### **Constraints**

- PWA caching must not expose private content.
- All translated text must come from translation files.

### **Definition of Done**

- App is installable as a PWA.
- Public cards work offline.
- Two languages supported.
- Accessible and analytics-enabled.

## 9. Prompt 9 – Public API Access, Webhooks & Testing/CI

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

Premium tier offers public API access. PRD also requires webhook systems for events, and a robust testing + CI workflow.

### **Tasks**

#### **1. Public API Access**

- Premium users can generate API keys.
- Endpoint for rotating/regenerating keys.
- Implement API key–protected endpoints:

  - List user cards
  - Retrieve card metadata
  - List contacts
  - Write analytics events

- Add rate limiting (per key).

#### **2. Webhooks**

Support webhook events:

- card_view
- contact_created
- payment_success
- nfc_tag_scan
- experiment_event (from A/B tests)

Users can:

- register webhook URLs
- verify webhook signatures
- view logs/recent deliveries
- retry failed deliveries manually

#### **3. Testing (Backend + Frontend)**

- Unit tests for:

  - Auth
  - Cards
  - NFC
  - Contacts
  - Billing

- Integration tests for:

  - Analytics logging
  - API key validation

- Frontend tests:

  - Component tests (Nexus UI primitives)
  - E2E flows (Playwright/Cypress)

#### **4. CI Pipeline**

Create GitHub Actions workflow:

- Install dependencies
- Lint
- Test
- Build both apps
- Optionally build Docker images
- Upload build artifacts

### **Tests**

- API key authentication tests.
- Webhook signature test.
- Mock delivery + retry test.
- CI green across all stages.

### **Deliverables**

- Public API (secure endpoints)
- Webhooks implementation
- Automated tests
- CI pipeline config
- `docs/dev/testing-and-ci.md`

### **Constraints**

- Public API must respect subscription tier rules.
- All webhook deliveries must be signed.

### **Definition of Done**

- Premium users can fully use public API.
- Webhooks are stable & testable.
- CI pipeline enforces code quality.

## 10. Prompt 10 – Authentication Enhancements

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

This prompt implements advanced authentication features required by the PRD, including social login, 2FA, email verification, secure recovery, and UI for each flow.

### **Tasks**

#### **1. Social Login Providers**

Implement OAuth login through:

- Google
- LinkedIn
- Microsoft

Requirements:

- Store provider + provider_id
- Support account linking (existing email + new provider)
- Support unlinking providers from dashboard (except primary)

#### **2. Two-Factor Authentication (2FA)**

Use TOTP-based 2FA:

- Setup endpoint
- Generate QR code provisioning URI
- Verify one-time code
- Enforce per-login when enabled
- Backup codes (optional but recommended)

#### **3. Email Verification**

- Issue verification token
- Send verification email
- Verification endpoint
- Block access to tier features until verified

#### **4. Password Reset Workflow**

- Request password reset (email token)
- Token validation endpoint
- Secure password update form

#### **5. Frontend UIs**

Implement pages:

- `/auth/verify`
- `/auth/oauth`
- `/auth/two-factor`
- `/auth/two-factor/setup`
- `/auth/reset-password`

Add dashboard settings for:

- Social login connections
- Enable/disable 2FA
- Backup codes display

### **Tests**

- OAuth login works for all providers
- 2FA success & failure tests
- Email verification blocks access until complete
- Password reset flow works end-to-end

### **Deliverables**

- Auth extension modules
- OAuth controllers/services
- 2FA setup & enforcement logic
- Verification + reset flows
- `docs/dev/auth-extensions.md`

### **Constraints**

- No plaintext password storage
- Tokens must not leak via logs
- OAuth secrets stored securely

### **Definition of Done**

- Fully functional modern authentication with social login + 2FA + verification + secure recovery.

## 11. Prompt 11 – Advanced Card Customization

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

PRD Section 2.4 requires advanced card customization, templates, design packs, industry themes, premium-only options, and layout controls.

### **Tasks**

#### **1. Template & Theme System**

- Implement template registry with ~15 starter templates.
- Industry theme collections:

  - Tech
  - Corporate
  - Creative
  - Legal
  - Healthcare

- Include template metadata fields:

  - allowed tiers
  - recommended industries
  - color scheme lock/unlock

#### **2. Customization Options**

- Typography sets (at least 5).
- Font family switching.
- Logo upload support.
- Background:

  - Solid colors
  - Gradients
  - Patterns
  - User-uploaded image (Premium)

- Border radius presets.
- Shadow presets.

#### **3. Layout Controls**

- Vertical layout
- Horizontal layout
- Center-aligned minimal layout
- Image-first layout
- “Compact profile” layout for small screens

#### **4. Custom CSS (Premium Only)**

- Add custom CSS field
- Sanitize CSS
- Limit unsafe CSS properties

#### **5. Public Card Rendering**

- Ensure templates fully drive the public card UI.
- Support responsive adaptation.

### **Tests**

- Switching templates updates live preview.
- Tier restrictions enforced.
- Custom CSS isolation tested.
- Rendering tests for all breakpoints.

### **Deliverables**

- Template system
- Template metadata
- Editor UI state management
- `docs/dev/card-customization.md`

### **Constraints**

- All styling must be driven by design tokens or template configuration.
- No direct inline hacks.

### **Definition of Done**

- Card editor supports all PRD customization features.

## 12. Prompt 12 – Sharing Controls

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

PRD Section 2.5 requires fine-grained sharing controls, privacy settings, expiring links, password-protected links, and multi-channel share capabilities.

### **Tasks**

#### **1. Privacy Modes**

Implement:

- Public
- Private (login required)
- Password-protected (shared link requires password)

#### **2. Share Link Generator**

Parameters:

- Link expiration date
- Password protection (optional)
- Permission profile:

  - view only
  - allow contact submission

Allow multiple active share links per card.

#### **3. Multi-Channel Sharing**

Generate one-click sharing links to:

- WhatsApp
- Telegram
- SMS
- Email
- LinkedIn

#### **4. Share Management UI**

Add page:
`/dashboard/cards/[id]/sharing`

Controls:

- Create new link
- Edit expiration
- Set/remove password
- Revoke link

#### **5. Backend Enforcement**

- Validate expired links
- Validate password-protected links
- Log analytics for link type (channel)

### **Tests**

- Private card redirects to login.
- Password-protected link rejects incorrect password.
- Expired link returns correct error.
- Sharing URLs validated.

### **Deliverables**

- ShareLink entity
- Share management controller
- Sharing UI
- `docs/dev/sharing-controls.md`

### **Constraints**

- Link tokens must be unguessable.
- Password-protected links must use secure hashing.

### **Definition of Done**

- All PRD sharing requirements fully implemented.

## 13. Prompt 13 – Advanced Contact Management

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

The PRD requires a fully featured contact management system including tags, notes, categories, source attribution, CSV import, QR import, and export tools.

### **Tasks**

#### **1. Contact Enhancements**

Implement fields:

- tags[]
- category
- notes (rich text or plain text)
- favorite flag
- source (qr, form, imported, manual)

#### **2. CSV/Excel Import**

- Parse CSV/Excel
- Map fields interactively
- Validate email/phone fields
- Display preview before import
- Support bulk tagging

#### **3. Export**

- CSV
- VCF
- Export all or filtered subset

#### **4. QR Scanning**

- Implement camera-based QR scan UI
- Example QR payload:
  `{ name, phone, email, company, notes }`

#### **5. Manual Addition UI**

- Simple form
- Tag picker
- Category selector
- Notes field

#### **6. Contact Wallet UI Enhancements**

- `/dashboard/contacts` filters:

  - tags
  - categories
  - favorites

### **Tests**

- CSV import with invalid rows -> error handling
- VCF export renders valid vCard
- QR scanning works in modern mobile browsers

### **Deliverables**

- Contact import/export modules
- QR scanner page
- Updated contact wallet UI
- `docs/dev/contact-management.md`

### **Constraints**

- Must sanitize imported data.
- Limit QR data size based on browser constraints.

### **Definition of Done**

- Contact system meets PRD requirements end-to-end.

## 14. Prompt 14 – Mutual Connections, Network Graph & Smart Suggestions

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

This prompt implements the PRD Phase 2 and Phase 3 features around social graph intelligence: mutual connections, connection strength heuristics, network visualization, and smart suggestion engine.

### **Tasks**

#### **1. Mutual Connection Detection**

Implement logic:

- When user A views user B’s card while logged in, record a “connection event.”
- If user B later views user A’s card, mark as **mutual connection**.
- Store:

  - first_interaction_date
  - last_interaction_date
  - view_count

#### **2. Connection Strength Score**

Simple heuristic based on:

- Interaction volume
- Recency
- Frequency
- Card interactions (views, clicking social links)

Return score 0–100.

#### **3. Network Visualization**

Create:

- `/dashboard/network`
- Graph rendered using a lightweight library:

  - force-directed graph or radial graph

- Nodes:

  - users
  - contacts

- Edges:

  - views
  - mutual connections
  - relationships via imported contacts

Provide:

- Zoom/pan
- Node details panel

#### **4. Smart Suggestions Engine**

Implement:

- Profile completeness scoring
- Suggestions:

  - missing fields
  - recommended links
  - recommended templates
  - recommended colors by industry

- Optional: A/B test suggestions (connect to Prompt 7 scaffolding)

Backend:

- Create `/suggestions` endpoint

Frontend:

- Add suggestions widget under `/dashboard`

### **Tests**

- Connection detection E2E
- Mutual connection correctness
- Graph loads with >100 nodes
- Suggestions endpoint returns actionable recommendations

### **Deliverables**

- MutualConnections module
- Network graph UI
- Suggestion engine (basic AI or rules-driven)
- `docs/dev/network-and-suggestions.md`

### **Constraints**

- No PII exposed in graph for private users.
- Suggestion engine must be overrideable.

### **Definition of Done**

- Mutual connections + network graph + suggestions fully implemented per PRD.

## 15. Prompt 15 – Integrations (CRM, Email, Zapier, Cloud Storage)

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

This prompt implements the integrations required under PRD Section 2.10.

### **Tasks**

#### **1. CRM Integrations**

Implement minimal API actions for:

- Salesforce
- HubSpot
- Zoho

Actions supported:

- Push contact
- Update contact
- Get contact (optional)

#### **2. Email Marketing Integrations**

Implement stubs for:

- Mailchimp
- SendGrid

Actions:

- Add subscriber
- Update subscriber
- Sync tags

#### **3. Zapier Integration**

- Webhook-based integration
- Allow any event to be emitted:

  - contact_created
  - card_view
  - link_click
  - subscription_updated

- Add UI to generate Zapier-compatible webhook URLs.

#### **4. Cloud Storage Integrations**

Implement OAuth/token flows for:

- Google Drive
- Dropbox

Actions:

- Upload exported contacts
- Upload exported analytics CSV/PDF

#### **5. Integrations UI**

Add page:
`/dashboard/integrations`

- Connect
- Disconnect
- Test integration

Show:

- Service
- Status
- Permissions needed

### **Tests**

- Mock CRM push
- Mock email provider subscriber creation
- Zapier webhook acceptance
- Drive/Dropbox token exchange handlers

### **Deliverables**

- CRM, email, Zapier, and cloud integration services
- Integration settings UI
- `docs/dev/integrations.md`

### **Constraints**

- All tokens encrypted.
- All integrations must be modular & replaceable.

### **Definition of Done**

- At least one CRM + one email + Zapier + one cloud storage integration fully functional.

## 16. Prompt 16 – Notifications, Compliance, Offline Mode & Accessibility

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

This prompt completes the PRD’s requirements for notifications, compliance, accessibility, and offline edge cases.

### **Tasks**

#### **1. Notification System**

Triggers:

- new contact
- analytics milestone
- payment succeeded
- NFC tag scanned

Channels:

- email
- in-app feed
- (optional) push notifications stub

UI:

- `/dashboard/notifications` feed
- Notification settings under `/dashboard/settings`

#### **2. Offline Mode Enhancements**

- Cache fallback for:

  - dashboard shell (partial)
  - public card images
  - translations

- Handle:

  - offline contact submission (queued)

#### **3. Accessibility Completion**

- Full WCAG 2.1 AA audit
- Fix:

  - headings
  - ARIA roles
  - focus traps
  - skip-to-content links

- Add accessibility statement page

#### **4. Compliance (GDPR, CCPA)**

Implement:

- Data export (JSON + CSV)
- Delete account flow
- Cookie consent manager
- Privacy policy
- Terms of service
- Data processing FAQ

### **Tests**

- Offline queue for contact submission works.
- Data export correct & complete.
- Delete account wipes PII.
- Accessibility audits pass.

### **Deliverables**

- Notifications module
- Compliance pages
- Accessibility fixes
- Offline improvements
- `docs/dev/compliance-and-accessibility.md`

### **Constraints**

- No tracking in private mode.
- Cookie consent respected.

### **Definition of Done**

- System fully compliant with PRD sections 2.12–2.14 and 9.

## 17. Prompt 17 – Advanced Analytics & A/B Testing Completion

**First, read `docs/house_rules.md` and explicitly acknowledge that you will strictly follow it, along with the PRD (`docs/prd_nexus_cards.md`) and TDD (`docs/tdd_nexus_cards.md`), for all actions in this prompt and for all code you generate. You must also follow these output rules: use ASCII-only characters, provide full file contents (no snippets or ellipses), and use repo-relative paths for all files. Any documentation produced must be saved under `docs/dev`.**

### **Context**

Build on Prompt 7 and complete all analytics + experiment features required by the PRD Phase 3.

### **Tasks**

#### **1. Expanded Analytics Dimensions**

Implement:

- Geo-region charts (country -> region approximate)
- Device type
- Browser
- Referral URL
- Link-level CTR
- Scroll depth (optional)

#### **2. Time-Series Analytics**

- Daily
- Weekly
- Monthly
- Rolling 30-day trends

#### **3. Analytics Dashboard UI**

Add:

- Country heatmap
- Device donut charts
- Referral leaderboard
- Link click table

#### **4. A/B Testing Completion**

Implement:

- Create/edit experiment screen
- Variant assignment rules
- Variant weighting
- Experiment summary page
- Kill-switch for experiments

Backend:

- Experiment result aggregation
- Variant event logging pipeline

### **Tests**

- Analytics aggregation constraints
- Load analytics for heavy datasets
- A/B test variant assignment consistency
- Export analytics to CSV & PDF

### **Deliverables**

- Advanced analytics backend
- Full analytics dashboard
- Experiment management UI
- `docs/dev/advanced-analytics.md`

### **Constraints**

- Heavy analytics queries must be cached.
- Sensitive logs must be anonymized.

### **Definition of Done**

- Analytics & A/B testing fully complete with all PRD-required dimensions and dashboards.
