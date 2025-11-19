export interface PaymentProvider {
  name: string;
  createCheckoutSession(userId: string, amount: number, currency: string): Promise<{ url: string }>;
  processWebhook(signature: string, rawBody: Buffer): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
