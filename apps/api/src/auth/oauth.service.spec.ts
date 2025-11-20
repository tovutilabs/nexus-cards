import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { OAuthProviderType } from '@prisma/client';

describe('OAuthService', () => {
  let service: OAuthService;
  let prismaService: PrismaService;
  let cryptoService: CryptoService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'USER',
    emailVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    backupCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOAuthProvider = {
    id: 'provider-123',
    userId: 'user-123',
    provider: OAuthProviderType.GOOGLE,
    providerId: 'google-123',
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    oAuthProvider: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCryptoService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    cryptoService = module.get<CryptoService>(CryptoService);

    jest.clearAllMocks();
  });

  describe('findOrCreateUserFromOAuth', () => {
    it('should return existing user if OAuth provider already linked', async () => {
      mockPrismaService.oAuthProvider.findUnique.mockResolvedValue({
        ...mockOAuthProvider,
        user: mockUser,
      });

      const result = await service.findOrCreateUserFromOAuth(
        OAuthProviderType.GOOGLE,
        'google-123',
        'test@example.com',
        'Test',
        'User'
      );

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.oAuthProvider.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerId: {
            provider: OAuthProviderType.GOOGLE,
            providerId: 'google-123',
          },
        },
        include: { user: true },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should link OAuth to existing user with same email', async () => {
      mockPrismaService.oAuthProvider.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.oAuthProvider.create.mockResolvedValue(mockOAuthProvider);

      const result = await service.findOrCreateUserFromOAuth(
        OAuthProviderType.GOOGLE,
        'google-123',
        'test@example.com',
        'Test',
        'User'
      );

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaService.oAuthProvider.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          provider: OAuthProviderType.GOOGLE,
          providerId: 'google-123',
          isPrimary: false,
        },
      });
    });

    it('should create new user if no existing user or provider found', async () => {
      const newUser = {
        ...mockUser,
        id: 'new-user-123',
        emailVerified: true,
      };

      mockPrismaService.oAuthProvider.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.findOrCreateUserFromOAuth(
        OAuthProviderType.GOOGLE,
        'google-123',
        'test@example.com',
        'Test',
        'User'
      );

      expect(result).toEqual(newUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: null,
          emailVerified: true,
          oauthProviders: {
            create: {
              provider: OAuthProviderType.GOOGLE,
              providerId: 'google-123',
              isPrimary: true,
            },
          },
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
            },
          },
        },
      });
    });
  });

  describe('getUserProviders', () => {
    it('should return list of OAuth providers for user', async () => {
      const providers = [
        mockOAuthProvider,
        {
          ...mockOAuthProvider,
          id: 'provider-456',
          provider: OAuthProviderType.LINKEDIN,
          providerId: 'linkedin-123',
          isPrimary: false,
        },
      ];

      mockPrismaService.oAuthProvider.findMany.mockResolvedValue(providers);

      const result = await service.getUserProviders('user-123');

      expect(result).toEqual(providers);
      expect(mockPrismaService.oAuthProvider.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array if user has no providers', async () => {
      mockPrismaService.oAuthProvider.findMany.mockResolvedValue([]);

      const result = await service.getUserProviders('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('linkProvider', () => {
    const linkData = {
      provider: OAuthProviderType.LINKEDIN,
      providerId: 'linkedin-123',
    };

    it('should link new OAuth provider to user', async () => {
      mockPrismaService.oAuthProvider.findUnique.mockResolvedValue(null);
      mockPrismaService.oAuthProvider.create.mockResolvedValue({
        ...mockOAuthProvider,
        provider: OAuthProviderType.LINKEDIN,
        providerId: 'linkedin-123',
        isPrimary: false,
      });

      const result = await service.linkProvider('user-123', linkData);

      expect(result).toBeDefined();
      expect(mockPrismaService.oAuthProvider.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          provider: OAuthProviderType.LINKEDIN,
          providerId: 'linkedin-123',
          isPrimary: false,
        },
      });
    });

    it('should throw ConflictException if provider already linked', async () => {
      mockPrismaService.oAuthProvider.findUnique.mockResolvedValue(mockOAuthProvider);

      await expect(
        service.linkProvider('user-123', linkData)
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.oAuthProvider.create).not.toHaveBeenCalled();
    });
  });

  describe('unlinkProvider', () => {
    it('should unlink OAuth provider from user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-password',
      });
      mockPrismaService.oAuthProvider.count.mockResolvedValue(2);
      mockPrismaService.oAuthProvider.findFirst.mockResolvedValue(mockOAuthProvider);
      mockPrismaService.oAuthProvider.delete.mockResolvedValue(mockOAuthProvider);

      await service.unlinkProvider('user-123', OAuthProviderType.GOOGLE);

      expect(mockPrismaService.oAuthProvider.delete).toHaveBeenCalledWith({
        where: {
          provider_providerId: {
            provider: OAuthProviderType.GOOGLE,
            providerId: 'google-123',
          },
        },
      });
    });

    it('should throw BadRequestException if unlinking last auth method', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });
      mockPrismaService.oAuthProvider.count.mockResolvedValue(1);
      mockPrismaService.oAuthProvider.findFirst.mockResolvedValue(mockOAuthProvider);

      await expect(
        service.unlinkProvider('user-123', OAuthProviderType.GOOGLE)
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.oAuthProvider.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if provider not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.oAuthProvider.count.mockResolvedValue(2);
      mockPrismaService.oAuthProvider.findFirst.mockResolvedValue(null);

      await expect(
        service.unlinkProvider('user-123', OAuthProviderType.GOOGLE)
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.oAuthProvider.delete).not.toHaveBeenCalled();
    });

    it('should allow unlinking if user has password set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-password',
      });
      mockPrismaService.oAuthProvider.count.mockResolvedValue(1);
      mockPrismaService.oAuthProvider.findFirst.mockResolvedValue(mockOAuthProvider);
      mockPrismaService.oAuthProvider.delete.mockResolvedValue(mockOAuthProvider);

      await service.unlinkProvider('user-123', OAuthProviderType.GOOGLE);

      expect(mockPrismaService.oAuthProvider.delete).toHaveBeenCalled();
    });
  });
});
