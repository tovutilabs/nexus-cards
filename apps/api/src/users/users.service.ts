import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubscriptionTier, UserRole } from '@prisma/client';
import { UpdateUserSubscriptionDto } from './dto/admin-user.dto';

type TierLimits = {
  [key in SubscriptionTier]: {
    maxCards: number;
    analyticsRetentionDays: number;
    maxContacts: number;
  };
};

export const TIER_LIMITS: TierLimits = {
  FREE: {
    maxCards: 1,
    analyticsRetentionDays: 7,
    maxContacts: 50,
  },
  PRO: {
    maxCards: 5,
    analyticsRetentionDays: 90,
    maxContacts: Number.MAX_SAFE_INTEGER,
  },
  PREMIUM: {
    maxCards: Number.MAX_SAFE_INTEGER,
    analyticsRetentionDays: Number.MAX_SAFE_INTEGER,
    maxContacts: Number.MAX_SAFE_INTEGER,
  },
};

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.update(userId, {
      profile: {
        update: updateProfileDto,
      },
    });

    return this.sanitizeUser(updatedUser);
  }

  async checkCardLimit(
    userId: string,
    currentCardCount: number
  ): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.subscription) {
      throw new NotFoundException('User or subscription not found');
    }

    const limits = TIER_LIMITS[user.subscription.tier];
    return currentCardCount < limits.maxCards;
  }

  async checkContactLimit(
    userId: string,
    currentContactCount: number
  ): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.subscription) {
      throw new NotFoundException('User or subscription not found');
    }

    const limits = TIER_LIMITS[user.subscription.tier];
    return currentContactCount < limits.maxContacts;
  }

  async getAnalyticsRetentionDays(userId: string): Promise<number> {
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.subscription) {
      throw new NotFoundException('User or subscription not found');
    }

    return TIER_LIMITS[user.subscription.tier].analyticsRetentionDays;
  }

  async canCreateCard(userId: string, currentCardCount: number): Promise<void> {
    const canCreate = await this.checkCardLimit(userId, currentCardCount);

    if (!canCreate) {
      const user = await this.usersRepository.findById(userId);
      const tier = user?.subscription?.tier || 'FREE';
      const limit = TIER_LIMITS[tier as SubscriptionTier].maxCards;

      throw new ForbiddenException(
        `Card limit reached. Your ${tier} plan allows ${limit} card${limit > 1 ? 's' : ''}. Please upgrade to create more cards.`
      );
    }
  }

  async canAddContact(
    userId: string,
    currentContactCount: number
  ): Promise<void> {
    const canAdd = await this.checkContactLimit(userId, currentContactCount);

    if (!canAdd) {
      const user = await this.usersRepository.findById(userId);
      const tier = user?.subscription?.tier || 'FREE';
      const limit = TIER_LIMITS[tier as SubscriptionTier].maxContacts;

      throw new ForbiddenException(
        `Contact limit reached. Your ${tier} plan allows ${limit} contacts. Please upgrade to add more contacts.`
      );
    }
  }

  async listUsersAdmin(params: {
    skip: number;
    take: number;
    search?: string;
    role?: string;
    tier?: string;
  }) {
    const { skip, take, search, role, tier } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (tier) {
      where.subscription = { tier: tier as SubscriptionTier };
    }

    const [users, total] = await Promise.all([
      this.usersRepository.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.usersRepository.count({ where }),
    ]);

    return {
      users: users.map((user) => this.sanitizeUser(user)),
      total,
      skip,
      take,
    };
  }

  async getUserDetailsAdmin(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [cardsCount, contactsCount] = await Promise.all([
      this.usersRepository.countCards(userId),
      this.usersRepository.countContacts(userId),
    ]);

    return {
      ...this.sanitizeUser(user),
      stats: {
        cardsCount,
        contactsCount,
      },
    };
  }

  async updateUserRole(userId: string, newRole: UserRole) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.update(userId, {
      role: newRole,
    });

    return this.sanitizeUser(updatedUser);
  }

  async updateUserSubscription(
    userId: string,
    updateDto: UpdateUserSubscriptionDto
  ) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.subscription) {
      throw new NotFoundException('User subscription not found');
    }

    const updateData: any = {};

    if (updateDto.tier !== undefined) {
      updateData.tier = updateDto.tier;
    }

    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    if (updateDto.stripeCustomerId !== undefined) {
      updateData.stripeCustomerId = updateDto.stripeCustomerId;
    }

    if (updateDto.stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = updateDto.stripeSubscriptionId;
    }

    const updatedUser = await this.usersRepository.update(userId, {
      subscription: {
        update: updateData,
      },
    });

    return this.sanitizeUser(updatedUser);
  }

  async getUserUsageMetrics(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [cardsCount, contactsCount, recentActivity] = await Promise.all([
      this.usersRepository.countCards(userId),
      this.usersRepository.countContacts(userId),
      this.usersRepository.getRecentActivity(userId, 7),
    ]);

    const tier = user.subscription?.tier || 'FREE';
    const limits = TIER_LIMITS[tier as SubscriptionTier];

    return {
      userId,
      tier,
      limits,
      usage: {
        cards: {
          current: cardsCount,
          limit: limits.maxCards,
          percentage:
            limits.maxCards === Number.MAX_SAFE_INTEGER
              ? 0
              : (cardsCount / limits.maxCards) * 100,
        },
        contacts: {
          current: contactsCount,
          limit: limits.maxContacts,
          percentage:
            limits.maxContacts === Number.MAX_SAFE_INTEGER
              ? 0
              : (contactsCount / limits.maxContacts) * 100,
        },
      },
      recentActivity,
    };
  }

  async getUserStatsAdmin() {
    const stats = await this.usersRepository.getUserStats();
    return stats;
  }

  async impersonateUser(adminId: string, targetUserId: string) {
    // Verify admin exists and has admin role
    const admin = await this.usersRepository.findById(adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can impersonate users');
    }

    // Verify target user exists
    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Prevent admin from impersonating another admin
    if (targetUser.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot impersonate another administrator');
    }

    // Log the impersonation activity
    await this.usersRepository.createActivity({
      userId: adminId,
      action: 'USER_IMPERSONATION',
      metadata: {
        targetUserId,
        targetEmail: targetUser.email,
        timestamp: new Date().toISOString(),
      },
      ipAddress: null,
      userAgent: null,
    });

    // Return token data - actual JWT generation should be done in auth service
    // but returning the payload for now
    return {
      message: 'Impersonation token generated',
      user: this.sanitizeUser(targetUser),
      impersonatedBy: adminId,
      expiresIn: '1h', // Impersonation tokens should be short-lived
    };
  }

  private sanitizeUser(user: any) {
    const {
      passwordHash: _passwordHash,
      passwordResetToken: _passwordResetToken,
      passwordResetExpires: _passwordResetExpires,
      emailVerificationToken: _emailVerificationToken,
      twoFactorSecret: _twoFactorSecret,
      ...sanitized
    } = user;
    return sanitized;
  }
}
