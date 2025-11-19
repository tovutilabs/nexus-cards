import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsRepository } from './cards.repository';
import { UsersService } from '../users/users.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

describe('CardsService', () => {
  let service: CardsService;
  let _repository: CardsRepository;
  let _usersService: UsersService;

  const mockCardsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    countByUserId: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: CardsRepository,
          useValue: mockCardsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    _repository = module.get<CardsRepository>(CardsRepository);
    _usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a card successfully', async () => {
      const userId = 'user-1';
      const createCardDto: CreateCardDto = {
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const mockUser = {
        id: userId,
        subscriptionTier: 'FREE',
      };

      const mockCard = {
        id: 'card-1',
        userId,
        slug: 'my-business-card-abc123',
        ...createCardDto,
        createdAt: new Date(),
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsRepository.countByUserId.mockResolvedValue(0);
      mockCardsRepository.create.mockResolvedValue(mockCard);

      const result = await service.create(userId, createCardDto);

      expect(result).toEqual(mockCard);
      expect(mockCardsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          firstName: createCardDto.firstName,
          lastName: createCardDto.lastName,
          slug: expect.any(String),
        })
      );
    });

    it('should enforce FREE tier card limit (1 card)', async () => {
      const userId = 'user-1';
      const createCardDto: CreateCardDto = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        id: userId,
        subscriptionTier: 'FREE',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsRepository.countByUserId.mockResolvedValue(1);

      await expect(service.create(userId, createCardDto)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockCardsRepository.create).not.toHaveBeenCalled();
    });

    it('should enforce PRO tier card limit (5 cards)', async () => {
      const userId = 'user-2';
      const createCardDto: CreateCardDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockUser = {
        id: userId,
        subscriptionTier: 'PRO',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsRepository.countByUserId.mockResolvedValue(5);

      await expect(service.create(userId, createCardDto)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockCardsRepository.create).not.toHaveBeenCalled();
    });

    it('should allow unlimited cards for PREMIUM tier', async () => {
      const userId = 'user-3';
      const createCardDto: CreateCardDto = {
        firstName: 'Premium',
        lastName: 'User',
      };

      const mockUser = {
        id: userId,
        subscriptionTier: 'PREMIUM',
      };

      const mockCard = {
        id: 'card-100',
        userId,
        ...createCardDto,
        slug: 'card-100-xyz',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsRepository.countByUserId.mockResolvedValue(99);
      mockCardsRepository.create.mockResolvedValue(mockCard);

      const result = await service.create(userId, createCardDto);

      expect(result).toEqual(mockCard);
      expect(mockCardsRepository.create).toHaveBeenCalled();
    });

    it('should generate unique slug from name', async () => {
      const userId = 'user-1';
      const createCardDto: CreateCardDto = {
        firstName: 'Test',
        lastName: 'User',
      };

      const mockUser = {
        id: userId,
        subscriptionTier: 'PRO',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCardsRepository.countByUserId.mockResolvedValue(0);
      mockCardsRepository.create.mockImplementation((data) =>
        Promise.resolve({ id: 'card-1', ...data })
      );

      await service.create(userId, createCardDto);

      const createCallArgs = mockCardsRepository.create.mock.calls[0][0];
      expect(createCallArgs.slug).toMatch(/^test-user-[a-z0-9]*$/);
    });
  });

  describe('findOne', () => {
    it('should return a card by id', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const mockCard = {
        id: cardId,
        userId,
        title: 'Test Card',
        slug: 'test-card-abc',
      };

      mockCardsRepository.findById.mockResolvedValue(mockCard);

      const result = await service.findOne(cardId, userId);

      expect(result).toEqual(mockCard);
      expect(mockCardsRepository.findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      const cardId = 'nonexistent';
      const userId = 'user-1';

      mockCardsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(cardId, userId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if user does not own the card', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const mockCard = {
        id: cardId,
        userId: 'user-2',
        title: 'Another Users Card',
      };

      mockCardsRepository.findById.mockResolvedValue(mockCard);

      await expect(service.findOne(cardId, userId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a public card by slug', async () => {
      const slug = 'test-card-abc';
      const mockCard = {
        id: 'card-1',
        slug,
        title: 'Test Card',
        isPublic: true,
      };

      mockCardsRepository.findBySlug.mockResolvedValue(mockCard);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(mockCard);
      expect(mockCardsRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should throw NotFoundException for nonexistent slug', async () => {
      mockCardsRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update a card successfully', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const updateCardDto: UpdateCardDto = {
        firstName: 'Updated',
        jobTitle: 'Senior Engineer',
      };

      const mockCard = {
        id: cardId,
        userId,
        title: 'Original Title',
        jobTitle: 'Engineer',
      };

      const updatedCard = {
        ...mockCard,
        ...updateCardDto,
      };

      mockCardsRepository.findById.mockResolvedValue(mockCard);
      mockCardsRepository.update.mockResolvedValue(updatedCard);

      const result = await service.update(cardId, userId, updateCardDto);

      expect(result).toEqual(updatedCard);
      expect(mockCardsRepository.update).toHaveBeenCalledWith(
        cardId,
        updateCardDto
      );
    });

    it('should throw ForbiddenException when updating another users card', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const updateCardDto: UpdateCardDto = {
        firstName: 'Hacked',
      };

      const mockCard = {
        id: cardId,
        userId: 'user-2',
        title: 'Original Title',
      };

      mockCardsRepository.findById.mockResolvedValue(mockCard);

      await expect(
        service.update(cardId, userId, updateCardDto)
      ).rejects.toThrow(ForbiddenException);
      expect(mockCardsRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a card successfully', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const mockCard = {
        id: cardId,
        userId,
        title: 'Card to Delete',
      };

      mockCardsRepository.findById.mockResolvedValue(mockCard);
      mockCardsRepository.delete.mockResolvedValue(undefined);

      await service.remove(cardId, userId);

      expect(mockCardsRepository.remove).toHaveBeenCalledWith(cardId);
    });

    it('should throw ForbiddenException when deleting another users card', async () => {
      const cardId = 'card-1';
      const userId = 'user-1';
      const mockCard = {
        id: cardId,
        userId: 'user-2',
        title: 'Protected Card',
      };

      mockCardsRepository.findById.mockResolvedValue(mockCard);

      await expect(service.remove(cardId, userId)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockCardsRepository.remove).not.toHaveBeenCalled();
    });
  });
});
