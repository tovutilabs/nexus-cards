import { Module } from '@nestjs/common';
import { CardComponentsService } from './card-components.service';
import { CardComponentsController } from './card-components.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, SharedModule, AnalyticsModule],
  controllers: [CardComponentsController],
  providers: [CardComponentsService],
  exports: [CardComponentsService],
})
export class CardComponentsModule {}
