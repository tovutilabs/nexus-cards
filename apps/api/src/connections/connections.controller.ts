import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  async getUserConnections(@Req() req: any) {
    return this.connectionsService.getUserConnections(req.user.id);
  }

  @Get('mutual')
  async getMutualConnections(@Req() req: any) {
    return this.connectionsService.getMutualConnections(req.user.id);
  }

  @Get('top')
  async getTopConnections(@Req() req: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.connectionsService.getTopConnections(req.user.id, limitNum);
  }

  @Get('network-graph')
  async getNetworkGraph(@Req() req: any) {
    return this.connectionsService.getNetworkGraphData(req.user.id);
  }
}
