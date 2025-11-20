import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { WebhooksService } from './webhooks.service';
import { ConnectIntegrationDto } from './dto';
import { IntegrationProvider, WebhookEventType } from '@prisma/client';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Get()
  async listIntegrations(@Req() req: any) {
    return this.integrationsService.listIntegrations(req.user.userId);
  }

  @Post('connect')
  async connectIntegration(
    @Req() req: any,
    @Body() dto: ConnectIntegrationDto
  ) {
    return this.integrationsService.connectIntegration(req.user.userId, dto);
  }

  @Delete(':provider')
  async disconnectIntegration(
    @Req() req: any,
    @Param('provider') provider: IntegrationProvider
  ) {
    return this.integrationsService.disconnectIntegration(
      req.user.userId,
      provider
    );
  }

  @Post(':provider/sync')
  async syncIntegration(
    @Req() req: any,
    @Param('provider') provider: IntegrationProvider
  ) {
    return this.integrationsService.syncContacts(req.user.userId, provider);
  }

  @Get('webhooks')
  async listWebhooks(@Req() req: any) {
    return this.webhooksService.getUserWebhooks(req.user.userId);
  }

  @Post('webhooks')
  async createWebhook(
    @Req() req: any,
    @Body() body: { url: string; events: WebhookEventType[] }
  ) {
    return this.webhooksService.createWebhookSubscription(
      req.user.userId,
      body.url,
      body.events,
    );
  }

  @Get('webhooks/:id')
  async getWebhook(@Req() req: any, @Param('id') id: string) {
    return this.webhooksService.getWebhookSubscription(req.user.userId, id);
  }

  @Patch('webhooks/:id')
  async updateWebhook(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { url?: string; events?: WebhookEventType[]; isActive?: boolean }
  ) {
    return this.webhooksService.updateWebhookSubscription(req.user.userId, id, body);
  }

  @Delete('webhooks/:id')
  async deleteWebhook(@Req() req: any, @Param('id') id: string) {
    return this.webhooksService.deleteWebhookSubscription(req.user.userId, id);
  }

  @Get('webhooks/:id/deliveries')
  async getWebhookDeliveries(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    return this.webhooksService.getWebhookDeliveries(
      req.user.userId,
      id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('webhooks/:id/deliveries/:deliveryId/retry')
  async retryWebhookDelivery(
    @Req() req: any,
    @Param('id') id: string,
    @Param('deliveryId') deliveryId: string
  ) {
    return this.webhooksService.retryDelivery(req.user.userId, id, deliveryId);
  }
}
