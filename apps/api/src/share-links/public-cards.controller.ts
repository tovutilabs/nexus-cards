import { Controller, Get, Post, Param, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ShareLinksService } from '../share-links/share-links.service';
import { CardsService } from '../cards/cards.service';

@Controller('public')
export class PublicCardsController {
  constructor(
    private readonly shareLinksService: ShareLinksService,
    private readonly cardsService: CardsService,
  ) {}

  @Get('cards/slug/:slug')
  async getCardBySlug(
    @Param('slug') slug: string,
    @Query('token') token?: string,
    @Query('password') password?: string,
  ) {
    const card = await this.cardsService.findBySlug(slug);

    if (!card) {
      throw new UnauthorizedException('Card not found');
    }

    // If card has a share token in the query, validate it
    if (token) {
      const shareLink = await this.shareLinksService.findByToken(token);
      
      if (!shareLink) {
        throw new UnauthorizedException('Invalid or expired share link');
      }

      // Check password if required
      if (shareLink.requiresPassword && !password) {
        return {
          requiresPassword: true,
          cardId: card.id,
        };
      }

      if (shareLink.requiresPassword && password) {
        try {
          await this.shareLinksService.validateShareLink({ token, password });
        } catch (error) {
          throw new UnauthorizedException('Invalid password');
        }
      }

      // Increment share count
      await this.shareLinksService.validateShareLink({ token, password });

      return {
        card,
        allowContactSubmission: shareLink.allowContactSubmission,
      };
    }

    // Handle default privacy modes for direct access
    if (card.privacyMode === 'PRIVATE') {
      throw new UnauthorizedException('This card is private');
    }

    if (card.privacyMode === 'PASSWORD_PROTECTED') {
      if (!password) {
        return {
          requiresPassword: true,
          cardId: card.id,
        };
      }

      // Validate default password
      if (password !== card.defaultPassword) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    return {
      card,
      allowContactSubmission: card.allowContactSubmission ?? true,
    };
  }

  @Get('share/:token')
  async getCardByShareToken(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    const shareLink = await this.shareLinksService.findByToken(token);

    if (!shareLink) {
      throw new UnauthorizedException('Invalid or expired share link');
    }

    // Check if password is required
    if (shareLink.requiresPassword && !password) {
      return {
        requiresPassword: true,
        cardId: shareLink.card.id,
      };
    }

    // Validate share link with password if provided
    try {
      const result = await this.shareLinksService.validateShareLink({
        token,
        password,
      });

      return {
        card: result.card,
        allowContactSubmission: result.allowContactSubmission,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid password or expired link');
    }
  }

  @Post('share/:token/validate-password')
  async validatePassword(
    @Param('token') token: string,
    @Body('password') password: string,
  ) {
    try {
      const result = await this.shareLinksService.validateShareLink({
        token,
        password,
      });

      return {
        valid: true,
        card: result.card,
        allowContactSubmission: result.allowContactSubmission,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid password');
    }
  }
}
