import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { ConnectIntegrationDto } from './dto';
import { IntegrationProvider } from '@prisma/client';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async listIntegrations(@Req() req: any) {
    return this.integrationsService.listIntegrations(req.user.userId);
  }

  @Post('connect')
  async connectIntegration(
    @Req() req: any,
    @Body() dto: ConnectIntegrationDto
  ) {
    return this.integrationsService.connectIntegration(req.user.userId, dto);
  }

  @Delete(':provider')
  async disconnectIntegration(
    @Req() req: any,
    @Param('provider') provider: IntegrationProvider
  ) {
    return this.integrationsService.disconnectIntegration(
      req.user.userId,
      provider
    );
  }

  @Post(':provider/sync')
  async syncIntegration(
    @Req() req: any,
    @Param('provider') provider: IntegrationProvider
  ) {
    return this.integrationsService.syncContacts(req.user.userId, provider);
  }
}
