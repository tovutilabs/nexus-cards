import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { CacheService } from './cache.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: AnalyticsRepository;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsRepository,
          useValue: {
            logEvent: jest.fn(),
            getUserStats: jest.fn(),
            getTimeSeriesAnalytics: jest.fn(),
            getTopReferrersForUser: jest.fn(),
            getDeviceBreakdownForUser: jest.fn(),
            getBrowserBreakdownForUser: jest.fn(),
            getGeoRegionBreakdownForUser: jest.fn(),
            getLinkClicksForUser: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            generateKey: jest.fn((...parts) => parts.join(':')),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get<AnalyticsRepository>(AnalyticsRepository);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserAnalytics', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        views: 100,
        uniqueVisitors: 80,
        contactExchanges: 10,
        linkClicks: 20,
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedData);

      const result = await service.getUserAnalytics('user1', 7);

      expect(result).toEqual(cachedData);
      expect(repository.getUserStats).not.toHaveBeenCalled();
    });

    it('should fetch and cache data if not in cache', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(repository, 'getUserStats').mockResolvedValue({
        totalViews: 100,
        uniqueVisitors: 80,
        contactExchanges: 10,
        linkClicks: 20,
      });
      jest.spyOn(repository, 'getTimeSeriesAnalytics').mockResolvedValue([]);
      jest.spyOn(repository, 'getTopReferrersForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getDeviceBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getBrowserBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getGeoRegionBreakdownForUser').mockResolvedValue({
        countries: [],
        regions: [],
      });
      jest.spyOn(repository, 'getLinkClicksForUser').mockResolvedValue([]);

      const result = await service.getUserAnalytics('user1', 7);

      expect(result.views).toBe(100);
      expect(result.uniqueVisitors).toBe(80);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should support different granularities', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(repository, 'getUserStats').mockResolvedValue({
        totalViews: 100,
        uniqueVisitors: 80,
        contactExchanges: 10,
        linkClicks: 20,
      });
      jest.spyOn(repository, 'getTimeSeriesAnalytics').mockResolvedValue([
        { date: '2025-01-01', views: 50, contactExchanges: 5, linkClicks: 10, qrScans: 2, nfcTaps: 3, shares: 1, uniqueVisitors: 40 },
      ]);
      jest.spyOn(repository, 'getTopReferrersForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getDeviceBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getBrowserBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getGeoRegionBreakdownForUser').mockResolvedValue({
        countries: [],
        regions: [],
      });
      jest.spyOn(repository, 'getLinkClicksForUser').mockResolvedValue([]);

      await service.getUserAnalytics('user1', 30, undefined, 'weekly');

      expect(repository.getTimeSeriesAnalytics).toHaveBeenCalledWith(
        'user1',
        expect.any(Date),
        expect.any(Date),
        'weekly',
        undefined
      );
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics in JSON format', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(repository, 'getUserStats').mockResolvedValue({
        totalViews: 100,
        uniqueVisitors: 80,
        contactExchanges: 10,
        linkClicks: 20,
      });
      jest.spyOn(repository, 'getTimeSeriesAnalytics').mockResolvedValue([
        { date: '2025-01-01', views: 50, contactExchanges: 5, linkClicks: 10, qrScans: 2, nfcTaps: 3, shares: 1, uniqueVisitors: 40 },
      ]);
      jest.spyOn(repository, 'getTopReferrersForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getDeviceBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getBrowserBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getGeoRegionBreakdownForUser').mockResolvedValue({
        countries: [],
        regions: [],
      });
      jest.spyOn(repository, 'getLinkClicksForUser').mockResolvedValue([]);

      const result = await service.exportAnalytics('user1', 'json');

      expect(result).toHaveProperty('format', 'json');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
    });

    it('should export analytics in CSV format', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(repository, 'getUserStats').mockResolvedValue({
        totalViews: 100,
        uniqueVisitors: 80,
        contactExchanges: 10,
        linkClicks: 20,
      });
      jest.spyOn(repository, 'getTimeSeriesAnalytics').mockResolvedValue([
        { date: '2025-01-01', views: 50, contactExchanges: 5, linkClicks: 10, qrScans: 2, nfcTaps: 3, shares: 1, uniqueVisitors: 40 },
      ]);
      jest.spyOn(repository, 'getTopReferrersForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getDeviceBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getBrowserBreakdownForUser').mockResolvedValue([]);
      jest.spyOn(repository, 'getGeoRegionBreakdownForUser').mockResolvedValue({
        countries: [],
        regions: [],
      });
      jest.spyOn(repository, 'getLinkClicksForUser').mockResolvedValue([]);

      const result = await service.exportAnalytics('user1', 'csv');

      expect(result).toHaveProperty('format', 'csv');
      expect(result).toHaveProperty('data');
      expect(typeof result?.data).toBe('string');
    });
  });
});
