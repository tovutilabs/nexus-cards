import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';

@Injectable()
export class IntegrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.integration.findUnique({
      where: { id },
      include: { user: { include: { profile: true } } },
    });
  }

  async findByUserAndProvider(userId: string, provider: IntegrationProvider) {
    return this.prisma.integration.findFirst({
      where: {
        userId,
        provider,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    userId: string;
    provider: IntegrationProvider;
    credentials: any;
    settings?: any;
  }) {
    return this.prisma.integration.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        status: IntegrationStatus.ACTIVE,
        credentials: data.credentials,
        settings: data.settings || {},
      },
    });
  }

  async update(id: string, data: {
    status?: IntegrationStatus;
    credentials?: any;
    settings?: any;
    lastSyncAt?: Date;
  }) {
    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.integration.delete({
      where: { id },
    });
  }

  async updateLastSync(id: string) {
    return this.prisma.integration.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }
}
