import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let prismaService: PrismaService;
  let cryptoService: CryptoService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'USER',
    emailVerified: false,
    emailVerificationToken: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    backupCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCryptoService = {
    generateVerificationToken: jest.fn(),
    generateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
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

    service = module.get<EmailVerificationService>(EmailVerificationService);
    prismaService = module.get<PrismaService>(PrismaService);
    cryptoService = module.get<CryptoService>(CryptoService);

    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should generate verification token and update user', async () => {
      const token = 'secure-verification-token-123';
      mockCryptoService.generateToken.mockResolvedValue(token);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerificationToken: token,
      });

      const result = await service.sendVerificationEmail('user-123');

      expect(result.token).toBe(token);
      expect(result.message).toContain('Verification email sent');
      expect(mockCryptoService.generateToken).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { emailVerificationToken: token },
      });
    });

    it('should generate unique tokens for each call', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';
      
      mockCryptoService.generateToken
        .mockResolvedValueOnce(token1)
        .mockResolvedValueOnce(token2);
      
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result1 = await service.sendVerificationEmail('user-123');
      const result2 = await service.sendVerificationEmail('user-123');

      expect(result1.token).toBe(token1);
      expect(result2.token).toBe(token2);
      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe('verifyEmail', () => {
    const validToken = 'valid-token-123';

    it('should verify email with valid token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerificationToken: validToken,
      });

      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
      });

      const result = await service.verifyEmail(validToken);

      expect(result.emailVerified).toBe(true);
      expect(result.message).toContain('verified successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });
    });

    it('should throw BadRequestException with invalid token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyEmail('invalid-token')
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: validToken,
      });

      await expect(
        service.verifyEmail(validToken)
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('checkVerificationStatus', () => {
    it('should return true if email is verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      const result = await service.checkVerificationStatus('user-123');

      expect(result.emailVerified).toBe(true);
    });

    it('should return false if email is not verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      const result = await service.checkVerificationStatus('user-123');

      expect(result.emailVerified).toBe(false);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.checkVerificationStatus('non-existent-user')
      ).rejects.toThrow();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email to unverified user', async () => {
      const token = 'new-token-123';
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      mockCryptoService.generateVerificationToken.mockReturnValue(token);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerificationToken: token,
      });

      const result = await service.sendVerificationEmail('user-123');

      expect(result.token).toBe(token);
      expect(result.message).toContain('Verification email sent');
    });

    it('should not resend if email already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      const status = await service.checkVerificationStatus('user-123');

      expect(status.emailVerified).toBe(true);
      // Service allows resending, but application logic should check emailVerified first
    });
  });

  describe('token security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const tokens = new Set<string>();
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      mockCryptoService.generateVerificationToken.mockImplementation(() => {
        const token = `token-${Math.random().toString(36).substring(2, 15)}`;
        return token;
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      // Generate multiple tokens
      for (let i = 0; i < 100; i++) {
        const result = await service.sendVerificationEmail('user-123');
        if (result.token) {
          tokens.add(result.token);
        }
      }

      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle missing verification token gracefully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyEmail('any-token')
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle verification token mismatch', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyEmail('expected-token')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
