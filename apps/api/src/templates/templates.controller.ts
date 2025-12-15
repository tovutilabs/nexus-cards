import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, ApplyTemplateDto } from './dto/template.dto';
import { ArchiveTemplateDto } from '../cards/dto/update-styling.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionTier } from '@prisma/client';

@Controller('templates')
@UseGuards(OptionalJwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('tier') tier?: SubscriptionTier,
    @Request() req?: any,
  ) {
    // If user is authenticated, use their tier; otherwise use provided tier or undefined
    const userTier = req?.user?.subscription?.tier || tier;
    return this.templatesService.findAll(userTier, category);
  }

  @Get('featured')
  async getFeatured(@Request() req?: any) {
    const userTier = req?.user?.subscription?.tier;
    return this.templatesService.getFeaturedTemplates(userTier);
  }

  @Get('category/:category')
  async getByCategory(
    @Param('category') category: string,
    @Query('tier') tier?: SubscriptionTier,
    @Request() req?: any,
  ) {
    const userTier = req?.user?.subscription?.tier || tier;
    return this.templatesService.getTemplatesByCategory(category, userTier);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Get(':id/component-blueprint')
  async getComponentBlueprint(@Param('id') id: string) {
    return this.templatesService.getComponentBlueprint(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.templatesService.findBySlug(slug);
  }
}

@Controller('admin/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('tier') tier?: SubscriptionTier,
    @Query('includeArchived') includeArchived?: boolean,
  ) {
    return this.templatesService.findAll(tier, category, includeArchived === true);
  }

  @Post()
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Patch(':id/archive')
  async archive(@Param('id') id: string, @Body() dto: ArchiveTemplateDto) {
    return this.templatesService.archive(id, dto.reason);
  }

  @Patch(':id/unarchive')
  async unarchive(@Param('id') id: string) {
    return this.templatesService.unarchive(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  @Post('migrate-components')
  async migrateTemplateComponents(
    @Body() dto: { templateSlug: string; dryRun?: boolean },
  ) {
    return this.templatesService.migrateTemplateCards(
      dto.templateSlug,
      dto.dryRun !== false,
    );
  }
}
