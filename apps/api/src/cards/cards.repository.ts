import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Card, Prisma } from '@prisma/client';

@Injectable()
export class CardsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Card | null> {
    return this.prisma.card.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
        nfcTags: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Card | null> {
    return this.prisma.card.findUnique({
      where: { slug },
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
        nfcTags: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Card[]> {
    return this.prisma.card.findMany({
      where: { userId },
      include: {
        nfcTags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(data: Prisma.CardCreateInput): Promise<Card> {
    return this.prisma.card.create({
      data,
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
        nfcTags: true,
      },
    });
  }

  async update(id: string, data: Prisma.CardUpdateInput): Promise<Card> {
    return this.prisma.card.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
        nfcTags: true,
      },
    });
  }

  async delete(id: string): Promise<Card> {
    return this.prisma.card.delete({
      where: { id },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CardWhereInput;
    orderBy?: Prisma.CardOrderByWithRelationInput;
  }): Promise<Card[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.card.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
        nfcTags: true,
      },
    });
  }

  async count(where?: Prisma.CardWhereInput): Promise<number> {
    return this.prisma.card.count({ where });
  }

  async incrementViewCount(id: string): Promise<Card> {
    return this.prisma.card.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
        lastViewedAt: new Date(),
      },
    });
  }
}
