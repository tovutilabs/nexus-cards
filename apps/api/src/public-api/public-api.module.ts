import { Module } from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { PublicApiController } from './public-api.controller';
import { CardsModule } from '../cards/cards.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ContactsModule } from '../contacts/contacts.module';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [CardsModule, AnalyticsModule, ContactsModule, ConnectionsModule],
  providers: [PublicApiService],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
