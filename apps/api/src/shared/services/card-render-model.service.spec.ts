import { Test, TestingModule } from '@nestjs/testing';
import { CardRenderModelService } from './card-render-model.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CardRenderModelService', () => {
  let service: CardRenderModelService;
  let prisma: PrismaService;

  const mockPrismaService = {
    card: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardRenderModelService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CardRenderModelService>(CardRenderModelService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildRenderModel', () => {
    it('should build render model with identity header', async () => {
      const mockCard = {
        id: 'card-1',
        slug: 'john-doe',
        status: 'PUBLISHED',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        bio: 'Passionate developer',
        phone: '+1234567890',
        email: 'john@example.com',
        website: 'https://johndoe.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        logoUrl: 'https://example.com/logo.png',
        socialLinks: { twitter: 'johndoe', linkedin: 'johndoe' },
        templateId: 'template-1',
        template: null,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        backgroundImage: null,
        layout: 'vertical',
        fontFamily: 'inter',
        fontSize: 'base',
        borderRadius: 'md',
        shadowPreset: 'sm',
        customCss: null,
        theme: null,
        components: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.buildRenderModel('john-doe');

      expect(result.identityHeader).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        bio: 'Passionate developer',
        phone: '+1234567890',
        email: 'john@example.com',
        website: 'https://johndoe.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        logoUrl: 'https://example.com/logo.png',
        socialLinks: { twitter: 'johndoe', linkedin: 'johndoe' },
      });
    });

    it('should include ordered enabled components', async () => {
      const mockCard = {
        id: 'card-1',
        slug: 'john-doe',
        status: 'PUBLISHED',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: null,
        company: null,
        bio: null,
        phone: null,
        email: null,
        website: null,
        avatarUrl: null,
        coverImageUrl: null,
        logoUrl: null,
        socialLinks: {},
        templateId: null,
        template: null,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        backgroundImage: null,
        layout: 'vertical',
        fontFamily: 'inter',
        fontSize: 'base',
        borderRadius: 'md',
        shadowPreset: 'sm',
        customCss: null,
        theme: null,
        components: [
          {
            id: 'comp-1',
            type: 'ABOUT',
            order: 1,
            enabled: true,
            locked: false,
            config: { text: 'About me' },
            backgroundType: null,
            backgroundColor: null,
            backgroundImage: null,
          },
          {
            id: 'comp-2',
            type: 'CONTACT',
            order: 2,
            enabled: true,
            locked: true,
            config: { showEmail: true },
            backgroundType: null,
            backgroundColor: null,
            backgroundImage: null,
          },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.buildRenderModel('john-doe');

      expect(result.components).toHaveLength(2);
      expect(result.components[0]).toMatchObject({
        id: 'comp-1',
        type: 'ABOUT',
        order: 1,
        enabled: true,
        locked: false,
      });
      expect(result.components[1]).toMatchObject({
        id: 'comp-2',
        type: 'CONTACT',
        order: 2,
        enabled: true,
        locked: true,
      });
    });

    it('should derive styling from template and card overrides', async () => {
      const mockCard = {
        id: 'card-1',
        slug: 'john-doe',
        status: 'PUBLISHED',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: null,
        company: null,
        bio: null,
        phone: null,
        email: null,
        website: null,
        avatarUrl: null,
        coverImageUrl: null,
        logoUrl: null,
        socialLinks: {},
        templateId: 'template-1',
        template: {
          id: 'template-1',
          config: {
            colorScheme: {
              background: '#f0f0f0',
            },
            typography: {
              fontFamily: 'roboto',
            },
            layout: 'horizontal',
          },
        },
        backgroundType: 'solid',
        backgroundColor: '#000000',
        backgroundImage: null,
        layout: 'horizontal',
        fontFamily: 'arial',
        fontSize: 'lg',
        borderRadius: 'rounded',
        shadowPreset: 'medium',
        customCss: '.card { padding: 20px; }',
        theme: null,
        components: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.buildRenderModel('john-doe');

      expect(result.styling.backgroundColor).toBe('#000000');
      expect(result.styling.fontFamily).toBe('arial');
      expect(result.styling.fontSize).toBe('lg');
      expect(result.styling.layout).toBe('horizontal');
      expect(result.styling.customCss).toBe('.card { padding: 20px; }');
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.buildRenderModel('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException for unpublished card in public context', async () => {
      const mockCard = {
        id: 'card-1',
        slug: 'john-doe',
        status: 'DRAFT',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: null,
        company: null,
        bio: null,
        phone: null,
        email: null,
        website: null,
        avatarUrl: null,
        coverImageUrl: null,
        logoUrl: null,
        socialLinks: {},
        templateId: null,
        template: null,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        backgroundImage: null,
        layout: 'vertical',
        fontFamily: 'inter',
        fontSize: 'base',
        borderRadius: 'md',
        shadowPreset: 'sm',
        customCss: null,
        theme: null,
        components: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      await expect(
        service.buildRenderModel('john-doe', { isPublic: true })
      ).rejects.toThrow('not available for public viewing');
    });

    it('should allow unpublished card in private context', async () => {
      const mockCard = {
        id: 'card-1',
        slug: 'john-doe',
        status: 'DRAFT',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: null,
        company: null,
        bio: null,
        phone: null,
        email: null,
        website: null,
        avatarUrl: null,
        coverImageUrl: null,
        logoUrl: null,
        socialLinks: {},
        templateId: null,
        template: null,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        backgroundImage: null,
        layout: 'vertical',
        fontFamily: 'inter',
        fontSize: 'base',
        borderRadius: 'md',
        shadowPreset: 'sm',
        customCss: null,
        theme: null,
        components: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.buildRenderModel('john-doe', {
        isPublic: false,
      });

      expect(result.status).toBe('DRAFT');
    });
  });

  describe('buildPublicRenderModel', () => {
    it('should call buildRenderModel with isPublic flag', async () => {
      const mockCard = {
        id: 'card-1',
        slug: 'john-doe',
        status: 'PUBLISHED',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: null,
        company: null,
        bio: null,
        phone: null,
        email: null,
        website: null,
        avatarUrl: null,
        coverImageUrl: null,
        logoUrl: null,
        socialLinks: {},
        templateId: null,
        template: null,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        backgroundImage: null,
        layout: 'vertical',
        fontFamily: 'inter',
        fontSize: 'base',
        borderRadius: 'md',
        shadowPreset: 'sm',
        customCss: null,
        theme: null,
        components: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.buildPublicRenderModel('john-doe');

      expect(result.id).toBe('card-1');
      expect(result.status).toBe('PUBLISHED');
    });
  });
});
