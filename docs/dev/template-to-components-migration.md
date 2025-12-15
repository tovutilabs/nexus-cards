# Template-to-Components Migration Strategy

**Document Version:** 1.0  
**Date:** December 14, 2025  
**Objective:** Convert hardcoded template sections into editable components while maintaining visual consistency

---

## Executive Summary

### Current State
- Templates are monolithic CSS layouts with hardcoded HTML structure in `CardRenderView.tsx`
- Template sections (header, contact tiles, social links) cannot be individually edited, toggled, or reordered
- Templates and components are separate systems with no integration

### Target State
- Template sections become component instances with template-specific styling variants
- Users can toggle, reorder, and customize each section independently via Components tab
- Templates provide visual theme/styling that components adopt
- Full backward compatibility with existing cards

### Business Value
- **User flexibility**: Toggle individual contact fields, reorder sections, customize per-section
- **Consistency**: Template styling still applies via CSS classes
- **Scalability**: Easy to add new template variants without duplicating code
- **User experience**: Unified editing interface in customize page

---

## Architecture Overview

### Transformation Model

```
┌─────────────────────────────────────────────────────────────┐
│                        BEFORE                                │
├─────────────────────────────────────────────────────────────┤
│  Template (basic-business)                                  │
│  ├── CSS only (styling)                                     │
│  └── Hardcoded HTML in CardRenderView.tsx                   │
│      ├── .card-basic-header (name, title, avatar)           │
│      ├── .card-basic-contact (phone, email, website)        │
│      └── .card-basic-social (LinkedIn, Twitter, GitHub)     │
│                                                              │
│  Components System (separate)                               │
│  └── Gallery, Services, Testimonials (rendered below)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        AFTER                                 │
├─────────────────────────────────────────────────────────────┤
│  Template (basic-business)                                  │
│  ├── CSS (styling theme)                                    │
│  └── Auto-creates components on application                 │
│                                                              │
│  Component Instances (in card_components table)             │
│  ├── PROFILE (variant: 'basic-business')                    │
│  │   └── Uses .card-basic-header CSS classes                │
│  ├── CONTACT (variant: 'basic-business')                    │
│  │   └── Uses .card-basic-contact CSS classes               │
│  └── SOCIAL_LINKS (variant: 'basic-business')               │
│      └── Uses .card-basic-social CSS classes                │
│                                                              │
│  Additional Components (user-added)                         │
│  └── Gallery, Services, etc. (same as before)               │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**
   - Templates = Styling theme (CSS)
   - Components = Content structure (HTML + config)

2. **Template Variants**
   - Each component type supports multiple variants
   - Variant determines which CSS classes to use
   - Example: `PROFILE` with `variant: 'basic-business'` uses `.card-basic-header`

3. **Backward Compatibility**
   - Existing cards with templates continue working
   - Old hardcoded rendering path as fallback
   - Gradual migration, no breaking changes

4. **Data Flow**
   ```
   User applies template
     → Backend creates component records (PROFILE, CONTACT, SOCIAL_LINKS)
     → Component config includes variant: 'basic-business'
     → Frontend renders components using template CSS classes
     → User edits components via Components tab
   ```

---

## Implementation Phases

### Phase 0: Preparation & Analysis (Week 1)

**Objective:** Assess current codebase and prepare infrastructure

#### Tasks

1. **Code Audit**
   - [ ] Document all template detection logic locations
   - [ ] List all hardcoded template sections
   - [ ] Inventory component types and their configs
   - [ ] Map template CSS classes to component types

2. **Database Schema Review**
   - [ ] Verify `card_components.config` can store variant field
   - [ ] Check `card_components.type` enum includes needed types
   - [ ] Ensure foreign key constraints won't block migration

3. **Create Test Environment**
   - [ ] Clone production data to staging
   - [ ] Create test cards with basic-business template
   - [ ] Set up rollback procedures

4. **Documentation**
   - [ ] Document current template rendering flow
   - [ ] Create component variant specification
   - [ ] Write API contract for new endpoints

#### Success Criteria
- Complete inventory of affected code files
- Test environment with representative data
- Team alignment on approach

#### Risks & Mitigation
- **Risk:** Undocumented dependencies on hardcoded structure
- **Mitigation:** Comprehensive code search and test coverage

---

### Phase 1: Component Infrastructure (Week 2)

**Objective:** Extend component system to support template variants

#### Tasks

1. **Update Component Type Definitions**
   ```typescript
   // apps/web/src/components/card-components/types.ts
   
   export interface ProfileConfig {
     variant?: 'default' | 'basic-business' | 'photographer-split' | 'photographer-wave';
     showAvatar?: boolean;
     showTitle?: boolean;
     showCompany?: boolean;
     avatarShape?: 'circle' | 'square';
     avatarSize?: 'sm' | 'md' | 'lg';
   }
   
   export interface ContactConfig {
     variant?: 'default' | 'basic-business';
     layout?: 'list' | 'tiles' | 'buttons';
     showEmail?: boolean;
     showPhone?: boolean;
     showWebsite?: boolean;
     showAddress?: boolean;
     emailIcon?: string;
     phoneIcon?: string;
     websiteIcon?: string;
     addressIcon?: string;
   }
   
   export interface SocialLinksConfig {
     variant?: 'default' | 'basic-business';
     title?: string;
     layout?: 'horizontal' | 'circles' | 'buttons' | 'grid';
     platforms?: Array<{
       platform: 'linkedin' | 'twitter' | 'github' | 'facebook' | 'instagram' | 'youtube' | 'tiktok';
       url: string;
       label?: string;
     }>;
     iconSize?: 'sm' | 'md' | 'lg';
     showLabels?: boolean;
   }
   ```

2. **Create Variant Renderers**
   - [ ] Implement `ProfileComponent` basic-business variant
   - [ ] Implement `ContactComponent` basic-business variant
   - [ ] Implement `SocialLinksComponent` basic-business variant
   - [ ] Add variant detection logic in each component

3. **Template Theme Context**
   ```typescript
   // apps/web/src/lib/template-themes.ts
   
   export interface TemplateTheme {
     name: string;
     slug: string;
     cssClassPrefix: string;  // e.g., 'card-basic'
     supportedComponents: ComponentType[];
     defaultVariants: Record<ComponentType, string>;
   }
   
   export function getTemplateTheme(customCss?: string): TemplateTheme | null {
     if (customCss?.includes('card-basic-container')) {
       return {
         name: 'Basic Business',
         slug: 'basic-business',
         cssClassPrefix: 'card-basic',
         supportedComponents: ['PROFILE', 'CONTACT', 'SOCIAL_LINKS'],
         defaultVariants: {
           PROFILE: 'basic-business',
           CONTACT: 'basic-business',
           SOCIAL_LINKS: 'basic-business',
         },
       };
     }
     return null;
   }
   ```

4. **Update CardComponentRenderer**
   - [ ] Pass `templateTheme` to all component renderers
   - [ ] Add variant fallback logic (default if variant not supported)

#### Testing
- [ ] Unit tests for each variant renderer
- [ ] Visual regression tests comparing old vs new rendering
- [ ] Component palette shows correct variants

#### Success Criteria
- All three component types render identically to hardcoded versions
- No visual differences when comparing screenshots
- Components work with and without template theme

#### Deliverables
- Updated component type definitions
- Three component variants implemented
- Test suite with 100% coverage for variants

---

### Phase 2: Backend Auto-Creation (Week 3)

**Objective:** Automatically create components when template is applied

#### Tasks

1. **Component Factory Service**
   ```typescript
   // apps/api/src/templates/services/template-component-factory.service.ts
   
   @Injectable()
   export class TemplateComponentFactory {
     constructor(private prisma: PrismaService) {}
     
     async createComponentsForTemplate(
       templateSlug: string,
       cardId: string,
       cardData: any,
     ): Promise<CardComponent[]> {
       const factories = {
         'basic-business': () => this.createBasicBusinessComponents(cardId, cardData),
         'photographer-split': () => this.createPhotographerSplitComponents(cardId, cardData),
         // Add more templates as needed
       };
       
       const factory = factories[templateSlug];
       if (!factory) return [];
       
       return factory();
     }
     
     private async createBasicBusinessComponents(cardId: string, cardData: any) {
       const components = [];
       
       // PROFILE component
       components.push(await this.prisma.cardComponent.create({
         data: {
           cardId,
           type: 'PROFILE',
           order: 0,
           enabled: true,
           config: {
             variant: 'basic-business',
             showAvatar: true,
             showTitle: !!cardData.jobTitle,
             showCompany: !!cardData.company,
             avatarShape: 'circle',
             avatarSize: 'lg',
           },
         },
       }));
       
       // CONTACT component
       components.push(await this.prisma.cardComponent.create({
         data: {
           cardId,
           type: 'CONTACT',
           order: 1,
           enabled: true,
           config: {
             variant: 'basic-business',
             layout: 'tiles',
             showEmail: !!cardData.email,
             showPhone: !!cardData.phone,
             showWebsite: !!cardData.website,
             showAddress: !!cardData.socialLinks?.address,
           },
         },
       }));
       
       // SOCIAL_LINKS component
       const platforms = [];
       if (cardData.socialLinks?.linkedinUrl) {
         platforms.push({ platform: 'linkedin', url: cardData.socialLinks.linkedinUrl });
       }
       if (cardData.socialLinks?.twitterUrl) {
         platforms.push({ platform: 'twitter', url: cardData.socialLinks.twitterUrl });
       }
       if (cardData.socialLinks?.githubUrl) {
         platforms.push({ platform: 'github', url: cardData.socialLinks.githubUrl });
       }
       
       if (platforms.length > 0) {
         components.push(await this.prisma.cardComponent.create({
           data: {
             cardId,
             type: 'SOCIAL_LINKS',
             order: 2,
             enabled: true,
             config: {
               variant: 'basic-business',
               title: 'Connect with me',
               layout: 'circles',
               platforms,
               iconSize: 'md',
             },
           },
         }));
       }
       
       return components;
     }
   }
   ```

2. **Update TemplatesService**
   ```typescript
   // apps/api/src/templates/templates.service.ts
   
   async applyTemplateToCard(
     cardId: string,
     templateId: string,
     userId: string,
     preserveContent = true,
   ) {
     // ... existing validation code ...
     
     const updatedCard = await this.prisma.card.update({
       where: { id: cardId },
       data: updateData,
       include: { template: true },
     });
     
     // ✅ NEW: Auto-create components for template sections
     const existingComponents = await this.prisma.cardComponent.count({
       where: { cardId },
     });
     
     if (existingComponents === 0) {
       const card = await this.prisma.card.findUnique({
         where: { id: cardId },
       });
       
       await this.templateComponentFactory.createComponentsForTemplate(
         template.slug,
         cardId,
         card,
       );
     }
     
     // ... rest of existing code ...
   }
   ```

3. **Idempotency & Deduplication**
   - [ ] Check existing components before creating
   - [ ] Handle partial failures (transaction rollback)
   - [ ] Prevent duplicate components on re-application

4. **Add Configuration Endpoint**
   ```typescript
   // apps/api/src/templates/templates.controller.ts
   
   @Get(':templateId/component-blueprint')
   async getComponentBlueprint(
     @Param('templateId') templateId: string,
   ) {
     const template = await this.templatesService.findOne(templateId);
     return this.templateComponentFactory.getBlueprint(template.slug);
   }
   ```

#### Testing
- [ ] Integration tests for component auto-creation
- [ ] Test idempotency (applying template twice)
- [ ] Test with missing card data (optional fields)
- [ ] Test transaction rollback on failures

#### Success Criteria
- Applying template creates exactly 3 components for basic-business
- Components have correct config (variant, enabled fields)
- No duplicate components created
- All tests pass

#### Deliverables
- TemplateComponentFactory service
- Updated applyTemplateToCard method
- Integration test suite

---

### Phase 3: Frontend Integration (Week 4)

**Objective:** Update CardRenderView to use components instead of hardcoded HTML

#### Tasks

1. **Dual Rendering Path**
   ```typescript
   // apps/web/src/components/nexus/CardRenderView.tsx
   
   export function CardRenderView({ card, nfcUid }: CardRenderViewProps) {
     const { identityHeader, styling, components } = card;
     const isBasic = styling.customCss?.includes('card-basic-container');
     const templateTheme = getTemplateTheme(styling.customCss);
     
     if (isBasic) {
       // Check if components exist (new path)
       const hasTemplateComponents = components?.some(c => 
         ['PROFILE', 'CONTACT', 'SOCIAL_LINKS'].includes(c.type)
       );
       
       if (hasTemplateComponents) {
         // ✅ NEW: Component-based rendering
         return (
           <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
             {styling.customCss && (
               <style dangerouslySetInnerHTML={{ __html: styling.customCss }} />
             )}
             
             <div className="card-basic-container">
               {components
                 .filter(c => c.enabled)
                 .sort((a, b) => a.order - b.order)
                 .map(component => (
                   <CardComponentRenderer
                     key={component.id}
                     component={component}
                     cardData={card}
                     isEditing={false}
                     templateTheme={templateTheme}
                   />
                 ))}
               
               {/* Save Contact button stays as template element */}
               <div className="card-basic-actions">
                 <button className="card-basic-button" onClick={downloadVCard}>
                   Save Contact
                 </button>
               </div>
             </div>
           </div>
         );
       } else {
         // ❌ OLD: Hardcoded fallback (for unmigrated cards)
         return (
           <div className="card-basic-container">
             <div className="card-basic-header">...</div>
             <div className="card-basic-contact">...</div>
             <div className="card-basic-social">...</div>
             {/* Existing hardcoded code */}
           </div>
         );
       }
     }
     
     // ... other templates ...
   }
   ```

2. **Update PhoneMockup Preview**
   - [ ] Apply same dual-path logic in `CardPreview` component
   - [ ] Ensure customize page preview uses component rendering
   - [ ] Handle both old and new data structures

3. **Component Visibility in UI**
   - [ ] Update Components tab to show template components
   - [ ] Add visual indicator for template-provided components
   - [ ] Prevent deletion of required template components (optional)

4. **Edit Experience**
   ```typescript
   // apps/web/src/components/nexus/ComponentEditDialog.tsx
   
   // Show variant selector for supported components
   {templateTheme && templateTheme.supportedComponents.includes(component.type) && (
     <Select value={config.variant} onValueChange={(v) => setConfig({ ...config, variant: v })}>
       <SelectItem value="default">Default</SelectItem>
       <SelectItem value={templateTheme.slug}>{templateTheme.name}</SelectItem>
     </Select>
   )}
   ```

#### Testing
- [ ] Visual regression tests (component vs hardcoded)
- [ ] E2E tests for customize page workflow
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing

#### Success Criteria
- New cards with templates use component rendering
- Old cards with templates still render correctly (fallback)
- No visual differences between paths
- Component editing works in customize page

#### Deliverables
- Updated CardRenderView with dual path
- Updated PhoneMockup/CardPreview
- E2E test suite

---

### Phase 4: Migration & Rollout (Week 5)

**Objective:** Migrate existing cards and roll out to production

#### Tasks

1. **Data Migration Script**
   ```typescript
   // apps/api/src/templates/scripts/migrate-template-cards.ts
   
   export class TemplateMigration {
     async migrateBasicBusinessCards(dryRun = true) {
       const cards = await this.prisma.card.findMany({
         where: {
           template: { slug: 'basic-business' },
           components: { none: {} },  // No existing components
         },
         include: { template: true },
       });
       
       console.log(`Found ${cards.length} cards to migrate`);
       
       if (dryRun) {
         console.log('DRY RUN - no changes will be made');
         return { total: cards.length, migrated: 0 };
       }
       
       let migrated = 0;
       for (const card of cards) {
         try {
           await this.templateComponentFactory.createComponentsForTemplate(
             'basic-business',
             card.id,
             card,
           );
           migrated++;
         } catch (error) {
           console.error(`Failed to migrate card ${card.id}:`, error);
         }
       }
       
       return { total: cards.length, migrated };
     }
   }
   ```

2. **Admin Endpoint**
   ```typescript
   // apps/api/src/admin/admin.controller.ts
   
   @Post('migrate-template-components')
   @Roles(UserRole.ADMIN)
   async migrateTemplateComponents(
     @Body() dto: { templateSlug: string; dryRun?: boolean },
   ) {
     return this.templatesService.migrateTemplateCards(
       dto.templateSlug,
       dto.dryRun !== false,
     );
   }
   ```

3. **Phased Rollout Plan**
   - [ ] Week 5 Day 1-2: Dry run on staging
   - [ ] Week 5 Day 3: Migrate 10% of cards in production
   - [ ] Week 5 Day 4: Monitor metrics, migrate another 40%
   - [ ] Week 5 Day 5: Migrate remaining 50%

4. **Monitoring & Metrics**
   - [ ] Track migration success rate
   - [ ] Monitor error logs for rendering issues
   - [ ] Track user engagement with component editing
   - [ ] A/B test: old vs new rendering performance

5. **Rollback Procedure**
   ```sql
   -- Emergency rollback: delete auto-created components
   DELETE FROM card_components 
   WHERE card_id IN (
     SELECT id FROM cards WHERE template_id = 'basic-business-template-id'
   )
   AND type IN ('PROFILE', 'CONTACT', 'SOCIAL_LINKS')
   AND created_at > '2025-12-14';  -- Migration start date
   ```

#### Testing
- [ ] Migrate staging environment completely
- [ ] Run full regression test suite
- [ ] Load testing (rendering performance)
- [ ] User acceptance testing

#### Success Criteria
- >95% successful migration rate
- Zero visual differences reported
- No increase in error rates
- Positive user feedback on component editing

#### Deliverables
- Migration script
- Admin endpoint for manual triggers
- Monitoring dashboard
- Rollback procedure documentation

---

### Phase 5: Deprecation & Cleanup (Week 6)

**Objective:** Remove hardcoded template code and complete transition

#### Tasks

1. **Remove Hardcoded Fallback**
   - [ ] Remove old rendering paths from CardRenderView
   - [ ] Remove old rendering paths from PhoneMockup
   - [ ] Clean up unused CSS classes

2. **Update Documentation**
   - [ ] Update template creation guide
   - [ ] Update component development guide
   - [ ] Create user guide for template components

3. **Template Gallery Enhancement**
   ```typescript
   // Show component breakdown in template preview
   {
     name: 'Basic Business Card',
     components: [
       { type: 'PROFILE', icon: User, description: 'Gradient header with avatar' },
       { type: 'CONTACT', icon: Phone, description: 'Colored contact tiles' },
       { type: 'SOCIAL_LINKS', icon: Share2, description: 'Circular social buttons' },
     ],
   }
   ```

4. **Feature Announcement**
   - [ ] In-app notification about component editing
   - [ ] Blog post about new feature
   - [ ] Tutorial video

5. **Code Cleanup**
   - [ ] Remove deprecated functions
   - [ ] Archive old template rendering code
   - [ ] Update TypeScript types

#### Success Criteria
- All cards using component-based rendering
- No legacy code paths remaining
- Documentation complete
- User adoption >50% within 2 weeks

#### Deliverables
- Clean codebase
- Complete documentation
- User announcement materials

---

## Testing Strategy

### Unit Tests
```typescript
// apps/web/src/components/card-components/__tests__/ProfileComponent.test.tsx

