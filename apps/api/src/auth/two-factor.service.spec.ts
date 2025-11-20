import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as argon2 from 'argon2';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';

jest.mock('speakeasy');
jest.mock('argon2');

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prismaService: PrismaService;

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

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCryptoService = {
    hashPassword: jest.fn().mockImplementation((password: string) => argon2.hash(password)),
    verifyPassword: jest.fn().mockImplementation((hash: string, password: string) => argon2.verify(hash, password)),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate 2FA secret and return QR code data', async () => {
      const mockSecret = {
        ascii: 'test-secret-ascii',
        hex: 'test-secret-hex',
        base32: 'TESTSECRETBASE32',
        otpauth_url: 'otpauth://totp/NexusCards:test@example.com?secret=TESTSECRETBASE32&issuer=NexusCards',
      };

      (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);

      const result = await service.generateSecret('user-123', 'test@example.com');

      expect(result).toEqual({
        secret: 'TESTSECRETBASE32',
        qrCodeUrl: 'otpauth://totp/NexusCards:test@example.com?secret=TESTSECRETBASE32&issuer=NexusCards',
      });

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'NexusCards (test@example.com)',
        issuer: 'NexusCards',
      });
    });
  });

  describe('enable2FA', () => {
    const secret = 'TESTSECRETBASE32';
    const validCode = '123456';

    it('should enable 2FA with valid code and return backup codes', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: secret,
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      (argon2.hash as jest.Mock).mockImplementation((code) => Promise.resolve(`hashed-${code}`));

      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      });

      const result = await service.enable2FA('user-123', validCode);

      expect(result.message).toBeDefined();
      expect(result.backupCodes).toHaveLength(8);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token: validCode,
        window: 2,
      });

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateCall.data.twoFactorEnabled).toBe(true);
      expect(updateCall.data.backupCodes).toHaveLength(8);
    });

    it('should throw UnauthorizedException with invalid code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: secret,
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.enable2FA('user-123', 'invalid')
      ).rejects.toThrow();

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('verify2FACode', () => {
    const userId = 'user-123';
    const validCode = '123456';
    const backupCode = 'BACKUP-12345678';

    it('should verify valid TOTP code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.verify2FACode(userId, validCode);

      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'TESTSECRETBASE32',
        encoding: 'base32',
        token: validCode,
        window: 2,
      });
    });

    it('should verify valid backup code', async () => {
      const hashedBackupCode = 'hashed-backup-code';
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
        backupCodes: [hashedBackupCode, 'another-hashed-code'],
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      (argon2.verify as jest.Mock).mockImplementation(async (hash, plain) => {
        return hash === hashedBackupCode && plain === backupCode;
      });

      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        backupCodes: ['another-hashed-code'],
      });

      const result = await service.verify2FACode(userId, backupCode);

      expect(result).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          backupCodes: ['another-hashed-code'],
        },
      });
    });

    it('should return false for invalid code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
        backupCodes: [],
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      const result = await service.verify2FACode(userId, 'invalid-code');

      expect(result).toBe(false);
    });

    it('should throw BadRequestException if 2FA not enabled', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
      });

      await expect(
        service.verify2FACode(userId, validCode)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verify2FACode(userId, validCode)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('disable2FA', () => {
    const userId = 'user-123';
    const validCode = '123456';

    it('should disable 2FA with valid code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      });

      const result = await service.disable2FA(userId, validCode);

      expect(result.message).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
        },
      });
    });

    it('should throw BadRequestException with invalid code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.disable2FA(userId, 'invalid-code')
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('regenerateBackupCodes', () => {
    const userId = 'user-123';
    const validCode = '123456';

    it('should regenerate backup codes with valid 2FA code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      (argon2.hash as jest.Mock).mockImplementation((code) => Promise.resolve(`hashed-${code}`));

      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        backupCodes: ['hashed-1', 'hashed-2'],
      });

      const result = await service.regenerateBackupCodes(userId, validCode);

      expect(result.backupCodes).toHaveLength(8);
      
      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateCall.data.backupCodes).toHaveLength(8);
    });

    it('should throw BadRequestException with invalid code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TESTSECRETBASE32',
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.regenerateBackupCodes(userId, 'invalid-code')
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
