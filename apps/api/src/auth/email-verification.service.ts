import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService
  ) {}

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token if not exists
    let verificationToken = user.emailVerificationToken;
    
    if (!verificationToken) {
      verificationToken = this.cryptoService.generateVerificationToken();
      
      await this.prisma.user.update({
        where: { id: userId },
        data: { emailVerificationToken: verificationToken },
      });
    }

    // TODO: Send actual email via email service
    // For now, we'll just return success
    // In production, integrate with email provider (SendGrid, Mailchimp, etc.)

    return {
      message: 'Verification email sent',
      // Include token in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { token: verificationToken }),
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    return {
      message: 'Email verified successfully',
      emailVerified: true,
    };
  }

  async checkVerificationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      emailVerified: user.emailVerified,
    };
  }
}
