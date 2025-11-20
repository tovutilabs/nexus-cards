import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEventType, Prisma } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async createWebhookSubscription(
    userId: string,
    url: string,
    events: WebhookEventType[],
  ) {
    const secret = crypto.randomBytes(32).toString('hex');

    return this.prisma.webhookSubscription.create({
      data: {
        userId,
        url,
        events,
        secret,
        isActive: true,
      },
    });
  }

  async listSubscriptions(userId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserWebhooks(userId: string) {
    return this.listSubscriptions(userId);
  }

  async getWebhookSubscription(userId: string, id: string) {
    const webhook = await this.prisma.webhookSubscription.findFirst({
      where: { id, userId },
    });

    if (!webhook) {
      throw new BadRequestException('Webhook subscription not found');
    }

    return webhook;
  }

  async updateWebhookSubscription(
    userId: string,
    id: string,
    data: { url?: string; events?: WebhookEventType[]; isActive?: boolean },
  ) {
    const webhook = await this.getWebhookSubscription(userId, id);

    return this.prisma.webhookSubscription.update({
      where: { id: webhook.id },
      data,
    });
  }

  async deleteWebhookSubscription(userId: string, id: string) {
    const webhook = await this.getWebhookSubscription(userId, id);

    await this.prisma.webhookSubscription.delete({
      where: { id: webhook.id },
    });

    return { success: true };
  }

  async getWebhookDeliveries(
    userId: string,
    webhookId: string,
    limit: number = 50,
  ) {
    const webhook = await this.prisma.webhookSubscription.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      throw new BadRequestException('Webhook subscription not found');
    }

    return this.prisma.webhookDelivery.findMany({
      where: { webhookSubscriptionId: webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async triggerEvent(
    userId: string,
    eventType: WebhookEventType,
    payload: any,
  ) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: {
        userId,
        events: { has: eventType },
        isActive: true,
      },
    });

    for (const subscription of subscriptions) {
      await this.createAndSendDelivery(subscription, eventType, payload);
    }
  }

  private async createAndSendDelivery(
    subscription: any,
    eventType: WebhookEventType,
    payload: any,
  ) {
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookSubscriptionId: subscription.id,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        attemptCount: 0,
      },
    });

    await this.sendDelivery(subscription, delivery);
  }

  private async sendDelivery(subscription: any, delivery: any) {
    try {
      const signature = crypto
        .createHmac('sha256', subscription.secret)
        .update(JSON.stringify(delivery.payload))
        .digest('hex');

      const response = await axios.post(subscription.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': subscription.id,
          'X-Webhook-Event': delivery.eventType,
        },
        timeout: 10000,
      });

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          deliveredAt: new Date(),
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 1000),
          attemptCount: { increment: 1 },
        },
      });
    } catch (error: any) {
      const nextAttempt = delivery.attemptCount + 1;
      const nextRetryAt =
        nextAttempt < 5
          ? new Date(Date.now() + Math.pow(2, nextAttempt) * 1000)
          : null;

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          failedAt: new Date(),
          responseStatus: error.response?.status || 0,
          responseBody: error.message.substring(0, 1000),
          attemptCount: { increment: 1 },
          nextRetryAt,
        },
      });

      const failedCount = await this.prisma.webhookDelivery.count({
        where: {
          webhookSubscriptionId: subscription.id,
          failedAt: { not: null },
          deliveredAt: null,
        },
      });

      if (failedCount >= 10) {
        await this.prisma.webhookSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        });
      }
    }
  }

  async processDeliveryQueue() {
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        deliveredAt: null,
        OR: [
          { failedAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
        attemptCount: { lt: 5 },
      },
      include: {
        webhookSubscription: true,
      },
      take: 100,
    });

    for (const delivery of deliveries) {
      if (delivery.webhookSubscription.isActive) {
        await this.sendDelivery(delivery.webhookSubscription, delivery);
      }
    }
  }

  async retryDelivery(userId: string, webhookId: string, deliveryId: string) {
    const webhook = await this.prisma.webhookSubscription.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      throw new BadRequestException('Webhook subscription not found');
    }

    const targetDelivery = await this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, webhookSubscriptionId: webhookId },
    });

    if (!targetDelivery) {
      throw new BadRequestException('Delivery not found');
    }

    if (targetDelivery.deliveredAt) {
      throw new BadRequestException('Delivery already succeeded');
    }

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        failedAt: null,
        nextRetryAt: null,
        attemptCount: 0,
      },
    });

    await this.sendDelivery(webhook, targetDelivery);

    return { success: true };
  }
}
