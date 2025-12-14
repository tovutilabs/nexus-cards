import { Controller, Get, Param } from '@nestjs/common';
import { CardRenderModelService } from '../shared/services/card-render-model.service';

@Controller('public/cards')
export class PublicCardRenderController {
  constructor(private readonly renderModelService: CardRenderModelService) {}

  @Get(':slug/render-model')
  async getRenderModel(@Param('slug') slug: string) {
    return this.renderModelService.buildPublicRenderModel(slug);
  }
}
