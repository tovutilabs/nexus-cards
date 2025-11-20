import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ComplianceRepository } from './compliance.repository';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly repository: ComplianceRepository) {}

  async requestDataExport(userId: string, format: 'JSON' | 'CSV') {
    const exportRecord = await this.repository.createDataExport(userId, format);

    this.processDataExport(exportRecord.id, userId, format).catch((err) => {
      this.logger.error(`Failed to process data export ${exportRecord.id}:`, err);
    });

    return exportRecord;
  }

  private async processDataExport(exportId: string, userId: string, format: string) {
    try {
      const userData = await this.repository.getUserData(userId);

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      const sanitizedData = this.sanitizeUserData(userData);

      let fileContent: string;
      let mimeType: string;

      if (format === 'JSON') {
        fileContent = JSON.stringify(sanitizedData, null, 2);
        mimeType = 'application/json';
      } else {
        fileContent = this.convertToCSV(sanitizedData);
        mimeType = 'text/csv';
      }

      const fileUrl = `/exports/${exportId}.${format.toLowerCase()}`;

      await this.repository.updateDataExportStatus(exportId, 'COMPLETED', fileUrl);

      this.logger.log(`Data export ${exportId} completed successfully`);
    } catch (error) {
      await this.repository.updateDataExportStatus(exportId, 'FAILED');
      throw error;
    }
  }

  private sanitizeUserData(userData: any) {
    const sanitized = {
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      profile: userData.profile,
      subscription: userData.subscription,
      cards: userData.cards?.map((card: any) => ({
        id: card.id,
        title: card.title,
        slug: card.slug,
        status: card.status,
        privacyMode: card.privacyMode,
        profileData: card.profileData,
        designSettings: card.designSettings,
        links: card.links,
        nfcTags: card.nfcTags?.map((tag: any) => ({
          uid: tag.uid,
          status: tag.status,
        })),
        shareLinks: card.shareLinks,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      })),
      contacts: userData.contacts?.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobTitle: contact.jobTitle,
        notes: contact.notes,
        tags: contact.tags,
        category: contact.category,
        source: contact.source,
        createdAt: contact.createdAt,
      })),
      integrations: userData.integrations?.map((integration: any) => ({
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        createdAt: integration.createdAt,
      })),
      notificationPreferences: userData.notificationPreferences,
      oauthProviders: userData.oauthProviders?.map((provider: any) => ({
        provider: provider.provider,
        email: provider.email,
        isPrimary: provider.isPrimary,
        createdAt: provider.createdAt,
      })),
    };

    return sanitized;
  }

  private convertToCSV(data: any): string {
    let csv = 'Section,Key,Value\n';

    const flatten = (obj: any, prefix = '') => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
          csv += `${prefix},${key},""\n`;
        } else if (Array.isArray(value)) {
          csv += `${prefix},${key},"${value.length} items"\n`;
        } else if (typeof value === 'object') {
          flatten(value, fullKey);
        } else {
          csv += `${prefix},${key},"${String(value).replace(/"/g, '""')}"\n`;
        }
      });
    };

    flatten(data);
    return csv;
  }

  async getDataExports(userId: string) {
    return this.repository.getDataExports(userId);
  }

  async deleteAccount(userId: string) {
    this.logger.warn(`Deleting account for user ${userId}`);
    await this.repository.deleteUserAccount(userId);
    this.logger.log(`Account ${userId} deleted successfully`);
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
    return this.repository.recordCookieConsent(data);
  }

  async getCookieConsent(sessionId: string) {
    return this.repository.getCookieConsent(sessionId);
  }
}
