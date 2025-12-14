import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cardTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    card: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('archive', () => {
    it('should archive a template', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        usageCount: 5,
        isArchived: false,
      };

      mockPrismaService.cardTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.cardTemplate.update.mockResolvedValue({
        ...mockTemplate,
        isArchived: true,
        isActive: false,
      });

      const result = await service.archive('template-1');

      expect(mockPrismaService.cardTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: {
          isArchived: true,
          isActive: false,
        },
      });
      expect(result.isArchived).toBe(true);
    });
  });

  describe('delete', () => {
    it('should prevent hard delete if template is in use', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        usageCount: 5,
      };

      mockPrismaService.cardTemplate.findUnique.mockResolvedValue(mockTemplate);

      await expect(service.delete('template-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow hard delete if template has no usage', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        usageCount: 0,
      };

      mockPrismaService.cardTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.cardTemplate.delete.mockResolvedValue(mockTemplate);

      await service.delete('template-1');

      expect(mockPrismaService.cardTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all templates for PREMIUM users', async () => {
      const mockTemplates = [
        { id: '1', name: 'Free Template', minTier: SubscriptionTier.FREE, isActive: true },
        { id: '2', name: 'Pro Template', minTier: SubscriptionTier.PRO, isActive: true },
        { id: '3', name: 'Premium Template', minTier: SubscriptionTier.PREMIUM, isActive: true },
      ];

      mockPrismaService.cardTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll(SubscriptionTier.PREMIUM);

      expect(result).toEqual(mockTemplates);
      expect(mockPrismaService.cardTemplate.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { minTier: SubscriptionTier.FREE },
            { minTier: SubscriptionTier.PRO },
            { minTier: SubscriptionTier.PREMIUM },
          ],
        },
        orderBy: [{ isFeatured: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter templates by category', async () => {
      const mockTemplates = [
        { id: '1', name: 'Tech Template', category: 'TECH', isActive: true },
      ];

      mockPrismaService.cardTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll(SubscriptionTier.FREE, 'TECH');

      expect(result).toEqual(mockTemplates);
      expect(mockPrismaService.cardTemplate.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category: 'TECH',
          OR: [{ minTier: SubscriptionTier.FREE }],
        },
        orderBy: [{ isFeatured: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter templates for FREE users', async () => {
      const mockTemplates = [
        { id: '1', name: 'Free Template', minTier: SubscriptionTier.FREE, isActive: true },
      ];

      mockPrismaService.cardTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll(SubscriptionTier.FREE);

      expect(mockPrismaService.cardTemplate.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [{ minTier: SubscriptionTier.FREE }],
        },
        orderBy: [{ isFeatured: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter templates for PRO users', async () => {
      const mockTemplates = [
        { id: '1', name: 'Free Template', minTier: SubscriptionTier.FREE, isActive: true },
        { id: '2', name: 'Pro Template', minTier: SubscriptionTier.PRO, isActive: true },
      ];

      mockPrismaService.cardTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll(SubscriptionTier.PRO);

      expect(mockPrismaService.cardTemplate.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { minTier: SubscriptionTier.FREE },
            { minTier: SubscriptionTier.PRO },
          ],
        },
        orderBy: [{ isFeatured: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('canAccessTemplate', () => {
    it('should allow FREE users to access FREE templates', () => {
      expect(service.canAccessTemplate(SubscriptionTier.FREE, SubscriptionTier.FREE)).toBe(true);
    });

    it('should deny FREE users access to PRO templates', () => {
      expect(service.canAccessTemplate(SubscriptionTier.FREE, SubscriptionTier.PRO)).toBe(false);
    });

    it('should deny FREE users access to PREMIUM templates', () => {
      expect(service.canAccessTemplate(SubscriptionTier.FREE, SubscriptionTier.PREMIUM)).toBe(false);
    });

    it('should allow PRO users to access FREE and PRO templates', () => {
      expect(service.canAccessTemplate(SubscriptionTier.PRO, SubscriptionTier.FREE)).toBe(true);
      expect(service.canAccessTemplate(SubscriptionTier.PRO, SubscriptionTier.PRO)).toBe(true);
    });

    it('should deny PRO users access to PREMIUM templates', () => {
      expect(service.canAccessTemplate(SubscriptionTier.PRO, SubscriptionTier.PREMIUM)).toBe(false);
    });

    it('should allow PREMIUM users to access all templates', () => {
      expect(service.canAccessTemplate(SubscriptionTier.PREMIUM, SubscriptionTier.FREE)).toBe(true);
      expect(service.canAccessTemplate(SubscriptionTier.PREMIUM, SubscriptionTier.PRO)).toBe(true);
      expect(service.canAccessTemplate(SubscriptionTier.PREMIUM, SubscriptionTier.PREMIUM)).toBe(true);
    });
  });

  describe('applyTemplateToCard', () => {
    const mockCard = {
      id: 'card-1',
      userId: 'user-1',
      slug: 'test-card',
      firstName: 'John',
      lastName: 'Doe',
      user: {
        subscription: {
          tier: SubscriptionTier.FREE,
        },
      },
    };

    const mockTemplate = {
      id: 'template-1',
      name: 'Modern Tech',
      slug: 'modern-tech',
      minTier: SubscriptionTier.FREE,
      config: {
        colorScheme: { primary: '#3b82f6', secondary: '#1e40af' },
        typography: { fontFamily: 'Inter', fontSize: 'base' },
        layout: { type: 'vertical', spacing: 'comfortable' },
        borderRadius: 'lg',
        shadow: 'md',
      },
      usageCount: 10,
    };

    it('should apply template to card successfully', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCard,
        templateId: mockTemplate.id,
        fontFamily: 'Inter',
        fontSize: 'base',
        layout: 'vertical',
        borderRadius: 'lg',
        shadowPreset: 'md',
      });
      mockPrismaService.cardTemplate.update.mockResolvedValue({
        ...mockTemplate,
        usageCount: 11,
      });

      const result = await service.applyTemplateToCard(
        'card-1',
        'template-1',
        'user-1'
      );

      expect(result.templateId).toBe('template-1');
      expect(mockPrismaService.cardTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { usageCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(
        service.applyTemplateToCard('card-1', 'template-1', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue({
        ...mockCard,
        userId: 'different-user',
      });

      await expect(
        service.applyTemplateToCard('card-1', 'template-1', 'user-1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.applyTemplateToCard('card-1', 'template-1', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user tier insufficient', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        minTier: SubscriptionTier.PREMIUM,
      });

      await expect(
        service.applyTemplateToCard('card-1', 'template-1', 'user-1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateCardCustomCss', () => {
    const mockCardPremium = {
      id: 'card-1',
      userId: 'user-1',
      slug: 'test-card',
      firstName: 'John',
      lastName: 'Doe',
      user: {
        subscription: {
          tier: SubscriptionTier.PREMIUM,
        },
      },
    };

    const mockCardPro = {
      ...mockCardPremium,
      user: {
        subscription: {
          tier: SubscriptionTier.PRO,
        },
      },
    };

    it('should update card custom CSS for PREMIUM users', async () => {
      const safeCss = '.card { color: #333; }';
      mockPrismaService.card.findUnique.mockResolvedValue(mockCardPremium);
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCardPremium,
        customCss: safeCss,
      });

      const result = await service.updateCardCustomCss(
        'card-1',
        'user-1',
        safeCss
      );

      expect(result.customCss).toBe(safeCss);
      expect(mockPrismaService.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: { customCss: safeCss },
      });
    });

    it('should throw ForbiddenException for non-PREMIUM users', async () => {
      const safeCss = '.card { color: #333; }';
      mockPrismaService.card.findUnique.mockResolvedValue(mockCardPro);

      await expect(
        service.updateCardCustomCss('card-1', 'user-1', safeCss)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should clear custom CSS when empty string provided', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCardPremium);
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCardPremium,
        customCss: '',
      });

      const result = await service.updateCardCustomCss(
        'card-1',
        'user-1',
        ''
      );

      expect(result.customCss).toBe('');
      expect(mockPrismaService.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: { customCss: '' },
      });
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCardCustomCss('card-1', 'user-1', '.card {}')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue({
        ...mockCardPremium,
        userId: 'different-user',
      });

      await expect(
        service.updateCardCustomCss('card-1', 'user-1', '.card {}')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should strip dangerous CSS patterns instead of rejecting', async () => {
      const dangerousCss = '@import url("evil.css"); .card { color: red; }';
      mockPrismaService.card.findUnique.mockResolvedValue(mockCardPremium);
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCardPremium,
        customCss: '.card { color: red; }',
      });

      const result = await service.updateCardCustomCss(
        'card-1',
        'user-1',
        dangerousCss
      );

      expect(result.customCss).not.toContain('@import');
      expect(result.customCss).toContain('.card');
    });
  });
});
