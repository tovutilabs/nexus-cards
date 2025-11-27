import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  async getAll(@Query('category') category?: string) {
    return this.settingsService.getAll(category);
  }

  @Get('categories')
  async getCategories() {
    return this.settingsService.getAllCategories();
  }

  @Get(':key')
  async getByKey(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @Post()
  async create(
    @Body() createSettingDto: CreateSettingDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.settingsService.create({
      ...createSettingDto,
      updatedBy: user.email,
    });
  }

  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.settingsService.update(key, {
      ...updateSettingDto,
      updatedBy: user.email,
    });
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    return this.settingsService.delete(key);
  }
}
