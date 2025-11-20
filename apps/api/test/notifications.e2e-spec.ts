import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    await prisma.notification.deleteMany();
    await prisma.notificationPreferences.deleteMany();
    await prisma.user.deleteMany();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test-notif@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = registerResponse.body.access_token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.notificationPreferences.deleteMany();
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  describe('GET /notifications', () => {
    it('should return empty array initially', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/notifications')
        .expect(401);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return unread count', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('GET /notifications/preferences', () => {
    it('should return notification preferences', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('newContactEmail');
      expect(response.body).toHaveProperty('newContactInApp');
      expect(response.body).toHaveProperty('analyticsMilestoneEmail');
      expect(response.body).toHaveProperty('paymentSuccessEmail');
    });
  });

  describe('PATCH /notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const updates = {
        newContactEmail: false,
        newContactInApp: true,
        analyticsMilestoneEmail: true,
      };

      const response = await request(app.getHttpServer())
        .patch('/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.newContactEmail).toBe(false);
      expect(response.body.newContactInApp).toBe(true);
      expect(response.body.analyticsMilestoneEmail).toBe(true);
    });
  });

  describe('Notification workflow', () => {
    let notificationId: string;

    beforeAll(async () => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'NEW_CONTACT',
          title: 'Test Notification',
          message: 'This is a test notification',
          link: '/dashboard/contacts',
        },
      });
      notificationId = notification.id;
    });

    it('should list notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('title', 'Test Notification');
    });

    it('should mark notification as read', async () => {
      await request(app.getHttpServer())
        .patch(`/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      expect(notification?.isRead).toBe(true);
      expect(notification?.readAt).not.toBeNull();
    });

    it('should delete notification', async () => {
      await request(app.getHttpServer())
        .delete(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      expect(notification).toBeNull();
    });
  });

  describe('POST /notifications/mark-all-read', () => {
    beforeAll(async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId,
            type: 'NEW_CONTACT',
            title: 'Test 1',
            message: 'Message 1',
          },
          {
            userId,
            type: 'ANALYTICS_MILESTONE',
            title: 'Test 2',
            message: 'Message 2',
          },
        ],
      });
    });

    it('should mark all notifications as read', async () => {
      await request(app.getHttpServer())
        .post('/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      expect(unreadCount).toBe(0);
    });
  });
});
