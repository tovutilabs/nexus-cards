import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsRepository } from './contacts.repository';

@Module({
  providers: [ContactsService, ContactsRepository],
  controllers: [ContactsController],
  exports: [ContactsService, ContactsRepository],
})
export class ContactsModule {}
