import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WebhooksRepository } from './webhooks.repository';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEventType } from '@prisma/client';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly webhooksRepository: WebhooksRepository,
    private readonly prisma: PrismaService
  ) {}

  async deliverWebhook(
    eventType: WebhookEventType,
    payload: Record<string, any>
  ) {
    const subscriptions =
      await this.webhooksRepository.findActiveByEvent(eventType);

    for (const subscription of subscriptions) {
      const delivery = await this.webhooksRepository.createDelivery({
        webhookSubscriptionId: subscription.id,
        eventType,
        payload,
      });

      this.sendWebhook(
        delivery.id,
        subscription.url,
        subscription.secret,
        payload
      ).catch((error) => {
        this.logger.error(
          `Failed to deliver webhook ${delivery.id}: ${error.message}`
        );
      });
    }
  }

  async retryDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhookSubscription: true },
    });
    if (!delivery || delivery.deliveredAt) {
      return false;
    }

    await this.sendWebhook(
      delivery.id,
      delivery.webhookSubscription.url,
      delivery.webhookSubscription.secret,
      delivery.payload as Record<string, any>
    );

    return true;
  }

  private async sendWebhook(
    deliveryId: string,
    url: string,
    secret: string,
    payload: Record<string, any>
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, secret, timestamp);

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': timestamp.toString(),
          },
          timeout: 10000,
        })
      );

      await this.webhooksRepository.updateDelivery(deliveryId, {
        responseStatus: (response as any).status,
        responseBody: JSON.stringify((response as any).data).substring(0, 1000),
        deliveredAt: new Date(),
      });

      this.logger.log(`Webhook ${deliveryId} delivered successfully`);
    } catch (error) {
      const delivery = await this.webhooksRepository[
        'prisma'
      ].webhookDelivery.findUnique({
        where: { id: deliveryId },
      });

      const attemptCount = (delivery?.attemptCount || 0) + 1;
      const nextRetryAt = this.calculateNextRetry(attemptCount);

      await this.webhooksRepository.updateDelivery(deliveryId, {
        responseStatus: error.response?.status,
        responseBody: error.message.substring(0, 1000),
        attemptCount,
        failedAt: attemptCount >= 5 ? new Date() : undefined,
        nextRetryAt: attemptCount < 5 ? nextRetryAt : undefined,
      });

      this.logger.error(
        `Webhook ${deliveryId} failed (attempt ${attemptCount}): ${error.message}`
      );
    }
  }

  private generateSignature(
    payload: string,
    secret: string,
    timestamp: number
  ): string {
    const signaturePayload = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');
  }

  private calculateNextRetry(attemptCount: number): Date {
    const delays = [60, 300, 900, 3600, 7200];
    const delaySeconds = delays[Math.min(attemptCount - 1, delays.length - 1)];
    return new Date(Date.now() + delaySeconds * 1000);
  }

  async processRetries() {
    const pendingRetries = await this.webhooksRepository.getPendingRetries();

    for (const delivery of pendingRetries) {
      await this.sendWebhook(
        delivery.id,
        delivery.webhookSubscription.url,
        delivery.webhookSubscription.secret,
        delivery.payload as Record<string, any>
      );
    }

    return pendingRetries.length;
  }
}
