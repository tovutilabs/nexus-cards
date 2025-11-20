import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get()
  async getUserSuggestions(@Req() req: any) {
    return this.suggestionsService.getUserSuggestions(req.user.id);
  }

  @Get('profile-completeness')
  async getProfileCompleteness(@Req() req: any) {
    return this.suggestionsService.getProfileCompletenessScore(req.user.id);
  }
}
