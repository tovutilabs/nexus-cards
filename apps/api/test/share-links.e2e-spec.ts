import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Share Links (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let cardId: string;
  let shareLinkId: string;
  let shareToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.shareLink.deleteMany({});
    await prisma.card.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.userProfile.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and authenticate
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'sharetest@example.com',
        password: 'Password123!',
        firstName: 'Share',
        lastName: 'Test',
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'sharetest@example.com',
        password: 'Password123!',
      });

    authToken = loginResponse.body.access_token;

    // Create a test card
    const cardResponse = await request(app.getHttpServer())
      .post('/cards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Share',
        lastName: 'Test',
        email: 'share@example.com',
        status: 'PUBLISHED',
      });

    cardId = cardResponse.body.id;
  });

  afterAll(async () => {
    await prisma.shareLink.deleteMany({});
    await prisma.card.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.userProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  describe('POST /share-links', () => {
    it('should create a public share link', async () => {
      const response = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          name: 'Public Link',
          privacyMode: 'PUBLIC',
          allowContactSubmission: true,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.url).toContain('/s/');
      expect(response.body.privacyMode).toBe('PUBLIC');
      
      shareLinkId = response.body.id;
      shareToken = response.body.token;
    });

    it('should create a password-protected share link', async () => {
      const response = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          name: 'Protected Link',
          privacyMode: 'PASSWORD_PROTECTED',
          password: 'SecurePass123',
          allowContactSubmission: false,
        })
        .expect(201);

      expect(response.body.privacyMode).toBe('PASSWORD_PROTECTED');
      expect(response.body.passwordHash).toBeUndefined(); // Should not return hash
    });

    it('should create a share link with expiration', async () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const response = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          name: 'Expiring Link',
          privacyMode: 'PUBLIC',
          expiresAt: expiresAt.toISOString(),
        })
        .expect(201);

      expect(response.body.expiresAt).toBeDefined();
    });

    it('should reject share link with past expiration date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PUBLIC',
          expiresAt: pastDate.toISOString(),
        })
        .expect(400);
    });

    it('should reject unauthorized user', async () => {
      await request(app.getHttpServer())
        .post('/share-links')
        .send({
          cardId,
          privacyMode: 'PUBLIC',
        })
        .expect(401);
    });

    it('should reject share link for non-existent card', async () => {
      await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId: 'non-existent-card-id',
          privacyMode: 'PUBLIC',
        })
        .expect(404);
    });
  });

  describe('GET /share-links/card/:cardId', () => {
    it('should get all share links for a card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/share-links/card/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].url).toBeDefined();
      expect(response.body[0].isExpired).toBeDefined();
      expect(response.body[0].hasPassword).toBeDefined();
    });

    it('should reject unauthorized user', async () => {
      await request(app.getHttpServer())
        .get(`/share-links/card/${cardId}`)
        .expect(401);
    });
  });

  describe('GET /share-links/:id', () => {
    it('should get a specific share link', async () => {
      const response = await request(app.getHttpServer())
        .get(`/share-links/${shareLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(shareLinkId);
      expect(response.body.card).toBeDefined();
    });

    it('should reject non-existent share link', async () => {
      await request(app.getHttpServer())
        .get('/share-links/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /share-links/:id', () => {
    it('should update a share link', async () => {
      const response = await request(app.getHttpServer())
        .put(`/share-links/${shareLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Link Name',
          allowContactSubmission: false,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Link Name');
      expect(response.body.allowContactSubmission).toBe(false);
    });

    it('should update password for password-protected link', async () => {
      // First create a password-protected link
      const createResponse = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PASSWORD_PROTECTED',
          password: 'OldPassword123',
        });

      const linkId = createResponse.body.id;

      // Update the password
      const response = await request(app.getHttpServer())
        .put(`/share-links/${linkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'NewPassword456',
        })
        .expect(200);

      expect(response.body.passwordHash).toBeUndefined();
    });
  });

  describe('DELETE /share-links/:id', () => {
    it('should revoke a share link', async () => {
      // Create a link to revoke
      const createResponse = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PUBLIC',
        });

      const linkId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/share-links/${linkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /share-links/validate', () => {
    it('should validate a public share link', async () => {
      const response = await request(app.getHttpServer())
        .post('/share-links/validate')
        .send({
          token: shareToken,
        })
        .expect(201);

      expect(response.body.valid).toBe(true);
      expect(response.body.card).toBeDefined();
    });

    it('should validate password-protected link with correct password', async () => {
      // Create password-protected link
      const createResponse = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PASSWORD_PROTECTED',
          password: 'TestPassword123',
        });

      const token = createResponse.body.token;

      const response = await request(app.getHttpServer())
        .post('/share-links/validate')
        .send({
          token,
          password: 'TestPassword123',
        })
        .expect(201);

      expect(response.body.valid).toBe(true);
    });

    it('should reject password-protected link with incorrect password', async () => {
      // Create password-protected link
      const createResponse = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PASSWORD_PROTECTED',
          password: 'CorrectPassword123',
        });

      const token = createResponse.body.token;

      await request(app.getHttpServer())
        .post('/share-links/validate')
        .send({
          token,
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject revoked share link', async () => {
      // Create and revoke a link
      const createResponse = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PUBLIC',
        });

      const linkId = createResponse.body.id;
      const token = createResponse.body.token;

      await request(app.getHttpServer())
        .delete(`/share-links/${linkId}`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app.getHttpServer())
        .post('/share-links/validate')
        .send({ token })
        .expect(401);
    });
  });

  describe('POST /share-links/channel-urls', () => {
    it('should generate multi-channel share URLs', async () => {
      const response = await request(app.getHttpServer())
        .post('/share-links/channel-urls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shareUrl: 'https://nexus.cards/s/test-token',
          cardTitle: 'John Doe Card',
        })
        .expect(201);

      expect(response.body.whatsapp).toContain('wa.me');
      expect(response.body.telegram).toContain('t.me');
      expect(response.body.sms).toContain('sms:');
      expect(response.body.email).toContain('mailto:');
      expect(response.body.linkedin).toContain('linkedin.com');
    });
  });

  describe('GET /public/share/:token', () => {
    it('should access card via public share token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/public/share/${shareToken}`)
        .expect(200);

      expect(response.body.card).toBeDefined();
      expect(response.body.card.firstName).toBe('Share');
    });

    it('should return requiresPassword for password-protected links', async () => {
      // Create password-protected link
      const createResponse = await request(app.getHttpServer())
        .post('/share-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardId,
          privacyMode: 'PASSWORD_PROTECTED',
          password: 'SecretPass123',
        });

      const token = createResponse.body.token;

      const response = await request(app.getHttpServer())
        .get(`/public/share/${token}`)
        .expect(200);

      expect(response.body.requiresPassword).toBe(true);
      expect(response.body.card).toBeUndefined();
    });
  });
});
