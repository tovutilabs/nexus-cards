import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSettingDto, UpdateSettingDto } from './dto/system-settings.dto';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async getAllSettings(@Query('category') category?: string) {
    return this.systemSettingsService.getAllSettings(category);
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.systemSettingsService.getSetting(key);
  }

  @Post()
  async createSetting(
    @Body() createDto: CreateSettingDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.systemSettingsService.createSetting(createDto, user.id);
  }

  @Patch(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSettingDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.systemSettingsService.updateSetting(key, updateDto, user.id);
  }

  @Delete(':key')
  async deleteSetting(@Param('key') key: string) {
    return this.systemSettingsService.deleteSetting(key);
  }

  @Get('feature-flags/all')
  async getFeatureFlags() {
    return this.systemSettingsService.getFeatureFlags();
  }

  @Get('limits/all')
  async getLimits() {
    return this.systemSettingsService.getLimits();
  }
}
