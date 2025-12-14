import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComponentType, SubscriptionTier } from '@prisma/client';
import { CreateCardComponentDto } from './dto/create-card-component.dto';
import { UpdateCardComponentDto } from './dto/update-card-component.dto';
import { ReorderComponentsDto } from './dto/reorder-components.dto';
import { RevalidationService } from '../shared/services/revalidation.service';
import { AnalyticsService } from '../analytics/analytics.service';

// Fallback constants in case database is unavailable
const FALLBACK_COMPONENT_COUNT_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 3,
  [SubscriptionTier.PRO]: 8,
  [SubscriptionTier.PREMIUM]: 999,
};

interface TierRuleCache {
  [tier: string]: {
    [componentType: string]: boolean;
  };
}

@Injectable()
export class CardComponentsService implements OnModuleInit {
  private tierRulesCache: TierRuleCache = {};
  private componentCountLimits: Record<SubscriptionTier, number> = FALLBACK_COMPONENT_COUNT_LIMITS;

  constructor(
    private prisma: PrismaService,
    private revalidationService: RevalidationService,
    private analyticsService: AnalyticsService
  ) {}

  /**
   * Load tier rules from database on module initialization
   */
  async onModuleInit() {
    await this.loadTierRules();
  }

  /**
   * Load and cache tier component rules from database
   */
  private async loadTierRules() {
    try {
      const rules = await this.prisma.tierComponentRule.findMany();
      
      // Build cache structure
      this.tierRulesCache = {};
      for (const rule of rules) {
        if (!this.tierRulesCache[rule.tier]) {
          this.tierRulesCache[rule.tier] = {};
        }
        this.tierRulesCache[rule.tier][rule.componentType] = true;
      }

      console.log(`✓ Loaded ${rules.length} tier component rules from database`);
    } catch (error) {
      console.error('Failed to load tier component rules from database:', error);
      console.log('Using fallback hardcoded tier restrictions');
      // Fallback to hardcoded rules
      this.buildFallbackCache();
    }
  }

  /**
   * Build fallback cache from hardcoded rules
   */
  private buildFallbackCache() {
    const fallbackRules: Record<ComponentType, SubscriptionTier[]> = {
      PROFILE: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      ABOUT: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      CONTACT: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      SOCIAL_LINKS: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      CUSTOM_LINKS: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      GALLERY: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      VIDEO: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      CALENDAR: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      TESTIMONIALS: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      SERVICES: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      FORM: [SubscriptionTier.PREMIUM],
    };

    for (const [componentType, tiers] of Object.entries(fallbackRules)) {
      for (const tier of tiers) {
        if (!this.tierRulesCache[tier]) {
          this.tierRulesCache[tier] = {};
        }
        this.tierRulesCache[tier][componentType] = true;
      }
    }
  }

  /**
   * Check if a user can use a specific component type based on their subscription tier
   */
  private canUseComponent(componentType: ComponentType, tier: SubscriptionTier): boolean {
    return this.tierRulesCache[tier]?.[componentType] ?? false;
  }

  /**
   * Get component count limit for a subscription tier
   */
  private getComponentLimit(tier: SubscriptionTier): number {
    return this.componentCountLimits[tier] ?? 0;
  }

  /**
   * Lock premium components when user downgrades tier
   */
  async lockComponentsAfterDowngrade(userId: string, newTier: SubscriptionTier): Promise<number> {
    const userCards = await this.prisma.card.findMany({
      where: { userId },
      include: { components: true },
    });

    let lockedCount = 0;

    for (const card of userCards) {
      for (const component of card.components) {
        const canUse = this.canUseComponent(component.type, newTier);
        
        if (!canUse && !component.locked) {
          await this.prisma.cardComponent.update({
            where: { id: component.id },
            data: { locked: true },
          });
          lockedCount++;
        }
      }
    }

    return lockedCount;
  }

