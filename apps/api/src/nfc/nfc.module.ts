import { Module } from '@nestjs/common';
import { NfcService } from './nfc.service';
import { NfcController } from './nfc.controller';
import { NfcRepository } from './nfc.repository';

@Module({
  providers: [NfcService, NfcRepository],
  controllers: [NfcController],
  exports: [NfcService, NfcRepository],
})
export class NfcModule {}
