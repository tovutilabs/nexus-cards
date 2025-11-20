import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { CacheService } from './cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private analyticsRepository: AnalyticsRepository,
    private cacheService: CacheService
  ) {}

  async logCardView(
    cardId: string,
    metadata?: { nfcUid?: string; source?: string }
  ) {
    return this.analyticsRepository.logEvent({
      cardId,
      eventType: 'VIEW',
      metadata: metadata || {},
    });
  }

  async logContactSubmission(cardId: string, metadata?: any) {
    return this.analyticsRepository.logEvent({
      cardId,
      eventType: 'CONTACT_EXCHANGE',
      metadata: metadata || {},
    });
  }

  async logSocialLinkClick(cardId: string, platform: string) {
    return this.analyticsRepository.logEvent({
      cardId,
      eventType: 'SOCIAL_LINK_CLICK',
      metadata: { platform },
    });
  }

  async getCardAnalytics(cardId: string, startDate?: Date, endDate?: Date) {
    return this.analyticsRepository.getCardStats(cardId, startDate, endDate);
  }

  async getDailyAnalytics(cardId: string, days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.analyticsRepository.getDailyStats(cardId, startDate, endDate);
  }

  async getGlobalOverview(params: { startDate?: Date; endDate?: Date }) {
    const { startDate, endDate } = params;
    return this.analyticsRepository.getGlobalOverview(startDate, endDate);
  }

  async getDailyStatsAdmin(params: {
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    return this.analyticsRepository.getDailyStatsAdmin(params);
  }

  async getTopCardsAdmin(params: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.analyticsRepository.getTopCards(params);
  }

  async getStatsByTier(params: { startDate?: Date; endDate?: Date }) {
    return this.analyticsRepository.getStatsByTier(params);
  }

  async getRecentEventsAdmin(params: {
    skip?: number;
    take?: number;
    eventType?: string;
  }) {
    return this.analyticsRepository.getRecentEvents(params);
  }

  async getUserAnalytics(userId: string, days: number = 7, cardId?: string, granularity: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cacheKey = this.cacheService.generateKey(
      'analytics',
      'user',
      userId,
      cardId,
      days.toString(),
      granularity
    );

    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.analyticsRepository.getUserStats(
      userId,
      startDate,
      endDate,
      cardId
    );

    const viewsOverTime = await this.analyticsRepository.getTimeSeriesAnalytics(
      userId,
      startDate,
      endDate,
      granularity,
      cardId
    );

    const topReferrers = await this.analyticsRepository.getTopReferrersForUser(
      userId,
      startDate,
      endDate,
      cardId
    );

    const deviceBreakdown =
      await this.analyticsRepository.getDeviceBreakdownForUser(
        userId,
        startDate,
        endDate,
        cardId
      );

    const browserBreakdown =
      await this.analyticsRepository.getBrowserBreakdownForUser(
        userId,
        startDate,
        endDate,
        cardId
      );

    const geoData = await this.analyticsRepository.getGeoRegionBreakdownForUser(
      userId,
      startDate,
      endDate,
      cardId
    );

    const linkClicks = await this.analyticsRepository.getLinkClicksForUser(
      userId,
      startDate,
      endDate,
      cardId
    );

    const result = {
      views: stats.totalViews || 0,
      uniqueVisitors: stats.uniqueVisitors || 0,
      contactExchanges: stats.contactExchanges || 0,
      linkClicks: stats.linkClicks || 0,
      viewsOverTime: viewsOverTime.map((item) => ({
        label: item.date,
        value: item.views,
      })),
      topReferrers: topReferrers.map((item) => ({
        label: item.referrer || 'Direct',
        value: item.count,
      })),
      deviceBreakdown: deviceBreakdown.map((item) => ({
        label: item.deviceType || 'Unknown',
        value: item.count,
      })),
      browserBreakdown: browserBreakdown.map((item) => ({
        label: item.browser || 'Unknown',
        value: item.count,
      })),
      geoData: {
        countries: geoData.countries.map((item) => ({
          label: item.country,
          value: item.count,
        })),
        regions: geoData.regions.map((item) => ({
          label: `${item.region}, ${item.country}`,
          value: item.count,
        })),
      },
      topLinks: linkClicks.slice(0, 10).map((item) => ({
        url: item.url,
        label: item.label,
        clicks: item.clicks,
      })),
    };

    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  async exportAnalytics(
    userId: string,
    format: 'csv' | 'json',
    startDate?: Date,
    endDate?: Date,
    cardId?: string
  ) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const analytics = await this.getUserAnalytics(
      userId,
      Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
      cardId,
      'daily'
    );

    if (format === 'json') {
      return {
        format: 'json',
        data: analytics,
        metadata: {
          exportedAt: new Date().toISOString(),
          userId,
          cardId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      };
    }

    if (format === 'csv') {
      const rows = [
        ['Date', 'Views', 'Unique Visitors', 'Contact Exchanges', 'Link Clicks'].join(','),
        ...analytics.viewsOverTime.map((item: any, index: number) => {
          const row = analytics.viewsOverTime[index];
          return [
            row.label,
            row.value,
            analytics.uniqueVisitors,
            analytics.contactExchanges,
            analytics.linkClicks,
          ].join(',');
        }),
      ].join('\n');

      return {
        format: 'csv',
        data: rows,
        metadata: {
          exportedAt: new Date().toISOString(),
          userId,
          cardId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      };
    }

    return null;
  }
}
