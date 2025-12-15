import { Module } from '@nestjs/common';
import { TemplatesController, AdminTemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplateComponentFactory } from './services/template-component-factory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [TemplatesController, AdminTemplatesController],
  providers: [TemplatesService, TemplateComponentFactory],
  exports: [TemplatesService],
})
export class TemplatesModule {}
