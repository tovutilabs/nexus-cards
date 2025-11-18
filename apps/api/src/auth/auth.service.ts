import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { CryptoService } from './crypto.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findByEmail(registerDto.email);
    
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.cryptoService.hashPassword(registerDto.password);
    const emailVerificationToken = this.cryptoService.generateVerificationToken();

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

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.verifyPassword(
      user.passwordHash,
      password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const resetToken = this.cryptoService.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.usersRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

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

    const passwordHash = await this.cryptoService.hashPassword(resetPasswordDto.password);

    await this.usersRepository.update(user[0].id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { message: 'Password reset successful' };
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
      tokenType: 'Bearer',
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}
