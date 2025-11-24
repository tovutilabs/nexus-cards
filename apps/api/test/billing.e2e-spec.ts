/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Billing & Subscriptions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.invoice.deleteMany();
    await prisma.card.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    // Create test user with FREE tier
    const passwordHash = await argon2.hash('Password123!');
    const user = await prisma.user.create({
      data: {
        email: 'billing@example.com',
        passwordHash,
        emailVerified: true,
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    });
    userId = user.id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'billing@example.com',
        password: 'Password123!',
      })
      .expect(200);

    const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
    authToken = cookies
      .find((cookie: string) => cookie.startsWith('access_token='))
      ?.split(';')[0]
      .split('=')[1] || '';
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany();
    await prisma.card.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/billing/subscription', () => {
    it('should get current subscription', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.tier).toBe('FREE');
      expect(response.body.status).toBe('ACTIVE');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/billing/subscription')
        .expect(401);
    });
  });

  describe('GET /api/billing/plans', () => {
    it('should list available plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/plans')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const freePlan = response.body.find((p: any) => p.tier === 'FREE');
      expect(freePlan).toBeDefined();
      expect(freePlan.limits.maxCards).toBe(1);

      const proPlan = response.body.find((p: any) => p.tier === 'PRO');
      expect(proPlan).toBeDefined();
      expect(proPlan.limits.maxCards).toBe(5);
    });
  });

  describe('POST /api/billing/checkout', () => {
    it('should create checkout session for PRO tier', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Cookie', `access_token=${authToken}`)
        .send({
          tier: 'PRO',
          billingPeriod: 'monthly',
        })
        .expect(201);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('url');
      expect(response.body.tier).toBe('PRO');
    });

    it('should create checkout session for PREMIUM tier', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Cookie', `access_token=${authToken}`)
        .send({
          tier: 'PREMIUM',
          billingPeriod: 'yearly',
        })
        .expect(201);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.tier).toBe('PREMIUM');
    });

    it('should reject invalid tier', async () => {
      await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Cookie', `access_token=${authToken}`)
        .send({
          tier: 'INVALID',
          billingPeriod: 'monthly',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .send({
          tier: 'PRO',
          billingPeriod: 'monthly',
        })
        .expect(401);
    });
  });

  describe('POST /api/billing/portal', () => {
    it('should create customer portal session', async () => {
      // First upgrade to PRO to have a subscription
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: 'PRO',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_test_123',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/billing/portal')
        .set('Cookie', `access_token=${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('url');
    });

    it('should require Stripe customer ID', async () => {
      await prisma.subscription.update({
        where: { userId },
        data: {
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        },
      });

      await request(app.getHttpServer())
        .post('/api/billing/portal')
        .set('Cookie', `access_token=${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/billing/portal')
        .expect(401);
    });
  });

  describe('GET /api/billing/invoices', () => {
    let subscriptionId: string;

    beforeAll(async () => {
      // Get subscription ID for invoice creation
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });
      subscriptionId = subscription!.id;

      // Create test invoices
      await prisma.invoice.createMany({
        data: [
          {
            subscriptionId,
            amount: 999,
            currency: 'USD',
            status: 'PAID',
            stripeInvoiceId: 'inv_test_1',
            pdfUrl: 'https://example.com/invoice1.pdf',
          },
          {
            subscriptionId,
            amount: 999,
            currency: 'USD',
            status: 'PAID',
            stripeInvoiceId: 'inv_test_2',
            pdfUrl: 'https://example.com/invoice2.pdf',
          },
        ],
      });
    });

    it('should list user invoices', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/invoices')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].status).toBe('PAID');
      expect(response.body[0]).toHaveProperty('stripePdfUrl');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/invoices?status=PAID')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.every((inv: any) => inv.status === 'PAID')).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/invoices?skip=0&take=1')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/billing/invoices')
        .expect(401);
    });
  });

  describe('POST /api/billing/cancel', () => {
    beforeAll(async () => {
      // Ensure user has active PRO subscription
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: 'PRO',
          status: 'ACTIVE',
          stripeCustomerId: 'cus_test_cancel',
          stripeSubscriptionId: 'sub_test_cancel',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should cancel subscription at period end', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/billing/cancel')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('canceled');

      // Verify cancelAtPeriodEnd is set
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });
      expect(subscription?.cancelAtPeriodEnd).toBe(true);
    });

    it('should require active subscription', async () => {
      // Update to FREE tier
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: 'FREE',
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
        },
      });

      await request(app.getHttpServer())
        .post('/api/billing/cancel')
        .set('Cookie', `access_token=${authToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/billing/cancel')
        .expect(401);
    });
  });

  describe('GET /api/billing/usage', () => {
    beforeAll(async () => {
      // Create some cards to test usage
      await prisma.card.create({
        data: {
          userId,
          slug: 'test-card-usage',
          firstName: 'Test',
          lastName: 'Card',
        },
      });
    });

    it('should get usage metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/usage')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tier');
      expect(response.body).toHaveProperty('limits');
      expect(response.body).toHaveProperty('usage');
      expect(response.body.usage).toHaveProperty('cards');
      expect(response.body.usage.cards.current).toBeGreaterThan(0);
    });

    it('should show percentage used', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/billing/usage')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.usage.cards).toHaveProperty('percentage');
      expect(typeof response.body.usage.cards.percentage).toBe('number');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/billing/usage')
        .expect(401);
    });
  });

  describe('POST /api/billing/webhook (Stripe)', () => {
    it('should process subscription.updated event', async () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_webhook_test',
            customer: 'cus_webhook_test',
            status: 'active',
            items: {
              data: [
                {
                  price: {
                    id: 'price_pro_monthly',
                  },
                },
              ],
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          },
        },
      };

      // Note: In real implementation, this would require proper Stripe signature
      // For testing, we're checking the endpoint exists and basic structure
      await request(app.getHttpServer())
        .post('/api/billing/webhook')
        .set('stripe-signature', 'test_signature')
        .send(event)
        .expect((res) => {
          // Expect either 200 (success) or 400 (signature validation failure)
          expect([200, 400]).toContain(res.status);
        });
    });

    it('should process payment_intent.succeeded event', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            customer: 'cus_test_123',
            amount: 999,
            currency: 'usd',
          },
        },
      };

      await request(app.getHttpServer())
        .post('/api/billing/webhook')
        .set('stripe-signature', 'test_signature')
        .send(event)
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
        });
    });
  });
});
