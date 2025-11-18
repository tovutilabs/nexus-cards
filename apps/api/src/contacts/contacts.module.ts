import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsRepository } from './contacts.repository';
import { CardsModule } from '../cards/cards.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, CardsModule, UsersModule],
  providers: [ContactsService, ContactsRepository],
  controllers: [ContactsController],
  exports: [ContactsService, ContactsRepository],
})
export class ContactsModule {}
