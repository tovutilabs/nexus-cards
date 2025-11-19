import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicApiV1Service {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCards(userId: string) {
    return this.prisma.card.findMany({
      where: {
        userId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        company: true,
        email: true,
        phone: true,
        website: true,
        bio: true,
        socialLinks: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCardMetadata(userId: string, cardId: string) {
    const card = await this.prisma.card.findFirst({
      where: {
        id: cardId,
        userId,
      },
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        company: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contacts: true,
            nfcTags: true,
          },
        },
      },
    });

    return card;
  }

  async getUserContacts(userId: string, limit = 100, offset = 0) {
    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where: { userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          notes: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.contact.count({
        where: { userId },
      }),
    ]);

    return {
      contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async logAnalyticsEvent(
    userId: string,
    data: {
      cardId: string;
      eventType: string;
      metadata?: Record<string, any>;
    }
  ) {
    const card = await this.prisma.card.findFirst({
      where: {
        id: data.cardId,
        userId,
      },
    });

    if (!card) {
      return null;
    }

    return this.prisma.analyticsEvent.create({
      data: {
        cardId: data.cardId,
        eventType: data.eventType as any,
        metadata: data.metadata || {},
      },
    });
  }
}
