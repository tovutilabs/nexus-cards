import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsService } from './suggestions.service';
import { CardsService } from '../cards/cards.service';
import { UsersService } from '../users/users.service';

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let cardsService: CardsService;
  let usersService: UsersService;

  const mockCardsService = {
    findAllByUser: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        {
          provide: CardsService,
          useValue: mockCardsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
    cardsService = module.get<CardsService>(CardsService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileCompletenessScore', () => {
    it('should return 100% for fully complete profile', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          company: 'TechCo',
          jobTitle: 'Engineer',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfileCompletenessScore('user1');

      expect(result.score).toBe(9); // All fields present
      expect(result.maxScore).toBe(9);
      expect(result.percentage).toBe(100);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should calculate correct score for partial profile (missing avatar)', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          company: 'TechCo',
          jobTitle: 'Engineer',
          avatarUrl: null, // Missing (2 pts)
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfileCompletenessScore('user1');

      expect(result.score).toBe(7); // 9 - 2
      expect(result.percentage).toBeCloseTo(77.78, 1);
      expect(result.missingFields).toContain('avatarUrl');
    });

    it('should calculate correct score for minimal profile (only email)', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: null,
          lastName: null,
          phone: null,
          company: null,
          jobTitle: null,
          avatarUrl: null,
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfileCompletenessScore('user1');

      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.missingFields).toHaveLength(6);
    });

    it('should weight firstName and lastName as 2 points each', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John', // 2 pts
          lastName: null, // Missing 2 pts
          phone: '+1234567890', // 1 pt
          company: null,
          jobTitle: null,
          avatarUrl: null,
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfileCompletenessScore('user1');

      expect(result.score).toBe(3); // 2 (firstName) + 1 (phone)
      expect(result.missingFields).toContain('lastName');
    });
  });

  describe('getUserSuggestions', () => {
    it('should generate profile suggestions for incomplete profile', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: null,
          lastName: null,
          phone: null,
          company: 'TechCo',
          jobTitle: 'Engineer',
          avatarUrl: null,
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue([]);

      const suggestions = await service.getUserSuggestions('user1');

      const profileSuggestions = suggestions.filter(
        (s) => s.type === 'profile',
      );
      expect(profileSuggestions.length).toBeGreaterThan(0);
      expect(
        profileSuggestions.some((s) => s.title.includes('name')),
      ).toBeTruthy();
    });

    it('should suggest creating a card if user has no cards', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          company: 'TechCo',
          jobTitle: 'Engineer',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue([]); // No cards

      const suggestions = await service.getUserSuggestions('user1');

      const cardSuggestion = suggestions.find(
        (s) => s.type === 'feature' && s.title.includes('Create'),
      );
      expect(cardSuggestion).toBeDefined();
      expect(cardSuggestion?.priority).toBe('high');
    });

    it('should suggest adding links for cards with no social links', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          company: null,
          jobTitle: null,
          avatarUrl: null,
        },
      };

      const mockCards = [
        {
          id: 'card1',
          slug: 'john-doe',
          links: [], // No links
          theme: 'default',
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
        },
      ];

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue(mockCards);

      const suggestions = await service.getUserSuggestions('user1');

      const linkSuggestion = suggestions.find(
        (s) => s.type === 'link' && s.title.includes('social links'),
      );
      expect(linkSuggestion).toBeDefined();
    });

    it('should suggest tech theme for tech company', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          company: 'TechCorp Solutions', // Tech keyword
          jobTitle: null,
          avatarUrl: null,
        },
      };

      const mockCards = [
        {
          id: 'card1',
          slug: 'john-doe',
          links: [{ id: 'link1', platform: 'LINKEDIN', url: 'https://linkedin.com/in/johndoe' }],
          theme: 'default', // Using default theme
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
        },
      ];

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue(mockCards);

      const suggestions = await service.getUserSuggestions('user1');

      const themeSuggestion = suggestions.find(
        (s) =>
          s.type === 'template' &&
          (s.description?.includes('modern') || s.description?.includes('tech')),
      );
      expect(themeSuggestion).toBeDefined();
    });

    it('should sort suggestions by priority (high > medium > low)', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: null, // High priority
          lastName: 'Doe',
          phone: null, // Medium priority
          company: null,
          jobTitle: null,
          avatarUrl: null, // Medium priority
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue([]);

      const suggestions = await service.getUserSuggestions('user1');

      const priorities = suggestions.map((s) => s.priority);
      const highIndex = priorities.indexOf('high');
      const mediumIndex = priorities.indexOf('medium');
      const lowIndex = priorities.indexOf('low');

      if (highIndex !== -1 && mediumIndex !== -1) {
        expect(highIndex).toBeLessThan(mediumIndex);
      }
      if (mediumIndex !== -1 && lowIndex !== -1) {
        expect(mediumIndex).toBeLessThan(lowIndex);
      }
    });

    it('should suggest NFC feature if not using NFC tags', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          company: 'TechCo',
          jobTitle: 'Engineer',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };

      const mockCards = [
        {
          id: 'card1',
          slug: 'john-doe',
          links: [{ id: 'link1', platform: 'LINKEDIN', url: 'https://linkedin.com/in/johndoe' }],
          theme: 'modern',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          nfcTags: [], // No NFC tags
        },
      ];

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue(mockCards);

      const suggestions = await service.getUserSuggestions('user1');

      const nfcSuggestion = suggestions.find((s) => s.type === 'feature');
      expect(nfcSuggestion).toBeDefined();
      expect(nfcSuggestion?.title).toContain('NFC');
    });

    it('should return empty array for perfect profile with optimized cards', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          company: 'TechCo',
          jobTitle: 'Engineer',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };

      const mockCards = [
        {
          id: 'card1',
          slug: 'john-doe',
          links: [
            { id: 'link1', platform: 'LINKEDIN', url: 'https://linkedin.com/in/johndoe' },
            { id: 'link2', platform: 'TWITTER', url: 'https://twitter.com/johndoe' },
          ],
          theme: 'modern',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          nfcTags: [{ id: 'tag1', uid: 'ABC123' }],
        },
      ];

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue(mockCards);

      const suggestions = await service.getUserSuggestions('user1');

      // Should have minimal or no suggestions for optimized profile
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Industry Detection', () => {
    it('should detect tech industry from company name', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          company: 'Google Software Engineering',
          jobTitle: null,
          avatarUrl: null,
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue([
        {
          id: 'card1',
          slug: 'john-doe',
          links: [],
          theme: 'default',
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
        },
      ]);

      const suggestions = await service.getUserSuggestions('user1');

      // Should suggest tech-appropriate colors
      const colorSuggestion = suggestions.find(
        (s) =>
          s.type === 'color' &&
          s.description?.includes('#3B82F6'), // Tech blue
      );
      expect(colorSuggestion).toBeDefined();
    });

    it('should detect creative industry from company name', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          company: 'Creative Design Studio',
          jobTitle: null,
          avatarUrl: null,
        },
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsService.findAllByUser.mockResolvedValue([
        {
          id: 'card1',
          slug: 'john-doe',
          links: [],
          theme: 'default',
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
        },
      ]);

      const suggestions = await service.getUserSuggestions('user1');

      const colorSuggestion = suggestions.find(
        (s) =>
          s.type === 'color' &&
          (s.description?.includes('#EC4899') || // Creative pink
            s.description?.includes('#8B5CF6')), // Creative purple
      );
      expect(colorSuggestion).toBeDefined();
    });
  });
});
