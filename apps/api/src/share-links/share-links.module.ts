import { Module } from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { ShareLinksController } from './share-links.controller';
import { PublicCardsController } from './public-cards.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [PrismaModule, CardsModule],
  controllers: [ShareLinksController, PublicCardsController],
  providers: [ShareLinksService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
