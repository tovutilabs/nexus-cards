import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';
import * as argon2 from 'argon2';

describe('Card Customization E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let cardId: string;
  let templateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.card.deleteMany({ where: { slug: { contains: 'test-customize' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'customize-test' } } });
    await prisma.cardTemplate.deleteMany({ where: { slug: { contains: 'test-template' } } });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'customize-test@example.com',
        passwordHash: await argon2.hash('Test123!@#'),
        role: 'USER',
        emailVerified: true,
        subscription: {
          create: {
            tier: SubscriptionTier.PREMIUM,
            status: 'ACTIVE',
          },
        },
      },
    });
    userId = user.id;

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'customize-test@example.com',
        password: 'Test123!@#',
      });
    accessToken = loginRes.body.accessToken;

    // Create test card
    const cardRes = await request(app.getHttpServer())
      .post('/cards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug: 'test-customize-card',
        firstName: 'Test',
        lastName: 'User',
        jobTitle: 'Developer',
        company: 'Test Corp',
      });
    cardId = cardRes.body.id;

    // Create test template
    const template = await prisma.cardTemplate.create({
      data: {
        name: 'Test Template',
        slug: 'test-template-customize',
        description: 'Test template for E2E',
        category: 'TECH',
        industry: ['Technology'],
        config: {
          colorScheme: { primary: '#3b82f6', secondary: '#1e40af' },
          typography: { fontFamily: 'Inter', fontSize: 'base' },
          layout: { type: 'vertical', spacing: 'comfortable' },
          borderRadius: 'lg',
          shadow: 'md',
        },
        minTier: SubscriptionTier.FREE,
        isActive: true,
        isFeatured: false,
      },
    });
    templateId = template.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.card.deleteMany({ where: { slug: { contains: 'test-customize' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'customize-test' } } });
    await prisma.cardTemplate.deleteMany({ where: { slug: { contains: 'test-template' } } });
    await app.close();
  });

  describe('GET /templates', () => {
    it('should return all accessible templates', async () => {
      const res = await request(app.getHttpServer())
        .get('/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('slug');
      expect(res.body[0]).toHaveProperty('config');
    });

    it('should filter templates by category', async () => {
      const res = await request(app.getHttpServer())
        .get('/templates/category/TECH')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((template: any) => {
        expect(template.category).toBe('TECH');
      });
    });

    it('should return featured templates', async () => {
      const res = await request(app.getHttpServer())
        .get('/templates/featured')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /templates/:id', () => {
    it('should return template by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/templates/${templateId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(templateId);
      expect(res.body.name).toBe('Test Template');
      expect(res.body.config).toHaveProperty('colorScheme');
    });

    it('should return 404 for non-existent template', async () => {
      await request(app.getHttpServer())
        .get('/templates/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /templates/apply/:cardId', () => {
    it('should apply template to card', async () => {
      const res = await request(app.getHttpServer())
        .post(`/templates/apply/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ templateId })
        .expect(200);

      expect(res.body.templateId).toBe(templateId);
      expect(res.body.fontFamily).toBe('Inter');
      expect(res.body.fontSize).toBe('base');
      expect(res.body.layout).toBe('vertical');
      expect(res.body.borderRadius).toBe('lg');
      expect(res.body.shadowPreset).toBe('md');

      // Verify template usage count incremented
      const template = await prisma.cardTemplate.findUnique({
        where: { id: templateId },
      });
      expect(template).not.toBeNull();
      expect(template!.usageCount).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .post('/templates/apply/non-existent-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ templateId })
        .expect(404);
    });

    it('should return 403 for card not owned by user', async () => {
      // Create another user and card
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-customize-test@example.com',
          passwordHash: await argon2.hash('Test123!@#'),
          role: 'USER',
          emailVerified: true,
          subscription: {
            create: {
              tier: SubscriptionTier.FREE,
              status: 'ACTIVE',
            },
          },
        },
      });

      const otherCard = await prisma.card.create({
        data: {
          userId: otherUser.id,
          slug: 'test-customize-other-card',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      await request(app.getHttpServer())
        .post(`/templates/apply/${otherCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ templateId })
        .expect(403);

      // Clean up
      await prisma.card.delete({ where: { id: otherCard.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('PUT /cards/:id (customization)', () => {
    it('should update card customization fields', async () => {
      const res = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fontFamily: 'Roboto',
          fontSize: 'lg',
          layout: 'horizontal',
          backgroundType: 'gradient',
          backgroundColor: '#3b82f6',
          borderRadius: 'xl',
          shadowPreset: 'lg',
        })
        .expect(200);

      expect(res.body.fontFamily).toBe('Roboto');
      expect(res.body.fontSize).toBe('lg');
      expect(res.body.layout).toBe('horizontal');
      expect(res.body.backgroundType).toBe('gradient');
      expect(res.body.backgroundColor).toBe('#3b82f6');
      expect(res.body.borderRadius).toBe('xl');
      expect(res.body.shadowPreset).toBe('lg');
    });

    it('should update logo URL', async () => {
      const logoUrl = 'https://example.com/logo.png';
      const res = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ logoUrl })
        .expect(200);

      expect(res.body.logoUrl).toBe(logoUrl);
    });
  });

  describe('PUT /templates/custom-css/:cardId', () => {
    it('should update custom CSS for PREMIUM users', async () => {
      const customCss = '.card { color: #333; font-size: 18px; }';
      const res = await request(app.getHttpServer())
        .put(`/templates/custom-css/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customCss })
        .expect(200);

      expect(res.body.customCss).toBe(customCss);
    });

    it('should reject dangerous CSS patterns', async () => {
      const dangerousCss = '@import url("evil.css"); .card { color: red; }';
      await request(app.getHttpServer())
        .put(`/templates/custom-css/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customCss: dangerousCss })
        .expect(403);
    });

    it('should reject CSS with javascript: URLs', async () => {
      const dangerousCss = '.card { background: url("javascript:alert(1)"); }';
      await request(app.getHttpServer())
        .put(`/templates/custom-css/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customCss: dangerousCss })
        .expect(403);
    });

    it('should reject oversized CSS', async () => {
      const largeCss = 'a'.repeat(101 * 1024);
      await request(app.getHttpServer())
        .put(`/templates/custom-css/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customCss: largeCss })
        .expect(403);
    });

    it('should clear custom CSS with empty string', async () => {
      const res = await request(app.getHttpServer())
        .put(`/templates/custom-css/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customCss: '' })
        .expect(200);

      expect(res.body.customCss).toBeNull();
    });
  });

  describe('GET /public/cards/:slug (with template)', () => {
    it('should return card with template customization', async () => {
      // Apply template first
      await request(app.getHttpServer())
        .post(`/templates/apply/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ templateId });

      // Fetch public card
      const res = await request(app.getHttpServer())
        .get('/public/cards/test-customize-card')
        .expect(200);

      expect(res.body.id).toBe(cardId);
      expect(res.body.fontFamily).toBe('Inter');
      expect(res.body.fontSize).toBe('base');
      expect(res.body.layout).toBe('vertical');
      expect(res.body.borderRadius).toBe('lg');
      expect(res.body.shadowPreset).toBe('md');
    });

    it('should return card with custom CSS', async () => {
      const customCss = '.card { color: #333; }';
      await request(app.getHttpServer())
        .put(`/templates/custom-css/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customCss });

      const res = await request(app.getHttpServer())
        .get('/public/cards/test-customize-card')
        .expect(200);

      expect(res.body.customCss).toBe(customCss);
    });
  });

  describe('Tier-based access control', () => {
    it('should deny FREE users from using PREMIUM templates', async () => {
      // Create FREE user
      const freeUser = await prisma.user.create({
        data: {
          email: 'free-customize-test@example.com',
          passwordHash: await argon2.hash('Test123!@#'),
          role: 'USER',
          emailVerified: true,
          subscription: {
            create: {
              tier: SubscriptionTier.FREE,
              status: 'ACTIVE',
            },
          },
        },
      });

      // Login as FREE user
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'free-customize-test@example.com',
          password: 'Test123!@#',
        });
      const freeToken = loginRes.body.accessToken;

      // Create card for FREE user
      const cardRes = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({
          slug: 'test-customize-free-card',
          firstName: 'Free',
          lastName: 'User',
        });
      const freeCardId = cardRes.body.id;

      // Create PREMIUM template
      const premiumTemplate = await prisma.cardTemplate.create({
        data: {
          name: 'Premium Template',
          slug: 'test-premium-template',
          description: 'Premium only',
          category: 'TECH',
          industry: ['Technology'],
          config: { colorScheme: { primary: '#000' } },
          minTier: SubscriptionTier.PREMIUM,
          isActive: true,
          isFeatured: false,
        },
      });

      // Attempt to apply PREMIUM template
      await request(app.getHttpServer())
        .post(`/templates/apply/${freeCardId}`)
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ templateId: premiumTemplate.id })
        .expect(403);

      // Clean up
      await prisma.card.delete({ where: { id: freeCardId } });
      await prisma.user.delete({ where: { id: freeUser.id } });
      await prisma.cardTemplate.delete({ where: { id: premiumTemplate.id } });
    });

    it('should deny FREE users from using custom CSS', async () => {
      // Create FREE user
      const freeUser = await prisma.user.create({
        data: {
          email: 'free-css-test@example.com',
          passwordHash: await argon2.hash('Test123!@#'),
          role: 'USER',
          emailVerified: true,
          subscription: {
            create: {
              tier: SubscriptionTier.FREE,
              status: 'ACTIVE',
            },
          },
        },
      });

      // Login as FREE user
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'free-css-test@example.com',
          password: 'Test123!@#',
        });
      const freeToken = loginRes.body.accessToken;

      // Create card for FREE user
      const cardRes = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({
          slug: 'test-customize-free-css-card',
          firstName: 'Free',
          lastName: 'User',
        });
      const freeCardId = cardRes.body.id;

      // Attempt to add custom CSS
      await request(app.getHttpServer())
        .put(`/templates/custom-css/${freeCardId}`)
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ customCss: '.card { color: red; }' })
        .expect(403);

      // Clean up
      await prisma.card.delete({ where: { id: freeCardId } });
      await prisma.user.delete({ where: { id: freeUser.id } });
    });
  });
});
