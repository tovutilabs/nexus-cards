import { Module } from '@nestjs/common';
import { CardComponentsService } from './card-components.service';
import { CardComponentsController } from './card-components.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CardComponentsController],
  providers: [CardComponentsService],
  exports: [CardComponentsService],
})
export class CardComponentsModule {}
