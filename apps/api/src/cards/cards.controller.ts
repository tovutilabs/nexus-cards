import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { UpdateCardStylingDto, UpdateCustomCssDto } from './dto/update-styling.dto';
import { ApplyTemplateDto } from '../templates/dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TemplatesService } from '../templates/templates.service';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly templatesService: TemplatesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createCardDto: CreateCardDto
  ) {
    return this.cardsService.create(user.id, createCardDto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.cardsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.cardsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updateCardDto: UpdateCardDto
  ) {
    return this.cardsService.update(id, user.id, updateCardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.cardsService.remove(id, user.id);
  }

  @Put(':id/social-links')
  updateSocialLinks(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updateSocialLinksDto: UpdateSocialLinksDto
  ) {
    return this.cardsService.updateSocialLinks(id, user.id, updateSocialLinksDto.socialLinks);
  }

  @Get(':id/social-links')
  getSocialLinks(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.cardsService.getSocialLinks(id, user.id);
  }

  @Patch(':cardId/styling')
  async updateStyling(
    @Param('cardId') cardId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCardStylingDto,
  ) {
    return this.cardsService.updateStyling(cardId, user.id, dto);
  }

  @Post(':cardId/apply-template')
  async applyTemplate(
    @Param('cardId') cardId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.templatesService.applyTemplateToCard(
      cardId,
      dto.templateId,
      user.id,
      dto.preserveContent !== false,
    );
  }

  @Patch(':cardId/custom-css')
  async updateCustomCss(
    @Param('cardId') cardId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCustomCssDto,
  ) {
    return this.templatesService.updateCardCustomCss(cardId, user.id, dto.customCss);
  }
}
