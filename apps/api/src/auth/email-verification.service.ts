import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private mailService: MailService
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

    // Get user profile for first name
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { firstName: true },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      verificationToken,
      profile?.firstName || undefined
    );

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

    // Get user profile for welcome email
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { firstName: true },
    });

    // Send welcome email
    await this.mailService.sendWelcomeEmail(
      user.email,
      profile?.firstName || undefined
    );

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
