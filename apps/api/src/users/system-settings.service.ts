import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/system-settings.dto';

@Injectable()
export class SystemSettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings(category?: string) {
    const where = category ? { category } : {};

    return this.prisma.systemSettings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return setting;
  }

  async createSetting(createDto: CreateSettingDto, updatedBy: string) {
    return this.prisma.systemSettings.create({
      data: {
        ...createDto,
        updatedBy,
      },
    });
  }

  async updateSetting(
    key: string,
    updateDto: UpdateSettingDto,
    updatedBy: string
  ) {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return this.prisma.systemSettings.update({
      where: { key },
      data: {
        ...updateDto,
        updatedBy,
      },
    });
  }

  async deleteSetting(key: string) {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return this.prisma.systemSettings.delete({
      where: { key },
    });
  }

  async getFeatureFlags() {
    return this.getAllSettings('feature_flags');
  }

  async getLimits() {
    return this.getAllSettings('limits');
  }

  async getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.getSetting(key);
      return setting.value as T;
    } catch (error) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  async setSettingValue(key: string, value: any, updatedBy: string) {
    const existing = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (existing) {
      return this.updateSetting(key, { value }, updatedBy);
    } else {
      return this.createSetting({ key, value }, updatedBy);
    }
  }
}