describe('ProfileComponent - basic-business variant', () => {
  it('renders with template CSS classes', () => {
    const component = {
      type: 'PROFILE',
      config: { variant: 'basic-business', showAvatar: true },
    };
    
    const { container } = render(
      <ProfileComponent component={component} cardData={mockData} />
    );
    
    expect(container.querySelector('.card-basic-header')).toBeInTheDocument();
    expect(container.querySelector('.card-basic-avatar')).toBeInTheDocument();
  });
  
  it('matches hardcoded version exactly', () => {
    const component = renderComponent();
    const hardcoded = renderHardcoded();
    
    expect(component).toMatchSnapshot();
    expect(hardcoded).toMatchSnapshot();
    // Snapshots should be identical
  });
});
```

### Integration Tests
```typescript
// apps/api/test/templates.e2e-spec.ts

describe('Template Application (e2e)', () => {
  it('creates components when applying basic-business template', async () => {
    const card = await createTestCard();
    await applyTemplate(card.id, 'basic-business');
    
    const components = await getCardComponents(card.id);
    
    expect(components).toHaveLength(3);
    expect(components.map(c => c.type)).toEqual(['PROFILE', 'CONTACT', 'SOCIAL_LINKS']);
    expect(components.every(c => c.config.variant === 'basic-business')).toBe(true);
  });
  
  it('does not create duplicates on reapplication', async () => {
    await applyTemplate(card.id, 'basic-business');
    await applyTemplate(card.id, 'basic-business');
    
    const components = await getCardComponents(card.id);
    expect(components).toHaveLength(3);  // Still only 3
  });
});
```

### Visual Regression Tests
```typescript
// apps/web/e2e/visual-regression.spec.ts

