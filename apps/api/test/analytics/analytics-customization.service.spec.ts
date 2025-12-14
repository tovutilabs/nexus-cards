import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsRepository } from '../analytics.repository';

describe('AnalyticsService - Customization Events', () => {
  let service: AnalyticsService;
  let repository: AnalyticsRepository;

  const mockRepository = {
    logEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get<AnalyticsRepository>(AnalyticsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logCustomizationEvent', () => {
    it('should log a generic customization event', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        eventType: 'CUSTOMIZATION_SESSION_STARTED',
        metadata: {},
      };

      await service.logCustomizationEvent(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'CUSTOMIZATION_SESSION_STARTED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {},
      });
    });

    it('should include metadata in the event', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        eventType: 'COMPONENT_ADDED',
        metadata: {
          componentId: 'comp-789',
          componentType: 'SOCIAL_LINKS',
          tier: 'PRO',
        },
      };

      await service.logCustomizationEvent(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'COMPONENT_ADDED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          componentId: 'comp-789',
          componentType: 'SOCIAL_LINKS',
          tier: 'PRO',
        },
      });
    });
  });

  describe('logComponentAdded', () => {
    it('should log component added event with correct metadata', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        componentId: 'comp-789',
        componentType: 'SOCIAL_LINKS',
        tier: 'FREE',
        componentCount: 3,
        source: 'palette',
      };

      await service.logComponentAdded(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'COMPONENT_ADDED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          componentId: 'comp-789',
          componentType: 'SOCIAL_LINKS',
          tier: 'FREE',
          componentCount: 3,
          source: 'palette',
        },
      });
    });
  });

  describe('logComponentRemoved', () => {
    it('should log component removed event', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        componentId: 'comp-789',
        componentType: 'VIDEO',
        tier: 'PRO',
        componentCount: 2,
      };

      await service.logComponentRemoved(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'COMPONENT_REMOVED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          componentId: 'comp-789',
          componentType: 'VIDEO',
          tier: 'PRO',
          componentCount: 2,
        },
      });
    });
  });

  describe('logComponentUpdated', () => {
    it('should log component updated event with change flags', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        componentId: 'comp-789',
        componentType: 'TEXT_BLOCK',
        tier: 'PREMIUM',
        configChanged: true,
        stylingChanged: false,
        enabledChanged: false,
      };

      await service.logComponentUpdated(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'COMPONENT_UPDATED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          componentId: 'comp-789',
          componentType: 'TEXT_BLOCK',
          tier: 'PREMIUM',
          configChanged: true,
          stylingChanged: false,
          enabledChanged: false,
        },
      });
    });
  });

  describe('logComponentReordered', () => {
    it('should log component reordered event', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        tier: 'FREE',
        componentCount: 5,
        reorderCount: 3,
      };

      await service.logComponentReordered(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'COMPONENT_REORDERED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          tier: 'FREE',
          componentCount: 5,
          reorderCount: 3,
        },
      });
    });
  });

  describe('logTemplateApplied', () => {
    it('should log template applied event with template metadata', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        templateId: 'template-789',
        templateSlug: 'modern-professional',
        templateCategory: 'Professional',
        templateTier: 'PRO',
        userTier: 'PREMIUM',
        previousTemplateId: 'template-000',
      };

      await service.logTemplateApplied(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'CARD_TEMPLATE_APPLIED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          templateId: 'template-789',
          templateSlug: 'modern-professional',
          templateCategory: 'Professional',
          templateTier: 'PRO',
          userTier: 'PREMIUM',
          previousTemplateId: 'template-000',
        },
      });
    });

    it('should handle missing previousTemplateId', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        templateId: 'template-789',
        templateSlug: 'minimal-clean',
        templateCategory: 'Minimal',
        templateTier: 'FREE',
        userTier: 'FREE',
      };

      await service.logTemplateApplied(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'CARD_TEMPLATE_APPLIED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          templateId: 'template-789',
          templateSlug: 'minimal-clean',
          templateCategory: 'Minimal',
          templateTier: 'FREE',
          userTier: 'FREE',
        },
      });
    });
  });

  describe('logStylingUpdated', () => {
    it('should log styling updated event with change flags', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        tier: 'PRO',
        changedFields: ['backgroundColor', 'fontFamily', 'layout'],
        backgroundTypeChanged: true,
        layoutChanged: true,
        typographyChanged: true,
      };

      await service.logStylingUpdated(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'CARD_STYLING_UPDATED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          tier: 'PRO',
          changedFields: ['backgroundColor', 'fontFamily', 'layout'],
          backgroundTypeChanged: true,
          layoutChanged: true,
          typographyChanged: true,
        },
      });
    });
  });

  describe('logCustomCssUpdated', () => {
    it('should log custom CSS updated event', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        tier: 'PREMIUM',
        cssLength: 450,
        hasCustomCss: true,
      };

      await service.logCustomCssUpdated(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'CARD_CUSTOM_CSS_UPDATED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          tier: 'PREMIUM',
          cssLength: 450,
          hasCustomCss: true,
        },
      });
    });

    it('should handle CSS removal (empty CSS)', async () => {
      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        tier: 'PREMIUM',
        cssLength: 0,
        hasCustomCss: false,
      };

      await service.logCustomCssUpdated(payload);

      expect(mockRepository.logEvent).toHaveBeenCalledWith({
        eventType: 'CARD_CUSTOM_CSS_UPDATED',
        userId: 'user-123',
        cardId: 'card-456',
        metadata: {
          tier: 'PREMIUM',
          cssLength: 0,
          hasCustomCss: false,
        },
      });
    });
  });

  describe('error handling', () => {
    it('should not throw when repository.logEvent fails', async () => {
      mockRepository.logEvent.mockRejectedValue(new Error('Database error'));

      const payload = {
        userId: 'user-123',
        cardId: 'card-456',
        componentId: 'comp-789',
        componentType: 'SOCIAL_LINKS',
        tier: 'FREE',
        componentCount: 3,
        source: 'palette',
      };

      // Should not throw - analytics failures are non-blocking
      await expect(service.logComponentAdded(payload)).resolves.not.toThrow();
    });
  });
});
