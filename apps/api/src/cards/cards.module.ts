import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';

@Module({
  providers: [CardsService, CardsRepository],
  controllers: [CardsController],
  exports: [CardsService, CardsRepository],
})
export class CardsModule {}
