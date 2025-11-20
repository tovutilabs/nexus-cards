import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { OAuthController } from './oauth.controller';
import { IntegrationsRepository } from './integrations.repository';
import { SalesforceService, HubSpotService, ZohoService } from './crm.service';
import { MailchimpService, SendGridService } from './email.service';
import { GoogleDriveService, DropboxService } from './cloud-storage.service';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    IntegrationsService,
    IntegrationsRepository,
    SalesforceService,
    HubSpotService,
    ZohoService,
    MailchimpService,
    SendGridService,
    GoogleDriveService,
    DropboxService,
    WebhooksService,
  ],
  controllers: [IntegrationsController, OAuthController],
  exports: [IntegrationsService, WebhooksService],
})
export class IntegrationsModule {}
