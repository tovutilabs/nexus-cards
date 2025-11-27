import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CardsRepository } from './cards.repository';
import { UsersService } from '../users/users.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { generateSlug, generateUniqueSlug } from './utils/slug.util';

@Injectable()
export class CardsService {
  constructor(
    private cardsRepository: CardsRepository,
    private usersService: UsersService
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

    return this.cardsRepository.update(id, updateData);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.cardsRepository.update(id, { status: 'ARCHIVED' });
  }

  async incrementViewCount(slug: string) {
    const card = await this.findBySlug(slug);
    await this.cardsRepository.incrementViewCount(card.id);
  }

  async updateSocialLinks(id: string, userId: string, socialLinks: Record<string, string>) {
    await this.findOne(id, userId);
    return this.cardsRepository.update(id, { socialLinks });
  }

  async getSocialLinks(id: string, userId: string) {
    const card = await this.findOne(id, userId);
    return { socialLinks: card.socialLinks || {} };
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
