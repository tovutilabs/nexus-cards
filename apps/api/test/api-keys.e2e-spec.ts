/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('API Keys Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let premiumUserId: string;
  let freeUserId: string;
  let apiKey: string;
  let apiKeyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.apiKey.deleteMany();
    await prisma.card.deleteMany();
    await prisma.user.deleteMany();

    // Create Premium user
    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium@example.com',
        passwordHash: await argon2.hash('SecurePassword123!'),
        role: 'USER',
        emailVerified: true,
        subscription: {
          create: {
            tier: 'PREMIUM',
            status: 'ACTIVE',
          },
        },
      },
    });
    premiumUserId = premiumUser.id;

    // Create Free user
    const freeUser = await prisma.user.create({
      data: {
        email: 'free@example.com',
        passwordHash: await argon2.hash('SecurePassword123!'),
        role: 'USER',
        emailVerified: true,
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    });
    freeUserId = freeUser.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api-keys - Generate API Key', () => {
    it('should allow Premium user to generate API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${await getAuthToken(premiumUserId)}`)
        .send({ name: 'Test API Key' })
        .expect(201);

      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('keyId');
      expect(response.body.key).toMatch(/^nxk_[A-Za-z0-9_-]+$/);

      apiKey = response.body.key;
      apiKeyId = response.body.keyId;
    });

    it('should reject Free tier user from generating API key', async () => {
      await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${await getAuthToken(freeUserId)}`)
        .send({ name: 'Forbidden API Key' })
        .expect(403);
    });

    it('should reject Pro tier user from generating API key', async () => {
      const proUser = await prisma.user.create({
        data: {
          email: 'pro@example.com',
          passwordHash: await argon2.hash('SecurePassword123!'),
          role: 'USER',
          emailVerified: true,
          subscription: {
            create: {
              tier: 'PRO',
              status: 'ACTIVE',
            },
          },
        },
      });

      await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${await getAuthToken(proUser.id)}`)
        .send({ name: 'Forbidden API Key' })
        .expect(403);
    });
  });

  describe('API Key Authentication', () => {
    it('should authenticate valid API key for protected endpoints', async () => {
      // Create a card for the premium user
      const card = await prisma.card.create({
        data: {
          userId: premiumUserId,
          firstName: 'John',
          lastName: 'Doe',
          slug: 'test-card-' + Date.now(),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id', card.id);
    });

    it('should reject invalid API key', async () => {
      await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', 'nxk_invalid_key_12345')
        .expect(401);
    });

    it('should reject revoked API key', async () => {
      // Revoke the API key
      await request(app.getHttpServer())
        .post(`/api-keys/${apiKeyId}/revoke`)
        .set('Authorization', `Bearer ${await getAuthToken(premiumUserId)}`)
        .expect(200);

      // Try to use revoked key
      await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', apiKey)
        .expect(401);

      // Generate new key for remaining tests
      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${await getAuthToken(premiumUserId)}`)
        .send({ name: 'Replacement API Key' })
        .expect(201);

      apiKey = response.body.key;
      apiKeyId = response.body.keyId;
    });

    it('should reject request without API key header', async () => {
      await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit (100 requests per 60 seconds)', async () => {
      const requests = [];

      // Make 101 requests rapidly
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/public-api/v1/cards')
            .set('X-API-Key', apiKey)
        );
      }

      const responses = await Promise.all(requests);

      const successCount = responses.filter(
        (r: any) => r.status === 200
      ).length;
      const rateLimitCount = responses.filter(
        (r: any) => r.status === 429
      ).length;

      expect(successCount).toBeLessThanOrEqual(100);
      expect(rateLimitCount).toBeGreaterThan(0);
    });

    it('should return correct rate limit headers', async () => {
      // Wait a bit for rate limit to reset
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('POST /api-keys/:id/rotate - Rotate API Key', () => {
    it('should rotate API key and invalidate old key', async () => {
      const oldKey = apiKey;

      const response = await request(app.getHttpServer())
        .post(`/api-keys/${apiKeyId}/rotate`)
        .set('Authorization', `Bearer ${await getAuthToken(premiumUserId)}`)
        .expect(200);

      expect(response.body).toHaveProperty('key');
      expect(response.body.key).not.toBe(oldKey);
      expect(response.body.key).toMatch(/^nxk_[A-Za-z0-9_-]+$/);

      const newKey = response.body.key;

      // Old key should not work
      await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', oldKey)
        .expect(401);

      // New key should work
      await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', newKey)
        .expect(200);

      apiKey = newKey;
    });
  });

  describe('GET /api-keys - List API Keys', () => {
    it('should list all API keys for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${await getAuthToken(premiumUserId)}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('keyPreview');
      expect(response.body[0]).not.toHaveProperty('keyHash');
    });
  });

  describe('DELETE /api-keys/:id - Delete API Key', () => {
    it('should delete API key', async () => {
      await request(app.getHttpServer())
        .delete(`/api-keys/${apiKeyId}`)
        .set('Authorization', `Bearer ${await getAuthToken(premiumUserId)}`)
        .expect(200);

      // Deleted key should not work
      await request(app.getHttpServer())
        .get('/public-api/v1/cards')
        .set('X-API-Key', apiKey)
        .expect(401);
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
