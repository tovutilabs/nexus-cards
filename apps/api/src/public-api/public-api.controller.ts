import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CardsService } from '../cards/cards.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContactsService } from '../contacts/contacts.service';
import { ConnectionsService } from '../connections/connections.service';
import { SubmitContactDto } from '../contacts/dto/submit-contact.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('public')
export class PublicApiController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly analyticsService: AnalyticsService,
    private readonly contactsService: ContactsService,
    private readonly connectionsService: ConnectionsService
  ) {}

  private extractMetadata(req: Request, headers: any) {
    const userAgent = headers['user-agent'] || '';
    const referrer = headers['referer'] || headers['referrer'] || '';

    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    return {
      device_type: deviceType,
      referrer: referrer || 'direct',
      user_agent: userAgent,
      ip: req.ip || req.socket.remoteAddress || '',
    };
  }

  @Get('cards/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicCard(
    @Param('slug') slug: string,
    @Query('uid') uid?: string,
    @Req() req?: any,
    @Headers() headers?: any
  ) {
    const card = await this.cardsService.findPublicBySlug(slug);

    const metadata = req ? this.extractMetadata(req, headers) : {};

    await this.analyticsService.logCardView(card.id, {
      nfcUid: uid,
      source: uid ? 'nfc' : 'web',
      ...metadata,
    });

    if (req.user && req.user.id && req.user.id !== card.userId) {
      await this.connectionsService.recordCardView(req.user.id, card.userId, {
        cardId: card.id,
        source: uid ? 'nfc' : 'web',
      });
    }

    return card;
  }

  @Post('cards/:slug/contacts')
  async submitContact(
    @Param('slug') slug: string,
    @Body() submitContactDto: SubmitContactDto,
    @Query('uid') uid?: string
  ) {
    const metadata = {
      source: uid ? 'NFC' : 'WEB',
      nfcUid: uid,
    };

    const contact = await this.contactsService.submitContact(
      slug,
      submitContactDto,
      metadata
    );

    await this.analyticsService.logContactSubmission(contact.cardId, metadata);

    return {
      message: 'Contact submitted successfully',
      contactId: contact.id,
    };
  }
}
