import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IntegrationProvider, WebhookEventType } from '@prisma/client';

describe('Integrations (e2e)', () => {
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

    prisma = app.get(PrismaService);

    // Clean up test data
    await prisma.webhookDelivery.deleteMany({});
    await prisma.webhookSubscription.deleteMany({});
    await prisma.integration.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'integrations-test@example.com' },
    });

    // Create test user
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'integrations-test@example.com',
        password: 'Test123!@#',
        firstName: 'Integration',
        lastName: 'Test',
      })
      .expect(201);

    authToken = signupResponse.body.accessToken;
    userId = signupResponse.body.user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.webhookDelivery.deleteMany({});
    await prisma.webhookSubscription.deleteMany({});
    await prisma.integration.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'integrations-test@example.com' },
    });
    await app.close();
  });

  describe('GET /integrations', () => {
    it('should return empty array when no integrations', () => {
      return request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect([]);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/integrations')
        .expect(401);
    });
  });

  describe('POST /integrations/connect', () => {
    it('should connect Salesforce integration', async () => {
      const response = await request(app.getHttpServer())
        .post('/integrations/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: IntegrationProvider.SALESFORCE,
          credentials: {
            accessToken: 'test-token',
            instanceUrl: 'https://test.salesforce.com',
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        provider: IntegrationProvider.SALESFORCE,
        status: 'ACTIVE',
      });
      expect(response.body.credentials).toBeDefined();
    });

    it('should connect HubSpot integration', async () => {
      const response = await request(app.getHttpServer())
        .post('/integrations/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: IntegrationProvider.HUBSPOT,
          credentials: {
            accessToken: 'test-hubspot-token',
          },
        })
        .expect(201);

      expect(response.body.provider).toBe(IntegrationProvider.HUBSPOT);
    });

    it('should update existing integration credentials', async () => {
      await request(app.getHttpServer())
        .post('/integrations/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: IntegrationProvider.MAILCHIMP,
          credentials: {
            apiKey: 'old-key',
            audienceId: 'audience-123',
          },
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/integrations/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: IntegrationProvider.MAILCHIMP,
          credentials: {
            apiKey: 'new-key',
            audienceId: 'audience-123',
          },
        })
        .expect(201);

      expect(response.body.credentials.apiKey).toBe('new-key');
    });

    it('should reject invalid provider', () => {
      return request(app.getHttpServer())
        .post('/integrations/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'INVALID_PROVIDER',
          credentials: {},
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/integrations/connect')
        .send({
          provider: IntegrationProvider.SALESFORCE,
          credentials: {},
        })
        .expect(401);
    });
  });

  describe('GET /integrations (after connecting)', () => {
    it('should return list of connected integrations', async () => {
      const response = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('provider');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('credentials');
    });
  });

  describe('POST /integrations/:provider/sync', () => {
    it('should trigger sync for connected integration', async () => {
      const response = await request(app.getHttpServer())
        .post(`/integrations/${IntegrationProvider.SALESFORCE}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail for non-connected integration', () => {
      return request(app.getHttpServer())
        .post(`/integrations/${IntegrationProvider.ZAPIER}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('DELETE /integrations/:provider', () => {
    it('should disconnect integration', async () => {
      await request(app.getHttpServer())
        .delete(`/integrations/${IntegrationProvider.HUBSPOT}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const listResponse = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const hubspot = listResponse.body.find(
        (i: any) => i.provider === IntegrationProvider.HUBSPOT,
      );
      expect(hubspot).toBeUndefined();
    });

    it('should fail for non-existent integration', () => {
      return request(app.getHttpServer())
        .delete(`/integrations/${IntegrationProvider.ZOHO}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /integrations/webhooks', () => {
    it('should create webhook subscription', async () => {
      const response = await request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/webhook',
          events: [WebhookEventType.CONTACT_CREATED, WebhookEventType.CARD_VIEW],
        })
        .expect(201);

      expect(response.body).toMatchObject({
        url: 'https://example.com/webhook',
        events: expect.arrayContaining([
          WebhookEventType.CONTACT_CREATED,
          WebhookEventType.CARD_VIEW,
        ]),
        isActive: true,
      });
      expect(response.body.secret).toBeDefined();
    });

    it('should require valid URL', () => {
      return request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'not-a-url',
          events: [WebhookEventType.CONTACT_CREATED],
        })
        .expect(400);
    });

    it('should require at least one event', () => {
      return request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/webhook',
          events: [],
        })
        .expect(400);
    });
  });

  describe('GET /integrations/webhooks', () => {
    it('should return list of webhooks', async () => {
      const response = await request(app.getHttpServer())
        .get('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('url');
      expect(response.body[0]).toHaveProperty('events');
      expect(response.body[0]).toHaveProperty('secret');
    });
  });

  describe('PATCH /integrations/webhooks/:id', () => {
    let webhookId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/webhook-update',
          events: [WebhookEventType.LINK_CLICK],
        });

      webhookId = response.body.id;
    });

    it('should update webhook URL', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/webhook-updated',
        })
        .expect(200);

      expect(response.body.url).toBe('https://example.com/webhook-updated');
    });

    it('should update webhook events', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          events: [
            WebhookEventType.CONTACT_CREATED,
            WebhookEventType.SUBSCRIPTION_UPDATED,
          ],
        })
        .expect(200);

      expect(response.body.events).toEqual(
        expect.arrayContaining([
          WebhookEventType.CONTACT_CREATED,
          WebhookEventType.SUBSCRIPTION_UPDATED,
        ]),
      );
    });

    it('should toggle webhook active state', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it('should fail for non-existent webhook', () => {
      return request(app.getHttpServer())
        .patch('/integrations/webhooks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(400);
    });
  });

  describe('GET /integrations/webhooks/:id/deliveries', () => {
    let webhookId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/webhook-deliveries',
          events: [WebhookEventType.CARD_VIEW],
        });

      webhookId = response.body.id;

      // Create a test delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookSubscriptionId: webhookId,
          eventType: WebhookEventType.CARD_VIEW,
          payload: { cardId: 'test-card' },
          attemptCount: 1,
          responseStatus: 200,
          deliveredAt: new Date(),
        },
      });
    });

    it('should return delivery history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/integrations/webhooks/${webhookId}/deliveries`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('eventType');
      expect(response.body[0]).toHaveProperty('payload');
      expect(response.body[0]).toHaveProperty('attemptCount');
    });

    it('should support limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/integrations/webhooks/${webhookId}/deliveries?limit=5`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('DELETE /integrations/webhooks/:id', () => {
    it('should delete webhook subscription', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/webhook-delete',
          events: [WebhookEventType.CONTACT_CREATED],
        });

      const webhookId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Integration workflows', () => {
    it('should handle complete integration lifecycle', async () => {
      // 1. Connect integration
      const connectResponse = await request(app.getHttpServer())
        .post('/integrations/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: IntegrationProvider.SENDGRID,
          credentials: {
            apiKey: 'test-sendgrid-key',
            listId: 'list-123',
          },
        })
        .expect(201);

      expect(connectResponse.body.status).toBe('ACTIVE');

      // 2. Sync integration
      await request(app.getHttpServer())
        .post(`/integrations/${IntegrationProvider.SENDGRID}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // 3. List integrations
      const listResponse = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const sendgrid = listResponse.body.find(
        (i: any) => i.provider === IntegrationProvider.SENDGRID,
      );
      expect(sendgrid).toBeDefined();

      // 4. Disconnect integration
      await request(app.getHttpServer())
        .delete(`/integrations/${IntegrationProvider.SENDGRID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 5. Verify disconnected
      const finalListResponse = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const disconnectedSendgrid = finalListResponse.body.find(
        (i: any) => i.provider === IntegrationProvider.SENDGRID,
      );
      expect(disconnectedSendgrid).toBeUndefined();
    });

    it('should handle complete webhook lifecycle', async () => {
      // 1. Create webhook
      const createResponse = await request(app.getHttpServer())
        .post('/integrations/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/lifecycle-webhook',
          events: [WebhookEventType.CONTACT_CREATED],
        })
        .expect(201);

      const webhookId = createResponse.body.id;

      // 2. Update webhook
      await request(app.getHttpServer())
        .patch(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          events: [
            WebhookEventType.CONTACT_CREATED,
            WebhookEventType.CARD_VIEW,
          ],
        })
        .expect(200);

      // 3. Disable webhook
      await request(app.getHttpServer())
        .patch(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      // 4. Re-enable webhook
      await request(app.getHttpServer())
        .patch(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: true,
        })
        .expect(200);

      // 5. Delete webhook
      await request(app.getHttpServer())
        .delete(`/integrations/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
