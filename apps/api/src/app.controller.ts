import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(): {
    name: string;
    version: string;
    apiPrefix: string;
    endpoints: string[];
  } {
    return {
      name: 'Nexus Cards API',
      version: '0.1.0',
      apiPrefix: '/api',
      endpoints: ['/api/health'],
    };
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
