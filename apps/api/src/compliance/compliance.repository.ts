import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDataExport(userId: string, format: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.userDataExport.create({
      data: {
        userId,
        format,
        status: 'PENDING',
        expiresAt,
      },
    });
  }

  async updateDataExportStatus(exportId: string, status: string, fileUrl?: string) {
    return this.prisma.userDataExport.update({
      where: { id: exportId },
      data: {
        status,
        ...(fileUrl ? { fileUrl } : {}),
      },
    });
  }

  async getDataExports(userId: string) {
    return this.prisma.userDataExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
        cards: {
          include: {
            nfcTags: true,
            shareLinks: true,
          },
        },
        contacts: true,
        apiKeys: true,
        integrations: true,
        notifications: true,
        notificationPreferences: true,
        oauthProviders: true,
      },
    });

    return user;
  }

  async deleteUserAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { userId } });
      await tx.notificationPreferences.deleteMany({ where: { userId } });
      await tx.userDataExport.deleteMany({ where: { userId } });
      await tx.cookieConsent.deleteMany({ where: { userId } });
      await tx.apiKey.deleteMany({ where: { userId } });
      await tx.webhookSubscription.deleteMany({ where: { userId } });
      await tx.integration.deleteMany({ where: { userId } });
      await tx.contact.deleteMany({ where: { userId } });
      await tx.analyticsEvent.deleteMany({
        where: {
          card: {
            userId,
          },
        },
      });
      await tx.analyticsCardDaily.deleteMany({
        where: {
          card: {
            userId,
          },
        },
      });
      await tx.experimentEvent.deleteMany({
        where: {
          experiment: {
            createdBy: userId,
          },
        },
      });
      await tx.experiment.deleteMany({ where: { createdBy: userId } });
      await tx.shareLink.deleteMany({
        where: {
          card: {
            userId,
          },
        },
      });
      await tx.connection.deleteMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
      });
      await tx.nfcTag.updateMany({
        where: { assignedUserId: userId },
        data: { assignedUserId: null, cardId: null },
      });
      await tx.card.deleteMany({ where: { userId } });
      await tx.oAuthProvider.deleteMany({ where: { userId } });
      await tx.activityLog.deleteMany({ where: { userId } });
      await tx.subscription.deleteMany({ where: { userId } });
      await tx.userProfile.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  async recordCookieConsent(data: {
    userId?: string;
    sessionId: string;
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.cookieConsent.upsert({
      where: { sessionId: data.sessionId },
      create: data,
      update: {
        necessary: data.necessary,
        analytics: data.analytics,
        marketing: data.marketing,
        preferences: data.preferences,
        consentedAt: new Date(),
      },
    });
  }

  async getCookieConsent(sessionId: string) {
    return this.prisma.cookieConsent.findUnique({
      where: { sessionId },
    });
  }
}
