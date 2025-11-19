import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured - payment features disabled'
      );
      this.stripe = null;
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      if (!user.subscription) {
        await this.prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId,
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.ACTIVE,
          },
        });
      } else {
        await this.prisma.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId },
        });
      }
    }

    const priceId = this.getPriceIdForTier(tier);
    if (!priceId) {
      throw new Error(`No price configured for tier: ${tier}`);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        tier,
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`
      );
      throw new Error('Invalid signature');
    }

    this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

    const _idempotencyKey = `webhook:${event.id}`;
    const existingLog = await this.prisma.activityLog.findFirst({
      where: {
        action: 'webhook_processed',
        metadata: {
          path: ['eventId'],
          equals: event.id,
        },
      },
    });

    if (existingLog) {
      this.logger.log(`Webhook ${event.id} already processed, skipping`);
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice
          );
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      await this.prisma.activityLog.create({
        data: {
          action: 'webhook_processed',
          entityType: 'stripe_webhook',
          entityId: event.id,
          metadata: {
            eventId: event.id,
            eventType: event.type,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to process webhook ${event.id}: ${error.message}`
      );
      throw error;
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in subscription metadata');
      return;
    }

    const tier = this.getTierFromPriceId(subscription.items.data[0]?.price?.id);
    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price?.id,
        tier,
        status,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      },
    });

    this.logger.log(`Subscription created for user ${userId}, tier: ${tier}`);
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSub) {
      this.logger.error(`Subscription not found: ${subscription.id}`);
      return;
    }

    const tier = this.getTierFromPriceId(subscription.items.data[0]?.price?.id);
    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: subscription.items.data[0]?.price?.id,
        tier,
        status,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      },
    });

    this.logger.log(
      `Subscription updated: ${subscription.id}, tier: ${tier}, status: ${status}`
    );
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSub) {
      this.logger.error(`Subscription not found: ${subscription.id}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELED,
      },
    });

    this.logger.log(`Subscription deleted: ${subscription.id}`);
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    const invoiceAny = invoice as any;
    if (!invoiceAny.subscription) {
      return;
    }

    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoiceAny.subscription as string },
    });

    if (!existingSub) {
      this.logger.error(`Subscription not found: ${invoiceAny.subscription}`);
      return;
    }

    await this.prisma.invoice.create({
      data: {
        subscriptionId: existingSub.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid || 0,
        currency: invoice.currency,
        status: invoice.status || 'unknown',
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      },
    });

    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<void> {
    const invoiceAny = invoice as any;
    if (!invoiceAny.subscription) {
      return;
    }

    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoiceAny.subscription as string },
    });

    if (!existingSub) {
      this.logger.error(`Subscription not found: ${invoiceAny.subscription}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: invoiceAny.subscription as string },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    await this.prisma.invoice.create({
      data: {
        subscriptionId: existingSub.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due || 0,
        currency: invoice.currency,
        status: invoice.status || 'unknown',
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      },
    });

    this.logger.log(`Invoice payment failed: ${invoice.id}`);
  }

  private getPriceIdForTier(tier: SubscriptionTier): string | null {
    const priceMap: Record<SubscriptionTier, string | null> = {
      [SubscriptionTier.FREE]: null,
      [SubscriptionTier.PRO]:
        this.configService.get<string>('STRIPE_PRICE_ID_PRO') || null,
      [SubscriptionTier.PREMIUM]:
        this.configService.get<string>('STRIPE_PRICE_ID_PREMIUM') || null,
    };
    return priceMap[tier] || null;
  }

  private getTierFromPriceId(priceId: string): SubscriptionTier {
    const proPriceId = this.configService.get<string>('STRIPE_PRICE_ID_PRO');
    const premiumPriceId = this.configService.get<string>(
      'STRIPE_PRICE_ID_PREMIUM'
    );

    if (priceId === proPriceId) return SubscriptionTier.PRO;
    if (priceId === premiumPriceId) return SubscriptionTier.PREMIUM;
    return SubscriptionTier.FREE;
  }

  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status
  ): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.PAST_DUE,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.TRIALING,
      paused: SubscriptionStatus.CANCELED,
    };
    return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
  }

  async cancelSubscription(userId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(
      `Subscription will be canceled at period end for user ${userId}`
    );
  }

  async getSubscriptionUsage(userId: string): Promise<{
    cardsUsed: number;
    cardsLimit: number;
    contactsCount: number;
    contactsLimit: number;
    analyticsRetentionDays: number;
  }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const tier = subscription?.tier || SubscriptionTier.FREE;

    const cardsCount = await this.prisma.card.count({
      where: { userId },
    });

    const contactsCount = await this.prisma.contact.count({
      where: { userId },
    });

    const limits = {
      [SubscriptionTier.FREE]: { cards: 1, contacts: 50, retention: 7 },
      [SubscriptionTier.PRO]: { cards: 5, contacts: -1, retention: 90 },
      [SubscriptionTier.PREMIUM]: { cards: -1, contacts: -1, retention: -1 },
    };

    const tierLimits = limits[tier];

    return {
      cardsUsed: cardsCount,
      cardsLimit: tierLimits.cards,
      contactsCount,
      contactsLimit: tierLimits.contacts,
      analyticsRetentionDays: tierLimits.retention,
    };
  }
}
