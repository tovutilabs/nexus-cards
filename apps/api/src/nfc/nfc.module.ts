import { Module } from '@nestjs/common';
import { NfcService } from './nfc.service';
import { NfcController } from './nfc.controller';
import { NfcRepository } from './nfc.repository';
import { CardsModule } from '../cards/cards.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CardsModule, UsersModule],
  providers: [NfcService, NfcRepository],
  controllers: [NfcController],
  exports: [NfcService, NfcRepository],
})
export class NfcModule {}
