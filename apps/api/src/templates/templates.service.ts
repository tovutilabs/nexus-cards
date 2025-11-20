import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { SubscriptionTier } from '@prisma/client';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userTier?: SubscriptionTier, category?: string) {
    const where: any = {
      isActive: true,
    };

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
    await this.findOne(id); // Verify template exists

    return this.prisma.cardTemplate.delete({
      where: { id },
    });
  }

  async applyTemplateToCard(cardId: string, templateId: string, userId: string, preserveContent = true) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { user: { include: { subscription: true } } },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to edit this card');
    }

    const template = await this.findOne(templateId);

    // Check tier access
    const userTier = card.user.subscription?.tier || SubscriptionTier.FREE;
    if (!this.canAccessTemplate(userTier, template.minTier)) {
      throw new ForbiddenException(
        `This template requires ${template.minTier} tier or higher`
      );
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

    return this.prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        template: true,
      },
    });
  }

  canAccessTemplate(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    const tierHierarchy = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PRO]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }

  sanitizeCustomCss(css: string): string {
    if (!css) {
      return '';
    }

    // Remove potentially dangerous CSS properties and values
    const dangerousPatterns = [
      /@import/gi,
      /expression\(/gi,
      /behavior:/gi,
      /-moz-binding/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /<script/gi,
      /<\/script/gi,
      /<!DOCTYPE/gi,
      /<html/gi,
      /<head/gi,
      /<body/gi,
      /on\w+\s*=/gi, // onclick, onload, etc.
    ];

    let sanitized = css;

    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Limit CSS size (100KB max)
    if (sanitized.length > 100000) {
      throw new BadRequestException('Custom CSS is too large (max 100KB)');
    }

    return sanitized.trim();
  }

  async updateCardCustomCss(cardId: string, userId: string, customCss: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { user: { include: { subscription: true } } },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to edit this card');
    }

    // Check if user has PREMIUM tier for custom CSS
    const userTier = card.user.subscription?.tier || SubscriptionTier.FREE;
    if (userTier !== SubscriptionTier.PREMIUM) {
      throw new ForbiddenException('Custom CSS is only available for PREMIUM tier users');
    }

    const sanitizedCss = this.sanitizeCustomCss(customCss);

    return this.prisma.card.update({
      where: { id: cardId },
      data: {
        customCss: sanitizedCss,
      },
    });
  }

  async getFeaturedTemplates() {
    return this.prisma.cardTemplate.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
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
