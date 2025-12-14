import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CardRenderModelService } from './services/card-render-model.service';
import { RevalidationService } from './services/revalidation.service';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [CardRenderModelService, RevalidationService],
  exports: [CardRenderModelService, RevalidationService],
})
export class SharedModule {}
