import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSettingDto {
  key: string;
  value: any;
  description?: string;
  category?: string;
  updatedBy?: string;
}

export interface UpdateSettingDto {
  value?: any;
  description?: string;
  category?: string;
  updatedBy?: string;
}

@Injectable()
export class SystemSettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll(category?: string) {
    const where = category ? { category } : undefined;
    return this.prisma.systemSettings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async getByKey(key: string) {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.getByKey(key);
      return setting.value as T;
    } catch {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
  }

  async create(data: CreateSettingDto) {
    return this.prisma.systemSettings.create({
      data: {
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        updatedBy: data.updatedBy,
      },
    });
  }

  async update(key: string, data: UpdateSettingDto) {
    const existing = await this.getByKey(key);

    return this.prisma.systemSettings.update({
      where: { key },
      data: {
        value: data.value !== undefined ? data.value : existing.value,
        description: data.description !== undefined ? data.description : existing.description,
        category: data.category !== undefined ? data.category : existing.category,
        updatedBy: data.updatedBy,
      },
    });
  }

  async upsert(key: string, value: any, description?: string, category?: string, updatedBy?: string) {
    return this.prisma.systemSettings.upsert({
      where: { key },
      create: {
        key,
        value,
        description,
        category,
        updatedBy,
      },
      update: {
        value,
        description,
        category,
        updatedBy,
      },
    });
  }

  async delete(key: string) {
    await this.getByKey(key);
    return this.prisma.systemSettings.delete({
      where: { key },
    });
  }

  async getByCategory(category: string) {
    return this.prisma.systemSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  async getAllCategories() {
    const settings = await this.prisma.systemSettings.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: { not: null },
      },
    });

    return settings.map(s => s.category).filter(Boolean);
  }
}
