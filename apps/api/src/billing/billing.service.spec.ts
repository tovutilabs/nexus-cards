import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: PrismaService; // eslint-disable-line @typescript-eslint/no-unused-vars
  let configService: ConfigService; // eslint-disable-line @typescript-eslint/no-unused-vars

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Default: Stripe configured
    mockConfigService.get.mockReturnValue('sk_test_mock_stripe_key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should throw error when Stripe not configured', async () => {
      mockConfigService.get.mockReturnValue(null);

      // Recreate service with no Stripe key
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BillingService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const testService = module.get<BillingService>(BillingService);

      await expect(
        testService.createCheckoutSession(
          'user-1',
          SubscriptionTier.PRO,
          'http://success',
          'http://cancel'
        )
      ).rejects.toThrow('Stripe not configured');
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(
          'nonexistent',
          SubscriptionTier.PRO,
          'http://success',
          'http://cancel'
        )
      ).rejects.toThrow('User not found');
    });
  });

  describe('handleWebhook', () => {
    it('should throw error when Stripe not configured', async () => {
      mockConfigService.get.mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BillingService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const testService = module.get<BillingService>(BillingService);

      await expect(
        testService.handleWebhook('sig', Buffer.from('{}'))
      ).rejects.toThrow('Stripe not configured');
    });
  });

  describe('cancelSubscription', () => {
    it('should throw error when Stripe not configured', async () => {
      mockConfigService.get.mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BillingService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const testService = module.get<BillingService>(BillingService);

      await expect(testService.cancelSubscription('user-1')).rejects.toThrow(
        'Stripe not configured'
      );
    });
  });

  describe('getSubscriptionUsage', () => {
    it('should return subscription usage data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        subscription: {
          tier: SubscriptionTier.PRO,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
        },
        _count: {
          cards: 3,
          contacts: 150,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getSubscriptionUsage('user-1');

      expect(result).toMatchObject({
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        cardsUsed: 3,
        contactsUsed: 150,
      });
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getSubscriptionUsage('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });
  });
});
