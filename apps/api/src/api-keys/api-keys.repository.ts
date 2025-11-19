import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.apiKey.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findByKeyHash(keyHash: string) {
    return this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: { include: { subscription: true } } },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        userId,
        revokedAt: { equals: null },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    expiresAt?: Date;
  }) {
    return this.prisma.apiKey.create({
      data,
    });
  }

  async updateLastUsed(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async revoke(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }
}
