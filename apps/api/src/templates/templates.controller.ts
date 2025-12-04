import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, ApplyTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionTier } from '@prisma/client';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(@Query('category') category?: string, @Query('tier') tier?: SubscriptionTier) {
    return this.templatesService.findAll(tier, category);
  }

  @Get('featured')
  async getFeatured() {
    return this.templatesService.getFeaturedTemplates();
  }

  @Get('category/:category')
  async getByCategory(@Param('category') category: string, @Query('tier') tier?: SubscriptionTier) {
    return this.templatesService.getTemplatesByCategory(category, tier);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.templatesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  @Post('apply/:cardId')
  @UseGuards(JwtAuthGuard)
  async applyTemplate(
    @Param('cardId') cardId: string,
    @Body() dto: ApplyTemplateDto,
    @Request() req: any,
  ) {
    return this.templatesService.applyTemplateToCard(
      cardId,
      dto.templateId,
      req.user.id,
      dto.preserveContent !== false,
    );
  }

  @Put('custom-css/:cardId')
  @UseGuards(JwtAuthGuard)
  async updateCustomCss(
    @Param('cardId') cardId: string,
    @Body('customCss') customCss: string,
    @Request() req: any,
  ) {
    return this.templatesService.updateCardCustomCss(cardId, req.user.id, customCss);
  }
}
