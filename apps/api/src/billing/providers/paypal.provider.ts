import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PayPalProvider implements PaymentProvider {
  private readonly logger = new Logger(PayPalProvider.name);
  name = 'PayPal';

  async createCheckoutSession(
    userId: string,
    _amount: number,
    _currency: string
  ): Promise<{ url: string }> {
    this.logger.log(`PayPal checkout session requested for user ${userId}`);
    throw new Error('PayPal integration not yet implemented');
  }

  async processWebhook(_signature: string, _rawBody: Buffer): Promise<void> {
    this.logger.log('PayPal webhook received');
    throw new Error('PayPal webhook processing not yet implemented');
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(
      `PayPal subscription cancellation requested: ${subscriptionId}`
    );
    throw new Error('PayPal cancellation not yet implemented');
  }
}
