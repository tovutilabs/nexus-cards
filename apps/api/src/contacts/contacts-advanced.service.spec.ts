import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';
import { CardsRepository } from '../cards/cards.repository';
import { UsersService } from '../users/users.service';
import { ContactSource, ExportFormat } from '@nexus-cards/shared';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ContactsService - Advanced Features', () => {
  let service: ContactsService;
  let contactsRepository: jest.Mocked<ContactsRepository>;
  let cardsRepository: jest.Mocked<CardsRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockContactsRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      countByUserId: jest.fn(),
    };

    const mockCardsRepository = {
      findBySlug: jest.fn(),
      findByUserId: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
      canAddContact: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: ContactsRepository,
          useValue: mockContactsRepository,
        },
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

    service = module.get<ContactsService>(ContactsService);
    contactsRepository = module.get(ContactsRepository);
    cardsRepository = module.get(CardsRepository);
    usersService = module.get(UsersService);
  });

  describe('createManualContact', () => {
    it('should create a manual contact successfully', async () => {
      const userId = 'user-1';
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        jobTitle: 'CEO',
        notes: 'Met at conference',
        category: 'client',
        tags: ['important', 'vip'],
        favorite: true,
        source: ContactSource.MANUAL,
      };

      const mockUser = { id: userId, email: 'user@example.com' };
      const mockCard = { id: 'card-1', userId, status: 'PUBLISHED' };
      const mockContact = { id: 'contact-1', ...dto, userId, cardId: 'card-1' };

      usersService.findById.mockResolvedValue(mockUser as any);
      contactsRepository.countByUserId.mockResolvedValue(5);
      usersService.canAddContact.mockResolvedValue(undefined);
      cardsRepository.findByUserId.mockResolvedValue([mockCard] as any);
      contactsRepository.createContact.mockResolvedValue(mockContact as any);

      const result = await service.createManualContact(userId, dto);

      expect(result).toEqual(mockContact);
      expect(contactsRepository.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          tags: dto.tags,
          category: dto.category,
          favorite: dto.favorite,
          source: ContactSource.MANUAL,
        })
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'user-1';
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      usersService.findById.mockResolvedValue(null);

      await expect(service.createManualContact(userId, dto as any)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if user has no cards', async () => {
      const userId = 'user-1';
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockUser = { id: userId, email: 'user@example.com' };

      usersService.findById.mockResolvedValue(mockUser as any);
      contactsRepository.countByUserId.mockResolvedValue(0);
      usersService.canAddContact.mockResolvedValue(undefined);
      cardsRepository.findByUserId.mockResolvedValue([]);

      await expect(service.createManualContact(userId, dto as any)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('importContacts', () => {
    it('should import multiple contacts successfully', async () => {
      const userId = 'user-1';
      const dto = {
        contacts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        ],
        tags: ['imported'],
        favorite: false,
      };

      const mockUser = { id: userId, email: 'user@example.com' };
      const mockCard = { id: 'card-1', userId, status: 'PUBLISHED' };

      usersService.findById.mockResolvedValue(mockUser as any);
      contactsRepository.countByUserId.mockResolvedValue(0);
      usersService.canAddContact.mockResolvedValue(undefined);
      cardsRepository.findByUserId.mockResolvedValue([mockCard] as any);
      contactsRepository.createContact.mockResolvedValue({
        id: 'contact-1',
        ...dto.contacts[0],
      } as any);

      const result = await service.importContacts(userId, dto as any);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.imported).toHaveLength(2);
      expect(contactsRepository.createContact).toHaveBeenCalledTimes(2);
    });

    it('should handle partial import failures', async () => {
      const userId = 'user-1';
      const dto = {
        contacts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        ],
        tags: [],
        favorite: false,
      };

      const mockUser = { id: userId, email: 'user@example.com' };
      const mockCard = { id: 'card-1', userId, status: 'PUBLISHED' };

      usersService.findById.mockResolvedValue(mockUser as any);
      contactsRepository.countByUserId.mockResolvedValue(0);
      usersService.canAddContact.mockResolvedValue(undefined);
      cardsRepository.findByUserId.mockResolvedValue([mockCard] as any);
      contactsRepository.createContact
        .mockResolvedValueOnce({
          id: 'contact-1',
          ...dto.contacts[0],
        } as any)
        .mockRejectedValueOnce(new Error('Duplicate email'));

      const result = await service.importContacts(userId, dto as any);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getUserContacts with filters', () => {
    it('should filter contacts by tags', async () => {
      const userId = 'user-1';
      const filters = { tags: ['vip', 'client'] };

      const mockContacts = [
        { id: 'contact-1', tags: ['vip'] },
        { id: 'contact-2', tags: ['client'] },
      ];

      contactsRepository.findByUserId.mockResolvedValue(mockContacts as any);

      await service.getUserContacts(userId, filters);

      expect(contactsRepository.findByUserId).toHaveBeenCalledWith(userId, filters);
    });

    it('should filter contacts by category', async () => {
      const userId = 'user-1';
      const filters = { category: 'client' };

      contactsRepository.findByUserId.mockResolvedValue([]);

      await service.getUserContacts(userId, filters);

      expect(contactsRepository.findByUserId).toHaveBeenCalledWith(userId, filters);
    });

    it('should filter favorites only', async () => {
      const userId = 'user-1';
      const filters = { favoritesOnly: true };

      contactsRepository.findByUserId.mockResolvedValue([]);

      await service.getUserContacts(userId, filters);

      expect(contactsRepository.findByUserId).toHaveBeenCalledWith(userId, filters);
    });
  });

  describe('exportContacts with filters', () => {
    it('should export CSV with new fields', async () => {
      const userId = 'user-1';
      const dto = {
        format: ExportFormat.CSV,
      };

      const mockContacts = [
        {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          jobTitle: 'CEO',
          notes: 'Important client',
          category: 'client',
          tags: ['vip', 'important'],
          favorite: true,
          source: 'MANUAL',
          exchangedAt: new Date('2025-01-01'),
        },
      ];

      contactsRepository.findByUserId.mockResolvedValue(mockContacts as any);

      const result = await service.exportContacts(userId, dto);

      expect(result).toContain('First Name');
      expect(result).toContain('Category');
      expect(result).toContain('Tags');
      expect(result).toContain('Favorite');
      expect(result).toContain('Source');
      expect(result).toContain('John');
      expect(result).toContain('client');
      expect(result).toContain('vip; important');
      expect(result).toContain('Yes');
      expect(result).toContain('MANUAL');
    });

    it('should apply filters when exporting', async () => {
      const userId = 'user-123';
      const dto = {
        format: ExportFormat.CSV,
        category: 'client',
        favoritesOnly: true,
      };

      contactsRepository.findByUserId.mockResolvedValue([]);

      await service.exportContacts(userId, dto);

      expect(contactsRepository.findByUserId).toHaveBeenCalledWith(userId, {
        tags: undefined,
        category: 'client',
        favoritesOnly: true,
      });
    });
  });
});
