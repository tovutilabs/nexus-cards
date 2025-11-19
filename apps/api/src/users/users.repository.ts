import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, UserProfile, Subscription } from '@prisma/client';

export type UserWithRelations = User & {
  profile: UserProfile | null;
  subscription: Subscription | null;
};

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        subscription: true,
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        subscription: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRelations> {
    return this.prisma.user.create({
      data,
      include: {
        profile: true,
        subscription: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<UserWithRelations> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        profile: true,
        subscription: true,
      },
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }): Promise<any[]> {
    const { skip, take, where, orderBy, include } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: include || {
        profile: true,
        subscription: true,
      },
    });
  }

  async count(params?: { where?: Prisma.UserWhereInput }): Promise<number> {
    return this.prisma.user.count(params);
  }

  async countCards(userId: string): Promise<number> {
    return this.prisma.card.count({
      where: { userId },
    });
  }

  async countContacts(userId: string): Promise<number> {
    return this.prisma.contact.count({
      where: {
        card: { userId },
      },
    });
  }

  async getRecentActivity(userId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [cardViews, nfcTaps, contactSubmissions] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          card: { userId },
          eventType: 'CARD_VIEW',
          timestamp: { gte: since },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          card: { userId },
          eventType: 'NFC_TAP',
          timestamp: { gte: since },
        },
      }),
      this.prisma.contact.count({
        where: {
          card: { userId },
          createdAt: { gte: since },
        },
      }),
    ]);

    return {
      cardViews,
      nfcTaps,
      contactSubmissions,
      days,
    };
  }

  async getUserStats() {
    const [
      totalUsers,
      freeTier,
      proTier,
      premiumTier,
      adminUsers,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { tier: 'FREE' } }),
      this.prisma.subscription.count({ where: { tier: 'PRO' } }),
      this.prisma.subscription.count({ where: { tier: 'PREMIUM' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalUsers,
      byTier: {
        FREE: freeTier,
        PRO: proTier,
        PREMIUM: premiumTier,
      },
      adminUsers,
      activeSubscriptions,
    };
  }
}
