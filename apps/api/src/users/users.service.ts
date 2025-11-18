import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersRepository, UserWithRelations } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubscriptionTier } from '@prisma/client';

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

  async checkCardLimit(userId: string, currentCardCount: number): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);
    
    if (!user || !user.subscription) {
      throw new NotFoundException('User or subscription not found');
    }

    const limits = TIER_LIMITS[user.subscription.tier];
    return currentCardCount < limits.maxCards;
  }

  async checkContactLimit(userId: string, currentContactCount: number): Promise<boolean> {
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

  async canAddContact(userId: string, currentContactCount: number): Promise<void> {
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

  private sanitizeUser(user: any) {
    const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}
