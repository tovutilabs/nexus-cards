import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { ComplianceRepository } from './compliance.repository';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let repository: ComplianceRepository;

  const mockRepository = {
    createDataExport: jest.fn(),
    updateDataExportStatus: jest.fn(),
    getDataExports: jest.fn(),
    getUserData: jest.fn(),
    deleteUserAccount: jest.fn(),
    recordCookieConsent: jest.fn(),
    getCookieConsent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: ComplianceRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    repository = module.get<ComplianceRepository>(ComplianceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestDataExport', () => {
    it('should create data export request', async () => {
      const userId = 'user-1';
      const format = 'JSON';

      const exportRecord = {
        id: 'export-1',
        userId,
        format,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockRepository.createDataExport.mockResolvedValue(exportRecord);
      mockRepository.getUserData.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        cards: [],
        contacts: [],
      });

      const result = await service.requestDataExport(userId, 'JSON');

      expect(result).toEqual(exportRecord);
      expect(mockRepository.createDataExport).toHaveBeenCalledWith(userId, format);
    });

    it('should support CSV format', async () => {
      const userId = 'user-1';

      mockRepository.createDataExport.mockResolvedValue({
        id: 'export-1',
        userId,
        format: 'CSV',
        status: 'PENDING',
      });

      mockRepository.getUserData.mockResolvedValue({ id: userId });

      await service.requestDataExport(userId, 'CSV');

      expect(mockRepository.createDataExport).toHaveBeenCalledWith(userId, 'CSV');
    });
  });

  describe('getDataExports', () => {
    it('should return user data exports', async () => {
      const userId = 'user-1';
      const exports = [
        {
          id: 'export-1',
          userId,
          format: 'JSON',
          status: 'COMPLETED',
          fileUrl: '/exports/export-1.json',
          createdAt: new Date(),
        },
      ];

      mockRepository.getDataExports.mockResolvedValue(exports);

      const result = await service.getDataExports(userId);

      expect(result).toEqual(exports);
      expect(mockRepository.getDataExports).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      const userId = 'user-1';

      mockRepository.deleteUserAccount.mockResolvedValue(undefined);

      await service.deleteAccount(userId);

      expect(mockRepository.deleteUserAccount).toHaveBeenCalledWith(userId);
    });
  });

  describe('recordCookieConsent', () => {
    it('should record cookie consent', async () => {
      const consentData = {
        userId: 'user-1',
        sessionId: 'sess-123',
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      mockRepository.recordCookieConsent.mockResolvedValue({
        id: 'consent-1',
        ...consentData,
        consentedAt: new Date(),
      });

      await service.recordCookieConsent(consentData);

      expect(mockRepository.recordCookieConsent).toHaveBeenCalledWith(consentData);
    });
  });

  describe('getCookieConsent', () => {
    it('should retrieve cookie consent', async () => {
      const sessionId = 'sess-123';
      const consent = {
        id: 'consent-1',
        sessionId,
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      };

      mockRepository.getCookieConsent.mockResolvedValue(consent);

      const result = await service.getCookieConsent(sessionId);

      expect(result).toEqual(consent);
      expect(mockRepository.getCookieConsent).toHaveBeenCalledWith(sessionId);
    });
  });
});
