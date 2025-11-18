import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
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

  @Get('cards/:slug')
  async getPublicCard(
    @Param('slug') slug: string,
    @Query('uid') uid?: string,
  ) {
    const card = await this.cardsService.findPublicBySlug(slug);

    await this.analyticsService.logCardView(card.id, {
      nfcUid: uid,
      source: uid ? 'nfc' : 'web',
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
