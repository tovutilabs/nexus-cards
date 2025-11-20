import { Test, TestingModule } from '@nestjs/testing';
import { ShareLinksService } from './share-links.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CardPrivacyMode, ShareChannel } from '@prisma/client';
import * as argon2 from 'argon2';

describe('ShareLinksService', () => {
  let service: ShareLinksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    card: {
      findUnique: jest.fn(),
    },
    shareLink: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCard = {
    id: 'card1',
    userId: 'user1',
    slug: 'test-card',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockShareLink = {
    id: 'link1',
    cardId: 'card1',
    token: 'test-token-123',
    name: 'Test Link',
    privacyMode: CardPrivacyMode.PUBLIC,
    passwordHash: null,
    expiresAt: null,
    allowContactSubmission: true,
    channel: ShareChannel.DIRECT,
    shareCount: 0,
    lastAccessedAt: null,
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareLinksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ShareLinksService>(ShareLinksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      cardId: 'card1',
      name: 'Test Link',
      privacyMode: CardPrivacyMode.PUBLIC,
      allowContactSubmission: true,
    };

    it('should create a share link successfully', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.shareLink.create.mockResolvedValue(mockShareLink);

      const result = await service.create('user1', createDto);

      expect(result.id).toBe('link1');
      expect(result.url).toContain('/s/');
      expect(result.passwordHash).toBeUndefined();
      expect(mockPrismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'card1' },
      });
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.create('user1', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue({
        ...mockCard,
        userId: 'differentUser',
      });

      await expect(service.create('user1', createDto)).rejects.toThrow(ForbiddenException);
    });

    it('should hash password for password-protected links', async () => {
      const passwordDto = {
        ...createDto,
        privacyMode: CardPrivacyMode.PASSWORD_PROTECTED,
        password: 'securePassword123',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.shareLink.create.mockImplementation((args) => {
        return Promise.resolve({ ...mockShareLink, ...args.data });
      });

      const result = await service.create('user1', passwordDto);

      expect(mockPrismaService.shareLink.create).toHaveBeenCalled();
      const createArgs = mockPrismaService.shareLink.create.mock.calls[0][0];
      expect(createArgs.data.passwordHash).toBeDefined();
    });

    it('should throw BadRequestException if expiration date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        service.create('user1', { ...createDto, expiresAt: pastDate }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByCard', () => {
    it('should return all share links for a card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.shareLink.findMany.mockResolvedValue([mockShareLink]);

      const result = await service.findByCard('user1', 'card1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('link1');
      expect(result[0].passwordHash).toBeUndefined();
      expect(result[0].url).toContain('/s/');
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.findByCard('user1', 'card1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue({
        ...mockCard,
        userId: 'differentUser',
      });

      await expect(service.findByCard('user1', 'card1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateShareLink', () => {
    it('should validate a public share link without password', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        card: mockCard,
      });
      mockPrismaService.shareLink.update.mockResolvedValue(mockShareLink);

      const result = await service.validateShareLink({
        token: 'test-token-123',
      });

      expect(result.valid).toBe(true);
      expect(result.card).toBeDefined();
      expect(mockPrismaService.shareLink.update).toHaveBeenCalledWith({
        where: { id: 'link1' },
        data: {
          shareCount: { increment: 1 },
          lastAccessedAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException for revoked link', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        revokedAt: new Date(),
      });

      await expect(
        service.validateShareLink({ token: 'test-token-123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired link', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        expiresAt: expiredDate,
      });

      await expect(
        service.validateShareLink({ token: 'test-token-123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require password for password-protected links', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        passwordHash: await argon2.hash('correctPassword'),
      });

      await expect(
        service.validateShareLink({ token: 'test-token-123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should validate password-protected link with correct password', async () => {
      const password = 'correctPassword';
      const passwordHash = await argon2.hash(password);

      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        passwordHash,
        card: mockCard,
      });
      mockPrismaService.shareLink.update.mockResolvedValue(mockShareLink);

      const result = await service.validateShareLink({
        token: 'test-token-123',
        password,
      });

      expect(result.valid).toBe(true);
      expect(result.card).toBeDefined();
    });

    it('should reject password-protected link with incorrect password', async () => {
      const passwordHash = await argon2.hash('correctPassword');

      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        passwordHash,
      });

      await expect(
        service.validateShareLink({
          token: 'test-token-123',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    it('should update a share link successfully', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        card: mockCard,
      });
      mockPrismaService.shareLink.update.mockResolvedValue({
        ...mockShareLink,
        name: 'Updated Link',
      });

      const result = await service.update('user1', 'link1', {
        name: 'Updated Link',
      });

      expect(result.name).toBe('Updated Link');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if link does not exist', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue(null);

      await expect(service.update('user1', 'link1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the card', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        card: { ...mockCard, userId: 'differentUser' },
      });

      await expect(service.update('user1', 'link1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revoke', () => {
    it('should revoke a share link successfully', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue({
        ...mockShareLink,
        card: mockCard,
      });
      mockPrismaService.shareLink.update.mockResolvedValue({
        ...mockShareLink,
        revokedAt: new Date(),
      });

      const result = await service.revoke('user1', 'link1');

      expect(result.message).toBeDefined();
      expect(mockPrismaService.shareLink.update).toHaveBeenCalledWith({
        where: { id: 'link1' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('generateChannelUrls', () => {
    it('should generate URLs for all supported channels', () => {
      const shareUrl = 'https://nexus.cards/s/test-token';
      const cardTitle = 'John Doe';

      const result = service.generateChannelUrls(shareUrl, cardTitle);

      expect(result.whatsapp).toContain('wa.me');
      expect(result.telegram).toContain('t.me/share');
      expect(result.sms).toContain('sms:');
      expect(result.email).toContain('mailto:');
      expect(result.linkedin).toContain('linkedin.com/sharing');
      
      // Verify URL encoding
      expect(result.whatsapp).toContain(encodeURIComponent(shareUrl));
      expect(result.email).toContain(encodeURIComponent(cardTitle));
    });
  });
});
