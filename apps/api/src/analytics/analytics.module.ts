import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsRepository } from './analytics.repository';

@Module({
  providers: [AnalyticsService, AnalyticsRepository],
  controllers: [AnalyticsController, AdminAnalyticsController],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
