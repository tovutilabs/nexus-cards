import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async getUserApiKeys(@CurrentUser() user: { id: string }) {
    return this.apiKeysService.getUserApiKeys(user.id);
  }

  @Post()
  async generateApiKey(
    @CurrentUser() user: { id: string },
    @Body() body: { name: string; expiresAt?: string }
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.apiKeysService.generateApiKey(user.id, body.name, expiresAt);
  }

  @Post(':id/rotate')
  @HttpCode(HttpStatus.OK)
  async rotateApiKey(
    @CurrentUser() user: { id: string },
    @Param('id') keyId: string
  ) {
    return this.apiKeysService.rotateApiKey(user.id, keyId);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(
    @CurrentUser() user: { id: string },
    @Param('id') keyId: string
  ) {
    return this.apiKeysService.revokeApiKey(user.id, keyId);
  }

  @Delete(':id')
  async deleteApiKey(
    @CurrentUser() user: { id: string },
    @Param('id') keyId: string
  ) {
    return this.apiKeysService.deleteApiKey(user.id, keyId);
  }
}
