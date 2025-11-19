/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('Analytics Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let cardId: string;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.analyticsCardDaily.deleteMany();
    await prisma.analyticsEvent.deleteMany();
    await prisma.card.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'analytics@example.com',
        passwordHash: await argon2.hash('SecurePassword123!'),
        role: 'USER',
        subscription: {
          create: {
            tier: 'PRO',
            status: 'ACTIVE',
          },
        },
        emailVerified: true,
      },
    });
    userId = user.id;

    // Create test card
    const card = await prisma.card.create({
      data: {
        userId,
        firstName: 'Analytics',
        lastName: 'Test',
        slug: 'analytics-test-card',
      },
    });
    cardId = card.id;

    authToken = await getAuthToken(userId);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /analytics/events - Log Analytics Event', () => {
    it('should log card_view event', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          eventType: 'CARD_VIEW',
          cardId,
          metadata: {
            referrer: 'https://example.com',
            userAgent: 'Mozilla/5.0',
            ipAddress: '192.168.1.1',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.eventType).toBe('CARD_VIEW');
      expect(response.body.cardId).toBe(cardId);
    });

    it('should log link_click event', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          eventType: 'link_click',
          cardId,
          metadata: {
            linkType: 'email',
            linkUrl: 'mailto:test@example.com',
          },
        })
        .expect(201);

      expect(response.body.eventType).toBe('link_click');
    });

    it('should log contact_submit event', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          eventType: 'contact_submit',
          cardId,
          metadata: {
            contactName: 'Jane Doe',
          },
        })
        .expect(201);

      expect(response.body.eventType).toBe('contact_submit');
    });

    it('should log nfc_scan event', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          eventType: 'nfc_scan',
          cardId,
          metadata: {
            tagUid: '04:12:34:56:78:90:AB',
            deviceType: 'mobile',
          },
        })
        .expect(201);

      expect(response.body.eventType).toBe('nfc_scan');
    });

    it('should reject invalid event type', async () => {
      await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          eventType: 'invalid_event',
          cardId,
        })
        .expect(400);
    });

    it('should reject event with nonexistent cardId', async () => {
      await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          eventType: 'CARD_VIEW',
          cardId: 'nonexistent-card-id',
        })
        .expect(404);
    });
  });

  describe('Daily Aggregation', () => {
    it('should aggregate events into daily buckets', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create multiple events for today
      for (let i = 0; i < 10; i++) {
        await prisma.analyticsEvent.create({
          data: {
            cardId,
            eventType: 'CARD_VIEW',
            timestamp: new Date(),
            metadata: { iteration: i },
          },
        });
      }

      // Manually trigger aggregation (in production, this would be a cron job)
      await request(app.getHttpServer())
        .post('/analytics/aggregate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Query daily aggregate
      const aggregate = await prisma.analyticsCardDaily.findUnique({
        where: {
          cardId_date: {
            cardId,
            date: today,
          },
        },
      });

      expect(aggregate).toBeDefined();
      expect(aggregate!.views).toBeGreaterThanOrEqual(10);
    });

    it('should not create sub-daily aggregates', async () => {
      const allAggregates = await prisma.analyticsCardDaily.findMany({
        where: { cardId },
      });

      // Check that all aggregates are at daily granularity
      allAggregates.forEach((agg) => {
        const date = new Date(agg.date);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
      });
    });
  });

  describe('GET /analytics/cards/:cardId - Get Card Analytics', () => {
    it('should return card analytics for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate: '2025-11-01', endDate: '2025-11-30' })
        .expect(200);

      expect(response.body).toHaveProperty('viewCount');
      expect(response.body).toHaveProperty('linkClicks');
      expect(response.body).toHaveProperty('contactSubmissions');
      expect(response.body).toHaveProperty('dailyBreakdown');
      expect(Array.isArray(response.body.dailyBreakdown)).toBe(true);
    });

    it('should reject unauthorized access to analytics', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: await argon2.hash('SecurePassword123!'),
          role: 'USER',
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
            },
          },
          emailVerified: true,
        },
      });

      const otherToken = await getAuthToken(otherUser.id);

      await request(app.getHttpServer())
        .get(`/analytics/cards/${cardId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should enforce tier-based retention limits', async () => {
      // Create FREE tier user
      const freeUser = await prisma.user.create({
        data: {
          email: 'free-analytics@example.com',
          passwordHash: await argon2.hash('SecurePassword123!'),
          role: 'USER',
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
            },
          },
          emailVerified: true,
        },
      });

      const freeCard = await prisma.card.create({
        data: {
          userId: freeUser.id,
          firstName: 'Free',
          lastName: 'User',
          slug: 'free-user-card',
        },
      });

      // Create events older than 7 days (FREE tier limit)
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      await prisma.analyticsEvent.create({
        data: {
          cardId: freeCard.id,
          eventType: 'CARD_VIEW',
          timestamp: eightDaysAgo,
        },
      });

      const freeToken = await getAuthToken(freeUser.id);

      const response = await request(app.getHttpServer())
        .get(`/analytics/cards/${freeCard.id}`)
        .set('Authorization', `Bearer ${freeToken}`)
        .query({
          startDate: eightDaysAgo.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        })
        .expect(200);

      // FREE tier should only see last 7 days
      expect(response.body.dailyBreakdown.length).toBeLessThanOrEqual(7);
    });

    it('should include device breakdown', async () => {
      // Log events with different device types
      await prisma.analyticsEvent.create({
        data: {
          cardId,
          eventType: 'CARD_VIEW',
          metadata: { deviceType: 'mobile' },
        },
      });

      await prisma.analyticsEvent.create({
        data: {
          cardId,
          eventType: 'CARD_VIEW',
          metadata: { deviceType: 'desktop' },
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/analytics/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('deviceBreakdown');
      expect(response.body.deviceBreakdown).toHaveProperty('mobile');
      expect(response.body.deviceBreakdown).toHaveProperty('desktop');
    });

    it('should include referrer breakdown', async () => {
      // Log events with different referrers
      await prisma.analyticsEvent.create({
        data: {
          cardId,
          eventType: 'CARD_VIEW',
          metadata: { referrer: 'https://google.com' },
        },
      });

      await prisma.analyticsEvent.create({
        data: {
          cardId,
          eventType: 'CARD_VIEW',
          metadata: { referrer: 'https://linkedin.com' },
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/analytics/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('referrerBreakdown');
      expect(Array.isArray(response.body.referrerBreakdown)).toBe(true);
    });
  });

  describe('GET /analytics/cards/:cardId/export - Export Analytics', () => {
    it('should export analytics as CSV', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/cards/${cardId}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'csv' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('date,views,clicks,contacts');
    });

    it('should export analytics as JSON', async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/cards/${cardId}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'json' })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Analytics Cleanup (Retention)', () => {
    it('should delete old events based on tier retention', async () => {
      // Create FREE tier user
      const freeUser = await prisma.user.create({
        data: {
          email: 'retention-test@example.com',
          passwordHash: await argon2.hash('SecurePassword123!'),
          role: 'USER',
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
            },
          },
          emailVerified: true,
        },
      });

      const freeCard = await prisma.card.create({
        data: {
          userId: freeUser.id,
          firstName: 'Retention',
          lastName: 'Test',
          slug: 'retention-test-card',
        },
      });

      // Create old event (8 days ago, beyond FREE tier 7-day limit)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);

      const oldEvent = await prisma.analyticsEvent.create({
        data: {
          cardId: freeCard.id,
          eventType: 'CARD_VIEW',
          timestamp: oldDate,
        },
      });

      // Trigger cleanup
      await request(app.getHttpServer())
        .post('/analytics/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Old event should be deleted
      const deletedEvent = await prisma.analyticsEvent.findUnique({
        where: { id: oldEvent.id },
      });

      expect(deletedEvent).toBeNull();
    });
  });

  // Helper function to get auth token
  async function getAuthToken(userId: string): Promise<string> {
    const jwt = await import('jsonwebtoken');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }
});
