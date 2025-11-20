import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Get,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { TwoFactorService } from './two-factor.service';
import { EmailVerificationService } from './email-verification.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { Enable2FADto, Verify2FADto, Disable2FADto, GenerateBackupCodesDto } from './dto/two-factor.dto';
import { VerifyEmailDto } from './dto/email-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
    private twoFactorService: TwoFactorService,
    private emailVerificationService: EmailVerificationService
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.register(registerDto);

    this.setAuthCookie(res, result.accessToken);

    const { accessToken: _accessToken, ...userData } = result;
    return userData;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(loginDto);

    // Check if 2FA is required
    if ('requires2FA' in result && result.requires2FA) {
      return result;
    }

    // Normal login with token
    if ('accessToken' in result) {
      this.setAuthCookie(res, result.accessToken);
      const { accessToken: _accessToken, ...userData } = result;
      return userData;
    }

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  async loginWith2FA(
    @Body() login2FADto: Login2FADto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.loginWith2FA(login2FADto);

    this.setAuthCookie(res, result.accessToken);

    const { accessToken: _accessToken, ...userData } = result;
    return userData;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() _user: User
  ) {
    this.clearAuthCookie(res);
    return { message: 'Logged out successfully' };
  }

  // OAuth Routes
  @Get('oauth/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('oauth/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.generateTokens(req.user);
    this.setAuthCookie(res, tokens.accessToken);

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return res.redirect(`${webUrl}/dashboard`);
  }

  @Get('oauth/linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth() {
    // Initiates LinkedIn OAuth flow
  }

  @Get('oauth/linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuthCallback(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.generateTokens(req.user);
    this.setAuthCookie(res, tokens.accessToken);

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return res.redirect(`${webUrl}/dashboard`);
  }

  @Get('oauth/microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates Microsoft OAuth flow
  }

  @Get('oauth/microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallback(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.generateTokens(req.user);
    this.setAuthCookie(res, tokens.accessToken);

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return res.redirect(`${webUrl}/dashboard`);
  }

  @Get('oauth/providers')
  @UseGuards(JwtAuthGuard)
  async getOAuthProviders(@CurrentUser() user: User) {
    return this.oauthService.getUserProviders(user.id);
  }

  @Delete('oauth/providers/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlinkOAuthProvider(
    @CurrentUser() user: User,
    @Param('provider') provider: string
  ) {
    return this.oauthService.unlinkProvider(
      user.id,
      provider.toUpperCase() as any
    );
  }

  // Two-Factor Authentication Routes
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@CurrentUser() user: User) {
    return this.twoFactorService.generateSecret(user.id, user.email);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2FA(@CurrentUser() user: User, @Body() dto: Enable2FADto) {
    return this.twoFactorService.enable2FA(user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disable2FA(@CurrentUser() user: User, @Body() dto: Disable2FADto) {
    return this.twoFactorService.disable2FA(user.id, dto.code);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2FA(@CurrentUser() user: User, @Body() dto: Verify2FADto) {
    const verified = await this.twoFactorService.verify2FACode(
      user.id,
      dto.code
    );
    return { verified };
  }

  @Post('2fa/backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateBackupCodes(
    @CurrentUser() user: User,
    @Body() dto: GenerateBackupCodesDto
  ) {
    return this.twoFactorService.regenerateBackupCodes(user.id, dto.code);
  }

  // Email Verification Routes
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(dto.token);
  }

  @Post('email/resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: User) {
    return this.emailVerificationService.sendVerificationEmail(user.id);
  }

  @Get('email/verification-status')
  @UseGuards(JwtAuthGuard)
  async getVerificationStatus(@CurrentUser() user: User) {
    return this.emailVerificationService.checkVerificationStatus(user.id);
  }

  private setAuthCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearAuthCookie(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });
  }
}
