import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';
import { CardsService } from '../cards/cards.service';
import { UsersService } from '../users/users.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

describe('ContactsService', () => {
  let service: ContactsService;
  let _repository: ContactsRepository;
  let _cardsService: CardsService;
  let _usersService: UsersService;

  const mockContactsRepository = {
    createContact: jest.fn(),
    findById: jest.fn(),
    findByCardId: jest.fn(),
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
  };

  const mockCardsService = {
    findOne: jest.fn(),
    findBySlug: jest.fn(),
  };

  const mockUsersService = {
    canAddContact: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: ContactsRepository,
          useValue: mockContactsRepository,
        },
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

    service = module.get<ContactsService>(ContactsService);
    _repository = module.get<ContactsRepository>(ContactsRepository);
    _cardsService = module.get<CardsService>(CardsService);
    _usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a contact successfully', async () => {
      const cardSlug = 'business-card-abc';
      const createContactDto: SubmitContactDto = {
        firstName: 'John',
        lastName: 'Visitor',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Visitor Corp',
        notes: 'Nice to meet you!',
      };

      const mockCard = {
        id: 'card-1',
        slug: cardSlug,
        userId: 'user-1',
      };

      const mockContact = {
        id: 'contact-1',
        cardId: mockCard.id,
        ...createContactDto,
        createdAt: new Date(),
      };

      mockCardsService.findBySlug.mockResolvedValue(mockCard);
      mockContactsRepository.countByUserId.mockResolvedValue(0);
      mockUsersService.canAddContact.mockResolvedValue(true);
      mockContactsRepository.createContact.mockResolvedValue(mockContact);

      const result = await service.submitContact(cardSlug, createContactDto);

      expect(result).toEqual(mockContact);
      expect(mockContactsRepository.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: mockCard.id,
          name: createContactDto.firstName,
          email: createContactDto.email,
        })
      );
    });

    it('should throw NotFoundException if card does not exist', async () => {
      const cardSlug = 'nonexistent-card';
      const createContactDto: SubmitContactDto = {
        firstName: 'John',
        lastName: 'Visitor',
        email: 'john@example.com',
      };

      mockCardsService.findBySlug.mockResolvedValue(null);

      await expect(
        service.submitContact(cardSlug, createContactDto)
      ).rejects.toThrow(NotFoundException);
      expect(mockContactsRepository.createContact).not.toHaveBeenCalled();
    });

    it('should allow contact creation without optional fields', async () => {
      const cardSlug = 'business-card-abc';
      const createContactDto: SubmitContactDto = {
        firstName: 'Minimal',
        lastName: 'Contact',
        email: 'minimal@example.com',
      };

      const mockCard = {
        id: 'card-1',
        slug: cardSlug,
        userId: 'user-1',
      };

      const mockContact = {
        id: 'contact-1',
        cardId: mockCard.id,
        ...createContactDto,
        phone: null,
        company: null,
        notes: null,
      };

      mockCardsService.findBySlug.mockResolvedValue(mockCard);
      mockContactsRepository.createContact.mockResolvedValue(mockContact);

      const result = await service.submitContact(cardSlug, createContactDto);

      expect(result).toEqual(mockContact);
    });
  });

  describe('exportContacts', () => {
    it('should export contacts in VCF format', async () => {
      const userId = 'user-1';

      const mockContacts = [
        {
          id: 'contact-1',
          userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
        },
      ];

      mockContactsRepository.findByUserId.mockResolvedValue(mockContacts);

      const vcfData = await service.exportContacts(userId, 'VCF');

      expect(vcfData).toContain('BEGIN:VCARD');
      expect(vcfData).toContain('VERSION:3.0');
      expect(vcfData).toContain('FN:John Doe');
      expect(vcfData).toContain('EMAIL:john@example.com');
      expect(vcfData).toContain('TEL:+1234567890');
      expect(vcfData).toContain('ORG:Acme Corp');
      expect(vcfData).toContain('END:VCARD');
    });

    it('should export contacts in CSV format', async () => {
      const userId = 'user-1';

      const mockContacts = [
        {
          id: 'contact-1',
          userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
        },
      ];

      mockContactsRepository.findByUserId.mockResolvedValue(mockContacts);

      const csvData = await service.exportContacts(userId, 'CSV');

      expect(csvData).toContain('firstName');
      expect(csvData).toContain('John');
    });
  });
});
