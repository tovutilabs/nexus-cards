import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CardRenderModel, IdentityHeader, ComponentConfig } from '../models/card-render-model';
import { deriveStyling } from '../utils/styling-derivation';

@Injectable()
export class CardRenderModelService {
  constructor(private readonly prisma: PrismaService) {}

  async buildRenderModel(
    cardSlugOrId: string,
    viewerContext?: { userId?: string; isPublic?: boolean }
  ): Promise<CardRenderModel> {
    const isSlug = !cardSlugOrId.startsWith('c');
    
    const card = await this.prisma.card.findUnique({
      where: isSlug ? { slug: cardSlugOrId } : { id: cardSlugOrId },
      include: {
        template: true,
        components: {
          where: { enabled: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD_NOT_FOUND',
        message: `Card with ${isSlug ? 'slug' : 'id'} '${cardSlugOrId}' not found`,
      });
    }

    if (viewerContext?.isPublic && card.status !== 'PUBLISHED') {
      throw new NotFoundException({
        code: 'CARD_NOT_PUBLISHED',
        message: 'This card is not available for public viewing',
      });
    }

    const identityHeader: IdentityHeader = {
      firstName: card.firstName,
      lastName: card.lastName,
      jobTitle: card.jobTitle ?? undefined,
      company: card.company ?? undefined,
      bio: card.bio ?? undefined,
      phone: card.phone ?? undefined,
      email: card.email ?? undefined,
      website: card.website ?? undefined,
      avatarUrl: card.avatarUrl ?? undefined,
      coverImageUrl: card.coverImageUrl ?? undefined,
      logoUrl: card.logoUrl ?? undefined,
      socialLinks: (card.socialLinks as any) || {},
    };

    const templateConfig = card.template?.config || null;
    const cardOverrides = {
      backgroundType: card.backgroundType,
      backgroundColor: card.backgroundColor,
      backgroundImage: card.backgroundImage,
      layout: card.layout,
      fontFamily: card.fontFamily,
      fontSize: card.fontSize,
      borderRadius: card.borderRadius,
      shadowPreset: card.shadowPreset,
      customCss: card.customCss,
      theme: card.theme,
    };

    const styling = deriveStyling(templateConfig, cardOverrides);

    const components: ComponentConfig[] = card.components.map((component) => ({
      id: component.id,
      type: component.type,
      order: component.order,
      enabled: component.enabled,
      locked: false,
      config: component.config,
      backgroundType: component.backgroundType ?? undefined,
      backgroundColor: component.backgroundColor ?? undefined,
      backgroundImage: component.backgroundImageUrl ?? undefined,
    }));

    const renderModel: CardRenderModel = {
      id: card.id,
      slug: card.slug,
      status: card.status,
      identityHeader,
      styling,
      components,
      templateId: card.templateId ?? undefined,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };

    return renderModel;
  }

  async buildPublicRenderModel(slug: string): Promise<CardRenderModel> {
    return this.buildRenderModel(slug, { isPublic: true });
  }
}
