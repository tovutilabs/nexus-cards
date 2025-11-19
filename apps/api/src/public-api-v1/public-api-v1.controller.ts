import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicApiV1Service } from './public-api-v1.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { ApiKeyRateLimitGuard } from '../api-keys/guards/api-key-rate-limit.guard';
import { Request } from 'express';

@Controller('v1')
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
export class PublicApiV1Controller {
  constructor(private readonly publicApiV1Service: PublicApiV1Service) {}

  @Get('cards')
  async listCards(@Req() req: Request) {
    const userId = (req as any).userId;
    return this.publicApiV1Service.getUserCards(userId);
  }

  @Get('cards/:cardId')
  async getCardMetadata(@Req() req: Request, @Param('cardId') cardId: string) {
    const userId = (req as any).userId;
    return this.publicApiV1Service.getCardMetadata(userId, cardId);
  }

  @Get('contacts')
  async listContacts(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const userId = (req as any).userId;
    return this.publicApiV1Service.getUserContacts(
      userId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0
    );
  }

  @Post('analytics/events')
  async logAnalyticsEvent(
    @Req() req: Request,
    @Body()
    body: {
      cardId: string;
      eventType: string;
      metadata?: Record<string, any>;
    }
  ) {
    const userId = (req as any).userId;
    const event = await this.publicApiV1Service.logAnalyticsEvent(userId, body);

    if (!event) {
      return {
        error: 'Card not found or access denied',
        statusCode: 404,
      };
    }

    return {
      id: event.id,
      cardId: event.cardId,
      eventType: event.eventType,
      timestamp: event.timestamp,
    };
  }
}
