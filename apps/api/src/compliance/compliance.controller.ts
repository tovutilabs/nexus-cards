import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('data-export')
  @UseGuards(JwtAuthGuard)
  async requestDataExport(
    @Req() req: any,
    @Body() body: { format: 'JSON' | 'CSV' },
  ) {
    const userId = req.user.userId;
    return this.complianceService.requestDataExport(userId, body.format || 'JSON');
  }

  @Get('data-exports')
  @UseGuards(JwtAuthGuard)
  async getDataExports(@Req() req: any) {
    const userId = req.user.userId;
    return this.complianceService.getDataExports(userId);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Req() req: any) {
    const userId = req.user.userId;
    await this.complianceService.deleteAccount(userId);
  }

  @Post('cookie-consent')
  async recordCookieConsent(@Body() body: any, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.complianceService.recordCookieConsent({
      userId: body.userId,
      sessionId: body.sessionId,
      necessary: body.necessary ?? true,
      analytics: body.analytics ?? false,
      marketing: body.marketing ?? false,
      preferences: body.preferences ?? false,
      ipAddress,
      userAgent,
    });
  }

  @Get('cookie-consent')
  async getCookieConsent(@Query('sessionId') sessionId: string) {
    return this.complianceService.getCookieConsent(sessionId);
  }
}
