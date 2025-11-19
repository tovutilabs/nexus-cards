import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeysRepository } from './api-keys.repository';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class ApiKeysService {
  constructor(private readonly apiKeysRepository: ApiKeysRepository) {}

  async generateApiKey(userId: string, name: string, expiresAt?: Date) {
    const rawKey = this.generateRandomKey();
    const keyHash = await argon2.hash(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = await this.apiKeysRepository.create({
      userId,
      name,
      keyHash,
      keyPrefix,
      expiresAt,
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix: apiKey.keyPrefix,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async rotateApiKey(userId: string, keyId: string) {
    const existingKey = await this.apiKeysRepository.findById(keyId);

    if (!existingKey) {
      throw new NotFoundException('API key not found');
    }

    if (existingKey.userId !== userId) {
      throw new ForbiddenException('You do not have access to this API key');
    }

    await this.apiKeysRepository.revoke(keyId);

    return this.generateApiKey(
      userId,
      existingKey.name,
      existingKey.expiresAt || undefined
    );
  }

  async revokeApiKey(userId: string, keyId: string) {
    const apiKey = await this.apiKeysRepository.findById(keyId);

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenException('You do not have access to this API key');
    }

    await this.apiKeysRepository.revoke(keyId);

    return { message: 'API key revoked successfully' };
  }

  async deleteApiKey(userId: string, keyId: string) {
    const apiKey = await this.apiKeysRepository.findById(keyId);

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenException('You do not have access to this API key');
    }

    await this.apiKeysRepository.delete(keyId);

    return { message: 'API key deleted successfully' };
  }

  async getUserApiKeys(userId: string) {
    const keys = await this.apiKeysRepository.findAllByUserId(userId);

    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));
  }

  async validateApiKey(rawKey: string): Promise<{
    userId: string;
    tier: string;
    keyId: string;
  }> {
    if (!rawKey || !rawKey.startsWith('nxk_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const keyPrefix = rawKey.substring(0, 8);
    const possibleKeys = await this.prisma.apiKey.findMany({
      where: { keyPrefix },
      include: { user: { include: { subscription: true } } },
    });

    for (const apiKey of possibleKeys) {
      if (apiKey.revokedAt) {
        continue;
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        continue;
      }

      const isValid = await argon2.verify(apiKey.keyHash, rawKey);

      if (isValid) {
        await this.apiKeysRepository.updateLastUsed(apiKey.id);

        if (!apiKey.user.subscription) {
          throw new ForbiddenException('User has no active subscription');
        }

        if (apiKey.user.subscription.tier !== 'PREMIUM') {
          throw new ForbiddenException(
            'API access requires Premium subscription'
          );
        }

        return {
          userId: apiKey.userId,
          tier: apiKey.user.subscription.tier,
          keyId: apiKey.id,
        };
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }

  private generateRandomKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `nxk_${randomBytes.toString('base64url')}`;
  }

  private get prisma() {
    return this.apiKeysRepository['prisma'];
  }
}
