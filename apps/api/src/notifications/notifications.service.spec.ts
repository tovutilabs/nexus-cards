import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: NotificationsRepository;

  const mockRepository = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
    getUnreadCount: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerNotification', () => {
    it('should create in-app notification when preference is enabled', async () => {
      const userId = 'user-1';
      const trigger = {
        userId,
        type: 'NEW_CONTACT' as NotificationType,
        data: { contactName: 'John Doe' },
      };

      mockRepository.getPreferences.mockResolvedValue({
        newContactInApp: true,
        newContactEmail: false,
      });

      mockRepository.create.mockResolvedValue({
        id: 'notif-1',
        userId,
        type: 'NEW_CONTACT',
        title: 'New Contact Received',
        message: 'John Doe just shared their contact information with you',
        isRead: false,
        createdAt: new Date(),
      });

      await service.triggerNotification(trigger);

      expect(mockRepository.getPreferences).toHaveBeenCalledWith(userId);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'NEW_CONTACT',
          title: 'New Contact Received',
        })
      );
    });

    it('should not create notification when preference is disabled', async () => {
      const userId = 'user-1';
      const trigger = {
        userId,
        type: 'NEW_CONTACT' as NotificationType,
        data: { contactName: 'John Doe' },
      };

      mockRepository.getPreferences.mockResolvedValue({
        newContactInApp: false,
        newContactEmail: false,
      });

      await service.triggerNotification(trigger);

      expect(mockRepository.getPreferences).toHaveBeenCalledWith(userId);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should handle analytics milestone notifications', async () => {
      const userId = 'user-1';
      const trigger = {
        userId,
        type: 'ANALYTICS_MILESTONE' as NotificationType,
        data: { milestone: 1000, metricType: 'views' },
      };

      mockRepository.getPreferences.mockResolvedValue({
        analyticsMilestoneInApp: true,
        analyticsMilestoneEmail: false,
      });

      await service.triggerNotification(trigger);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Analytics Milestone Reached!',
          message: 'Your views has reached 1000 views!',
        })
      );
    });

    it('should handle payment success notifications', async () => {
      const userId = 'user-1';
      const trigger = {
        userId,
        type: 'PAYMENT_SUCCESS' as NotificationType,
        data: { amount: 29.99 },
      };

      mockRepository.getPreferences.mockResolvedValue({
        paymentSuccessInApp: true,
        paymentSuccessEmail: true,
      });

      await service.triggerNotification(trigger);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Payment Successful',
          message: 'Your payment of $29.99 has been processed successfully',
        })
      );
    });
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const userId = 'user-1';
      const notifications = [
        {
          id: 'notif-1',
          userId,
          type: 'NEW_CONTACT',
          title: 'New Contact',
          message: 'Test message',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockRepository.findByUserId.mockResolvedValue(notifications);

      const result = await service.getNotifications(userId);

      expect(result).toEqual(notifications);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, 50, false);
    });

    it('should filter unread notifications only', async () => {
      const userId = 'user-1';

      await service.getNotifications(userId, 10, true);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, 10, true);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const userId = 'user-1';
      const notificationId = 'notif-1';

      mockRepository.markAsRead.mockResolvedValue({
        id: notificationId,
        isRead: true,
        readAt: new Date(),
      });

      await service.markAsRead(notificationId, userId);

      expect(mockRepository.markAsRead).toHaveBeenCalledWith(notificationId, userId);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const userId = 'user-1';

      mockRepository.markAllAsRead.mockResolvedValue({ count: 5 });

      await service.markAllAsRead(userId);

      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const userId = 'user-1';
      const notificationId = 'notif-1';

      await service.deleteNotification(notificationId, userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(notificationId, userId);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-1';

      mockRepository.getUnreadCount.mockResolvedValue(3);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(3);
      expect(mockRepository.getUnreadCount).toHaveBeenCalledWith(userId);
    });
  });

  describe('getPreferences', () => {
    it('should return notification preferences', async () => {
      const userId = 'user-1';
      const preferences = {
        id: 'pref-1',
        userId,
        newContactInApp: true,
        newContactEmail: true,
      };

      mockRepository.getPreferences.mockResolvedValue(preferences);

      const result = await service.getPreferences(userId);

      expect(result).toEqual(preferences);
      expect(mockRepository.getPreferences).toHaveBeenCalledWith(userId);
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const userId = 'user-1';
      const updates = {
        newContactInApp: false,
        newContactEmail: true,
      };

      mockRepository.updatePreferences.mockResolvedValue({
        id: 'pref-1',
        userId,
        ...updates,
      });

      await service.updatePreferences(userId, updates);

      expect(mockRepository.updatePreferences).toHaveBeenCalledWith(userId, updates);
    });
  });
});
