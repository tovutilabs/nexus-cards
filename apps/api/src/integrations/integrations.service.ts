import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../auth/crypto.service';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { ConnectIntegrationDto } from './dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService
  ) {}

  async connectIntegration(userId: string, dto: ConnectIntegrationDto) {
    const encryptedCredentials = this.crypto.encrypt(
      JSON.stringify(dto.credentials)
    );

    const existing = await this.prisma.integration.findFirst({
      where: {
        userId,
        provider: dto.provider,
      },
    });

    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: {
          credentials: encryptedCredentials,
          settings: dto.settings || {},
          status: IntegrationStatus.ACTIVE,
        },
      });
    }

    return this.prisma.integration.create({
      data: {
        userId,
        provider: dto.provider,
        credentials: encryptedCredentials,
        settings: dto.settings || {},
        status: IntegrationStatus.ACTIVE,
      },
    });
  }

  async disconnectIntegration(userId: string, provider: IntegrationProvider) {
    const integration = await this.prisma.integration.findFirst({
      where: { userId, provider },
    });

    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    await this.prisma.integration.delete({
      where: { id: integration.id },
    });

    return { success: true };
  }

  async listIntegrations(userId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return integrations;
  }

  async syncContacts(userId: string, provider: IntegrationProvider) {
    const integration = await this.prisma.integration.findFirst({
      where: { userId, provider },
    });

    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    const credentials = JSON.parse(
      this.crypto.decrypt(integration.credentials as string)
    );

    switch (provider) {
      case IntegrationProvider.SALESFORCE:
        return this.syncSalesforce(userId, credentials, integration.id);
      case IntegrationProvider.HUBSPOT:
        return this.syncHubspot(userId, credentials, integration.id);
      case IntegrationProvider.ZOHO:
        return this.syncZoho(userId, credentials, integration.id);
      case IntegrationProvider.MAILCHIMP:
        return this.syncMailchimp(userId, credentials, integration.id);
      case IntegrationProvider.SENDGRID:
        return this.syncSendgrid(userId, credentials, integration.id);
      case IntegrationProvider.ZAPIER:
        return this.triggerZapier(userId, credentials, integration.id);
      case IntegrationProvider.GOOGLE_DRIVE:
        return this.syncGoogleDrive(userId, credentials, integration.id);
      case IntegrationProvider.DROPBOX:
        return this.syncDropbox(userId, credentials, integration.id);
      default:
        throw new BadRequestException('Unknown provider');
    }
  }

  private async syncSalesforce(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`Salesforce sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'SALESFORCE',
      message: 'Salesforce integration is stubbed - no actual sync performed',
      contactsSynced: 0,
    };
  }

  private async syncHubspot(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`HubSpot sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'HUBSPOT',
      message: 'HubSpot integration is stubbed - no actual sync performed',
      contactsSynced: 0,
    };
  }

  private async syncZoho(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`Zoho sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'ZOHO',
      message: 'Zoho integration is stubbed - no actual sync performed',
      contactsSynced: 0,
    };
  }

  private async syncMailchimp(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`Mailchimp sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'MAILCHIMP',
      message: 'Mailchimp integration is stubbed - no actual sync performed',
      contactsSynced: 0,
    };
  }

  private async syncSendgrid(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`SendGrid sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'SENDGRID',
      message: 'SendGrid integration is stubbed - no actual sync performed',
      contactsSynced: 0,
    };
  }

  private async triggerZapier(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`Zapier webhook trigger requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'ZAPIER',
      message: 'Zapier webhook integration is stubbed - no actual trigger sent',
      triggered: false,
    };
  }

  private async syncGoogleDrive(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`Google Drive sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'GOOGLE_DRIVE',
      message: 'Google Drive integration is stubbed - no actual sync performed',
      filesSynced: 0,
    };
  }

  private async syncDropbox(
    userId: string,
    credentials: any,
    integrationId: string
  ) {
    this.logger.log(`Dropbox sync requested for user ${userId}`);

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      provider: 'DROPBOX',
      message: 'Dropbox integration is stubbed - no actual sync performed',
      filesSynced: 0,
    };
  }
}