  /**
   * Validate if user can add more components
   */
  private async validateComponentLimit(cardId: string, userId: string): Promise<void> {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        user: {
          include: { subscription: true },
        },
        components: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    const tier = card.user.subscription?.tier ?? SubscriptionTier.FREE;
    const currentCount = card.components.length;
    const limit = this.getComponentLimit(tier);

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `Component limit reached. ${tier} tier allows maximum ${limit} components. Please upgrade to add more.`
      );
    }
  }

  /**
   * Get all components for a card
   */
  async findAll(cardId: string) {
    return this.prisma.cardComponent.findMany({
      where: { cardId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get a single component by ID
   */
  async findOne(cardId: string, componentId: string) {
    const component = await this.prisma.cardComponent.findFirst({
      where: {
        id: componentId,
        cardId,
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    return component;
  }

  /**
   * Create a new component
   */
  async create(cardId: string, userId: string, dto: CreateCardComponentDto) {
    // Validate component limit
    await this.validateComponentLimit(cardId, userId);

    // Get user's subscription tier
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        user: {
          include: { subscription: true },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    const tier = card.user.subscription?.tier ?? SubscriptionTier.FREE;

    // Check if user can use this component type
    if (!this.canUseComponent(dto.type, tier)) {
      throw new ForbiddenException(
        `Component type ${dto.type} is not available in ${tier} tier. Please upgrade to access this component.`
      );
    }

    // If order not specified, add to end
    if (dto.order === undefined) {
      const lastComponent = await this.prisma.cardComponent.findFirst({
        where: { cardId },
        orderBy: { order: 'desc' },
      });
      dto.order = lastComponent ? lastComponent.order + 1 : 0;
    }

    const component = await this.prisma.cardComponent.create({
      data: {
        cardId,
        type: dto.type,
        order: dto.order,
        enabled: dto.enabled ?? true,
        config: dto.config ?? {},
        backgroundType: dto.backgroundType,
        backgroundColor: dto.backgroundColor,
        backgroundGradientStart: dto.backgroundGradientStart,
        backgroundGradientEnd: dto.backgroundGradientEnd,
        backgroundImageUrl: dto.backgroundImageUrl,
      },
    });

    // Get final component count for analytics
    const finalComponentCount = await this.prisma.cardComponent.count({
      where: { cardId },
    });

    // Log analytics event (non-blocking)
    this.analyticsService.logComponentAdded({
      userId,
      cardId,
      componentId: component.id,
      componentType: component.type,
      tier: tier.toString(),
      componentCount: finalComponentCount,
      source: 'palette',
    }).catch((err) => {
      console.error('Failed to log component_added analytics:', err);
    });

    // Trigger ISR revalidation
    await this.revalidationService.revalidateCard(card.slug);

    return component;
  }

  /**
   * Update a component
   */
  async update(cardId: string, componentId: string, userId: string, dto: UpdateCardComponentDto) {
    // Verify ownership
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    // Verify component exists
    const component = await this.prisma.cardComponent.findFirst({
      where: {
        id: componentId,
        cardId,
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    // Check if component is locked (premium component at downgraded tier)
    if (component.locked) {
      // Only allow enabling/disabling locked components, not config changes
      if (dto.config && Object.keys(dto.config).length > 0) {
        throw new ForbiddenException({
          code: 'EDIT_LOCKED',
          message: 'This component is locked because it requires a higher subscription tier. Please upgrade to edit this component.',
        });
      }
    }

    const updatedComponent = await this.prisma.cardComponent.update({
      where: { id: componentId },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(dto.config && { config: dto.config }),
        ...(dto.backgroundType && { backgroundType: dto.backgroundType }),
        ...(dto.backgroundColor && { backgroundColor: dto.backgroundColor }),
        ...(dto.backgroundGradientStart && { backgroundGradientStart: dto.backgroundGradientStart }),
        ...(dto.backgroundGradientEnd && { backgroundGradientEnd: dto.backgroundGradientEnd }),
        ...(dto.backgroundImageUrl && { backgroundImageUrl: dto.backgroundImageUrl }),
        updatedAt: new Date(),
      },
    });

    // Get user tier for analytics
    const userWithTier = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    const tier = userWithTier?.subscription?.tier ?? SubscriptionTier.FREE;

    // Log analytics event (non-blocking)
    this.analyticsService.logComponentUpdated({
      userId,
      cardId,
      componentId,
      componentType: updatedComponent.type,
      tier: tier.toString(),
      configChanged: !!dto.config,
      stylingChanged: !!(dto.backgroundType || dto.backgroundColor || dto.backgroundGradientStart || dto.backgroundImageUrl),
      enabledChanged: dto.enabled !== undefined,
    }).catch((err) => {
      console.error('Failed to log component_updated analytics:', err);
    });

    // Trigger ISR revalidation
    await this.revalidationService.revalidateCard(card.slug);

    return updatedComponent;
  }

  /**
   * Bulk reorder components
   */
  async reorder(cardId: string, userId: string, dto: ReorderComponentsDto) {
    // Verify ownership
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { components: true },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    // Verify all component IDs belong to this card
    const componentIds = dto.components.map((c) => c.id);
    const existingIds = card.components.map((c) => c.id);
    const invalidIds = componentIds.filter((id) => !existingIds.includes(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid component IDs: ${invalidIds.join(', ')}`);
    }

    // Update all component orders in a transaction
    // Use a two-phase approach to avoid unique constraint violations:
    // 1. Set all orders to negative values temporarily
    // 2. Set them to their final positive values
    await this.prisma.$transaction(async (tx) => {
      // Phase 1: Set temporary negative orders
      for (const { id, order } of dto.components) {
        await tx.cardComponent.update({
          where: { id },
          data: { order: -1000 - order },
        });
      }

      // Phase 2: Set final positive orders
      for (const { id, order } of dto.components) {
        await tx.cardComponent.update({
          where: { id },
          data: { order },
        });
      }
    });

    // Get user tier for analytics
    const userWithTier = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    const tier = userWithTier?.subscription?.tier ?? SubscriptionTier.FREE;

    // Log analytics event (non-blocking)
    this.analyticsService.logComponentReordered({
      userId,
      cardId,
      tier: tier.toString(),
      componentCount: dto.components.length,
      reorderCount: dto.components.length,
    }).catch((err) => {
      console.error('Failed to log component_reordered analytics:', err);
    });

    // Trigger ISR revalidation after reordering
    await this.revalidationService.revalidateCard(card.slug);

    return this.findAll(cardId);
  }

  /**
   * Delete a component
   */
  async remove(cardId: string, componentId: string, userId: string) {
    // Verify ownership
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    // Verify component exists
    const component = await this.prisma.cardComponent.findFirst({
      where: {
        id: componentId,
        cardId,
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    await this.prisma.cardComponent.delete({
      where: { id: componentId },
    });

    // Get component count after deletion
    const componentCountAfterDelete = await this.prisma.cardComponent.count({
      where: { cardId },
    });

    // Get user tier for analytics
    const userWithTier = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    const tier = userWithTier?.subscription?.tier ?? SubscriptionTier.FREE;

    // Log analytics event (non-blocking)
    this.analyticsService.logComponentRemoved({
      userId,
      cardId,
      componentId,
      componentType: component.type,
      tier: tier.toString(),
      componentCount: componentCountAfterDelete,
    }).catch((err) => {
      console.error('Failed to log component_removed analytics:', err);
    });

    // Trigger ISR revalidation after deletion
    await this.revalidationService.revalidateCard(card.slug);

    return { success: true };
  }
}
