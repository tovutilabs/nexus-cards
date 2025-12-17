# Customization Feature Overview

This document explains how the card customization experience is currently implemented across the Next.js frontend and NestJS API layers. Use it as a reference when modifying the builder UI, adding new component types, or extending the backend contract.

## 1. Entry Point & Routing
- **Route:** `apps/web/src/app/[locale]/dashboard/cards/[id]/customize/page.tsx`
- **Component type:** Client component (`'use client'`) because it depends on browser-only APIs (drag-and-drop, dialogs) and React Query.
- **Guards:** The surrounding dashboard layout handles auth/locale. Once rendered, the page fetches the card details and its ordered components.

## 2. Frontend Data Flow
### 2.1 Card metadata fetch
- Uses `createApiClient()` (`apps/web/src/lib/api-client.ts`) to call `GET /cards/:cardId` and hydrate owner details (name, avatar, etc.).
- Loading and error states redirect users back to `/dashboard/cards` while surfacing toast errors.

### 2.2 Components query
- `useCardComponents(cardId)` from `apps/web/src/hooks/useCardComponents.ts` wraps a React Query `useQuery` that hits `/api/cards/:cardId/components` with `credentials: 'include'`.
- Query key: `['card-components', cardId]`, enabling cache invalidation after any mutation.

### 2.3 Mutations
| Operation | Hook / Mutation | HTTP endpoint | Notes |
|-----------|-----------------|---------------|-------|
| Add component | `useCreateComponent` | `POST /cards/:cardId/components` | Adds default config/order; palette closes on success. |
| Update component | Page-level `useMutation` or `useUpdateComponent` | `PATCH /cards/:cardId/components/:componentId` | Handles bulk config/background updates from edit dialog and enable toggles. |
| Delete component | `useDeleteComponent` | `DELETE /cards/:cardId/components/:componentId` | Confirmation via `confirm()` before mutation. |
| Reorder components | `useReorderComponents` | `POST /cards/:cardId/components/reorder` | Consumes ordered array produced by drag-and-drop. |

All mutations invalidate `['card-components', cardId]` to refresh the canonical order and config from the API.

### 2.4 Local UI state
- `paletteOpen`, `editingComponent`, and `selectedDevice` manage modal/dialog visibility, edit targets, and preview device chrome respectively.
- `PhoneMockup` (`apps/web/src/components/nexus/PhoneMockup.tsx`) renders a device frame; preview content comes from `CardComponentList` running in non-editable mode.
- UI feedback uses the shared `useToast()` hook for success/error notifications.

## 3. Builder UI Building Blocks
| Component | Path | Responsibility |
|-----------|------|----------------|
| `ComponentPalette` | `apps/web/src/components/card-components/ComponentPalette.tsx` | Dialog that lists available component types, enforces tier gating, and calls `onAddComponent(type)`. Currently the page passes `userTier="PREMIUM"`; hook into real subscription state to enforce limits client-side. |
| `CardComponentList` | `apps/web/src/components/nexus/CardComponentList.tsx` | Renders components either in edit mode (drag-and-drop via `@hello-pangea/dnd`, edit/delete/visibility controls) or preview mode (read-only). Calls `onReorder`, `onEdit`, `onDelete`, `onToggleEnabled`. |
| `ComponentEditDialog` | `apps/web/src/components/nexus/ComponentEditDialog.tsx` | Large dialog with per-component-type configuration editors (profile toggles, gallery image uploads, social link builders, etc.) plus shared background controls. Saves via `onSave(componentId, updates)`. |
| `CardComponentRenderer` | `apps/web/src/components/card-components/CardComponentRenderer.tsx` | Core renderer that takes a `CardComponent` and produces the themed UI block used in both edit and preview modes. |
| `PhoneMockup` | `apps/web/src/components/nexus/PhoneMockup.tsx` | Provides device chrome for live preview with scrollable content area. |