describe('Template Visual Regression', () => {
  it('component rendering matches hardcoded rendering', async ({ page }) => {
    // Test old card (hardcoded)
    await page.goto('/p/old-card');
    const oldScreenshot = await page.screenshot();
    
    // Test new card (components)
    await page.goto('/p/new-card');
    const newScreenshot = await page.screenshot();
    
    // Compare screenshots
    expect(newScreenshot).toMatchImageSnapshot(oldScreenshot, {
      threshold: 0.01,  // 99% similarity required
    });
  });
});
```

---

## Risk Management

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Visual differences between old/new rendering | High | Medium | Extensive visual regression testing, pixel-perfect CSS matching |
| Migration script failures | High | Low | Dry runs, transaction rollbacks, batch processing with error handling |
| Performance degradation | Medium | Low | Load testing, component rendering optimization, caching |
| User confusion with new editing | Medium | Medium | In-app tutorials, gradual rollout, clear UI indicators |
| Backward compatibility issues | High | Low | Dual rendering paths, fallback logic, comprehensive testing |

### Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Database migration failures | High | Low | Staging environment testing, rollback procedures, backup before migration |
| Production incidents during rollout | High | Medium | Phased rollout (10% → 50% → 100%), feature flags, quick rollback capability |
| Support ticket increase | Medium | High | FAQ documentation, video tutorials, support team training |
| User data loss | Critical | Very Low | Transaction-based operations, no destructive changes, full backups |

---

## Success Metrics

### Technical Metrics
- **Migration Success Rate**: Target >95%
- **Rendering Performance**: No >10% increase in load time
- **Error Rate**: <1% increase in error logs
- **Test Coverage**: >90% for all new code

### User Metrics
- **Component Edit Rate**: >30% of users edit template components within 1 month
- **User Satisfaction**: >4.0/5.0 rating for new editing experience
- **Support Tickets**: <5% increase in support volume
- **Feature Adoption**: >50% of new cards use component editing within 2 weeks

### Business Metrics
- **Upgrade Conversion**: +15% PRO/PREMIUM upgrades due to advanced component features
- **User Retention**: +10% 30-day retention for users who edit components
- **Template Usage**: +25% template application rate due to flexibility

---

## Rollback Plan

### Immediate Rollback (< 1 hour)
1. Revert CardRenderView to use hardcoded rendering only
2. Deploy frontend hotfix
3. No database changes needed (components stay but aren't rendered)

### Partial Rollback (< 4 hours)
1. Stop migration script
2. Delete components created after migration start date
3. Revert dual-path rendering logic
4. Deploy both frontend and backend

### Full Rollback (< 24 hours)
1. Complete database rollback to pre-migration state
2. Restore from backup if needed
3. Revert all code changes
4. Post-mortem analysis

---

## Dependencies

### External Dependencies
- No new third-party libraries required
- Existing: React, Prisma, NestJS

### Internal Dependencies
- **Must Complete Before Phase 2**: Phase 1 (component variants)
- **Must Complete Before Phase 3**: Phase 2 (auto-creation)
- **Must Complete Before Phase 4**: Phase 3 (frontend integration)
- **Must Complete Before Phase 5**: Phase 4 (migration)

### Team Dependencies
- **Backend**: 2 developers for Phases 1-2, 1 developer for support
- **Frontend**: 2 developers for Phases 1, 3, 1 developer for support
- **QA**: 1 QA engineer for all phases
- **DevOps**: 1 engineer for Phase 4 migration orchestration

---

## Timeline Summary

| Phase | Duration | Start | End | Key Milestone |
|-------|----------|-------|-----|---------------|
| Phase 0: Preparation | 1 week | Week 1 | Week 1 | Infrastructure ready |
| Phase 1: Components | 1 week | Week 2 | Week 2 | Variants implemented |
| Phase 2: Backend | 1 week | Week 3 | Week 3 | Auto-creation working |
| Phase 3: Frontend | 1 week | Week 4 | Week 4 | Dual path rendering |
| Phase 4: Migration | 1 week | Week 5 | Week 5 | All cards migrated |
| Phase 5: Cleanup | 1 week | Week 6 | Week 6 | Legacy code removed |

**Total Duration**: 6 weeks (1.5 months)

---

## Next Steps

1. **Week 1 (Now)**: 
   - Get stakeholder approval on this plan
   - Set up project tracking (Jira/Linear)
   - Create feature branch: `feature/template-to-components`
   - Begin Phase 0 code audit

2. **Week 2**:
   - Complete Phase 0
   - Begin Phase 1 component variant implementation
   - Daily standups to track progress

3. **Ongoing**:
   - Weekly demo to stakeholders
   - Update this document with learnings
   - Adjust timeline as needed

---

## Appendix

### A. Database Schema Changes
No schema changes required. Existing `card_components` table supports all needed fields.

### B. API Contract Changes
New endpoints:
- `GET /templates/:id/component-blueprint` - Get component structure for template
- `POST /admin/migrate-template-components` - Trigger migration (admin only)

Modified endpoints:
- `POST /cards/:id/apply-template` - Now creates components

### C. Component Config Schemas

**PROFILE (basic-business)**
```json
{
  "variant": "basic-business",
  "showAvatar": true,
  "showTitle": true,
  "showCompany": true,
  "avatarShape": "circle",
  "avatarSize": "lg"
}
```

**CONTACT (basic-business)**
```json
{
  "variant": "basic-business",
  "layout": "tiles",
  "showEmail": true,
  "showPhone": true,
  "showWebsite": true,
  "showAddress": true
}
```

**SOCIAL_LINKS (basic-business)**
```json
{
  "variant": "basic-business",
  "title": "Connect with me",
  "layout": "circles",
  "platforms": [
    { "platform": "linkedin", "url": "https://linkedin.com/in/..." },
    { "platform": "twitter", "url": "https://twitter.com/..." },
    { "platform": "github", "url": "https://github.com/..." }
  ],
  "iconSize": "md"
}
```

### D. CSS Class Mapping

| Component Type | Variant | Root Class | Child Classes |
|----------------|---------|------------|---------------|
| PROFILE | basic-business | `.card-basic-header` | `.card-basic-avatar`, `.card-basic-name`, `.card-basic-title`, `.card-basic-company` |
| CONTACT | basic-business | `.card-basic-contact` | `.card-basic-contact-item`, `.card-basic-contact-icon`, `.card-basic-contact-text` |
| SOCIAL_LINKS | basic-business | `.card-basic-social` | `.card-basic-social-links`, `.card-basic-social-link` |

---

**Document Owner**: Development Team  
**Approved By**: [To be filled]  
**Last Updated**: December 14, 2025
