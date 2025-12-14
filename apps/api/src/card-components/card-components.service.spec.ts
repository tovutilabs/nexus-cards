import { Test, TestingModule } from '@nestjs/testing';
import { CardComponentsService } from './card-components.service';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidationService } from '../shared/services/revalidation.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ComponentType, SubscriptionTier } from '@prisma/client';

describe('CardComponentsService', () => {
  let service: CardComponentsService;
  let prisma: PrismaService;
  let revalidationService: RevalidationService;

  const mockPrismaService = {
    card: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    cardComponent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    tierComponentRule: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRevalidationService = {
    revalidateCard: jest.fn(),
  };

  const mockAnalyticsService = {
    logComponentAdded: jest.fn().mockResolvedValue(undefined),
    logComponentUpdated: jest.fn().mockResolvedValue(undefined),
    logComponentReordered: jest.fn().mockResolvedValue(undefined),
    logComponentRemoved: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    // Mock tier rules - comprehensive setup
    mockPrismaService.tierComponentRule.findMany.mockResolvedValue([
      // FREE tier
      { tier: SubscriptionTier.FREE, componentType: ComponentType.PROFILE },
      { tier: SubscriptionTier.FREE, componentType: ComponentType.ABOUT },
      { tier: SubscriptionTier.FREE, componentType: ComponentType.CONTACT },
      { tier: SubscriptionTier.FREE, componentType: ComponentType.SOCIAL_LINKS },
      { tier: SubscriptionTier.FREE, componentType: ComponentType.CUSTOM_LINKS },
      // PRO tier
      { tier: SubscriptionTier.PRO, componentType: ComponentType.PROFILE },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.ABOUT },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.CONTACT },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.SOCIAL_LINKS },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.CUSTOM_LINKS },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.GALLERY },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.VIDEO },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.CALENDAR },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.TESTIMONIALS },
      { tier: SubscriptionTier.PRO, componentType: ComponentType.SERVICES },
      // PREMIUM tier
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.PROFILE },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.ABOUT },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.CONTACT },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.SOCIAL_LINKS },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.CUSTOM_LINKS },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.GALLERY },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.VIDEO },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.CALENDAR },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.TESTIMONIALS },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.SERVICES },
      { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.FORM },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardComponentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RevalidationService,
          useValue: mockRevalidationService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    service = module.get<CardComponentsService>(CardComponentsService);
    prisma = module.get<PrismaService>(PrismaService);
    revalidationService = module.get<RevalidationService>(RevalidationService);

    // Initialize the service (load tier rules)
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a component successfully when under tier limit', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
        user: {
          id: 'user-1',
          subscription: {
            tier: SubscriptionTier.PRO,
          },
        },
        components: [{ id: 'comp-1' }],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue({ order: 1 });
      mockPrismaService.cardComponent.create.mockResolvedValue({
        id: 'component-1',
        cardId: 'card-1',
        type: ComponentType.ABOUT,
        order: 2,
        enabled: true,
        config: { text: 'About me' },
      });

      const dto = {
        type: ComponentType.ABOUT,
        config: { text: 'About me' },
      };

      const result = await service.create('card-1', 'user-1', dto);

      expect(result).toBeDefined();
      expect(result.type).toBe(ComponentType.ABOUT);
      expect(mockRevalidationService.revalidateCard).toHaveBeenCalledWith('test-card');
    });

    it('should throw ForbiddenException when user does not own card', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'different-user',
        slug: 'test-card',
        user: {
          subscription: { tier: SubscriptionTier.PRO },
        },
        components: [],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const dto = {
        type: ComponentType.ABOUT,
        config: { text: 'About me' },
      };

      await expect(service.create('card-1', 'user-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when tier limit exceeded', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
        user: {
          subscription: { tier: SubscriptionTier.PRO },
        },
        components: Array(8).fill({ id: 'comp' }),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const dto = {
        type: ComponentType.ABOUT,
        config: { text: 'About me' },
      };

      await expect(service.create('card-1', 'user-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when component type not allowed for tier', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
        user: {
          subscription: { tier: SubscriptionTier.FREE },
        },
        components: [],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const dto = {
        type: ComponentType.GALLERY,
        config: { images: [] },
      };

      await expect(service.create('card-1', 'user-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should allow PREMIUM component for PREMIUM user', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
        user: {
          subscription: { tier: SubscriptionTier.PREMIUM },
        },
        components: [],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(null);
      mockPrismaService.cardComponent.create.mockResolvedValue({
        id: 'component-1',
        cardId: 'card-1',
        type: ComponentType.FORM,
        order: 0,
        enabled: true,
        config: {},
      });

      const dto = {
        type: ComponentType.FORM,
        config: { fields: [] },
      };

      const result = await service.create('card-1', 'user-1', dto);

      expect(result).toBeDefined();
      expect(result.type).toBe(ComponentType.FORM);
    });
  });

  describe('update', () => {
    it('should update component config successfully', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
      };

      const mockComponent = {
        id: 'component-1',
        cardId: 'card-1',
        type: ComponentType.ABOUT,
        order: 1,
        enabled: true,
        config: { text: 'Old text' },
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(mockComponent);
      mockPrismaService.cardComponent.update.mockResolvedValue({
        ...mockComponent,
        config: { text: 'New text' },
      });

      const dto = {
        config: { text: 'New text' },
      };

      const result = await service.update('card-1', 'component-1', 'user-1', dto);

      expect(result.config).toEqual({ text: 'New text' });
      expect(mockRevalidationService.revalidateCard).toHaveBeenCalledWith('test-card');
    });

    it('should throw NotFoundException when component does not exist', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(null);

      const dto = {
        config: { text: 'New text' },
      };

      await expect(service.update('card-1', 'component-1', 'user-1', dto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user does not own card', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'different-user',
        slug: 'test-card',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const dto = {
        config: { text: 'New text' },
      };

      await expect(service.update('card-1', 'component-1', 'user-1', dto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('reorder', () => {
    it('should reorder components successfully with valid sequence', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
        components: [
          { id: 'comp-1', order: 0 },
          { id: 'comp-2', order: 1 },
          { id: 'comp-3', order: 2 },
        ],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.cardComponent.update.mockResolvedValue({});
      mockPrismaService.cardComponent.findMany.mockResolvedValue([
        { id: 'comp-3', order: 0 },
        { id: 'comp-1', order: 1 },
        { id: 'comp-2', order: 2 },
      ]);

      const dto = {
        components: [
          { id: 'comp-3', order: 0 },
          { id: 'comp-1', order: 1 },
          { id: 'comp-2', order: 2 },
        ],
      };

      await service.reorder('card-1', 'user-1', dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockRevalidationService.revalidateCard).toHaveBeenCalledWith('test-card');
    });

    it('should throw BadRequestException when component IDs do not match', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
        components: [
          { id: 'comp-1', order: 0 },
          { id: 'comp-2', order: 1 },
          { id: 'comp-3', order: 2 },
        ],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const dto = {
        components: [
          { id: 'comp-1', order: 0 },
          { id: 'comp-2', order: 1 },
          { id: 'wrong-id', order: 2 },
        ],
      };

      await expect(service.reorder('card-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user does not own card', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'different-user',
        slug: 'test-card',
        components: [],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const dto = {
        components: [],
      };

      await expect(service.reorder('card-1', 'user-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete component successfully', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
      };

      const mockComponent = {
        id: 'component-1',
        cardId: 'card-1',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(mockComponent);
      mockPrismaService.cardComponent.delete.mockResolvedValue(mockComponent);

      await service.remove('card-1', 'component-1', 'user-1');

      expect(mockPrismaService.cardComponent.delete).toHaveBeenCalledWith({
        where: { id: 'component-1' },
      });
      expect(mockRevalidationService.revalidateCard).toHaveBeenCalledWith('test-card');
    });

    it('should throw NotFoundException when component does not exist', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(null);

      await expect(service.remove('card-1', 'component-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user does not own card', async () => {
      const differentCard = {
        id: 'card-1',
        userId: 'different-user',
        slug: 'test-card',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(differentCard);

      await expect(service.remove('card-1', 'component-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findAll', () => {
    it('should return components ordered correctly', async () => {
      const mockComponents = [
        { id: 'comp-1', order: 0 },
        { id: 'comp-2', order: 1 },
        { id: 'comp-3', order: 2 },
      ];

      mockPrismaService.cardComponent.findMany.mockResolvedValue(mockComponents);

      const result = await service.findAll('card-1');

      expect(result).toEqual(mockComponents);
      expect(mockPrismaService.cardComponent.findMany).toHaveBeenCalledWith({
        where: { cardId: 'card-1' },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('update - locked components', () => {
    it('should throw ForbiddenException when updating config of locked component', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
      };

      const mockLockedComponent = {
        id: 'component-1',
        cardId: 'card-1',
        type: ComponentType.GALLERY,
        order: 1,
        enabled: true,
        locked: true,
        config: { images: [] },
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(mockLockedComponent);

      const dto = {
        config: { images: ['new-image.jpg'] },
      };

      await expect(service.update('card-1', 'component-1', 'user-1', dto)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow enabling/disabling locked component', async () => {
      const mockCard = {
        id: 'card-1',
        userId: 'user-1',
        slug: 'test-card',
      };

      const mockLockedComponent = {
        id: 'component-1',
        cardId: 'card-1',
        type: ComponentType.GALLERY,
        order: 1,
        enabled: true,
        locked: true,
        config: { images: [] },
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardComponent.findFirst.mockResolvedValue(mockLockedComponent);
      mockPrismaService.cardComponent.update.mockResolvedValue({
        ...mockLockedComponent,
        enabled: false,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        subscription: { tier: SubscriptionTier.FREE },
      });
      mockPrismaService.cardComponent.count.mockResolvedValue(1);

      const dto = {
        enabled: false,
      };

      const result = await service.update('card-1', 'component-1', 'user-1', dto);

      expect(result.enabled).toBe(false);
      expect(mockRevalidationService.revalidateCard).toHaveBeenCalledWith('test-card');
    });
  });

  describe('lockComponentsAfterDowngrade', () => {
    it('should lock premium components when user downgrades tier', async () => {
      const mockCards = [
        {
          id: 'card-1',
          userId: 'user-1',
          components: [
            {
              id: 'comp-1',
              type: ComponentType.ABOUT,
              locked: false,
            },
            {
              id: 'comp-2',
              type: ComponentType.GALLERY,
              locked: false,
            },
            {
              id: 'comp-3',
              type: ComponentType.FORM,
              locked: false,
            },
          ],
        },
      ];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);
      mockPrismaService.cardComponent.update.mockResolvedValue({});

      const lockedCount = await service.lockComponentsAfterDowngrade('user-1', SubscriptionTier.FREE);

      // GALLERY and FORM should be locked (not available in FREE tier)
      expect(lockedCount).toBe(2);
      expect(mockPrismaService.cardComponent.update).toHaveBeenCalledTimes(2);
    });

    it('should not lock already locked components', async () => {
      const mockCards = [
        {
          id: 'card-1',
          userId: 'user-1',
          components: [
            {
              id: 'comp-1',
              type: ComponentType.GALLERY,
              locked: true,
            },
          ],
        },
      ];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const lockedCount = await service.lockComponentsAfterDowngrade('user-1', SubscriptionTier.FREE);

      expect(lockedCount).toBe(0);
      expect(mockPrismaService.cardComponent.update).not.toHaveBeenCalled();
    });

    it('should not lock components that are still allowed at new tier', async () => {
      const mockCards = [
        {
          id: 'card-1',
          userId: 'user-1',
          components: [
            {
              id: 'comp-1',
              type: ComponentType.ABOUT,
              locked: false,
            },
            {
              id: 'comp-2',
              type: ComponentType.PROFILE,
              locked: false,
            },
          ],
        },
      ];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const lockedCount = await service.lockComponentsAfterDowngrade('user-1', SubscriptionTier.FREE);

      // Both components are available in FREE tier
      expect(lockedCount).toBe(0);
      expect(mockPrismaService.cardComponent.update).not.toHaveBeenCalled();
    });
  });
});
