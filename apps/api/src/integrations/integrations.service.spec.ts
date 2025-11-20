import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../auth/crypto.service';
import { IntegrationProvider } from '@prisma/client';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let prisma: PrismaService;
  let crypto: CryptoService;

  const mockIntegration = {
    id: 'integration-1',
    userId: 'user-1',
    provider: IntegrationProvider.SALESFORCE,
    status: 'ACTIVE',
    credentials: 'encrypted_data',
    settings: {},
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    integration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCrypto = {
    encrypt: jest.fn((data) => `encrypted_${data}`),
    decrypt: jest.fn((data) => data.replace('encrypted_', '')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CryptoService,
          useValue: mockCrypto,
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    prisma = module.get<PrismaService>(PrismaService);
    crypto = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connectIntegration', () => {
    it('should create a new integration', async () => {
      const dto = {
        provider: IntegrationProvider.SALESFORCE,
        credentials: { accessToken: 'token', instanceUrl: 'https://test.salesforce.com' },
      };

      mockPrisma.integration.findFirst.mockResolvedValue(null);
      mockPrisma.integration.create.mockResolvedValue(mockIntegration);

      const result = await service.connectIntegration('user-1', dto);

      expect(result).toEqual(mockIntegration);
      expect(mockCrypto.encrypt).toHaveBeenCalled();
      expect(mockPrisma.integration.create).toHaveBeenCalled();
    });

    it('should update existing integration', async () => {
      const dto = {
        provider: IntegrationProvider.SALESFORCE,
        credentials: { accessToken: 'new-token' },
      };

      mockPrisma.integration.findFirst.mockResolvedValue(mockIntegration);
      mockPrisma.integration.update.mockResolvedValue({ ...mockIntegration });

      const result = await service.connectIntegration('user-1', dto);

      expect(mockPrisma.integration.update).toHaveBeenCalled();
    });
  });

  describe('disconnectIntegration', () => {
    it('should delete an integration', async () => {
      mockPrisma.integration.findFirst.mockResolvedValue(mockIntegration);
      mockPrisma.integration.delete.mockResolvedValue(mockIntegration);

      await service.disconnectIntegration('user-1', IntegrationProvider.SALESFORCE);

      expect(mockPrisma.integration.delete).toHaveBeenCalled();
    });

    it('should throw if integration not found', async () => {
      mockPrisma.integration.findFirst.mockResolvedValue(null);

      await expect(
        service.disconnectIntegration('user-1', IntegrationProvider.SALESFORCE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listIntegrations', () => {
    it('should return decrypted integrations', async () => {
      mockPrisma.integration.findMany.mockResolvedValue([mockIntegration]);

      const result = await service.listIntegrations('user-1');

      expect(result.length).toBe(1);
      expect(mockCrypto.decrypt).toHaveBeenCalled();
    });
  });

  describe('syncContacts', () => {
    it('should sync Salesforce contacts', async () => {
      mockPrisma.integration.findFirst.mockResolvedValue(mockIntegration);

      const result = await service.syncContacts('user-1', IntegrationProvider.SALESFORCE);

      expect(result).toHaveProperty('message');
    });

    it('should throw if integration not found', async () => {
      mockPrisma.integration.findFirst.mockResolvedValue(null);

      await expect(
        service.syncContacts('user-1', IntegrationProvider.SALESFORCE),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
