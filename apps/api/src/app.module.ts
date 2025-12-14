import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { NfcModule } from './nfc/nfc.module';
import { ContactsModule } from './contacts/contacts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PublicApiModule } from './public-api/public-api.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PublicApiV1Module } from './public-api-v1/public-api-v1.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { TemplatesModule } from './templates/templates.module';
import { ShareLinksModule } from './share-links/share-links.module';
import { ConnectionsModule } from './connections/connections.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ComplianceModule } from './compliance/compliance.module';
import { RedirectController } from './redirect.controller';
import { FileUploadModule } from './file-upload/file-upload.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { CardComponentsModule } from './card-components/card-components.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    SharedModule,
    AuthModule,
    UsersModule,
    CardsModule,
    NfcModule,
    ContactsModule,
    AnalyticsModule,
    BillingModule,
    IntegrationsModule,
    PublicApiModule,
    ExperimentsModule,
    ApiKeysModule,
    PublicApiV1Module,
    WebhooksModule,
    TemplatesModule,
    ShareLinksModule,
    ConnectionsModule,
    SuggestionsModule,
    NotificationsModule,
    ComplianceModule,
    FileUploadModule,
    ActivityLogModule,
    CardComponentsModule,
  ],
  controllers: [AppController, RedirectController],
  providers: [AppService],
})
export class AppModule {}
