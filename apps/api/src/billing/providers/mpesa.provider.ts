import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class MPesaProvider implements PaymentProvider {
  private readonly logger = new Logger(MPesaProvider.name);
  name = 'M-Pesa';

  async createCheckoutSession(
    userId: string,
    _amount: number,
    _currency: string
  ): Promise<{ url: string }> {
    this.logger.log(`M-Pesa checkout session requested for user ${userId}`);
    throw new Error('M-Pesa integration not yet implemented');
  }

  async processWebhook(_signature: string, _rawBody: Buffer): Promise<void> {
    this.logger.log('M-Pesa webhook received');
    throw new Error('M-Pesa webhook processing not yet implemented');
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(
      `M-Pesa subscription cancellation requested: ${subscriptionId}`
    );
    throw new Error('M-Pesa cancellation not yet implemented');
  }
}
