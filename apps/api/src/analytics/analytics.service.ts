import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private analyticsRepository: AnalyticsRepository) {}

  async logCardView(cardId: string, metadata?: { nfcUid?: string; source?: string }) {
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
}
