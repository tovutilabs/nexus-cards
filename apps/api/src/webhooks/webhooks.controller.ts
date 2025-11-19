import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WebhookEventType } from '@prisma/client';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly webhookDeliveryService: WebhookDeliveryService
  ) {}

  @Get()
  async getUserWebhooks(@CurrentUser() user: { id: string }) {
    return this.webhooksService.getUserWebhooks(user.id);
  }

  @Get(':id')
  async getWebhookDetails(
    @CurrentUser() user: { id: string },
    @Param('id') webhookId: string
  ) {
    return this.webhooksService.getWebhookDetails(user.id, webhookId);
  }

  @Post()
  async createWebhook(
    @CurrentUser() user: { id: string },
    @Body() body: { url: string; events: WebhookEventType[] }
  ) {
    return this.webhooksService.createWebhook(user.id, body);
  }

  @Put(':id')
  async updateWebhook(
    @CurrentUser() user: { id: string },
    @Param('id') webhookId: string,
    @Body()
    body: {
      url?: string;
      events?: WebhookEventType[];
      isActive?: boolean;
    }
  ) {
    return this.webhooksService.updateWebhook(user.id, webhookId, body);
  }

  @Delete(':id')
  async deleteWebhook(
    @CurrentUser() user: { id: string },
    @Param('id') webhookId: string
  ) {
    return this.webhooksService.deleteWebhook(user.id, webhookId);
  }

  @Post(':id/regenerate-secret')
  @HttpCode(HttpStatus.OK)
  async regenerateSecret(
    @CurrentUser() user: { id: string },
    @Param('id') webhookId: string
  ) {
    return this.webhooksService.regenerateSecret(user.id, webhookId);
  }

  @Post(':id/deliveries/:deliveryId/retry')
  @HttpCode(HttpStatus.OK)
  async retryDelivery(@Param('deliveryId') deliveryId: string) {
    const success = await this.webhookDeliveryService.retryDelivery(deliveryId);
    return {
      success,
      message: success
        ? 'Retry initiated'
        : 'Delivery not found or already delivered',
    };
  }
}
