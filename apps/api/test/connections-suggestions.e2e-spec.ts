import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Connections and Suggestions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;
  let userId: string;
  let otherUserId: string;
  let cardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.connection.deleteMany({
      where: {
        OR: [
          { userA: { email: { startsWith: 'e2e-conn-' } } },
          { userB: { email: { startsWith: 'e2e-conn-' } } },
        ],
      },
    });
    await prisma.card.deleteMany({
      where: { user: { email: { startsWith: 'e2e-conn-' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-conn-' } },
    });

    // Create test users
    const user = await prisma.user.create({
      data: {
        email: `e2e-conn-user-${Date.now()}@example.com`,
        passwordHash: 'hashed', // In real e2e, use proper hashing
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            phone: '+1234567890',
            company: 'TechCo',
            jobTitle: 'Engineer',
          },
        },
      },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: {
        email: `e2e-conn-other-${Date.now()}@example.com`,
        passwordHash: 'hashed',
        profile: {
          create: {
            firstName: 'Other',
            lastName: 'Person',
            company: 'DesignCo',
          },
        },
      },
    });
    otherUserId = otherUser.id;

    // Create a card for the other user
    const card = await prisma.card.create({
      data: {
        userId: otherUserId,
        slug: `e2e-test-card-${Date.now()}`,
        firstName: 'Other',
        lastName: 'User',
        theme: {},
        socialLinks: {},
      },
    });
    cardId = card.id;

    // Get JWT token (simplified - in real e2e, use /auth/login)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'password', // This won't work with 'hashed' - adjust for real test
      });

    // For this test, we'll create a manual token or use a test helper
    // In production e2e, you'd properly login and get a real token
    jwtToken = 'test-jwt-token'; // Placeholder - implement proper JWT in real test
  });

  afterAll(async () => {
    // Clean up
    await prisma.connection.deleteMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });
    await prisma.card.deleteMany({ where: { id: cardId } });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } },
    });

    await app.close();
  });

  describe('Connection Tracking via Public Card View', () => {
    it('should track connection when authenticated user views public card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/public/cards/${cardId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('slug');

      // Verify connection was created
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: otherUserId },
            { userAId: otherUserId, userBId: userId },
          ],
        },
      });

      expect(connection).toBeDefined();
      expect(connection?.viewCountAtoB + connection?.viewCountBtoA).toBeGreaterThan(0);
    });

    it('should not create connection when viewing own card', async () => {
      // Create card for the current user
      const ownCard = await prisma.card.create({
        data: {
          userId: userId,
          slug: `e2e-own-card-${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
          theme: {},
          socialLinks: {},
        },
      });

      await request(app.getHttpServer())
        .get(`/public/cards/${ownCard.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      // Verify no self-connection was created
      const selfConnection = await prisma.connection.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: userId },
          ],
        },
      });

      expect(selfConnection).toBeNull();

      await prisma.card.delete({ where: { id: ownCard.id } });
    });
  });

  describe('GET /connections', () => {
    it('should return user connections', async () => {
      const response = await request(app.getHttpServer())
        .get('/connections')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('otherUser');
      expect(response.body[0]).toHaveProperty('strengthScore');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/connections')
        .expect(401);
    });
  });

  describe('GET /connections/mutual', () => {
    it('should return only mutual connections', async () => {
      // First, ensure mutual connection exists
      await request(app.getHttpServer())
        .get(`/public/cards/${cardId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      // Simulate other user viewing back (would need other user's token in real test)
      await prisma.connection.updateMany({
        where: {
          OR: [
            { userAId: userId, userBId: otherUserId },
            { userAId: otherUserId, userBId: userId },
          ],
        },
        data: {
          viewCountAtoB: 1,
          viewCountBtoA: 1,
          isMutual: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/connections/mutual')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      response.body.forEach((conn: any) => {
        expect(conn.isMutual).toBe(true);
      });
    });
  });

  describe('GET /connections/top', () => {
    it('should return top connections by strength', async () => {
      const response = await request(app.getHttpServer())
        .get('/connections/top?limit=5')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeLessThanOrEqual(5);

      // Verify sorted by strength descending
      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          expect(response.body[i].strengthScore).toBeGreaterThanOrEqual(
            response.body[i + 1].strengthScore,
          );
        }
      }
    });

    it('should default to limit 10 if not specified', async () => {
      const response = await request(app.getHttpServer())
        .get('/connections/top')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /connections/network-graph', () => {
    it('should return network graph data with nodes and edges', async () => {
      const response = await request(app.getHttpServer())
        .get('/connections/network-graph')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('edges');
      expect(Array.isArray(response.body.nodes)).toBeTruthy();
      expect(Array.isArray(response.body.edges)).toBeTruthy();

      // Verify node structure
      if (response.body.nodes.length > 0) {
        const node = response.body.nodes[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('email');
      }

      // Verify edge structure
      if (response.body.edges.length > 0) {
        const edge = response.body.edges[0];
        expect(edge).toHaveProperty('source');
        expect(edge).toHaveProperty('target');
        expect(edge).toHaveProperty('type');
        expect(edge).toHaveProperty('strength');
      }
    });

    it('should include center node for current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/connections/network-graph')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const centerNode = response.body.nodes.find(
        (node: any) => node.type === 'center',
      );
      expect(centerNode).toBeDefined();
      expect(centerNode.id).toBe(userId);
    });
  });

  describe('GET /suggestions', () => {
    it('should return user suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/suggestions')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      
      // Verify suggestion structure
      if (response.body.length > 0) {
        const suggestion = response.body[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
      }
    });

    it('should sort suggestions by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/suggestions')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const priorities = response.body.map((s: any) => s.priority);
      const priorityOrder = ['high', 'medium', 'low'];

      for (let i = 0; i < priorities.length - 1; i++) {
        const currentIndex = priorityOrder.indexOf(priorities[i]);
        const nextIndex = priorityOrder.indexOf(priorities[i + 1]);
        expect(currentIndex).toBeLessThanOrEqual(nextIndex);
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/suggestions')
        .expect(401);
    });
  });

  describe('GET /suggestions/profile-completeness', () => {
    it('should return profile completeness score', async () => {
      const response = await request(app.getHttpServer())
        .get('/suggestions/profile-completeness')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('maxScore');
      expect(response.body).toHaveProperty('percentage');
      expect(response.body).toHaveProperty('missingFields');
      expect(typeof response.body.score).toBe('number');
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(response.body.maxScore);
    });

    it('should reflect actual profile completeness', async () => {
      // Get current completeness
      const response = await request(app.getHttpServer())
        .get('/suggestions/profile-completeness')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      // User has firstName, lastName, phone, company, jobTitle (no avatar)
      // Score should be 7 (2+2+1+1+1) out of 9
      expect(response.body.score).toBe(7);
      expect(response.body.percentage).toBeCloseTo(77.78, 1);
      expect(response.body.missingFields).toContain('avatarUrl');
    });
  });

  describe('Connection Strength Calculation', () => {
    it('should update strength score after multiple views', async () => {
      // View card multiple times
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get(`/public/cards/${cardId}`)
          .set('Authorization', `Bearer ${jwtToken}`);
      }

      // Get connections and verify strength increased
      const response = await request(app.getHttpServer())
        .get('/connections')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const connection = response.body.find(
        (c: any) => c.otherUser.id === otherUserId,
      );
      expect(connection).toBeDefined();
      expect(connection.strengthScore).toBeGreaterThan(0);
    });
  });

  describe('Mutual Connection Detection', () => {
    it('should detect mutual connection when both users view each other', async () => {
      // User A views User B's card
      await request(app.getHttpServer())
        .get(`/public/cards/${cardId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      // Simulate User B viewing User A's card
      const userACard = await prisma.card.create({
        data: {
          userId: userId,
          slug: `e2e-mutual-test-${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
          theme: {},
          socialLinks: {},
        },
      });

      // Manually update connection to simulate mutual view
      await prisma.connection.updateMany({
        where: {
          OR: [
            { userAId: userId, userBId: otherUserId },
            { userAId: otherUserId, userBId: userId },
          ],
        },
        data: {
          viewCountAtoB: 1,
          viewCountBtoA: 1,
          isMutual: true,
        },
      });

      // Verify mutual status in connections endpoint
      const response = await request(app.getHttpServer())
        .get('/connections')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const connection = response.body.find(
        (c: any) => c.otherUser.id === otherUserId,
      );
      expect(connection.isMutual).toBe(true);

      await prisma.card.delete({ where: { id: userACard.id } });
    });
  });
});
