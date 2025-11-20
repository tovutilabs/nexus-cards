import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthProviderType } from '@prisma/client';
import { LinkOAuthProviderDto } from './dto/oauth.dto';

@Injectable()
export class OAuthService {
  constructor(private prisma: PrismaService) {}

  async linkProvider(userId: string, dto: LinkOAuthProviderDto) {
    // Check if provider is already linked to this user
    const existingLink = await this.prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider: dto.provider,
      },
    });

    if (existingLink) {
      throw new ConflictException('This provider is already linked to your account');
    }

    // Check if this provider account is linked to another user
    const existingProviderAccount = await this.prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider: dto.provider,
          providerId: dto.providerId,
        },
      },
    });

    if (existingProviderAccount && existingProviderAccount.userId !== userId) {
      throw new ConflictException('This provider account is already linked to another user');
    }

    // Check if user has any OAuth providers; if not, this will be primary
    const userProviders = await this.prisma.oAuthProvider.findMany({
      where: { userId },
    });

    const isPrimary = userProviders.length === 0;

    const provider = await this.prisma.oAuthProvider.create({
      data: {
        userId,
        provider: dto.provider,
        providerId: dto.providerId,
        email: dto.email,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        isPrimary,
      },
    });

    return provider;
  }

  async unlinkProvider(userId: string, provider: OAuthProviderType) {
    const oauthProvider = await this.prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider,
      },
    });

    if (!oauthProvider) {
      throw new NotFoundException('Provider not linked to your account');
    }

    // Check if this is the primary provider and user has no password
    if (oauthProvider.isPrimary) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      const otherProviders = await this.prisma.oAuthProvider.count({
        where: {
          userId,
          provider: { not: provider },
        },
      });

      if (!user?.passwordHash && otherProviders === 0) {
        throw new BadRequestException(
          'Cannot unlink primary provider without setting a password or linking another provider first'
        );
      }
    }

    await this.prisma.oAuthProvider.delete({
      where: { id: oauthProvider.id },
    });

    return { message: 'Provider unlinked successfully' };
  }

  async getUserProviders(userId: string) {
    return this.prisma.oAuthProvider.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        isPrimary: true,
        createdAt: true,
      },
    });
  }

  async findOrCreateUserFromOAuth(
    provider: OAuthProviderType,
    providerId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ) {
    // Check if OAuth provider already exists
    const existingProvider = await this.prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
            subscription: true,
          },
        },
      },
    });

    if (existingProvider) {
      return existingProvider.user;
    }

    // Check if user exists with this email
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (existingUser) {
      // Link this OAuth provider to existing user
      await this.prisma.oAuthProvider.create({
        data: {
          userId: existingUser.id,
          provider,
          providerId,
          email,
          isPrimary: !existingUser.passwordHash,
        },
      });

      // Mark email as verified if OAuth provider gives us verified email
      if (!existingUser.emailVerified) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: true },
        });
      }

      return this.prisma.user.findUnique({
        where: { id: existingUser.id },
        include: {
          profile: true,
          subscription: true,
        },
      });
    }

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        emailVerified: true,
        profile: {
          create: {
            firstName: firstName || '',
            lastName: lastName || '',
          },
        },
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
        oauthProviders: {
          create: {
            provider,
            providerId,
            email,
            isPrimary: true,
          },
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    });

    return newUser;
  }
}
