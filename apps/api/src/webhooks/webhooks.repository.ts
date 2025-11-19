import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEventType } from '@prisma/client';

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.webhookSubscription.findUnique({
      where: { id },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByEvent(eventType: WebhookEventType) {
    return this.prisma.webhookSubscription.findMany({
      where: {
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });
  }

  async create(data: {
    userId: string;
    url: string;
    events: WebhookEventType[];
    secret: string;
  }) {
    return this.prisma.webhookSubscription.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      url?: string;
      events?: WebhookEventType[];
      isActive?: boolean;
      secret?: string;
    }
  ) {
    return this.prisma.webhookSubscription.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.webhookSubscription.delete({
      where: { id },
    });
  }

  async createDelivery(data: {
    webhookSubscriptionId: string;
    eventType: WebhookEventType;
    payload: any;
  }) {
    return this.prisma.webhookDelivery.create({
      data,
    });
  }

  async updateDelivery(
    id: string,
    data: {
      responseStatus?: number;
      responseBody?: string;
      attemptCount?: number;
      deliveredAt?: Date;
      failedAt?: Date;
      nextRetryAt?: Date;
    }
  ) {
    return this.prisma.webhookDelivery.update({
      where: { id },
      data,
    });
  }

  async getDeliveriesBySubscription(webhookSubscriptionId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookSubscriptionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPendingRetries() {
    return this.prisma.webhookDelivery.findMany({
      where: {
        nextRetryAt: {
          lte: new Date(),
        },
        deliveredAt: null,
        attemptCount: {
          lt: 5,
        },
      },
      include: {
        webhookSubscription: true,
      },
    });
  }
}
