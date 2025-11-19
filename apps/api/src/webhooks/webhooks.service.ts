import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { WebhooksRepository } from './webhooks.repository';
import { WebhookEventType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly webhooksRepository: WebhooksRepository) {}

  async getUserWebhooks(userId: string) {
    const webhooks = await this.webhooksRepository.findAllByUserId(userId);

    return webhooks.map((webhook: any) => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    }));
  }

  async getWebhookDetails(userId: string, webhookId: string) {
    const webhook = await this.webhooksRepository.findById(webhookId);

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const deliveries =
      await this.webhooksRepository.getDeliveriesBySubscription(webhookId, 50);

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      deliveries: deliveries.map((d: any) => ({
        id: d.id,
        eventType: d.eventType,
        attemptCount: d.attemptCount,
        responseStatus: d.responseStatus,
        deliveredAt: d.deliveredAt,
        failedAt: d.failedAt,
        createdAt: d.createdAt,
      })),
    };
  }

  async createWebhook(
    userId: string,
    data: {
      url: string;
      events: WebhookEventType[];
    }
  ) {
    if (!this.isValidUrl(data.url)) {
      throw new BadRequestException('Invalid URL');
    }

    if (!data.events || data.events.length === 0) {
      throw new BadRequestException('At least one event type is required');
    }

    const secret = this.generateSecret();

    const webhook = await this.webhooksRepository.create({
      userId,
      url: data.url,
      events: data.events,
      secret,
    });

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
    };
  }

  async updateWebhook(
    userId: string,
    webhookId: string,
    data: {
      url?: string;
      events?: WebhookEventType[];
      isActive?: boolean;
    }
  ) {
    const webhook = await this.webhooksRepository.findById(webhookId);

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (data.url && !this.isValidUrl(data.url)) {
      throw new BadRequestException('Invalid URL');
    }

    if (data.events && data.events.length === 0) {
      throw new BadRequestException('At least one event type is required');
    }

    const updated = await this.webhooksRepository.update(webhookId, data);

    return {
      id: updated.id,
      url: updated.url,
      events: updated.events,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteWebhook(userId: string, webhookId: string) {
    const webhook = await this.webhooksRepository.findById(webhookId);

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.webhooksRepository.delete(webhookId);

    return { message: 'Webhook deleted successfully' };
  }

  async regenerateSecret(userId: string, webhookId: string) {
    const webhook = await this.webhooksRepository.findById(webhookId);

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const secret = this.generateSecret();

    const updated = await this.webhooksRepository.update(webhookId, { secret });

    return { secret: updated.secret };
  }

  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('base64url')}`;
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
