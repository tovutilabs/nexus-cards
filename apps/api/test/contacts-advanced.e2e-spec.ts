import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ContactsController (e2e) - Advanced Contact Management', () => {
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

    prisma = app.get(PrismaService);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'contact-test@example.com',
        passwordHash: 'hashed_password',
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
        subscription: {
          create: {
            tier: 'PRO',
            status: 'ACTIVE',
          },
        },
      },
    });

    userId = user.id;

    // Create test card
    const card = await prisma.card.create({
      data: {
        userId,
        slug: 'contact-test-card',
        firstName: 'Test',
        lastName: 'User',
        status: 'PUBLISHED',
      },
    });

    cardId = card.id;

    // Get auth token (simplified for testing)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'contact-test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.contact.deleteMany({});
    await prisma.card.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.userProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  describe('POST /contacts (Manual Creation)', () => {
    it('should create a manual contact with all advanced fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Manual',
          email: 'john.manual@example.com',
          phone: '+1234567890',
          company: 'Manual Corp',
          jobTitle: 'Manager',
          notes: 'Added manually',
          category: 'client',
          tags: ['important', 'vip'],
          favorite: true,
          source: 'MANUAL',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.category).toBe('client');
      expect(response.body.tags).toContain('important');
      expect(response.body.favorite).toBe(true);
      expect(response.body.source).toBe('MANUAL');
    });
  });

  describe('POST /contacts/import (CSV Import)', () => {
    it('should import multiple contacts', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contacts: [
            {
              firstName: 'Import1',
              lastName: 'Test1',
              email: 'import1@example.com',
              company: 'Import Corp',
            },
            {
              firstName: 'Import2',
              lastName: 'Test2',
              email: 'import2@example.com',
              company: 'Import Corp',
            },
          ],
          tags: ['imported', 'bulk'],
          favorite: false,
        })
        .expect(201);

      expect(response.body.success).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.imported).toHaveLength(2);
      expect(response.body.imported[0].tags).toContain('imported');
      expect(response.body.imported[0].source).toBe('IMPORTED');
    });

    it('should handle duplicate emails gracefully', async () => {
      // First import
      await request(app.getHttpServer())
        .post('/contacts/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contacts: [
            {
              firstName: 'Duplicate',
              lastName: 'Test',
              email: 'duplicate@example.com',
            },
          ],
        });

      // Second import with same email
      const response = await request(app.getHttpServer())
        .post('/contacts/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contacts: [
            {
              firstName: 'Duplicate',
              lastName: 'Test',
              email: 'duplicate@example.com',
            },
          ],
        })
        .expect(201);

      expect(response.body.failed).toBeGreaterThan(0);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /contacts with filters', () => {
    beforeEach(async () => {
      // Create test contacts with various attributes
      await prisma.contact.createMany({
        data: [
          {
            userId,
            cardId,
            firstName: 'Alice',
            lastName: 'Client',
            email: 'alice@example.com',
            category: 'client',
            tags: ['vip'],
            favorite: true,
          },
          {
            userId,
            cardId,
            firstName: 'Bob',
            lastName: 'Prospect',
            email: 'bob@example.com',
            category: 'prospect',
            tags: ['cold-lead'],
            favorite: false,
          },
          {
            userId,
            cardId,
            firstName: 'Charlie',
            lastName: 'Partner',
            email: 'charlie@example.com',
            category: 'partner',
            tags: ['vip', 'strategic'],
            favorite: true,
          },
        ],
      });
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts?category=client')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((c: any) => c.category === 'client')).toBe(true);
    });

    it('should filter by favorites only', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts?favoritesOnly=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((c: any) => c.favorite === true)).toBe(true);
    });

    it('should filter by tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts?tags=vip')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((c: any) => c.tags.includes('vip'))).toBe(true);
    });

    it('should filter by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts?search=Alice')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].firstName).toBe('Alice');
    });

    it('should combine multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts?category=client&favoritesOnly=true&tags=vip')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((c: any) => 
        c.category === 'client' && c.favorite === true && c.tags.includes('vip')
      )).toBe(true);
    });
  });

  describe('POST /contacts/export', () => {
    it('should export contacts in CSV format', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'CSV',
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.text).toContain('First Name');
      expect(response.text).toContain('Category');
      expect(response.text).toContain('Tags');
      expect(response.text).toContain('Favorite');
      expect(response.text).toContain('Source');
    });

    it('should export contacts in VCF format', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'VCF',
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('text/vcard');
      expect(response.text).toContain('BEGIN:VCARD');
      expect(response.text).toContain('VERSION:3.0');
    });

    it('should export with filters applied', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'CSV',
          category: 'client',
          favoritesOnly: true,
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv');
      // Verify filtered data
      const lines = response.text.split('\n');
      expect(lines.length).toBeGreaterThan(1); // At least header + 1 row
    });
  });

  describe('PATCH /contacts/:id', () => {
    it('should update contact with new fields', async () => {
      const contact = await prisma.contact.create({
        data: {
          userId,
          cardId,
          firstName: 'Update',
          lastName: 'Test',
          email: 'update@example.com',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'client',
          tags: ['updated', 'test'],
          favorite: true,
          notes: 'Updated notes',
        })
        .expect(200);

      expect(response.body.category).toBe('client');
      expect(response.body.tags).toContain('updated');
      expect(response.body.favorite).toBe(true);
      expect(response.body.notes).toBe('Updated notes');
    });
  });
});
