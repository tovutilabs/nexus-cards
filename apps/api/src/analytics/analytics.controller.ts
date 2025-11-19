import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
    @Query('cardId') cardId?: string
  ) {
    const range = timeRange || '7d';
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

    const analyticsData = await this.analyticsService.getUserAnalytics(
      user.id,
      days,
      cardId === 'all' ? undefined : cardId
    );

    return analyticsData;
  }

  @Get('card/:cardId')
  async getCardAnalytics(
    @CurrentUser() user: { id: string },
    @Query('timeRange') timeRange?: string
  ) {
    const range = timeRange || '7d';
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

    return this.analyticsService.getUserAnalytics(user.id, days);
  }
}
