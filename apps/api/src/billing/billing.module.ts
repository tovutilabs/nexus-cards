import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CardComponentsModule } from '../card-components/card-components.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => CardComponentsModule)],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
