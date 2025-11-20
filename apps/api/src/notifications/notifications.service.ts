import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsRepository, CreateNotificationDto } from './notifications.repository';

export interface NotificationTrigger {
  userId: string;
  type: NotificationType;
  data: {
    contactName?: string;
    milestone?: number;
    metricType?: string;
    amount?: number;
    cardTitle?: string;
    tagUid?: string;
    experimentName?: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repository: NotificationsRepository,
  ) {}

  async triggerNotification(trigger: NotificationTrigger) {
    const preferences = await this.repository.getPreferences(trigger.userId);

    const notification = this.buildNotification(trigger);

    if (!notification) {
      this.logger.warn(`Unknown notification type: ${trigger.type}`);
      return;
    }

    const shouldSendInApp = this.shouldSendInApp(trigger.type, preferences);
    const shouldSendEmail = this.shouldSendEmail(trigger.type, preferences);

    if (shouldSendInApp) {
      await this.repository.create(notification);
      this.logger.log(`In-app notification created for user ${trigger.userId}: ${trigger.type}`);
    }

    if (shouldSendEmail) {
      await this.sendEmail(trigger.userId, notification);
      this.logger.log(`Email notification sent to user ${trigger.userId}: ${trigger.type}`);
    }
  }

  private buildNotification(trigger: NotificationTrigger): CreateNotificationDto | null {
    const { userId, type, data } = trigger;

    switch (type) {
      case 'NEW_CONTACT':
        return {
          userId,
          type,
          title: 'New Contact Received',
          message: `${data.contactName || 'Someone'} just shared their contact information with you`,
          link: '/dashboard/contacts',
          metadata: { contactName: data.contactName },
        };

      case 'ANALYTICS_MILESTONE':
        return {
          userId,
          type,
          title: 'Analytics Milestone Reached!',
          message: `Your ${data.metricType || 'card'} has reached ${data.milestone} ${data.metricType || 'views'}!`,
          link: '/dashboard/analytics',
          metadata: { milestone: data.milestone, metricType: data.metricType },
        };

      case 'PAYMENT_SUCCESS':
        return {
          userId,
          type,
          title: 'Payment Successful',
          message: `Your payment of $${data.amount?.toFixed(2) || '0.00'} has been processed successfully`,
          link: '/dashboard/settings/billing',
          metadata: { amount: data.amount },
        };

      case 'NFC_TAG_SCAN':
        return {
          userId,
          type,
          title: 'NFC Tag Scanned',
          message: `Your NFC tag ${data.tagUid ? `(${data.tagUid.substring(0, 8)}...)` : ''} was just scanned`,
          link: '/dashboard/analytics',
          metadata: { tagUid: data.tagUid },
        };

      case 'CARD_VIEW_MILESTONE':
        return {
          userId,
          type,
          title: 'Card Milestone!',
          message: `Your card "${data.cardTitle || 'Untitled'}" has been viewed ${data.milestone} times!`,
          link: '/dashboard/analytics',
          metadata: { cardTitle: data.cardTitle, milestone: data.milestone },
        };

      case 'SUBSCRIPTION_EXPIRING':
        return {
          userId,
          type,
          title: 'Subscription Expiring Soon',
          message: 'Your subscription will expire in 3 days. Renew now to keep your premium features.',
          link: '/dashboard/settings/billing',
          metadata: {},
        };

      case 'EXPERIMENT_RESULT':
        return {
          userId,
          type,
          title: 'A/B Test Results Available',
          message: `Results are in for your experiment "${data.experimentName || 'Untitled'}"`,
          link: '/dashboard/experiments',
          metadata: { experimentName: data.experimentName },
        };

      default:
        return null;
    }
  }

  private shouldSendInApp(type: NotificationType, preferences: any): boolean {
    switch (type) {
      case 'NEW_CONTACT':
        return preferences.newContactInApp;
      case 'ANALYTICS_MILESTONE':
        return preferences.analyticsMilestoneInApp;
      case 'PAYMENT_SUCCESS':
        return preferences.paymentSuccessInApp;
      case 'NFC_TAG_SCAN':
        return preferences.nfcTagScanInApp;
      case 'CARD_VIEW_MILESTONE':
        return preferences.cardViewMilestoneInApp;
      case 'SUBSCRIPTION_EXPIRING':
        return preferences.subscriptionExpiringInApp;
      default:
        return true;
    }
  }

  private shouldSendEmail(type: NotificationType, preferences: any): boolean {
    switch (type) {
      case 'NEW_CONTACT':
        return preferences.newContactEmail;
      case 'ANALYTICS_MILESTONE':
        return preferences.analyticsMilestoneEmail;
      case 'PAYMENT_SUCCESS':
        return preferences.paymentSuccessEmail;
      case 'NFC_TAG_SCAN':
        return preferences.nfcTagScanEmail;
      case 'CARD_VIEW_MILESTONE':
        return preferences.cardViewMilestoneEmail;
      case 'SUBSCRIPTION_EXPIRING':
        return preferences.subscriptionExpiringEmail;
      default:
        return false;
    }
  }

  private async sendEmail(userId: string, notification: CreateNotificationDto) {
    this.logger.log(`[EMAIL STUB] Sending email to user ${userId}: ${notification.title}`);
  }

  async getNotifications(userId: string, limit = 50, unreadOnly = false) {
    return this.repository.findByUserId(userId, limit, unreadOnly);
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.repository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.repository.delete(notificationId, userId);
  }

  async getUnreadCount(userId: string) {
    return this.repository.getUnreadCount(userId);
  }

  async getPreferences(userId: string) {
    return this.repository.getPreferences(userId);
  }

  async updatePreferences(userId: string, data: any) {
    return this.repository.updatePreferences(userId, data);
  }
}
