import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { CreateShareLinkDto, UpdateShareLinkDto, ValidateShareLinkDto } from './dto/create-share-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() dto: CreateShareLinkDto) {
    return this.shareLinksService.create(req.user.sub, dto);
  }

  @Get('card/:cardId')
  @UseGuards(JwtAuthGuard)
  async findByCard(@Request() req: any, @Param('cardId') cardId: string) {
    return this.shareLinksService.findByCard(req.user.sub, cardId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.shareLinksService.findOne(req.user.sub, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateShareLinkDto,
  ) {
    return this.shareLinksService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async revoke(@Request() req: any, @Param('id') id: string) {
    return this.shareLinksService.revoke(req.user.sub, id);
  }

  @Post('validate')
  async validate(@Body() dto: ValidateShareLinkDto) {
    return this.shareLinksService.validateShareLink(dto);
  }

  @Post('channel-urls')
  @UseGuards(JwtAuthGuard)
  async generateChannelUrls(
    @Body() body: { shareUrl: string; cardTitle: string },
  ) {
    return this.shareLinksService.generateChannelUrls(body.shareUrl, body.cardTitle);
  }
}
