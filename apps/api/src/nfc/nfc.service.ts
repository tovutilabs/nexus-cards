import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { NfcRepository } from './nfc.repository';
import { CardsRepository } from '../cards/cards.repository';
import { UsersRepository } from '../users/users.repository';
import {
  ImportNfcTagsDto,
  AssignNfcTagDto,
  AssociateNfcTagDto,
} from './dto/nfc.dto';

@Injectable()
export class NfcService {
  constructor(
    private nfcRepository: NfcRepository,
    private cardsRepository: CardsRepository,
    private usersRepository: UsersRepository
  ) {}

  async importTags(importDto: ImportNfcTagsDto) {
    const results = {
      imported: [] as string[],
      skipped: [] as string[],
      errors: [] as { uid: string; error: string }[],
    };

    for (const uid of importDto.uids) {
      try {
        const existing = await this.nfcRepository.findByUid(uid);
        if (existing) {
          results.skipped.push(uid);
          continue;
        }

        await this.nfcRepository.create({
          uid,
          status: 'UNASSOCIATED',
        });
        results.imported.push(uid);
      } catch (error) {
        results.errors.push({
          uid,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  async assignTagToUser(tagId: string, assignDto: AssignNfcTagDto) {
    const tag = await this.nfcRepository.findById(tagId);
    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    if (tag.status === 'DEACTIVATED') {
      throw new BadRequestException('Cannot assign a deactivated tag');
    }

    let user;
    if (assignDto.userId) {
      user = await this.usersRepository.findById(assignDto.userId);
    } else if (assignDto.userEmail) {
      user = await this.usersRepository.findByEmail(assignDto.userEmail);
    } else {
      throw new BadRequestException(
        'Either userId or userEmail must be provided'
      );
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.nfcRepository.assignToUser(tagId, user.id);
  }

  async revokeTag(tagId: string) {
    const tag = await this.nfcRepository.findById(tagId);
    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    return this.nfcRepository.update(tagId, {
      card: { disconnect: true },
      status: 'DEACTIVATED',
    });
  }

  async associateTagWithCard(
    tagId: string,
    userId: string,
    associateDto: AssociateNfcTagDto
  ) {
    const tag = await this.nfcRepository.findById(tagId);
    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    if (tag.status === 'DEACTIVATED') {
      throw new ForbiddenException('This tag has been deactivated');
    }

    const card = await this.cardsRepository.findById(associateDto.cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException(
        'You can only associate tags with your own cards'
      );
    }

    if (tag.cardId) {
      throw new ConflictException(
        'This tag is already associated with another card. Please disassociate it first.'
      );
    }

    await this.nfcRepository.associateWithCard(tagId, associateDto.cardId);

    return { message: 'Tag successfully associated with card' };
  }

  async disassociateTag(tagId: string, userId: string) {
    const tag = await this.nfcRepository.findById(tagId);
    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    if (!tag.cardId) {
      throw new BadRequestException('Tag is not associated with any card');
    }

    const card = await this.cardsRepository.findById(tag.cardId);
    if (!card) {
      throw new NotFoundException('Associated card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException(
        'You can only disassociate tags from your own cards'
      );
    }

    await this.nfcRepository.disassociateFromCard(tagId);

    return { message: 'Tag successfully disassociated from card' };
  }

  async resolveTag(uid: string) {
    const tag = await this.nfcRepository.findByUid(uid);

    if (!tag) {
      return {
        status: 'UNKNOWN',
        message: 'This NFC tag is not registered in the system',
        action: 'SHOW_ERROR',
      };
    }

    if (tag.status === 'DEACTIVATED') {
      return {
        status: 'DEACTIVATED',
        message: 'This NFC tag has been deactivated',
        action: 'SHOW_ERROR',
      };
    }

    if (!tag.cardId) {
      return {
        status: 'UNASSOCIATED',
        message: 'This tag is not linked to a card yet',
        action: 'SHOW_ASSOCIATION_SCREEN',
        tagId: tag.id,
      };
    }

    await this.nfcRepository.updateLastTapped(tag.id);

    const card = await this.cardsRepository.findById(tag.cardId);
    if (!card) {
      throw new NotFoundException('Associated card not found');
    }

    return {
      status: 'ASSOCIATED',
      message: 'Redirecting to card',
      action: 'REDIRECT',
      cardSlug: card.slug,
      redirectUrl: `/p/${card.slug}?uid=${uid}`,
    };
  }

  async getUserTags(userId: string) {
    const userCards = await this.cardsRepository.findByUserId(userId);
    const cardIds = userCards.map((card) => card.id);

    const tags = await this.nfcRepository.findMany({
      where: {
        OR: [{ cardId: { in: cardIds } }],
      },
    });

    return tags;
  }

  async getCardTags(cardId: string, userId: string) {
    const card = await this.cardsRepository.findById(cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have access to this card');
    }

    return this.nfcRepository.findByCardId(cardId);
  }

  async getAllTags(filters?: {
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const where = filters?.status
      ? { status: filters.status as any }
      : undefined;

    return this.nfcRepository.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take || 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTagStats() {
    const total = await this.nfcRepository.count();
    const unassociated = await this.nfcRepository.count({
      status: 'UNASSOCIATED',
    });
    const associated = await this.nfcRepository.count({ status: 'ASSOCIATED' });
    const deactivated = await this.nfcRepository.count({
      status: 'DEACTIVATED',
    });

    return {
      total,
      unassociated,
      associated,
      deactivated,
    };
  }
}
