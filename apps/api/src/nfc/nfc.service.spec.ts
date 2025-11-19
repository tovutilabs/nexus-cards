import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { NfcService } from './nfc.service';
import { NfcRepository } from './nfc.repository';
import { CardsService } from '../cards/cards.service';

describe('NfcService', () => {
  let service: NfcService;
  let _repository: NfcRepository;
  let _cardsService: CardsService;

  const mockNfcRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUid: jest.fn(),
    findByAssignedUserId: jest.fn(),
    update: jest.fn(),
    assignToUser: jest.fn(),
    associateWithCard: jest.fn(),
    disassociateFromCard: jest.fn(),
    bulkCreate: jest.fn(),
    countByStatus: jest.fn(),
  };

  const mockCardsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NfcService,
        {
          provide: NfcRepository,
          useValue: mockNfcRepository,
        },
        {
          provide: CardsService,
          useValue: mockCardsService,
        },
      ],
    }).compile();

    service = module.get<NfcService>(NfcService);
    _repository = module.get<NfcRepository>(NfcRepository);
    _cardsService = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('importTags (Admin)', () => {
    it('should import multiple NFC tags', async () => {
      const uids = ['04:12:34:56:78:90:AB', '04:AB:CD:EF:12:34:56'];

      mockNfcRepository.findByUid.mockResolvedValue(null);
      mockNfcRepository.create.mockResolvedValue({
        id: '1',
        uid: uids[0],
        status: 'UNASSOCIATED',
      });

      const result = await service.importTags({ uids });

      expect(result.imported).toHaveLength(2);
      expect(mockNfcRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should skip duplicate UIDs during import', async () => {
      const uids = ['04:12:34:56:78:90:AB'];

      mockNfcRepository.findByUid.mockResolvedValue({
        id: '1',
        uid: uids[0],
        status: 'UNASSOCIATED',
      });

      const result = await service.importTags({ uids });

      expect(result.skipped).toHaveLength(1);
      expect(mockNfcRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('assignTagToUser (Admin)', () => {
    it('should assign an available tag to a user', async () => {
      const tagId = 'tag-1';
      const userId = 'user-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'AVAILABLE',
        assignedUserId: null,
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);
      mockNfcRepository.update.mockResolvedValue({
        ...mockTag,
        status: 'ASSIGNED',
        assignedUserId: userId,
      });

      const result = await service.assignTagToUser(tagId, { userId });

      expect(result.assignedUserId).toBe(userId);
      expect(result.status).toBe('ASSIGNED');
      expect(mockNfcRepository.update).toHaveBeenCalledWith(
        tagId,
        expect.objectContaining({
          assignedUserId: userId,
          status: 'ASSIGNED',
        })
      );
    });

    it('should throw BadRequestException when assigning already assigned tag', async () => {
      const tagId = 'tag-1';
      const userId = 'user-2';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: 'user-1',
      };

      mockNfcRepository.findById.mockResolvedValue(mockTag);

      await expect(service.assignTagToUser(tagId, { userId })).rejects.toThrow(
        BadRequestException
      );
      expect(mockNfcRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when assigning revoked tag', async () => {
      const tagId = 'tag-1';
      const userId = 'user-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'REVOKED',
        assignedUserId: null,
      };

      mockNfcRepository.findById.mockResolvedValue(mockTag);

      await expect(service.assignTagToUser(tagId, { userId })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('associateTagWithCard (User)', () => {
    it('should associate a users tag with their card', async () => {
      const userId = 'user-1';
      const tagId = 'tag-1';
      const cardId = 'card-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: userId,
        cardId: null,
      };

      const mockCard = {
        id: cardId,
        userId,
        title: 'My Card',
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);
      mockCardsService.findOne.mockResolvedValue(mockCard);
      mockNfcRepository.update.mockResolvedValue({
        ...mockTag,
        cardId,
      });

      const result = await service.associateTagWithCard(tagId, userId, {
        cardId,
      });

      expect(result.message).toContain('successfully associated');
      expect(mockNfcRepository.update).toHaveBeenCalledWith(
        tagId,
        expect.objectContaining({ cardId })
      );
    });

    it('should throw ForbiddenException when associating another users tag', async () => {
      const userId = 'user-1';
      const tagId = 'tag-1';
      const cardId = 'card-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: 'user-2',
        cardId: null,
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);

      await expect(
        service.associateTagWithCard(tagId, userId, { cardId })
      ).rejects.toThrow(NotFoundException);
      expect(mockNfcRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when associating tag with another users card', async () => {
      const userId = 'user-1';
      const tagId = 'tag-1';
      const cardId = 'card-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: userId,
        cardId: null,
      };

      const mockCard = {
        id: cardId,
        userId: 'user-2',
        title: 'Another Users Card',
      };

      mockNfcRepository.findById.mockResolvedValue(mockTag);
      mockCardsService.findOne.mockResolvedValue(mockCard);

      await expect(
        service.associateTagWithCard(tagId, userId, { cardId })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce 1-tag-to-1-card constraint', async () => {
      const userId = 'user-1';
      const tagId = 'tag-1';
      const cardId = 'card-2';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: userId,
        cardId: 'card-1',
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);

      await expect(
        service.associateTagWithCard(tagId, userId, { cardId })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('disassociateTag (User)', () => {
    it('should disassociate a tag from a card', async () => {
      const userId = 'user-1';
      const tagId = 'tag-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: userId,
        cardId: 'card-1',
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);
      mockNfcRepository.update.mockResolvedValue({
        ...mockTag,
        cardId: null,
      });

      const result = await service.disassociateTag(tagId, userId);

      expect(result.message).toContain('successfully disassociated');
      expect(mockNfcRepository.update).toHaveBeenCalledWith(
        tagId,
        expect.objectContaining({ cardId: null })
      );
    });

    it('should throw ForbiddenException when disassociating another users tag', async () => {
      const userId = 'user-1';
      const tagId = 'tag-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: 'user-2',
        cardId: 'card-1',
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);

      await expect(service.disassociateTag(tagId, userId)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockNfcRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('resolveTag', () => {
    it('should redirect to associated card when tag is linked', async () => {
      const uid = '04:12:34:56:78:90:AB';
      const mockTag = {
        id: 'tag-1',
        uid,
        status: 'ASSIGNED',
        assignedUserId: 'user-1',
        cardId: 'card-1',
        card: {
          slug: 'my-business-card-abc',
        },
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);

      const result = await service.resolveTag(uid);

      expect(result.action).toBe('REDIRECT');
      expect(result.cardSlug).toBe('my-business-card-abc');
    });

    it('should show association screen when tag is assigned but not linked', async () => {
      const uid = '04:12:34:56:78:90:AB';
      const mockTag = {
        id: 'tag-1',
        uid,
        status: 'ASSIGNED',
        assignedUserId: 'user-1',
        cardId: null,
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);

      const result = await service.resolveTag(uid);

      expect(result.action).toBe('SHOW_ASSOCIATION_SCREEN');
      expect(result.tagId).toBe('tag-1');
    });

    it('should show unassigned screen when tag exists but unassigned', async () => {
      const uid = '04:12:34:56:78:90:AB';
      const mockTag = {
        id: 'tag-1',
        uid,
        status: 'AVAILABLE',
        assignedUserId: null,
        cardId: null,
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);

      const result = await service.resolveTag(uid);

      expect(result.status).toBe('UNASSOCIATED');
    });

    it('should throw NotFoundException when UID does not exist', async () => {
      const uid = '04:99:99:99:99:99:99';

      mockNfcRepository.findByUid.mockResolvedValue(null);

      const result = await service.resolveTag(uid);

      expect(result.status).toBe('UNKNOWN');
    });
  });

  describe('revokeTag (Admin)', () => {
    it('should revoke a tag and clear associations', async () => {
      const tagId = 'tag-1';

      const mockTag = {
        id: tagId,
        uid: '04:12:34:56:78:90:AB',
        status: 'ASSIGNED',
        assignedUserId: 'user-1',
        cardId: 'card-1',
      };

      mockNfcRepository.findByUid.mockResolvedValue(mockTag);
      mockNfcRepository.update.mockResolvedValue({
        ...mockTag,
        status: 'REVOKED',
        assignedUserId: null,
        cardId: null,
      });

      const result = await service.revokeTag(tagId);

      expect(result.status).toBe('REVOKED');
      expect(result.assignedUserId).toBeNull();
      expect(result.cardId).toBeNull();
      expect(mockNfcRepository.update).toHaveBeenCalledWith(
        tagId,
        expect.objectContaining({
          status: 'REVOKED',
          assignedUserId: null,
          cardId: null,
        })
      );
    });
  });
});
