import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { CryptoService } from './crypto.service';
import { TwoFactorService } from './two-factor.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private twoFactorService: TwoFactorService,
    private configService: ConfigService,
    private mailService: MailService
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email
    );

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.cryptoService.hashPassword(
      registerDto.password
    );
    const emailVerificationToken =
      this.cryptoService.generateVerificationToken();

    const user = await this.usersRepository.create({
      email: registerDto.email,
      passwordHash,
      emailVerificationToken,
      profile: {
        create: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      },
      subscription: {
        create: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return a flag indicating 2FA is required
      // Frontend should prompt for 2FA code
      return {
        requires2FA: true,
        userId: user.id,
        message: 'Two-factor authentication required',
      };
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.verifyPassword(
      user.passwordHash,
      password
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(
      forgotPasswordDto.email
    );

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const resetToken = this.cryptoService.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.usersRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Get user profile for first name
    const profile = await this.usersRepository.findProfile(user.id);

    // Send password reset email
    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      profile?.firstName
    );

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepository.findMany({
      where: {
        passwordResetToken: resetPasswordDto.token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
      take: 1,
    });

    if (!user.length) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.cryptoService.hashPassword(
      resetPasswordDto.password
    );

    await this.usersRepository.update(user[0].id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { message: 'Password reset successful' };
  }

  async loginWith2FA(login2FADto: Login2FADto) {
    const user = await this.validateUser(login2FADto.email, login2FADto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify 2FA code
    const verified = await this.twoFactorService.verify2FACode(
      user.id,
      login2FADto.twoFactorCode
    );

    if (!verified) {
      throw new UnauthorizedException('Invalid two-factor authentication code');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }

  private sanitizeUser(user: User) {
    const {
      passwordHash: _passwordHash,
      passwordResetToken: _passwordResetToken,
      passwordResetExpires: _passwordResetExpires,
      emailVerificationToken: _emailVerificationToken,
      twoFactorSecret: _twoFactorSecret,
      ...sanitized
    } = user;
    return sanitized;
  }
}
