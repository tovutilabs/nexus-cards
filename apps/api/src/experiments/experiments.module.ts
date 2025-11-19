import { Module } from '@nestjs/common';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { ExperimentsRepository } from './experiments.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExperimentsController],
  providers: [ExperimentsService, ExperimentsRepository],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
