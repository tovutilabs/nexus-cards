import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComponentType, SubscriptionTier } from '@prisma/client';
import { CreateCardComponentDto } from './dto/create-card-component.dto';
import { UpdateCardComponentDto } from './dto/update-card-component.dto';
import { ReorderComponentsDto } from './dto/reorder-components.dto';

// Component tier restrictions
const COMPONENT_TIER_RESTRICTIONS: Record<ComponentType, SubscriptionTier[]> = {
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

// Maximum number of components per tier
const COMPONENT_COUNT_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 3,
  [SubscriptionTier.PRO]: 8,
  [SubscriptionTier.PREMIUM]: 999, // Effectively unlimited
};

@Injectable()
export class CardComponentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user can use a specific component type based on their subscription tier
   */
  private canUseComponent(componentType: ComponentType, tier: SubscriptionTier): boolean {
    const allowedTiers = COMPONENT_TIER_RESTRICTIONS[componentType];
    return allowedTiers?.includes(tier) ?? false;
  }

  /**
   * Get component count limit for a subscription tier
   */
  private getComponentLimit(tier: SubscriptionTier): number {
    return COMPONENT_COUNT_LIMITS[tier] ?? 0;
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

    return this.prisma.cardComponent.create({
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

    return this.prisma.cardComponent.update({
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

    return { success: true };
  }
}
