import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(
    @Req() req: any,
    @Body() dto: CreateCheckoutSessionDto
  ) {
    const userId = req.user.userId;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const successUrl =
      dto.successUrl || `${baseUrl}/dashboard/settings/billing?success=true`;
    const cancelUrl =
      dto.cancelUrl || `${baseUrl}/dashboard/settings/billing?canceled=true`;

    const session = await this.billingService.createCheckoutSession(
      userId,
      dto.tier,
      successUrl,
      cancelUrl
    );

    return session;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body not available');
    }
    await this.billingService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage')
  async getUsage(@Req() req: any) {
    const userId = req.user.userId;
    return this.billingService.getSubscriptionUsage(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscription')
  async cancelSubscription(@Req() req: any) {
    const userId = req.user.userId;
    await this.billingService.cancelSubscription(userId);
    return { success: true };
  }
}
