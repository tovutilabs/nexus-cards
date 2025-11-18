import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete, Patch } from '@nestjs/common';
import { NfcService } from './nfc.service';
import { ImportNfcTagsDto, AssignNfcTagDto, AssociateNfcTagDto } from './dto/nfc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('nfc')
export class NfcController {
  constructor(private readonly nfcService: NfcService) {}

  @Get('resolve/:uid')
  resolveTag(@Param('uid') uid: string) {
    return this.nfcService.resolveTag(uid);
  }

  @Get('tags')
  @UseGuards(JwtAuthGuard)
  getUserTags(@CurrentUser() user: { id: string }) {
    return this.nfcService.getUserTags(user.id);
  }

  @Get('cards/:cardId/tags')
  @UseGuards(JwtAuthGuard)
  getCardTags(
    @Param('cardId') cardId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.nfcService.getCardTags(cardId, user.id);
  }

  @Post('tags/:tagId/associate')
  @UseGuards(JwtAuthGuard)
  associateTag(
    @Param('tagId') tagId: string,
    @CurrentUser() user: { id: string },
    @Body() associateDto: AssociateNfcTagDto,
  ) {
    return this.nfcService.associateTagWithCard(tagId, user.id, associateDto);
  }

  @Post('tags/:tagId/disassociate')
  @UseGuards(JwtAuthGuard)
  disassociateTag(
    @Param('tagId') tagId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.nfcService.disassociateTag(tagId, user.id);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  importTags(@Body() importDto: ImportNfcTagsDto) {
    return this.nfcService.importTags(importDto);
  }

  @Patch('admin/tags/:tagId/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  assignTag(
    @Param('tagId') tagId: string,
    @Body() assignDto: AssignNfcTagDto,
  ) {
    return this.nfcService.assignTagToUser(tagId, assignDto);
  }

  @Delete('admin/tags/:tagId/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  revokeTag(@Param('tagId') tagId: string) {
    return this.nfcService.revokeTag(tagId);
  }

  @Get('admin/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllTags(
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.nfcService.getAllTags({
      status,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getTagStats() {
    return this.nfcService.getTagStats();
  }
}
