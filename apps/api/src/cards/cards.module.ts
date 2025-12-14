import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { UsersModule } from '../users/users.module';
import { TemplatesModule } from '../templates/templates.module';
import { SharedModule } from '../shared/shared.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [UsersModule, TemplatesModule, SharedModule, AnalyticsModule],
  providers: [CardsService, CardsRepository],
  controllers: [CardsController],
  exports: [CardsService, CardsRepository],
})
export class CardsModule {}
