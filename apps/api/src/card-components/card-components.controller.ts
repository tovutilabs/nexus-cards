import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CardComponentsService } from './card-components.service';
import { CreateCardComponentDto } from './dto/create-card-component.dto';
import { UpdateCardComponentDto } from './dto/update-card-component.dto';
import { ReorderComponentsDto } from './dto/reorder-components.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cards/:cardId/components')
@UseGuards(JwtAuthGuard)
export class CardComponentsController {
  constructor(private readonly cardComponentsService: CardComponentsService) {}

  @Get()
  findAll(@Param('cardId') cardId: string) {
    return this.cardComponentsService.findAll(cardId);
  }

  @Get(':componentId')
  findOne(@Param('cardId') cardId: string, @Param('componentId') componentId: string) {
    return this.cardComponentsService.findOne(cardId, componentId);
  }

  @Post()
  create(
    @Param('cardId') cardId: string,
    @Request() req: any,
    @Body() createCardComponentDto: CreateCardComponentDto,
  ) {
    return this.cardComponentsService.create(cardId, req.user.id, createCardComponentDto);
  }

  @Patch(':componentId')
  update(
    @Param('cardId') cardId: string,
    @Param('componentId') componentId: string,
    @Request() req: any,
    @Body() updateCardComponentDto: UpdateCardComponentDto,
  ) {
    return this.cardComponentsService.update(
      cardId,
      componentId,
      req.user.id,
      updateCardComponentDto,
    );
  }

  @Post('reorder')
  reorder(
    @Param('cardId') cardId: string,
    @Request() req: any,
    @Body() reorderComponentsDto: ReorderComponentsDto,
  ) {
    return this.cardComponentsService.reorder(cardId, req.user.id, reorderComponentsDto);
  }

  @Delete(':componentId')
  remove(
    @Param('cardId') cardId: string,
    @Param('componentId') componentId: string,
    @Request() req: any,
  ) {
    return this.cardComponentsService.remove(cardId, componentId, req.user.id);
  }
}
