import { Controller, Get, Post, Param, Query, Body, Req, Headers } from '@nestjs/common';
import { Request } from 'express';
import { CardsService } from '../cards/cards.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContactsService } from '../contacts/contacts.service';
import { SubmitContactDto } from '../contacts/dto/submit-contact.dto';

@Controller('public')
export class PublicApiController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly analyticsService: AnalyticsService,
    private readonly contactsService: ContactsService,
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
  async getPublicCard(
    @Param('slug') slug: string,
    @Query('uid') uid?: string,
    @Req() req?: Request,
    @Headers() headers?: any,
  ) {
    const card = await this.cardsService.findPublicBySlug(slug);

    const metadata = req ? this.extractMetadata(req, headers) : {};

    await this.analyticsService.logCardView(card.id, {
      nfcUid: uid,
      source: uid ? 'nfc' : 'web',
      ...metadata,
    });

    return card;
  }

  @Post('cards/:slug/contacts')
  async submitContact(
    @Param('slug') slug: string,
    @Body() submitContactDto: SubmitContactDto,
    @Query('uid') uid?: string,
  ) {
    const metadata = {
      source: uid ? 'NFC' : 'WEB',
      nfcUid: uid,
    };

    const contact = await this.contactsService.submitContact(slug, submitContactDto, metadata);

    await this.analyticsService.logContactSubmission(contact.cardId, metadata);

    return {
      message: 'Contact submitted successfully',
      contactId: contact.id,
    };
  }
}
