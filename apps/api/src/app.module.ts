import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
