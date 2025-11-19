import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksRepository } from './webhooks.repository';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksRepository, WebhookDeliveryService],
  exports: [WebhooksService, WebhookDeliveryService],
})
export class WebhooksModule {}
