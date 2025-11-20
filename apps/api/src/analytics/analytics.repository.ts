import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsEvent, AnalyticsCardDaily, Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsRepository {
  constructor(private prisma: PrismaService) {}

  async createEvent(
    data: Prisma.AnalyticsEventCreateInput
  ): Promise<AnalyticsEvent> {
    return this.prisma.analyticsEvent.create({
      data,
    });
  }

  async findEventsByCardId(
    cardId: string,
    limit?: number
  ): Promise<AnalyticsEvent[]> {
    return this.prisma.analyticsEvent.findMany({
      where: { cardId },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  async findEventsByDateRange(
    cardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsEvent[]> {
    return this.prisma.analyticsEvent.findMany({
      where: {
        cardId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async upsertDailyStats(
    cardId: string,
    date: Date,
    data: Prisma.AnalyticsCardDailyUpdateInput
  ): Promise<AnalyticsCardDaily> {
    const createData: Prisma.AnalyticsCardDailyCreateInput = {
      card: {
        connect: { id: cardId },
      },
      date,
      views: 0,
      contactExchanges: 0,
      linkClicks: 0,
      qrScans: 0,
      nfcTaps: 0,
      shares: 0,
      uniqueVisitors: 0,
    };

    return this.prisma.analyticsCardDaily.upsert({
      where: {
        cardId_date: {
          cardId,
          date,
        },
      },
      update: data,
      create: createData,
    });
  }

  async findDailyStatsByCardId(
    cardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsCardDaily[]> {
    return this.prisma.analyticsCardDaily.findMany({
      where: {
        cardId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findDailyStatsByUserId(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsCardDaily[]> {
    return this.prisma.analyticsCardDaily.findMany({
      where: {
        card: {
          userId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        card: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async aggregateDailyStats(
    cardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalViews: number;
    totalContactExchanges: number;
    totalLinkClicks: number;
    totalQrScans: number;
    totalNfcTaps: number;
    totalShares: number;
    totalUniqueVisitors: number;
  }> {
    const result = await this.prisma.analyticsCardDaily.aggregate({
      where: {
        cardId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        views: true,
        contactExchanges: true,
        linkClicks: true,
        qrScans: true,
        nfcTaps: true,
        shares: true,
        uniqueVisitors: true,
      },
    });

    return {
      totalViews: result._sum.views || 0,
      totalContactExchanges: result._sum.contactExchanges || 0,
      totalLinkClicks: result._sum.linkClicks || 0,
      totalQrScans: result._sum.qrScans || 0,
      totalNfcTaps: result._sum.nfcTaps || 0,
      totalShares: result._sum.shares || 0,
      totalUniqueVisitors: result._sum.uniqueVisitors || 0,
    };
  }

  async deleteOldEvents(beforeDate: Date): Promise<number> {
    const result = await this.prisma.analyticsEvent.deleteMany({
      where: {
        timestamp: {
          lt: beforeDate,
        },
      },
    });
    return result.count;
  }

  async deleteOldDailyStats(beforeDate: Date): Promise<number> {
    const result = await this.prisma.analyticsCardDaily.deleteMany({
      where: {
        date: {
          lt: beforeDate,
        },
      },
    });
    return result.count;
  }

  async logEvent(data: {
    cardId: string;
    eventType: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    referralUrl?: string;
    country?: string;
    region?: string;
    city?: string;
    deviceType?: string;
    deviceModel?: string;
    os?: string;
    browser?: string;
    browserVersion?: string;
    linkUrl?: string;
    linkLabel?: string;
    scrollDepth?: number;
    sessionId?: string;
  }): Promise<AnalyticsEvent> {
    const eventTypeMap: Record<string, string> = {
      VIEW: 'CARD_VIEW',
      CONTACT_SUBMISSION: 'CONTACT_EXCHANGE',
      SOCIAL_LINK_CLICK: 'LINK_CLICK',
    };

    const prismaEventType = eventTypeMap[data.eventType] || data.eventType;

    return this.createEvent({
      card: {
        connect: { id: data.cardId },
      },
      eventType: prismaEventType as any,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referralUrl: data.referralUrl,
      country: data.country,
      region: data.region,
      city: data.city,
      deviceType: data.deviceType,
      deviceModel: data.deviceModel,
      os: data.os,
      browser: data.browser,
      browserVersion: data.browserVersion,
      linkUrl: data.linkUrl,
      linkLabel: data.linkLabel,
      scrollDepth: data.scrollDepth,
      sessionId: data.sessionId,
      timestamp: new Date(),
    });
  }

  async getCardStats(cardId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    return this.aggregateDailyStats(cardId, start, end);
  }

  async getDailyStats(cardId: string, startDate: Date, endDate: Date) {
    return this.findDailyStatsByCardId(cardId, startDate, endDate);
  }

  async getGlobalOverview(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const result = await this.prisma.analyticsCardDaily.aggregate({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        views: true,
        contactExchanges: true,
        linkClicks: true,
        qrScans: true,
        nfcTaps: true,
        shares: true,
        uniqueVisitors: true,
      },
    });

    const [totalCards, totalUsers] = await Promise.all([
      this.prisma.card.count(),
      this.prisma.user.count(),
    ]);

    return {
      overview: {
        totalViews: result._sum.views || 0,
        totalContactExchanges: result._sum.contactExchanges || 0,
        totalLinkClicks: result._sum.linkClicks || 0,
        totalQrScans: result._sum.qrScans || 0,
        totalNfcTaps: result._sum.nfcTaps || 0,
        totalShares: result._sum.shares || 0,
        totalUniqueVisitors: result._sum.uniqueVisitors || 0,
        totalCards,
        totalUsers,
      },
      dateRange: {
        start,
        end,
      },
    };
  }

  async getDailyStatsAdmin(params: {
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const { startDate, endDate, skip = 0, take = 30 } = params;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const dailyAggregates = await this.prisma.analyticsCardDaily.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        views: true,
        contactExchanges: true,
        linkClicks: true,
        qrScans: true,
        nfcTaps: true,
        shares: true,
        uniqueVisitors: true,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take,
    });

    const total = await this.prisma.analyticsCardDaily.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      data: dailyAggregates.map((day) => ({
        date: day.date,
        views: day._sum.views || 0,
        contactExchanges: day._sum.contactExchanges || 0,
        linkClicks: day._sum.linkClicks || 0,
        qrScans: day._sum.qrScans || 0,
        nfcTaps: day._sum.nfcTaps || 0,
        shares: day._sum.shares || 0,
        uniqueVisitors: day._sum.uniqueVisitors || 0,
      })),
      total: total.length,
      skip,
      take,
    };
  }

  async getTopCards(params: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const { startDate, endDate, limit = 10 } = params;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const topByViews = await this.prisma.analyticsCardDaily.groupBy({
      by: ['cardId'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        views: true,
        nfcTaps: true,
        contactExchanges: true,
      },
      orderBy: {
        _sum: {
          views: 'desc',
        },
      },
      take: limit,
    });

    const cardIds = topByViews.map((item) => item.cardId);
    const cards = await this.prisma.card.findMany({
      where: {
        id: {
          in: cardIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const cardMap = new Map(cards.map((card) => [card.id, card]));

    return topByViews.map((item) => ({
      card: cardMap.get(item.cardId),
      stats: {
        views: item._sum.views || 0,
        nfcTaps: item._sum.nfcTaps || 0,
        contactExchanges: item._sum.contactExchanges || 0,
      },
    }));
  }

  async getStatsByTier(params: { startDate?: Date; endDate?: Date }) {
    const { startDate, endDate } = params;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const tiers = ['FREE', 'PRO', 'PREMIUM'];
    const statsByTier = await Promise.all(
      tiers.map(async (tier) => {
        const result = await this.prisma.analyticsCardDaily.aggregate({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            card: {
              user: {
                subscription: {
                  tier: tier as any,
                },
              },
            },
          },
          _sum: {
            views: true,
            contactExchanges: true,
            nfcTaps: true,
          },
        });

        const cardCount = await this.prisma.card.count({
          where: {
            user: {
              subscription: {
                tier: tier as any,
              },
            },
          },
        });

        return {
          tier,
          cardCount,
          stats: {
            views: result._sum.views || 0,
            contactExchanges: result._sum.contactExchanges || 0,
            nfcTaps: result._sum.nfcTaps || 0,
          },
        };
      })
    );

    return statsByTier;
  }

  async getRecentEvents(params: {
    skip?: number;
    take?: number;
    eventType?: string;
  }) {
    const { skip = 0, take = 50, eventType } = params;

    const where: Prisma.AnalyticsEventWhereInput = {};
    if (eventType) {
      where.eventType = eventType as any;
    }

    const [events, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        include: {
          card: {
            select: {
              id: true,
              slug: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return {
      events,
      total,
      skip,
      take,
    };
  }

  async getUserStats(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsCardDailyWhereInput = {
      card: {
        userId,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const result = await this.prisma.analyticsCardDaily.aggregate({
      where,
      _sum: {
        views: true,
        contactExchanges: true,
        linkClicks: true,
        uniqueVisitors: true,
      },
    });

    return {
      totalViews: result._sum.views || 0,
      uniqueVisitors: result._sum.uniqueVisitors || 0,
      contactExchanges: result._sum.contactExchanges || 0,
      linkClicks: result._sum.linkClicks || 0,
    };
  }

  async getDailyViewsForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsCardDailyWhereInput = {
      card: {
        userId,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const dailyStats = await this.prisma.analyticsCardDaily.groupBy({
      by: ['date'],
      where,
      _sum: {
        views: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return dailyStats.map((stat) => ({
      date: stat.date.toISOString().split('T')[0],
      count: stat._sum.views || 0,
    }));
  }

  async getTopReferrersForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsEventWhereInput = {
      card: {
        userId,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      eventType: 'CARD_VIEW',
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        metadata: true,
      },
    });

    const referrerCounts = events.reduce(
      (acc: Record<string, number>, event: any) => {
        const referrer = event.metadata?.referrer || 'Direct';
        acc[referrer] = (acc[referrer] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getDeviceBreakdownForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsEventWhereInput = {
      card: {
        userId,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      eventType: 'CARD_VIEW',
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        deviceType: true,
      },
    });

    const deviceCounts = events.reduce(
      (acc: Record<string, number>, event: any) => {
        const device = event.deviceType || 'Unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(deviceCounts)
      .map(([deviceType, count]) => ({ deviceType, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getBrowserBreakdownForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsEventWhereInput = {
      card: {
        userId,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      eventType: 'CARD_VIEW',
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        browser: true,
        browserVersion: true,
      },
    });

    const browserCounts = events.reduce(
      (acc: Record<string, number>, event: any) => {
        const browser = event.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getGeoRegionBreakdownForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsEventWhereInput = {
      card: {
        userId,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      eventType: 'CARD_VIEW',
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        country: true,
        region: true,
        city: true,
      },
    });

    const countryCounts = events.reduce(
      (acc: Record<string, number>, event: any) => {
        const country = event.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {}
    );

    const regionCounts = events.reduce(
      (acc: Record<string, { country: string; count: number }>, event: any) => {
        if (event.region) {
          const key = `${event.country || 'Unknown'}-${event.region}`;
          if (!acc[key]) {
            acc[key] = { country: event.country || 'Unknown', count: 0 };
          }
          acc[key].count++;
        }
        return acc;
      },
      {}
    );

    return {
      countries: Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      regions: Object.entries(regionCounts)
        .map(([key, data]) => ({
          region: key.split('-')[1],
          country: data.country,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async getLinkClicksForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    cardId?: string
  ) {
    const where: Prisma.AnalyticsEventWhereInput = {
      card: {
        userId,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      eventType: 'LINK_CLICK',
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: {
        linkUrl: true,
        linkLabel: true,
      },
    });

    const linkCounts = events.reduce(
      (acc: Record<string, { url: string; label: string; clicks: number }>, event: any) => {
        const url = event.linkUrl || 'Unknown';
        if (!acc[url]) {
          acc[url] = {
            url,
            label: event.linkLabel || url,
            clicks: 0,
          };
        }
        acc[url].clicks++;
        return acc;
      },
      {}
    );

    return Object.values(linkCounts).sort((a, b) => b.clicks - a.clicks);
  }

  async getTimeSeriesAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly',
    cardId?: string
  ) {
    const where: Prisma.AnalyticsCardDailyWhereInput = {
      card: {
        userId,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (cardId) {
      where.cardId = cardId;
    }

    const dailyStats = await this.prisma.analyticsCardDaily.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    if (granularity === 'daily') {
      return dailyStats.map((stat) => ({
        date: stat.date.toISOString().split('T')[0],
        views: stat.views,
        contactExchanges: stat.contactExchanges,
        linkClicks: stat.linkClicks,
        qrScans: stat.qrScans,
        nfcTaps: stat.nfcTaps,
        shares: stat.shares,
        uniqueVisitors: stat.uniqueVisitors,
      }));
    }

    if (granularity === 'weekly') {
      const weeklyData: Record<string, any> = {};
      dailyStats.forEach((stat) => {
        const date = new Date(stat.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            date: weekKey,
            views: 0,
            contactExchanges: 0,
            linkClicks: 0,
            qrScans: 0,
            nfcTaps: 0,
            shares: 0,
            uniqueVisitors: 0,
          };
        }

        weeklyData[weekKey].views += stat.views;
        weeklyData[weekKey].contactExchanges += stat.contactExchanges;
        weeklyData[weekKey].linkClicks += stat.linkClicks;
        weeklyData[weekKey].qrScans += stat.qrScans;
        weeklyData[weekKey].nfcTaps += stat.nfcTaps;
        weeklyData[weekKey].shares += stat.shares;
        weeklyData[weekKey].uniqueVisitors += stat.uniqueVisitors;
      });

      return Object.values(weeklyData);
    }

    if (granularity === 'monthly') {
      const monthlyData: Record<string, any> = {};
      dailyStats.forEach((stat) => {
        const date = new Date(stat.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: monthKey,
            views: 0,
            contactExchanges: 0,
            linkClicks: 0,
            qrScans: 0,
            nfcTaps: 0,
            shares: 0,
            uniqueVisitors: 0,
          };
        }

        monthlyData[monthKey].views += stat.views;
        monthlyData[monthKey].contactExchanges += stat.contactExchanges;
        monthlyData[monthKey].linkClicks += stat.linkClicks;
        monthlyData[monthKey].qrScans += stat.qrScans;
        monthlyData[monthKey].nfcTaps += stat.nfcTaps;
        monthlyData[monthKey].shares += stat.shares;
        monthlyData[monthKey].uniqueVisitors += stat.uniqueVisitors;
      });

      return Object.values(monthlyData);
    }

    return [];
  }
}
