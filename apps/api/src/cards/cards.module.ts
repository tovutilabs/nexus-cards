import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [CardsService, CardsRepository],
  controllers: [CardsController],
  exports: [CardsService, CardsRepository],
})
export class CardsModule {}
