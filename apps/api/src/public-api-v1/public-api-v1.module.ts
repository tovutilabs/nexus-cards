import { Module } from '@nestjs/common';
import { PublicApiV1Controller } from './public-api-v1.controller';
import { PublicApiV1Service } from './public-api-v1.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { CardsModule } from '../cards/cards.module';
import { ContactsModule } from '../contacts/contacts.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ApiKeysModule,
    CardsModule,
    ContactsModule,
    AnalyticsModule,
  ],
  controllers: [PublicApiV1Controller],
  providers: [PublicApiV1Service],
})
export class PublicApiV1Module {}
