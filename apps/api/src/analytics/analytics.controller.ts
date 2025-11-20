import { Controller, Get, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(
    @CurrentUser() user: { id: string },
    @Query('timeRange') timeRange?: string,
    @Query('cardId') cardId?: string,
    @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly'
  ) {
    const range = timeRange || '7d';
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

    const analyticsData = await this.analyticsService.getUserAnalytics(
      user.id,
      days,
      cardId === 'all' ? undefined : cardId,
      granularity || 'daily'
    );

    return analyticsData;
  }

  @Get('card/:cardId')
  async getCardAnalytics(
    @CurrentUser() user: { id: string },
    @Query('timeRange') timeRange?: string,
    @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly'
  ) {
    const range = timeRange || '7d';
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

    return this.analyticsService.getUserAnalytics(
      user.id,
      days,
      undefined,
      granularity || 'daily'
    );
  }

  @Get('export')
  async exportAnalytics(
    @CurrentUser() user: { id: string },
    @Query('format') format: 'csv' | 'json' = 'json',
    @Query('timeRange') timeRange?: string,
    @Query('cardId') cardId?: string,
    @Res() res?: Response
  ) {
    const range = timeRange || '30d';
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exportData = await this.analyticsService.exportAnalytics(
      user.id,
      format,
      startDate,
      endDate,
      cardId === 'all' ? undefined : cardId
    );

    if (!exportData) {
      return res?.status(HttpStatus.BAD_REQUEST).json({
        error: 'Invalid format specified',
      });
    }

    if (format === 'csv' && res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=analytics-${Date.now()}.csv`
      );
      return res.send(exportData.data);
    }

    return exportData;
  }

  @Get('time-series')
  async getTimeSeries(
    @CurrentUser() user: { id: string },
    @Query('timeRange') timeRange?: string,
    @Query('cardId') cardId?: string,
    @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly'
  ) {
    const range = timeRange || '30d';
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

    const analytics = await this.analyticsService.getUserAnalytics(
      user.id,
      days,
      cardId === 'all' ? undefined : cardId,
      granularity || 'daily'
    );

    return {
      timeSeries: analytics.viewsOverTime,
      granularity: granularity || 'daily',
      timeRange: range,
    };
  }
}
