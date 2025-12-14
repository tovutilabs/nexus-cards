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

  /**
   * Log customization events for card editing and template usage
   */
  async logCustomizationEvent(params: {
    eventType: 'CUSTOMIZATION_SESSION_STARTED' | 'CUSTOMIZATION_SESSION_COMPLETED' | 
               'COMPONENT_ADDED' | 'COMPONENT_REMOVED' | 'COMPONENT_UPDATED' | 
               'COMPONENT_REORDERED' | 'CARD_TEMPLATE_APPLIED' | 
               'CARD_STYLING_UPDATED' | 'CARD_CUSTOM_CSS_UPDATED';
    userId: string;
    cardId: string;
    metadata: Record<string, any>;
  }) {
    const { eventType, userId, cardId, metadata } = params;

    return this.analyticsRepository.logEvent({
      cardId,
      eventType,
      metadata: {
        userId,
        ...metadata,
      },
    });
  }

  /**
   * Helper: Log component added event
   */
  async logComponentAdded(params: {
    userId: string;
    cardId: string;
    componentId: string;
    componentType: string;
    tier: string;
    componentCount: number;
    source?: string;
  }) {
    return this.logCustomizationEvent({
      eventType: 'COMPONENT_ADDED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        componentId: params.componentId,
        componentType: params.componentType,
        tier: params.tier,
        componentCount: params.componentCount,
        source: params.source || 'palette',
      },
    });
  }

  /**
   * Helper: Log component removed event
   */
  async logComponentRemoved(params: {
    userId: string;
    cardId: string;
    componentId: string;
    componentType: string;
    tier: string;
    componentCount: number;
  }) {
    return this.logCustomizationEvent({
      eventType: 'COMPONENT_REMOVED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        componentId: params.componentId,
        componentType: params.componentType,
        tier: params.tier,
        componentCount: params.componentCount,
      },
    });
  }

  /**
   * Helper: Log component updated event
   */
  async logComponentUpdated(params: {
    userId: string;
    cardId: string;
    componentId: string;
    componentType: string;
    tier: string;
    configChanged: boolean;
    stylingChanged: boolean;
    enabledChanged: boolean;
  }) {
    return this.logCustomizationEvent({
      eventType: 'COMPONENT_UPDATED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        componentId: params.componentId,
        componentType: params.componentType,
        tier: params.tier,
        configChanged: params.configChanged,
        stylingChanged: params.stylingChanged,
        enabledChanged: params.enabledChanged,
      },
    });
  }

  /**
   * Helper: Log component reordered event
   */
  async logComponentReordered(params: {
    userId: string;
    cardId: string;
    tier: string;
    componentCount: number;
    reorderCount: number;
  }) {
    return this.logCustomizationEvent({
      eventType: 'COMPONENT_REORDERED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        tier: params.tier,
        componentCount: params.componentCount,
        reorderCount: params.reorderCount,
      },
    });
  }

  /**
   * Helper: Log template applied event
   */
  async logTemplateApplied(params: {
    userId: string;
    cardId: string;
    templateId: string;
    templateSlug: string;
    templateCategory: string;
    templateTier: string;
    userTier: string;
    previousTemplateId?: string;
  }) {
    return this.logCustomizationEvent({
      eventType: 'CARD_TEMPLATE_APPLIED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        templateId: params.templateId,
        templateSlug: params.templateSlug,
        templateCategory: params.templateCategory,
        templateTier: params.templateTier,
        userTier: params.userTier,
        previousTemplateId: params.previousTemplateId,
      },
    });
  }

  /**
   * Helper: Log styling updated event
   */
  async logStylingUpdated(params: {
    userId: string;
    cardId: string;
    tier: string;
    changedFields: string[];
    backgroundTypeChanged: boolean;
    layoutChanged: boolean;
    typographyChanged: boolean;
  }) {
    return this.logCustomizationEvent({
      eventType: 'CARD_STYLING_UPDATED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        tier: params.tier,
        changedFields: params.changedFields,
        backgroundTypeChanged: params.backgroundTypeChanged,
        layoutChanged: params.layoutChanged,
        typographyChanged: params.typographyChanged,
      },
    });
  }

  /**
   * Helper: Log custom CSS updated event
   */
  async logCustomCssUpdated(params: {
    userId: string;
    cardId: string;
    tier: string;
    cssLength: number;
    hasCustomCss: boolean;
  }) {
    return this.logCustomizationEvent({
      eventType: 'CARD_CUSTOM_CSS_UPDATED',
      userId: params.userId,
      cardId: params.cardId,
      metadata: {
        tier: params.tier,
        cssLength: params.cssLength,
        hasCustomCss: params.hasCustomCss,
      },
    });
  }
}
