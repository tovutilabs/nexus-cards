import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { UsersRepository } from './users.repository';
import { SystemSettingsService } from './system-settings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersRepository, SystemSettingsService],
  controllers: [UsersController, AdminUsersController, AdminSettingsController],
  exports: [UsersService, UsersRepository, SystemSettingsService],
})
export class UsersModule {}