## 4. Backend Architecture
### 4.1 Module layout
- **Module:** `CardComponentsModule` (`apps/api/src/card-components/card-components.module.ts`) imports `PrismaModule`, registers controller/service, and re-exports the service for other modules.
- **Routing:** Controller path `cards/:cardId/components` matches the frontend fetches. Mounted under the global `/api` prefix by NestJS, so the real URL is `/api/cards/:cardId/components`.

### 4.2 Controller & Guards
- **File:** `apps/api/src/card-components/card-components.controller.ts`
- Decorated with `@UseGuards(JwtAuthGuard)` to enforce authenticated access via HTTP-only cookie JWTs.
- Endpoints: `GET /`, `GET /:componentId`, `POST /`, `PATCH /:componentId`, `POST /reorder`, `DELETE /:componentId`.
- Each mutating endpoint receives `req.user.id` to validate card ownership in the service layer.

### 4.3 Service responsibilities
- **File:** `apps/api/src/card-components/card-components.service.ts`
- Validates ownership and subscription tier before writes.
- Enforces component count caps per tier (`FREE: 3`, `PRO: 8`, `PREMIUM: effectively unlimited`).
- Component availability matrix ensures, for example, `FORM` is premium-only.
- `reorder()` performs a two-phase Prisma transaction (temporary negative order, then final value) to avoid unique constraint clashes on `(cardId, order)`.
- Deletes cascade via Prisma and returns `{ success: true }` for client handling.

### 4.4 DTOs & Validation
- Located in `apps/api/src/card-components/dto/`.
- `CreateCardComponentDto` and `UpdateCardComponentDto` use `class-validator` to enforce enums, optional config, and background props.
- `ReorderComponentsDto` validates the payload shape used by the drag-and-drop UI.

### 4.5 Data model
- Prisma model `CardComponent` (`apps/api/prisma/schema.prisma`) stores:
  - Core fields: `id`, `cardId`, `type`, `order`, `enabled`, `config (Json)`
  - Presentation: `backgroundType`, `backgroundColor`, gradient + image URLs
  - Metadata: timestamps with `@updatedAt`
- Indexes include `@@unique([cardId, order])` for deterministic ordering and `@@index([type])` for analytics/reporting queries.

## 5. Subscription & Tier Enforcement
- Backend is source of truth: before creation or when validating limits, service loads the card and `card.user.subscription` to determine tier.
- Component palette mirrors this matrix so users are nudged to upgrade before calling the API, but backend will still reject unauthorized types/counts.
- FREE/PRO limits align with product requirements documented in `docs/dev/card-customization.md` and `docs/prd_nexus_cards.md`.

## 6. Preview & Publishing Flow
1. Components query populates `CardComponentList` in edit mode on the left column.
2. Enabled subset feeds the right-column `PhoneMockup` for live preview.
3. Edits open `ComponentEditDialog`, which persists config via `PATCH` and closes on success.
4. `CardComponentRenderer` is shared between dashboard/customize and the public card page, ensuring WYSIWYG fidelity.

## 7. Extending the System
When adding a new component type:
1. Extend the Prisma `ComponentType` enum and regenerate the client.
2. Update backend tier matrices and DTO validation.
3. Add renderer + edit UI (types, renderer, edit dialog controls, default config).
4. Register palette metadata (icon, tier, description) and seed templates if needed.
5. Ensure React Query keys remain stable; consider adding optimistic updates if UX requires.

## 8. Known Gaps / Next Steps
- `userTier` is hard-coded to `PREMIUM` in the customize page. Wire this to the authenticated user’s subscription.
- No autosave/preview skeleton when mutations are pending; consider showing inline loading indicators from `updateMutation.isPending`.
- Device selector feeds `PhoneMockup` only; eventual responsive previews for desktop/tablet cards should respect actual breakpoints.
- Component edit dialog is large (1k+ LOC); splitting per-type editors would improve maintainability.
