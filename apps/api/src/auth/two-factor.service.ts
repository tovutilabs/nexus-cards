import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private configService: ConfigService
  ) {}

  async generateSecret(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `Nexus Cards (${email})`,
      issuer: 'Nexus Cards',
      length: 32,
    });

    const otpauthUrl = secret.otpauth_url;
    if (!otpauthUrl) {
      throw new Error('Failed to generate OTP auth URL');
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Store the secret temporarily (will be confirmed when user verifies)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated. Please generate a secret first.');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.cryptoService.hashPassword(code))
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        backupCodes: hashedBackupCodes,
      },
    });

    return {
      message: '2FA enabled successfully',
      backupCodes,
    };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify code
    const verified = await this.verify2FACode(userId, code);

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    return { message: '2FA disabled successfully' };
  }

  async verify2FACode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return false;
    }

    // Try TOTP verification
    const totpVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (totpVerified) {
      return true;
    }

    // Try backup codes
    if (user.backupCodes && user.backupCodes.length > 0) {
      for (let i = 0; i < user.backupCodes.length; i++) {
        const isValid = await this.cryptoService.verifyPassword(
          user.backupCodes[i],
          code
        );
        
        if (isValid) {
          // Remove used backup code
          const updatedCodes = [...user.backupCodes];
          updatedCodes.splice(i, 1);
          
          await this.prisma.user.update({
            where: { id: userId },
            data: { backupCodes: updatedCodes },
          });
          
          return true;
        }
      }
    }

    return false;
  }

  async regenerateBackupCodes(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify current 2FA code
    const verified = await this.verify2FACode(userId, code);

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.cryptoService.hashPassword(code))
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: hashedBackupCodes,
      },
    });

    return {
      message: 'Backup codes regenerated successfully',
      backupCodes,
    };
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10)
      ).join('');
      codes.push(code);
    }
    
    return codes;
  }
}
