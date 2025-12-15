import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { SubscriptionTier } from '@prisma/client';
import { validateAndSanitizeCss } from './utils/css-sanitizer';
import { AnalyticsService } from '../analytics/analytics.service';
import { TemplateComponentFactory } from './services/template-component-factory.service';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly templateComponentFactory: TemplateComponentFactory,
  ) {}

  async findAll(userTier?: SubscriptionTier, category?: string, includeArchived = false) {
    const where: any = {
      isActive: true,
    };

    if (!includeArchived) {
      where.isArchived = false;
    }

    if (category) {
      where.category = category;
    }

    // Filter templates by user's subscription tier
    if (userTier) {
      where.OR = [
        { minTier: SubscriptionTier.FREE },
        ...(userTier === SubscriptionTier.PRO || userTier === SubscriptionTier.PREMIUM
          ? [{ minTier: SubscriptionTier.PRO }]
          : []),
        ...(userTier === SubscriptionTier.PREMIUM
          ? [{ minTier: SubscriptionTier.PREMIUM }]
          : []),
      ];
    } else {
      // No user tier provided, show only FREE templates
      where.minTier = SubscriptionTier.FREE;
    }

    return this.prisma.cardTemplate.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.cardTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async findBySlug(slug: string) {
    const template = await this.prisma.cardTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw new NotFoundException(`Template with slug ${slug} not found`);
    }

    return template;
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.cardTemplate.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id); // Verify template exists

    return this.prisma.cardTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const template = await this.findOne(id); // Verify template exists

    // Prevent hard delete if template is in use
    if (template.usageCount > 0) {
      throw new BadRequestException({
        code: 'TEMPLATE_IN_USE',
        message: `Cannot delete template with ${template.usageCount} active usage(s). Archive it instead.`,
      });
    }

    return this.prisma.cardTemplate.delete({
      where: { id },
    });
  }

  async archive(id: string, reason?: string) {
    const template = await this.findOne(id);

    return this.prisma.cardTemplate.update({
      where: { id },
      data: {
        isArchived: true,
        isActive: false,
      },
    });
  }

  async unarchive(id: string) {
    const template = await this.findOne(id);

    return this.prisma.cardTemplate.update({
      where: { id },
      data: {
        isArchived: false,
        isActive: true,
      },
    });
  }

  async applyTemplateToCard(cardId: string, templateId: string, userId: string, preserveContent = true) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { user: { include: { subscription: true } } },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD_NOT_FOUND',
        message: `Card with ID ${cardId} not found`,
      });
    }

    if (card.userId !== userId) {
      throw new ForbiddenException({
        code: 'CARD_ACCESS_DENIED',
        message: 'You do not have permission to edit this card',
      });
    }

    const template = await this.findOne(templateId);

    // Check if template is archived
    if (template.isArchived) {
      throw new BadRequestException({
        code: 'TEMPLATE_ARCHIVED',
        message: 'This template has been archived and cannot be applied',
      });
    }

    // Check tier access
    const userTier = card.user.subscription?.tier || SubscriptionTier.FREE;
    if (!this.canAccessTemplate(userTier, template.minTier)) {
      throw new ForbiddenException({
        code: 'TEMPLATE_TIER_INSUFFICIENT',
        message: `This template requires ${template.minTier} tier or higher`,
      });
    }

    const config = template.config as any;

    const updateData: any = {
      templateId,
    };

    // Apply template styling
    if (config.colorScheme) {
      updateData.theme = config.colorScheme;
    }

    if (config.typography?.fontFamily) {
      updateData.fontFamily = config.typography.fontFamily;
    }

    if (config.layout) {
      updateData.layout = config.layout;
    }

    if (config.borderRadius) {
      updateData.borderRadius = config.borderRadius;
    }

    if (config.shadow) {
      updateData.shadowPreset = config.shadow;
    }

    if (config.colorScheme?.background) {
      updateData.backgroundType = 'solid';
      updateData.backgroundColor = config.colorScheme.background;
    }

    // Apply custom CSS from template if available
    if (config.customCss) {
      updateData.customCss = config.customCss;
    }

    // If not preserving content, we could reset other fields here
    // For now, we preserve user content and only apply template styling

    // Increment usage count
    await this.prisma.cardTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        template: true,
      },
    });

    // Auto-create template components if card has no existing components
    const existingComponentsCount = await this.prisma.cardComponent.count({
      where: { cardId },
    });

    if (existingComponentsCount === 0) {
      try {
        await this.templateComponentFactory.createComponentsForTemplate(
          template.slug,
          cardId,
          card,
        );
        console.log(`Auto-created components for template ${template.slug} on card ${cardId}`);
      } catch (error) {
        console.error(`Failed to auto-create components for card ${cardId}:`, error);
        // Don't fail the entire template application if component creation fails
      }
    }

    // Log analytics event (non-blocking)
    this.analyticsService.logTemplateApplied({
      userId,
      cardId,
      templateId,
      templateSlug: template.slug,
      templateCategory: template.category,
      templateTier: template.minTier.toString(),
      userTier: userTier.toString(),
      previousTemplateId: card.templateId || undefined,
    }).catch((err) => {
      console.error('Failed to log card_template_applied analytics:', err);
    });

    return updatedCard;
  }

  async getComponentBlueprint(templateId: string) {
    const template = await this.findOne(templateId);
    const blueprint = this.templateComponentFactory.getBlueprint(template.slug);
    
    if (!blueprint) {
      throw new NotFoundException({
        code: 'BLUEPRINT_NOT_FOUND',
        message: `No component blueprint found for template: ${template.name}`,
      });
    }

    return {
      templateId: template.id,
      templateSlug: template.slug,
      templateName: template.name,
      ...blueprint,
    };
  }

  async migrateTemplateCards(templateSlug: string, dryRun = true) {
    // Find template by slug
    const template = await this.prisma.cardTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template) {
      throw new NotFoundException({
        code: 'TEMPLATE_NOT_FOUND',
        message: `Template with slug ${templateSlug} not found`,
      });
    }

    // Find all cards using this template that have no components
    const cards = await this.prisma.card.findMany({
      where: {
        templateId: template.id,
      },
      include: {
        components: {
          select: { id: true },
        },
      },
    });

    // Filter to only cards with zero components
    const cardsWithoutComponents = cards.filter(card => card.components.length === 0);

    console.log(`Found ${cards.length} cards with ${templateSlug} template`);
    console.log(`${cardsWithoutComponents.length} cards have no components and need migration`);

    if (dryRun) {
      console.log('DRY RUN - no changes will be made');
      return {
        total: cards.length,
        needsMigration: cardsWithoutComponents.length,
        migrated: 0,
        dryRun: true,
      };
    }

    let migrated = 0;
    const errors: Array<{ cardId: string; error: string }> = [];

    for (const card of cardsWithoutComponents) {
      try {
        await this.templateComponentFactory.createComponentsForTemplate(
          templateSlug,
          card.id,
          card,
        );
        migrated++;
        console.log(`Migrated card ${card.id} (${migrated}/${cardsWithoutComponents.length})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to migrate card ${card.id}:`, errorMessage);
        errors.push({ cardId: card.id, error: errorMessage });
      }
    }

    return {
      total: cards.length,
      needsMigration: cardsWithoutComponents.length,
      migrated,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      dryRun: false,
    };
  }

  canAccessTemplate(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    const tierHierarchy = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PRO]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }

  async updateCardCustomCss(cardId: string, userId: string, customCss: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { user: { include: { subscription: true } } },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD_NOT_FOUND',
        message: `Card with ID ${cardId} not found`,
      });
    }

    if (card.userId !== userId) {
      throw new ForbiddenException({
        code: 'CARD_ACCESS_DENIED',
        message: 'You do not have permission to edit this card',
      });
    }

    // Check if user has PREMIUM tier for custom CSS
    const userTier = card.user.subscription?.tier || SubscriptionTier.FREE;
    if (userTier !== SubscriptionTier.PREMIUM) {
      throw new ForbiddenException({
        code: 'CUSTOM_CSS_TIER_INSUFFICIENT',
        message: 'Custom CSS is only available for PREMIUM tier users',
      });
    }

    // Sanitize and validate CSS
    const sanitizedCss = validateAndSanitizeCss(customCss);

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        customCss: sanitizedCss,
      },
    });

    // Log analytics event (non-blocking)
    this.analyticsService.logCustomCssUpdated({
      userId,
      cardId,
      tier: userTier.toString(),
      cssLength: sanitizedCss.length,
      hasCustomCss: sanitizedCss.length > 0,
    }).catch((err) => {
      console.error('Failed to log card_custom_css_updated analytics:', err);
    });

    return updatedCard;
  }

  async getFeaturedTemplates(userTier?: SubscriptionTier) {
    const where: any = {
      isActive: true,
      isFeatured: true,
    };

    // Filter by tier access
    if (userTier) {
      where.OR = [
        { minTier: SubscriptionTier.FREE },
        ...(userTier === SubscriptionTier.PRO || userTier === SubscriptionTier.PREMIUM
          ? [{ minTier: SubscriptionTier.PRO }]
          : []),
        ...(userTier === SubscriptionTier.PREMIUM
          ? [{ minTier: SubscriptionTier.PREMIUM }]
          : []),
      ];
    } else {
      where.minTier = SubscriptionTier.FREE;
    }

    return this.prisma.cardTemplate.findMany({
      where,
      orderBy: {
        usageCount: 'desc',
      },
      take: 6,
    });
  }

  async getTemplatesByCategory(category: string, userTier?: SubscriptionTier) {
    return this.findAll(userTier, category);
  }
}
