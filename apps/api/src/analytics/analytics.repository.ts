import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsEvent, AnalyticsCardDaily, Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsRepository {
  constructor(private prisma: PrismaService) {}

  async createEvent(data: Prisma.AnalyticsEventCreateInput): Promise<AnalyticsEvent> {
    return this.prisma.analyticsEvent.create({
      data,
    });
  }

  async findEventsByCardId(cardId: string, limit?: number): Promise<AnalyticsEvent[]> {
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
    endDate: Date,
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
    data: Prisma.AnalyticsCardDailyUpdateInput,
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
    endDate: Date,
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
    endDate: Date,
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
    endDate: Date,
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
}
