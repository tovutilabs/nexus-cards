import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CardsRepository } from './cards.repository';
import { UsersService } from '../users/users.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateCardStylingDto, BackgroundType, Layout } from './dto/update-styling.dto';
import { generateSlug, generateUniqueSlug } from './utils/slug.util';
import { SubscriptionTier } from '@prisma/client';
import { RevalidationService } from '../shared/services/revalidation.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class CardsService {
  constructor(
    private cardsRepository: CardsRepository,
    private usersService: UsersService,
    private revalidationService: RevalidationService,
    private analyticsService: AnalyticsService
  ) {}

  async create(userId: string, createCardDto: CreateCardDto) {
    const userCards = await this.cardsRepository.findByUserId(userId);
    await this.usersService.canCreateCard(userId, userCards.length);

    const fullName = `${createCardDto.firstName} ${createCardDto.lastName}`;
    const baseSlug = generateSlug(fullName);
    
    // Generate globally unique slug by checking database
    let slug = baseSlug;
    let counter = 1;
    while (await this.cardsRepository.existsBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const card = await this.cardsRepository.create({
      userId,
      slug,
      firstName: createCardDto.firstName,
      lastName: createCardDto.lastName,
      bio: createCardDto.bio,
      phone: createCardDto.phone,
      email: createCardDto.email,
      website: createCardDto.website,
      company: createCardDto.company,
      jobTitle: createCardDto.jobTitle,
      avatarUrl: createCardDto.avatarUrl,
      coverImageUrl: createCardDto.coverImageUrl,
      socialLinks: createCardDto.socialLinks || {},
      templateId: createCardDto.templateId,
      theme: createCardDto.theme || {},
      customCss: createCardDto.customCss,
      status: createCardDto.status || 'PUBLISHED',
    });

    // Trigger ISR revalidation for new card
    await this.revalidationService.revalidateCard(card.slug);

    return card;
  }

  async findAll(userId: string) {
    return this.cardsRepository.findByUserId(userId);
  }

  async findOne(id: string, userId: string) {
    const card = await this.cardsRepository.findById(id);

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have access to this card');
    }

    return card;
  }

  async findBySlug(slug: string) {
    const card = await this.cardsRepository.findBySlug(slug);

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async findPublicBySlug(slug: string) {
    const card = await this.findBySlug(slug);

    if (card.status !== 'PUBLISHED') {
      throw new ForbiddenException('This card is not published');
    }

    const sanitized = this.sanitizePublicCard(card);
    return {
      ...sanitized,
      userId: card.userId,
    };
  }

  async update(id: string, userId: string, updateCardDto: UpdateCardDto) {
    const card = await this.findOne(id, userId);

    const updateData: any = { ...updateCardDto };

    if (
      (updateCardDto.firstName || updateCardDto.lastName) &&
      (updateCardDto.firstName !== card.firstName ||
        updateCardDto.lastName !== card.lastName)
    ) {
      const userCards = await this.cardsRepository.findByUserId(userId);
      const firstName = updateCardDto.firstName || card.firstName;
      const lastName = updateCardDto.lastName || card.lastName;
      const fullName = `${firstName} ${lastName}`;
      const baseSlug = generateSlug(fullName);
      const existingSlugs = userCards
        .filter((c) => c.id !== id)
        .map((c) => c.slug);
      updateData.slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    const updatedCard = await this.cardsRepository.update(id, updateData);

    // Trigger ISR revalidation
    await this.revalidationService.revalidateCard(updatedCard.slug);

    return updatedCard;
  }

  async remove(id: string, userId: string) {
    const card = await this.findOne(id, userId);
    const updatedCard = await this.cardsRepository.update(id, { status: 'ARCHIVED' });

    // Trigger ISR revalidation when archiving
    await this.revalidationService.revalidateCard(card.slug);

    return updatedCard;
  }

  async incrementViewCount(slug: string) {
    const card = await this.findBySlug(slug);
    await this.cardsRepository.incrementViewCount(card.id);
  }

  async updateSocialLinks(id: string, userId: string, socialLinks: Record<string, string>) {
    const card = await this.findOne(id, userId);
    const updatedCard = await this.cardsRepository.update(id, { socialLinks });

    // Trigger ISR revalidation
    await this.revalidationService.revalidateCard(card.slug);

    return updatedCard;
  }

  async getSocialLinks(id: string, userId: string) {
    const card = await this.findOne(id, userId);
    return { socialLinks: card.socialLinks || {} };
  }

  async updateStyling(cardId: string, userId: string, dto: UpdateCardStylingDto) {
    const card = await this.cardsRepository.findById(cardId);

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

    // Get user's subscription tier
    const user = await this.usersService.findById(userId);
    const userTier = user.subscription?.tier || SubscriptionTier.FREE;

    // Validate tier restrictions for advanced styling
    if (dto.backgroundType === BackgroundType.GRADIENT || dto.backgroundType === BackgroundType.IMAGE) {
      if (userTier === SubscriptionTier.FREE) {
        throw new ForbiddenException({
          code: 'STYLING_NOT_ALLOWED_FOR_TIER',
          message: `Background type '${dto.backgroundType}' requires PRO tier or higher`,
        });
      }
    }

    // Validate layout (advanced layouts require PRO+)
    const advancedLayouts = [Layout.IMAGE_FIRST, Layout.COMPACT];
    if (dto.layout && advancedLayouts.includes(dto.layout)) {
      if (userTier === SubscriptionTier.FREE) {
        throw new ForbiddenException({
          code: 'STYLING_NOT_ALLOWED_FOR_TIER',
          message: `Layout '${dto.layout}' requires PRO tier or higher`,
        });
      }
    }

    // Build update data - map DTO fields to database fields
    const updateData: any = {};
    const changedFields: string[] = [];

    if (dto.backgroundType !== undefined) {
      updateData.backgroundType = dto.backgroundType;
      changedFields.push('backgroundType');
    }
    if (dto.backgroundColor !== undefined) {
      updateData.backgroundColor = dto.backgroundColor;
      changedFields.push('backgroundColor');
    }
    if (dto.backgroundImage !== undefined) {
      updateData.backgroundImage = dto.backgroundImage;
      changedFields.push('backgroundImage');
    }
    if (dto.layout !== undefined) {
      updateData.layout = dto.layout;
      changedFields.push('layout');
    }
    if (dto.fontFamily !== undefined) {
      updateData.fontFamily = dto.fontFamily;
      changedFields.push('fontFamily');
    }
    if (dto.fontSizeScale !== undefined) {
      updateData.fontSize = dto.fontSizeScale;
      changedFields.push('fontSize');
    }
    if (dto.borderRadiusPreset !== undefined) {
      updateData.borderRadius = dto.borderRadiusPreset;
      changedFields.push('borderRadius');
    }
    if (dto.shadowPreset !== undefined) {
      updateData.shadowPreset = dto.shadowPreset;
      changedFields.push('shadowPreset');
    }

    const updatedCard = await this.cardsRepository.update(cardId, updateData);

    // Log analytics event (non-blocking)
    this.analyticsService.logStylingUpdated({
      userId,
      cardId,
      tier: userTier.toString(),
      changedFields,
      backgroundTypeChanged: dto.backgroundType !== undefined,
      layoutChanged: dto.layout !== undefined,
      typographyChanged: dto.fontFamily !== undefined || dto.fontSizeScale !== undefined,
    }).catch((err) => {
      console.error('Failed to log card_styling_updated analytics:', err);
    });

    // Trigger ISR revalidation
    await this.revalidationService.revalidateCard(card.slug);

    return updatedCard;
  }

  private sanitizePublicCard(card: any) {
    const {
      userId: _userId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      deletedAt: _deletedAt,
      ...publicData
    } = card;
    return publicData;
  }
}
