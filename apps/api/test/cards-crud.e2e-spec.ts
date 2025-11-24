/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Cards CRUD (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let cardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.card.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const passwordHash = await argon2.hash('Password123!');
    const user = await prisma.user.create({
      data: {
        email: 'cardtest@example.com',
        passwordHash,
        emailVerified: true,
        subscription: {
          create: {
            tier: 'PRO',
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
        email: 'cardtest@example.com',
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
    await prisma.card.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/cards', () => {
    it('should create a new card', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/cards')
        .set('Cookie', `access_token=${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          company: 'Test Corp',
          jobTitle: 'Software Engineer',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body).toHaveProperty('slug');
      expect(response.body.status).toBe('DRAFT');

      cardId = response.body.id;
    });

    it('should enforce tier limits', async () => {
      // Create 5 cards (PRO tier limit)
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/api/cards')
          .set('Cookie', `access_token=${authToken}`)
          .send({
            firstName: `User${i}`,
            lastName: 'Test',
          })
          .expect(201);
      }

      // 6th card should fail
      await request(app.getHttpServer())
        .post('/api/cards')
        .set('Cookie', `access_token=${authToken}`)
        .send({
          firstName: 'Extra',
          lastName: 'Card',
        })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/cards')
        .send({
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(401);
    });
  });

  describe('GET /api/cards', () => {
    it('should list user cards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cards')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('slug');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cards?status=DRAFT')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((card: any) => {
        expect(card.status).toBe('DRAFT');
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/cards')
        .expect(401);
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should get card by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/cards/${cardId}`)
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(cardId);
      expect(response.body.firstName).toBe('John');
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .get('/api/cards/non-existent-id')
        .set('Cookie', `access_token=${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/cards/${cardId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/cards/:id', () => {
    it('should update card', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/cards/${cardId}`)
        .set('Cookie', `access_token=${authToken}`)
        .send({
          firstName: 'Jane',
          jobTitle: 'Senior Engineer',
        })
        .expect(200);

      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body.jobTitle).toBe('Senior Engineer');
    });

    it('should update privacy mode', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/cards/${cardId}`)
        .set('Cookie', `access_token=${authToken}`)
        .send({
          privacyMode: 'PRIVATE',
        })
        .expect(200);

      expect(response.body.privacyMode).toBe('PRIVATE');
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .patch('/api/cards/non-existent-id')
        .set('Cookie', `access_token=${authToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/cards/${cardId}`)
        .send({ firstName: 'Test' })
        .expect(401);
    });
  });

  describe('POST /api/cards/:id/publish', () => {
    it('should publish card', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/cards/${cardId}/publish`)
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
    });

    it('should increment view count', async () => {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        select: { slug: true },
      });

      // Access public card page
      await request(app.getHttpServer())
        .get(`/p/${card?.slug}`)
        .expect(200);

      // Check view count increased
      const updated = await prisma.card.findUnique({
        where: { id: cardId },
        select: { viewCount: true },
      });

      expect(updated?.viewCount).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete card', async () => {
      await request(app.getHttpServer())
        .delete(`/api/cards/${cardId}`)
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      // Verify deletion
      const deletedCard = await prisma.card.findUnique({
        where: { id: cardId },
      });
      expect(deletedCard).toBeNull();
    });

    it('should return 404 for already deleted card', async () => {
      await request(app.getHttpServer())
        .delete(`/api/cards/${cardId}`)
        .set('Cookie', `access_token=${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/cards/${cardId}`)
        .expect(401);
    });
  });

  describe('GET /p/:slug (Public Card View)', () => {
    let publicSlug: string;

    beforeAll(async () => {
      // Create and publish a public card
      const card = await prisma.card.create({
        data: {
          userId,
          slug: 'public-user-test',
          firstName: 'Public',
          lastName: 'User',
          email: 'public@example.com',
          status: 'PUBLISHED',
          privacyMode: 'PUBLIC',
        },
      });
      publicSlug = card.slug;
    });

    it('should access public card without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get(`/p/${publicSlug}`)
        .expect(200);

      expect(response.body.firstName).toBe('Public');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('defaultPassword');
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/p/non-existent-slug')
        .expect(404);
    });

    it('should block access to private card', async () => {
      const privateCard = await prisma.card.create({
        data: {
          userId,
          slug: 'private-user-test',
          firstName: 'Private',
          lastName: 'User',
          status: 'PUBLISHED',
          privacyMode: 'PRIVATE',
        },
      });

      await request(app.getHttpServer())
        .get(`/p/${privateCard.slug}`)
        .expect(403);
    });
  });
});
